/*
 * Copyright (c) 2024 nstechbytes
 *
 * Licensed under the Apache License, Version 2.0.
 * You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Main process entry point for FluentWidgets. Manages widget lifecycles,
// system data collection, and IPC communication with renderer processes.
import { widgetWindow, addon, app, tray } from "novadesk";
import * as fs from "fs";
import {
  json,
  cpu,
  memory,
  network,
  disk,
  time,
  webFetch,
  audio,
  execute,
  displayMetrics,
} from "system";

let config = {};

const CONFIG_PATH = path.join(
  app.getAppDataPath(),
  "FluentWidgets",
  "config.json",
);
const DEFAULT_CONFIG_PATH = path.join(__dirname, "config/config.json");

let monitorWindow = null,
  monitorTimer = null;
let clockWindow = null,
  clockTimer = null;
let calendarWindow = null,
  calendarTimer = null;
let weatherWindow = null,
  weatherTimer = null;
let playerWindow = null,
  playerTimer = null;
let notesWindow = null;
let settingsWindow = null;
let volumeWindow = null,
  volumeTimer = null;
let isMuted = false,
  lastVolume = 50;

const blurBehind = addon.load(path.join(__addonsPath, "BlurBehind"));
const nowPlaying = addon.load(path.join(__addonsPath, "NowPlaying"));

const MONTH_NAMES = [
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

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Maps widget keys to their window references for dynamic load/unload toggling.
const WIDGET_MAP = {
  MONITOR: {
    ref: () => monitorWindow,
    load: () => loadMonitorWidget(),
    unload: () => unloadMonitorWidget(),
  },
  CLOCK: {
    ref: () => clockWindow,
    load: () => loadClockWidget(),
    unload: () => unloadClockWidget(),
  },
  CALENDAR: {
    ref: () => calendarWindow,
    load: () => loadCalendarWidget(),
    unload: () => unloadCalendarWidget(),
  },
  WEATHER: {
    ref: () => weatherWindow,
    load: () => loadWeatherWidget(),
    unload: () => unloadWeatherWidget(),
  },
  MUSIC: {
    ref: () => playerWindow,
    load: () => loadPlayerWidget(),
    unload: () => unloadPlayerWidget(),
  },
  NOTES: {
    ref: () => notesWindow,
    load: () => loadNotesWidget(),
    unload: () => unloadNotesWidget(),
  },
  VOLUME: {
    ref: () => volumeWindow,
    load: () => loadVolumeWidget(),
    unload: () => unloadVolumeWidget(),
  },
};

// Load config from disk, creating it from defaults on first run.
function loadConfig() {
  const configDir = path.join(app.getAppDataPath(), "FluentWidgets");
  if (!fs.exists(CONFIG_PATH)) {
    fs.mkdir(configDir);
    fs.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH);
  } else {
    // fs.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH, true);
  }
  config = json.read(CONFIG_PATH);

  // Keep appearance theme tokens in sync with packaged defaults so palette
  // improvements apply even when an older AppData config already exists.
  try {
    const defaults = json.read(DEFAULT_CONFIG_PATH);
    if (defaults && defaults.APPEARANCE) {
      if (!config.APPEARANCE) config.APPEARANCE = {};
      const themeKeys = ["DARK", "LIGHT", "DRACULA", "GITHUB"];
      let theme = String(
        config.APPEARANCE.THEME || defaults.APPEARANCE.THEME || "dark",
      ).toLowerCase();
      if (!themeKeys.includes(theme.toUpperCase())) theme = "dark";

      const syncedThemes = {};
      themeKeys.forEach((key) => {
        syncedThemes[key] = {
          ...(defaults.APPEARANCE[key] || {}),
        };
      });

      const activePalette =
        syncedThemes[theme.toUpperCase()] || syncedThemes.DARK;

      config.APPEARANCE = {
        ...defaults.APPEARANCE,
        ...config.APPEARANCE,
        THEME: theme,
        ACCENT_COLOR:
          activePalette.ACCENT ||
          config.APPEARANCE.ACCENT_COLOR ||
          defaults.APPEARANCE.ACCENT_COLOR,
        ...syncedThemes,
        LEVEL_COLORS: {
          ...defaults.APPEARANCE.LEVEL_COLORS,
          ...(config.APPEARANCE.LEVEL_COLORS || {}),
        },
        BACKGROUND_SUBTLE:
          activePalette.BACKGROUND_SUBTLE ||
          defaults.APPEARANCE.BACKGROUND_SUBTLE,
        BACKGROUND_OPACITY:
          config.APPEARANCE.BACKGROUND_OPACITY !== undefined &&
          config.APPEARANCE.BACKGROUND_OPACITY !== null
            ? config.APPEARANCE.BACKGROUND_OPACITY
            : (defaults.APPEARANCE.BACKGROUND_OPACITY ?? 0.55),
        BACKGROUND_RADIUS:
          config.APPEARANCE.BACKGROUND_RADIUS !== undefined &&
          config.APPEARANCE.BACKGROUND_RADIUS !== null
            ? config.APPEARANCE.BACKGROUND_RADIUS
            : (defaults.APPEARANCE.BACKGROUND_RADIUS ?? 16),
        OVERLAY_COLOR:
          activePalette.OVERLAY || defaults.APPEARANCE.OVERLAY_COLOR,
      };
      json.write(CONFIG_PATH, config);
    }
  } catch (error) {
    console.warn("Unable to sync appearance theme tokens:", error);
  }

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

// Apply acrylic/mica backdrop blur and corner style to a widget window.
function applyBlurBehind(win, attempt = 0) {
  if (!win || win.isDestroyed()) return;

  const hwnd = win.getHandle();
  if (!hwnd) {
    if (attempt < 10) setTimeout(() => applyBlurBehind(win, attempt + 1), 16);
    return;
  }

  try {
    const blurType = String(config.BB_STYLE.BLUR_TYPE || "blur").toLowerCase();
    if (blurType === "none") {
      blurBehind.disable(hwnd);
      return;
    }
    blurBehind.apply(
      // Keep this as a number. String() may format large handles in scientific
      // notation, which the add-on's handle parser intentionally rejects.
      hwnd,
      config.BB_STYLE.BLUR_TYPE,
      config.BB_STYLE.ROUND_TYPE,
    );
  } catch (error) {
    // Window creation/destruction can race the add-on's IsWindow() check.
    // Retry across a few message-loop turns, without turning a cosmetic blur
    // failure into an unhandled promise rejection.
    if (attempt < 10 && !win.isDestroyed()) {
      setTimeout(() => applyBlurBehind(win, attempt + 1), 16);
    } else {
      console.warn("Unable to apply window blur:", error);
    }
  }
}

// Build right-click context menu with style switcher, position controls, and settings.
function buildStyleMenu(win, currentStyle, onSelect, widgetKey) {
  const styles = ["small", "medium", "wide", "large"];
  return [
    { text: "Settings", action: () => loadSettingsWindow() },
    {
      text: "Position",
      items: [
        {
          text: "Increase X (+10)",
          action: () => {
            const b = win.getBounds();
            win.setBounds({ x: b.x + 10 });
          },
        },
        {
          text: "Decrease X (-10)",
          action: () => {
            const b = win.getBounds();
            win.setBounds({ x: b.x - 10 });
          },
        },
        {
          text: "Increase Y (+10)",
          action: () => {
            const b = win.getBounds();
            win.setBounds({ y: b.y + 10 });
          },
        },
        {
          text: "Decrease Y (-10)",
          action: () => {
            const b = win.getBounds();
            win.setBounds({ y: b.y - 10 });
          },
        },
      ],
    },
    { type: "separator" },
    ...styles.map((style) => ({
      text: style.charAt(0).toUpperCase() + style.slice(1),
      checked: currentStyle === style,
      action: () => onSelect(style),
    })),
    { type: "separator" },
    {
      text: "Remove Widget",
      action: () => setWidgetLoaded(widgetKey, false),
    },
  ];
}

// Create a widget window with blur effect applied.
function createWidgetWindow(id, scriptPath) {
  const win = new widgetWindow({ id, script: scriptPath, show: false });
  applyBlurBehind(win);
  return win;
}

// Calculate the scaled pixel dimensions for a given style name.
function getScaledSize(style) {
  const scale = parseFloat(config.SCALE) || 1;
  const key = style.toUpperCase();
  const size = config.WIDGET_SIZES[key] || config.WIDGET_SIZES.LARGE;
  return {
    w: Math.round(size.WIDTH * scale),
    h: Math.round(size.HEIGHT * scale),
  };
}

// Resize a widget window to match the given style and global scale.
function resizeWidget(win, style) {
  if (win && typeof win.setSize === "function") {
    const { w, h } = getScaledSize(style);
    win.setSize(w, h);
  }
}

function refreshAllWidgets() {
  [
    notesWindow,
    clockWindow,
    calendarWindow,
    weatherWindow,
    monitorWindow,
    playerWindow,
    volumeWindow,
  ].forEach((w) => {
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

// ---- Monitor Widget ----

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
  monitorWindow.setContextMenu(
    buildStyleMenu(monitorWindow, style, updateMonitorStyle, "MONITOR"),
  );
  resizeWidget(monitorWindow, style);
  ipcMain.send("changeMonitorStyle", style);
}

function loadMonitorWidget() {
  if (monitorWindow && !monitorWindow.isDestroyed()) {
    monitorWindow.show();
    return;
  }
  monitorWindow = createWidgetWindow(
    "MONITOR_WINDOW",
    "ui/monitorWindow.ui.js",
  );
  monitorWindow.setContextMenu(
    buildStyleMenu(
      monitorWindow,
      config.WINDOW_STYLES.MONITOR_WINDOW,
      updateMonitorStyle,
      "MONITOR",
    ),
  );
  publishMonitorStats();
  if (monitorTimer) clearInterval(monitorTimer);
  monitorTimer = setInterval(publishMonitorStats, DATA_INTERVALS.MONITOR);
  monitorWindow.show();
}

function unloadMonitorWidget() {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
  if (monitorWindow && !monitorWindow.isDestroyed()) monitorWindow.close();
  monitorWindow = null;
}

// ---- Clock Widget ----

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

  clockWindow.setContextMenu(
    buildStyleMenu(clockWindow, style, updateClockStyle, "CLOCK"),
  );
  resizeWidget(clockWindow, style);
  ipcMain.send("changeClockStyle", style);

  setTimeout(() => {
    publishClockData();
    clockTimer = setInterval(publishClockData, DATA_INTERVALS.CLOCK);
  }, 120);
}

function loadClockWidget() {
  if (clockWindow && !clockWindow.isDestroyed()) {
    clockWindow.show();
    return;
  }
  clockWindow = createWidgetWindow("CLOCK_WINDOW", "ui/clockWindow.ui.js");
  clockWindow.setContextMenu(
    buildStyleMenu(
      clockWindow,
      config.WINDOW_STYLES.CLOCK_WINDOW,
      updateClockStyle,
      "CLOCK",
    ),
  );
  publishClockData();
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(publishClockData, DATA_INTERVALS.CLOCK);
  clockWindow.show();
}

function unloadClockWidget() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
  if (clockWindow && !clockWindow.isDestroyed()) clockWindow.close();
  clockWindow = null;
}

// ---- Calendar Widget ----

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

  calendarWindow.setContextMenu(
    buildStyleMenu(calendarWindow, style, updateCalendarStyle, "CALENDAR"),
  );
  resizeWidget(calendarWindow, style);
  ipcMain.send("changeCalendarStyle", style);

  setTimeout(() => {
    publishCalendarData();
    calendarTimer = setInterval(publishCalendarData, DATA_INTERVALS.CALENDAR);
  }, 16);
}

function loadCalendarWidget() {
  if (calendarWindow && !calendarWindow.isDestroyed()) {
    calendarWindow.show();
    return;
  }
  calendarWindow = createWidgetWindow(
    "CALENDAR_WINDOW",
    "ui/calendarWindow.ui.js",
  );
  calendarWindow.setContextMenu(
    buildStyleMenu(
      calendarWindow,
      config.WINDOW_STYLES.CALENDAR_WINDOW,
      updateCalendarStyle,
      "CALENDAR",
    ),
  );
  publishCalendarData();
  if (calendarTimer) clearInterval(calendarTimer);
  calendarTimer = setInterval(publishCalendarData, DATA_INTERVALS.CALENDAR);
  calendarWindow.show();
}

function unloadCalendarWidget() {
  if (calendarTimer) {
    clearInterval(calendarTimer);
    calendarTimer = null;
  }
  if (calendarWindow && !calendarWindow.isDestroyed()) calendarWindow.close();
  calendarWindow = null;
}

// ---- Weather Widget ----

const WEATHER_ICON_DIR = "assets/WeatherIcons/";

/** Map WMO weather_code (+ day/night) to a WeatherIcons asset path. */
function getWeatherIconPath(code, isDay) {
  const day = isDay === 1 || isDay === true;
  let name = "cloudy";

  switch (code) {
    case 0:
      name = day ? "clear_day" : "clear_night";
      break;
    case 1:
      name = day ? "mostly_clear_day" : "mostly_clear_night";
      break;
    case 2:
      name = day ? "partly_cloudy_day" : "partly_cloudy_night";
      break;
    case 3:
      name = day ? "mostly_cloudy_day" : "mostly_cloudy_night";
      break;
    case 45:
    case 48:
      name = "haze_fog_dust_smoke";
      break;
    case 51:
    case 53:
    case 55:
      name = "drizzle";
      break;
    case 56:
    case 57:
      name = "icy";
      break;
    case 61:
    case 63:
      name = day ? "scattered_showers_day" : "scattered_showers_night";
      break;
    case 65:
      name = "heavy_rain";
      break;
    case 66:
    case 67:
      name = "mixed_rain_hail_sleet";
      break;
    case 71:
    case 73:
      name = day
        ? "scattered_snow_showers_day"
        : "scattered_snow_showers_night";
      break;
    case 75:
      name = "heavy_snow";
      break;
    case 77:
      name = "flurries";
      break;
    case 80:
    case 81:
      name = "showers_rain";
      break;
    case 82:
      name = "heavy_rain";
      break;
    case 85:
      name = "showers_snow";
      break;
    case 86:
      name = "blizzard";
      break;
    case 95:
      name = day
        ? "isolated_scattered_thunderstorms_day"
        : "isolated_scattered_thunderstorms_night";
      break;
    case 96:
    case 99:
      name = "strong_thunderstorms";
      break;
    default:
      name = day ? "cloudy" : "mostly_cloudy_night";
      break;
  }

  return WEATHER_ICON_DIR + name + ".png";
}

async function publishWeatherData() {
  try {
    const loc = config.LOCATION || {};
    const lat = loc.LATITUDE ?? 51.5072;
    const lon = loc.LONGITUDE ?? -0.1276;
    const cityName = loc.CITY_NAME ?? "London";

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

    const raw = await webFetch(url);
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    const currentTemp = Math.round(data.current.temperature_2m);
    const currentIsDay = data.current.is_day;
    const currentIcon = getWeatherIconPath(
      data.current.weather_code,
      currentIsDay,
    );
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
          icon: getWeatherIconPath(
            data.hourly.weather_code[idx],
            data.hourly.is_day[idx],
          ),
        });
      }
    }

    const dailyForecast = [];
    for (let i = 0; i < 6 && i < data.daily.time.length; i++) {
      dailyForecast.push({
        day: SHORT_DAY_NAMES[new Date(data.daily.time[i]).getDay()],
        min: Math.round(data.daily.temperature_2m_min[i]),
        max: Math.round(data.daily.temperature_2m_max[i]),
        icon: getWeatherIconPath(data.daily.weather_code[i], true),
      });
    }

    ipcMain.send("weatherUpdate", {
      cityName,
      currentTemp,
      currentIcon,
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

  weatherWindow.setContextMenu(
    buildStyleMenu(weatherWindow, style, updateWeatherStyle, "WEATHER"),
  );
  resizeWidget(weatherWindow, style);
  ipcMain.send("changeWeatherStyle", style);

  setTimeout(() => {
    publishWeatherData();
    weatherTimer = setInterval(publishWeatherData, DATA_INTERVALS.WEATHER);
  }, 120);
}

function loadWeatherWidget() {
  if (weatherWindow && !weatherWindow.isDestroyed()) {
    weatherWindow.show();
    return;
  }
  weatherWindow = createWidgetWindow(
    "WEATHER_WINDOW",
    "ui/weatherWindow.ui.js",
  );
  weatherWindow.setContextMenu(
    buildStyleMenu(
      weatherWindow,
      config.WINDOW_STYLES.WEATHER_WINDOW,
      updateWeatherStyle,
      "WEATHER",
    ),
  );
  publishWeatherData();
  if (weatherTimer) clearInterval(weatherTimer);
  weatherTimer = setInterval(publishWeatherData, DATA_INTERVALS.WEATHER);
  weatherWindow.show();
}

function unloadWeatherWidget() {
  if (weatherTimer) {
    clearInterval(weatherTimer);
    weatherTimer = null;
  }
  if (weatherWindow && !weatherWindow.isDestroyed()) weatherWindow.close();
  weatherWindow = null;
}

// ---- Player Widget ----

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

  playerWindow.setContextMenu(
    buildStyleMenu(playerWindow, style, updatePlayerStyle, "MUSIC"),
  );
  resizeWidget(playerWindow, style);
  ipcMain.send("changePlayerStyle", style);

  setTimeout(() => {
    publishNowPlayingData();
    playerTimer = setInterval(publishNowPlayingData, DATA_INTERVALS.PLAYER);
  }, 120);
}

function loadPlayerWidget() {
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.show();
    return;
  }
  registerPlayerIpc();
  playerWindow = createWidgetWindow("PLAYER_WINDOW", "ui/playerWindow.ui.js");
  playerWindow.setContextMenu(
    buildStyleMenu(
      playerWindow,
      config.WINDOW_STYLES.PLAYER_WINDOW,
      updatePlayerStyle,
      "MUSIC",
    ),
  );
  publishNowPlayingData();
  if (playerTimer) clearInterval(playerTimer);
  playerTimer = setInterval(publishNowPlayingData, DATA_INTERVALS.PLAYER);
  playerWindow.show();
}

function unloadPlayerWidget() {
  unregisterPlayerIpc();
  if (playerTimer) {
    clearInterval(playerTimer);
    playerTimer = null;
  }
  if (playerWindow && !playerWindow.isDestroyed()) playerWindow.close();
  playerWindow = null;
}

function onPlayPause() {
  nowPlaying.playPause();
}
function onNext() {
  nowPlaying.next();
}
function onPrevious() {
  nowPlaying.previous();
}

function registerPlayerIpc() {
  unregisterPlayerIpc();
  ipcMain.on("playPause", onPlayPause);
  ipcMain.on("next", onNext);
  ipcMain.on("previous", onPrevious);
}

function unregisterPlayerIpc() {
  ipcMain.removeListener("playPause", onPlayPause);
  ipcMain.removeListener("next", onNext);
  ipcMain.removeListener("previous", onPrevious);
}

// ---- Volume Widget ----

function publishVolumeData() {
  const vol = audio.getVolume();
  ipcMain.send("volumeUpdate", { volume: vol, isMuted });
}

function updateVolumeStyle(style) {
  config.WINDOW_STYLES.VOLUME_WINDOW = style;
  json.write(CONFIG_PATH, config);

  volumeWindow.setContextMenu(
    buildStyleMenu(volumeWindow, style, updateVolumeStyle, "VOLUME"),
  );
  resizeWidget(volumeWindow, style);
  ipcMain.send("changeVolumeStyle", style);
}

function loadVolumeWidget() {
  if (volumeWindow && !volumeWindow.isDestroyed()) {
    volumeWindow.show();
    return;
  }
  registerVolumeIpc();
  volumeWindow = createWidgetWindow("VOLUME_WINDOW", "ui/volumeWindow.ui.js");
  volumeWindow.setContextMenu(
    buildStyleMenu(
      volumeWindow,
      config.WINDOW_STYLES.VOLUME_WINDOW || "large",
      updateVolumeStyle,
      "VOLUME",
    ),
  );
  publishVolumeData();
  if (volumeTimer) clearInterval(volumeTimer);
  volumeTimer = setInterval(publishVolumeData, DATA_INTERVALS.VOLUME);
  volumeWindow.show();
}

function unloadVolumeWidget() {
  unregisterVolumeIpc();
  if (volumeTimer) {
    clearInterval(volumeTimer);
    volumeTimer = null;
  }
  if (volumeWindow && !volumeWindow.isDestroyed()) volumeWindow.close();
  volumeWindow = null;
}

function onSetVolume(event, vol) {
  audio.setVolume(vol);
  isMuted = vol === 0;
  publishVolumeData();
}

function onToggleMute() {
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
}

function onChangeVolumeStep(event, delta) {
  let nextVol = audio.getVolume() + delta;
  nextVol = Math.max(0, Math.min(100, nextVol));
  audio.setVolume(nextVol);
  isMuted = nextVol === 0;
  publishVolumeData();
}

function registerVolumeIpc() {
  unregisterVolumeIpc();
  ipcMain.on("setVolume", onSetVolume);
  ipcMain.on("toggleMute", onToggleMute);
  ipcMain.on("changeVolumeStep", onChangeVolumeStep);
}

function unregisterVolumeIpc() {
  ipcMain.removeListener("setVolume", onSetVolume);
  ipcMain.removeListener("toggleMute", onToggleMute);
  ipcMain.removeListener("changeVolumeStep", onChangeVolumeStep);
}

// ---- Notes Widget ----

function updateNotesStyle(style) {
  config.WINDOW_STYLES.NOTES_WINDOW = style;
  json.write(CONFIG_PATH, config);
  notesWindow.setContextMenu(
    buildStyleMenu(notesWindow, style, updateNotesStyle, "NOTES"),
  );
  resizeWidget(notesWindow, style);
  ipcMain.send("changeNotesStyle", style);
}

function loadNotesWidget() {
  if (notesWindow && !notesWindow.isDestroyed()) {
    notesWindow.show();
    return;
  }
  registerNotesIpc();
  notesWindow = createWidgetWindow("NOTES_WINDOW", "ui/notesWindow.ui.js");
  notesWindow.setContextMenu(
    buildStyleMenu(
      notesWindow,
      config.WINDOW_STYLES.NOTES_WINDOW,
      updateNotesStyle,
      "NOTES",
    ),
  );
  notesWindow.show();
}

function unloadNotesWidget() {
  unregisterNotesIpc();
  if (notesWindow && !notesWindow.isDestroyed()) notesWindow.close();
  notesWindow = null;
}

// Persist notes body text from the UI addInputBox element.
function onNotesInput(event, data) {
  const now = time.time("%m/%d/%Y %I:%M:%S %p", "en-US");
  config.NOTES_TEXT = data.text ?? "";
  config.NOTES_SAVED_TIME = now;
  json.write(CONFIG_PATH, config);
  if (notesWindow && !notesWindow.isDestroyed()) notesWindow.refresh();
}

// Persist notes title text from the UI addInputBox element.
function onNotesTitleInput(event, data) {
  const now = time.time("%m/%d/%Y %I:%M:%S %p", "en-US");
  config.NOTES_TOP_TITLE = data.text ?? "";
  config.NOTES_SAVED_TIME = now;
  json.write(CONFIG_PATH, config);
  if (notesWindow && !notesWindow.isDestroyed()) notesWindow.refresh();
}

function registerNotesIpc() {
  unregisterNotesIpc();
  ipcMain.on("notesInput", onNotesInput);
  ipcMain.on("notesTitleInput", onNotesTitleInput);
}

function unregisterNotesIpc() {
  ipcMain.removeListener("notesInput", onNotesInput);
  ipcMain.removeListener("notesTitleInput", onNotesTitleInput);
}

// Persist a settings field value submitted by a UI addInputBox element.
function onSettingsInput(event, data) {
  const trimmed = String(data.text ?? "").trim();
  const isFloat = trimmed.includes(".");
  const val = isFloat ? parseFloat(trimmed) : parseInt(trimmed, 10);

  if (data.type === "scale") {
    if (!isNaN(val) && val >= 0.5 && val <= 3.0) config.SCALE = val;
  } else if (data.type === "opacity") {
    if (!isNaN(val) && val >= 0 && val <= 1) {
      config.APPEARANCE.BACKGROUND_OPACITY = val;
    }
  } else if (data.type === "backgroundRadius") {
    if (!isNaN(val) && val >= 0 && val <= 100) {
      config.APPEARANCE.BACKGROUND_RADIUS = val;
    }
  } else if (data.type === "latitude") {
    if (!isNaN(val)) config.LOCATION.LATITUDE = val;
  } else if (data.type === "longitude") {
    if (!isNaN(val)) config.LOCATION.LONGITUDE = val;
  } else if (data.type === "city") {
    if (trimmed) config.LOCATION.CITY_NAME = trimmed;
  }

  json.write(CONFIG_PATH, config);
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.refresh();

  if (data.type === "scale" || data.type === "opacity" ||
      data.type === "backgroundRadius") {
    refreshAllWidgets();
  } else if (
    data.type === "latitude" ||
    data.type === "longitude" ||
    data.type === "city"
  ) {
    if (weatherWindow && !weatherWindow.isDestroyed()) publishWeatherData();
  }
}

function onSetTheme(event, themeName) {
  const key = String(themeName || "dark").toLowerCase();
  const paletteKey = key.toUpperCase();
  const themeColors = config.APPEARANCE[paletteKey];
  if (!themeColors) return;

  config.APPEARANCE.THEME = key;
  if (themeColors.ACCENT) {
    config.APPEARANCE.ACCENT_COLOR = themeColors.ACCENT;
  }
  if (themeColors.BACKGROUND_SUBTLE) {
    config.APPEARANCE.BACKGROUND_SUBTLE = themeColors.BACKGROUND_SUBTLE;
  }
  if (themeColors.OVERLAY) {
    config.APPEARANCE.OVERLAY_COLOR = themeColors.OVERLAY;
  }
  json.write(CONFIG_PATH, config);
  refreshAllWidgets();
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.refresh();
  }
}

function onSetDarkMode(event, isDark) {
  onSetTheme(event, isDark ? "dark" : "light");
}

function onOpenGithub() {
  execute("https://github.com/nstechbytes/FluentWidgets");
}

function onOpenPatreon() {
  execute("https://patreon.com/cw/nstechbytes");
}

function onCheckForUpdate() {
  execute("https://github.com/nstechbytes/FluentWidgets/releases");
}

function onSetSettingsActiveTab(event, tab) {
  config.SETTINGS_ACTIVE_TAB = tab;
  json.write(CONFIG_PATH, config);
}

function onCloseSettings() {
  config.SETTINGS_WINDOW_OPEN = false;
  json.write(CONFIG_PATH, config);
  unloadSettingsWindow();
}

function onSetCornerStyle(event, style) {
  const validCorners = ["none", "roundsmall", "round"];
  if (validCorners.includes(style.toLowerCase())) {
    config.BB_STYLE.ROUND_TYPE = style.toLowerCase();
    json.write(CONFIG_PATH, config);
    [
      monitorWindow,
      clockWindow,
      calendarWindow,
      weatherWindow,
      playerWindow,
      notesWindow,
      volumeWindow,
      settingsWindow,
    ].forEach((w) => {
      if (w && !w.isDestroyed()) applyBlurBehind(w);
    });
  }
}

function onSetBlurType(event, type) {
  const blurType = String(type || "").toLowerCase();
  if (!["none", "acrylic", "blur"].includes(blurType)) return;

  config.BB_STYLE.BLUR_TYPE = blurType;
  json.write(CONFIG_PATH, config);
  [
    monitorWindow,
    clockWindow,
    calendarWindow,
    weatherWindow,
    playerWindow,
    notesWindow,
    volumeWindow,
    settingsWindow,
  ].forEach((w) => {
    if (w && !w.isDestroyed()) applyBlurBehind(w);
  });
}

function onSet24HourFormat(event, use24) {
  config.USE_24_HOUR_FORMAT = use24;
  json.write(CONFIG_PATH, config);
  if (clockWindow && !clockWindow.isDestroyed()) publishClockData();
}

function registerSettingsIpc() {
  unregisterSettingsIpc();
  ipcMain.on("settingsInput", onSettingsInput);
  ipcMain.on("setTheme", onSetTheme);
  ipcMain.on("setDarkMode", onSetDarkMode);
  ipcMain.on("openGithub", onOpenGithub);
  ipcMain.on("openPatreon", onOpenPatreon);
  ipcMain.on("checkForUpdate", onCheckForUpdate);
  ipcMain.on("setSettingsActiveTab", onSetSettingsActiveTab);
  ipcMain.on("closeSettings", onCloseSettings);
  ipcMain.on("setCornerStyle", onSetCornerStyle);
  ipcMain.on("setBlurType", onSetBlurType);
  ipcMain.on("set24HourFormat", onSet24HourFormat);
  ipcMain.on("toggleWidget", onToggleWidget);
}

function unregisterSettingsIpc() {
  ipcMain.removeListener("settingsInput", onSettingsInput);
  ipcMain.removeListener("setTheme", onSetTheme);
  ipcMain.removeListener("setDarkMode", onSetDarkMode);
  ipcMain.removeListener("openGithub", onOpenGithub);
  ipcMain.removeListener("openPatreon", onOpenPatreon);
  ipcMain.removeListener("checkForUpdate", onCheckForUpdate);
  ipcMain.removeListener("setSettingsActiveTab", onSetSettingsActiveTab);
  ipcMain.removeListener("closeSettings", onCloseSettings);
  ipcMain.removeListener("setCornerStyle", onSetCornerStyle);
  ipcMain.removeListener("setBlurType", onSetBlurType);
  ipcMain.removeListener("set24HourFormat", onSet24HourFormat);
  ipcMain.removeListener("toggleWidget", onToggleWidget);
}

// ---- Widget Loading Manager ----

// Load or fully close a widget by key. Closing destroys the window and its IPC handlers.
function setWidgetLoaded(widgetKey, loaded) {
  config.LOADED_WIDGETS[widgetKey] = loaded;
  json.write(CONFIG_PATH, config);

  const entry = WIDGET_MAP[widgetKey];
  if (!entry) return;

  if (loaded) {
    entry.load();
  } else {
    entry.unload();
  }

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.refresh();
  }
}

function onToggleWidget(event, { widgetKey, loaded }) {
  setWidgetLoaded(widgetKey, loaded);
}

// ---- Settings Window ----

function getCenteredBounds(width, height) {
  const metrics = displayMetrics.getMetrics();
  const area =
    (metrics.primary && metrics.primary.workArea) || metrics.virtualScreen;
  return {
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    width,
    height,
  };
}

function loadSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    return;
  }
  registerSettingsIpc();
  const scale = parseFloat(config.SCALE) || 1;
  const bounds = getCenteredBounds(
    Math.round(600 * scale),
    Math.round(765 * scale),
  );
  settingsWindow = new widgetWindow({
    id: "SETTINGS_WINDOW",
    script: "ui/settingsWindow.ui.js",
    show: false,
    // Settings behaves like an application window, so give it its own taskbar
    // button instead of treating it as a desktop-only widget.
    showInToolbar: true,
    toolbarTitle: "FluentWidgets Settings",
    ...bounds,
  });
  applyBlurBehind(settingsWindow);
  settingsWindow.disableContextMenu(true);
  settingsWindow.show();
  config.SETTINGS_WINDOW_OPEN = true;
  json.write(CONFIG_PATH, config);
}

function unloadSettingsWindow() {
  unregisterSettingsIpc();
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
  settingsWindow = null;
}

// ---- Launch Widgets ----

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

// ---- System Tray ----

const appTray = new tray("assets/icon.ico");
appTray.setToolTip("FluentWidgets");
appTray.setContextMenu([
  { text: "Settings", action: () => loadSettingsWindow() },
  { type: "separator" },
  { text: "Exit App", action: () => app.exit() },
]);

appTray.on("click", () => loadSettingsWindow());
