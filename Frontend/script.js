document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     UTILITY
  ========================= */

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(16);
  }

  function yesNo(v) {
    return v ? "Yes" : "No";
  }

  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* =========================
     CANVAS FINGERPRINT
  ========================= */

  function getCanvasFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.textBaseline = "top";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(10, 10, 100, 40);
    ctx.fillStyle = "#069";
    ctx.fillText("fingerprint", 12, 20);

    return hash(canvas.toDataURL()).slice(0, 8);
  }

  /* =========================
     WEBGL INFO
  ========================= */

  let webglVendor = "Unavailable";
  let webglRenderer = "Unavailable";
  let webglVersion = "Unavailable";
  let webglExtensions = "0";

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        webglVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        webglRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }

      webglVersion = gl.getParameter(gl.VERSION);
      webglExtensions = gl.getSupportedExtensions().length;
    }
  } catch {}

  /* =========================
     UNIQUE IDS
  ========================= */

  const browserFingerprint =
    "fp_" +
    hash(
      navigator.userAgent +
      screen.width +
      screen.height +
      screen.colorDepth +
      navigator.language +
      navigator.platform
    ).slice(0, 8);

  const environmentId =
    "env_" +
    hash(
      navigator.hardwareConcurrency +
      navigator.deviceMemory +
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ).slice(0, 8);

  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  /* =========================
     SECTIONS
  ========================= */

  const sections = [
    {
      title: "YOUR UNIQUE IDS",
      rows: {
        "Browser Fingerprint": browserFingerprint,
        "Environment ID": environmentId,
        "Canvas Hash": getCanvasFingerprint(),
        "Consistency Confidence": "Local only"
      }
    },
    {
      title: "LOCATION",
      rows: {
        "IP Address": "Loading...",
        "City": "Loading...",
        "Region": "Loading...",
        "Country": "Loading...",
        "Coordinates": "Loading...",
        "Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        "ISP": "Loading..."
      }
    },
    {
      title: "DEVICE SPECIFICATIONS",
      rows: {
        "Screen Resolution": `${screen.width}x${screen.height}`,
        "Window Size": `${window.innerWidth}x${window.innerHeight}`,
        "Color Depth": `${screen.colorDepth}-bit`,
        "Pixel Ratio": `${devicePixelRatio}x`,
        "CPU Cores": navigator.hardwareConcurrency || "N/A",
        "RAM Estimate": navigator.deviceMemory
          ? navigator.deviceMemory + " GB"
          : "N/A",
        "Platform": navigator.platform,
        "Language": navigator.language
      }
    },
    {
      title: "NETWORK",
      rows: {
        "Connection Type": connection?.effectiveType || "Unknown",
        "Downlink": connection?.downlink
          ? connection.downlink + " Mbps"
          : "Unknown",
        "RTT": connection?.rtt ? connection.rtt + " ms" : "Unknown",
        "Data Saver": connection?.saveData ? "Enabled" : "Disabled"
      }
    },
    {
      title: "BROWSER",
      rows: {
        "User Agent": navigator.userAgent,
        "Languages": navigator.languages?.join(", ") || navigator.language,
        "History Length": history.length,
        "Do Not Track": navigator.doNotTrack === "1" ? "Yes" : "No",
        "Global Privacy Control": navigator.globalPrivacyControl ? "Yes" : "No",
        "Cookies Enabled": yesNo(navigator.cookieEnabled),
        "LocalStorage": yesNo(!!window.localStorage),
        "SessionStorage": yesNo(!!window.sessionStorage),
        "IndexedDB": yesNo(!!window.indexedDB)
      }
    },
    {
      title: "WEB APIS",
      rows: {
        "Service Worker": yesNo("serviceWorker" in navigator),
        "Web Worker": yesNo(!!window.Worker),
        "WebAssembly": yesNo(!!window.WebAssembly),
        "WebSocket": yesNo(!!window.WebSocket),
        "WebRTC": yesNo(!!window.RTCPeerConnection),
        "Notifications": yesNo("Notification" in window),
        "Push API": yesNo("PushManager" in window),
        "Clipboard API": yesNo(!!navigator.clipboard)
      }
    },
    {
      title: "HARDWARE",
      rows: {
        "WebGL Vendor": webglVendor,
        "WebGL Renderer": webglRenderer,
        "WebGL Version": webglVersion,
        "WebGL Extensions Count": webglExtensions
      }
    },
    {
      title: "JS MEMORY",
      rows: {
        "Heap Limit": performance.memory
          ? Math.round(performance.memory.jsHeapSizeLimit / 1048576) + " MB"
          : "Unavailable",
        "Used Heap": performance.memory
          ? Math.round(performance.memory.usedJSHeapSize / 1048576) + " MB"
          : "Unavailable"
      }
    },
    {
      title: "STORAGE",
      rows: {
        "Used": "Loading...",
        "Quota": "Loading..."
      }
    },
    {
      title: "MEDIA DEVICES",
      rows: {
        "Microphones": "Loading...",
        "Cameras": "Loading...",
        "Speakers": "Loading..."
      }
    },
    {
      title: "MOUSE BEHAVIOR",
      rows: {
        "Speed": "0 px/s",
        "Acceleration": "0",
        "Movements": "0",
        "Distance": "0 px",
        "Idle Time": "0s",
        "Clicks": "0",
        "Click Interval": "0ms"
      }
    }
  ];

  const content = document.getElementById("content");
  content.innerHTML = "";

  sections.forEach(section => {
    const box = document.createElement("div");
    box.className = "section";

    const header = document.createElement("div");
    header.className = "section-title";
    header.textContent = section.title;
    box.appendChild(header);

    Object.entries(section.rows).forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "row";

      const key = document.createElement("span");
      key.textContent = label;

      const val = document.createElement("span");
      val.textContent = value;
      val.id = label.toLowerCase().replace(/[^a-z]/g, "");

      row.appendChild(key);
      row.appendChild(val);
      box.appendChild(row);
    });

    content.appendChild(box);
  });

  /* =========================
     STORAGE ESTIMATE
  ========================= */

  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    set("used", (estimate.usage / 1048576).toFixed(2) + " MB");
    set("quota", (estimate.quota / 1048576).toFixed(2) + " MB");
  }

  /* =========================
     MEDIA DEVICES
  ========================= */

  if (navigator.mediaDevices?.enumerateDevices) {
    const devices = await navigator.mediaDevices.enumerateDevices();

    set("microphones", devices.filter(d => d.kind === "audioinput").length);
    set("cameras", devices.filter(d => d.kind === "videoinput").length);
    set("speakers", devices.filter(d => d.kind === "audiooutput").length);
  }

  /* =========================
     BACKEND LOCATION
  ========================= */

  try {
    const res = await fetch("/api/info");
    const d = await res.json();

    set("ipaddress", d.ip || "Unknown");
    set("city", d.city || "Unknown");
    set("region", d.region || "Unknown");
    set("country", d.country ? `${d.country} (${d.countryCode})` : "Unknown");
    set("coordinates", d.lat && d.lon ? `${d.lat}, ${d.lon}` : "Unknown");
    set("isp", d.isp || "Unknown");
  } catch {}

  /* =========================
     STABLE MOUSE TRACKING
  ========================= */

  let lastX = null;
  let lastY = null;
  let lastTime = performance.now();

  let totalDistance = 0;
  let movements = 0;
  let clicks = 0;
  let lastClickTime = 0;

  let speedSamples = [];
  const MAX_SAMPLES = 6;
  let lastSpeed = 0;
  let lastMoveTime = performance.now();

  document.addEventListener("mousemove", e => {
    const now = performance.now();

    if (lastX !== null) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dt = (now - lastTime) / 1000;

      if (dt > 0.01) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / dt;

        totalDistance += distance;
        movements++;

        speedSamples.push(speed);
        if (speedSamples.length > MAX_SAMPLES) speedSamples.shift();

        const avgSpeed =
          speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;

        const acceleration = -(avgSpeed - lastSpeed) / dt;
        lastSpeed = avgSpeed;

        set("speed", avgSpeed.toFixed(2) + " px/s");
        set("acceleration", acceleration.toFixed(2));
        set("movements", movements);
        set("distance", Math.round(totalDistance) + " px");
      }
    }

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;
    lastMoveTime = now;
  });

  document.addEventListener("click", () => {
    clicks++;
    set("clicks", clicks);

    const now = performance.now();
    if (lastClickTime) {
      set("clickinterval", Math.round(now - lastClickTime) + "ms");
    }
    lastClickTime = now;
  });

  setInterval(() => {
    const idle = Math.floor((performance.now() - lastMoveTime) / 1000);
    set("idletime", idle + "s");
  }, 1000);

  /* =========================
   SESSION TIMER
========================= */

const sessionStart = Date.now();
const sessionEl = document.getElementById("sessionTime");

if (sessionEl) {
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);

    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");

    sessionEl.textContent = minutes + ":" + seconds;
  }, 1000);
}

/* =========================
   COPY / PASTE TRACKING
========================= */

let textSelections = 0;
let copyCount = 0;
let pasteCount = 0;
let rightClicks = 0;
let screenshotAttempts = 0;

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection().toString().trim();
  if (selection.length > 0) {
    textSelections++;
    document.getElementById("textselections").textContent = textSelections;
    document.getElementById("lastselected").textContent = selection.slice(0, 60);
  }
});

document.addEventListener("copy", () => {
  copyCount++;
  document.getElementById("copies").textContent = copyCount;
});

document.addEventListener("paste", () => {
  pasteCount++;
  document.getElementById("pastes").textContent = pasteCount;
});

document.addEventListener("contextmenu", () => {
  rightClicks++;
  document.getElementById("rightclicks").textContent = rightClicks;
});

document.addEventListener("keydown", e => {
  if (e.key === "PrintScreen") {
    screenshotAttempts++;
    document.getElementById("screenshotattempts").textContent = screenshotAttempts;
  }

  if (e.metaKey) {
    document.getElementById("cmdmeta").textContent = "Used";
  }

  if (e.metaKey && e.shiftKey) {
    document.getElementById("cmdshift").textContent = "Used";
  }
});

/* =========================
   PRIVACY TIPS (EXACT MATCH)
========================= */

const tipsBox = document.createElement("div");
tipsBox.className = "section privacy-wrapper";

const tipsHeader = document.createElement("div");
tipsHeader.className = "section-title";
tipsHeader.textContent = "PRIVACY TIPS";

const tipsBody = document.createElement("div");
tipsBody.className = "privacy-card";

tipsBody.innerHTML = `
<div class="privacy-badge">!!</div>
<ul>
  <li>Use a VPN to mask your IP address</li>
  <li>Enable Do Not Track in your browser</li>
  <li>Use privacy-focused browsers like Firefox or Brave</li>
  <li>Consider using browser extensions to block fingerprinting</li>
  <li>Disable WebRTC to prevent local IP leaks</li>
  <li>Regularly clear cookies and browsing data</li>
  <li>Use Tor Browser for maximum anonymity</li>
  <li>Your mouse movements, typing patterns, and scroll behavior create a unique fingerprint</li>
</ul>
`;

tipsBox.appendChild(tipsHeader);
tipsBox.appendChild(tipsBody);
content.appendChild(tipsBox);


});
