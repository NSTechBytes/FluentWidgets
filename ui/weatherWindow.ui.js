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

const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_FACE = JSON_DATA.FONT_FACE;
const DEFAULT_WEATHER_ICON = "assets/WeatherIcons/cloudy.png";
let currentStyle = JSON_DATA.WINDOW_STYLES.WEATHER_WINDOW;

function getThemeColors() {
  const key = String(JSON_DATA.APPEARANCE.THEME || "dark").toUpperCase();
  return JSON_DATA.APPEARANCE[key] || JSON_DATA.APPEARANCE.DARK;
}

function getBackgroundColor() {
  const color = getThemeColors().BACKGROUND;
  const opacity = parseFloat(JSON_DATA.APPEARANCE.BACKGROUND_OPACITY);
  if (isNaN(opacity)) return color;
  const a = Math.max(0, Math.min(1, opacity));
  const m = String(color).match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
  );
  if (!m) return color;
  return "rgba(" + m[1] + ", " + m[2] + ", " + m[3] + ", " + a + ")";
}
function getFontColor() {
  return getThemeColors().FONT;
}
function getSubtleColor() {
  return getThemeColors().FONT_SUBTLE;
}

function getWidgetSize() {
  const key = currentStyle.toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addText({
    id: "city-name-text",
    x: 20 * SCALE,
    y: 18 * SCALE,
    text: "City",
    fontSize: 16 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
  });
  ui.addImage({
    id: "current-weather-icon",
    x: 280 * SCALE,
    y: 22 * SCALE,
    width: 56 * SCALE,
    height: 56 * SCALE,
    path: DEFAULT_WEATHER_ICON,
  });
  ui.addText({
    id: "current-temp-text",
    x: 20 * SCALE,
    y: 48 * SCALE,
    text: "0°",
    fontSize: 56 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "left",
  });
  ui.addText({
    id: "high-low-text",
    x: 340 * SCALE,
    y: 88 * SCALE,
    text: "↓ 0° ↑ 0°",
    fontSize: 13 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "right",
  });

  for (let i = 0; i < 6; i++) {
    const bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({
      id: "hourly-time-" + i,
      x: bx + 14 * SCALE,
      y: 122 * SCALE,
      text: "00",
      fontSize: 12 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
    ui.addImage({
      id: "hourly-icon-" + i,
      x: bx + 2 * SCALE,
      y: 142 * SCALE,
      width: 24 * SCALE,
      height: 24 * SCALE,
      path: DEFAULT_WEATHER_ICON,
    });
    ui.addText({
      id: "hourly-temp-" + i,
      x: bx + 14 * SCALE,
      y: 172 * SCALE,
      text: "0°",
      fontSize: 15 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
  }

  for (let i = 0; i < 6; i++) {
    const by = 210 * SCALE + i * 24 * SCALE;
    ui.addText({
      id: "daily-day-" + i,
      x: 20 * SCALE,
      y: by,
      text: "Day",
      fontSize: 14 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE,
      textAlign: "left",
    });
    ui.addImage({
      id: "daily-icon-" + i,
      x: 70 * SCALE,
      y: by - 2 * SCALE,
      width: 18 * SCALE,
      height: 18 * SCALE,
      path: DEFAULT_WEATHER_ICON,
    });
    ui.addText({
      id: "daily-min-" + i,
      x: 140 * SCALE,
      y: by,
      text: "0°",
      fontSize: 14 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_FACE,
      textAlign: "right",
    });
    ui.addShape({
      id: "daily-bar-bg-" + i,
      type: "rectangle",
      x: 150 * SCALE,
      y: by + 5 * SCALE,
      width: 130 * SCALE,
      height: 4 * SCALE,
      radius: 2 * SCALE,
      strokeWidth: 0,
      fillColor: "rgba(128, 128, 128, 0.2)",
    });
    ui.addShape({
      id: "daily-bar-fg-" + i,
      type: "rectangle",
      x: 150 * SCALE,
      y: by + 5 * SCALE,
      width: 0,
      height: 4 * SCALE,
      radius: 2 * SCALE,
      strokeWidth: 0,
      fillColor: getFontColor(),
    });
    ui.addText({
      id: "daily-max-" + i,
      x: 340 * SCALE,
      y: by,
      text: "0°",
      fontSize: 14 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE,
      textAlign: "right",
    });
  }
  ui.endUpdate();
}

function wideStyle() {
  const { w: W, h: H } = getWidgetSize();

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: W,
    height: H,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addText({
    id: "city-name-text",
    x: 20 * SCALE,
    y: 12 * SCALE,
    text: "City",
    fontSize: 14 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
  });
  ui.addImage({
    id: "current-weather-icon",
    x: 290 * SCALE,
    y: 18 * SCALE,
    width: 44 * SCALE,
    height: 44 * SCALE,
    path: DEFAULT_WEATHER_ICON,
  });
  ui.addText({
    id: "current-temp-text",
    x: 20 * SCALE,
    y: 36 * SCALE,
    text: "0°",
    fontSize: 42 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "left",
  });

  for (let i = 0; i < 6; i++) {
    const bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({
      id: "hourly-time-" + i,
      x: bx + 14 * SCALE,
      y: 90 * SCALE,
      text: "00",
      fontSize: 11 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
    ui.addImage({
      id: "hourly-icon-" + i,
      x: bx + 3 * SCALE,
      y: 108 * SCALE,
      width: 22 * SCALE,
      height: 22 * SCALE,
      path: DEFAULT_WEATHER_ICON,
    });
    ui.addText({
      id: "hourly-temp-" + i,
      x: bx + 14 * SCALE,
      y: 134 * SCALE,
      text: "0°",
      fontSize: 13 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
  }
  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addText({
    id: "city-name-text",
    x: 14 * SCALE,
    y: 12 * SCALE,
    text: "City",
    fontSize: 13 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
  });
  ui.addImage({
    id: "current-weather-icon",
    x: 108 * SCALE,
    y: 48 * SCALE,
    width: 40 * SCALE,
    height: 40 * SCALE,
    path: DEFAULT_WEATHER_ICON,
  });
  ui.addText({
    id: "current-temp-text",
    x: 14 * SCALE,
    y: 48 * SCALE,
    text: "0°",
    fontSize: 42 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "left",
  });
  ui.endUpdate();
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addImage({
    id: "current-weather-icon",
    x: (SIZE - 28 * SCALE) / 2,
    y: 8 * SCALE,
    width: 28 * SCALE,
    height: 28 * SCALE,
    path: DEFAULT_WEATHER_ICON,
  });
  ui.addText({
    id: "current-temp-text",
    x: SIZE / 2,
    y: 40 * SCALE,
    text: "0°",
    fontSize: 22 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "center",
  });
  ui.endUpdate();
}

function render() {
  if (currentStyle === "large") largeStyle();
  else if (currentStyle === "wide") wideStyle();
  else if (currentStyle === "medium") mediumStyle();
  else if (currentStyle === "small") smallStyle();
  else largeStyle();
}

function clearUI() {
  const ids = [
    "background_Shape",
    "city-name-text",
    "current-temp-text",
    "current-weather-icon",
    "high-low-text",
  ];
  for (let i = 0; i < 6; i++) {
    ids.push(
      "hourly-time-" + i,
      "hourly-icon-" + i,
      "hourly-temp-" + i,
      "daily-day-" + i,
      "daily-icon-" + i,
      "daily-min-" + i,
      "daily-bar-bg-" + i,
      "daily-bar-fg-" + i,
      "daily-max-" + i,
    );
  }
  ids.forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

render();

ipcRenderer.on("changeWeatherStyle", (event, style) => {
  ui.beginUpdate();
  currentStyle = style;
  clearUI();
  render();
  ui.endUpdate();
});

// Update current temperature, icons, hourly/daily forecasts, and temperature-range bars.
ipcRenderer.on("weatherUpdate", (event, data) => {
  ui.beginUpdate();

  if (ui.isElementExist("city-name-text"))
    ui.setElementProperty("city-name-text", "text", data.cityName);
  if (ui.isElementExist("current-temp-text"))
    ui.setElementProperty("current-temp-text", "text", data.currentTemp + "°");
  if (ui.isElementExist("current-weather-icon") && data.currentIcon)
    ui.setElementProperty("current-weather-icon", "path", data.currentIcon);

  if (currentStyle === "large" && ui.isElementExist("high-low-text")) {
    ui.setElementProperty(
      "high-low-text",
      "text",
      `↓ ${data.todayLow}° ↑ ${data.todayHigh}°`,
    );
  }

  if (["large", "wide"].includes(currentStyle)) {
    for (let i = 0; i < 6; i++) {
      const timeId = "hourly-time-" + i;
      const tempId = "hourly-temp-" + i;
      const iconId = "hourly-icon-" + i;
      if (ui.isElementExist(timeId) && data.hourlyForecast[i]) {
        ui.setElementProperty(timeId, "text", data.hourlyForecast[i].time);
        ui.setElementProperty(
          tempId,
          "text",
          data.hourlyForecast[i].temp + "°",
        );
        if (ui.isElementExist(iconId) && data.hourlyForecast[i].icon) {
          ui.setElementProperty(iconId, "path", data.hourlyForecast[i].icon);
        }
      }
    }
  }

  if (currentStyle === "large" && data.dailyForecast) {
    let globalMin = Infinity,
      globalMax = -Infinity;
    for (let i = 0; i < 6; i++) {
      const d = data.dailyForecast[i];
      if (d) {
        if (d.min < globalMin) globalMin = d.min;
        if (d.max > globalMax) globalMax = d.max;
      }
    }

    const range = globalMax - globalMin || 1;
    const pxPerDegree = (130 * SCALE) / range;

    for (let i = 0; i < 6; i++) {
      const dayId = "daily-day-" + i;
      const minId = "daily-min-" + i;
      const maxId = "daily-max-" + i;
      const barId = "daily-bar-fg-" + i;
      const iconId = "daily-icon-" + i;

      if (ui.isElementExist(dayId) && data.dailyForecast[i]) {
        const d = data.dailyForecast[i];
        ui.setElementProperty(dayId, "text", d.day);
        ui.setElementProperty(minId, "text", d.min + "°");
        ui.setElementProperty(maxId, "text", d.max + "°");
        if (ui.isElementExist(iconId) && d.icon)
          ui.setElementProperty(iconId, "path", d.icon);

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
