// =============================================================================
// FluentWidgets - Main Process Entry Point
// =============================================================================
// This file runs in NovaDesk's main process. It manages widget lifecycles,
// pulls data from system APIs, and sends updates to each widget window
// over IPC channels. Each widget has its own UI script (in ui/) running
// as a separate renderer process.
// =============================================================================

import { widgetWindow, addon, app } from "novadesk";
import * as fs from "fs";
import { json, cpu, memory, network, disk, time, webFetch } from "system";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/** The full user configuration object loaded from disk */
let config = {};

/** Absolute path where the user's config.json is stored */
const CONFIG_PATH = path.join(
  app.getAppDataPath(),
  "FluentWidgets",
  "config.json",
);
console.log("CONFIG_PATH", CONFIG_PATH);

/** Path to the default config shipped with the widget package */
const DEFAULT_CONFIG_PATH = path.join(__dirname, "config/config.json");

// -----------------------------------------------------------------------------
// Widget Window References & Timers
// -----------------------------------------------------------------------------
// Each widget gets its own window instance and a timer that dictates
// how often we push fresh data to it.

let monitorWindow = null;
let monitorTimer = null;

let clockWindow = null;
let clockTimer = null;

let calendarWindow = null;
let calendarTimer = null;

let weatherWindow = null;
let weatherTimer = null;

let playerWindow = null;
let playerTimer = null;

let notesWindow = null;

let settingsWindow = null;

// -----------------------------------------------------------------------------
// Native Addons
// -----------------------------------------------------------------------------

/** Adds Windows 10/11 acrylic or mica backdrop blur to widget windows */
const blurBehind = addon.load(path.join(__addonsPath, "BlurBehind"));

/** Reads currently-playing media info from Windows (title, artist, thumbnail) */
const nowPlaying = addon.load(path.join(__addonsPath, "NowPlaying"));

/** Addon to get input from user */
const inputBox = addon.load(path.join(__addonsPath, "InputBox"));

// =============================================================================
// Configuration Loading
// =============================================================================

/**
 * Load (or create) the user configuration file.
 * - On first run: copy the default config into the app data folder.
 * - On subsequent runs: merge defaults so new keys are always present.
 */
function loadConfig() {
  const configDir = path.join(app.getAppDataPath(), "FluentWidgets");

  if (!fs.exists(CONFIG_PATH)) {
    fs.mkdir(configDir);
    fs.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH);
    config = json.read(CONFIG_PATH);
  } else {
    fs.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH, true);
    config = json.read(CONFIG_PATH);
  }

  // Ensure runtime tracking values exist (survives config resets)
  if (!config.RUNTIME) config.RUNTIME = {};
  if (typeof config.RUNTIME.CLOCK_RENDER_ID !== "number") {
    config.RUNTIME.CLOCK_RENDER_ID = 0;
  }
}

loadConfig();

// -----------------------------------------------------------------------------
// Expose config to all renderer processes
// -----------------------------------------------------------------------------
ipcMain.handle("getJSON", () => config);

// =============================================================================
// Shared Helpers
// =============================================================================

/**
 * Apply the BlurBehind effect to a widget window.
 * @param {object} win - A widgetWindow instance
 */
function applyBlurBehind(win) {
  blurBehind.apply(
    String(win.getHandle()),
    config.BB_STYLE.BLUR_TYPE,
    config.BB_STYLE.ROUND_TYPE,
  );
}

/**
 * Build a right-click context menu for switching widget styles.
 *
 * Every widget follows the same pattern: "Manage" header, separator,
 * then one item per style (small / medium / wide / large).
 *
 * @param {string}   currentStyle - The currently-active style name
 * @param {Function} onSelect     - Called with the new style name when user clicks
 * @returns {Array} Menu items ready for widgetWindow.setContextMenu()
 */
function buildStyleMenu(currentStyle, onSelect) {
  const styles = ["small", "medium", "wide", "large"];
  return [
    { text: "Manage", action: () => console.log("Manage clicked") },
    { type: "separator" },
    ...styles.map((style) => ({
      text: style.charAt(0).toUpperCase() + style.slice(1),
      checked: currentStyle === style,
      action: () => onSelect(style),
    })),
  ];
}

/**
 * Create a widget window, apply blur, and return it.
 * @param {string} id         - Unique window identifier
 * @param {string} scriptPath - Path (relative to package root) to the UI script
 * @returns {object} The widgetWindow instance
 */
function createWidgetWindow(id, scriptPath) {
  const win = new widgetWindow({ id, script: scriptPath, show: false });
  applyBlurBehind(win);
  return win;
}

// =============================================================================
// Monitor Widget — CPU / RAM / Disk / Network gauges
// =============================================================================

function publishMonitorStats() {
  ipcMain.send("monitor-window-stats", {
    cpu: cpu.usage(),
    memory: memory.usagePercent(),
    disk: disk.writeSpeed(),
    network: network.rxSpeed(),
  });
}

function updateMonitorStyle(style) {
  config.WINDOW_STYLES.MONITOR_WINDOW = style;
  json.write(CONFIG_PATH, config);
  monitorWindow.setContextMenu(buildStyleMenu(style, updateMonitorStyle));
  monitorWindow.refresh();
}

function loadMonitorWidget() {
  monitorWindow = createWidgetWindow("MONITOR_WINDOW", "ui/monitorWindow.ui.js");
  monitorWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.MONITOR_WINDOW, updateMonitorStyle),
  );
  publishMonitorStats();
  monitorTimer = setInterval(publishMonitorStats, 1000);
  monitorWindow.show();
}

// =============================================================================
// Clock Widget — Analog / Digital clock
// =============================================================================

function publishClockData() {
  const use24 = config.USE_24_HOUR_FORMAT;
  const timeFormat = use24 ? "%H:%M" : "%I:%M";

  ipcMain.send("clockUpdate", {
    style: config.WINDOW_STYLES.CLOCK_WINDOW,
    renderId: config.RUNTIME.CLOCK_RENDER_ID,
    hour24: parseInt(time.time("%H"), 10),
    minute: parseInt(time.time("%M"), 10),
    second: parseInt(time.time("%S"), 10),
    timeText: time.time(timeFormat),
    secondsText: time.time("%S"),
    dateText: time.time("%A, %B %d"),
  });

  // Separate channels let the UI update text independently of the hands
  ipcMain.send("timeUpdate", time.time(timeFormat));
  ipcMain.send("secondsUpdate", time.time("%S"));
  ipcMain.send("dateUpdate", time.time("%A, %B %d"));
}

function updateClockStyle(style) {
  config.WINDOW_STYLES.CLOCK_WINDOW = style;
  config.RUNTIME.CLOCK_RENDER_ID += 1;
  json.write(CONFIG_PATH, config);

  // Stop the old timer so we don't push data to a stale renderer
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }

  clockWindow.refresh();
  clockWindow.setContextMenu(buildStyleMenu(style, updateClockStyle));

  // Wait a brief moment so the newly-rendered UI script is ready
  setTimeout(() => {
    publishClockData();
    clockTimer = setInterval(publishClockData, 1000);
  }, 120);
}

function loadClockWidget() {
  clockWindow = createWidgetWindow("CLOCK_WINDOW", "ui/clockWindow.ui.js");
  clockWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.CLOCK_WINDOW, updateClockStyle),
  );
  publishClockData();
  clockTimer = setInterval(publishClockData, 1000);
  clockWindow.show();
}

// =============================================================================
// Calendar Widget — Day / month grid
// =============================================================================

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

const DAY_NAMES = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
  "THURSDAY", "FRIDAY", "SATURDAY",
];

function publishCalendarData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  // Convert Sunday-based .getDay() to Monday-based (Mon=0 … Sun=6)
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  ipcMain.send("calendarUpdate", {
    monthName: MONTH_NAMES[month],
    dayName: DAY_NAMES[now.getDay()],
    startDay,
    daysInMonth: new Date(year, month + 1, 0).getDate(),
    currentDate: date,
  });
}

function updateCalendarStyle(style) {
  config.WINDOW_STYLES.CALENDAR_WINDOW = style;
  json.write(CONFIG_PATH, config);

  if (calendarTimer) {
    clearInterval(calendarTimer);
    calendarTimer = null;
  }

  calendarWindow.refresh();
  calendarWindow.setContextMenu(buildStyleMenu(style, updateCalendarStyle));

  setTimeout(() => {
    publishCalendarData();
    calendarTimer = setInterval(publishCalendarData, 60000);
  }, 16);
}

function loadCalendarWidget() {
  calendarWindow = createWidgetWindow("CALENDAR_WINDOW", "ui/calendarWindow.ui.js");
  calendarWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.CALENDAR_WINDOW, updateCalendarStyle),
  );
  publishCalendarData();
  calendarTimer = setInterval(publishCalendarData, 60000);
  calendarWindow.show();
}

// =============================================================================
// Weather Widget — Current conditions + 6-day forecast
// =============================================================================

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Fetch weather from the free Open-Meteo API and push it to the widget.
 * Runs on a 10-minute interval (600 000 ms).
 */
async function publishWeatherData() {
  try {
    const loc = config.LOCATION || {};
    const lat = loc.LATITUDE ?? 51.5072;
    const lon = loc.LONGITUDE ?? -0.1276;
    const cityName = loc.CITY_NAME ?? "London";

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m` +
      `&hourly=temperature_2m` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&timezone=auto`;

    const raw = await webFetch(url);
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    const currentTemp = Math.round(data.current.temperature_2m);

    // Pinpoint where "now" sits in the hourly array so we get the next 6 slots
    const currentHourPrefix = data.current.time.substring(0, 13);
    const hourIndex = data.hourly.time.indexOf(currentHourPrefix + ":00");
    const startIdx = hourIndex >= 0 ? hourIndex : 0;

    const hourlyForecast = [];
    for (let i = 0; i < 6; i++) {
      const idx = startIdx + i;
      if (idx < data.hourly.time.length) {
        hourlyForecast.push({
          time: data.hourly.time[idx].split("T")[1].split(":")[0],
          temp: Math.round(data.hourly.temperature_2m[idx]),
        });
      }
    }

    const dailyForecast = [];
    for (let i = 0; i < 6 && i < data.daily.time.length; i++) {
      dailyForecast.push({
        day: SHORT_DAY_NAMES[new Date(data.daily.time[i]).getDay()],
        min: Math.round(data.daily.temperature_2m_min[i]),
        max: Math.round(data.daily.temperature_2m_max[i]),
      });
    }

    ipcMain.send("weatherUpdate", {
      cityName,
      currentTemp,
      hourlyForecast,
      dailyForecast,
      todayHigh: dailyForecast[0]?.max ?? 0,
      todayLow: dailyForecast[0]?.min ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
  }
}

function updateWeatherStyle(style) {
  config.WINDOW_STYLES.WEATHER_WINDOW = style;
  json.write(CONFIG_PATH, config);

  if (weatherTimer) {
    clearInterval(weatherTimer);
    weatherTimer = null;
  }

  weatherWindow.refresh();
  weatherWindow.setContextMenu(buildStyleMenu(style, updateWeatherStyle));

  setTimeout(() => {
    publishWeatherData();
    weatherTimer = setInterval(publishWeatherData, 600000);
  }, 120);
}

function loadWeatherWidget() {
  weatherWindow = createWidgetWindow("WEATHER_WINDOW", "ui/weatherWindow.ui.js");
  weatherWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.WEATHER_WINDOW, updateWeatherStyle),
  );
  publishWeatherData();
  weatherTimer = setInterval(publishWeatherData, 600000);
  weatherWindow.show();
}

// =============================================================================
// Now Playing Widget — Media playback info & controls
// =============================================================================

function publishNowPlayingData() {
  ipcMain.send("nowPlayingUpdate", nowPlaying.stats());
}

function updatePlayerStyle(style) {
  config.WINDOW_STYLES.PLAYER_WINDOW = style;
  json.write(CONFIG_PATH, config);

  if (playerTimer) {
    clearInterval(playerTimer);
    playerTimer = null;
  }

  playerWindow.refresh();
  playerWindow.setContextMenu(buildStyleMenu(style, updatePlayerStyle));

  setTimeout(() => {
    publishNowPlayingData();
    playerTimer = setInterval(publishNowPlayingData, 1000);
  }, 120);
}

function loadPlayerWidget() {
  playerWindow = createWidgetWindow("PLAYER_WINDOW", "ui/playerWindow.ui.js");
  playerWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.PLAYER_WINDOW, updatePlayerStyle),
  );
  playerTimer = setInterval(publishNowPlayingData, 1000);
  playerWindow.show();
}

// Renderer → main IPC for media controls
ipcMain.on("playPause", () => nowPlaying.playPause());
ipcMain.on("next", () => nowPlaying.next());
ipcMain.on("previous", () => nowPlaying.previous());

// Push once immediately so the UI isn't blank
publishNowPlayingData();

// =============================================================================
//   Notes Widget
// =============================================================================

function updateNotesStyle(style) {
  config.WINDOW_STYLES.NOTES_WINDOW = style;
  json.write(CONFIG_PATH, config);
  notesWindow.refresh();
  notesWindow.setContextMenu(buildStyleMenu(style, updateNotesStyle));
}

function loadNotesWidget() {
  notesWindow = createWidgetWindow("NOTES_WINDOW", "ui/notesWindow.ui.js");
  notesWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.NOTES_WINDOW, updateNotesStyle),
  );
  notesWindow.show();
}

function notesInput(data) {
  console.log("notesInput", JSON.stringify(data));
  const inputBox_ID = inputBox.show({
    widgetHwnd: notesWindow.getHandle(),
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fontSize: data.fontSize - 5,
    borderVisible: false,
    unfocusDismiss: false,
    multiline: true,
    backgroundColor: data.backgroundColor,
    defaultValue: data.defaultValue,
    onEnter: () => {
      const now = time.time("%m/%d/%Y %I:%M:%S %p", "en-US");
      config.NOTES_TEXT = inputBox.lastText();
      config.NOTES_SAVED_TIME = now;
      json.write(CONFIG_PATH, config);
      notesWindow.refresh();
    },
    onDismiss: () => {
      ipcMain.send("inputBoxDismissed");
    },
    onEsc: () => {
      ipcMain.send("inputBoxDismissed");
    }
  });
}

function notesTitleInput(data) {
  const inputBox_ID = inputBox.show({
    widgetHwnd: notesWindow.getHandle(),
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fontSize: data.fontSize - 5,
    borderVisible: false,
    multiline: false,
    backgroundColor: data.backgroundColor,
    defaultValue: data.defaultValue,
    onEnter: () => {
      const now = time.time("%m/%d/%Y %I:%M:%S %p", "en-US");
      config.NOTES_TITLE = inputBox.lastText();
      config.NOTES_SAVED_TIME = now;
      json.write(CONFIG_PATH, config);
      notesWindow.refresh();
    },
    onDismiss: () => {
      ipcMain.send("inputBoxDismissed");
    },
    onEsc: () => {
      ipcMain.send("inputBoxDismissed");
    }
  });

}

ipcMain.on("notesTitleInput", (event, data) => notesTitleInput(data));
ipcMain.on("notesInput", (event, data) => notesInput(data));
// =============================================================================
// Settings Window
// =============================================================================
function loadSettingsWindow() {
  settingsWindow = createWidgetWindow("SETTINGS_WINDOW", "ui/settingsWindow.ui.js");
  settingsWindow.show();
}

// =============================================================================
// Launch Widgets
// =============================================================================
// Uncomment the lines below to enable each widget:

// loadMonitorWidget();
// loadClockWidget();
// loadCalendarWidget();
// loadWeatherWidget();
// loadPlayerWidget();
// loadNotesWidget();

loadSettingsWindow();