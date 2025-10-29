let pipeCollisionEnabled = true;
let showPipeHitboxes = false;
let touchStartTime = 0;
let tapTimes = [];

document.addEventListener("keydown", function (e) {
  if (e.shiftKey && (e.key === "h" || e.key === "H")) {
    pipeCollisionEnabled = !pipeCollisionEnabled;
    console.log("Pipe collision cheat =", pipeCollisionEnabled);
    return;
  }
  
  if (e.key === "h" || e.key === "H") {
    showPipeHitboxes = !showPipeHitboxes;
    console.log("Pipe hitboxes visible =", showPipeHitboxes);
  }
});

document.addEventListener("touchstart", () => {
  touchStartTime = Date.now();
});

document.addEventListener("touchend", () => {
  let heldTime = Date.now() - touchStartTime;
  if (heldTime >= 6000) {
    pipeCollisionEnabled = !pipeCollisionEnabled;
    console.log("Pipe collision cheat =", pipeCollisionEnabled);
  }
    
  let now = Date.now();
  tapTimes.push(now);
    
  if (tapTimes.length > 20) tapTimes.shift();
    
  if (tapTimes.length === 20 && (now - tapTimes[0]) <= 2500) {
    showPipeHitboxes = !showPipeHitboxes;
    tapTimes = [];
    console.log("Pipe hitboxes visible =", showPipeHitboxes);
  }
});

