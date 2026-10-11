const { spawn } = require("child_process");
const path = require("path");
const readline = require("readline");

let psProcess = null;
let clickHandler = null;
let activeOptions = null;
let isKilled = false;

function sendCommand(cmd) {
  if (psProcess && psProcess.stdin && psProcess.stdin.writable) {
    try {
      psProcess.stdin.write(`${JSON.stringify(cmd)}\n`, "utf8");
    } catch (e) {}
  }
}

function spawnTray(options) {
  if (isKilled) return null;
  const { iconPath, tooltip, items, onClick } = options;
  clickHandler = onClick;

  const scriptPath = path.join(__dirname, "tray.ps1");

  try {
    psProcess = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-WindowStyle", "Hidden",
        "-InputFormat", "Text",
        "-OutputFormat", "Text",
        "-File", scriptPath,
        "-IconPath", iconPath,
        "-Tooltip", tooltip
      ],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }
    );
  } catch (err) {
    return null;
  }

  const rl = readline.createInterface({ input: psProcess.stdout });
  rl.on("line", (line) => {
    try {
      const evt = JSON.parse(line);
      if (evt.type === "click" && clickHandler) {
        clickHandler(evt.index);
      }
    } catch (e) {}
  });

  psProcess.on("error", () => {});
  psProcess.stderr.on("data", () => {});

  psProcess.on("close", () => {
    psProcess = null;
    if (!isKilled && activeOptions) {
      setTimeout(() => {
        if (!isKilled && activeOptions) {
          spawnTray(activeOptions);
        }
      }, 1500);
    }
  });

  items.forEach((item, index) => {
    sendCommand({ action: "add-item", index, title: item.title, enabled: item.enabled });
  });

  return psProcess;
}

function initWinTray(options) {
  isKilled = false;
  activeOptions = {
    ...options,
    items: options.items.map((it) => ({ ...it }))
  };

  const proc = spawnTray(activeOptions);
  if (!proc) return null;

  return {
    updateItem(index, title, enabled) {
      if (activeOptions && activeOptions.items && activeOptions.items[index]) {
        activeOptions.items[index] = { title, enabled };
      }
      sendCommand({ action: "update-item", index, title, enabled });
    },
    setTooltip(text) {
      if (activeOptions) activeOptions.tooltip = text;
      sendCommand({ action: "set-tooltip", text });
    },
    kill() {
      isKilled = true;
      activeOptions = null;
      try {
        sendCommand({ action: "kill" });
      } catch (e) {}
      setTimeout(() => {
        if (psProcess && !psProcess.killed) {
          try { psProcess.kill(); } catch (e) {}
        }
        psProcess = null;
      }, 300);
    }
  };
}

module.exports = { initWinTray };
