import { useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [video, setVideo] = useState(null);
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

  function handleDownload(mode) {
    const params = new URLSearchParams({ url, mode });
    if (mode === "mp4" && selectedFormat) params.set("formatId", selectedFormat);
    window.location.href = `${API_BASE}/api/download?${params.toString()}`;
  }

  return (
    <div className="page">
      <h1>YouTube Downloader</h1>
      <p className="subtitle">Download videos as MP3 or MP4 in your chosen quality.</p>

      <form onSubmit={handleFetchInfo} className="url-form">
        <input
          type="url"
          required
          placeholder="Paste a YouTube video URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Fetch"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {video && (
        <div className="result">
          <img src={video.thumbnail} alt="" className="thumb" />
          <h2>{video.title}</h2>

          <div className="actions">
            <button className="primary" onClick={() => handleDownload("mp3")}>
              Download MP3
            </button>

            <div className="mp4-row">
              <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}>
                {video.videoFormats.map((f) => (
                  <option key={f.format_id} value={f.format_id}>
                    {f.resolution} · {f.ext} {f.filesize ? `· ${formatSize(f.filesize)}` : ""}
                  </option>
                ))}
              </select>
              <button className="primary" onClick={() => handleDownload("mp4")}>
                Download MP4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
