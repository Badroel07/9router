const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

let trayInstance = null;
let isWinTray = false;

/**
 * Get icon base64 from file — used for systray (mac/linux)
 */
function getIconBase64() {
  const isWin = process.platform === "win32";
  const iconFile = isWin ? "icon.ico" : "icon.png";
  try {
    const iconPath = path.join(__dirname, iconFile);
    if (fs.existsSync(iconPath)) {
      return fs.readFileSync(iconPath).toString("base64");
    }
  } catch (e) {}
  // Fallback: minimal 67Router icon (PNG)
  return "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";
}

/**
 * Check if system tray is supported on current OS
 * Supported: macOS, Windows, Linux (with GUI)
 */
function isTraySupported() {
  const platform = process.platform;
  if (!["darwin", "win32", "linux"].includes(platform)) {
    return false;
  }
  if (platform === "linux" && !process.env.DISPLAY) {
    return false;
  }
  return true;
}

/**
 * Initialize system tray with menu
 * @param {Object} options - { port, onQuit, onOpenDashboard }
 * @returns {Object|null} tray instance or null if not supported/failed
 */
function initTray(options) {
  if (!isTraySupported()) {
    return null;
  }

  // Windows uses PowerShell NotifyIcon (AV-safe), others use systray
  if (process.platform === "win32") {
    return initWindowsTray(options);
  }
  return initUnixTray(options);
}

/**
 * Build menu items array shared between platforms
 */
function buildMenuItems(port, autostartEnabled) {
  return [
    { title: `67Router (Port ${port})`, tooltip: "Server is running", enabled: false },
    { title: "Open Dashboard", tooltip: "Open in browser", enabled: true },
    {
      title: autostartEnabled ? "✓ Auto-start Enabled" : "Enable Auto-start",
      tooltip: "Run on OS startup",
      enabled: true
    },
    { title: "Quit", tooltip: "Stop server and exit", enabled: true }
  ];
}

// Menu item indexes
const MENU_INDEX = { STATUS: 0, DASHBOARD: 1, AUTOSTART: 2, QUIT: 3 };

/**
 * Get current autostart state
 */
function getAutostartEnabled() {
  try {
    const { isAutoStartEnabled } = require("./autostart");
    return isAutoStartEnabled();
  } catch (e) {
    return false;
  }
}

/**
 * Handle menu item click (shared logic)
 */
function handleClick(index, options, onAutostartToggle) {
  const { onQuit, onOpenDashboard, port } = options;
  if (index === MENU_INDEX.DASHBOARD) {
    if (onOpenDashboard) onOpenDashboard();
    else openBrowser(`http://localhost:${port}/dashboard`);
  } else if (index === MENU_INDEX.AUTOSTART) {
    const enabled = getAutostartEnabled();
    try {
      const { enableAutoStart, disableAutoStart } = require("./autostart");
      if (enabled) disableAutoStart();
      else enableAutoStart();
      onAutostartToggle(!enabled);
    } catch (e) {}
  } else if (index === MENU_INDEX.QUIT) {
    console.log("\n👋 Shutting down...");
    if (onQuit) onQuit();
    killTray();
    setTimeout(() => process.exit(0), 500);
  }
}

/**
 * Windows tray via PowerShell NotifyIcon
 */
function initWindowsTray(options) {
  const { port } = options;
  try {
    const { initWinTray } = require("./trayWin");
    const iconPath = path.join(__dirname, "icon.ico");
    const autostartEnabled = getAutostartEnabled();
    const items = buildMenuItems(port, autostartEnabled);

    trayInstance = initWinTray({
      iconPath,
      tooltip: `67Router - Port ${port}`,
      items,
      onClick: (index) => {
        handleClick(index, options, (newEnabled) => {
          const newTitle = newEnabled ? "✓ Auto-start Enabled" : "Enable Auto-start";
          trayInstance.updateItem(MENU_INDEX.AUTOSTART, newTitle, true);
        });
      }
    });

    isWinTray = true;
    return trayInstance;
  } catch (err) {
    return null;
  }
}

/**
 * macOS/Linux tray via systray binary
 *
 * Prefers `systray2`, the active fork of `systray`. Both ship only an x86_64
 * `tray_darwin_release` and select it by process.platform alone, so on Apple
 * Silicon the tray runs under Rosetta 2 and fails with EBADARCH when Rosetta is
 * absent. hooks/trayRuntime.js overlays a native arm64 build over that file to
 * avoid the dependency; the fallbacks below are Intel-only.
 *
 * Falls back to legacy `systray@1.0.5` if systray2 is unavailable, though that
 * binary's Mach-O headers are rejected by modern dyld and no icon will appear.
 */
function resolveSystray() {
  let runtimeDir = null;
  try {
    const { getRuntimeNodeModules } = require("../../../hooks/sqliteRuntime");
    runtimeDir = getRuntimeNodeModules();
  } catch (e) {}

  // 1) systray2 in runtime dir (where ensureTrayRuntime installs it)
  if (runtimeDir) {
    try { return { mod: require(path.join(runtimeDir, "systray2")).default, isV2: true }; } catch (e) {}
  }
  // 2) systray2 resolvable from the package's own node_modules / NODE_PATH
  try { return { mod: require("systray2").default, isV2: true }; } catch (e) {}
  // 3) Legacy systray fallback (unlikely to render on modern macOS)
  try { return { mod: require("systray").default, isV2: false }; } catch (e) {}
  if (runtimeDir) {
    try { return { mod: require(path.join(runtimeDir, "systray")).default, isV2: false }; } catch (e) {}
  }
  return null;
}

function chmodTrayBin(pkgName) {
  // systray2's npm tarball occasionally lands without +x on the bundled Go
  // binary (observed on macOS). spawn() then fails with EACCES. Best-effort
  // chmod on every init avoids a hard-to-diagnose silent tray failure.
  try {
    const { getRuntimeNodeModules } = require("../../../hooks/sqliteRuntime");
    const binName = process.platform === "darwin" ? "tray_darwin_release" : "tray_linux_release";
    const candidates = [
      path.join(getRuntimeNodeModules(), pkgName, "traybin", binName),
      path.join(__dirname, "..", "..", "..", "node_modules", pkgName, "traybin", binName)
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) fs.chmodSync(p, 0o755);
    }
  } catch (e) {}
}

function initUnixTray(options) {
  const { port } = options;
  try {
    const resolved = resolveSystray();
    if (!resolved) return null;
    const { mod: SysTray, isV2 } = resolved;

    chmodTrayBin(isV2 ? "systray2" : "systray");

    const autostartEnabled = getAutostartEnabled();
    const items = buildMenuItems(port, autostartEnabled);

    const menu = {
      icon: getIconBase64(),
      // The bundled icon.png is a full-color RGBA logo. Don't mark it as a
      // template icon: macOS would then render it as a solid white square
      // because template mode only uses the alpha channel.
      isTemplateIcon: false,
      title: "",
      tooltip: `67Router - Port ${port}`,
      items
    };

    trayInstance = new SysTray({ menu, debug: false, copyDir: true });
    isWinTray = false;

    trayInstance.onClick((action) => {
      handleClick(action.seq_id, options, (newEnabled) => {
        trayInstance.sendAction({
          type: "update-item",
          item: {
            title: newEnabled ? "✓ Auto-start Enabled" : "Enable Auto-start",
            tooltip: "Run on OS startup",
            enabled: true
          },
          seq_id: MENU_INDEX.AUTOSTART
        });
      });
    });

    if (isV2) {
      // systray2 exposes a ready() promise instead of onReady/onError. Surface
      // failures (binary crash, EACCES, etc.) so users can see why the icon
      // didn't appear instead of getting a misleading "running in tray" log.
      trayInstance.ready().catch((err) => {
        process.stderr.write(`[67router] tray failed to start: ${err && err.message ? err.message : err}\n`);
      });
    } else {
      trayInstance.onReady(() => {});
      trayInstance.onError(() => {});
    }

    return trayInstance;
  } catch (err) {
    process.stderr.write(`[67router] tray init error: ${err.message}\n`);
    return null;
  }
}

/**
 * Kill tray, wait Go binary fully exit (returns Promise).
 * Critical for hide-to-tray: macOS must release NSStatusItem before bgProcess
 * spawns a new tray, otherwise the new icon silently fails to register.
 */
function killTray() {
  const instance = trayInstance;
  const wasWin = isWinTray;
  trayInstance = null;
  if (!instance) return Promise.resolve();

  if (wasWin) {
    try { instance.kill(); } catch (e) {}
    return Promise.resolve();
  }

  // Unix: get the Go tray child process handle.
  let proc = null;
  try {
    proc = instance._process || (typeof instance.process === "function" ? instance.process() : null);
  } catch (e) {}

  // Graceful shutdown: send {type:"exit"} via IPC so the Go binary can call
  // systray.Quit() and release NSStatusItem. SIGKILL leaves a ghost icon on
  // the macOS menubar until logout, causing duplicate icons after re-spawn.
  const gracefulQuit = () => { try { instance.kill(true); } catch (e) {} };
  const closeIpc = () => { try { instance.kill(false); } catch (e) {} };

  if (!proc || !proc.pid) {
    gracefulQuit();
    closeIpc();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (done) return; done = true; closeIpc(); resolve(); };

    proc.once("exit", finish);
    gracefulQuit();

    // Escalate: SIGTERM after 800ms, SIGKILL after 1600ms if still alive.
    setTimeout(() => { try { process.kill(proc.pid, 0); proc.kill("SIGTERM"); } catch (e) {} }, 800);
    setTimeout(() => { try { process.kill(proc.pid, 0); proc.kill("SIGKILL"); } catch (e) {} }, 1600);

    // Fallback poll in case "exit" never fires (detached child, pipe closed)
    const deadline = Date.now() + 3000;
    const poll = setInterval(() => {
      try { process.kill(proc.pid, 0); } catch { clearInterval(poll); finish(); return; }
      if (Date.now() > deadline) { clearInterval(poll); finish(); }
    }, 50);
  });
}

/**
 * Open browser
 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd);
}

module.exports = {
  initTray,
  killTray
};
