const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  // Your original game resolution (match your sprite assets)
  const GAME_WIDTH = ORIGINAL_WIDTH;
  const GAME_HEIGHT = ORIGINAL_HEIGHT;

  // Fit-to-screen scaling while preserving aspect ratio
  const scale = Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT);

  // Final CSS size (the "box" size on screen)
  const cssWidth = Math.floor(GAME_WIDTH * scale);
  const cssHeight = Math.floor(GAME_HEIGHT * scale);

  // Internal resolution (fixed game space, no stretching)
  canvas.width = GAME_WIDTH * dpr;
  canvas.height = GAME_HEIGHT * dpr;

  // CSS size (what the user sees)
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  // Center canvas in window
  canvas.style.position = "absolute";
  canvas.style.left = Math.floor((windowWidth - cssWidth) / 2) + "px";
  canvas.style.top = Math.floor((windowHeight - cssHeight) / 2) + "px";

  // Scale drawing by DPR (keeps things sharp)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // Make sure it stays pixelated
  ctx.imageSmoothingEnabled = false;
  canvas.style.imageRendering = "pixelated";
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();

function playSound(path) {
  try {
    const sfx = new Audio(path);
    sfx.play();
  } catch (e) {}
}

let highestScore = Number(localStorage.getItem("highestScore") || 0);
let gameRunning = false;
let gameOver = false;
let gameIdle = false;
let inMenu = true;
let frameCount = 0;
let score = 0;
let deathFlashTime = 0;
const pipes = [];

let pipeTimer = 0;
let skySpeed = 0.5;
const pipeInterval = 85;
const baseHeight = 105;
let baseSpeed = 2;
let baseX = 0;
let skyX = 0;
let animationFrameId = null;

function startGame() {
  inMenu = false;
  gameIdle = true;
  gameRunning = false;
  gameOver = false;

  playSound("sounds/sfx_swooshing.ogg");

  bird.velocity = 0;
  bird.y = ORIGINAL_HEIGHT / 2;
  bird.isDead = false;
  pipes.length = 0;
  pipeTimer = 0;
  frameCount = 0;
  score = 0;
  baseX = 0;
  skyX = 0;

  if (menu) menu.style.display = "none";
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.classList.remove("show");
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

canvas.addEventListener("pointerdown", flap);
document.addEventListener("keydown", e => {
  if ((e.code === "Space" || e.code === "ArrowUp")) {
    flap();
  } else if (e.code === "Enter" && gameOver) {
    startGame();
  }
});

function generatePipes() {
  const minGap = 95;
  const maxGap = 100;
  const topHeight = Math.random() * (ORIGINAL_HEIGHT - maxGap - baseHeight - 50) + 25;
  pipes.push({ x: ORIGINAL_WIDTH, topHeight, bottomY: topHeight + minGap, scored: false });
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.save();
    ctx.translate(pipe.x + 50, pipe.topHeight);
    ctx.scale(1, -1);
    ctx.drawImage(pipeTopImg, -50, 0, 50, 320);
    ctx.restore();
    ctx.drawImage(pipeBottomImg, pipe.x, pipe.bottomY, 50, 320);
  });
}

function draw() {
  ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

  ctx.drawImage(skyImg, skyX, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
  ctx.drawImage(skyImg, skyX + ORIGINAL_WIDTH, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

  if (gameRunning || gameOver) {
    drawPipes();
  }
  
  if (showPipeHitboxes) {
  ctx.save();
  ctx.strokeStyle = "red";
  pipes.forEach(pipe => {
    ctx.strokeRect(pipe.x, 0, 50, pipe.topHeight); // top hitbox
    ctx.strokeRect(pipe.x, pipe.bottomY, 50, ORIGINAL_HEIGHT - pipe.bottomY - baseHeight); // bottom
  });
  ctx.restore();
}

  ctx.drawImage(baseImg, baseX, ORIGINAL_HEIGHT - baseHeight, ORIGINAL_WIDTH, baseHeight);
  ctx.drawImage(baseImg, baseX + ORIGINAL_WIDTH, ORIGINAL_HEIGHT - baseHeight, ORIGINAL_WIDTH, baseHeight);

  drawBird();

  if (gameRunning || gameOver) {
    drawNumber(ORIGINAL_WIDTH / 2, 10, score, 1);
  }

  if (gameIdle && getReadyImg.complete) {
    const readyWidth = ORIGINAL_WIDTH * 0.8;
    const readyHeight = readyWidth * (getReadyImg.height / getReadyImg.width);
    const readyX = (ORIGINAL_WIDTH - readyWidth) / 2;
    let readyY = bird.y - readyHeight - 20;
    if (readyY < 50) readyY = 50;
    ctx.drawImage(getReadyImg, readyX, readyY, readyWidth, readyHeight);
  }

  if (gameOver && gameOverImg.complete) {
    const overWidth = ORIGINAL_WIDTH * 0.6;
    const aspectRatio = gameOverImg.width / gameOverImg.height;
    const overHeight = overWidth / aspectRatio;
    const overX = (ORIGINAL_WIDTH - overWidth) / 2;
    const overY = 100;
    ctx.drawImage(gameOverImg, overX, overY, overWidth, overHeight);
    
    if (deathFlashTime > 0) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
}
  }
}

function drawNumber(x, y, num, scale = 1) {
  const digits = num.toString().split('');
  const totalWidth = digits.length * 24 * scale;
  const startX = x - totalWidth / 2;
  digits.forEach((digit, index) => {
    ctx.drawImage(numberImgs[parseInt(digit)], startX + index * 24 * scale, y, 22 * scale, 32 * scale);
  });
}

function renderNumber(container, num, size = "32px") {
  if (!container) return;
  container.innerHTML = "";
  const digits = num.toString().split("");
  digits.forEach(d => {
    const img = new Image();
    img.src = `sprites/${d}.png`;
    img.style.imageRendering = "pixelated";
    img.style.height = size;
    img.style.width = "auto";
    container.appendChild(img);
  });
}

function endGame() {
  if (!gameOver) {
    gameOver = true;
    gameRunning = false;
    deathFlashTime = 12;
    playSound("sounds/sfx_hit.ogg");

    setTimeout(() => {
      playSound("sounds/sfx_die.ogg");
      if (bird.velocity < 0) bird.velocity = 0;
      bird.isDead = true;
    }, 200);

    renderNumber(finalScoreNumbers, score, "32px");
    renderNumber(bestScoreNumbers, Math.max(score, highestScore), "32px");

    if (gameOverScreen) gameOverScreen.style.display = "block";
    setTimeout(() => {
      if (gameOverScreen) gameOverScreen.classList.add("show");
    }, 600);
  }
}

function gameLoop() {
  update();
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
}

if (startBtn) startBtn.addEventListener("click", startGame);
if (restartBtn) restartBtn.addEventListener("click", startGame);

if (!animationFrameId) animationFrameId = requestAnimationFrame(gameLoop);