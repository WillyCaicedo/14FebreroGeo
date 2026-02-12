window.addEventListener("DOMContentLoaded", () => {
  const btnStartGame = document.getElementById("btnStartGame");
  const gameOverlay = document.getElementById("gameOverlay");
  const btnCloseGame = document.getElementById("btnCloseGame");

  const gameStage = document.getElementById("gameStage");
  const player = document.getElementById("player");

  const scoreValue = document.getElementById("scoreValue");
  const finalScore = document.getElementById("finalScore");

  const gameStartPanel = document.getElementById("gameStartPanel");
  const btnStartRun = document.getElementById("btnStartRun");

  const gameOverPanel = document.getElementById("gameOverPanel");
  const btnRestartGame = document.getElementById("btnRestartGame");

  const lifeHearts = Array.from(document.querySelectorAll(".life-heart"));

  if (!btnStartGame || !gameOverlay || !btnCloseGame || !gameStage || !player) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  let overlayOpen = false;
  let running = false;
  let rafId = null;

  let inputUp = false;
  let inputDown = false;

  let pointerActive = false;
  let pointerId = null;
  let pointerLastY = 0;

  let stageW = 0;
  let stageH = 0;

  let playerY = 0;
  const playerSpeed = 460;
  let minY = 0;
  let maxY = 0;

  const asteroids = new Set();
  let heartItem = null;

  let timeAlive = 0;
  let asteroidSpeed = 380;
  let asteroidSpawnMs = 720;
  let asteroidSpawnTimer = null;

  let heartSpawnTimer = null;

  let score = 0;
  let lives = 3;

  let invuln = false;
  let invulnTimer = null;

  function setOverlayVisible(visible) {
    overlayOpen = visible;
    if (visible) {
      gameOverlay.classList.remove("hidden");
      gameOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    } else {
      gameOverlay.classList.add("hidden");
      gameOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  function showStartPanel() {
    if (gameStartPanel) gameStartPanel.classList.remove("hidden");
    if (gameOverPanel) gameOverPanel.classList.add("hidden");
  }

  function hideStartPanel() {
    if (gameStartPanel) gameStartPanel.classList.add("hidden");
  }

  function setScore(v) {
    score = v;
    if (scoreValue) scoreValue.textContent = String(v);
  }

  function setLives(v) {
    lives = v;
    for (let i = 0; i < lifeHearts.length; i++) {
      const alive = i < v;
      lifeHearts[i].classList.toggle("is-dead", !alive);
    }
  }

  function clearEntities() {
    for (const a of asteroids) {
      a.el.remove();
    }
    asteroids.clear();

    if (heartItem) {
      heartItem.el.remove();
      heartItem = null;
    }
  }

  function stopLoops() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;

    if (asteroidSpawnTimer !== null) clearInterval(asteroidSpawnTimer);
    asteroidSpawnTimer = null;

    if (heartSpawnTimer !== null) clearTimeout(heartSpawnTimer);
    heartSpawnTimer = null;
  }

  function clearInvuln() {
    invuln = false;
    player.classList.remove("is-hit");
    if (invulnTimer !== null) clearTimeout(invulnTimer);
    invulnTimer = null;
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function computeBounds() {
    const r = gameStage.getBoundingClientRect();
    stageW = r.width;
    stageH = r.height;

    const shipH = player.getBoundingClientRect().height || 70;
    const margin = 10;

    minY = margin;
    maxY = Math.max(minY, stageH - shipH - margin);
  }

  function applyPlayerPosition() {
    player.style.top = `${playerY}px`;
  }

  function patchStartPanelText() {
    if (!gameStartPanel) return;
    const items = Array.from(gameStartPanel.querySelectorAll("li"));
    if (items.length >= 1) items[0].innerHTML = isTouch ? "<b>Desliza</b> arriba/abajo para moverte" : "<b>↑ / ↓</b> para mover la nave (arriba y abajo)";
    if (items.length >= 2) items[1].innerHTML = "<b>Cuadrados blancos</b> quitan 1 vida";
    if (items.length >= 3) items[2].innerHTML = "<b>Corazones</b> suman 1 punto";
    if (items.length >= 4) items[3].innerHTML = "Tienes <b>3 vidas</b>";
  }

  function resetGameState() {
    stopLoops();
    clearInvuln();
    clearEntities();

    inputUp = false;
    inputDown = false;

    pointerActive = false;
    pointerId = null;

    timeAlive = 0;
    asteroidSpeed = 380;
    asteroidSpawnMs = 720;

    setScore(0);
    setLives(3);

    computeBounds();

    playerY = Math.floor((minY + maxY) / 2);
    applyPlayerPosition();

    gameOverlay.classList.remove("running");
    if (gameOverPanel) gameOverPanel.classList.add("hidden");
  }

  function showGameOver() {
    running = false;
    gameOverlay.classList.remove("running");
    stopLoops();
    removeGameListeners();
    clearInvuln();

    if (finalScore) finalScore.textContent = String(score);
    if (gameOverPanel) gameOverPanel.classList.remove("hidden");
  }

  function scheduleHeartSpawn(delayMs) {
    if (heartSpawnTimer !== null) clearTimeout(heartSpawnTimer);
    heartSpawnTimer = setTimeout(() => spawnHeart(), delayMs);
  }

  function spawnAsteroid() {
    if (!running) return;

    const size = 14;
    const margin = 10;

    const y = Math.floor(Math.random() * (stageH - size - margin * 2 + 1)) + margin;
    const x = stageW + 30;

    const el = document.createElement("div");
    el.className = "asteroid";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    gameStage.appendChild(el);

    asteroids.add({ el, x, y, w: size, h: size });
  }

  function spawnHeart() {
    if (!running) return;
    if (heartItem) return;

    const margin = 16;
    const x = stageW + 40;
    const y = Math.floor(Math.random() * (stageH - margin * 2 + 1)) + margin;

    const el = document.createElement("div");
    el.className = "collect-heart";
    el.textContent = "❤";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    gameStage.appendChild(el);

    heartItem = { el, x, y, w: 18, h: 18 };
  }

  function takeDamage() {
    if (invuln) return;

    setLives(lives - 1);

    invuln = true;
    player.classList.add("is-hit");

    if (lives <= 0) {
      showGameOver();
      return;
    }

    invulnTimer = setTimeout(() => {
      invuln = false;
      player.classList.remove("is-hit");
      invulnTimer = null;
    }, 900);
  }

  function update(dt) {
    timeAlive += dt;

    asteroidSpeed = 380 + Math.min(320, timeAlive * 18);

    const targetSpawn = Math.max(420, 720 - Math.floor(timeAlive * 8));
    if (Math.abs(targetSpawn - asteroidSpawnMs) >= 60) {
      asteroidSpawnMs = targetSpawn;
      if (asteroidSpawnTimer !== null) clearInterval(asteroidSpawnTimer);
      asteroidSpawnTimer = setInterval(spawnAsteroid, asteroidSpawnMs);
    }

    if (!isTouch) {
      if (inputUp) playerY -= playerSpeed * dt;
      if (inputDown) playerY += playerSpeed * dt;
      playerY = clamp(playerY, minY, maxY);
      applyPlayerPosition();
    }

    const stageRect = gameStage.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    const p = {
      x: playerRect.left - stageRect.left,
      y: playerRect.top - stageRect.top,
      w: playerRect.width,
      h: playerRect.height
    };

    for (const a of Array.from(asteroids)) {
      a.x -= asteroidSpeed * dt;
      a.el.style.left = `${a.x}px`;

      if (a.x < -60) {
        a.el.remove();
        asteroids.delete(a);
        continue;
      }

      if (!invuln && rectsOverlap(p, a)) {
        takeDamage();
        a.el.remove();
        asteroids.delete(a);
      }
    }

    if (heartItem) {
      heartItem.x -= (asteroidSpeed * 0.92) * dt;
      heartItem.el.style.left = `${heartItem.x}px`;

      const hb = {
        x: heartItem.x - heartItem.w / 2,
        y: heartItem.y - heartItem.h / 2,
        w: heartItem.w,
        h: heartItem.h
      };

      if (rectsOverlap(p, hb)) {
        setScore(score + 1);
        heartItem.el.remove();
        heartItem = null;
        scheduleHeartSpawn(900);
      } else if (heartItem && heartItem.x < -60) {
        heartItem.el.remove();
        heartItem = null;
        scheduleHeartSpawn(700);
      }
    }
  }

  function startRun() {
    resetGameState();
    hideStartPanel();

    running = true;
    gameOverlay.classList.add("running");

    addGameListeners();

    asteroidSpawnTimer = setInterval(spawnAsteroid, asteroidSpawnMs);
    scheduleHeartSpawn(900);

    let lastTs = performance.now();
    const loop = (ts) => {
      if (!running) return;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      update(dt);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
  }

  function openOverlay() {
    patchStartPanelText();
    setOverlayVisible(true);
    resetGameState();
    showStartPanel();
  }

  function closeOverlay() {
    running = false;
    gameOverlay.classList.remove("running");
    stopLoops();
    removeGameListeners();
    clearInvuln();
    clearEntities();
    setOverlayVisible(false);
  }

  function onKeyDown(e) {
    if (!overlayOpen) return;

    if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();

    if (e.key === "Escape") {
      closeOverlay();
      return;
    }

    if (!running && gameOverPanel && !gameOverPanel.classList.contains("hidden") && (e.key === "r" || e.key === "R")) {
      startRun();
      return;
    }

    if (e.key === "ArrowUp") inputUp = true;
    if (e.key === "ArrowDown") inputDown = true;
  }

  function onKeyUp(e) {
    if (e.key === "ArrowUp") inputUp = false;
    if (e.key === "ArrowDown") inputDown = false;
  }

  function onPointerDown(e) {
    if (!running) return;
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

    pointerActive = true;
    pointerId = e.pointerId;
    pointerLastY = e.clientY;
    try { gameStage.setPointerCapture(pointerId); } catch {}
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!running) return;
    if (!pointerActive) return;
    if (pointerId !== e.pointerId) return;

    const dy = e.clientY - pointerLastY;
    pointerLastY = e.clientY;

    playerY = clamp(playerY + dy, minY, maxY);
    applyPlayerPosition();

    e.preventDefault();
  }

  function onPointerUp(e) {
    if (!running) return;
    if (!pointerActive) return;
    if (pointerId !== e.pointerId) return;

    pointerActive = false;
    pointerId = null;
    e.preventDefault();
  }

  function onResize() {
    if (!overlayOpen) return;
    computeBounds();
    playerY = clamp(playerY, minY, maxY);
    applyPlayerPosition();
  }

  function addGameListeners() {
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: true });

    gameStage.addEventListener("pointerdown", onPointerDown, { passive: false });
    gameStage.addEventListener("pointermove", onPointerMove, { passive: false });
    gameStage.addEventListener("pointerup", onPointerUp, { passive: false });
    gameStage.addEventListener("pointercancel", onPointerUp, { passive: false });

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
  }

  function removeGameListeners() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);

    gameStage.removeEventListener("pointerdown", onPointerDown);
    gameStage.removeEventListener("pointermove", onPointerMove);
    gameStage.removeEventListener("pointerup", onPointerUp);
    gameStage.removeEventListener("pointercancel", onPointerUp);

    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
  }

  btnStartGame.addEventListener("click", openOverlay);
  btnCloseGame.addEventListener("click", closeOverlay);

  gameOverlay.addEventListener("click", (e) => {
    if (e.target === gameOverlay) closeOverlay();
  });

  if (btnStartRun) {
    btnStartRun.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startRun();
    });
  }

  if (btnRestartGame) btnRestartGame.addEventListener("click", startRun);

  setOverlayVisible(false);
});
