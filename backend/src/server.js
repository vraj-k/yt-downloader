import express from "express";
import cors from "cors";
import ytdlp from "yt-dlp-exec";
import { randomUUID } from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

const YOUTUBE_URL_RE = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i;

function assertValidUrl(url) {
  if (typeof url !== "string" || !YOUTUBE_URL_RE.test(url)) {
    throw new Error("Invalid YouTube URL");
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/info", async (req, res) => {
  const { url } = req.body || {};
  try {
    assertValidUrl(url);
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      jsRuntimes: "deno",
    });

    const formats = (info.formats || [])
      .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
      .map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.height ? `${f.height}p` : f.format_note || "audio",
        hasVideo: f.vcodec !== "none",
        hasAudio: f.acodec !== "none",
        filesize: f.filesize || f.filesize_approx || null,
        fps: f.fps || null,
      }))
      .filter((f) => f.hasVideo || f.hasAudio);

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to fetch video info" });
  }
});

app.get("/api/download", async (req, res) => {
  const { url, mode, formatId } = req.query;
  try {
    assertValidUrl(url);
    if (!["mp3", "mp4"].includes(mode)) {
      throw new Error("mode must be mp3 or mp4");
    }

    const filename = `${randomUUID()}.${mode}`;
    res.setHeader("Content-Disposition", `attachment; filename="download.${mode}"`);
    res.setHeader("Content-Type", mode === "mp3" ? "audio/mpeg" : "video/mp4");

    const args =
      mode === "mp3"
        ? { extractAudio: true, audioFormat: "mp3", audioQuality: 0, output: "-", jsRuntimes: "deno" }
        : {
            format: formatId ? `${formatId}+bestaudio/best` : "bestvideo+bestaudio/best",
            mergeOutputFormat: "mp4",
            output: "-",
            jsRuntimes: "deno",
          };

    const subprocess = ytdlp.exec(url, args);
    subprocess.stdout.pipe(res);
    subprocess.stderr.on("data", () => {});
    subprocess.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    req.on("close", () => subprocess.kill());
  } catch (err) {
    res.status(400).json({ error: err.message || "Download failed" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
