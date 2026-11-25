// Initialize Lucide icons
if (window.lucide) {
  lucide.createIcons();
}

const sidebar = document.getElementById("sidebar");
const main = document.getElementById("main");
const activeLabel = document.getElementById("activeLabel");
const contextMenu = document.getElementById("contextMenu");

const VIEW_IDS = {
  reexpeditions: "reexpeditionsView",
  notifications: "notificationsView",
  consultas: "consultasView",
};

function setActive(view) {
  document.querySelectorAll(".nav-item, .child-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.view === view);
  });
  const LABELS = {
    reexpeditions: "Reexp. por cumplir",
    notifications: "Generador de Notificaciones",
    consultas: "Consultas ZVE",
    myissues: "Mis issues",
  };
  if (activeLabel) activeLabel.textContent = LABELS[view] || view;

  const defaultView = document.getElementById("defaultView");
  // hide all embed views
  Object.values(VIEW_IDS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (VIEW_IDS[view]) {
    if (defaultView) defaultView.style.display = "none";
    const viewEl = document.getElementById(VIEW_IDS[view]);
    if (viewEl) viewEl.style.display = "block";
  } else {
    if (defaultView) defaultView.style.display = "block";
  }
}

// Nav item clicks
document.querySelectorAll(".nav-item, .child-item").forEach((el) => {
  el.addEventListener("click", () => setActive(el.dataset.view));
});

// Section toggles
document.querySelectorAll(".section-header").forEach((header) => {
  header.addEventListener("click", () => {
    const section = header.closest(".section");
    const body = section.querySelector(".section-body");
    const chevron = header.querySelector(".chevron");
    const collapsed = body.classList.toggle("collapsed");
    if (chevron) chevron.style.transform = collapsed ? "rotate(-90deg)" : "rotate(0deg)";
  });
});

// Team toggles
document.querySelectorAll(".team-header").forEach((header) => {
  header.addEventListener("click", () => {
    const team = header.closest(".team");
    const children = team.querySelector(".team-children");
    const chevron = header.querySelector(".team-chevron");
    const collapsed = children.classList.toggle("collapsed");
    if (chevron) chevron.classList.toggle("open", !collapsed);
  });
});

// Context menu on team right-click
let currentTeam = null;
document.querySelectorAll(".team-header").forEach((header) => {
  header.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    currentTeam = header.dataset.team;
    contextMenu.style.left = e.clientX + "px";
    contextMenu.style.top = e.clientY + "px";
    contextMenu.classList.add("open");
  });
});

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target)) {
    contextMenu.classList.remove("open");
  }
});

contextMenu.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => contextMenu.classList.remove("open"));
});

// Digital clock (reference style)
const dcBtn12 = document.getElementById("dc-btn-12");
const dcBtn24 = document.getElementById("dc-btn-24");
const dcTime = document.getElementById("dc-time");
const dcAmpm = document.getElementById("dc-ampm");
const dcDate = document.getElementById("dc-date");
const dcDay = document.getElementById("dc-day");

let dcHour12 = true;

function dcPad(n) {
  return String(n).padStart(2, "0");
}

function dcClock() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  let s = now.getSeconds();
  let AmPm = "";

  if (dcHour12) {
    AmPm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }

  if (dcTime) dcTime.textContent = dcPad(h) + ":" + dcPad(m) + ":" + dcPad(s);
  if (dcAmpm) {
    dcAmpm.textContent = AmPm;
    dcAmpm.style.display = dcHour12 ? "block" : "none";
  }

  const nowDate = now.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const nowDay = now.toLocaleDateString("es-CL", { weekday: "long" });

  if (dcDate) dcDate.textContent = nowDate;
  if (dcDay) dcDay.textContent = nowDay;
}

if (dcBtn12) {
  dcBtn12.addEventListener("click", () => {
    dcHour12 = true;
    dcBtn12.classList.add("activeToggle");
    if (dcBtn24) dcBtn24.classList.remove("activeToggle");
  });
}
if (dcBtn24) {
  dcBtn24.addEventListener("click", () => {
    dcHour12 = false;
    dcBtn24.classList.add("activeToggle");
    if (dcBtn12) dcBtn12.classList.remove("activeToggle");
  });
}

dcClock();
setInterval(dcClock, 1000);

// Dolar aduana Chile (promedio mes anterior)
async function loadDolar() {
  const el = document.getElementById("dolarValue");
  const setValue = (v) => { if (el) el.textContent = "TIPO DE CAMBIO $ " + v + " DOLAR EE.UU."; };
  // 1) Try CORS proxy to official aduana source
  try {
    const r = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://www.dolaraduanero.cl/"));
    const t = await r.text();
    const m = t.match(/<title[^>]*>[^<]*\$([\d.,]+)[^<]*<\/title>/i);
    if (m && m[1]) { setValue(m[1]); return; }
  } catch (e) {}
  // 2) Fallback: mindicador.cl observed dollar (CORS allowed)
  try {
    const r = await fetch("https://mindicador.cl/api/dolar");
    const j = await r.json();
    if (j.serie && j.serie[0]) { setValue(j.serie[0].valor.toFixed(2).replace(".", ",")); return; }
  } catch (e) {}
  // 3) Hardcoded fallback
  setValue("981,08");
}
loadDolar();

// ===== Text decode effect + diagonal orange rain background =====
const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rain canvas
const rainCanvas = document.getElementById("rainCanvas");
const rainCtx = rainCanvas ? rainCanvas.getContext("2d") : null;
const RAIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

function resizeRain() {
  if (!rainCanvas) return;
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
}

const isMobile = window.innerWidth < 700;
const particleCount = isMobile ? 120 : 300;
const particles = [];

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * (rainCanvas.width || window.innerWidth),
      y: Math.random() * (rainCanvas.height || window.innerHeight),
      speed: 1.2 + Math.random() * 2.2,
      size: 12 + Math.random() * 16,
      char: RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)],
      opacity: 0.5,
    });
  }
}

function drawRain() {
  if (!rainCtx || prefersReduced) return;
  rainCtx.fillStyle = "rgba(0,0,0,0.03)";
  rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
  for (const p of particles) {
    rainCtx.font = p.size + "px monospace";
    rainCtx.fillStyle = "rgba(204,85,0,0.5)";
    rainCtx.fillText(p.char, p.x, p.y);
    p.x += p.speed * 0.55;
    p.y += p.speed;
    if (p.y > rainCanvas.height + 20 || p.x > rainCanvas.width + 20) {
      p.x = Math.random() * rainCanvas.width * 0.4;
      p.y = -20 - Math.random() * 40;
      p.char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
    }
  }
  requestAnimationFrame(drawRain);
}

if (rainCanvas && !prefersReduced) {
  resizeRain();
  initParticles();
  drawRain();
  window.addEventListener("resize", () => {
    resizeRain();
    initParticles();
  });
}

// Text decode effect
const DECODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

function collectTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-decode]")) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "CANVAS" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

if (!prefersReduced) {
  const textNodes = collectTextNodes(document.body);
  textNodes.forEach((n) => { n._orig = n.nodeValue; });

  const start = performance.now();
  const duration = 700;

  function decodeStep(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    for (const node of textNodes) {
      const orig = node._orig;
      if (progress >= 1) {
        node.nodeValue = orig;
        continue;
      }
      let res = "";
      for (let i = 0; i < orig.length; i++) {
        const ch = orig[i];
        if (ch === " " || ch === "\n" || ch === "\t" || ch === "\r") {
          res += ch;
          continue;
        }
        if (Math.random() < progress) {
          res += ch;
        } else {
          res += DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
        }
      }
      node.nodeValue = res;
    }
    if (progress < 1) requestAnimationFrame(decodeStep);
  }
  requestAnimationFrame(decodeStep);
}

// Home link
function goHome(e) {
  if (e) e.preventDefault();
  document.querySelectorAll(".nav-item, .child-item").forEach((el) => el.classList.remove("active"));
  const defaultView = document.getElementById("defaultView");
  Object.values(VIEW_IDS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  if (defaultView) defaultView.style.display = "block";
  if (activeLabel) activeLabel.textContent = "INDEX";
}
const homeLink = document.getElementById("homeLink");
if (homeLink) homeLink.addEventListener("click", goHome);
const mobileHomeLink = document.getElementById("mobileHomeLink");
if (mobileHomeLink) mobileHomeLink.addEventListener("click", goHome);

// Compact toggle
const compactBtn = document.getElementById("compactBtn");
if (compactBtn) {
  compactBtn.addEventListener("click", () => {
    const isCompact = sidebar.classList.toggle("compact");
    compactBtn.innerHTML = "";
    const icon = lucide.createElement(
      lucide.icons[isCompact ? "PanelLeftOpen" : "PanelLeftClose"],
      { width: 14, height: 14, "stroke-width": 1.5 }
    );
    compactBtn.appendChild(icon);
  });
}

// Mobile menu
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
}

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 1024 && sidebar.classList.contains("open")) {
    if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
      sidebar.classList.remove("open");
    }
  }
});

// Help button (placeholder)
const helpBtn = document.getElementById("helpBtn");
if (helpBtn) {
  helpBtn.addEventListener("click", () => {
    alert("Ayuda");
  });
}