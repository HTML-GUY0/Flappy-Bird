const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");

const finalScoreNumbers = document.getElementById("finalScoreNumbers");
const bestScoreNumbers = document.getElementById("bestScoreNumbers");

canvas.width = 320;
canvas.height = 480;

// Images
const birdImg = new Image();
birdImg.src = "sprites/flappybird-sprite.png";

const pipeTopImg = new Image();
pipeTopImg.src = "sprites/pipe.png";

const pipeBottomImg = new Image();
pipeBottomImg.src = "sprites/pipe.png";

const baseImg = new Image();
baseImg.src = "sprites/base.png";

// Numbers for score
const numberImgs = [];
for (let i = 0; i <= 9; i++) {
    const img = new Image();
    img.src = `sprites/${i}.png`;
    numberImgs.push(img);
}

let highestScore = localStorage.getItem("highestScore") || 0;

let gameRunning = false;
let gameOver = false;
let frameCount = 0;
let score = 0;
const pipes = [];

const bird = { x: 50, y: canvas.height / 2, width: 34, height: 24, gravity: 0.25, lift: -5, velocity: 0 };
let pipeTimer = 0;
const pipeInterval = 120; 
const baseHeight = 50;
let baseX = 0;

function startGame() {
    gameRunning = true;
    gameOver = false;
    frameCount = 0;
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    pipeTimer = 0;
    baseX = 0;

    menu.style.display = "none";
    gameOverScreen.style.display = "none";
    gameOverScreen.classList.remove("show");

    gameLoop();
}

function flap() {
    if (gameRunning && !gameOver) bird.velocity = bird.lift;
}

function generatePipes() {
    const minGap = 120;
    const maxGap = 150;
    const topHeight = Math.random() * (canvas.height - maxGap - baseHeight - 50) + 25;
    pipes.push({ x: canvas.width, topHeight, bottomY: topHeight + minGap, scored: false });
}

function update() {
    if (!gameRunning || gameOver) return;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

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
            if (score > highestScore) {
                highestScore = score;
                localStorage.setItem("highestScore", highestScore);
            }
        }
        if (pipe.x + 50 < 0) pipes.splice(index, 1);
    });

    if (bird.y + bird.height >= canvas.height - baseHeight) endGame();

    pipes.forEach(pipe => {
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + 50) {
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) endGame();
        }
    });

    baseX -= 2;
    if (baseX <= -canvas.width) baseX = 0;

    frameCount++;
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

function drawNumber(x, y, num, scale = 1) {
    const digits = num.toString().split('');
    digits.forEach((digit, index) => {
        ctx.drawImage(numberImgs[parseInt(digit)], x + index * 22 * scale, y, 20 * scale, 30 * scale);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const birdFrameCount = 3;
    const animationSpeed = 5;
    const birdFrame = Math.floor(frameCount / animationSpeed) % birdFrameCount;
    ctx.drawImage(
        birdImg,
        birdFrame * bird.width, 0,
        bird.width, bird.height,
        bird.x, bird.y,
        bird.width, bird.height
    );

    drawPipes();

    const scoreX = canvas.width / 2 - (score.toString().length * 11);
    drawNumber(scoreX, 10, score, 1);

    // Draw base
    ctx.drawImage(baseImg, baseX, canvas.height - baseHeight, canvas.width, baseHeight);
    ctx.drawImage(baseImg, baseX + canvas.width, canvas.height - baseHeight, canvas.width, baseHeight);
}

function renderNumber(container, num) {
    container.innerHTML = "";
    const digits = num.toString().split("");
    digits.forEach(d => {
        const img = new Image();
        img.src = `sprites/${d}.png`;
        container.appendChild(img);
    });
}

function endGame() {
    gameOver = true;
    gameRunning = false;

    renderNumber(finalScoreNumbers, score);
    renderNumber(bestScoreNumbers, Math.max(score, highestScore));

    gameOverScreen.style.display = "block";
    setTimeout(() => gameOverScreen.classList.add("show"), 50);
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

// Event listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
document.addEventListener("keydown", e => {
    if (e.code === "Space") flap();
    else if (e.code === "Enter" && gameOver) startGame();
});
canvas.addEventListener("click", flap);