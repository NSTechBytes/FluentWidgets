var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;
var FONT_TYPE = JSON_DATA.FONT_TYPE;
var CURRENT_STYLE = JSON_DATA.WINDOW_STYLES.WEATHER_WINDOW;

function getBackgroundColor() {
  if (JSON_DATA.APPEARANCE.THEME === "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.BACKGROUND_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.BACKGROUND_COLOR;
  }
}

function getTextColor() {
  if (JSON_DATA.APPEARANCE.THEME === "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.FONT_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.FONT_COLOR;
  }
}

function getSubtleColor() {
  return "rgba(128, 128, 128, 0.5)"; // A more subdued color for the forecast
}

function largeStyle() {
  var BACKGROUND_SIZE = 360 * SCALE;
  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_SIZE,
    height: BACKGROUND_SIZE,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  ui.addText({
    id: "city-name-text",
    x: 20 * SCALE,
    y: 20 * SCALE,
    text: "City",
    fontSize: 16 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    fontWeight: "bold",
    textAlign: "left",
  });

  ui.addText({
    id: "current-temp-text",
    x: 20 * SCALE,
    y: 50 * SCALE,
    text: "0°",
    fontSize: 60 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  ui.addText({
    id: "high-low-text",
    x: 340 * SCALE,
    y: 75 * SCALE,
    text: "↓ 0° ↑ 0°",
    fontSize: 14 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "right",
  });

  // Hourly row
  for (let i = 0; i < 6; i++) {
    let bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({
      id: "hourly-time-" + i,
      x: bx + 10 * SCALE,
      y: 130 * SCALE,
      text: "00",
      fontSize: 12 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
    ui.addText({
      id: "hourly-temp-" + i,
      x: bx + 10 * SCALE,
      y: 160 * SCALE,
      text: "0°",
      fontSize: 16 * SCALE,
      fontColor: getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
  }

  // Daily list
  for (let i = 0; i < 6; i++) {
    let by = 210 * SCALE + i * 25 * SCALE;
    ui.addText({
      id: "daily-day-" + i,
      x: 20 * SCALE,
      y: by,
      text: "Day",
      fontSize: 14 * SCALE,
      fontColor: getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "left",
    });
    ui.addText({
      id: "daily-min-" + i,
      x: 140 * SCALE,
      y: by,
      text: "0°",
      fontSize: 14 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_TYPE,
      textAlign: "right",
    });

    // Bar background
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

    // Bar foreground
    ui.addShape({
      id: "daily-bar-fg-" + i,
      type: "rectangle",
      x: 150 * SCALE,
      y: by + 5 * SCALE,
      width: 0,
      height: 4 * SCALE,
      radius: 2 * SCALE,
      strokeWidth: 0,
      fillColor: getTextColor(),
    });

    ui.addText({
      id: "daily-max-" + i,
      x: 340 * SCALE,
      y: by,
      text: "0°",
      fontSize: 14 * SCALE,
      fontColor: getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "right",
    });
  }

  ui.endUpdate();
}

function wideStyle() {
  var BACKGROUND_WIDTH = 360 * SCALE;
  var BACKGROUND_HEIGHT = 160 * SCALE;
  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  ui.addText({
    id: "city-name-text",
    x: 20 * SCALE,
    y: 15 * SCALE,
    text: "City",
    fontSize: 14 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    fontWeight: "bold",
    textAlign: "left",
  });

  ui.addText({
    id: "current-temp-text",
    x: 20 * SCALE,
    y: 40 * SCALE,
    text: "0°",
    fontSize: 48 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  // Hourly row
  for (let i = 0; i < 6; i++) {
    let bx = 20 * SCALE + i * 55 * SCALE;
    ui.addText({
      id: "hourly-time-" + i,
      x: bx + 10 * SCALE,
      y: 110 * SCALE,
      text: "00",
      fontSize: 12 * SCALE,
      fontColor: getSubtleColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
    ui.addText({
      id: "hourly-temp-" + i,
      x: bx + 10 * SCALE,
      y: 135 * SCALE,
      text: "0°",
      fontSize: 14 * SCALE,
      fontColor: getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
  }

  ui.endUpdate();
}

function mediumStyle() {
  var BACKGROUND_SIZE = 160 * SCALE;
  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_SIZE,
    height: BACKGROUND_SIZE,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  ui.addText({
    id: "city-name-text",
    x: 15 * SCALE,
    y: 15 * SCALE,
    text: "City",
    fontSize: 14 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    fontWeight: "bold",
    textAlign: "left",
  });

  ui.addText({
    id: "current-temp-text",
    x: 15 * SCALE,
    y: 45 * SCALE,
    text: "0°",
    fontSize: 50 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  ui.endUpdate();
}

function smallStyle() {
  var BACKGROUND_SIZE = 75 * SCALE;
  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_SIZE,
    height: BACKGROUND_SIZE,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  ui.addText({
    id: "current-temp-text",
    x: BACKGROUND_SIZE / 2,
    y: 20 * SCALE,
    text: "0°",
    fontSize: 34 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "center",
  });

  ui.endUpdate();
}

// Style selection
if (CURRENT_STYLE === "large") {
  largeStyle();
} else if (CURRENT_STYLE === "wide") {
  wideStyle();
} else if (CURRENT_STYLE === "medium") {
  mediumStyle();
} else if (CURRENT_STYLE === "small") {
  smallStyle();
} else {
  largeStyle(); // Default to large for now
}

ipcRenderer.on("weatherUpdate", (event, data) => {
  ui.beginUpdate();

  if (ui.isElementExist("city-name-text")) {
    ui.setElementProperty("city-name-text", "text", data.cityName);
  }

  if (ui.isElementExist("current-temp-text")) {
    ui.setElementProperty("current-temp-text", "text", data.currentTemp + "°");
  }

  if (CURRENT_STYLE === "large") {
    if (ui.isElementExist("high-low-text")) {
      ui.setElementProperty(
        "high-low-text",
        "text",
        "↓ " + data.todayLow + "° ↑ " + data.todayHigh + "°",
      );
    }
  }

  if (CURRENT_STYLE === "large" || CURRENT_STYLE === "wide") {
    for (let i = 0; i < 6; i++) {
      if (ui.isElementExist("hourly-time-" + i) && data.hourlyForecast[i]) {
        ui.setElementProperty(
          "hourly-time-" + i,
          "text",
          data.hourlyForecast[i].time,
        );
        ui.setElementProperty(
          "hourly-temp-" + i,
          "text",
          data.hourlyForecast[i].temp + "°",
        );
      }
    }
  }

  if (CURRENT_STYLE === "large") {
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (let i = 0; i < 6; i++) {
      if (data.dailyForecast[i]) {
        if (data.dailyForecast[i].min < globalMin)
          globalMin = data.dailyForecast[i].min;
        if (data.dailyForecast[i].max > globalMax)
          globalMax = data.dailyForecast[i].max;
      }
    }

    let range = globalMax - globalMin;
    if (range === 0) range = 1;
    let MAX_BAR_WIDTH = 130 * SCALE;
    let meterStep = MAX_BAR_WIDTH / range;

    for (let i = 0; i < 6; i++) {
      if (ui.isElementExist("daily-day-" + i) && data.dailyForecast[i]) {
        ui.setElementProperty(
          "daily-day-" + i,
          "text",
          data.dailyForecast[i].day,
        );
        ui.setElementProperty(
          "daily-min-" + i,
          "text",
          data.dailyForecast[i].min + "°",
        );
        ui.setElementProperty(
          "daily-max-" + i,
          "text",
          data.dailyForecast[i].max + "°",
        );

        let barXOffset = (data.dailyForecast[i].min - globalMin) * meterStep;
        let barWidth =
          (data.dailyForecast[i].max - data.dailyForecast[i].min) * meterStep;
        if (barWidth < 4 * SCALE) barWidth = 4 * SCALE;

        if (ui.isElementExist("daily-bar-fg-" + i)) {
          ui.setElementProperty(
            "daily-bar-fg-" + i,
            "x",
            150 * SCALE + barXOffset,
          );
          ui.setElementProperty("daily-bar-fg-" + i, "width", barWidth);
        }
      }
    }
  }

  ui.endUpdate();
});
