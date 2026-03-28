# 🔥 MAD EDITZZZ

A premium, dynamic photo editing preset-sharing website. Users browse presets, wait 30 seconds, then unlock a Google Drive download link. Admins manage everything through a protected panel.

---

## 📁 Project Structure

```
mad-editzzz/
├── server.js              # Express backend
├── package.json
├── .env.example           # Environment variable template
├── railway.toml           # Railway deployment config
├── data/
│   └── presets.json       # Preset database (auto-updated)
└── public/                # All static files served by Express
    ├── index.html         # Homepage
    ├── admin.html         # Admin panel
    ├── favicon.svg
    ├── css/
    │   ├── style.css      # Homepage styles
    │   └── admin.css      # Admin panel styles
    ├── js/
    │   ├── main.js        # Homepage logic
    │   └── admin.js       # Admin panel logic
    └── uploads/           # Uploaded preset images (auto-created)
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js v16+ ([nodejs.org](https://nodejs.org))
- npm (comes with Node.js)

### Steps

1. **Install dependencies**
   ```bash
   cd mad-editzzz
   npm install
   ```

2. **Set up environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env to change admin credentials
   ```

3. **Start the server**
   ```bash
   npm start
   # or for auto-reload during development:
   npm run dev
   ```

4. **Open in browser**
   - Homepage: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `madeditzzz123`

> ⚠️ Change these in `.env` or in `server.js` before deploying!

---

## 👤 Admin Panel Guide

1. Go to `/admin` and log in
2. **Presets tab** — View all presets, edit or delete any preset
3. **Add Preset tab** — Upload an image + paste your Google Drive link
   - Upload a JPG/PNG/WEBP image (max 10MB)
   - OR paste an external image URL
   - Add title, category, description, and Google Drive download link
   - Hit "Add Preset" — it goes live on the homepage instantly!

### Getting a Google Drive Download Link
1. Upload your `.xmp` or `.lrtemplate` file to Google Drive
2. Right-click → **Share** → **Anyone with the link** → **Copy link**
3. Paste that link into the "Download Link" field

---

## 🌐 Deployment

### Option 1: Railway (Recommended — Free tier)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables in Railway dashboard:
   - `ADMIN_USER` = your username
   - `ADMIN_PASS` = your password
   - `SESSION_SECRET` = a long random string
5. Railway auto-deploys. Your site is live!

> **Note:** Railway's free tier has ephemeral storage — uploaded images reset on redeploy. For persistent images, use Cloudinary or an external image URL.

### Option 2: Render

1. Push to GitHub
2. [render.com](https://render.com) → New Web Service → Connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars in Render dashboard

### Option 3: Firebase (Alternative — Static + Cloud Functions)

For a fully serverless version, the backend can be converted to Firebase Cloud Functions with Firestore as the database. Contact the dev for this setup.

---

## 🔧 Customization

### Change the 30-second timer
In `public/js/main.js`, find:
```js
const TIMER_DURATION = 30; // seconds
```
Change `30` to any number.

### Change admin password
In `.env`:
```
ADMIN_USER=yourusername
ADMIN_PASS=yourpassword
```

### Add more preset categories
Just type any category name when adding a preset — it automatically appears as a filter pill on the homepage.

### Change accent color (orange → any color)
In `public/css/style.css`, change:
```css
--accent: #ff3d00;
```

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS |
| Backend | Node.js + Express |
| Storage | JSON file (data/presets.json) |
| File Uploads | Multer |
| Sessions | express-session |
| Fonts | Google Fonts (Bebas Neue, Rajdhani, Space Mono) |

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/presets` | Get all presets (no download links) |
| GET | `/api/presets/:id/download` | Get download link + increment count |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/check` | Check session |
| GET | `/api/admin/presets` | Get all presets with links (auth) |
| POST | `/api/admin/presets` | Add new preset (auth) |
| PUT | `/api/admin/presets/:id` | Update preset (auth) |
| DELETE | `/api/admin/presets/:id` | Delete preset (auth) |

---

Made with 🔥 by MAD EDITZZZ
