# YouTube Downloader

Download YouTube videos as MP3 or MP4 (selectable quality), using [yt-dlp](https://github.com/yt-dlp/yt-dlp).

## Structure
- `backend/` — Express API wrapping yt-dlp (via `yt-dlp-exec`), deploy as a Docker web service on Render.
- `frontend/` — React (Vite) UI, deploy as a static site on Vercel.

## Local development

```bash
cd backend && npm install && npm start   # http://localhost:8080
cd frontend && npm install && npm run dev # http://localhost:5173
```

Frontend reads the backend URL from `VITE_API_BASE` (see `.env.example`); defaults to `http://localhost:8080` locally.

## Deploy

**Backend (Render):**
1. Push this repo to GitHub.
2. New Web Service on Render → pick the repo → Root Directory `backend` → Environment: Docker.
3. Render builds the `Dockerfile` (installs ffmpeg/python for yt-dlp) and exposes port 8080.

**Frontend (Vercel):**
1. New Project on Vercel → pick the repo → Root Directory `frontend`.
2. Framework preset: Vite.
3. Add env var `VITE_API_BASE` = your Render backend URL (e.g. `https://yt-downloader-backend.onrender.com`).

## Legal note
Downloading copyrighted YouTube content may violate YouTube's Terms of Service depending on jurisdiction and use case. Use only for content you own or are licensed to download.
