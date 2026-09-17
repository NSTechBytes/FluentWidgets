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
let currentStyle = JSON_DATA.WINDOW_STYLES.WEATHER_WINDOW;

function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() {
  return getThemeColors().BACKGROUND;
}
function getFontColor() {
  return getThemeColors().FONT;
}
function getSubtleColor() {
  return getThemeColors().SUBTLE;
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
    y: 20 * SCALE,
    text: "City",
    fontSize: 16 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
  });
  ui.addText({
    id: "current-temp-text",
    x: 20 * SCALE,
    y: 50 * SCALE,
    text: "0°",
    fontSize: 60 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "left",
  });
  ui.addText({
    id: "high-low-text",
    x: 340 * SCALE,
    y: 75 * SCALE,
    text: "↓ 0° ↑ 0°",
    fontSize: 14 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "right",
  });

  for (let i = 0; i < 6; i++) {
    const bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({
      id: "hourly-time-" + i,
      x: bx + 10 * SCALE,
      y: 130 * SCALE,
      text: "00",
      fontSize: 12 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
    ui.addText({
      id: "hourly-temp-" + i,
      x: bx + 10 * SCALE,
      y: 160 * SCALE,
      text: "0°",
      fontSize: 16 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
  }

  for (let i = 0; i < 6; i++) {
    const by = 210 * SCALE + i * 25 * SCALE;
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
    y: 15 * SCALE,
    text: "City",
    fontSize: 14 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
  });
  ui.addText({
    id: "current-temp-text",
    x: 20 * SCALE,
    y: 40 * SCALE,
    text: "0°",
    fontSize: 48 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "left",
  });

  for (let i = 0; i < 6; i++) {
    const bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({
      id: "hourly-time-" + i,
      x: bx + 10 * SCALE,
      y: 110 * SCALE,
      text: "00",
      fontSize: 12 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_FACE,
      textAlign: "center",
    });
    ui.addText({
      id: "hourly-temp-" + i,
      x: bx + 10 * SCALE,
      y: 135 * SCALE,
      text: "0°",
      fontSize: 14 * SCALE,
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
    x: 15 * SCALE,
    y: 15 * SCALE,
    text: "City",
    fontSize: 14 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
  });
  ui.addText({
    id: "current-temp-text",
    x: 15 * SCALE,
    y: 45 * SCALE,
    text: "0°",
    fontSize: 50 * SCALE,
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
  ui.addText({
    id: "current-temp-text",
    x: SIZE / 2,
    y: 20 * SCALE,
    text: "0°",
    fontSize: 34 * SCALE,
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
    "high-low-text",
  ];
  for (let i = 0; i < 6; i++) {
    ids.push(
      "hourly-time-" + i,
      "hourly-temp-" + i,
      "daily-day-" + i,
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

// Update current temperature, hourly/daily forecasts, and temperature-range bars.
ipcRenderer.on("weatherUpdate", (event, data) => {
  ui.beginUpdate();

  if (ui.isElementExist("city-name-text"))
    ui.setElementProperty("city-name-text", "text", data.cityName);
  if (ui.isElementExist("current-temp-text"))
    ui.setElementProperty("current-temp-text", "text", data.currentTemp + "°");

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
      if (ui.isElementExist(timeId) && data.hourlyForecast[i]) {
        ui.setElementProperty(timeId, "text", data.hourlyForecast[i].time);
        ui.setElementProperty(
          tempId,
          "text",
          data.hourlyForecast[i].temp + "°",
        );
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
