/**
 * MAD EDITZZZ - VERCEL SAFE SERVER
 * No filesystem write (fixes EROFS error)
 */

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "madeditzzz_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

// ─── MULTER (MEMORY STORAGE - FIXED) ────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ─── ADMIN ──────────────────────────────────────────────────
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "madeditzzz123";

// ─── TEMP DATA (IN MEMORY) ─────────────────────────────────
let presetsData = require("./data/presets.json");

// ─── HELPERS ───────────────────────────────────────────────
function readPresets() {
  return presetsData;
}

function writePresets(data) {
  // ❌ Disabled for Vercel
  console.log("⚠️ Data not saved (Vercel read-only)");
}

// ─── AUTH ──────────────────────────────────────────────────
function isAuthenticated(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ success: false, message: "Unauthorized" });
}

// ─── ROUTES ────────────────────────────────────────────────

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// GET presets
app.get("/api/presets", (req, res) => {
  const data = readPresets();
  res.json({ success: true, presets: data.presets });
});

// DOWNLOAD
app.get("/api/presets/:id/download", (req, res) => {
  const data = readPresets();
  const preset = data.presets.find(p => p.id === req.params.id);

  if (!preset) {
    return res.status(404).json({ success: false });
  }

  preset.downloads = (preset.downloads || 0) + 1;

  res.json({
    success: true,
    downloadLink: preset.driveLink || preset.downloadLink
  });
});

// LOGIN
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

// LOGOUT
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// CHECK
app.get("/api/admin/check", (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// ADMIN GET
app.get("/api/admin/presets", isAuthenticated, (req, res) => {
  const data = readPresets();
  res.json({ success: true, presets: data.presets });
});

// ADD PRESET (NO FILE SAVE)
app.post("/api/admin/presets", isAuthenticated, upload.single("image"), (req, res) => {
  const { title, category, downloadLink, imageUrl } = req.body;

  const newPreset = {
    id: Date.now().toString(),
    title,
    category,
    imageUrl: imageUrl || "https://via.placeholder.com/400",
    downloadLink,
    downloads: 0,
    createdAt: new Date().toISOString()
  };

  presetsData.presets.unshift(newPreset);

  res.json({ success: true, preset: newPreset });
});

// DELETE
app.delete("/api/admin/presets/:id", isAuthenticated, (req, res) => {
  presetsData.presets = presetsData.presets.filter(p => p.id !== req.params.id);

  res.json({ success: true });
});

// UPDATE
app.put("/api/admin/presets/:id", isAuthenticated, (req, res) => {
  const preset = presetsData.presets.find(p => p.id === req.params.id);

  if (!preset) return res.status(404).json({ success: false });

  const { title, category, downloadLink } = req.body;

  if (title) preset.title = title;
  if (category) preset.category = category;
  if (downloadLink) preset.downloadLink = downloadLink;

  res.json({ success: true, preset });
});

// FALLBACK
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START
app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
