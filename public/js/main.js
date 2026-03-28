/**
 * MAD EDITZZZ — Main Frontend JavaScript
 * Handles: preset loading, filtering, download modal, countdown timer
 */

/* ─── State ──────────────────────────────────────────────── */
let allPresets = [];
let filteredPresets = [];
let currentPreset = null;
let timerInterval = null;
const PAGE_SIZE = 9;
let currentPage = 0;

/* ─── DOM Refs ───────────────────────────────────────────── */
const presetsGrid = document.getElementById("presetsGrid");
const filterPills = document.getElementById("filterPills");
const downloadModal = document.getElementById("downloadModal");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalCategory = document.getElementById("modalCategory");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const stateTimer = document.getElementById("stateTimer");
const stateReady = document.getElementById("stateReady");
const timerNum = document.getElementById("timerNum");
const btnCountdown = document.getElementById("btnCountdown");
const timerBar = document.getElementById("timerBar");
const ringProgress = document.getElementById("ringProgress");
const btnActualDownload = document.getElementById("btnActualDownload");
const btnReset = document.getElementById("btnReset");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const totalDownloadsEl = document.getElementById("totalDownloads");
const totalPresetsEl = document.getElementById("totalPresets");

/* ─── Cursor Glow ────────────────────────────────────────── */
const cursorGlow = document.getElementById("cursorGlow");
document.addEventListener("mousemove", (e) => {
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";
  cursorGlow.style.opacity = "1";
});
document.addEventListener("mouseleave", () => { cursorGlow.style.opacity = "0"; });

/* ─── Hamburger ──────────────────────────────────────────── */
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
hamburger.addEventListener("click", () => mobileNav.classList.toggle("open"));

/* ─── Fetch Presets ──────────────────────────────────────── */
async function loadPresets() {
  try {
    const res = await fetch("/api/presets");
    const data = await res.json();
    if (!data.success) throw new Error("API error");
    allPresets = data.presets;
    filteredPresets = [...allPresets];
    buildFilterPills();
    renderGrid();
    updateHeroStats();
  } catch (err) {
    presetsGrid.innerHTML = `<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:60px">Failed to load presets. Make sure the server is running.</p>`;
    console.error("Load error:", err);
  }
}

/* ─── Hero Stats ─────────────────────────────────────────── */
function updateHeroStats() {
  const totalDl = allPresets.reduce((s, p) => s + (p.downloads || 0), 0);
  animateNumber(totalDownloadsEl, totalDl);
  animateNumber(totalPresetsEl, allPresets.length);
}

function animateNumber(el, target) {
  const start = 0;
  const duration = 1200;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const val = Math.round(progress * target);
    el.textContent = val.toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─── Filter Pills ───────────────────────────────────────── */
function buildFilterPills() {
  const cats = ["all", ...new Set(allPresets.map((p) => p.category).filter(Boolean))];
  filterPills.innerHTML = cats
    .map(
      (c) =>
        `<button class="pill${c === "all" ? " active" : ""}" data-cat="${c}">${
          c === "all" ? "All" : c
        }</button>`
    )
    .join("");

  filterPills.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterPills.querySelectorAll(".pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      filteredPresets = cat === "all" ? [...allPresets] : allPresets.filter((p) => p.category === cat);
      currentPage = 0;
      renderGrid();
    });
  });
}

/* ─── Render Grid ────────────────────────────────────────── */
function renderGrid() {
  const slice = filteredPresets.slice(0, (currentPage + 1) * PAGE_SIZE);
  presetsGrid.innerHTML = slice.map((p, i) => buildCard(p, i)).join("");

  // Attach events
  presetsGrid.querySelectorAll(".btn-card-download").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(btn.dataset.id);
    });
  });
  presetsGrid.querySelectorAll(".preset-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });

  // Load more
  if (filteredPresets.length > (currentPage + 1) * PAGE_SIZE) {
    loadMoreBtn.style.display = "inline-block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

function buildCard(preset, i) {
  return `
    <div class="preset-card" data-id="${preset.id}" style="animation-delay:${i * 60}ms">
      <div class="card-image-wrap">
        <img src="${preset.imageUrl}" alt="${preset.title}" loading="lazy" />
        <span class="card-category">${preset.category || "General"}</span>
        <span class="card-downloads">⬇ ${(preset.downloads || 0).toLocaleString()}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${preset.title}</h3>
        <p class="card-desc">${preset.description || "Premium editing preset"}</p>
        <button class="btn-card-download" data-id="${preset.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Download Free
        </button>
      </div>
    </div>
  `;
}

loadMoreBtn.addEventListener("click", () => {
  currentPage++;
  renderGrid();
});

/* ─── Download Modal ─────────────────────────────────────── */
function openModal(id) {
  const preset = allPresets.find((p) => p.id === id);
  if (!preset) return;
  currentPreset = preset;

  // Populate modal
  modalImage.src = preset.imageUrl;
  modalImage.alt = preset.title;
  modalCategory.textContent = preset.category || "General";
  modalTitle.textContent = preset.title;
  modalDesc.textContent = preset.description || "";

  // Reset to timer state
  resetModal();
  downloadModal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Start timer
  startTimer();
}

function closeModal() {
  downloadModal.classList.remove("open");
  document.body.style.overflow = "";
  stopTimer();
}

function resetModal() {
  stateTimer.classList.remove("hidden");
  stateReady.classList.add("hidden");
  stopTimer();
}

modalClose.addEventListener("click", closeModal);
downloadModal.addEventListener("click", (e) => {
  if (e.target === downloadModal) closeModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

btnReset.addEventListener("click", () => {
  resetModal();
  startTimer();
});

/* ─── Countdown Timer ────────────────────────────────────── */
const TIMER_DURATION = 30; // seconds
const RING_CIRCUMFERENCE = 2 * Math.PI * 42; // r=42

function startTimer() {
  let timeLeft = TIMER_DURATION;
  ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = 0;

  updateTimerDisplay(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
      stopTimer();
      showReadyState();
    }
  }, 1000);
}

function updateTimerDisplay(timeLeft) {
  // Number
  timerNum.textContent = timeLeft;
  btnCountdown.textContent = timeLeft;

  // SVG ring
  const progress = (TIMER_DURATION - timeLeft) / TIMER_DURATION;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  ringProgress.style.strokeDashoffset = offset;

  // Bar — shrinks left to right
  const barProgress = timeLeft / TIMER_DURATION;
  timerBar.style.transform = `scaleX(${barProgress})`;
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

async function showReadyState() {
  // Fetch actual download link
  try {
    const res = await fetch(`/api/presets/${currentPreset.id}/download`);
    const data = await res.json();
    if (data.success) {
      btnActualDownload.href = data.downloadLink;
    }
  } catch {
    btnActualDownload.href = "#";
  }

  stateTimer.classList.add("hidden");
  stateReady.classList.remove("hidden");

  // Update card download count
  const card = presetsGrid.querySelector(`[data-id="${currentPreset.id}"] .card-downloads`);
  if (card) {
    const curr = parseInt(card.textContent.replace(/\D/g, "")) || 0;
    card.textContent = `⬇ ${(curr + 1).toLocaleString()}`;
  }
}

/* ─── Init ───────────────────────────────────────────────── */
loadPresets();
