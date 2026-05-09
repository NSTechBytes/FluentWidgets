// =============================================================================
// FluentWidgets — Weather Forecast Widget (Renderer)
// =============================================================================
// Shows current temperature, city name, an hourly row (next 6 hours), and
// a daily forecast (next 6 days) with temperature-range bars. The main
// process fetches data from the free Open-Meteo API every 10 minutes.
// =============================================================================

const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_TYPE = JSON_DATA.FONT_TYPE;
const currentStyle = JSON_DATA.WINDOW_STYLES.WEATHER_WINDOW;

// =============================================================================
// Theme Helpers
// =============================================================================

function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() { return getThemeColors().BACKGROUND; }
function getTextColor()        { return getThemeColors().FONT; }
function getSubtleColor()      { return getThemeColors().SUBTLE; }

// =============================================================================
// Style Builders
// =============================================================================

function largeStyle() {
  const SIZE = 360 * SCALE;

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, radius: 12 * SCALE, fillColor: getBackgroundColor() });

  ui.addText({ id: "city-name-text",   x: 20 * SCALE, y: 20 * SCALE, text: "City", fontSize: 16 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, fontWeight: "bold",  textAlign: "left" });
  ui.addText({ id: "current-temp-text", x: 20 * SCALE, y: 50 * SCALE, text: "0°",  fontSize: 60 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE,                      textAlign: "left" });
  ui.addText({ id: "high-low-text",     x: 340 * SCALE, y: 75 * SCALE, text: "↓ 0° ↑ 0°", fontSize: 14 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, textAlign: "right" });

  // Hourly row
  for (let i = 0; i < 6; i++) {
    const bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({ id: "hourly-time-" + i, x: bx + 10 * SCALE, y: 130 * SCALE, text: "00", fontSize: 12 * SCALE, fontColor: getSubtleColor(), fontFace: FONT_TYPE, textAlign: "center" });
    ui.addText({ id: "hourly-temp-" + i, x: bx + 10 * SCALE, y: 160 * SCALE, text: "0°", fontSize: 16 * SCALE, fontColor: getTextColor(),   fontFace: FONT_TYPE, textAlign: "center" });
  }

  // Daily list with temperature-range bars
  for (let i = 0; i < 6; i++) {
    const by = 210 * SCALE + i * 25 * SCALE;

    ui.addText({ id: "daily-day-" + i,   x: 20 * SCALE,  y: by, text: "Day", fontSize: 14 * SCALE, fontColor: getTextColor(),   fontFace: FONT_TYPE, textAlign: "left" });
    ui.addText({ id: "daily-min-" + i,   x: 140 * SCALE, y: by, text: "0°", fontSize: 14 * SCALE, fontColor: getSubtleColor(),  fontFace: FONT_TYPE, textAlign: "right" });

    // Bar track (background)
    ui.addShape({ id: "daily-bar-bg-" + i, type: "rectangle", x: 150 * SCALE, y: by + 5 * SCALE, width: 130 * SCALE, height: 4 * SCALE, radius: 2 * SCALE, strokeWidth: 0, fillColor: "rgba(128, 128, 128, 0.2)" });
    // Bar fill (foreground) — width updated dynamically
    ui.addShape({ id: "daily-bar-fg-" + i, type: "rectangle", x: 150 * SCALE, y: by + 5 * SCALE, width: 0, height: 4 * SCALE, radius: 2 * SCALE, strokeWidth: 0, fillColor: getTextColor() });

    ui.addText({ id: "daily-max-" + i, x: 340 * SCALE, y: by, text: "0°", fontSize: 14 * SCALE, fontColor: getTextColor(),  fontFace: FONT_TYPE, textAlign: "right" });
  }

  ui.endUpdate();
}

function wideStyle() {
  const W = 360 * SCALE;
  const H = 160 * SCALE;

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: W, height: H, radius: 12 * SCALE, fillColor: getBackgroundColor() });

  ui.addText({ id: "city-name-text",   x: 20 * SCALE, y: 15 * SCALE, text: "City", fontSize: 14 * SCALE, fontColor: getTextColor(),   fontFace: FONT_TYPE, fontWeight: "bold", textAlign: "left" });
  ui.addText({ id: "current-temp-text", x: 20 * SCALE, y: 40 * SCALE, text: "0°",  fontSize: 48 * SCALE, fontColor: getTextColor(),   fontFace: FONT_TYPE,                      textAlign: "left" });

  for (let i = 0; i < 6; i++) {
    const bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({ id: "hourly-time-" + i, x: bx + 10 * SCALE, y: 110 * SCALE, text: "00", fontSize: 12 * SCALE, fontColor: getSubtleColor(), fontFace: FONT_TYPE, textAlign: "center" });
    ui.addText({ id: "hourly-temp-" + i, x: bx + 10 * SCALE, y: 135 * SCALE, text: "0°", fontSize: 14 * SCALE, fontColor: getTextColor(),   fontFace: FONT_TYPE, textAlign: "center" });
  }

  ui.endUpdate();
}

function mediumStyle() {
  const SIZE = 160 * SCALE;

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, radius: 12 * SCALE, fillColor: getBackgroundColor() });
  ui.addText({ id: "city-name-text",    x: 15 * SCALE, y: 15 * SCALE, text: "City", fontSize: 14 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, fontWeight: "bold", textAlign: "left" });
  ui.addText({ id: "current-temp-text", x: 15 * SCALE, y: 45 * SCALE, text: "0°",  fontSize: 50 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE,                      textAlign: "left" });

  ui.endUpdate();
}

function smallStyle() {
  const SIZE = 75 * SCALE;

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, radius: 12 * SCALE, fillColor: getBackgroundColor() });
  ui.addText({ id: "current-temp-text", x: SIZE / 2, y: 20 * SCALE, text: "0°", fontSize: 34 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, textAlign: "center" });

  ui.endUpdate();
}

// =============================================================================
// Initial Render
// =============================================================================

if (currentStyle === "large")  largeStyle();
else if (currentStyle === "wide")   wideStyle();
else if (currentStyle === "medium") mediumStyle();
else if (currentStyle === "small")  smallStyle();
else largeStyle();

// =============================================================================
// IPC — Update Weather Data
// =============================================================================

ipcRenderer.on("weatherUpdate", (event, data) => {
  ui.beginUpdate();

  if (ui.isElementExist("city-name-text")) {
    ui.setElementProperty("city-name-text", "text", data.cityName);
  }
  if (ui.isElementExist("current-temp-text")) {
    ui.setElementProperty("current-temp-text", "text", data.currentTemp + "°");
  }

  if (currentStyle === "large") {
    if (ui.isElementExist("high-low-text")) {
      ui.setElementProperty("high-low-text", "text", `↓ ${data.todayLow}° ↑ ${data.todayHigh}°`);
    }
  }

  // Hourly forecast — shared by large & wide
  if (currentStyle === "large" || currentStyle === "wide") {
    for (let i = 0; i < 6; i++) {
      const timeId = "hourly-time-" + i;
      const tempId = "hourly-temp-" + i;
      if (ui.isElementExist(timeId) && data.hourlyForecast[i]) {
        ui.setElementProperty(timeId, "text", data.hourlyForecast[i].time);
        ui.setElementProperty(tempId, "text", data.hourlyForecast[i].temp + "°");
      }
    }
  }

  // Daily forecast with proportional temperature bars (large only)
  if (currentStyle === "large" && data.dailyForecast) {
    // Find the global min/max across all 6 days for bar scaling
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (let i = 0; i < 6; i++) {
      const d = data.dailyForecast[i];
      if (d) {
        if (d.min < globalMin) globalMin = d.min;
        if (d.max > globalMax) globalMax = d.max;
      }
    }

    const range = globalMax - globalMin || 1; // Avoid division by zero
    const MAX_BAR_WIDTH = 130 * SCALE;
    const pxPerDegree = MAX_BAR_WIDTH / range;

    for (let i = 0; i < 6; i++) {
      const dayId = "daily-day-" + i;
      const minId = "daily-min-" + i;
      const maxId = "daily-max-" + i;
      const barId = "daily-bar-fg-" + i;

      if (ui.isElementExist(dayId) && data.dailyForecast[i]) {
        const d = data.dailyForecast[i];
        ui.setElementProperty(dayId, "text", d.day);
        ui.setElementProperty(minId, "text", d.min + "°");
        ui.setElementProperty(maxId, "text", d.max + "°");

        const barOffset = (d.min - globalMin) * pxPerDegree;
        let barWidth = (d.max - d.min) * pxPerDegree;
        if (barWidth < 4 * SCALE) barWidth = 4 * SCALE;

        if (ui.isElementExist(barId)) {
          ui.setElementProperty(barId, "x", 150 * SCALE + barOffset);
          ui.setElementProperty(barId, "width", barWidth);
        }
      }
    }
  }

  ui.endUpdate();
});
