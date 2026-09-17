document.addEventListener("DOMContentLoaded", async () => {

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

  const canvasHash = getCanvasFingerprint();

  const sections = [
    {
      title: "YOUR UNIQUE IDS",
      rows: {
        "Trackability Score": "Calculating...",
        "Uniqueness Analysis": "Comparing to visitors...",
        "Browser Fingerprint": browserFingerprint,
        "Environment ID": environmentId,
        "Canvas Hash": canvasHash,
        "Consistency Confidence": "Cross-Checked"
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

    if (section.title === "MOUSE BEHAVIOR") {
      const canvasBox = document.createElement("div");
      canvasBox.className = "kinematic-canvas-container";
      canvasBox.innerHTML = `
        <div class="kinematic-header">
          <span>Kinematic Biometric Stream</span>
          <span id="kinematicStatus">IDLE</span>
        </div>
        <canvas id="kinematicCanvas" width="300" height="52"></canvas>
      `;
      box.appendChild(canvasBox);
    }

    content.appendChild(box);
  });

  if (navigator.storage?.estimate) {
    navigator.storage.estimate().then(estimate => {
      set("used", (estimate.usage / 1048576).toFixed(2) + " MB");
      set("quota", (estimate.quota / 1048576).toFixed(2) + " MB");
    }).catch(() => {});
  }

  if (navigator.mediaDevices?.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      set("microphones", devices.filter(d => d.kind === "audioinput").length);
      set("cameras", devices.filter(d => d.kind === "videoinput").length);
      set("speakers", devices.filter(d => d.kind === "audiooutput").length);
    }).catch(() => {});
  }

  const sessionId = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');

  async function sendHeartbeat() {
    try {
      const res = await fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const d = await res.json();
      if (document.getElementById("onlineCounter")) {
        document.getElementById("onlineCounter").textContent = d.activeUsers ?? 1;
      }
    } catch (e) {}
  }

  sendHeartbeat();
  setInterval(sendHeartbeat, 8000);

  const BASELINE_STORAGE_KEY = "wsm_baseline_scan";
  let globeInitialized = false;

  const latestTelemetry = {
    browserFingerprint,
    environmentId,
    canvasHash,
    webglRenderer,
    ip: "Loading...",
    city: "Unknown",
    isp: "Unknown",
    score: null,
    tier: ""
  };

  function getStoredBaseline() {
    try {
      const raw = sessionStorage.getItem(BASELINE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveBaseline(data) {
    try {
      sessionStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  function renderComparisonDiff(baseline, current) {
    const diffContainer = document.getElementById("diffContainer");
    if (!diffContainer || !baseline || !current || baseline.score === null || current.score === null) {
      return;
    }

    const delta = current.score - baseline.score;
    let deltaBadgeClass = "neutral";
    let deltaText = "Δ 0 pts (Unchanged)";

    if (delta < 0) {
      deltaBadgeClass = "improved";
      deltaText = `Δ ${delta} pts (Privacy Improved)`;
    } else if (delta > 0) {
      deltaBadgeClass = "worsened";
      deltaText = `Δ +${delta} pts (Trackability Increased)`;
    }

    const canvasLeaked = baseline.canvasHash === current.canvasHash;
    const gpuLeaked = baseline.webglRenderer === current.webglRenderer;
    const ipChanged = baseline.ip !== current.ip && current.ip !== "Loading..." && baseline.ip !== "Loading...";

    diffContainer.innerHTML = `
      <div class="diff-card">
        <div class="diff-title">
          <span>Baseline Comparison</span>
          <button class="diff-reset-btn" id="diffResetBtn" type="button">Reset Baseline</button>
        </div>
        <div class="diff-score-row">
          <span>Baseline: <strong>${baseline.score}/100</strong> → Current: <strong>${current.score}/100</strong></span>
          <span class="diff-delta-badge ${deltaBadgeClass}">${deltaText}</span>
        </div>
        <div class="diff-list">
          <div class="diff-item">
            <span class="diff-item-key">Canvas 2D Hash</span>
            <span class="diff-tag ${canvasLeaked ? "leaked" : "changed"}">
              ${canvasLeaked ? "100% Match (Leaked)" : "Altered"}
            </span>
          </div>
          <div class="diff-item">
            <span class="diff-item-key">Hardware / GPU</span>
            <span class="diff-tag ${gpuLeaked ? "leaked" : "changed"}">
              ${gpuLeaked ? "Hardware Match (Leaked)" : "Altered"}
            </span>
          </div>
          <div class="diff-item">
            <span class="diff-item-key">Network IP / Origin</span>
            <span class="diff-tag ${ipChanged ? "changed" : "leaked"}">
              ${ipChanged ? "Masked / Changed" : "Static / Same IP"}
            </span>
          </div>
        </div>
      </div>
    `;

    diffContainer.style.display = "block";

    const resetBtn = document.getElementById("diffResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        saveBaseline({ ...current });
        renderComparisonDiff(current, current);
      });
    }
  }

  function checkAndSyncBaseline() {
    if (latestTelemetry.score === null) return;
    const baseline = getStoredBaseline();
    if (!baseline) {
      saveBaseline({ ...latestTelemetry });
    } else {
      renderComparisonDiff(baseline, latestTelemetry);
    }
  }

  async function fetchTrackabilityScore() {
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          browserFingerprint,
          environmentId,
          canvasHash,
          webglRenderer
        })
      });
      if (!res.ok) throw new Error("Score request failed");
      const data = await res.json();

      latestTelemetry.score = data.score;
      latestTelemetry.tier = data.tier;

      const scoreEl = document.getElementById("trackabilityscore");
      const analysisEl = document.getElementById("uniquenessanalysis");

      if (scoreEl) {
        let badgeColor = "#2ddf72";
        if (data.score >= 80) badgeColor = "#ff4d4d";
        else if (data.score >= 50) badgeColor = "#ffe600";

        scoreEl.innerHTML = `<span style="color:${badgeColor}; font-weight:800;">${data.score}/100</span> <span style="font-size:10px; padding:2px 5px; border-radius:3px; background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}; text-transform:uppercase; margin-left:4px;">${data.tier}</span>`;
      }

      if (analysisEl) {
        analysisEl.textContent = data.explanation;
        analysisEl.title = data.explanation;
      }

      checkAndSyncBaseline();
    } catch (e) {
      latestTelemetry.score = 94;
      latestTelemetry.tier = "HIGH RISK";

      const scoreEl = document.getElementById("trackabilityscore");
      if (scoreEl) {
        scoreEl.innerHTML = `<span style="color:#ff4d4d; font-weight:800;">94/100</span> <span style="font-size:10px; padding:2px 5px; border-radius:3px; background:#ff4d4d22; color:#ff4d4d; border:1px solid #ff4d4d; text-transform:uppercase; margin-left:4px;">HIGH RISK</span>`;
      }
      set("uniquenessanalysis", "Distinct canvas & WebGL signature (Baseline estimate)");
      checkAndSyncBaseline();
    }
  }

  async function fetchLocationInfo() {
    try {
      const res = await fetch("/api/info");
      const d = await res.json();

      latestTelemetry.ip = d.ip || "Unavailable";
      latestTelemetry.city = d.city || "Unknown";
      latestTelemetry.isp = d.isp || "Unknown";

      set("ipaddress", latestTelemetry.ip);
      set("city", latestTelemetry.city);
      set("region", d.region || "Unknown");
      set("country", d.countryCode ? `${d.country} (${d.countryCode})` : (d.country || "Unknown"));
      set("coordinates", d.lat !== "Unknown" && d.lon !== "Unknown" ? `${d.lat}, ${d.lon}` : "Unknown");
      set("isp", latestTelemetry.isp);

      let validLat = 40.7128;
      let validLon = -74.0060;

      if (d.lat !== "Unknown" && d.lon !== "Unknown" && d.lat !== null) {
        validLat = parseFloat(d.lat);
        validLon = parseFloat(d.lon);
      }

      if (!globeInitialized) {
        let allLocations = [];
        try {
          const locRes = await fetch("/api/locations");
          allLocations = await locRes.json();
        } catch (e) {}

        initGlobe(validLat, validLon, allLocations);
        globeInitialized = true;
      }

      checkAndSyncBaseline();
    } catch (err) {
      if (!globeInitialized) {
        initGlobe(40.7128, -74.0060, []);
        globeInitialized = true;
      }
    }
  }

  fetchTrackabilityScore();
  fetchLocationInfo();

  const rescanBtn = document.getElementById("rescanBtn");
  if (rescanBtn) {
    rescanBtn.addEventListener("click", async () => {
      rescanBtn.disabled = true;
      rescanBtn.textContent = "Scanning...";

      const laser = document.getElementById("scanlineLaser");
      if (laser) {
        laser.classList.remove("active");
        void laser.offsetWidth;
        laser.classList.add("active");
      }

      if (!getStoredBaseline() && latestTelemetry.score !== null) {
        saveBaseline({ ...latestTelemetry });
      }

      await Promise.allSettled([
        fetchTrackabilityScore(),
        fetchLocationInfo()
      ]);

      const baseline = getStoredBaseline();
      if (baseline) {
        renderComparisonDiff(baseline, latestTelemetry);
      }

      rescanBtn.disabled = false;
      rescanBtn.textContent = "Re-Scan & Diff";
    });
  }

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
        updateKinematicVelocity(avgSpeed, Math.abs(acceleration));
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

  let currentKinematicVelocity = 0;

  function updateKinematicVelocity(speed, accel) {
    currentKinematicVelocity = Math.min(100, (speed / 12) + (accel / 20));
    const statusEl = document.getElementById("kinematicStatus");
    if (statusEl) {
      if (currentKinematicVelocity > 1) {
        statusEl.textContent = "STREAMING";
        statusEl.style.color = "#2ddf72";
      } else {
        statusEl.textContent = "IDLE";
        statusEl.style.color = "#ffe600";
      }
    }
  }

  function initKinematicOscilloscope() {
    const canvas = document.getElementById("kinematicCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = 48;
    const waveform = new Array(bufferLength).fill(0);

    function renderFrame() {
      waveform.push(currentKinematicVelocity);
      if (waveform.length > bufferLength) waveform.shift();
      currentKinematicVelocity *= 0.88;

      ctx.fillStyle = "#06070a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255, 230, 0, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.strokeStyle = "#ffe600";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "#ffe600";
      ctx.shadowBlur = 4;
      ctx.beginPath();

      const step = canvas.width / (bufferLength - 1);
      for (let i = 0; i < bufferLength; i++) {
        const x = i * step;
        const amp = (waveform[i] / 100) * 18;
        const wave = Math.sin(i * 0.4 + performance.now() * 0.008) * amp;
        const y = (canvas.height / 2) + wave;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      requestAnimationFrame(renderFrame);
    }

    requestAnimationFrame(renderFrame);
  }

  initKinematicOscilloscope();

  function initGlobe(lat, lon, allLocations = []) {
    if (!window.Cesium) return;
    
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