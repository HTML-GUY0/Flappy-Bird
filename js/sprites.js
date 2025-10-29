const skyImg = new Image();
skyImg.src = "sprites/sky.png";

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

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreNumbers = document.getElementById("finalScoreNumbers");
const bestScoreNumbers = document.getElementById("bestScoreNumbers");

const numberImgs = [];
for (let i = 0; i <= 9; i++) {
  const img = new Image();
  img.src = `sprites/${i}.png`;
  numberImgs.push(img);
}