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
let currentStyle = JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW;

function getThemeColors() {
  const key = String(JSON_DATA.APPEARANCE.THEME || "dark").toUpperCase();
  return JSON_DATA.APPEARANCE[key] || JSON_DATA.APPEARANCE.DARK;
}

function isDarkTheme() {
  return getThemeColors().MODE !== "light";
}

const smallFace = isDarkTheme()
  ? "assets/icons/small-face-1.png"
  : "assets/icons/small-face-0.png";

const largeFace = isDarkTheme()
  ? "assets/icons/face-1.png"
  : "assets/icons/face-0.png";

let hour = 0,
  minute = 0,
  second = 0;
let clockGeometry = null;

function getBackgroundColor() {
  return getThemeColors().BACKGROUND;
}
function getFontColor() {
  return getThemeColors().FONT;
}
function getSubtleColor() {
  return getThemeColors().SUBTLE;
}
function getAccentColor() {
  return getThemeColors().ACCENT || JSON_DATA.APPEARANCE.ACCENT_COLOR;
}

function getWidgetSize() {
  const key = currentStyle.toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

function setClockGeometry(size, hLen, mLen, sLen) {
  clockGeometry = {
    center: size / 2,
    hourLen: hLen,
    minLen: mLen,
    secLen: sLen,
  };
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize();
  const CENTER = SIZE / 2;
  const PAD = 5 * SCALE;
  const FACE = SIZE - PAD * 2;

  setClockGeometry(SIZE, 14 * SCALE, 22 * SCALE, 24 * SCALE);

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
    id: "clock-face",
    x: PAD,
    y: PAD,
    width: FACE,
    height: FACE,
    path: smallFace,
  });
  ui.addShape({
    id: "hour-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 14 * SCALE,
    strokeColor: getFontColor(),
    strokeWidth: 3 * SCALE,
  });
  ui.addShape({
    id: "minute-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 22 * SCALE,
    strokeColor: getFontColor(),
    strokeWidth: 2 * SCALE,
  });
  ui.addShape({
    id: "second-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 24 * SCALE,
    strokeColor: getAccentColor(),
    strokeWidth: 1 * SCALE,
  });
  ui.addShape({
    id: "pin",
    type: "ellipse",
    x: CENTER - 2 * SCALE,
    y: CENTER - 2 * SCALE,
    width: 4 * SCALE,
    height: 4 * SCALE,
    fillColor: getAccentColor(),
    strokeColor: getFontColor(),
    strokeWidth: 1 * SCALE,
  });
  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize();
  const CENTER = SIZE / 2;
  const PAD = 10 * SCALE;
  const FACE = SIZE - PAD * 2;

  setClockGeometry(SIZE, 28 * SCALE, 46 * SCALE, 52 * SCALE);

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
    id: "clock-face",
    x: PAD,
    y: PAD,
    width: FACE,
    height: FACE,
    path: largeFace,
  });
  ui.addShape({
    id: "hour-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 28 * SCALE,
    strokeColor: getFontColor(),
    strokeWidth: 4 * SCALE,
  });
  ui.addShape({
    id: "minute-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 46 * SCALE,
    strokeColor: getFontColor(),
    strokeWidth: 3 * SCALE,
  });
  ui.addShape({
    id: "second-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 52 * SCALE,
    strokeColor: getAccentColor(),
    strokeWidth: 2 * SCALE,
  });
  ui.addShape({
    id: "pin",
    type: "ellipse",
    x: CENTER - 4 * SCALE,
    y: CENTER - 4 * SCALE,
    width: 8 * SCALE,
    height: 8 * SCALE,
    fillColor: getAccentColor(),
    strokeColor: getFontColor(),
    strokeWidth: 1 * SCALE,
  });
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
    id: "time-text",
    x: W / 2 - 15 * SCALE,
    y: 5 * SCALE,
    text: "00:00",
    fontSize: 90 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "center",
  });
  ui.addText({
    id: "seconds-text",
    x: W / 2 + 110 * SCALE,
    y: 30 * SCALE,
    text: "00",
    fontSize: 35 * SCALE,
    fontColor: getSubtleColor(),
    fontFace: FONT_FACE,
    textAlign: "left",
  });
  ui.addText({
    id: "date-text",
    x: W / 2,
    y: 115 * SCALE,
    text: "Date Loading...",
    fontSize: 22 * SCALE,
    fontColor: getFontColor(),
    fontFace: FONT_FACE,
    textAlign: "center",
  });
  ui.endUpdate();
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize();
  const CENTER = SIZE / 2;
  const PAD = 10 * SCALE;

  setClockGeometry(SIZE, 60 * SCALE, 100 * SCALE, 120 * SCALE);

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addShape({
    id: "ellipse_Shape",
    type: "ellipse",
    x: PAD,
    y: PAD,
    width: SIZE - PAD * 2,
    height: SIZE - PAD * 2,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addImage({
    id: "clock-face",
    x: PAD,
    y: PAD,
    width: SIZE - PAD * 2,
    height: SIZE - PAD * 2,
    path: largeFace,
  });
  ui.addShape({
    id: "hour-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 60 * SCALE,
    strokeColor: getFontColor(),
    strokeWidth: 8 * SCALE,
  });
  ui.addShape({
    id: "minute-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 100 * SCALE,
    strokeColor: getFontColor(),
    strokeWidth: 5 * SCALE,
  });
  ui.addShape({
    id: "second-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 120 * SCALE,
    strokeColor: getAccentColor(),
    strokeWidth: 2 * SCALE,
  });
  ui.addShape({
    id: "pin",
    type: "ellipse",
    x: CENTER - 6 * SCALE,
    y: CENTER - 6 * SCALE,
    width: 12 * SCALE,
    height: 12 * SCALE,
    fillColor: getAccentColor(),
    strokeColor: getFontColor(),
    strokeWidth: 2 * SCALE,
  });
  ui.endUpdate();
}

function render() {
  if (currentStyle === "small") smallStyle();
  else if (currentStyle === "medium") mediumStyle();
  else if (currentStyle === "wide") wideStyle();
  else largeStyle();
}

function clearUI() {
  [
    "background_Shape",
    "ellipse_Shape",
    "clock-face",
    "hour-hand",
    "minute-hand",
    "second-hand",
    "pin",
    "time-text",
    "seconds-text",
    "date-text",
  ].forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

render();

ipcRenderer.on("changeClockStyle", (event, style) => {
  ui.beginUpdate();
  currentStyle = style;
  clearUI();
  render();
  updateHands();
  ui.endUpdate();
});

// Compute clock hand positions from angles using trigonometry.
function updateHands() {
  if (!clockGeometry) return;
  const { center, hourLen, minLen, secLen } = clockGeometry;

  const hourRad = (((hour % 12) * 30 + minute * 0.5) * Math.PI) / 180;
  ui.setElementProperties("hour-hand", {
    endX: center + hourLen * Math.sin(hourRad),
    endY: center - hourLen * Math.cos(hourRad),
  });

  const minRad = (minute * 6 * Math.PI) / 180;
  ui.setElementProperties("minute-hand", {
    endX: center + minLen * Math.sin(minRad),
    endY: center - minLen * Math.cos(minRad),
  });

  const secRad = (second * 6 * Math.PI) / 180;
  ui.setElementProperties("second-hand", {
    endX: center + secLen * Math.sin(secRad),
    endY: center - secLen * Math.cos(secRad),
  });
}

ipcRenderer.on("timeUpdate", (event, timeStr) => {
  if (currentStyle === "wide" && ui.isElementExist("time-text")) {
    ui.setElementProperty("time-text", "text", timeStr);
  }
});

ipcRenderer.on("secondsUpdate", (event, secondsStr) => {
  if (currentStyle === "wide" && ui.isElementExist("seconds-text")) {
    ui.setElementProperty("seconds-text", "text", secondsStr);
  }
});

ipcRenderer.on("dateUpdate", (event, dateStr) => {
  if (ui.isElementExist("date-text")) {
    ui.setElementProperty("date-text", "text", dateStr);
  }
});

ipcRenderer.on("clockUpdate", (event, data) => {
  if (!data || data.style !== currentStyle) return;

  if (currentStyle === "wide") {
    if (ui.isElementExist("time-text"))
      ui.setElementProperty("time-text", "text", data.timeText);
    if (ui.isElementExist("seconds-text"))
      ui.setElementProperty("seconds-text", "text", data.secondsText);
    if (ui.isElementExist("date-text"))
      ui.setElementProperty("date-text", "text", data.dateText);
    return;
  }

  if (["large", "medium", "small"].includes(currentStyle)) {
    hour = data.hour24;
    minute = data.minute;
    second = data.second;
    updateHands();
  }
});
