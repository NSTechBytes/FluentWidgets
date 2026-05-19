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
import { json, cpu, memory, network, disk, time, webFetch, audio } from "system";

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
// Volume Widget
// =============================================================================

let volumeWindow = null;
let volumeTimer = null;
let isMuted = false;
let lastVolume = 50;

function publishVolumeData() {
  const vol = audio.getVolume();
  ipcMain.send("volumeUpdate", {
    volume: vol,
    isMuted: isMuted
  });
}

function updateVolumeStyle(style) {
  config.WINDOW_STYLES.VOLUME_WINDOW = style;
  json.write(CONFIG_PATH, config);
  
  if (volumeTimer) {
    clearInterval(volumeTimer);
    volumeTimer = null;
  }
  
  volumeWindow.refresh();
  volumeWindow.setContextMenu(buildStyleMenu(style, updateVolumeStyle));
  
  setTimeout(publishVolumeData, 120);
  volumeTimer = setInterval(publishVolumeData, 1000);
}

function loadVolumeWidget() {
  volumeWindow = createWidgetWindow("VOLUME_WINDOW", "ui/volumeWindow.ui.js");
  volumeWindow.setContextMenu(
    buildStyleMenu(config.WINDOW_STYLES.VOLUME_WINDOW || "large", updateVolumeStyle),
  );
  publishVolumeData();
  volumeTimer = setInterval(publishVolumeData, 1000);
  volumeWindow.show();
}

ipcMain.on("setVolume", (event, vol) => {
  audio.setVolume(vol);
  isMuted = (vol === 0);
  publishVolumeData();
});

ipcMain.on("toggleMute", (event) => {
  const currentVol = audio.getVolume();
  if (isMuted) {
    audio.setVolume(lastVolume || 50);
    isMuted = false;
  } else {
    lastVolume = currentVol > 0 ? currentVol : 50;
    audio.setVolume(0);
    isMuted = true;
  }
  publishVolumeData();
});

ipcMain.on("changeVolumeStep", (event, delta) => {
  const currentVol = audio.getVolume();
  let nextVol = currentVol + delta;
  if (nextVol < 0) nextVol = 0;
  if (nextVol > 100) nextVol = 100;
  audio.setVolume(nextVol);
  isMuted = (nextVol === 0);
  publishVolumeData();
});

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

function settingsInput(data) {
  const inputBox_ID = inputBox.show({
    widgetHwnd: settingsWindow.getHandle(),
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fontSize: data.fontSize,
    borderVisible: false,
    multiline: false,
    inputType: "Number",
    backgroundColor: data.backgroundColor,
    defaultValue: data.defaultValue,
    onEnter: () => {
      const text = inputBox.lastText().trim();
      const isFloat = text.includes(".");
      const val = isFloat ? parseFloat(text) : parseInt(text, 10);

      if (data.type === "scale") {
        if (!isNaN(val) && val >= 0.5 && val <= 3.0) {
          config.SCALE = val;
        }
      } else if (data.type === "latitude") {
        if (!isNaN(val)) {
          config.LOCATION.LATITUDE = val;
        }
      } else if (data.type === "longitude") {
        if (!isNaN(val)) {
          config.LOCATION.LONGITUDE = val;
        }
      }

      json.write(CONFIG_PATH, config);
      settingsWindow.refresh();

      // Refresh other widgets if scaling changed
      if (data.type === "scale") {
        if (notesWindow && !notesWindow.isDestroyed()) notesWindow.refresh();
        if (clockWindow && !clockWindow.isDestroyed()) clockWindow.refresh();
        if (calendarWindow && !calendarWindow.isDestroyed()) calendarWindow.refresh();
        if (weatherWindow && !weatherWindow.isDestroyed()) weatherWindow.refresh();
        if (monitorWindow && !monitorWindow.isDestroyed()) monitorWindow.refresh();
        if (playerWindow && !playerWindow.isDestroyed()) playerWindow.refresh();
        if (volumeWindow && !volumeWindow.isDestroyed()) volumeWindow.refresh();
      }
    },
    onDismiss: () => {
      ipcMain.send("inputBoxDismissed");
    },
    onEsc: () => {
      ipcMain.send("inputBoxDismissed");
    }
  });
}

ipcMain.on("settingsInput", (event, data) => settingsInput(data));

ipcMain.on("setDarkMode", (event, isDark) => {
  config.APPEARANCE.THEME = isDark ? "dark" : "light";
  json.write(CONFIG_PATH, config);

  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.refresh();
  if (notesWindow && !notesWindow.isDestroyed()) notesWindow.refresh();
  if (clockWindow && !clockWindow.isDestroyed()) clockWindow.refresh();
  if (calendarWindow && !calendarWindow.isDestroyed()) calendarWindow.refresh();
  if (weatherWindow && !weatherWindow.isDestroyed()) weatherWindow.refresh();
  if (monitorWindow && !monitorWindow.isDestroyed()) monitorWindow.refresh();
  if (playerWindow && !playerWindow.isDestroyed()) playerWindow.refresh();
  if (volumeWindow && !volumeWindow.isDestroyed()) volumeWindow.refresh();
});

// =============================================================================
// Settings & Widget Loading Manager
// =============================================================================

function setWidgetLoaded(widgetKey, loaded) {
  if (!config.LOADED_WIDGETS) config.LOADED_WIDGETS = {};
  config.LOADED_WIDGETS[widgetKey] = loaded;
  json.write(CONFIG_PATH, config);

  if (loaded) {
    if (widgetKey === "MONITOR") {
      if (!monitorWindow || monitorWindow.isDestroyed()) loadMonitorWidget();
      else monitorWindow.show();
    } else if (widgetKey === "CLOCK") {
      if (!clockWindow || clockWindow.isDestroyed()) loadClockWidget();
      else clockWindow.show();
    } else if (widgetKey === "CALENDAR") {
      if (!calendarWindow || calendarWindow.isDestroyed()) loadCalendarWidget();
      else calendarWindow.show();
    } else if (widgetKey === "WEATHER") {
      if (!weatherWindow || weatherWindow.isDestroyed()) loadWeatherWidget();
      else weatherWindow.show();
    } else if (widgetKey === "MUSIC") {
      if (!playerWindow || playerWindow.isDestroyed()) loadPlayerWidget();
      else playerWindow.show();
    } else if (widgetKey === "NOTES") {
      if (!notesWindow || notesWindow.isDestroyed()) loadNotesWidget();
      else notesWindow.show();
    } else if (widgetKey === "VOLUME") {
      if (!volumeWindow || volumeWindow.isDestroyed()) loadVolumeWidget();
      else volumeWindow.show();
    }
  } else {
    if (widgetKey === "MONITOR" && monitorWindow && !monitorWindow.isDestroyed()) {
      monitorWindow.hide();
    } else if (widgetKey === "CLOCK" && clockWindow && !clockWindow.isDestroyed()) {
      clockWindow.hide();
    } else if (widgetKey === "CALENDAR" && calendarWindow && !calendarWindow.isDestroyed()) {
      calendarWindow.hide();
    } else if (widgetKey === "WEATHER" && weatherWindow && !weatherWindow.isDestroyed()) {
      weatherWindow.hide();
    } else if (widgetKey === "MUSIC" && playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.hide();
    } else if (widgetKey === "NOTES" && notesWindow && !notesWindow.isDestroyed()) {
      notesWindow.hide();
    } else if (widgetKey === "VOLUME" && volumeWindow && !volumeWindow.isDestroyed()) {
      volumeWindow.hide();
    }
  }
}

ipcMain.on("toggleWidget", (event, { widgetKey, loaded }) => {
  setWidgetLoaded(widgetKey, loaded);
});

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

// Dynamic loader based on configured LOADED_WIDGETS status
if (config.LOADED_WIDGETS) {
  if (config.LOADED_WIDGETS.MONITOR) loadMonitorWidget();
  if (config.LOADED_WIDGETS.CLOCK) loadClockWidget();
  if (config.LOADED_WIDGETS.CALENDAR) loadCalendarWidget();
  if (config.LOADED_WIDGETS.WEATHER) loadWeatherWidget();
  if (config.LOADED_WIDGETS.MUSIC) loadPlayerWidget();
  if (config.LOADED_WIDGETS.NOTES) loadNotesWidget();
  if (config.LOADED_WIDGETS.VOLUME) loadVolumeWidget();
} else {
  // Fallback default
  loadNotesWidget();
}

loadSettingsWindow();