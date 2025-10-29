const ORIGINAL_WIDTH = 320;
const ORIGINAL_HEIGHT = 480;

function update() {
  skyX -= 0.2;
  if (skyX <= -ORIGINAL_WIDTH) skyX = 0;

  bird.rotation = Math.min((bird.velocity / 10) * 90, 90);

  if (inMenu || gameIdle) {
    bird.y = ORIGINAL_HEIGHT / 2 + Math.sin(frameCount * 0.05) * 8;
    baseX -= 2;
    if (baseX <= -ORIGINAL_WIDTH) baseX = 0;
    frameCount++;
    return;
  }

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
  
  skyX -= skySpeed;
  if (skyX <= -canvas.width) {
  skyX = 0;
}

  if (gameRunning) {
    pipeTimer++;
    if (pipeTimer >= pipeInterval) {
      generatePipes();
      pipeTimer = 0;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];
      pipe.x -= 2;

      const pipeCenterX = pipe.x + 25;
      if (!pipe.scored && bird.x + bird.width / 2 >= pipeCenterX) {
        score++;
        pipe.scored = true;
        playSound("sounds/sfx_point.ogg");
        if (score > highestScore) {
          highestScore = score;
          localStorage.setItem("highestScore", highestScore);
        }
      }

      if (pipe.x + 50 < 0) pipes.splice(i, 1);
    }
    
    if (deathFlashTime > 0) {
  deathFlashTime--;
}

    if (pipeCollisionEnabled) {
      for (const pipe of pipes) {
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + 50) {
          if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
            endGame();
            break;
          }
        }
      }
    }

    if (bird.y + bird.height >= ORIGINAL_HEIGHT - baseHeight) {
      endGame();
    }
  } else if (gameOver) {
    if (bird.y + bird.height >= ORIGINAL_HEIGHT - baseHeight) {
      bird.y = ORIGINAL_HEIGHT - baseHeight - bird.height;
      bird.velocity = 0;
      bird.isDead = false;
    }
  }

  baseX -= baseSpeed;
  if (baseX <= -ORIGINAL_WIDTH) baseX = 0;

  frameCount++;
}

const bird = {
  x: 85,
  y: ORIGINAL_HEIGHT / 2,
  width: 34,
  height: 24,
  gravity: 0.25,
  lift: -4.8,
  velocity: 0,
  isDead: false,
  rotation: 0,
  flapTimer: 12
};

function flap() {
  if (gameIdle) {
    gameIdle = false;
    gameRunning = true;
    if (menu) menu.style.display = "none";
  }

  if (!gameOver && gameRunning) {
    bird.velocity = bird.lift;
    playSound("sounds/sfx_wing.ogg");
  }
}

function drawBird() {
  let angle = 0;
  if (inMenu || gameIdle) {
    angle = Math.sin(frameCount * 0.05) * 0.2;
  } else {
    angle = Math.min(Math.max(bird.velocity / 10, -0.5), gameOver ? 1 : 0.5);
  }

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