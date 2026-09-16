document.addEventListener("DOMContentLoaded", async () => {
  const byId = (id) => document.getElementById(id);
  const setText = (id, val) => {
    const el = byId(id);
    if (el) el.textContent = val;
  };

  const toHexHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
  };

  // Canvas fingerprint
  const getCanvasHash = () => {
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    if (!ctx) return "unavailable";

    cvs.width = 120;
    cvs.height = 30;
    ctx.textBaseline = "top";
    ctx.font = "14px monospace";
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(4, 4, 90, 22);
    ctx.fillStyle = "#006699";
    ctx.fillText("fp_probe", 6, 8);
    return toHexHash(cvs.toDataURL());
  };

  // WebGL hardware probe
  let glVendor = "Unavailable";
  let glRenderer = "Unavailable";
  let glVer = "Unavailable";
  let extCount = 0;

  try {
    const cvs = document.createElement("canvas");
    const gl = cvs.getContext("webgl") || cvs.getContext("experimental-webgl");
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        glVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        glRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }
      glVer = gl.getParameter(gl.VERSION) || "Unavailable";
      extCount = (gl.getSupportedExtensions() || []).length;
    }
  } catch {}

  // IDs & platform traits
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

  const fp = `fp_${toHexHash(
    [
      navigator.userAgent,
      screen.width,
      screen.height,
      screen.colorDepth,
      navigator.language,
      navigator.platform,
    ].join("|")
  )}`;

  const envId = `env_${toHexHash(
    [navigator.hardwareConcurrency, navigator.deviceMemory, tz].join("|")
  )}`;

  // Spec layout
  const sections = [
    {
      title: "YOUR UNIQUE IDS",
      rows: {
        "Browser Fingerprint": fp,
        "Environment ID": envId,
        "Canvas Hash": getCanvasHash(),
        "Consistency Confidence": "Local only",
      },
    },
    {
      title: "LOCATION",
      rows: {
        "IP Address": "Resolving...",
        City: "Resolving...",
        Region: "Resolving...",
        Country: "Resolving...",
        Coordinates: "Resolving...",
        Timezone: tz,
        ISP: "Resolving...",
      },
    },
    {
      title: "DEVICE SPECIFICATIONS",
      rows: {
        "Screen Resolution": `${screen.width}x${screen.height}`,
        "Window Size": `${window.innerWidth}x${window.innerHeight}`,
        "Color Depth": `${screen.colorDepth}-bit`,
        "Pixel Ratio": `${window.devicePixelRatio || 1}x`,
        "CPU Cores": navigator.hardwareConcurrency ?? "N/A",
        "RAM Estimate": navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "N/A",
        Platform: navigator.platform || "Unknown",
        Language: navigator.language,
      },
    },
    {
      title: "NETWORK",
      rows: {
        "Connection Type": conn?.effectiveType || "Unknown",
        Downlink: conn?.downlink ? `${conn.downlink} Mbps` : "Unknown",
        RTT: conn?.rtt ? `${conn.rtt} ms` : "Unknown",
        "Data Saver": conn?.saveData ? "Enabled" : "Disabled",
      },
    },
    {
      title: "BROWSER",
      rows: {
        "User Agent": navigator.userAgent,
        Languages: navigator.languages?.join(", ") || navigator.language,
        "History Length": history.length,
        "Do Not Track": navigator.doNotTrack === "1" ? "Yes" : "No",
        "Global Privacy Control": navigator.globalPrivacyControl ? "Yes" : "No",
        "Cookies Enabled": navigator.cookieEnabled ? "Yes" : "No",
        LocalStorage: window.localStorage ? "Yes" : "No",
        SessionStorage: window.sessionStorage ? "Yes" : "No",
        IndexedDB: window.indexedDB ? "Yes" : "No",
      },
    },
    {
      title: "WEB APIS",
      rows: {
        "Service Worker": "serviceWorker" in navigator ? "Yes" : "No",
        "Web Worker": typeof Worker !== "undefined" ? "Yes" : "No",
        WebAssembly: typeof WebAssembly !== "undefined" ? "Yes" : "No",
        WebSocket: typeof WebSocket !== "undefined" ? "Yes" : "No",
        WebRTC: typeof RTCPeerConnection !== "undefined" ? "Yes" : "No",
        Notifications: typeof Notification !== "undefined" ? "Yes" : "No",
        "Push API": "PushManager" in window ? "Yes" : "No",
        "Clipboard API": !!navigator.clipboard ? "Yes" : "No",
      },
    },
    {
      title: "HARDWARE",
      rows: {
        "WebGL Vendor": glVendor,
        "WebGL Renderer": glRenderer,
        "WebGL Version": glVer,
        "WebGL Extensions Count": extCount,
      },
    },
    {
      title: "JS MEMORY",
      rows: {
        "Heap Limit": performance.memory
          ? `${Math.round(performance.memory.jsHeapSizeLimit / 1048576)} MB`
          : "Unavailable",
        "Used Heap": performance.memory
          ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`
          : "Unavailable",
      },
    },
    {
      title: "STORAGE",
      rows: {
        Used: "Calculating...",
        Quota: "Calculating...",
      },
    },
    {
      title: "MEDIA DEVICES",
      rows: {
        Microphones: "Scanning...",
        Cameras: "Scanning...",
        Speakers: "Scanning...",
      },
    },
    {
      title: "MOUSE BEHAVIOR",
      rows: {
        Speed: "0 px/s",
        Acceleration: "0",
        Movements: "0",
        Distance: "0 px",
        "Idle Time": "0s",
        Clicks: "0",
        "Click Interval": "0ms",
      },
    },
  ];

  // Render spec DOM
  const container = byId("content");
  if (container) {
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    sections.forEach(({ title, rows }) => {
      const card = document.createElement("div");
      card.className = "section";

      const heading = document.createElement("div");
      heading.className = "section-title";
      heading.textContent = title;
      card.appendChild(heading);

      Object.entries(rows).forEach(([key, val]) => {
        const row = document.createElement("div");
        row.className = "row";

        const labelSpan = document.createElement("span");
        labelSpan.textContent = key;

        const valSpan = document.createElement("span");
        valSpan.textContent = val;
        valSpan.id = key.toLowerCase().replace(/[^a-z]/g, "");

        row.appendChild(labelSpan);
        row.appendChild(valSpan);
        card.appendChild(row);
      });

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  // Storage quota inspection
  if (navigator.storage?.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      setText("used", `${(usage / 1048576).toFixed(2)} MB`);
      setText("quota", `${(quota / 1048576).toFixed(2)} MB`);
    } catch {
      setText("used", "Unavailable");
      setText("quota", "Unavailable");
    }
  }

  // Hardware enumerate
  if (navigator.mediaDevices?.enumerateDevices) {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      setText("microphones", devs.filter((d) => d.kind === "audioinput").length);
      setText("cameras", devs.filter((d) => d.kind === "videoinput").length);
      setText("speakers", devs.filter((d) => d.kind === "audiooutput").length);
    } catch {
      setText("microphones", "Denied");
      setText("cameras", "Denied");
      setText("speakers", "Denied");
    }
  }

  // Active session tracking & presence
  const sessionId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const pingPresence = async () => {
    try {
      const res = await fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const { activeUsers } = await res.json();
        setText("onlineCounter", activeUsers ?? 1);
      }
    } catch {}
  };

  pingPresence();
  setInterval(pingPresence, 8000);

  // Endpoint telemetry & map rendering
  try {
    const res = await fetch("/api/info");
    const info = await res.json();

    setText("ipaddress", info.ip || "Unavailable");
    setText("city", info.city || "Unknown");
    setText("region", info.region || "Unknown");
    setText("country", info.countryCode ? `${info.country} (${info.countryCode})` : info.country || "Unknown");
    setText("isp", info.isp || "Unknown");

    const hasCoords = info.lat != null && info.lon != null && info.lat !== "Unknown";
    setText("coordinates", hasCoords ? `${info.lat}, ${info.lon}` : "Unknown");

    const curLat = hasCoords ? Number(info.lat) : 40.7128;
    const curLon = hasCoords ? Number(info.lon) : -74.006;

    let points = [];
    try {
      const locRes = await fetch("/api/locations");
      if (locRes.ok) points = await locRes.json();
    } catch {}

    initGlobe(curLat, curLon, points);
  } catch {
    initGlobe(40.7128, -74.006, []);
  }

  // Pointer dynamics
  let prevX = null;
  let prevY = null;
  let prevTime = performance.now();
  let totalDist = 0;
  let moveEvents = 0;
  let clickCount = 0;
  let lastClick = 0;
  let lastSpeed = 0;
  let lastActivity = performance.now();
  const speedSamples = [];

  document.addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (prevX !== null) {
      const dt = (now - prevTime) / 1000;
      if (dt > 0.015) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        const dist = Math.hypot(dx, dy);
        const speed = dist / dt;

        totalDist += dist;
        moveEvents++;

        speedSamples.push(speed);
        if (speedSamples.length > 5) speedSamples.shift();

        const avgSpeed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
        const accel = (avgSpeed - lastSpeed) / dt;
        lastSpeed = avgSpeed;

        setText("speed", `${avgSpeed.toFixed(1)} px/s`);
        setText("acceleration", accel.toFixed(1));
        setText("movements", moveEvents);
        setText("distance", `${Math.round(totalDist)} px`);
      }
    }
    prevX = e.clientX;
    prevY = e.clientY;
    prevTime = now;
    lastActivity = now;
  });

  document.addEventListener("click", () => {
    clickCount++;
    setText("clicks", clickCount);

    const now = performance.now();
    if (lastClick) {
      setText("clickinterval", `${Math.round(now - lastClick)}ms`);
    }
    lastClick = now;
  });

  setInterval(() => {
    const idleSec = Math.floor((performance.now() - lastActivity) / 1000);
    setText("idletime", `${idleSec}s`);
  }, 1000);

  // Session duration
  const startTs = Date.now();
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    setText("sessionTime", `${m}:${s}`);
  }, 1000);

  // Interaction logs
  let copyOps = 0;
  let pasteOps = 0;
  let ctxMenuClicks = 0;
  let screenshotHits = 0;
  let selCount = 0;

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection().toString().trim();
    if (sel) {
      selCount++;
      setText("textselections", selCount);
      setText("lastselected", sel.slice(0, 50));
    }
  });

  document.addEventListener("copy", () => {
    copyOps++;
    setText("copies", copyOps);
  });

  document.addEventListener("paste", () => {
    pasteOps++;
    setText("pastes", pasteOps);
  });

  document.addEventListener("contextmenu", () => {
    ctxMenuClicks++;
    setText("rightclicks", ctxMenuClicks);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "PrintScreen") {
      screenshotHits++;
      setText("screenshotattempts", screenshotHits);
    }
    if (e.metaKey) setText("cmdmeta", "Used");
    if (e.metaKey && e.shiftKey) setText("cmdshift", "Used");
  });

  // Append Privacy Advisory Card
  if (container) {
    const tipBlock = document.createElement("div");
    tipBlock.className = "section privacy-wrapper";
    tipBlock.innerHTML = `
      <div class="section-title">PRIVACY TIPS</div>
      <div class="privacy-card">
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
      </div>
    `;
    container.appendChild(tipBlock);
  }

  // Cesium runtime
  function initGlobe(lat, lon, locations = []) {
    if (!window.Cesium) return;

    Cesium.Ion.defaultAccessToken = "";

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

    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      })
    );

    if (viewer.cesiumWidget.creditContainer) {
      viewer.cesiumWidget.creditContainer.style.display = "none";
    }

    const { scene } = viewer;
    scene.backgroundColor = Cesium.Color.fromCssColorString("#0b0b0b");
    scene.globe.enableLighting = false;
    scene.globe.fog.enabled = false;
    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
    scene.globe.showGroundAtmosphere = false;
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#1a1a2e");
    scene.globe.maximumScreenSpaceError = 1;

    const ctrl = scene.screenSpaceCameraController;
    ctrl.enableZoom = true;
    ctrl.enableRotate = true;
    ctrl.enableTilt = true;
    ctrl.enableLook = true;
    ctrl.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
    ctrl.tiltEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG];
    ctrl.minimumZoomDistance = 1000;
    ctrl.maximumZoomDistance = 50000000;
    ctrl.zoomFactor = 10;

    viewer.canvas.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const zoomAmount = -e.deltaY * 0.01;
          const height = viewer.camera.positionCartographic.height;
          viewer.camera.zoomIn(height * zoomAmount * 0.5);
        }
      },
      { passive: false }
    );

    let lastTick = Date.now();
    let userInteracting = false;
    let resumeTimer = null;

    viewer.clock.onTick.addEventListener(() => {
      if (userInteracting) return;
      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, dt * 0.05);
    });

    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    const haltSpin = () => {
      userInteracting = true;
      lastTick = Date.now();
      if (resumeTimer) clearTimeout(resumeTimer);
    };

    const scheduleSpin = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        userInteracting = false;
        lastTick = Date.now();
      }, 3000);
    };

    [
      Cesium.ScreenSpaceEventType.LEFT_DOWN,
      Cesium.ScreenSpaceEventType.RIGHT_DOWN,
      Cesium.ScreenSpaceEventType.MIDDLE_DOWN,
      Cesium.ScreenSpaceEventType.WHEEL,
    ].forEach((ev) => handler.setInputAction(haltSpin, ev));

    [
      Cesium.ScreenSpaceEventType.LEFT_UP,
      Cesium.ScreenSpaceEventType.RIGHT_UP,
      Cesium.ScreenSpaceEventType.MIDDLE_UP,
    ].forEach((ev) => handler.setInputAction(scheduleSpin, ev));

    const gold = Cesium.Color.fromCssColorString("#FFE500");
    const pointsList = locations.length ? locations : [{ lat, lon }];

    pointsList.forEach((pt) => {
      const pLat = Number(pt.lat);
      const pLon = Number(pt.lon);
      if (isNaN(pLat) || isNaN(pLon)) return;

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(pLon, pLat),
        point: {
          pixelSize: 10,
          color: gold,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      if (Math.abs(pLat - lat) < 0.0001 && Math.abs(pLon - lon) < 0.0001) {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(pLon, pLat),
          ellipse: {
            semiMinorAxis: 50000,
            semiMajorAxis: 50000,
            material: gold.withAlpha(0.3),
            outline: true,
            outlineColor: gold,
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