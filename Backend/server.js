import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "../Frontend")));
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: Missing SUPABASE_URL or SUPABASE_KEY in .env file.");
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);

// Active users tracking (in-memory)
// sessionId -> last seen timestamp
const activeSessions = new Map();

// Helper to hash IP for storage
function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

app.get("/api/info", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
    const cleanIp = ip === "::1" ? "" : ip;

    const r = await fetch(cleanIp ? `https://ipapi.co/${cleanIp}/json/` : `https://ipapi.co/json/`);
    const d = await r.json();
    
    // Save to Supabase
    if (d.latitude && d.longitude && d.latitude !== "Unknown") {
      const hashedId = hashIp(cleanIp || "localhost");
      
      const { error } = await supabase
        .from('locations')
        .upsert({ 
          id: hashedId, 
          lat: parseFloat(d.latitude), 
          lon: parseFloat(d.longitude), 
          last_seen: Date.now() 
        });
        
      if (error) {
        console.error("Supabase UPSERT Error:", error);
      }
    }

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
  } catch (err) {
    res.status(500).json({ error: "Lookup blocked" });
  }
});

// Endpoint to fetch all locations for the globe
app.get("/api/locations", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('lat, lon');
      
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase GET Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Endpoint to track active online users
app.post("/api/heartbeat", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    activeSessions.set(sessionId, Date.now());
  }
  
  // Cleanup sessions older than 15 seconds
  const cutoff = Date.now() - 15000;
  let activeCount = 0;
  for (const [sId, time] of activeSessions.entries()) {
    if (time < cutoff) {
      activeSessions.delete(sId);
    } else {
      activeCount++;
    }
  }

  res.json({ activeUsers: Math.max(1, activeCount) });
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
  if (!supabaseUrl || !supabaseKey) {
    console.log("⚠️ PLEASE ADD YOUR SUPABASE CREDENTIALS TO A .env FILE TO SAVE LOCATIONS.");
  }
});