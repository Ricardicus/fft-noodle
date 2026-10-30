// Settings
const F = 80;
const CIRCLES_X_OFFSET = 0.1;
const CIRCLES_Y_OFFSET = 0.4;
const SIZE_FACTOR = 0.1;
const N = 1024.0;

// Modes
const MODE_RUN = 0;
const MODE_DRAW = 1;
const MODE_CALC = 2;
let mode = MODE_RUN;

// Running variables
canvas_center = [0,0];
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let useTerms = N/2;
let terms = [[{k:1, a:0.3}, {k:5, a:0.2}], []];
let phases = [new Array(N).fill(0), new Array(N).fill(0)];
let raw = [];
let runnerIndex = 0;
let trace = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas_center[0] = canvas.width/2;
  canvas_center[1] = canvas.height/2;
}

window.addEventListener("resize", resizeCanvas);

function prepareCanvas() {
  resizeCanvas();
}

function updatePhases() {
  for (const term of terms[0]) {
    phases[0][term.k] = (phases[0][term.k] + 2*Math.PI*(term.k*1.0/N)) % (2 * Math.PI);
  }

  for (const term of terms[1]) {
    phases[1][term.k] = (phases[1][term.k] + 2*Math.PI*(term.k*1.0/N)) % (2 * Math.PI);
  }
}

function updateRunner() {
  runnerIndex = (runnerIndex + 1) % raw.length;
}

function resetPhases() {
  phases[0].fill(0);
  phases[1].fill(0);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function findSegment(values, targetLen) {
  let targetReached = false;
  let l = 0.0;
  let candidate = {point: values[0], index: 0, lengthUpTo: 0};
  if (targetLen > 0) {
    for (let i = 1; i<values.length-1 && !targetReached; i++) {
      let point = values[i];
      let addition = Math.sqrt((point.x-candidate.point.x)**2+(point.y-candidate.point.y)**2);
      if (l < targetLen && l + addition >= targetLen) {
        targetReached = true;
        break;
      }
      l += addition;
      candidate.point = point;
      candidate.index = i;
      candidate.lengthUpTo = l;
    }
  }

  let start = candidate.point;
  let end = values[candidate.index+1];
  let segment = {
    start: start,
    end: end,
    lengthUpTo: candidate.lengthUpTo,
    length: Math.sqrt((end.x-start.x)**2+(end.y-start.y)**2)
  };
  return segment;

}

function resample(values) {
  if (values.length < 2) return;
  let L = 0.0;
  let prev = values[0];
  for (let i = 1; i<values.length; i++) {
    let point = values[i];
    L += Math.sqrt((point.x-prev.x)**2+(point.y-prev.y)**2);
    prev = point;
  }
  let l = L / N;
  let newPoints = [];
  let lastU = 0;
  for ( let i = 0; i < N; i++) {
    let targetLen = l*i;
    let segment = findSegment(values, targetLen);
    let u = (targetLen - segment.lengthUpTo) / segment.length;
    let newPoint = {
      x: segment.start.x + (segment.end.x - segment.start.x) * u,
      y: segment.start.y + (segment.end.y - segment.start.y) * u
    };
    lastU = u;
    newPoints.push(newPoint);
  }
  return newPoints;
}

function drawCircleX() {
  let sum_arm = [0,0];
  let circle_start = [canvas_center[0],
    canvas_center[1] + canvas.width * CIRCLES_X_OFFSET];
  let lastPoint = [0,0];
  ctx.setLineDash([]);
  for (const term of terms[0]) {
    // center of the circle
    let center = [circle_start[0]+sum_arm[0], circle_start[1]+sum_arm[1]];
    let radius = term.a;
    let acc = [radius*Math.cos(phases[0][term.k]), radius*Math.sin(phases[0][term.k])];
    sum_arm[0] += acc[0];
    sum_arm[1] += acc[1];

    // circle
    ctx.globalAlfa = 0.2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlfa = 1.0;

    // line
    let target = [center[0] + acc[0], center[1] + acc[1]];
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(target[0], target[1]);
    ctx.stroke();

    lastPoint = [target[0], target[1]];
  }
  if (raw.length > 0 ) {
    // line
    let runnerPoint = raw[runnerIndex];
    let target = [runnerPoint.x, runnerPoint.y];
    ctx.strokeStyle = "white";
    ctx.setLineDash([4,10]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lastPoint[0], lastPoint[1]);
    ctx.lineTo(target[0], target[1]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

}

function drawCircleY() {
  let sum_arm = [0,0];
  let circle_start = [canvas_center[0] + canvas.height * CIRCLES_Y_OFFSET,
    canvas_center[1]];
  let lastPoint = [0,0];
  for (const term of terms[1]) {
    // center of the circle
    let center = [circle_start[0]+sum_arm[0], circle_start[1]+sum_arm[1]];
    let radius = term.a;
    let acc = [radius*Math.cos(phases[1][term.k]), radius*Math.sin(phases[1][term.k])];
    sum_arm[0] += acc[1];
    sum_arm[1] += acc[0];

    // circle
    ctx.globalAlfa = 0.2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlfa = 1.0;

    // line
    let target = [center[0] + acc[1], center[1] + acc[0]];
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(target[0], target[1]);
    ctx.stroke();

    lastPoint = [target[0], target[1]];
  }
  if (raw.length > 0 ) {
    // line
    let runnerPoint = raw[runnerIndex];
    let target = [runnerPoint.x, runnerPoint.y];
    ctx.strokeStyle = "white";
    ctx.setLineDash([4,10]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lastPoint[0], lastPoint[1]);
    ctx.lineTo(target[0], target[1]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawRaw() {
  if (raw.length < 2) return;
  let start = [raw[0].x,raw[0].y];
  for (let j = 1; j < raw.length; j++) {
    let target = raw[j];

    // line
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    start = [target.x, target.y];
  }
}

function prepare() {
  prepareCanvas();
  resetPhases();
}

function update() {
  updatePhases();
  updateRunner();
}

function drawCircles() {
  clearCanvas(); 
  drawCircleX();
  drawCircleY();
}

function drawTrack() {
  clearCanvas();
  drawRaw();
}

function drawRunner() {
  if (raw.length == 0) return;
  let p = raw[runnerIndex];
  // circle
    ctx.fillStyle = "red";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
}

function resetRunner() {
  runnerIndex = 0;
}

function reset() {
  resetPhases();
  resetRunner();
}

function go() {
  if (mode == MODE_RUN) {
    update();
    drawCircles();
    drawRaw();
    drawRunner();
  } else if (mode == MODE_DRAW) {
    drawTrack();
  } else if (mode == MODE_CALC) {
    if (raw.length < 2) {
      mode = MODE_RUN;
    }

    // reset phases
    reset();
    reset();

    // Close the loop
    raw.push(raw[0]);

    // resample
    raw = resample(raw);

    // fft
    let Xft = transformR(raw.map(p => p.x - canvas_center[0]));
    let Yft = transformR(raw.map(p => p.y - canvas_center[1]));

    terms = [[], []];
    for (let k = 0; k < N; k++) {
      let factor = 1.0;// (k === 0 || k === N/2) ? 1 : 2;

        terms[0].push({
            a: factor * Math.hypot(Xft[k].re, Xft[k].im) / N,
            k: k,
        });
        phases[0][k] = Math.atan2(Xft[k].im, Xft[k].re)

        terms[1].push({
            a: factor * Math.hypot(Yft[k].re, Yft[k].im) / N,
            k: k,
            phase: Math.atan2(Yft[k].im, Yft[k].re)
        });
        phases[1][k] = Math.atan2(Yft[k].im, Yft[k].re)
    }
    mode = MODE_RUN;
  }
}

let loop = null;

// Pointer
const pointer = {
    x: 0,
    y: 0,
    pressed: false
};

function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();

    // Convert browser coordinates to canvas coordinates
    pointer.x =
        (event.clientX - rect.left) * (canvas.width / rect.width);

    pointer.y =
        (event.clientY - rect.top) * (canvas.height / rect.height);
}

canvas.addEventListener("pointerdown", (event) => {
    pointer.pressed = true;
    canvas.setPointerCapture(event.pointerId);
    updatePointer(event);


    // Refresh the raw list
    raw = [{x: pointer.x, y: pointer.y}];
    mode = MODE_DRAW;
});

canvas.addEventListener("pointermove", (event) => {
    if (!pointer.pressed) return;

    mode = MODE_DRAW;
    updatePointer(event);
    raw.push({x: pointer.x, y: pointer.y});

    // Do something at the current position
    // drawCircle(pointer.x, pointer.y);
});

canvas.addEventListener("pointerup", (event) => {
    mode = MODE_CALC;
    pointer.pressed = false;
    canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", () => {
    mode = MODE_RUN;
    pointer.pressed = false;
});

window.addEventListener('load', function() {
  prepare();
  go();

  if (loop !== null) {
    clearInterval(loop);
  }
  loop = setInterval(() => {
    go();
  }, 1000/F);
})
