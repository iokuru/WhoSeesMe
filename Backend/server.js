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

const columnsToAdd = [
  "ALTER TABLE locations ADD COLUMN browser_fp TEXT",
  "ALTER TABLE locations ADD COLUMN canvas_hash TEXT",
  "ALTER TABLE locations ADD COLUMN webgl_renderer TEXT",
  "ALTER TABLE locations ADD COLUMN env_id TEXT"
];

for (const sql of columnsToAdd) {
  try {
    await db.execute(sql);
  } catch (e) {
    // Column already exists or table freshly created
  }
}

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

app.post("/api/score", async (req, res) => {
  try {
    const { browserFingerprint, environmentId, canvasHash, webglRenderer } = req.body || {};
    const ip = getClientIp(req);
    const visitorKey = (ip || "local") + "_" + (browserFingerprint || "anon");
    const id = hash(visitorKey);

    await db.execute({
      sql: `
        INSERT INTO locations (id, lat, lon, last_seen, browser_fp, canvas_hash, webgl_renderer, env_id)
        VALUES (?, 0, 0, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          browser_fp = COALESCE(excluded.browser_fp, locations.browser_fp),
          canvas_hash = COALESCE(excluded.canvas_hash, locations.canvas_hash),
          webgl_renderer = COALESCE(excluded.webgl_renderer, locations.webgl_renderer),
          env_id = COALESCE(excluded.env_id, locations.env_id),
          last_seen = excluded.last_seen
      `,
      args: [
        id,
        Date.now(),
        browserFingerprint || null,
        canvasHash || null,
        webglRenderer || null,
        environmentId || null
      ],
    });

    const result = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN browser_fp = ? THEN 1 ELSE 0 END) as fp_matches,
          SUM(CASE WHEN canvas_hash = ? THEN 1 ELSE 0 END) as canvas_matches,
          SUM(CASE WHEN webgl_renderer = ? THEN 1 ELSE 0 END) as webgl_matches,
          SUM(CASE WHEN env_id = ? THEN 1 ELSE 0 END) as env_matches
        FROM locations
        WHERE browser_fp IS NOT NULL
      `,
      args: [
        browserFingerprint || "",
        canvasHash || "",
        webglRenderer || "",
        environmentId || ""
      ],
    });

    const stats = result.rows[0] || {};
    const total = Number(stats.total) || 1;
    const fpMatches = Number(stats.fp_matches) || 1;
    const canvasMatches = Number(stats.canvas_matches) || 1;
    const webglMatches = Number(stats.webgl_matches) || 1;
    const envMatches = Number(stats.env_matches) || 1;

    let score = 94;
    let tier = "HIGH RISK";
    let explanation = "";

    if (total <= 1) {
      score = 95;
      tier = "HIGH RISK";
      explanation = "1 of 1 recorded visitors (100% unique in database). High canvas & GPU entropy.";
    } else {
      const fpUniqueness = (total - fpMatches + 1) / total;
      const canvasUniqueness = (total - canvasMatches + 1) / total;
      const webglUniqueness = (total - webglMatches + 1) / total;
      const envUniqueness = (total - envMatches + 1) / total;

      const composite = (fpUniqueness * 0.40) + (canvasUniqueness * 0.25) + (webglUniqueness * 0.20) + (envUniqueness * 0.15);
      score = Math.max(10, Math.min(99, Math.round(composite * 100)));

      if (score >= 80) {
        tier = "HIGH RISK";
      } else if (score >= 50) {
        tier = "MODERATE";
      } else {
        tier = "LOW RISK";
      }

      if (fpMatches === 1) {
        explanation = `Unique signature: 1 of ${total} visitors in database shares this profile (${score}% trackability).`;
      } else {
        explanation = `Collision detected: ${fpMatches} of ${total} visitors share this profile (${score}% trackability).`;
      }
    }

    res.json({
      score,
      tier,
      explanation,
      totalVisitors: total,
      fpMatches,
      canvasMatches,
      webglMatches,
      envMatches,
    });
  } catch (err) {
    console.error("[api/score]", err.message);
    res.status(500).json({ error: "Failed to compute uniqueness score" });
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