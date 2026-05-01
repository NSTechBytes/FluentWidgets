var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;

function getBackgroundColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.BACKGROUND_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.BACKGROUND_COLOR;
  }
}

function getTextColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.FONT_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.FONT_COLOR;
  }
}

function wideStyle() {
  var BACKGROUND_WIDTH = 350 * SCALE;
  var BACKGROUND_HEIGHT = 160 * SCALE;

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  // Time (HH:MM)
  ui.addText({
    id: "time-text",
    x: BACKGROUND_WIDTH / 2 - 15 * SCALE,
    y: 5 * SCALE,
    text: "00:00",
    fontSize: 90 * SCALE,
    fontColor: getTextColor(),
    fontFace: "Segoe UI Semilight",
    textAlign: "center",
  });

  // Seconds (SS)
  ui.addText({
    id: "seconds-text",
    x: BACKGROUND_WIDTH / 2 + 110 * SCALE,
    y: 30 * SCALE,
    text: "00",
    fontSize: 35 * SCALE,
    fontColor: getTextColor(),
    fontFace: "Segoe UI Semilight",
    textAlign: "left",
    opacity: 120,
  });

  // Date
  ui.addText({
    id: "date-text",
    x: BACKGROUND_WIDTH / 2,
    y: 115 * SCALE,
    text: "Date Loading...",
    fontSize: 22 * SCALE,
    fontColor: getTextColor(),
    fontFace: "Segoe UI",
    textAlign: "center",
  });

  ui.endUpdate();
}

// Style selection
var CURRENT_STYLE = JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW;
if (CURRENT_STYLE === "wide") wideStyle();
else wideStyle(); // Default

ipcRenderer.on("timeUpdate", (event, timeStr) => {
  if (ui.isElementExist("time-text")) {
    ui.setElementProperty("time-text", "text", timeStr);
  }
});

ipcRenderer.on("secondsUpdate", (event, secondsStr) => {
  if (ui.isElementExist("seconds-text")) {
    ui.setElementProperty("seconds-text", "text", secondsStr);
  }
});

ipcRenderer.on("dateUpdate", (event, dateStr) => {
  if (ui.isElementExist("date-text")) {
    ui.setElementProperty("date-text", "text", dateStr);
  }
});
