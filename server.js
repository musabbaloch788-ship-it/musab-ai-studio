import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Configure these as server-side environment variables in your host.
// Never put your provider API key in public/index.html.
const API_KEY = process.env.VIDEO_API_KEY;
const API_URL = process.env.VIDEO_API_URL; // Provider's documented generation endpoint
const API_MODEL = process.env.VIDEO_MODEL || "";

// Basic daily quota: up to 3 generation requests per client IP per UTC day.
// In-memory storage is suitable for a demo, but resets when the server restarts
// and is not shared across multiple server instances. Use a persistent database
// for a reliable production quota.
const DAILY_LIMIT = 3;
const dailyUsage = new Map();
function quotaKey(req) {
  // Configure TRUST_PROXY=1 only when deployed behind a trusted proxy.
  const forwarded = process.env.TRUST_PROXY === "1" ? req.headers["x-forwarded-for"]?.split(",")[0]?.trim() : "";
  return forwarded || req.socket.remoteAddress || "unknown";
}
function utcDay() { return new Date().toISOString().slice(0, 10); }
function usageFor(key) {
  const day = utcDay();
  let entry = dailyUsage.get(key);
  if (!entry || entry.day !== day) entry = { day, count: 0 };
  dailyUsage.set(key, entry);
  return entry;
}

app.get("/api/config", (_req, res) => {
  res.json({ configured: Boolean(API_KEY && API_URL), model: API_MODEL || "API not configured" });
});

app.post("/api/generate", async (req, res) => {
  const { prompt, duration = 15, aspectRatio = "9:16" } = req.body || {};
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Please enter a video prompt." });
  }
  const key = quotaKey(req);
  const usage = usageFor(key);
  if (usage.count >= DAILY_LIMIT) {
    return res.status(429).json({
      error: "Daily limit reached: you can generate up to 3 videos per day. Please try again tomorrow.",
      limit: DAILY_LIMIT,
      used: usage.count,
      resetsAt: "00:00 UTC"
    });
  }

  if (!API_KEY || !API_URL) {
    return res.status(503).json({
      error: "Video API is not connected yet. Admin: add VIDEO_API_KEY and VIDEO_API_URL in your hosting environment."
    });
  }

  // Provider-specific request formats differ. Adapt this payload and response parsing
  // to the API provider's official documentation before enabling real generation.
  try {
    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: API_MODEL || undefined,
        prompt: prompt.trim(),
        duration: Number(duration),
        aspect_ratio: aspectRatio
      })
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { raw }; }
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || data?.message || "Video provider returned an error."
      });
    }
    // Adjust this mapping to the provider's response schema.
    usage.count += 1;
    dailyUsage.set(key, usage);
    const videoUrl = data.video_url || data.url || data.output?.url || data.data?.[0]?.url;
    return res.json({ status: data.status || "submitted", videoUrl: videoUrl || null, remainingToday: Math.max(0, DAILY_LIMIT - usage.count), providerResponse: videoUrl ? undefined : data });
  } catch (err) {
    console.error("Video API request failed:", err.message);
    return res.status(502).json({ error: "Could not reach the video provider. Check server configuration." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`MUSAB AI STUDIO running on port ${PORT}`));
