/**
 * MAD EDITZZZ - Backend Server
 * Node.js + Express
 */

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "madeditzzz_super_secret_key_2024",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // 24h
  })
);

// ─── File Upload Config ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `preset_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files (JPG, PNG, WEBP) are allowed"));
  },
});

// ─── Admin Credentials ────────────────────────────────────────────────────────
// CHANGE THESE IN PRODUCTION!
const ADMIN_USERNAME = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "madeditzzz123";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DATA_PATH = path.join(__dirname, "data", "presets.json");

function readPresets() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { presets: [] };
  }
}

function writePresets(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isAuthenticated(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ success: false, message: "Unauthorized" });
}

// ─── Routes: Static Pages ────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ─── Routes: API ─────────────────────────────────────────────────────────────

// GET all presets
app.get("/api/presets", (req, res) => {
  const data = readPresets();
  // Return presets without exposing download link until needed
  const safe = data.presets.map(({ downloadLink, ...rest }) => rest);
  res.json({ success: true, presets: safe });
});

// GET single preset download link (after timer)
app.get("/api/presets/:id/download", (req, res) => {
  const data = readPresets();
  const preset = data.presets.find((p) => p.id === req.params.id);
  if (!preset) return res.status(404).json({ success: false, message: "Preset not found" });

  // Increment download count
  preset.downloads = (preset.downloads || 0) + 1;
  writePresets(data);

  res.json({ success: true, downloadLink: preset.downloadLink });
});

// POST admin login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: "Logged in successfully" });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// POST admin logout
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET admin check session
app.get("/api/admin/check", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// GET all presets (admin – includes download links)
app.get("/api/admin/presets", isAuthenticated, (req, res) => {
  const data = readPresets();
  res.json({ success: true, presets: data.presets });
});

// POST add new preset (admin)
app.post("/api/admin/presets", isAuthenticated, upload.single("image"), (req, res) => {
  const { title, category, description, downloadLink, imageUrl } = req.body;

  if (!title || !downloadLink) {
    return res.status(400).json({ success: false, message: "Title and download link are required" });
  }

  const data = readPresets();

  // Use uploaded file or external URL
  let finalImageUrl = imageUrl || "";
  if (req.file) {
    finalImageUrl = `/uploads/${req.file.filename}`;
  }

  if (!finalImageUrl) {
    return res.status(400).json({ success: false, message: "Image file or URL is required" });
  }

  const newPreset = {
    id: Date.now().toString(),
    title: title.trim(),
    category: category?.trim() || "General",
    description: description?.trim() || "",
    imageUrl: finalImageUrl,
    downloadLink: downloadLink.trim(),
    downloads: 0,
    createdAt: new Date().toISOString(),
  };

  data.presets.unshift(newPreset); // Add to top
  writePresets(data);

  res.json({ success: true, message: "Preset added successfully", preset: newPreset });
});

// DELETE preset (admin)
app.delete("/api/admin/presets/:id", isAuthenticated, (req, res) => {
  const data = readPresets();
  const idx = data.presets.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Not found" });

  // Delete uploaded file if local
  const preset = data.presets[idx];
  if (preset.imageUrl.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, "public", preset.imageUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  data.presets.splice(idx, 1);
  writePresets(data);

  res.json({ success: true, message: "Preset deleted" });
});

// PUT update preset (admin)
app.put("/api/admin/presets/:id", isAuthenticated, (req, res) => {
  const data = readPresets();
  const preset = data.presets.find((p) => p.id === req.params.id);
  if (!preset) return res.status(404).json({ success: false, message: "Not found" });

  const { title, category, description, downloadLink } = req.body;
  if (title) preset.title = title.trim();
  if (category) preset.category = category.trim();
  if (description !== undefined) preset.description = description.trim();
  if (downloadLink) preset.downloadLink = downloadLink.trim();

  writePresets(data);
  res.json({ success: true, message: "Preset updated", preset });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔥 MAD EDITZZZ server running at http://localhost:${PORT}`);
  console.log(`📸 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔑 Admin login: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}\n`);
});
