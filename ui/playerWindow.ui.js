var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;

var DEFAULT_THUMBNAIL = "assets/player/music.png";

function getBackgroundColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.BACKGROUND_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.BACKGROUND_COLOR;
  }
}

function smallStyle() {
  var SIZE = 75 * SCALE;

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
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
}

ipcRenderer.on("nowPlayingUpdate", (event, data) => {
  console.log(JSON.stringify(data, null, 2));

  if (data.available) {
    ui.setElementProperty("thumbnail", "path", data.thumbnail);
  } else {
    ui.setElementProperty("thumbnail", "path", DEFAULT_THUMBNAIL);
  }
});

smallStyle();
