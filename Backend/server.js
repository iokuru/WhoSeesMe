import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, "../Frontend")));
app.use(express.json());

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    last_seen INTEGER NOT NULL
  )
`);

const sessions = new Map();
const TTL_MS = 15000;

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
  return raw === "::1" || raw === "127.0.0.1" ? "" : raw;
};

const hash = (str) => crypto.createHash("sha256").update(str).digest("hex");

app.get("/api/info", async (req, res) => {
  try {
    const ip = getClientIp(req);
    const endpoint = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
    
    const upstream = await fetch(endpoint, {
      headers: { "User-Agent": "location-tracker/1.0" }
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: "GeoIP resolver unreachable" });
    }

    const data = await upstream.json();

    if (data.latitude && data.longitude && !isNaN(data.latitude)) {
      const id = hash(ip || "localhost");
      
      db.execute({
        sql: `
          INSERT INTO locations (id, lat, lon, last_seen)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            lat = excluded.lat,
            lon = excluded.lon,
            last_seen = excluded.last_seen
        `,
        args: [id, Number(data.latitude), Number(data.longitude), Date.now()],
      }).catch((err) => console.error("[db] upsert failed:", err.message));
    }

    res.json({
      ip: data.ip || ip || "127.0.0.1",
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country_name || "Unknown",
      countryCode: data.country_code || "",
      lat: data.latitude ?? null,
      lon: data.longitude ?? null,
      timezone: data.timezone || "UTC",
      isp: data.org || "Unknown",
    });
  } catch (err) {
    console.error("[api/info]", err.message);
    res.status(500).json({ error: "Failed to resolve geolocation" });
  }
});

app.get("/api/locations", async (req, res) => {
  try {
    const { rows } = await db.execute("SELECT lat, lon FROM locations");
    res.json(rows);
  } catch (err) {
    console.error("[api/locations]", err.message);
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/heartbeat", (req, res) => {
  const { sessionId } = req.body;
  const now = Date.now();

  if (sessionId) {
    sessions.set(sessionId, now);
  }

  for (const [id, ts] of sessions.entries()) {
    if (now - ts > TTL_MS) {
      sessions.delete(id);
    }
  }

  res.json({ activeUsers: Math.max(1, sessions.size) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});