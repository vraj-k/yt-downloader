import { useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [video, setVideo] = useState(null);
  const [mode, setMode] = useState("mp4");
  const [selectedFormat, setSelectedFormat] = useState("");

  async function handleFetchInfo(e) {
    e.preventDefault();
    setError("");
    setVideo(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch video info");

      const videoFormats = data.formats
        .filter((f) => f.hasVideo)
        .sort((a, b) => (b.resolution || "").localeCompare(a.resolution || ""));

      setVideo({ ...data, videoFormats });
      setSelectedFormat(videoFormats[0]?.format_id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const params = new URLSearchParams({ url, mode });
    if (mode === "mp4" && selectedFormat) params.set("formatId", selectedFormat);
    window.location.href = `${API_BASE}/api/download?${params.toString()}`;
  }

  return (
    <div className="page">
      <div className="glow" />

      <header className="hero">
        <span className="badge">Free · No watermark · No signup</span>
        <h1>
          YouTube <span className="accent">Downloader</span>
        </h1>
        <p className="subtitle">Paste a link, pick a format and quality, get your file.</p>
      </header>

      <form onSubmit={handleFetchInfo} className="url-form">
        <input
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : "Fetch"}
        </button>
      </form>

      {error && <p className="error">⚠ {error}</p>}

      {video && (
        <div className="card">
          <div className="card-top">
            <img src={video.thumbnail} alt="" className="thumb" />
            <div className="meta">
              <h2>{video.title}</h2>
              {video.duration && <span className="duration">{formatDuration(video.duration)}</span>}
            </div>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={mode === "mp4" ? "tab active" : "tab"}
              onClick={() => setMode("mp4")}
            >
              Video (MP4)
            </button>
            <button
              type="button"
              className={mode === "mp3" ? "tab active" : "tab"}
              onClick={() => setMode("mp3")}
            >
              Audio (MP3)
            </button>
          </div>

          <div className="panel">
            {mode === "mp4" && (
              <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}>
                {video.videoFormats.map((f) => (
                  <option key={f.format_id} value={f.format_id}>
                    {f.resolution} · {f.ext} {f.filesize ? `· ${formatSize(f.filesize)}` : ""}
                  </option>
                ))}
              </select>
            )}
            {mode === "mp3" && <p className="hint">Best available audio quality, converted to MP3.</p>}

            <button className="download" onClick={handleDownload}>
              Download {mode.toUpperCase()}
            </button>
          </div>
        </div>
      )}

      <footer>
        Powered by <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer">yt-dlp</a>
      </footer>
    </div>
  );
}

export default App;
