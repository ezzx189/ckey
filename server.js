import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const TMP_DIR = "./tmp";

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Endpoint proxy HLS con buffer inicial
app.get("/proxy.m3u8", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Falta url del stream");

  const id = encodeURIComponent(url);
  const streamDir = path.join(TMP_DIR, id);

  if (!fs.existsSync(streamDir)) fs.mkdirSync(streamDir, { recursive: true });

  const m3u8Path = path.join(streamDir, "index.m3u8");

  // Lanzar FFmpeg para generar HLS local
  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-i", url,
    "-c:v", "copy",
    "-c:a", "copy",              // copiar audio directamente
    "-f", "hls",
    "-hls_time", "2",
    "-hls_list_size", "5",
    "-hls_flags", "delete_segments+append_list",
    m3u8Path
  ]);

  ffmpeg.stderr.on("data", (data) => console.log(data.toString()));
  ffmpeg.on("close", (code) => console.log(`FFmpeg finalizó con código ${code}`));

  // Esperar que FFmpeg genere 5 segmentos antes de servir el m3u8 (≈10 s de buffer)
  const checkFile = setInterval(() => {
    const files = fs.readdirSync(streamDir).filter(f => f.endsWith(".ts"));
    if (fs.existsSync(m3u8Path) && files.length >= 5) {
      clearInterval(checkFile);
      res.sendFile(path.resolve(m3u8Path));
    }
  }, 500);
});

// Servir segmentos TS
app.use("/tmp", express.static(TMP_DIR));

app.listen(PORT, () => console.log(`Proxy HLS con buffer inicial escuchando en puerto ${PORT}`));
