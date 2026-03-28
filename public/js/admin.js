/**
 * MAD EDITZZZ — Admin Panel JavaScript
 * Handles: login, preset management, add/edit/delete
 */

/* ─── DOM Refs ───────────────────────────────────────────── */
const loginScreen = document.getElementById("loginScreen");
const adminDashboard = document.getElementById("adminDashboard");
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const btnLogin = document.getElementById("btnLogin");
const loginError = document.getElementById("loginError");
const loginSpinner = document.getElementById("loginSpinner");
const btnLoginText = document.getElementById("btnLoginText");
const btnLogout = document.getElementById("btnLogout");

// Tabs
const tabPresets = document.getElementById("tabPresets");
const tabAdd = document.getElementById("tabAdd");
const tabEdit = document.getElementById("tabEdit");
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-tab]");
const btnGoAdd = document.getElementById("btnGoAdd");
const btnCancelAdd = document.getElementById("btnCancelAdd");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnBackToList = document.getElementById("btnBackToList");

// Stats
const aStatTotal = document.getElementById("aStatTotal");
const aStatDownloads = document.getElementById("aStatDownloads");
const aStatCategories = document.getElementById("aStatCategories");

// Table
const presetsTableBody = document.getElementById("presetsTableBody");

// Add form
const uploadArea = document.getElementById("uploadArea");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const uploadPreview = document.getElementById("uploadPreview");
const uploadRemove = document.getElementById("uploadRemove");
const fileInput = document.getElementById("fileInput");
const btnBrowse = document.getElementById("btnBrowse");
const fTitle = document.getElementById("fTitle");
const fCategory = document.getElementById("fCategory");
const fDesc = document.getElementById("fDesc");
const fLink = document.getElementById("fLink");
const fImageUrl = document.getElementById("fImageUrl");
const btnAddPreset = document.getElementById("btnAddPreset");
const addBtnText = document.getElementById("addBtnText");
const addSpinner = document.getElementById("addSpinner");
const addAlert = document.getElementById("addAlert");
const deleteAlert = document.getElementById("deleteAlert");

// Edit form
const editId = document.getElementById("editId");
const editTitle = document.getElementById("editTitle");
const editCategory = document.getElementById("editCategory");
const editDesc = document.getElementById("editDesc");
const editLink = document.getElementById("editLink");
const btnSaveEdit = document.getElementById("btnSaveEdit");
const editAlert = document.getElementById("editAlert");

/* ─── Auth ───────────────────────────────────────────────── */
async function checkAuth() {
  try {
    const res = await fetch("/api/admin/check");
    const data = await res.json();
    if (data.isAdmin) {
      showDashboard();
    }
  } catch {}
}

function showDashboard() {
  loginScreen.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
  loadPresets();
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  adminDashboard.classList.add("hidden");
}

// Login
btnLogin.addEventListener("click", async () => {
  const user = loginUser.value.trim();
  const pass = loginPass.value.trim();
  if (!user || !pass) { loginError.textContent = "Please enter username and password."; return; }

  setLoginLoading(true);
  loginError.textContent = "";

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();
    if (data.success) {
      showDashboard();
    } else {
      loginError.textContent = data.message || "Invalid credentials.";
    }
  } catch {
    loginError.textContent = "Server error. Make sure the server is running.";
  }
  setLoginLoading(false);
});

// Enter key login
[loginUser, loginPass].forEach((el) => {
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") btnLogin.click(); });
});

function setLoginLoading(on) {
  btnLoginText.textContent = on ? "Logging in…" : "Login";
  loginSpinner.classList.toggle("hidden", !on);
  btnLogin.disabled = on;
}

// Logout
btnLogout.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  showLogin();
});

/* ─── Tab Navigation ─────────────────────────────────────── */
function showTab(tabName) {
  [tabPresets, tabAdd, tabEdit].forEach((t) => t.classList.remove("active"));
  sidebarLinks.forEach((l) => l.classList.remove("active"));

  const tabEl = { presets: tabPresets, add: tabAdd, edit: tabEdit }[tabName];
  if (tabEl) tabEl.classList.add("active");

  const link = document.querySelector(`.sidebar-link[data-tab="${tabName}"]`);
  if (link) link.classList.add("active");
}

sidebarLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showTab(link.dataset.tab);
  });
});

btnGoAdd.addEventListener("click", () => showTab("add"));
btnCancelAdd.addEventListener("click", () => { clearAddForm(); showTab("presets"); });
btnCancelEdit.addEventListener("click", () => showTab("presets"));
btnBackToList.addEventListener("click", () => showTab("presets"));

/* ─── Load Presets (Admin) ───────────────────────────────── */
async function loadPresets() {
  try {
    const res = await fetch("/api/admin/presets");
    const data = await res.json();
    if (!data.success) throw new Error();
    renderTable(data.presets);
    updateStats(data.presets);
  } catch {
    presetsTableBody.innerHTML = `<tr><td colspan="6" class="table-loading" style="color:var(--red)">Failed to load. Check server.</td></tr>`;
  }
}

function updateStats(presets) {
  aStatTotal.textContent = presets.length;
  aStatDownloads.textContent = presets.reduce((s, p) => s + (p.downloads || 0), 0).toLocaleString();
  const cats = new Set(presets.map((p) => p.category).filter(Boolean));
  aStatCategories.textContent = cats.size;
}

/* ─── Render Table ───────────────────────────────────────── */
function renderTable(presets) {
  if (!presets.length) {
    presetsTableBody.innerHTML = `<tr><td colspan="6" class="table-loading">No presets yet. Add your first one!</td></tr>`;
    return;
  }
  presetsTableBody.innerHTML = presets
    .map(
      (p) => `
    <tr data-id="${p.id}">
      <td><img class="table-thumb" src="${p.imageUrl}" alt="${p.title}" /></td>
      <td>
        <div class="table-title">${p.title}</div>
        <div style="font-size:0.8rem;color:var(--text3);margin-top:2px">${p.description?.substring(0, 50) || ""}${(p.description?.length || 0) > 50 ? "…" : ""}</div>
      </td>
      <td><span class="table-cat">${p.category || "—"}</span></td>
      <td><span class="table-dl">${(p.downloads || 0).toLocaleString()}</span></td>
      <td><span class="table-date">${formatDate(p.createdAt)}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-table-edit" data-id="${p.id}">Edit</button>
          <button class="btn-table-del" data-id="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  // Attach table events
  presetsTableBody.querySelectorAll(".btn-table-edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditTab(btn.dataset.id, presets));
  });
  presetsTableBody.querySelectorAll(".btn-table-del").forEach((btn) => {
    btn.addEventListener("click", () => deletePreset(btn.dataset.id, btn));
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Delete Preset ──────────────────────────────────────── */
async function deletePreset(id, btn) {
  if (!confirm("Delete this preset? This cannot be undone.")) return;
  btn.disabled = true; btn.textContent = "Deleting…";

  try {
    const res = await fetch(`/api/admin/presets/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      showAlert(deleteAlert, "Preset deleted successfully.", "success");
      loadPresets();
    } else {
      showAlert(deleteAlert, data.message || "Delete failed.", "error");
    }
  } catch {
    showAlert(deleteAlert, "Server error.", "error");
  }
}

/* ─── Edit Preset ────────────────────────────────────────── */
function openEditTab(id, presets) {
  const preset = presets.find((p) => p.id === id);
  if (!preset) return;

  editId.value = preset.id;
  editTitle.value = preset.title;
  editCategory.value = preset.category || "";
  editDesc.value = preset.description || "";
  editLink.value = preset.downloadLink || "";

  editAlert.classList.add("hidden");
  showTab("edit");
}

btnSaveEdit.addEventListener("click", async () => {
  const id = editId.value;
  const body = {
    title: editTitle.value.trim(),
    category: editCategory.value.trim(),
    description: editDesc.value.trim(),
    downloadLink: editLink.value.trim(),
  };

  if (!body.title || !body.downloadLink) {
    showAlert(editAlert, "Title and download link are required.", "error"); return;
  }

  btnSaveEdit.disabled = true; btnSaveEdit.textContent = "Saving…";

  try {
    const res = await fetch(`/api/admin/presets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      showAlert(editAlert, "Preset updated!", "success");
      loadPresets();
    } else {
      showAlert(editAlert, data.message || "Update failed.", "error");
    }
  } catch {
    showAlert(editAlert, "Server error.", "error");
  }
  btnSaveEdit.disabled = false; btnSaveEdit.textContent = "Save Changes";
});

/* ─── Add Preset ─────────────────────────────────────────── */
// File upload
let selectedFile = null;

btnBrowse.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("click", (e) => {
  if (!uploadArea.classList.contains("has-file") && e.target !== uploadRemove) fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) setUploadFile(e.target.files[0]);
});

// Drag & drop
uploadArea.addEventListener("dragover", (e) => { e.preventDefault(); uploadArea.classList.add("drag-over"); });
uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("drag-over"));
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) setUploadFile(file);
});

function setUploadFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadPreview.src = e.target.result;
    uploadPreview.style.display = "block";
    uploadPlaceholder.style.display = "none";
    uploadRemove.style.display = "block";
    uploadArea.classList.add("has-file");
  };
  reader.readAsDataURL(file);
}

uploadRemove.addEventListener("click", (e) => {
  e.stopPropagation();
  clearUpload();
});

function clearUpload() {
  selectedFile = null;
  fileInput.value = "";
  uploadPreview.src = "";
  uploadPreview.style.display = "none";
  uploadPlaceholder.style.display = "flex";
  uploadRemove.style.display = "none";
  uploadArea.classList.remove("has-file");
}

// Submit
btnAddPreset.addEventListener("click", async () => {
  const title = fTitle.value.trim();
  const downloadLink = fLink.value.trim();
  const imageUrl = fImageUrl.value.trim();

  if (!title) { showAlert(addAlert, "Title is required.", "error"); return; }
  if (!downloadLink) { showAlert(addAlert, "Download link is required.", "error"); return; }
  if (!selectedFile && !imageUrl) { showAlert(addAlert, "Please upload an image or provide an image URL.", "error"); return; }

  setAddLoading(true);

  const formData = new FormData();
  formData.append("title", title);
  formData.append("category", fCategory.value.trim());
  formData.append("description", fDesc.value.trim());
  formData.append("downloadLink", downloadLink);
  formData.append("imageUrl", imageUrl);
  if (selectedFile) formData.append("image", selectedFile);

  try {
    const res = await fetch("/api/admin/presets", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      showAlert(addAlert, "Preset added successfully! It's now live on the homepage.", "success");
      clearAddForm();
      loadPresets();
    } else {
      showAlert(addAlert, data.message || "Failed to add preset.", "error");
    }
  } catch {
    showAlert(addAlert, "Server error.", "error");
  }
  setAddLoading(false);
});

function setAddLoading(on) {
  addBtnText.textContent = on ? "Adding…" : "Add Preset";
  addSpinner.classList.toggle("hidden", !on);
  btnAddPreset.disabled = on;
}

function clearAddForm() {
  fTitle.value = ""; fCategory.value = ""; fDesc.value = "";
  fLink.value = ""; fImageUrl.value = "";
  clearUpload();
  addAlert.classList.add("hidden");
}

/* ─── Alert Helper ───────────────────────────────────────── */
function showAlert(el, message, type) {
  el.textContent = message;
  el.className = `admin-alert ${type}`;
  el.classList.remove("hidden");
  if (type === "success") setTimeout(() => el.classList.add("hidden"), 5000);
}

/* ─── Init ───────────────────────────────────────────────── */
checkAuth();
