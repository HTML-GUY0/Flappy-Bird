const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 320;
canvas.height = 480;

const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartBtn = document.getElementById("restartBtn");
const finalScore = document.getElementById("finalScore");

// Load Images
const birdImg = new Image();
birdImg.src = "flappybird.png";

const pipeTopImg = new Image();
pipeTopImg.src = "pipe.png";

const pipeBottomImg = new Image();
pipeBottomImg.src = "pipe.png";

// Load Highest Score from Local Storage
let highestScore = localStorage.getItem("highestScore") || 0;
let gameRunning = false;
let gameOver = false;
let frameCount = 0;
let score = 0;
const pipes = [];

const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 34,
    height: 24,
    gravity: 0.25,
    lift: -5,
    velocity: 0
};

// ** Start the Game **
function startGame() {
    gameRunning = true;
    gameOver = false;
    frameCount = 0;
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;

    menu.style.display = "none";
    gameOverScreen.style.display = "none";
    gameOverScreen.classList.remove("show");

    gameLoop();
}

// ** Bird Jump Function **
function flap() {
    if (gameRunning && !gameOver) bird.velocity = bird.lift;
}

// ** Generate Pipes **
function generatePipes() {
    let topHeight = Math.random() * (canvas.height - 180) + 30;
    pipes.push({ x: canvas.width, topHeight, bottomY: topHeight + 120 });
}

// ** Update Game Mechanics **
function update() {
    if (!gameRunning || gameOver) return;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (frameCount % 100 === 0) generatePipes();

    pipes.forEach(pipe => pipe.x -= 2);
    
    if (pipes.length && pipes[0].x + 50 < 0) {
        pipes.shift();
        score++;

        // ** Update Highest Score **
        if (score > highestScore) {
            highestScore = score;
            localStorage.setItem("highestScore", highestScore);
        }
    }

    if (bird.y + bird.height > canvas.height || bird.y < 0) endGame();

    pipes.forEach(pipe => {
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + 50) {
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) endGame();
        }
    });

    frameCount++;
}

// ** Draw Pipes Correctly **
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

// ** Draw Game Elements (Now Includes Highest Score) **
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    drawPipes();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 25);

    // ** Display Highest Score at Upper Right **
    ctx.fillText(`Best: ${highestScore}`, canvas.width - 100, 25);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "30px Arial";
        ctx.fillText("", 90, 240);
    }
}

// ** Game Loop Function **
function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

// ** Handle Game Over (Smooth Animation) **
function endGame() {
    gameOver = true;
    gameRunning = false;
    finalScore.textContent = score;

    gameOverScreen.style.display = "block";
    
    setTimeout(() => {
        gameOverScreen.classList.add("show");
    }, 50);
}

// ** Event Listeners **
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
document.addEventListener("keydown", (e) => { if (e.code === "Space") flap(); });
canvas.addEventListener("click", flap);
