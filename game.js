const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Original game resolution
const ORIGINAL_WIDTH = 320;
const ORIGINAL_HEIGHT = 480;

// Fullscreen + centered + pixel-perfect scaling
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Scale to fill vertically (top & bottom touch)
    const scaleX = windowWidth / ORIGINAL_WIDTH;
    const scaleY = windowHeight / ORIGINAL_HEIGHT;
    const scale = Math.max(scaleX, scaleY);

    // CSS size for canvas
    canvas.style.width = ORIGINAL_WIDTH * scale + "px";
    canvas.style.height = ORIGINAL_HEIGHT * scale + "px";

    // Center horizontally, top fixed
    canvas.style.position = "fixed";
    canvas.style.left = (windowWidth - ORIGINAL_WIDTH * scale) / 2 + "px";
    canvas.style.top = "0px";

    // Internal resolution
    canvas.width = ORIGINAL_WIDTH * dpr;
    canvas.height = ORIGINAL_HEIGHT * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// DOM Elements
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreNumbers = document.getElementById("finalScoreNumbers");
const bestScoreNumbers = document.getElementById("bestScoreNumbers");

// Images
const birdImg = new Image();
birdImg.src = "sprites/flappybird-sprite.png";

const pipeTopImg = new Image();
pipeTopImg.src = "sprites/pipe.png";

const pipeBottomImg = new Image();
pipeBottomImg.src = "sprites/pipe.png";

const baseImg = new Image();
baseImg.src = "sprites/base.png";

const gameOverImg = new Image();
gameOverImg.src = "sprites/gameover.png";

const getReadyImg = new Image();
getReadyImg.src = "sprites/get-ready.png";

// Number images
const numberImgs = [];
for (let i = 0; i <= 9; i++) {
    const img = new Image();
    img.src = `sprites/${i}.png`;
    numberImgs.push(img);
}

// Sounds
function playSound(path) {
    const sfx = new Audio(path);
    sfx.play();
}

// Game state
let highestScore = localStorage.getItem("highestScore") || 0;
let gameRunning = false;
let gameOver = false;
let gameIdle = false;
let frameCount = 0;
let score = 0;
const pipes = [];

const bird = {
    x: 50,
    y: ORIGINAL_HEIGHT / 2,
    width: 34,
    height: 24,
    gravity: 0.25,
    lift: -5,
    velocity: 0
};

let pipeTimer = 0;
const pipeInterval = 120;
const baseHeight = 50;
let baseX = 0;
let animationFrameId = null;

// Start game
function startGame() {
    playSound("sounds/sfx_swooshing.ogg");
    gameRunning = false;
    gameOver = false;
    gameIdle = true;
    bird.velocity = 0;
    bird.y = ORIGINAL_HEIGHT / 2;
    pipes.length = 0;
    pipeTimer = 0;
    frameCount = 0;
    score = 0;
    baseX = 0;

    menu.style.display = "none";
    gameOverScreen.style.display = "none";
    gameOverScreen.classList.remove("show");

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Flap bird
function flap() {
    if (gameIdle) {
        gameIdle = false;
        gameRunning = true;
    }
    if (!gameOver) {
        bird.velocity = bird.lift;
        playSound("sounds/sfx_wing.ogg");
    }
}

// --- FIXED INPUT: pointer & key tracking ---
const activePointers = new Set();
const keysPressed = new Set();

canvas.addEventListener("pointerdown", e => {
    if (!activePointers.has(e.pointerId)) {
        flap();
        activePointers.add(e.pointerId);
    }
});

canvas.addEventListener("pointerup", e => {
    activePointers.delete(e.pointerId);
});

canvas.addEventListener("pointercancel", e => {
    activePointers.delete(e.pointerId);
});

// Keyboard
document.addEventListener("keydown", e => {
    if (e.code === "Space" && !keysPressed.has(e.code)) {
        flap();
        keysPressed.add(e.code);
    } else if (e.code === "Enter" && gameOver) startGame();
});

document.addEventListener("keyup", e => {
    if (keysPressed.has(e.code)) keysPressed.delete(e.code);
});

// Generate pipes
function generatePipes() {
    const minGap = 100;
    const maxGap = 110;
    const topHeight = Math.random() * (ORIGINAL_HEIGHT - maxGap - baseHeight - 50) + 25;
    pipes.push({ x: ORIGINAL_WIDTH, topHeight, bottomY: topHeight + minGap, scored: false });
}

// Update state
function update() {
    if (gameIdle) {
        bird.y = ORIGINAL_HEIGHT / 2 + Math.sin(frameCount * 0.05) * 8;
        baseX -= 2;
        if (baseX <= -ORIGINAL_WIDTH) baseX = 0;
        frameCount++;
        return;
    }

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (!gameOver) {
        pipeTimer++;
        if (pipeTimer >= pipeInterval) {
            generatePipes();
            pipeTimer = 0;
        }

        pipes.forEach((pipe, index) => {
            pipe.x -= 2;

            if (!pipe.scored && bird.x > pipe.x + 50) {
                score++;
                pipe.scored = true;
                playSound("sounds/sfx_point.ogg");
                if (score > highestScore) {
                    highestScore = score;
                    localStorage.setItem("highestScore", highestScore);
                }
            }

            if (pipe.x + 50 < 0) pipes.splice(index, 1);
        });

        pipes.forEach(pipe => {
            if (bird.x + bird.width > pipe.x && bird.x < pipe.x + 50) {
                if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) endGame();
            }
        });

        if (bird.y + bird.height >= ORIGINAL_HEIGHT - baseHeight) endGame();
    }

    baseX -= 2;
    if (baseX <= -ORIGINAL_WIDTH) baseX = 0;

    frameCount++;
}

// Draw pipes
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

// Draw bird
function drawBird() {
    let angle = 0;
    if (gameIdle) angle = Math.sin(frameCount * 0.05) * 0.2;
    else angle = Math.min(Math.max(bird.velocity / 10, -0.5), gameOver ? 1 : 0.5);

    const birdFrameCount = 3;
    const animationSpeed = 5;
    const birdFrame = Math.floor(frameCount / animationSpeed) % birdFrameCount;

    const x = Math.round(bird.x + bird.width / 2);
    const y = Math.round(bird.y + bird.height / 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(
        birdImg,
        birdFrame * bird.width, 0,
        bird.width, bird.height,
        -bird.width / 2, -bird.height / 2,
        bird.width, bird.height
    );
    ctx.restore();
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    drawBird();

    if (gameRunning || gameOver) {
        drawPipes();
        drawNumber(ORIGINAL_WIDTH / 2, 10, score, 1);
    }

    ctx.drawImage(baseImg, baseX, ORIGINAL_HEIGHT - baseHeight, ORIGINAL_WIDTH, baseHeight);
    ctx.drawImage(baseImg, baseX + ORIGINAL_WIDTH, ORIGINAL_HEIGHT - baseHeight, ORIGINAL_WIDTH, baseHeight);

    if (gameIdle && getReadyImg.complete) {
        const readyWidth = ORIGINAL_WIDTH * 0.8;
        const readyHeight = readyWidth * (getReadyImg.height / getReadyImg.width);
        const readyX = (ORIGINAL_WIDTH - readyWidth) / 2;
        let readyY = bird.y - readyHeight - 20;
        if (readyY < 50) readyY = 50;
        ctx.drawImage(getReadyImg, readyX, readyY, readyWidth, readyHeight
);
    }

    if (gameOver && gameOverImg.complete) {
        const overWidth = ORIGINAL_WIDTH * 0.6;
        const aspectRatio = gameOverImg.width / gameOverImg.height;
        const overHeight = overWidth / aspectRatio;
        const overX = (ORIGINAL_WIDTH - overWidth) / 2;
        const overY = 100;
        ctx.drawImage(gameOverImg, overX, overY, overWidth, overHeight);
    }
}

// Draw number in canvas (main score)
function drawNumber(x, y, num, scale = 1) {
    const digits = num.toString().split('');
    const totalWidth = digits.length * 24 * scale;
    const startX = x - totalWidth / 2;
    digits.forEach((digit, index) => {
        ctx.drawImage(numberImgs[parseInt(digit)], startX + index * 24 * scale, y, 22 * scale, 32 * scale);
    });
}

// Render DOM numbers
function renderNumber(container, num, size = "32px") {
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

// End game
function endGame() {
    if (!gameOver) {
        gameOver = true;
        gameRunning = false;

        playSound("sounds/sfx_hit.ogg");
        setTimeout(() => playSound("sounds/sfx_die.ogg"), 200);

        renderNumber(finalScoreNumbers, score, "32px");
        renderNumber(bestScoreNumbers, Math.max(score, highestScore), "32px");

        gameOverScreen.style.display = "block";
        setTimeout(() => gameOverScreen.classList.add("show"), 50);
    }
}

// Main loop
function gameLoop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Event listeners for start/restart
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);