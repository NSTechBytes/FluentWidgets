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

let nowPlayingData = null;

const FONT_FACE = JSON_DATA.FONT_FACE;
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.55)";
const DEFAULT_THUMBNAIL = "assets/player/music.png";
const PLAY_ICON = "assets/player/pause.png";
const PAUSE_ICON = "assets/player/play.png";
const PREV_ICON = "assets/player/back.png";
const NEXT_ICON = "assets/player/next.png";

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
function getFontSubtleColor() {
  return getThemeColors().FONT_SUBTLE;
}
function getIconColor() {
  return getThemeColors().ICON;
}
/** White tint for icons drawn on the dark media overlay scrim. */
function getOverlayIconColor() {
  return "rgb(255, 255, 255)";
}

let playerStyle = JSON_DATA.WINDOW_STYLES.PLAYER_WINDOW;

function getWidgetSize(styleKey) {
  const key = (styleKey || playerStyle).toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

function playPauseMusic() {
  ipcRenderer.send("playPause");
}
function nextMusic() {
  ipcRenderer.send("next");
}
function previousMusic() {
  ipcRenderer.send("previous");
}

function hideOverlay() {
  const isLarge = playerStyle === "large";
  const ids = [
    "overlay_shape",
    "overlay_image",
    "previous_image",
    "next_image",
  ];
  if (isLarge) ids.push("play_pause_image", "songTitle", "artistName");

  ids.forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

function updateOverlay() {
  const icon =
    nowPlayingData && nowPlayingData.state === 1 ? PLAY_ICON : PAUSE_ICON;
  if (ui.isElementExist("overlay_image")) {
    ui.setElementProperties("overlay_image", {
      path: icon,
      imageTint: getOverlayIconColor(),
    });
  }
  if (ui.isElementExist("play_pause_image")) {
    ui.setElementProperties("play_pause_image", {
      path: icon,
      imageTint: getIconColor(),
    });
  }
}

function showOverlayForSmallStyle() {
  if (ui.isElementExist("overlay_shape") || ui.isElementExist("overlay_image"))
    return;
  const { w: SIZE } = getWidgetSize("small");

  if (nowPlayingData && nowPlayingData.available) {
    ui.addShape({
      id: "overlay_shape",
      type: "rectangle",
      x: 0,
      y: 0,
      width: SIZE,
      height: SIZE,
      fillColor: OVERLAY_COLOR,
      onLeftMouseUp: () => {
        playPauseMusic();
        updateOverlay();
      },
    });
    ui.addImage({
      id: "overlay_image",
      x: SIZE / 4,
      y: SIZE / 4,
      width: SIZE / 2,
      height: SIZE / 2,
      preserveAspectRatio: "crop",
      path: nowPlayingData.state === 1 ? PLAY_ICON : PAUSE_ICON,
      imageTint: getOverlayIconColor(),
    });
  } else {
    ui.addShape({
      id: "overlay_shape",
      type: "rectangle",
      x: 0,
      y: 0,
      width: SIZE,
      height: SIZE,
      fillColor: OVERLAY_COLOR,
    });
  }
}

function showOverlayOfNoMediaForSmallStyle() {
  if (ui.isElementExist("overlay_shape_no_media")) return;
  const { w: SIZE } = getWidgetSize("small");
  ui.addShape({
    id: "overlay_shape_no_media",
    type: "rectangle",
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE,
    fillColor: OVERLAY_COLOR,
  });
}

function showOverlayForMediumStyle() {
  const { w: SIZE } = getWidgetSize("medium");
  const CONTAINER_SIZE = SIZE / 1.8;

  if (
    ui.isElementExist("overlay_shape") ||
    ui.isElementExist("overlay_image") ||
    ui.isElementExist("previous_image") ||
    ui.isElementExist("next_image")
  )
    return;

  ui.beginUpdate();
  ui.addShape({
    id: "overlay_shape",
    type: "rectangle",
    x: 10 * SCALE,
    y: 10 * SCALE,
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    fillColor: OVERLAY_COLOR,
    radius: 8,
    strokeWidth: 0,
    onLeftMouseUp: () => {
      playPauseMusic();
      updateOverlay();
    },
  });
  ui.addImage({
    id: "overlay_image",
    x: 10 * SCALE + CONTAINER_SIZE / 4,
    y: 10 * SCALE + CONTAINER_SIZE / 4,
    width: CONTAINER_SIZE / 2,
    height: CONTAINER_SIZE / 2,
    preserveAspectRatio: "crop",
    path: nowPlayingData && nowPlayingData.state === 1 ? PLAY_ICON : PAUSE_ICON,
    imageTint: getOverlayIconColor(),
  });

  const shapeLeft = ui.getElementProperty("overlay_shape", "x");
  const shapeW = ui.getElementProperty("overlay_shape", "width");

  ui.addImage({
    id: "previous_image",
    x: shapeLeft + shapeW + 20 * SCALE,
    y: ui.getElementProperty("overlay_shape", "y") + 5 * SCALE,
    width: CONTAINER_SIZE / 3,
    height: CONTAINER_SIZE / 3,
    path: PREV_ICON,
    imageTint: getIconColor(),
  });
  ui.addImage({
    id: "next_image",
    x: ui.getElementProperty("previous_image", "x"),
    y: ui.getElementProperty("previous_image", "y") + 45 * SCALE,
    width: CONTAINER_SIZE / 3,
    height: CONTAINER_SIZE / 3,
    path: NEXT_ICON,
    imageTint: getIconColor(),
  });
  ui.endUpdate();
}

function showOverlayOfNoMediaForMediumStyle() {
  if (ui.isElementExist("overlay_shape_no_media")) return;
  const { w: SIZE } = getWidgetSize("medium");
  ui.addShape({
    id: "overlay_shape_no_media",
    type: "rectangle",
    x: 10 * SCALE,
    y: 10 * SCALE,
    width: SIZE / 1.8,
    height: SIZE / 1.8,
    radius: 8,
    strokeWidth: 0,
    fillColor: OVERLAY_COLOR,
  });
}

function showOverlayOfNoMediaForWideStyle() {
  if (ui.isElementExist("overlay_shape_no_media")) return;
  const { w: W, h: H } = getWidgetSize("wide");
  ui.addShape({
    id: "overlay_shape_no_media",
    type: "rectangle",
    x: 10 * SCALE,
    y: 15 * SCALE,
    width: W / 2.8,
    height: H / 1.25,
    radius: 8,
    strokeWidth: 0,
    fillColor: OVERLAY_COLOR,
  });
}

function showOverlayOfNoMediaForLargeStyle() {
  if (ui.isElementExist("overlay_shape_no_media")) return;
  const { w: SIZE } = getWidgetSize("large");
  ui.addShape({
    id: "overlay_shape_no_media",
    type: "rectangle",
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: OVERLAY_COLOR,
  });
}

function showOverlayForLargeStyle() {
  const { w: SIZE } = getWidgetSize("large");
  const HOVER_H = SIZE - 120 * SCALE;

  ui.addText({
    id: "songTitle",
    text: nowPlayingData.title,
    x: SIZE / 2,
    y: SIZE - HOVER_H / 2.3,
    width: SIZE - 15 * SCALE,
    fontSize: 18,
    fontColor: getFontColor(),
    fontFamily: FONT_FACE,
    fontWeight: "bold",
    textAlign: "center",
    textClip: "ellipsis",
  });
  ui.addText({
    id: "artistName",
    text: nowPlayingData.artist,
    x: SIZE / 2,
    y: ui.getElementProperty("songTitle", "y") + 30 * SCALE,
    width: SIZE - 15 * SCALE,
    fontSize: 16,
    fontColor: getFontSubtleColor(),
    fontFamily: FONT_FACE,
    fontWeight: "lighter",
    textAlign: "center",
    textClip: "ellipsis",
  });

  const CTRL_SIZE = 25 * SCALE;
  const ctrlsY = ui.getElementProperty("artistName", "y") + 40 * SCALE;
  const cx = SIZE / 2;

  ui.addImage({
    id: "previous_image",
    x: cx - CTRL_SIZE * 1.5 - 15 * SCALE,
    y: ctrlsY,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    path: PREV_ICON,
    imageTint: getIconColor(),
    onLeftMouseUp: () => previousMusic(),
  });
  ui.addImage({
    id: "play_pause_image",
    x: cx - CTRL_SIZE / 2,
    y: ctrlsY,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    path: nowPlayingData && nowPlayingData.state === 1 ? PLAY_ICON : PAUSE_ICON,
    imageTint: getIconColor(),
    onLeftMouseUp: () => playPauseMusic(),
  });
  ui.addImage({
    id: "next_image",
    x: cx + CTRL_SIZE / 2 + 15 * SCALE,
    y: ctrlsY,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    path: NEXT_ICON,
    imageTint: getIconColor(),
    onLeftMouseUp: () => nextMusic(),
  });
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize("small");

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
    onMouseOver: () => {
      if (nowPlayingData && nowPlayingData.available)
        showOverlayForSmallStyle();
    },
    onMouseLeave: hideOverlay,
  });
  ui.addImage({
    id: "thumbnail",
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE,
    preserveAspectRatio: "crop",
    path: DEFAULT_THUMBNAIL,
  });
  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize("medium");
  const CONTAINER_SIZE = SIZE / 1.8;

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
    onMouseOver: () => {
      if (nowPlayingData && nowPlayingData.available)
        showOverlayForMediumStyle();
    },
    onMouseLeave: hideOverlay,
  });
  ui.addShape({
    id: "container",
    x: 10 * SCALE,
    y: 10 * SCALE,
    type: "rectangle",
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    strokeWidth: 0,
    radius: 8,
  });
  ui.addShape({
    id: "container_mask",
    type: "rectangle",
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    strokeWidth: 0,
    fillColor: "rgba(200,200,200,0.1)",
    container: "container",
  });
  ui.addImage({
    id: "thumbnail",
    x: 0,
    y: 0,
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    preserveAspectRatio: "crop",
    path: DEFAULT_THUMBNAIL,
    container: "container",
  });
  ui.addText({
    id: "songTitle",
    text: "Song Title",
    x: 10 * SCALE,
    y: CONTAINER_SIZE + 20 * SCALE,
    width: SIZE - 20 * SCALE,
    fontSize: 16,
    fontColor: getFontColor(),
    fontFamily: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
    textClip: "ellipsis",
  });
  ui.addText({
    id: "artistName",
    text: "Artist Name",
    x: 10 * SCALE,
    y: CONTAINER_SIZE + 45 * SCALE,
    width: SIZE - 20 * SCALE,
    fontSize: 14,
    fontColor: getFontSubtleColor(),
    fontFamily: FONT_FACE,
    fontWeight: "lighter",
    textAlign: "left",
    textClip: "ellipsis",
  });
  ui.endUpdate();
}

function wideStyle() {
  const { w: W, h: H } = getWidgetSize("wide");
  const CONTAINER_W = W / 2.8;
  const CONTAINER_H = H / 1.25;

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: W,
    height: H,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addShape({
    id: "container",
    x: 10 * SCALE,
    y: 15 * SCALE,
    type: "rectangle",
    width: CONTAINER_W,
    height: CONTAINER_H,
    strokeWidth: 0,
    radius: 8,
  });
  ui.addShape({
    id: "container_mask",
    type: "rectangle",
    width: CONTAINER_W,
    height: CONTAINER_H,
    strokeWidth: 0,
    fillColor: "rgba(200,200,200,0.1)",
    container: "container",
  });
  ui.addImage({
    id: "thumbnail",
    x: 0,
    y: 0,
    width: CONTAINER_W,
    height: CONTAINER_H,
    preserveAspectRatio: "crop",
    path: DEFAULT_THUMBNAIL,
    container: "container",
  });

  const textLeft = 10 * SCALE + CONTAINER_W + 20 * SCALE;
  ui.addText({
    id: "songTitle",
    text: "No Media Playing",
    x: textLeft,
    y: 35 * SCALE,
    width: W - textLeft - 10 * SCALE,
    fontSize: 18,
    fontColor: getFontColor(),
    fontFamily: FONT_FACE,
    fontWeight: "bold",
    textAlign: "left",
    textClip: "ellipsis",
  });
  ui.addText({
    id: "artistName",
    text: "-",
    x:
      ui.getElementProperty("songTitle", "x") +
      ui.getElementProperty("songTitle", "width") / 2,
    y: 75 * SCALE,
    width: W - textLeft - 10 * SCALE,
    fontSize: 16,
    fontColor: getFontSubtleColor(),
    fontFamily: FONT_FACE,
    fontWeight: "lighter",
    textAlign: "center",
    textClip: "ellipsis",
  });

  const CTRL_SIZE = 25 * SCALE;
  const rightAreaStart = 10 * SCALE + CONTAINER_W;
  const rightAreaW = W - rightAreaStart - 10 * SCALE;
  const ctrlsX = rightAreaStart + rightAreaW / 2;
  const ctrlsY = ui.getElementProperty("artistName", "y") + 35 * SCALE;

  ui.addImage({
    id: "previous_image",
    x: ctrlsX - CTRL_SIZE * 1.5 - 15 * SCALE,
    y: ctrlsY,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    path: PREV_ICON,
    imageTint: getIconColor(),
    onLeftMouseUp: () => previousMusic(),
  });
  ui.addImage({
    id: "play_pause_image",
    x: ctrlsX - CTRL_SIZE / 2,
    y: ctrlsY,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    path: nowPlayingData && nowPlayingData.state === 1 ? PLAY_ICON : PAUSE_ICON,
    imageTint: getIconColor(),
    onLeftMouseUp: () => playPauseMusic(),
  });
  ui.addImage({
    id: "next_image",
    x: ctrlsX + CTRL_SIZE / 2 + 15 * SCALE,
    y: ctrlsY,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    path: NEXT_ICON,
    imageTint: getIconColor(),
    onLeftMouseUp: () => nextMusic(),
  });
  ui.endUpdate();
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize("large");
  const HOVER_H = SIZE - 120 * SCALE;

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
    onMouseOver: () => {
      if (nowPlayingData && nowPlayingData.available) {
        ui.setElementProperty("container", "height", HOVER_H);
        showOverlayForLargeStyle();
      }
    },
    onMouseLeave: () => {
      ui.setElementProperty("container", "height", SIZE);
      hideOverlay();
    },
  });
  ui.addShape({
    id: "container",
    x: 0,
    y: 0,
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
  });
  ui.addImage({
    id: "thumbnail",
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE,
    preserveAspectRatio: "crop",
    path: DEFAULT_THUMBNAIL,
    container: "container",
  });
  ui.endUpdate();
}

function render() {
  if (playerStyle === "small") smallStyle();
  else if (playerStyle === "medium") mediumStyle();
  else if (playerStyle === "wide") wideStyle();
  else largeStyle();
}

function clearUI() {
  [
    "background_Shape",
    "container",
    "thumbnail",
    "overlay_shape",
    "overlay_image",
    "previous_image",
    "play_pause_image",
    "next_image",
    "songTitle",
    "artistName",
    "overlay_shape_no_media",
  ].forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

render();

if (playerStyle === "small") showOverlayOfNoMediaForSmallStyle();
if (playerStyle === "medium") showOverlayOfNoMediaForMediumStyle();
if (playerStyle === "wide") showOverlayOfNoMediaForWideStyle();
if (playerStyle === "large") showOverlayOfNoMediaForLargeStyle();

ipcRenderer.on("changePlayerStyle", (event, style) => {
  ui.beginUpdate();
  playerStyle = style;
  clearUI();
  render();

  const showFns = {
    small: showOverlayOfNoMediaForSmallStyle,
    medium: showOverlayOfNoMediaForMediumStyle,
    wide: showOverlayOfNoMediaForWideStyle,
    large: showOverlayOfNoMediaForLargeStyle,
  };
  if (!nowPlayingData || !nowPlayingData.available) {
    if (showFns[style]) showFns[style]();
  }
  ui.endUpdate();
});

// Update album art, track title, artist, and show/hide the no-media placeholder.
ipcRenderer.on("nowPlayingUpdate", (event, data) => {
  nowPlayingData = data;

  if (ui.isElementExist("thumbnail")) {
    ui.setElementProperty(
      "thumbnail",
      "path",
      data.available ? data.thumbnail : DEFAULT_THUMBNAIL,
    );
  }

  if (data.available) {
    if (ui.isElementExist("songTitle"))
      ui.setElementProperty("songTitle", "text", data.title);
    if (ui.isElementExist("artistName"))
      ui.setElementProperty("artistName", "text", data.artist);
  } else {
    if (ui.isElementExist("songTitle"))
      ui.setElementProperty("songTitle", "text", "No Media Playing");
    if (ui.isElementExist("artistName"))
      ui.setElementProperty("artistName", "text", "-");
  }

  const hasMedia = data.available;
  const style = playerStyle;

  const showFns = {
    small: showOverlayOfNoMediaForSmallStyle,
    medium: showOverlayOfNoMediaForMediumStyle,
    wide: showOverlayOfNoMediaForWideStyle,
    large: showOverlayOfNoMediaForLargeStyle,
  };

  if (hasMedia) {
    if (ui.isElementExist("overlay_shape_no_media"))
      ui.removeElementById("overlay_shape_no_media");
  } else if (showFns[style] && !ui.isElementExist("overlay_shape_no_media")) {
    showFns[style]();
  }

  updateOverlay();
});
