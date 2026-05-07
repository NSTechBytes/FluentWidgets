var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;
var NOWPLAYING_DATA = null;

var DEFAULT_THUMBNAIL = "assets/player/music.png";
var PLAY_ICON = "assets/player/pause.png";
var PAUSE_ICON = "assets/player/play.png";
var PREVIOUS_ICON = "assets/player/back.png";
var NEXT_ICON = "assets/player/next.png";

//============================================================================
// Color getter functions
//============================================================================

function getBackgroundColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.BACKGROUND_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.BACKGROUND_COLOR;
  }
}

function getFontColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    console.log(JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.FONT_COLOR);
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.FONT_COLOR;
  } else {
    console.log(JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.FONT_COLOR);
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.FONT_COLOR;
  }
}

function getFontSubtleColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.SUBTLE_FONT_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.SUBTLE_FONT_COLOR;
  }
}
//============================================================================
// Media control functions
//============================================================================

function playPauseMusic() {
  ipcRenderer.send("playPause");
}

function nextMusic() {
  ipcRenderer.send("next");
}

function previousMusic() {
  ipcRenderer.send("previous");
}

//============================================================================
// Overlay functions
//============================================================================

function hideOverlay() {
  if (ui.isElementExist("overlay_shape")) ui.removeElementById("overlay_shape");
  if (ui.isElementExist("overlay_image")) ui.removeElementById("overlay_image");
  if (ui.isElementExist("previous_image")) ui.removeElementById("previous_image");
  if (ui.isElementExist("next_image")) ui.removeElementById("next_image");
}

function updateOverlay() {
  if (NOWPLAYING_DATA && ui.isElementExist("overlay_image")) {
    ui.setElementProperty(
      "overlay_image",
      "path",
      NOWPLAYING_DATA.state == 1 ? PLAY_ICON : PAUSE_ICON,
    );
  }
}

function showOverlayOfNoMedia() {
  if (ui.isElementExist("overlay_shape_no_media")) return;

  var SIZE = 75 * SCALE;
  ui.addShape({
    id: "overlay_shape_no_media",
    type: "rectangle",
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE,
    fillColor: "rgba(0,0,0,0.8)",
  });
}

function showOverlayForSmallStyle() {
  if (ui.isElementExist("overlay_shape") || ui.isElementExist("overlay_image"))
    return;

  var SIZE = 75 * SCALE;
  if (NOWPLAYING_DATA && NOWPLAYING_DATA.available) {
    ui.addShape({
      id: "overlay_shape",
      type: "rectangle",
      x: 0,
      y: 0,
      width: SIZE,
      height: SIZE,
      fillColor: "rgba(0,0,0,0.8)",
      onLeftMouseUp: function () {
        playPauseMusic();
        if (NOWPLAYING_DATA) {
          updateOverlay();
        }
      },
    });
    ui.addImage({
      id: "overlay_image",
      x: SIZE / 2 - SIZE / 2 / 2,
      y: SIZE / 2 - SIZE / 2 / 2,
      width: SIZE / 2,
      height: SIZE / 2,
      preserveAspectRatio: "crop",
      path: NOWPLAYING_DATA.state == 1 ? PLAY_ICON : PAUSE_ICON,
    });
  } else {
    ui.addShape({
      id: "overlay_shape",
      type: "rectangle",
      x: 0,
      y: 0,
      width: SIZE,
      height: SIZE,
      fillColor: "rgba(0,0,0,0.8)",
    });
  }
}

function showOverlayForMediumStyle() {
  var SIZE = 160 * SCALE;
  var CONTAINER_SIZE = SIZE / 1.8;

  if (ui.isElementExist("overlay_shape") || ui.isElementExist("overlay_image") || ui.isElementExist("previous_image") || ui.isElementExist("next_image"))
    return;

  ui.beginUpdate();

  // if (NOWPLAYING_DATA && NOWPLAYING_DATA.available) {

  ui.addShape({
    id: "overlay_shape",
    type: "rectangle",
    x: 10 * SCALE,
    y: 10 * SCALE,
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    fillColor: "rgba(0,0,0,0.8)",
    radius: 8,
    strokeWidth: 0,
    onLeftMouseUp: function () {
      playPauseMusic();
      if (NOWPLAYING_DATA) {
        updateOverlay();
      }
    },
  });

  ui.addImage({
    id: "overlay_image",
    x: (10 * SCALE) + (CONTAINER_SIZE / 2) - (CONTAINER_SIZE / 2 / 2),
    y: (10 * SCALE) + (CONTAINER_SIZE / 2) - (CONTAINER_SIZE / 2 / 2),
    width: CONTAINER_SIZE / 2,
    height: CONTAINER_SIZE / 2,
    preserveAspectRatio: "crop",
    path: NOWPLAYING_DATA.state == 1 ? PLAY_ICON : PAUSE_ICON,
  });

  ui.addImage({
    id: "previous_image",
    x: ui.getElementProperty("overlay_shape", "x") + ui.getElementProperty("overlay_shape", "width") + (20 * SCALE),
    y: ui.getElementProperty("overlay_shape", "y") + (5 * SCALE),
    width: CONTAINER_SIZE / 3,
    height: CONTAINER_SIZE / 3,
    path: PREVIOUS_ICON,
  });

  ui.addImage({
    id: "next_image",
    x: ui.getElementProperty("previous_image", "x"),
    y: ui.getElementProperty("previous_image", "y") + (45 * SCALE),
    width: CONTAINER_SIZE / 3,
    height: CONTAINER_SIZE / 3,
    path: NEXT_ICON,
  });

  ui.endUpdate();
}
// }
//============================================================================
// Styles
//============================================================================

function smallStyle() {
  var SIZE = 75 * SCALE;
  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
    onMouseOver: function () {
      if (NOWPLAYING_DATA && NOWPLAYING_DATA.available) {
        showOverlayForSmallStyle();
      }
    },
    onMouseLeave: function () {
      hideOverlay();
    },
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
  var SIZE = 160 * SCALE;
  var CONTAINER_SIZE = SIZE / 1.8;

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
    onMouseOver: function () {
      if (NOWPLAYING_DATA && NOWPLAYING_DATA.available) {
        showOverlayForMediumStyle();
      }
    },
    onMouseLeave: function () {
      hideOverlay();
    },
  });

  ui.addShape({
    id: "container",
    x: 10 * SCALE,
    y: 10 * SCALE,
    type: "rectangle",
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    strokeWidth: 0,
    radius: 8
  });

  ui.addShape({
    id: "container_mask",
    type: "rectangle",
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    strokeWidth: 0,
    fillColor: "rgba(200,200,200,0.1)",
    container: "container"
  });

  ui.addImage({
    id: "thumbnail",
    x: 0,
    y: 0,
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    preserveAspectRatio: "crop",
    path: DEFAULT_THUMBNAIL,
    container: "container"
  });

  ui.addText({
    id: "songTitle",
    text: "Song Title",
    x: 10 * SCALE,
    y: CONTAINER_SIZE + 20 * SCALE,
    width: SIZE - (20 * SCALE),
    fontSize: 16,
    fontColor: getFontColor(),
    fontFamily: "Segoe UI",
    fontWeight: "bold",
    textAlign: "left",
    textClip: "ellipsis",
  });

  ui.addText({
    id: "artistName",
    text: "Artist Name",
    x: 10 * SCALE,
    y: CONTAINER_SIZE + 45 * SCALE,
    width: SIZE - (20 * SCALE),
    fontSize: 14,
    fontColor: getFontSubtleColor(),
    fontFamily: "Segoe UI",
    fontWeight: "lighter",
    textAlign: "left",
    textClip: "ellipsis"
  });

  ui.endUpdate();
}

mediumStyle();

// if (JSON_DATA.WINDOW_STYLES.PLAYER_WINDOW == "small") {
//   showOverlayOfNoMedia();
// }

//============================================================================
// Events
//============================================================================

ipcRenderer.on("nowPlayingUpdate", (event, data) => {
  // console.log(JSON.stringify(data, null, 2));
  NOWPLAYING_DATA = data;

  if (ui.isElementExist("thumbnail")) {
    if (data.available) {
      ui.setElementProperty("thumbnail", "path", data.thumbnail);
    } else {
      ui.setElementProperty("thumbnail", "path", DEFAULT_THUMBNAIL);
    }
  }

  if (data.available) {
    if (ui.isElementExist("songTitle"))
      ui.setElementProperty("songTitle", "text", data.title);
    if (ui.isElementExist("artistName"))
      ui.setElementProperty("artistName", "text", data.artist);
  }
  else {
    if (ui.isElementExist("songTitle"))
      ui.setElementProperty("songTitle", "text", "No Media Playing");
    if (ui.isElementExist("artistName"))
      ui.setElementProperty("artistName", "text", "-");
  }

  var hasMedia = NOWPLAYING_DATA && NOWPLAYING_DATA.available;
  var isSmall = JSON_DATA.WINDOW_STYLES.PLAYER_WINDOW == "small";

  if (isSmall) {
    if (hasMedia) {
      if (ui.isElementExist("overlay_shape_no_media")) {
        ui.removeElementById("overlay_shape_no_media");
      }
    } else {
      if (!ui.isElementExist("overlay_shape_no_media")) {
        showOverlayOfNoMedia();
      }
    }
  }

  updateOverlay();
});
