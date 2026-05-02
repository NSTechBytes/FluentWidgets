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

// Style selection
if (CURRENT_STYLE === "large") {
  largeStyle();
} else {
  largeStyle(); // Default to large for now
}

ipcRenderer.on("calendarUpdate", (event, data) => {
  if (CURRENT_STYLE !== "large") return;

  ui.beginUpdate();

  if (ui.isElementExist("month-text")) {
    ui.setElementProperty("month-text", "text", data.monthName);
  }

  if (ui.isElementExist("current-day-highlight")) {
    ui.setElementProperty("current-day-highlight", "opacity", 0);
  }

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
        let x = 45 * SCALE + col * 45 * SCALE;
        let y = 130 * SCALE + row * 40 * SCALE;

        if (ui.isElementExist("current-day-highlight")) {
          ui.setElementProperties("current-day-highlight", {
            x: x - 18 * SCALE,
            y: y - 3 * SCALE, // adjust to center vertically behind text (approx)
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

  ui.endUpdate();
});
