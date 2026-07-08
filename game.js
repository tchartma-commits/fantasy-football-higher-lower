const state = {
  left: null,
  right: null,
  score: 0,
  highScore: Number(localStorage.getItem("ffHighScore") || 0),
  usedIds: new Set(),
  locked: false,
};

const els = {
  score: document.getElementById("score"),
  highScore: document.getElementById("high-score"),
  leftCard: document.getElementById("left-card"),
  rightCard: document.getElementById("right-card"),
  leftAvatar: document.getElementById("left-avatar"),
  rightAvatar: document.getElementById("right-avatar"),
  leftName: document.getElementById("left-name"),
  rightName: document.getElementById("right-name"),
  leftMeta: document.getElementById("left-meta"),
  rightMeta: document.getElementById("right-meta"),
  leftPoints: document.getElementById("left-points"),
  rightPoints: document.getElementById("right-points"),
  rightPointsLabel: document.getElementById("right-points-label"),
  btnHigher: document.getElementById("btn-higher"),
  btnLower: document.getElementById("btn-lower"),
  overlay: document.getElementById("game-over"),
  finalAnswer: document.getElementById("final-answer"),
  finalScore: document.getElementById("final-score"),
  finalHighScore: document.getElementById("final-high-score"),
  playAgain: document.getElementById("play-again"),
  startScreen: document.getElementById("start-screen"),
  startGameBtn: document.getElementById("start-game"),
};

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function drawUnusedCard() {
  if (state.usedIds.size >= PLAYER_SEASONS.length) {
    state.usedIds.clear();
  }
  let pick;
  do {
    pick = PLAYER_SEASONS[Math.floor(Math.random() * PLAYER_SEASONS.length)];
  } while (state.usedIds.has(pick.id));
  state.usedIds.add(pick.id);
  return pick;
}

function fillCard({ avatarEl, nameEl, metaEl, card }, data) {
  avatarEl.textContent = initials(data.player);
  avatarEl.className = `card-avatar pos-${data.position}`;
  nameEl.textContent = data.player;
  metaEl.textContent = `${data.team} · ${data.position} · ${data.year}`;
  card.dataset.id = data.id;
}

function startGame() {
  state.score = 0;
  state.usedIds.clear();
  state.locked = false;
  els.overlay.classList.add("hidden");
  els.btnHigher.disabled = false;
  els.btnLower.disabled = false;

  state.left = drawUnusedCard();
  state.right = drawUnusedCard();

  fillCard(
    { avatarEl: els.leftAvatar, nameEl: els.leftName, metaEl: els.leftMeta, card: els.leftCard },
    state.left
  );
  els.leftPoints.textContent = state.left.points;
  els.leftCard.classList.remove("flash-correct", "flash-wrong", "pop-in");
  els.rightCard.classList.remove("flash-correct", "flash-wrong", "slide-winner", "pop-in");
  els.rightCard.style.transform = "";

  showRightHidden();
  updateScoreDisplay();
}

function showRightHidden() {
  fillCard(
    { avatarEl: els.rightAvatar, nameEl: els.rightName, metaEl: els.rightMeta, card: els.rightCard },
    state.right
  );
  els.rightPoints.textContent = "?";
  els.rightPointsLabel.textContent = "Higher or Lower?";
  els.rightCard.classList.add("hidden-points");
}

function playAnim(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function updateScoreDisplay() {
  els.score.textContent = state.score;
  els.highScore.textContent = state.highScore;
}

function handleGuess(direction) {
  if (state.locked) return;
  state.locked = true;
  els.btnHigher.disabled = true;
  els.btnLower.disabled = true;

  els.rightPoints.textContent = state.right.points;
  els.rightPointsLabel.textContent = "Fantasy Points (PPR)";
  els.rightCard.classList.remove("hidden-points");
  playAnim(els.rightPoints, "reveal-points");

  const correct =
    state.right.points === state.left.points ||
    (direction === "higher" && state.right.points > state.left.points) ||
    (direction === "lower" && state.right.points < state.left.points);

  if (correct) {
    playAnim(els.rightCard, "flash-correct");
    state.score += 1;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem("ffHighScore", String(state.highScore));
    }
    updateScoreDisplay();
    playAnim(els.score, "bump");

    setTimeout(() => {
      const leftRect = els.leftCard.getBoundingClientRect();
      const rightRect = els.rightCard.getBoundingClientRect();
      const dx = leftRect.left - rightRect.left;
      const dy = leftRect.top - rightRect.top;

      els.rightCard.classList.add("slide-winner");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          els.rightCard.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      });

      setTimeout(() => {
        state.left = state.right;
        state.right = drawUnusedCard();

        fillCard(
          { avatarEl: els.leftAvatar, nameEl: els.leftName, metaEl: els.leftMeta, card: els.leftCard },
          state.left
        );
        els.leftPoints.textContent = state.left.points;

        els.rightCard.classList.remove("slide-winner", "flash-correct");
        els.rightCard.style.transform = "";

        showRightHidden();
        playAnim(els.rightCard, "pop-in");
        state.locked = false;
        els.btnHigher.disabled = false;
        els.btnLower.disabled = false;
      }, 650);
    }, 300);
  } else {
    playAnim(els.rightCard, "flash-wrong");
    setTimeout(() => {
      els.finalAnswer.textContent = `${state.right.player} (${state.right.year}) had ${state.right.points} points vs. ${state.left.player}'s ${state.left.points}.`;
      els.finalScore.textContent = state.score;
      els.finalHighScore.textContent = state.highScore;
      els.overlay.classList.remove("hidden");
    }, 700);
  }
}

els.btnHigher.addEventListener("click", () => handleGuess("higher"));
els.btnLower.addEventListener("click", () => handleGuess("lower"));
els.playAgain.addEventListener("click", startGame);
els.startGameBtn.addEventListener("click", () => {
  els.startScreen.classList.add("hidden");
  startGame();
});
