const omoState = {
  round: null,
  score: 0,
  highScore: Number(localStorage.getItem("omoHighScore") || 0),
  usedIds: new Set(),
  locked: false,
  confirmedCount: 0,
};

const omoEls = {
  score: document.getElementById("omo-score"),
  highScore: document.getElementById("omo-high-score"),
  roundTitle: document.getElementById("omo-round-title"),
  banner: document.getElementById("omo-category-banner"),
  grid: document.getElementById("omo-grid"),
  overlay: document.getElementById("omo-game-over"),
  finalAnswer: document.getElementById("omo-final-answer"),
  finalScore: document.getElementById("omo-final-score"),
  finalHighScore: document.getElementById("omo-final-high-score"),
  playAgain: document.getElementById("omo-play-again"),
  startScreen: document.getElementById("omo-start-screen"),
  startGameBtn: document.getElementById("omo-start-game"),
  roundComplete: document.getElementById("omo-round-complete"),
  roundCompleteAnswer: document.getElementById("omo-round-complete-answer"),
  roundCompleteScore: document.getElementById("omo-round-complete-score"),
  nextRoundBtn: document.getElementById("omo-next-round"),
};

function omoInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function omoDrawUnusedRound() {
  if (omoState.usedIds.size >= ODD_MAN_OUT_ROUNDS.length) {
    omoState.usedIds.clear();
  }
  let pick;
  do {
    pick = ODD_MAN_OUT_ROUNDS[Math.floor(Math.random() * ODD_MAN_OUT_ROUNDS.length)];
  } while (omoState.usedIds.has(pick.id));
  omoState.usedIds.add(pick.id);
  return pick;
}

function omoUpdateScoreDisplay() {
  omoEls.score.textContent = omoState.score;
  omoEls.highScore.textContent = omoState.highScore;
}

function omoRenderRound(round) {
  omoState.confirmedCount = 0;
  omoEls.banner.textContent = `Top 10 ${round.categoryLabel} — ${round.year}`;
  omoEls.grid.innerHTML = "";

  round.players.forEach((player, index) => {
    const tile = document.createElement("button");
    tile.className = "omo-tile";
    tile.dataset.index = String(index);

    const avatar = document.createElement("div");
    avatar.className = `card-avatar pos-${player.position}`;
    if (player.photo) {
      const img = document.createElement("img");
      img.src = player.photo;
      img.alt = player.name;
      img.className = "card-avatar-img";
      img.onerror = () => {
        avatar.innerHTML = "";
        avatar.textContent = omoInitials(player.name);
      };
      avatar.appendChild(img);
    } else {
      avatar.textContent = omoInitials(player.name);
    }

    const name = document.createElement("div");
    name.className = "omo-tile-name";
    name.textContent = player.name;

    const meta = document.createElement("div");
    meta.className = "omo-tile-meta";
    meta.textContent = `${player.team} · ${player.position}`;

    const stat = document.createElement("div");
    stat.className = "omo-tile-stat";
    stat.textContent = "";

    tile.appendChild(avatar);
    tile.appendChild(name);
    tile.appendChild(meta);
    tile.appendChild(stat);

    tile.addEventListener("click", () => omoHandleClick(index));
    omoEls.grid.appendChild(tile);
  });
}

function omoStartGame() {
  omoState.score = 0;
  omoState.usedIds.clear();
  omoState.locked = false;
  omoEls.overlay.classList.add("hidden");
  omoEls.roundComplete.classList.add("hidden");

  omoState.round = omoDrawUnusedRound();
  omoRenderRound(omoState.round);
  omoUpdateScoreDisplay();
}

function omoNextRound() {
  omoEls.roundComplete.classList.add("hidden");
  omoState.locked = false;
  omoState.round = omoDrawUnusedRound();
  omoRenderRound(omoState.round);
}

function omoHandleClick(index) {
  if (omoState.locked) return;
  const tile = omoEls.grid.querySelector(`[data-index="${index}"]`);
  if (!tile || tile.classList.contains("confirmed")) return;

  const player = omoState.round.players[index];
  const statEl = tile.querySelector(".omo-tile-stat");

  if (player.belongs) {
    tile.classList.add("confirmed");
    statEl.textContent = `${player.stat.toLocaleString()} ${omoState.round.unit}`;
    tile.classList.remove("flash-correct-tile");
    requestAnimationFrame(() => {
      tile.classList.add("flash-correct-tile");
    });

    omoState.confirmedCount += 1;
    if (omoState.confirmedCount === 9) {
      omoState.locked = true;
      omoState.score += 1;
      if (omoState.score > omoState.highScore) {
        omoState.highScore = omoState.score;
        localStorage.setItem("omoHighScore", String(omoState.highScore));
      }
      omoUpdateScoreDisplay();
      setTimeout(() => {
        omoEls.roundCompleteAnswer.textContent = `You correctly cleared all 9 real ${round_year_label(omoState.round)} leaders.`;
        omoEls.roundCompleteScore.textContent = omoState.score;
        omoEls.roundComplete.classList.remove("hidden");
      }, 700);
    }
  } else {
    omoState.locked = true;
    tile.classList.add("wrong-tile");
    statEl.textContent = `${player.stat.toLocaleString()} ${omoState.round.unit} — not top 10`;

    Array.from(omoEls.grid.children).forEach((t) => {
      const i = Number(t.dataset.index);
      const p = omoState.round.players[i];
      if (p.belongs && !t.classList.contains("confirmed")) {
        t.classList.add("confirmed", "reveal-only");
        t.querySelector(".omo-tile-stat").textContent = `${p.stat.toLocaleString()} ${omoState.round.unit}`;
      }
    });

    setTimeout(() => {
      omoEls.finalAnswer.textContent = `${player.name} ranked outside the top 10 in ${round_year_label(omoState.round)} with ${player.stat.toLocaleString()} ${omoState.round.unit}.`;
      omoEls.finalScore.textContent = omoState.score;
      omoEls.finalHighScore.textContent = omoState.highScore;
      omoEls.overlay.classList.remove("hidden");
    }, 900);
  }
}

function round_year_label(round) {
  return `${round.categoryLabel} — ${round.year}`;
}

omoEls.playAgain.addEventListener("click", omoStartGame);
omoEls.nextRoundBtn.addEventListener("click", omoNextRound);
omoEls.startGameBtn.addEventListener("click", () => {
  omoEls.startScreen.classList.add("hidden");
  omoStartGame();
});
