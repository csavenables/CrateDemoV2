import { MIRIS_ASSETS } from "./splat-config.js";

// ── Suppress Miris SDK console noise ─────────────────────────────────────────
// Single compiled regex — faster than iterating a keyword array on every call
const MIRIS_NOISE =
  /^\[[\d-]+ [\d:.]+\]|LOD|nbf|rsnap|worker result|[Mm]iris|splat|[Ss]tream|viewer|[Jj][Ww][Tt]|violation|requestAnimationFrame handler took|[Pp]oint[Cc]loud|Received modified event/;
function isMirisNoise(args) {
  return MIRIS_NOISE.test(String(args[0] ?? ""));
}
["log", "warn", "error"].forEach(method => {
  const orig = console[method].bind(console);
  console[method] = (...args) => { if (!isMirisNoise(args)) orig(...args); };
});

// ── Elements ──────────────────────────────────────────────────────────────────
const stream     = document.getElementById("stream");
const cameraEl   = document.querySelector("miris-camera");
const controlsEl = document.getElementById("controls");
let activeIndex  = 0;

// ── Fixed view ────────────────────────────────────────────────────────────────
const CAM      = { x: 0, y: 0.83, z: 1.44 };
const STREAM_Y = -0.5;

function applyView() {
  if (stream.rotation) stream.rotation.y = MIRIS_ASSETS[activeIndex].rotY;
  if (stream.position?.set) stream.position.set(0, STREAM_Y, 0);
  if (cameraEl?.position?.set) cameraEl.position.set(CAM.x, CAM.y, CAM.z);
}

function lockView(frames) {
  applyView();
  if (frames > 0) requestAnimationFrame(() => lockView(frames - 1));
}

lockView(20);

// ── Shared scene-switch logic ─────────────────────────────────────────────────
function goTo(index) {
  const n = MIRIS_ASSETS.length;
  const i = ((index % n) + n) % n;   // wrap around
  if (i === activeIndex) return;
  buttons[activeIndex].classList.remove("is-active");
  activeIndex = i;
  stream.setAttribute("uuid", MIRIS_ASSETS[i].uuid);
  lockView(20);
  buttons[activeIndex].classList.add("is-active");
}

// ── Numbered nav buttons ──────────────────────────────────────────────────────
const nav = document.createElement("div");
nav.className = "scene-nav";

const buttons = MIRIS_ASSETS.map((asset, i) => {
  const btn = document.createElement("button");
  btn.className = "scene-btn" + (i === 0 ? " is-active" : "");
  btn.textContent = String(i + 1);
  btn.setAttribute("aria-label", asset.label);
  btn.addEventListener("click", () => goTo(i));
  nav.appendChild(btn);
  return btn;
});

controlsEl.appendChild(nav);

// ── Arrow buttons ─────────────────────────────────────────────────────────────
const CHEVRON_L = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="15 18 9 12 15 6"/>
</svg>`;

const CHEVRON_R = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="9 18 15 12 9 6"/>
</svg>`;

function makeArrow(cls, label, svg, onClick) {
  const btn = document.createElement("button");
  btn.className = `scene-arrow ${cls}`;
  btn.setAttribute("aria-label", label);
  btn.innerHTML = svg;
  btn.addEventListener("click", onClick);
  return btn;
}

controlsEl.appendChild(makeArrow("scene-arrow--left",  "Previous scene", CHEVRON_L, () => goTo(activeIndex - 1)));
controlsEl.appendChild(makeArrow("scene-arrow--right", "Next scene",     CHEVRON_R, () => goTo(activeIndex + 1)));
