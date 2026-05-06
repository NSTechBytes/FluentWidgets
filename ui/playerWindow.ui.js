var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;
var NOWPLAYING_DATA = null;

var DEFAULT_THUMBNAIL = "assets/player/music.png";
var PLAY_ICON = "assets/player/pause.png";
var PAUSE_ICON = "assets/player/play.png";

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

//============================================================================
// Media control functions
//============================================================================

function playPauseMusic() {
  ipcRenderer.send("playPause");
}

//============================================================================
// Overlay functions
//============================================================================

function hideOverlay() {
  if (ui.isElementExist("overlay_shape")) ui.removeElementById("overlay_shape");
  if (ui.isElementExist("overlay_image")) ui.removeElementById("overlay_image");
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

smallStyle();

if (JSON_DATA.WINDOW_STYLES.PLAYER_WINDOW == "small") {
  showOverlayOfNoMedia();
}

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
