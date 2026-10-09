import { FlappyGame } from "./game";
import { CHARACTERS } from "./characters";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element #renderCanvas not found");
    return;
  }

  const game = new FlappyGame(canvas);

  // DOM Elements
  const startOverlay = document.getElementById("start-overlay")!;
  const gameoverOverlay = document.getElementById("gameover-overlay")!;
  const liveScoreContainer = document.getElementById("live-score-container")!;
  const liveScoreValue = document.getElementById("live-score-value")!;
  const startBestScore = document.getElementById("start-best-score")!;
  const summaryScore = document.getElementById("summary-score")!;
  const summaryBest = document.getElementById("summary-best")!;
  const medalContainer = document.getElementById("medal-container")!;
  const medalIcon = document.getElementById("medal-icon")!;
  const medalLabel = document.getElementById("medal-label")!;

  const btnStart = document.getElementById("btn-start-game")!;
  const btnRestart = document.getElementById("btn-restart")!;
  const btnChangeChar = document.getElementById("btn-change-character")!;
  const btnSoundToggle = document.getElementById("btn-sound-toggle")!;
  const soundIcon = document.getElementById("sound-icon")!;
  const btnThemeToggle = document.getElementById("btn-theme-toggle")!;
  const themeIcon = document.getElementById("theme-icon")!;
  const btnInfo = document.getElementById("btn-info")!;
  const btnCloseInfo = document.getElementById("btn-close-info")!;
  const infoModal = document.getElementById("info-modal")!;
  const characterGrid = document.getElementById("character-grid")!;

  // Update initial best score
  startBestScore.textContent = game.getBestScore().toString();

  // Populate Character Grid
  let selectedCharId = CHARACTERS[0].id;

  function renderCharacterGrid() {
    characterGrid.innerHTML = "";
    CHARACTERS.forEach((char) => {
      const card = document.createElement("div");
      card.className = `character-card ${char.id === selectedCharId ? "selected" : ""}`;
      card.title = `${char.name} — ${char.description}`;

      const previewBox = document.createElement("div");
      previewBox.className = "char-preview-container";

      const img = document.createElement("img");
      img.src = char.previewUrl;
      img.alt = char.name;
      img.className = "char-preview-img";
      previewBox.appendChild(img);

      const nameLabel = document.createElement("span");
      nameLabel.className = "char-name";
      nameLabel.textContent = char.name;

      card.appendChild(previewBox);
      card.appendChild(nameLabel);

      card.addEventListener("click", () => {
        selectedCharId = char.id;
        game.setCharacter(char);
        game.soundCtrl.playSound("click");
        renderCharacterGrid();
      });

      characterGrid.appendChild(card);
    });
  }

  renderCharacterGrid();

  // Score Callback
  game.onScoreChanged = (score) => {
    liveScoreValue.textContent = score.toString();
  };

  // Game Over Callback
  game.onGameOver = (score, bestScore) => {
    summaryScore.textContent = score.toString();
    summaryBest.textContent = bestScore.toString();
    startBestScore.textContent = bestScore.toString();

    // Medal evaluation
    medalContainer.classList.remove("hidden");
    if (score >= 50) {
      medalIcon.textContent = "🏆";
      medalLabel.textContent = "Gold-Trophäe!";
    } else if (score >= 25) {
      medalIcon.textContent = "🥈";
      medalLabel.textContent = "Silber-Medaille!";
    } else if (score >= 10) {
      medalIcon.textContent = "🥉";
      medalLabel.textContent = "Bronze-Medaille!";
    } else {
      medalIcon.textContent = "🐣";
      medalLabel.textContent = "Küken-Abzeichen";
    }
  };

  // State Change Callback
  game.onStateChanged = (state) => {
    if (state === "READY") {
      startOverlay.classList.remove("hidden");
      startOverlay.classList.add("active");
      gameoverOverlay.classList.add("hidden");
      liveScoreContainer.classList.add("hidden");
    } else if (state === "PLAYING") {
      startOverlay.classList.add("hidden");
      startOverlay.classList.remove("active");
      gameoverOverlay.classList.add("hidden");
      liveScoreContainer.classList.remove("hidden");
    } else if (state === "GAMEOVER") {
      liveScoreContainer.classList.add("hidden");
      // Short delay before showing game over popup for impact
      setTimeout(() => {
        gameoverOverlay.classList.remove("hidden");
        gameoverOverlay.classList.add("active");
      }, 350);
    }
  };

  // User input handling (Spacebar, Up, Click, Tap)
  const handleJumpAction = (e?: Event) => {
    if (e) {
      if (e.target instanceof HTMLElement && e.target.closest("button, .character-card, .overlay a")) {
        return; // Don't trigger flap when clicking buttons
      }
      e.preventDefault();
    }

    if (game.getState() === "GAMEOVER") {
      // Ignore rapid clicks during game over until user hits restart
      return;
    }

    game.flap();
  };

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      handleJumpAction();
    }
  });

  canvas.addEventListener("pointerdown", (e: PointerEvent) => {
    handleJumpAction(e);
  });

  // Buttons
  btnStart.addEventListener("click", () => {
    game.soundCtrl.playSound("click");
    game.startGame();
  });

  btnRestart.addEventListener("click", () => {
    game.soundCtrl.playSound("click");
    game.resetToReady();
    game.startGame();
  });

  btnChangeChar.addEventListener("click", () => {
    game.soundCtrl.playSound("click");
    game.resetToReady();
  });

  btnSoundToggle.addEventListener("click", () => {
    const isEnabled = !game.soundCtrl.isEnabled();
    game.soundCtrl.setEnabled(isEnabled);
    soundIcon.textContent = isEnabled ? "🔊" : "🔇";
    btnSoundToggle.title = isEnabled ? "Ton an" : "Ton stummgeschaltet";
  });

  btnThemeToggle.addEventListener("click", () => {
    game.soundCtrl.playSound("click");
    const is3D = game.toggle3DPipes();
    themeIcon.textContent = is3D ? "🪐 3D Pipes" : "🌿 2D Sprites";
    btnThemeToggle.title = is3D ? "Wechsel zu 2D Textur-Röhren" : "Wechsel zu 3D Mesh-Röhren";
  });

  btnInfo.addEventListener("click", () => {
    infoModal.classList.remove("hidden");
  });

  btnCloseInfo.addEventListener("click", () => {
    infoModal.classList.add("hidden");
  });

  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) {
      infoModal.classList.add("hidden");
    }
  });
});
