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
     SUPABASE INITIALIZATION
  ========================= */
  const SUPABASE_URL = "https://vupfzmrchajjheeerfje.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_gLxSAgV7xQYJ0uCRjy3CVQ_yT3HEPoT";
  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  async function hashIp(ip) {
    const msgUint8 = new TextEncoder().encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* =========================
     LOCATION & LIVE TRACKING
  ========================= */
  const sessionId = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');

  if (supabase) {
    const room = supabase.channel('online-users');
    
    room.on('presence', { event: 'sync' }, () => {
      const newState = room.presenceState();
      let count = 0;
      for (const key in newState) {
        count += newState[key].length;
      }
      if (document.getElementById("onlineCounter")) {
        document.getElementById("onlineCounter").textContent = Math.max(1, count);
      }
    });

    room.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await room.track({
          online_at: new Date().toISOString(),
          session_id: sessionId
        });
      }
    });
  }

  try {
    const res = await fetch("https://ipapi.co/json/");
    const d = await res.json();

    const ip = d.ip || "Unknown";
    set("ipaddress", ip);
    set("city", d.city || "Unknown");
    set("region", d.region || "Unknown");
    set("country", d.country_name ? `${d.country_name} (${d.country_code})` : "Unknown");
    set("coordinates", d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : "Unknown");
    set("isp", d.org || "Unknown");

    let validLat = 40.7128;
    let validLon = -74.0060;

    if (d.latitude && d.longitude && d.latitude !== "Unknown") {
      validLat = parseFloat(d.latitude);
      validLon = parseFloat(d.longitude);

      if (supabase && ip !== "Unknown") {
        const hashedId = await hashIp(ip);
        supabase.from('locations').upsert({
          id: hashedId,
          lat: validLat,
          lon: validLon,
          last_seen: Date.now()
        }).then(({ error }) => {
          if (error) console.error("Supabase UPSERT Error:", error);
        });
      }
    }

    let allLocations = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('locations').select('lat, lon');
        if (!error && data) {
          allLocations = data;
        }
      } catch(e) {}
    }

    initGlobe(validLat, validLon, allLocations);
  } catch (err) {
    // Fallback if network fails: New York City
    initGlobe(40.7128, -74.0060, []);
  }

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

/* =========================
   GLOBE INITIALIZATION
========================= */
function initGlobe(lat, lon, allLocations = []) {
    if (!window.Cesium) return;
    
    // Convert to numbers
    lat = parseFloat(lat);
    lon = parseFloat(lon);

    Cesium.Ion.defaultAccessToken = '';

    const viewer = new Cesium.Viewer("cesiumContainer", {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: false,
      shouldAnimate: true,
    });

    // Remove default imagery and add OSM exactly like yourinfo project
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      })
    );




    const creditContainer = viewer.cesiumWidget.creditContainer;
    if (creditContainer) creditContainer.style.display = 'none';

    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0b0b0b');
    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = false;
    if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
    if (viewer.scene.sun) viewer.scene.sun.show = false;
    if (viewer.scene.moon) viewer.scene.moon.show = false;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a1a2e');
    viewer.scene.globe.maximumScreenSpaceError = 1;

    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    viewer.scene.screenSpaceCameraController.enableLook = true;
    
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH,
    ];
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [
      Cesium.CameraEventType.PINCH,
      Cesium.CameraEventType.RIGHT_DRAG,
    ];

    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;
    viewer.scene.screenSpaceCameraController.zoomFactor = 10;
    
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomAmount = -e.deltaY * 0.01;
        const camera = viewer.camera;
        const cameraHeight = camera.positionCartographic.height;
        const zoomFactor = cameraHeight * zoomAmount * 0.5;
        camera.zoomIn(zoomFactor);
      }
    };
    viewer.canvas.addEventListener('wheel', handleWheel, { passive: false });

    let lastTime = Date.now();
    let isUserInteracting = false;
    let resumeTimeout = null;

    const rotate = () => {
      if (isUserInteracting) return;
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, delta * 0.05);
    };

    viewer.clock.onTick.addEventListener(rotate);

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const pauseRotation = () => {
      isUserInteracting = true;
      lastTime = Date.now();
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };

    const scheduleResumeRotation = () => {
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isUserInteracting = false;
        lastTime = Date.now();
      }, 3000);
    };

    handler.setInputAction(pauseRotation, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(pauseRotation, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
    handler.setInputAction(pauseRotation, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    handler.setInputAction(pauseRotation, Cesium.ScreenSpaceEventType.WHEEL);

    handler.setInputAction(scheduleResumeRotation, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction(scheduleResumeRotation, Cesium.ScreenSpaceEventType.RIGHT_UP);
    handler.setInputAction(scheduleResumeRotation, Cesium.ScreenSpaceEventType.MIDDLE_UP);

    const YELLOW = Cesium.Color.fromCssColorString('#FFE500');

    if (!allLocations || allLocations.length === 0) {
      allLocations = [{ lat, lon }];
    }

    allLocations.forEach(loc => {
      const locLat = parseFloat(loc.lat);
      const locLon = parseFloat(loc.lon);

      if (isNaN(locLat) || isNaN(locLon)) return;

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(locLon, locLat),
        point: {
          pixelSize: 10,
          color: YELLOW,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        }
      });

      // Show pulse/ellipse for current user location
      if (Math.abs(locLat - lat) < 0.0001 && Math.abs(locLon - lon) < 0.0001) {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(locLon, locLat),
          ellipse: {
            semiMinorAxis: 50000,
            semiMajorAxis: 50000,
            material: Cesium.Color.fromCssColorString('#FFE500').withAlpha(0.3),
            outline: true,
            outlineColor: YELLOW,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
      }
    });

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 20000000),
    });
}

});
