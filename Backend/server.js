import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "../Frontend")));

app.get("/api/info", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress;

    const cleanIp = ip === "::1" ? "" : ip;

    const r = await fetch(
      cleanIp
        ? `https://ipapi.co/${cleanIp}/json/`
        : `https://ipapi.co/json/`
    );

    const d = await r.json();

    res.json({
      ip: d.ip || cleanIp || "Unavailable",
      city: d.city || "Unknown",
      region: d.region || "Unknown",
      country: d.country_name || "Unknown",
      countryCode: d.country_code || "",
      lat: d.latitude || "Unknown",
      lon: d.longitude || "Unknown",
      timezone: d.timezone || "Unknown",
      isp: d.org || "Unknown",
      org: d.org || "Unknown"
    });
  } catch {
    res.status(500).json({ error: "Lookup blocked" });
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
    