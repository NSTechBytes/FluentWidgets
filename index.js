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

var CALENDAR_WINDOW = null;
var CALENDAR_TIMER = null;

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

  if (!JSON_DATA.RUNTIME) JSON_DATA.RUNTIME = {};
  if (typeof JSON_DATA.RUNTIME.CLOCK_RENDER_ID !== "number") {
    JSON_DATA.RUNTIME.CLOCK_RENDER_ID = 0;
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

// ==========================================
// Monitor Window Functions
// ==========================================

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
  monitorWindowStats();
  MONITOR_WINDOW_TIMER = setInterval(monitorWindowStats, 1000);
  MONITOR_WINDOW.show();
}

// ==========================================
// Clock Window Functions
// ==========================================

function updateClockStyle(style) {
  JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW = style;
  JSON_DATA.RUNTIME.CLOCK_RENDER_ID += 1;
  json.write(JSON_FILE_PATH, JSON_DATA);

  // Avoid visual flicker while changing widget style.
  if (CLOCK_TIMER) {
    clearInterval(CLOCK_TIMER);
    CLOCK_TIMER = null;
  }

  CLOCK_WINDOW.refresh();
  setClockContextMenu();

  // Delay first publish slightly so refreshed UI script is fully ready.
  setTimeout(() => {
    publishClockData();
    CLOCK_TIMER = setInterval(publishClockData, 1000);
  }, 120);
}

function setClockContextMenu() {
  const currentStyle = JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW;
  CLOCK_WINDOW.setContextMenu([
    {
      text: "Small",
      checked: currentStyle === "small",
      action: () => updateClockStyle("small"),
    },
    {
      text: "Medium",
      checked: currentStyle === "medium",
      action: () => updateClockStyle("medium"),
    },
    {
      text: "Wide",
      checked: currentStyle === "wide",
      action: () => updateClockStyle("wide"),
    },
    {
      text: "Large",
      checked: currentStyle === "large",
      action: () => updateClockStyle("large"),
    },
  ]);
}

function loadClockWidget() {
  CLOCK_WINDOW = new widgetWindow({
    id: "CLOCK_WINDOW",
    script: "ui/clockWindow.ui.js",
    show: false,
  });
  applyBB(String(CLOCK_WINDOW.getHandle()));
  setClockContextMenu();
  publishClockData();
  CLOCK_TIMER = setInterval(publishClockData, 1000);
  CLOCK_WINDOW.show();
}

// loadMonitorWindow();
loadClockWidget();
loadCalendarWidget();

function publishClockData() {
  const timeFormat = JSON_DATA.USE_24_HOUR_FORMAT ? "%H:%M" : "%I:%M";
  const timeStr = time.time(timeFormat);
  const secondsStr = time.time("%S");
  const hour24 = parseInt(time.time("%H"), 10);
  const minute = parseInt(time.time("%M"), 10);
  const second = parseInt(secondsStr, 10);
  const dateStr = time.time("%A, %B %d");

  ipcMain.send("clockUpdate", {
    style: JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW,
    renderId: JSON_DATA.RUNTIME.CLOCK_RENDER_ID,
    hour24: hour24,
    minute: minute,
    second: second,
    timeText: timeStr,
    secondsText: secondsStr,
    dateText: dateStr,
  });

  ipcMain.send("timeUpdate", timeStr);
  ipcMain.send("secondsUpdate", secondsStr);
  ipcMain.send("dateUpdate", dateStr);
}

// ==========================================
// Calendar Window Functions
// ==========================================

function updateCalendarStyle(style) {
  JSON_DATA.WINDOW_STYLES.CALENDAR_WINDOW = style;
  json.write(JSON_FILE_PATH, JSON_DATA);

  if (CALENDAR_TIMER) {
    clearInterval(CALENDAR_TIMER);
    CALENDAR_TIMER = null;
  }

  CALENDAR_WINDOW.refresh();
  setCalendarContextMenu();

  setTimeout(() => {
    publishCalendarData();
    CALENDAR_TIMER = setInterval(publishCalendarData, 60000);
  }, 16);
}

function setCalendarContextMenu() {
  const currentStyle = JSON_DATA.WINDOW_STYLES.CALENDAR_WINDOW;
  CALENDAR_WINDOW.setContextMenu([
    {
      text: "Small",
      checked: currentStyle === "small",
      action: () => updateCalendarStyle("small"),
    },
    {
      text: "Medium",
      checked: currentStyle === "medium",
      action: () => updateCalendarStyle("medium"),
    },
    {
      text: "Wide",
      checked: currentStyle === "wide",
      action: () => updateCalendarStyle("wide"),
    },
    {
      text: "Large",
      checked: currentStyle === "large",
      action: () => updateCalendarStyle("large"),
    },
  ]);
}

function publishCalendarData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  const monthName = monthNames[month];

  const dayNames = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const dayName = dayNames[now.getDay()];

  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1; // Mon=0, Sun=6

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  ipcMain.send("calendarUpdate", {
    monthName: monthName,
    dayName: dayName,
    startDay: startDay,
    daysInMonth: daysInMonth,
    currentDate: date,
  });
}

function loadCalendarWidget() {
  CALENDAR_WINDOW = new widgetWindow({
    id: "CALENDAR_WINDOW",
    script: "ui/calendarWindow.ui.js",
    show: false,
  });
  applyBB(String(CALENDAR_WINDOW.getHandle()));
  setCalendarContextMenu();
  publishCalendarData();
  CALENDAR_TIMER = setInterval(publishCalendarData, 60000); // Refresh every minute
  CALENDAR_WINDOW.show();
}
