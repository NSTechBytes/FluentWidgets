var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;
var FONT_TYPE = JSON_DATA.FONT_TYPE;
var CURRENT_STYLE = JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW;

function getBackgroundColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.BACKGROUND_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.BACKGROUND_COLOR;
  }
}

function getSubtleColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.SUBTLE_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.SUBTLE_COLOR;
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
    fontFace: FONT_TYPE,
    textAlign: "center",
  });

  // Seconds (SS)
  ui.addText({
    id: "seconds-text",
    x: BACKGROUND_WIDTH / 2 + 110 * SCALE,
    y: 30 * SCALE,
    text: "00",
    fontSize: 35 * SCALE,
    fontColor: getSubtleColor(),
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  // Date
  ui.addText({
    id: "date-text",
    x: BACKGROUND_WIDTH / 2,
    y: 115 * SCALE,
    text: "Date Loading...",
    fontSize: 22 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "center",
  });

  ui.endUpdate();
}

// Style selection

function largeStyle() {
  var SIZE = 360 * SCALE;
  var CENTER = SIZE / 2;

  ui.beginUpdate();

  // Background
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    fillColor: getBackgroundColor(),
  });

  ui.addShape({
    id: "ellipse_Shape",
    type: "ellipse",
    x: 10 * SCALE,
    y: 10 * SCALE,
    width: SIZE - 20 * SCALE,
    height: SIZE - 20 * SCALE,
    strokeWidth: 0 * SCALE,
    fillColor: getBackgroundColor(),
  });

  // Face
  var faceImage =
    JSON_DATA.APPEARANCE.THEME === "dark"
      ? "assets/icons/face-1.png"
      : "assets/icons/face-0.png";
  ui.addImage({
    id: "clock-face",
    x: 10 * SCALE,
    y: 10 * SCALE,
    width: SIZE - 20 * SCALE,
    height: SIZE - 20 * SCALE,
    path: faceImage,
  });

  // Hands (Initial at 12:00:00)
  ui.addShape({
    id: "hour-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 60 * SCALE,
    strokeColor: getTextColor(),
    strokeWidth: 8 * SCALE,
  });

  ui.addShape({
    id: "minute-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 100 * SCALE,
    strokeColor: getTextColor(),
    strokeWidth: 5 * SCALE,
  });

  ui.addShape({
    id: "second-hand",
    type: "line",
    startX: CENTER,
    startY: CENTER,
    endX: CENTER,
    endY: CENTER - 120 * SCALE,
    strokeColor: "orange",
    strokeWidth: 2 * SCALE,
  });

  // Center pin
  ui.addShape({
    id: "pin",
    type: "ellipse",
    x: CENTER - 6 * SCALE,
    y: CENTER - 6 * SCALE,
    width: 12 * SCALE,
    height: 12 * SCALE,
    fillColor: "orange",
    strokeColor: getTextColor(),
    strokeWidth: 2 * SCALE,
  });

  ui.endUpdate();
}

// Style selection
if (CURRENT_STYLE === "wide") wideStyle();
else if (CURRENT_STYLE === "large") largeStyle();
else wideStyle(); // Default

var HOUR = 0;
var MINUTE = 0;
var SECOND = 0;

function updateHands() {
  if (CURRENT_STYLE !== "large") return;

  var CENTER = (360 * SCALE) / 2;

  // Hour hand (360/12 = 30 degrees per hour, 30/60 = 0.5 degrees per minute)
  var hourAngle = (HOUR % 12) * 30 + MINUTE * 0.5;
  var hourRad = (hourAngle * Math.PI) / 180;
  var hourLen = 60 * SCALE;
  ui.setElementProperties("hour-hand", {
    endX: CENTER + hourLen * Math.sin(hourRad),
    endY: CENTER - hourLen * Math.cos(hourRad),
  });

  // Minute hand (360/60 = 6 degrees per minute)
  var minAngle = MINUTE * 6;
  var minRad = (minAngle * Math.PI) / 180;
  var minLen = 105 * SCALE;
  ui.setElementProperties("minute-hand", {
    endX: CENTER + minLen * Math.sin(minRad),
    endY: CENTER - minLen * Math.cos(minRad),
  });

  // Second hand (360/60 = 6 degrees per second)
  var secAngle = SECOND * 6;
  var secRad = (secAngle * Math.PI) / 180;
  var secLen = 125 * SCALE;
  ui.setElementProperties("second-hand", {
    endX: CENTER + secLen * Math.sin(secRad),
    endY: CENTER - secLen * Math.cos(secRad),
  });
}

ipcRenderer.on("timeUpdate", (event, timeStr) => {
  if (CURRENT_STYLE === "wide") {
    if (ui.isElementExist("time-text")) {
      ui.setElementProperty("time-text", "text", timeStr);
    }
  } else if (CURRENT_STYLE === "large") {
    var parts = timeStr.split(":");
    HOUR = parseInt(parts[0]);
    MINUTE = parseInt(parts[1]);
    updateHands();
  }
});

ipcRenderer.on("secondsUpdate", (event, secondsStr) => {
  if (CURRENT_STYLE === "wide") {
    if (ui.isElementExist("seconds-text")) {
      ui.setElementProperty("seconds-text", "text", secondsStr);
    }
  } else if (CURRENT_STYLE === "large") {
    SECOND = parseInt(secondsStr);
    updateHands();
  }
});

ipcRenderer.on("dateUpdate", (event, dateStr) => {
  if (ui.isElementExist("date-text")) {
    ui.setElementProperty("date-text", "text", dateStr);
  }
});
