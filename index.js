import { widgetWindow, addon, app } from "novadesk";
import * as fs from "fs";
import { json, cpu, memory, network, disk, power, time } from "system";

var JSON_DATA = {};
var JSON_FILE_PATH = path.join(
  app.getAppDataPath(),
  "FluentWidgets",
  "config.json",
);

var MONITOR_WINDOW = null;
var MONITOR_WINDOW_TIMER = null;

var CLOCK_WINDOW = null;
var CLOCK_TIMER = null;

const bb_Addon = addon.load(path.join(__addonsPath, "BlurBehind"));

function parseJSON() {
  if (!fs.exists(JSON_FILE_PATH)) {
    fs.mkdir(path.join(app.getAppDataPath(), "FluentWidgets"));
    fs.copyFile(path.join(__dirname, "config/config.json"), JSON_FILE_PATH);
    JSON_DATA = json.read(JSON_FILE_PATH);
  } else {
    fs.copyFile(
      path.join(__dirname, "config/config.json"),
      JSON_FILE_PATH,
      true,
    );
    JSON_DATA = json.read(JSON_FILE_PATH);
  }
}

parseJSON();

ipcMain.handle("getJSON", () => {
  return JSON_DATA;
});

function applyBB(hwnd) {
  bb_Addon.apply(
    hwnd,
    JSON_DATA.BB_STYLE.BLUR_TYPE,
    JSON_DATA.BB_STYLE.ROUND_TYPE,
  );
}

function monitorWindowStats() {
  const CPU_USAGE = cpu.usage();
  const MEMORY_USAGE = memory.usagePercent();
  const DISK_USAGE = disk.writeSpeed();
  const NETWORK_USAGE = network.rxSpeed();

  ipcMain.send("monitor-window-stats", {
    cpu: CPU_USAGE,
    memory: MEMORY_USAGE,
    disk: DISK_USAGE,
    network: NETWORK_USAGE,
  });
}

function updateMonitorStyle(style) {
  JSON_DATA.WINDOW_STYLES.MONITOR_WINDOW = style;
  json.write(JSON_FILE_PATH, JSON_DATA);
  setMonitorContextMenu();
  MONITOR_WINDOW.refresh();
}

function setMonitorContextMenu() {
  const currentStyle = JSON_DATA.WINDOW_STYLES.MONITOR_WINDOW;
  MONITOR_WINDOW.setContextMenu([
    {
      text: "Manage",
      action: () => console.log("Manage clicked - Logging to console"),
    },
    { type: "separator" },
    {
      text: "Small",
      checked: currentStyle === "small",
      action: () => updateMonitorStyle("small"),
    },
    {
      text: "Medium",
      checked: currentStyle === "medium",
      action: () => updateMonitorStyle("medium"),
    },
    {
      text: "Wide",
      checked: currentStyle === "wide",
      action: () => updateMonitorStyle("wide"),
    },
    {
      text: "Large",
      checked: currentStyle === "large",
      action: () => updateMonitorStyle("large"),
    },
  ]);
}

function loadMonitorWindow() {
  MONITOR_WINDOW = new widgetWindow({
    id: "MONITOR_WINDOW",
    script: "ui/monitorWindow.ui.js",
    show: false,
  });
  applyBB(String(MONITOR_WINDOW.getHandle()));
  setMonitorContextMenu();
  MONITOR_WINDOW.show();
  MONITOR_WINDOW_TIMER = setInterval(monitorWindowStats, 1000);
}

function loadClockWidget() {
  CLOCK_WINDOW = new widgetWindow({
    id: "CLOCK_WINDOW",
    script: "ui/clockWindow.ui.js",
    show: false,
  });
  applyBB(String(CLOCK_WINDOW.getHandle()));
  CLOCK_WINDOW.show();
}

// loadMonitorWindow();
loadClockWidget();

function publishClockData() {
  const timeStr = time.time("%H:%M");
  const secondsStr = time.time("%S");
  const dateStr = time.time("%A, %B %d");

  ipcMain.send("timeUpdate", timeStr);
  ipcMain.send("secondsUpdate", secondsStr);
  ipcMain.send("dateUpdate", dateStr);
}

setInterval(publishClockData, 1000);
publishClockData();

setInterval(() => {
  ipcMain.send("heartbeat", { timestamp: time.timeStamp() });
}, 1000);
