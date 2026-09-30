/**
 * Galileo Thermometer Simulation
 * Physics restored to match the original working version.
 */

const SPHERES = [
  { temp: 28, color: "#ef4444", label: "28°C" },
  { temp: 24, color: "#f97316", label: "24°C" },
  { temp: 20, color: "#eab308", label: "20°C" },
  { temp: 16, color: "#22c55e", label: "16°C" },
  { temp: 12, color: "#06b6d4", label: "12°C" },
  { temp: 8,  color: "#3b82f6", label: "8°C"  },
];

const TUBE_HEIGHT = 440;
const TOP_MARGIN = 22;
const BOTTOM_MARGIN = 28;
const SPHERE_SIZE = 42;
const GAP = 6;

const slider = document.getElementById("temp-slider");
const tempDisplay = document.getElementById("temp-display");
const spheresContainer = document.getElementById("spheres");
const liquid = document.getElementById("liquid");
const bubblesContainer = document.getElementById("bubbles");

let currentTemp = parseFloat(slider.value);

function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

function createSpheres() {
  spheresContainer.innerHTML = "";
  SPHERES.forEach((s) => {
    const el = document.createElement("div");
    el.className = "sphere";
    el.dataset.temp = s.temp;

    const inner = document.createElement("div");
    inner.className = "sphere-inner";
    inner.style.background =
      `radial-gradient(circle at 32% 28%, ${lighten(s.color, 40)}, ${s.color} 55%, ${darken(s.color, 30)})`;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.label;

    el.appendChild(inner);
    el.appendChild(tag);
    spheresContainer.appendChild(el);
  });
}

/**
 * Same logic as the first working zip:
 * - temp above ambient → sink
 * - temp below ambient → float
 * - Floaters keep SPHERES order (higher labels first → higher in the tube)
 *   so at ~22°C you get: 20, 16, 12, 8 up top and 24, 28 at the bottom.
 */
function updatePositions(temp) {
  const spheres = Array.from(spheresContainer.children);
  const floaters = [];
  const sinkers = [];

  SPHERES.forEach((s, i) => {
    if (s.temp > temp + 0.8) {
      sinkers.push(i);
    } else if (s.temp < temp - 0.8) {
      floaters.push(i);
    } else {
      floaters.push(i);
    }
  });

  // Do NOT re-sort floaters — keep push order (28→8), so higher temps sit higher
  // among the floating group (matches first version).

  floaters.forEach((idx, order) => {
    const el = spheres[idx];
    el.style.top = `${TOP_MARGIN + order * (SPHERE_SIZE + GAP)}px`;
    el.classList.remove("sinking");
  });

  // Push order is high→low temp; place so higher temps sit lower (28 at very bottom)
  sinkers.forEach((idx, order) => {
    const el = spheres[idx];
    const fromBottom = order * (SPHERE_SIZE + GAP);
    el.style.top = `${TUBE_HEIGHT - BOTTOM_MARGIN - SPHERE_SIZE - fromBottom}px`;
    el.classList.add("sinking");
  });

  spheres.forEach((el) => el.classList.remove("active"));
  let activeIdx = 0;
  let bestDiff = Infinity;
  SPHERES.forEach((s, i) => {
    const diff = Math.abs(s.temp - temp);
    if (diff < bestDiff) {
      bestDiff = diff;
      activeIdx = i;
    }
  });
  spheres[activeIdx].classList.add("active");
}

function updateLiquid(temp) {
  const t = (temp - 5) / 25;
  const r = Math.round(50 + t * 30);
  const g = Math.round(110 + t * 30);
  const b = Math.round(180 - t * 30);
  const aTop = 0.06 + t * 0.04;
  const aMid = 0.12 + t * 0.06;
  const aBot = 0.18 + t * 0.06;
  liquid.style.background = `linear-gradient(
    180deg,
    rgba(${r + 30}, ${g + 30}, ${b + 15}, ${aTop}) 0%,
    rgba(${r}, ${g}, ${b}, ${aMid}) 45%,
    rgba(${r - 15}, ${g - 20}, ${b - 25}, ${aBot}) 100%
  )`;
}

function updateDisplay(temp) {
  const rounded = Math.round(temp * 10) / 10;
  tempDisplay.textContent = `${rounded}°C`;
  slider.setAttribute("aria-valuenow", rounded);
}

function createBubbles() {
  bubblesContainer.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    const size = 2.5 + Math.random() * 4.5;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    b.style.left = `${18 + Math.random() * 64}%`;
    b.style.animationDuration = `${7 + Math.random() * 9}s`;
    b.style.animationDelay = `${Math.random() * 7}s`;
    bubblesContainer.appendChild(b);
  }
}

function onTempChange() {
  currentTemp = parseFloat(slider.value);
  updateDisplay(currentTemp);
  updatePositions(currentTemp);
  updateLiquid(currentTemp);
}

createSpheres();
createBubbles();
onTempChange();

slider.addEventListener("input", onTempChange);

let demoRunning = true;
let demoDir = 1;
const demoInterval = setInterval(() => {
  if (!demoRunning) {
    clearInterval(demoInterval);
    return;
  }
  let next = currentTemp + demoDir * 0.35;
  if (next >= 27) {
    next = 27;
    demoDir = -1;
  } else if (next <= 9) {
    next = 9;
    demoDir = 1;
  }
  slider.value = next;
  onTempChange();
}, 90);

function stopDemo() {
  demoRunning = false;
}
slider.addEventListener("pointerdown", stopDemo, { once: true });
slider.addEventListener("touchstart", stopDemo, { once: true });
