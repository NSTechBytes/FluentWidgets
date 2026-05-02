var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;
var FONT_TYPE = JSON_DATA.FONT_TYPE;
var CURRENT_STYLE = JSON_DATA.WINDOW_STYLES.CALENDAR_WINDOW;

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

function largeStyle() {
  var SIZE = 360 * SCALE;

  ui.beginUpdate();

  // Background
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    radius: 20 * SCALE,
    fillColor: getBackgroundColor(),
  });

  // Month Text
  ui.addText({
    id: "month-text",
    x: 35 * SCALE,
    y: 35 * SCALE,
    text: "MONTH",
    fontSize: 24 * SCALE,
    fontColor: "#F44336",
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  // Highlight Circle (drawn before text so it sits behind)
  ui.addShape({
    id: "current-day-highlight",
    type: "ellipse",
    x: -100, // hidden offscreen initially
    y: -100,
    width: 36 * SCALE,
    height: 36 * SCALE,
    fillColor: "#F44336",
    strokeWidth: 0,
    opacity: 0,
  });

  // Weekdays (M T W T F S S)
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    ui.addText({
      id: "weekday_" + i,
      x: 45 * SCALE + i * 45 * SCALE,
      y: 80 * SCALE,
      text: weekdays[i],
      fontSize: 22 * SCALE,
      fontColor: i >= 5 ? getSubtleColor() : getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
  }

  // Days Grid (6 rows x 7 cols)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      let cellIndex = row * 7 + col;
      ui.addText({
        id: "day_" + cellIndex,
        x: 45 * SCALE + col * 45 * SCALE,
        y: 130 * SCALE + row * 40 * SCALE,
        text: "",
        fontSize: 20 * SCALE,
        fontColor: getTextColor(),
        fontFace: FONT_TYPE,
        textAlign: "center",
      });
    }
  }

  ui.endUpdate();
}

function wideStyle() {
  var BACKGROUND_WIDTH = 350 * SCALE;
  var BACKGROUND_HEIGHT = 160 * SCALE;

  ui.beginUpdate();

  // Background
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  // Left Side (Current Day)
  ui.addText({
    id: "day-name-text",
    x: 20 * SCALE,
    y: 15 * SCALE,
    text: "DAY",
    fontSize: 14 * SCALE,
    fontColor: "#F44336",
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  ui.addText({
    id: "current-date-text",
    x: 20 * SCALE,
    y: 40 * SCALE,
    text: "0",
    fontSize: 60 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  // Right Side (Calendar Grid)
  ui.addText({
    id: "month-text",
    x: 186 * SCALE,
    y: 15 * SCALE,
    text: "MONTH",
    fontSize: 14 * SCALE,
    fontColor: "#F44336",
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  ui.addShape({
    id: "current-day-highlight",
    type: "ellipse",
    x: -100, // hidden offscreen initially
    y: -100,
    width: 20 * SCALE,
    height: 20 * SCALE,
    fillColor: "#F44336",
    strokeWidth: 0,
    opacity: 0,
  });

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    ui.addText({
      id: "weekday_" + i,
      x: 190 * SCALE + i * 23 * SCALE,
      y: 35 * SCALE,
      text: weekdays[i],
      fontSize: 11 * SCALE,
      fontColor: i >= 5 ? getSubtleColor() : getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
  }

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      let cellIndex = row * 7 + col;
      ui.addText({
        id: "day_" + cellIndex,
        x: 190 * SCALE + col * 23 * SCALE,
        y: 55 * SCALE + row * 18 * SCALE,
        text: "",
        fontSize: 11 * SCALE,
        fontColor: getTextColor(),
        fontFace: FONT_TYPE,
        textAlign: "center",
      });
    }
  }

  ui.endUpdate();
}

function smallStyle() {
  var BACKGROUND_SIZE = 75 * SCALE;

  ui.beginUpdate();

  // Background
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_SIZE,
    height: BACKGROUND_SIZE,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  ui.addText({
    id: "day-name-text",
    x: BACKGROUND_SIZE / 2,
    y: 12 * SCALE,
    text: "DAY",
    fontSize: 10 * SCALE,
    fontColor: "#F44336",
    fontFace: FONT_TYPE,
    fontWeight: "bold",
    textAlign: "center",
  });

  ui.addText({
    id: "current-date-text",
    x: BACKGROUND_SIZE / 2,
    y: 20 * SCALE,
    text: "0",
    fontSize: 34 * SCALE,
    fontColor: getTextColor(),
    fontFace: FONT_TYPE,
    textAlign: "center",
  });

  ui.endUpdate();
}

function mediumStyle() {
  var BACKGROUND_SIZE = 160 * SCALE;

  ui.beginUpdate();

  // Background
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_SIZE,
    height: BACKGROUND_SIZE,
    radius: 12 * SCALE,
    fillColor: getBackgroundColor(),
  });

  ui.addText({
    id: "month-text",
    x: 13 * SCALE,
    y: 15 * SCALE,
    text: "MONTH",
    fontSize: 14 * SCALE,
    fontColor: "#F44336",
    fontFace: FONT_TYPE,
    textAlign: "left",
  });

  ui.addShape({
    id: "current-day-highlight",
    type: "ellipse",
    x: -100,
    y: -100,
    width: 20 * SCALE,
    height: 20 * SCALE,
    fillColor: "#F44336",
    strokeWidth: 0,
    opacity: 0,
  });

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    ui.addText({
      id: "weekday_" + i,
      x: 17 * SCALE + i * 21 * SCALE,
      y: 35 * SCALE,
      text: weekdays[i],
      fontSize: 11 * SCALE,
      fontColor: i >= 5 ? getSubtleColor() : getTextColor(),
      fontFace: FONT_TYPE,
      textAlign: "center",
    });
  }

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      let cellIndex = row * 7 + col;
      ui.addText({
        id: "day_" + cellIndex,
        x: 17 * SCALE + col * 21 * SCALE,
        y: 55 * SCALE + row * 18 * SCALE,
        text: "",
        fontSize: 11 * SCALE,
        fontColor: getTextColor(),
        fontFace: FONT_TYPE,
        textAlign: "center",
      });
    }
  }

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

ipcRenderer.on("calendarUpdate", (event, data) => {
  if (
    CURRENT_STYLE !== "large" &&
    CURRENT_STYLE !== "wide" &&
    CURRENT_STYLE !== "medium" &&
    CURRENT_STYLE !== "small"
  )
    return;

  ui.beginUpdate();

  if (CURRENT_STYLE !== "small") {
    if (ui.isElementExist("month-text")) {
      ui.setElementProperty("month-text", "text", data.monthName);
    }
  }

  if (CURRENT_STYLE === "wide" || CURRENT_STYLE === "small") {
    if (ui.isElementExist("day-name-text")) {
      ui.setElementProperty("day-name-text", "text", data.dayName);
    }
    if (ui.isElementExist("current-date-text")) {
      ui.setElementProperty(
        "current-date-text",
        "text",
        String(data.currentDate),
      );
    }
  }

  if (ui.isElementExist("current-day-highlight")) {
    ui.setElementProperty("current-day-highlight", "opacity", 0);
  }

  if (CURRENT_STYLE !== "small") {
    let cellIndex = 0;

    // Empty cells before start day
    for (let i = 0; i < data.startDay; i++) {
      if (ui.isElementExist("day_" + cellIndex)) {
        ui.setElementProperty("day_" + cellIndex, "text", "");
      }
      cellIndex++;
    }

    // Days
    for (let day = 1; day <= data.daysInMonth; day++) {
      if (ui.isElementExist("day_" + cellIndex)) {
        ui.setElementProperty("day_" + cellIndex, "text", String(day));

        let col = cellIndex % 7;
        let fontCol = col >= 5 ? getSubtleColor() : getTextColor();

        if (day === data.currentDate) {
          fontCol = "white"; // Highlight text color is always white for contrast

          let row = Math.floor(cellIndex / 7);
          let x, y, offsetX, offsetY;

          if (CURRENT_STYLE === "large") {
            x = 45 * SCALE + col * 45 * SCALE;
            y = 130 * SCALE + row * 40 * SCALE;
            offsetX = 18 * SCALE;
            offsetY = 3 * SCALE;
          } else if (CURRENT_STYLE === "wide") {
            x = 190 * SCALE + col * 23 * SCALE;
            y = 55 * SCALE + row * 18 * SCALE;
            offsetX = 10 * SCALE;
            offsetY = 2 * SCALE;
          } else if (CURRENT_STYLE === "medium") {
            x = 17 * SCALE + col * 21 * SCALE;
            y = 55 * SCALE + row * 18 * SCALE;
            offsetX = 10 * SCALE;
            offsetY = 2 * SCALE;
          }

          if (ui.isElementExist("current-day-highlight")) {
            ui.setElementProperties("current-day-highlight", {
              x: x - offsetX,
              y: y - offsetY,
              opacity: 255,
            });
          }
        }

        ui.setElementProperty("day_" + cellIndex, "fontColor", fontCol);
      }
      cellIndex++;
    }

    // Empty cells after end of month
    while (cellIndex < 42) {
      if (ui.isElementExist("day_" + cellIndex)) {
        ui.setElementProperty("day_" + cellIndex, "text", "");
      }
      cellIndex++;
    }
  }

  ui.endUpdate();
});
