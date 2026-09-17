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
let currentStyle = JSON_DATA.WINDOW_STYLES.VOLUME_WINDOW || "large";

let volumeVal = 50;
let isMuted = false;

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
function getAccentColor() {
  return JSON_DATA.APPEARANCE.ACCENT_COLOR;
}

function getWidgetSize() {
  const key = currentStyle.toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

// Select the volume icon asset based on current level and mute state.
function getVolumeIcon(vol, muted) {
  if (muted || vol === 0) return "assets/icons/Volume/Volume-1.png";
  if (vol <= 33) return "assets/icons/Volume/Volume1.png";
  if (vol <= 66) return "assets/icons/Volume/Volume2.png";
  return "assets/icons/Volume/Volume3.png";
}

function toggleMute() {
  ipcRenderer.send("toggleMute");
}

function setVolume(pct) {
  ipcRenderer.send("setVolume", pct);
}

function handleScroll(direction) {
  ipcRenderer.send("changeVolumeStep", direction === "up" ? 5 : -5);
}

// Extract the click/drag percentage (0-100) from a slider event.
function getEventPercent(e) {
  if (!e) return 0;
  const pct =
    e.__offsetXPercent !== undefined ? e.__offsetXPercent : e.offsetXPercent;
  if (pct === undefined || pct === null || isNaN(pct)) return 0;
  return pct;
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    fillColor: getBackgroundColor(),
    strokeWidth: 0,
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down"),
    onLeftMouseUp: toggleMute,
  });

  ui.addRoundLine({
    id: "volume_ring",
    x: 5 * SCALE,
    y: 5 * SCALE,
    width: 65 * SCALE,
    height: 65 * SCALE,
    radius: 28 * SCALE,
    thickness: 4 * SCALE,
    value: isMuted ? 0 : volumeVal / 100,
    lineColor: getAccentColor(),
    lineColorBg: getSubtleColor(),
    capType: "round",
  });

  ui.addImage({
    id: "volume_icon",
    x: 17.5 * SCALE,
    y: 17.5 * SCALE,
    width: 40 * SCALE,
    height: 40 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
  });
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
    fillColor: getBackgroundColor(),
    strokeWidth: 0,
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down"),
  });

  ui.addImage({
    id: "volume_icon",
    x: SIZE / 2 - 22.5 * SCALE,
    y: 20 * SCALE,
    width: 45 * SCALE,
    height: 45 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
    onLeftMouseUp: toggleMute,
  });
  ui.addText({
    id: "volume_text",
    text: isMuted ? "MUTED" : volumeVal + "%",
    x: SIZE / 2,
    y: 80 * SCALE,
    fontSize: 20 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    textAlign: "center",
  });

  ui.addShape({
    id: "slider_track",
    type: "rectangle",
    x: 20 * SCALE,
    y: 120 * SCALE,
    width: 120 * SCALE,
    height: 8 * SCALE,
    radius: 4 * SCALE,
    strokeWidth: 0,
    fillColor: getSubtleColor(),
  });

  const fillWidth = isMuted ? 0 : (volumeVal / 100) * 120 * SCALE;
  ui.addShape({
    id: "slider_fill",
    type: "rectangle",
    x: 20 * SCALE,
    y: 120 * SCALE,
    width: fillWidth,
    height: 8 * SCALE,
    radius: 4 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor(),
  });

  ui.addShape({
    id: "slider_hit",
    type: "rectangle",
    x: 20 * SCALE,
    y: 120 * SCALE,
    width: 120 * SCALE,
    height: 8 * SCALE,
    radius: 4 * SCALE,
    strokeWidth: 0,
    fillColor: "rgba(0,0,0,0)",
    onLeftMouseDown: (e) => setVolume(Math.round(getEventPercent(e))),
    onDragStart: (e) => setVolume(Math.round(getEventPercent(e))),
    onDrag: (e) => setVolume(Math.round(getEventPercent(e))),
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
    fillColor: getBackgroundColor(),
    strokeWidth: 0,
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down"),
  });

  ui.addImage({
    id: "volume_icon",
    x: 25 * SCALE,
    y: 35 * SCALE,
    width: 90 * SCALE,
    height: 90 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
    onLeftMouseUp: toggleMute,
  });
  ui.addText({
    id: "volume_title",
    text: "Master Volume",
    x: 135 * SCALE,
    y: 40 * SCALE,
    fontSize: 16 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    textAlign: "left",
  });
  ui.addText({
    id: "volume_status",
    text: isMuted ? "MUTED" : volumeVal + "%",
    x: W - 30 * SCALE,
    y: 40 * SCALE,
    fontSize: 16 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getAccentColor(),
    textAlign: "right",
  });

  const SLIDER_W = 190 * SCALE;
  ui.addShape({
    id: "slider_track",
    type: "rectangle",
    x: 135 * SCALE,
    y: 85 * SCALE,
    width: SLIDER_W,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getSubtleColor(),
  });

  const fillWidth = isMuted ? 0 : (volumeVal / 100) * SLIDER_W;
  ui.addShape({
    id: "slider_fill",
    type: "rectangle",
    x: 135 * SCALE,
    y: 85 * SCALE,
    width: fillWidth,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor(),
  });

  ui.addShape({
    id: "slider_hit",
    type: "rectangle",
    x: 135 * SCALE,
    y: 85 * SCALE,
    width: SLIDER_W,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: "rgba(0,0,0,0)",
    onLeftMouseDown: (e) => setVolume(Math.round(getEventPercent(e))),
    onDragStart: (e) => setVolume(Math.round(getEventPercent(e))),
    onDrag: (e) => setVolume(Math.round(getEventPercent(e))),
  });
  ui.endUpdate();
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    fillColor: getBackgroundColor(),
    strokeWidth: 0,
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down"),
  });

  ui.addImage({
    id: "volume_icon",
    x: SIZE / 2 - 45 * SCALE,
    y: 45 * SCALE,
    width: 90 * SCALE,
    height: 90 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
    onLeftMouseUp: toggleMute,
  });
  ui.addText({
    id: "volume_text",
    text: isMuted ? "MUTED" : volumeVal + "%",
    x: SIZE / 2,
    y: 155 * SCALE,
    fontSize: 42 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    textAlign: "center",
  });
  ui.addText({
    id: "volume_subtitle",
    text: isMuted ? "Tap to unmute" : "Scroll or drag to adjust",
    x: SIZE / 2,
    y: 215 * SCALE,
    fontSize: 14 * SCALE,
    fontFace: FONT_FACE,
    fontColor: getSubtleColor(),
    textAlign: "center",
  });

  const SLIDER_W = 280 * SCALE;
  ui.addShape({
    id: "slider_track",
    type: "rectangle",
    x: 40 * SCALE,
    y: 275 * SCALE,
    width: SLIDER_W,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getSubtleColor(),
  });

  const fillWidth = isMuted ? 0 : (volumeVal / 100) * SLIDER_W;
  ui.addShape({
    id: "slider_fill",
    type: "rectangle",
    x: 40 * SCALE,
    y: 275 * SCALE,
    width: fillWidth,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor(),
  });

  ui.addShape({
    id: "slider_hit",
    type: "rectangle",
    x: 40 * SCALE,
    y: 275 * SCALE,
    width: SLIDER_W,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: "rgba(0,0,0,0)",
    onLeftMouseDown: (e) => setVolume(Math.round(getEventPercent(e))),
    onDragStart: (e) => setVolume(Math.round(getEventPercent(e))),
    onDrag: (e) => setVolume(Math.round(getEventPercent(e))),
  });
  ui.endUpdate();
}

function clearUI() {
  [
    "background_Shape",
    "volume_icon",
    "volume_text",
    "volume_status",
    "volume_subtitle",
    "slider_track",
    "slider_fill",
    "slider_hit",
    "volume_ring",
  ].forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

function render() {
  if (currentStyle === "small") smallStyle();
  else if (currentStyle === "medium") mediumStyle();
  else if (currentStyle === "wide") wideStyle();
  else largeStyle();
}

render();

ipcRenderer.on("changeVolumeStyle", (event, style) => {
  ui.beginUpdate();
  currentStyle = style;
  clearUI();
  render();
  ui.endUpdate();
});

ipcRenderer.on("volumeUpdate", (event, data) => {
  volumeVal = data.volume;
  isMuted = data.isMuted;

  ui.beginUpdate();

  if (ui.isElementExist("volume_icon"))
    ui.setElementProperty(
      "volume_icon",
      "path",
      getVolumeIcon(volumeVal, isMuted),
    );

  if (ui.isElementExist("volume_text"))
    ui.setElementProperty(
      "volume_text",
      "text",
      isMuted ? "MUTED" : volumeVal + "%",
    );
  if (ui.isElementExist("volume_status"))
    ui.setElementProperty(
      "volume_status",
      "text",
      isMuted ? "MUTED" : volumeVal + "%",
    );
  if (ui.isElementExist("volume_subtitle"))
    ui.setElementProperty(
      "volume_subtitle",
      "text",
      isMuted ? "Tap to unmute" : "Scroll or drag to adjust",
    );

  if (ui.isElementExist("slider_fill")) {
    let sliderW = 120 * SCALE;
    if (currentStyle === "wide") sliderW = 190 * SCALE;
    if (currentStyle === "large") sliderW = 280 * SCALE;
    const fillWidth = isMuted ? 0 : (volumeVal / 100) * sliderW;
    ui.setElementProperty("slider_fill", "width", fillWidth);
  }

  if (ui.isElementExist("volume_ring")) {
    ui.setElementProperty(
      "volume_ring",
      "value",
      isMuted ? 0 : volumeVal / 100,
    );
  }

  ui.endUpdate();
});
