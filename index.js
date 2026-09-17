/** Main process entry point for FluentWidgets. Manages widget lifecycles,
 *  system data collection, and IPC communication with renderer processes. */
import { widgetWindow, addon, app, tray } from "novadesk";
import * as fs from "fs";
import { json, cpu, memory, network, disk, time, webFetch, audio, execute } from "system";

let config = {};

const CONFIG_PATH = path.join(app.getAppDataPath(), "FluentWidgets", "config.json");
const DEFAULT_CONFIG_PATH = path.join(__dirname, "config/config.json");

let monitorWindow = null, monitorTimer = null;
let clockWindow = null, clockTimer = null;
let calendarWindow = null, calendarTimer = null;
let weatherWindow = null, weatherTimer = null;
let playerWindow = null, playerTimer = null;
let notesWindow = null;
let settingsWindow = null;
let volumeWindow = null, volumeTimer = null;
let isMuted = false, lastVolume = 50;

const blurBehind = addon.load(path.join(__addonsPath, "BlurBehind"));
const nowPlaying = addon.load(path.join(__addonsPath, "NowPlaying"));

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

const DAY_NAMES = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Maps widget keys to their window references for dynamic show/hide toggling. */
const WIDGET_MAP = {
  MONITOR: { ref: () => monitorWindow },
  CLOCK: { ref: () => clockWindow },
  CALENDAR: { ref: () => calendarWindow },
  WEATHER: { ref: () => weatherWindow },
  MUSIC: { ref: () => playerWindow },
  NOTES: { ref: () => notesWindow },
  VOLUME: { ref: () => volumeWindow },
};

/** Load config from disk, creating it from defaults on first run. */
function loadConfig() {
  const configDir = path.join(app.getAppDataPath(), "FluentWidgets");
  if (!fs.exists(CONFIG_PATH)) {
    fs.mkdir(configDir);
    fs.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH);
  } else {
    // fs.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH, true);
  }
  config = json.read(CONFIG_PATH);

  // Read meta.json and merge author/version information into config for settings UI
  const metaPath = path.join(__dirname, "meta.json");
  if (fs.exists(metaPath)) {
    const meta = json.read(metaPath);
    config.author = meta.author || "nstechbytes";
    config.version = meta.version || "1.0.0.0";
  } else {
    config.author = "nstechbytes";
    config.version = "1.0.0.0";
  }

  if (!config.RUNTIME) config.RUNTIME = {};
  if (typeof config.RUNTIME.CLOCK_RENDER_ID !== "number") {
    config.RUNTIME.CLOCK_RENDER_ID = 0;
  }
}

loadConfig();

ipcMain.handle("getJSON", () => config);

/** Apply acrylic/mica backdrop blur and corner style to a widget window. */
function applyBlurBehind(win) {
  blurBehind.apply(
    String(win.getHandle()),
    config.BB_STYLE.BLUR_TYPE,
    config.BB_STYLE.ROUND_TYPE,
  );
}

/** Build right-click context menu with style switcher, position controls, and settings. */
function buildStyleMenu(win, currentStyle, onSelect) {
  const styles = ["small", "medium", "wide", "large"];
  return [
    { text: "Settings", action: () => loadSettingsWindow() },
    {
      text: "Position",
      items: [
        { text: "Increase X (+10)", action: () => { const b = win.getBounds(); win.setBounds({ x: b.x + 10 }); } },
        { text: "Decrease X (-10)", action: () => { const b = win.getBounds(); win.setBounds({ x: b.x - 10 }); } },
        { text: "Increase Y (+10)", action: () => { const b = win.getBounds(); win.setBounds({ y: b.y + 10 }); } },
        { text: "Decrease Y (-10)", action: () => { const b = win.getBounds(); win.setBounds({ y: b.y - 10 }); } },
      ],
    },
    { type: "separator" },
    ...styles.map((style) => ({
      text: style.charAt(0).toUpperCase() + style.slice(1),
      checked: currentStyle === style,
      action: () => onSelect(style),
    })),
  ];
}

/** Create a widget window with blur effect applied. */
function createWidgetWindow(id, scriptPath) {
  const win = new widgetWindow({ id, script: scriptPath, show: false });
  applyBlurBehind(win);
  return win;
}

/** Calculate the scaled pixel dimensions for a given style name. */
function getScaledSize(style) {
  const scale = parseFloat(config.SCALE) || 1;
  const key = style.toUpperCase();
  const size = config.WIDGET_SIZES[key] || config.WIDGET_SIZES.LARGE;
  return { w: Math.round(size.WIDTH * scale), h: Math.round(size.HEIGHT * scale) };
}

/** Resize a widget window to match the given style and global scale. */
function resizeWidget(win, style) {
  if (win && typeof win.setSize === "function") {
    const { w, h } = getScaledSize(style);
    win.setSize(w, h);
  }
}

function refreshAllWidgets() {
  [notesWindow, clockWindow, calendarWindow, weatherWindow, monitorWindow, playerWindow, volumeWindow].forEach(w => {
    if (w && !w.isDestroyed()) w.refresh();
  });

  // Immediately push data for widgets with long update intervals so users
  // don't wait 60s (calendar) or 10min (weather) to see updated content.
  setTimeout(() => {
    if (calendarWindow && !calendarWindow.isDestroyed()) publishCalendarData();
    if (weatherWindow && !weatherWindow.isDestroyed()) publishWeatherData();
    if (clockWindow && !clockWindow.isDestroyed()) publishClockData();
    if (monitorWindow && !monitorWindow.isDestroyed()) publishMonitorStats();
    if (playerWindow && !playerWindow.isDestroyed()) publishNowPlayingData();
    if (volumeWindow && !volumeWindow.isDestroyed()) publishVolumeData();
  }, 16);
}

const DATA_INTERVALS = {
  MONITOR: 1000,
  CLOCK: 1000,
  CALENDAR: 60000,
  WEATHER: 600000,
  PLAYER: 1000,
  VOLUME: 1000,
};

// ── Monitor Widget ───────────────────────────────────────────────────────────

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
  monitorWindow.setContextMenu(buildStyleMenu(monitorWindow, style, updateMonitorStyle));
  resizeWidget(monitorWindow, style);
  ipcMain.send("changeMonitorStyle", style);
}

function loadMonitorWidget() {
  monitorWindow = createWidgetWindow("MONITOR_WINDOW", "ui/monitorWindow.ui.js");
  monitorWindow.setContextMenu(buildStyleMenu(monitorWindow, config.WINDOW_STYLES.MONITOR_WINDOW, updateMonitorStyle));
  publishMonitorStats();
  monitorTimer = setInterval(publishMonitorStats, DATA_INTERVALS.MONITOR);
  monitorWindow.show();
}

// ── Clock Widget ─────────────────────────────────────────────────────────────

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

  ipcMain.send("timeUpdate", time.time(timeFormat));
  ipcMain.send("secondsUpdate", time.time("%S"));
  ipcMain.send("dateUpdate", time.time("%A, %B %d"));
}

function updateClockStyle(style) {
  config.WINDOW_STYLES.CLOCK_WINDOW = style;
  config.RUNTIME.CLOCK_RENDER_ID += 1;
  json.write(CONFIG_PATH, config);

  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }

  clockWindow.setContextMenu(buildStyleMenu(clockWindow, style, updateClockStyle));
  resizeWidget(clockWindow, style);
  ipcMain.send("changeClockStyle", style);

  setTimeout(() => {
    publishClockData();
    clockTimer = setInterval(publishClockData, DATA_INTERVALS.CLOCK);
  }, 120);
}

function loadClockWidget() {
  clockWindow = createWidgetWindow("CLOCK_WINDOW", "ui/clockWindow.ui.js");
  clockWindow.setContextMenu(buildStyleMenu(clockWindow, config.WINDOW_STYLES.CLOCK_WINDOW, updateClockStyle));
  publishClockData();
  clockTimer = setInterval(publishClockData, DATA_INTERVALS.CLOCK);
  clockWindow.show();
}

// ── Calendar Widget ──────────────────────────────────────────────────────────

function publishCalendarData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
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

  calendarWindow.setContextMenu(buildStyleMenu(calendarWindow, style, updateCalendarStyle));
  resizeWidget(calendarWindow, style);
  ipcMain.send("changeCalendarStyle", style);

  setTimeout(() => {
    publishCalendarData();
    calendarTimer = setInterval(publishCalendarData, DATA_INTERVALS.CALENDAR);
  }, 16);
}

function loadCalendarWidget() {
  calendarWindow = createWidgetWindow("CALENDAR_WINDOW", "ui/calendarWindow.ui.js");
  calendarWindow.setContextMenu(buildStyleMenu(calendarWindow, config.WINDOW_STYLES.CALENDAR_WINDOW, updateCalendarStyle));
  publishCalendarData();
  calendarTimer = setInterval(publishCalendarData, DATA_INTERVALS.CALENDAR);
  calendarWindow.show();
}

// ── Weather Widget ───────────────────────────────────────────────────────────

async function publishWeatherData() {
  try {
    const loc = config.LOCATION || {};
    const lat = loc.LATITUDE ?? 51.5072;
    const lon = loc.LONGITUDE ?? -0.1276;
    const cityName = loc.CITY_NAME ?? "London";

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

    const raw = await webFetch(url);
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    const currentTemp = Math.round(data.current.temperature_2m);
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

  weatherWindow.setContextMenu(buildStyleMenu(weatherWindow, style, updateWeatherStyle));
  resizeWidget(weatherWindow, style);
  ipcMain.send("changeWeatherStyle", style);

  setTimeout(() => {
    publishWeatherData();
    weatherTimer = setInterval(publishWeatherData, DATA_INTERVALS.WEATHER);
  }, 120);
}

function loadWeatherWidget() {
  weatherWindow = createWidgetWindow("WEATHER_WINDOW", "ui/weatherWindow.ui.js");
  weatherWindow.setContextMenu(buildStyleMenu(weatherWindow, config.WINDOW_STYLES.WEATHER_WINDOW, updateWeatherStyle));
  publishWeatherData();
  weatherTimer = setInterval(publishWeatherData, DATA_INTERVALS.WEATHER);
  weatherWindow.show();
}

// ── Player Widget ────────────────────────────────────────────────────────────

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

  playerWindow.setContextMenu(buildStyleMenu(playerWindow, style, updatePlayerStyle));
  resizeWidget(playerWindow, style);
  ipcMain.send("changePlayerStyle", style);

  setTimeout(() => {
    publishNowPlayingData();
    playerTimer = setInterval(publishNowPlayingData, DATA_INTERVALS.PLAYER);
  }, 120);
}

function loadPlayerWidget() {
  playerWindow = createWidgetWindow("PLAYER_WINDOW", "ui/playerWindow.ui.js");
  playerWindow.setContextMenu(buildStyleMenu(playerWindow, config.WINDOW_STYLES.PLAYER_WINDOW, updatePlayerStyle));
  playerTimer = setInterval(publishNowPlayingData, DATA_INTERVALS.PLAYER);
  playerWindow.show();
}

ipcMain.on("playPause", () => nowPlaying.playPause());
ipcMain.on("next", () => nowPlaying.next());
ipcMain.on("previous", () => nowPlaying.previous());

publishNowPlayingData();

// ── Volume Widget ────────────────────────────────────────────────────────────

function publishVolumeData() {
  const vol = audio.getVolume();
  ipcMain.send("volumeUpdate", { volume: vol, isMuted });
}

function updateVolumeStyle(style) {
  config.WINDOW_STYLES.VOLUME_WINDOW = style;
  json.write(CONFIG_PATH, config);

  volumeWindow.setContextMenu(buildStyleMenu(volumeWindow, style, updateVolumeStyle));
  resizeWidget(volumeWindow, style);
  ipcMain.send("changeVolumeStyle", style);
}

function loadVolumeWidget() {
  volumeWindow = createWidgetWindow("VOLUME_WINDOW", "ui/volumeWindow.ui.js");
  volumeWindow.setContextMenu(buildStyleMenu(volumeWindow, config.WINDOW_STYLES.VOLUME_WINDOW || "large", updateVolumeStyle));
  publishVolumeData();
  volumeTimer = setInterval(publishVolumeData, DATA_INTERVALS.VOLUME);
  volumeWindow.show();
}

ipcMain.on("setVolume", (event, vol) => {
  audio.setVolume(vol);
  isMuted = vol === 0;
  publishVolumeData();
});

ipcMain.on("toggleMute", () => {
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
  let nextVol = audio.getVolume() + delta;
  nextVol = Math.max(0, Math.min(100, nextVol));
  audio.setVolume(nextVol);
  isMuted = nextVol === 0;
  publishVolumeData();
});

// ── Notes Widget ─────────────────────────────────────────────────────────────

function updateNotesStyle(style) {
  config.WINDOW_STYLES.NOTES_WINDOW = style;
  json.write(CONFIG_PATH, config);
  notesWindow.setContextMenu(buildStyleMenu(notesWindow, style, updateNotesStyle));
  resizeWidget(notesWindow, style);
  ipcMain.send("changeNotesStyle", style);
}

function loadNotesWidget() {
  notesWindow = createWidgetWindow("NOTES_WINDOW", "ui/notesWindow.ui.js");
  notesWindow.setContextMenu(buildStyleMenu(notesWindow, config.WINDOW_STYLES.NOTES_WINDOW, updateNotesStyle));
  notesWindow.show();
}

/** Persist notes body text from the UI addInputBox element. */
function notesInput(data) {
  const now = time.time("%m/%d/%Y %I:%M:%S %p", "en-US");
  config.NOTES_TEXT = data.text ?? "";
  config.NOTES_SAVED_TIME = now;
  json.write(CONFIG_PATH, config);
  if (notesWindow && !notesWindow.isDestroyed()) notesWindow.refresh();
}

/** Persist notes title text from the UI addInputBox element. */
function notesTitleInput(data) {
  const now = time.time("%m/%d/%Y %I:%M:%S %p", "en-US");
  config.NOTES_TOP_TITLE = data.text ?? "";
  config.NOTES_SAVED_TIME = now;
  json.write(CONFIG_PATH, config);
  if (notesWindow && !notesWindow.isDestroyed()) notesWindow.refresh();
}

ipcMain.on("notesTitleInput", (event, data) => notesTitleInput(data));
ipcMain.on("notesInput", (event, data) => notesInput(data));

/** Persist a settings field value submitted by a UI addInputBox element. */
function settingsInput(data) {
  const trimmed = String(data.text ?? "").trim();
  const isFloat = trimmed.includes(".");
  const val = isFloat ? parseFloat(trimmed) : parseInt(trimmed, 10);

  if (data.type === "scale") {
    if (!isNaN(val) && val >= 0.5 && val <= 3.0) config.SCALE = val;
  } else if (data.type === "latitude") {
    if (!isNaN(val)) config.LOCATION.LATITUDE = val;
  } else if (data.type === "longitude") {
    if (!isNaN(val)) config.LOCATION.LONGITUDE = val;
  } else if (data.type === "city") {
    if (trimmed) config.LOCATION.CITY_NAME = trimmed;
  }

  json.write(CONFIG_PATH, config);
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.refresh();

  if (data.type === "scale") refreshAllWidgets();
}

ipcMain.on("settingsInput", (event, data) => settingsInput(data));

ipcMain.on("setDarkMode", (event, isDark) => {
  config.APPEARANCE.THEME = isDark ? "dark" : "light";
  json.write(CONFIG_PATH, config);
  refreshAllWidgets();
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.refresh();
  }
});

// ── Widget Loading Manager ───────────────────────────────────────────────────

/** Toggle a widget's visibility by key. Loads the widget if it doesn't exist yet. */
function setWidgetLoaded(widgetKey, loaded) {
  config.LOADED_WIDGETS[widgetKey] = loaded;
  json.write(CONFIG_PATH, config);

  const entry = WIDGET_MAP[widgetKey];
  if (!entry) return;

  const win = entry.ref();
  if (loaded) {
    if (!win || win.isDestroyed()) {
      if (widgetKey === "MONITOR") loadMonitorWidget();
      else if (widgetKey === "CLOCK") loadClockWidget();
      else if (widgetKey === "CALENDAR") loadCalendarWidget();
      else if (widgetKey === "WEATHER") loadWeatherWidget();
      else if (widgetKey === "MUSIC") loadPlayerWidget();
      else if (widgetKey === "NOTES") loadNotesWidget();
      else if (widgetKey === "VOLUME") loadVolumeWidget();
    } else {
      win.show();
    }
  } else if (win && !win.isDestroyed()) {
    win.hide();
  }
}

ipcMain.on("toggleWidget", (event, { widgetKey, loaded }) => {
  setWidgetLoaded(widgetKey, loaded);
});

// ── Settings Window ──────────────────────────────────────────────────────────

function loadSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    return;
  }
  settingsWindow = createWidgetWindow("SETTINGS_WINDOW", "ui/settingsWindow.ui.js");
  settingsWindow.show();
  config.SETTINGS_WINDOW_OPEN = true;
  json.write(CONFIG_PATH, config);
}

// ── Launch Widgets ───────────────────────────────────────────────────────────

if (config.LOADED_WIDGETS) {
  if (config.LOADED_WIDGETS.MONITOR) loadMonitorWidget();
  if (config.LOADED_WIDGETS.CLOCK) loadClockWidget();
  if (config.LOADED_WIDGETS.CALENDAR) loadCalendarWidget();
  if (config.LOADED_WIDGETS.WEATHER) loadWeatherWidget();
  if (config.LOADED_WIDGETS.MUSIC) loadPlayerWidget();
  if (config.LOADED_WIDGETS.NOTES) loadNotesWidget();
  if (config.LOADED_WIDGETS.VOLUME) loadVolumeWidget();
} else {
  loadNotesWidget();
}

if (config.SETTINGS_WINDOW_OPEN !== false) {
  loadSettingsWindow();
}

// ── System Tray ──────────────────────────────────────────────────────────────

const appTray = new tray("assets/icon.ico");
appTray.setToolTip("FluentWidgets");
appTray.setContextMenu([
  { text: "Settings", action: () => loadSettingsWindow() },
  { type: "separator" },
  { text: "Exit App", action: () => app.exit() },
]);

appTray.on("click", () => loadSettingsWindow());

ipcMain.on("openGithub", () => {
  execute("https://github.com/nstechbytes/FluentWidgets");
});

ipcMain.on("setSettingsActiveTab", (event, tab) => {
  config.SETTINGS_ACTIVE_TAB = tab;
  json.write(CONFIG_PATH, config);
});

ipcMain.on("closeSettings", () => {
  config.SETTINGS_WINDOW_OPEN = false;
  json.write(CONFIG_PATH, config);
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

ipcMain.on("setCornerStyle", (event, style) => {
  const validCorners = ["none", "roundsmall", "round"];
  if (validCorners.includes(style.toLowerCase())) {
    config.BB_STYLE.ROUND_TYPE = style.toLowerCase();
    json.write(CONFIG_PATH, config);
    [monitorWindow, clockWindow, calendarWindow, weatherWindow, playerWindow, notesWindow, volumeWindow, settingsWindow].forEach(w => {
      if (w && !w.isDestroyed()) applyBlurBehind(w);
    });
  }
});

ipcMain.on("set24HourFormat", (event, use24) => {
  config.USE_24_HOUR_FORMAT = use24;
  json.write(CONFIG_PATH, config);
  publishClockData();
});
