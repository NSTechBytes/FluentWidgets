// =============================================================================
// FluentWidgets — Calendar Widget (Renderer)
// =============================================================================
// Displays a monthly calendar grid with the current day highlighted.
// Supports four sizes: small (date only), medium / wide / large (full grid).
// Receives calendar data once per minute via IPC from the main process.
// =============================================================================

const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_TYPE = JSON_DATA.FONT_TYPE;
const currentStyle = JSON_DATA.WINDOW_STYLES.CALENDAR_WINDOW;

// =============================================================================
// Theme Helpers
// =============================================================================

function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() { return getThemeColors().BACKGROUND; }
function getSubtleColor() { return getThemeColors().SUBTLE; }
function getTextColor() { return getThemeColors().FONT; }
function getAccentColor() { return JSON_DATA.APPEARANCE.ACCENT_COLOR; }

// =============================================================================
// Widget Size Helper
// =============================================================================

function getWidgetSize() {
  const key = currentStyle.toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

// =============================================================================
// Style Builders
// =============================================================================

function largeStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, fillColor: getBackgroundColor() });
  ui.addText({ id: "month-text", x: 35 * SCALE, y: 35 * SCALE, text: "MONTH", fontSize: 24 * SCALE, fontColor: getAccentColor(), fontFace: FONT_TYPE, textAlign: "left" });

  // This highlight ellipse is hidden off-screen until we place it over today's cell
  ui.addShape({ id: "current-day-highlight", type: "ellipse", x: -100, y: -100, width: 36 * SCALE, height: 36 * SCALE, fillColor: getAccentColor(), strokeWidth: 0, opacity: 0 });

  // Weekday headers
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

  // 6 rows × 7 columns = 42 day cells
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      ui.addText({
        id: "day_" + idx,
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
  const { w: W, h: H } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: W, height: H, fillColor: getBackgroundColor() });

  // Left column — large date display
  ui.addText({ id: "day-name-text", x: 20 * SCALE, y: 15 * SCALE, text: "DAY", fontSize: 14 * SCALE, fontColor: getAccentColor(), fontFace: FONT_TYPE, textAlign: "left" });
  ui.addText({ id: "current-date-text", x: 20 * SCALE, y: 40 * SCALE, text: "0", fontSize: 60 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, textAlign: "left" });

  // Right column — mini grid
  ui.addText({ id: "month-text", x: 186 * SCALE, y: 15 * SCALE, text: "MONTH", fontSize: 14 * SCALE, fontColor: getAccentColor(), fontFace: FONT_TYPE, textAlign: "left" });
  ui.addShape({ id: "current-day-highlight", type: "ellipse", x: -100, y: -100, width: 20 * SCALE, height: 20 * SCALE, fillColor: getAccentColor(), strokeWidth: 0, opacity: 0 });

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    ui.addText({ id: "weekday_" + i, x: 190 * SCALE + i * 23 * SCALE, y: 35 * SCALE, text: weekdays[i], fontSize: 11 * SCALE, fontColor: i >= 5 ? getSubtleColor() : getTextColor(), fontFace: FONT_TYPE, textAlign: "center" });
  }

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      ui.addText({ id: "day_" + idx, x: 190 * SCALE + col * 23 * SCALE, y: 55 * SCALE + row * 18 * SCALE, text: "", fontSize: 11 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, textAlign: "center" });
    }
  }

  ui.endUpdate();
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, fillColor: getBackgroundColor() });
  ui.addText({ id: "day-name-text", x: SIZE / 2, y: 12 * SCALE, text: "DAY", fontSize: 10 * SCALE, fontColor: getAccentColor(), fontFace: FONT_TYPE, fontWeight: "bold", textAlign: "center" });
  ui.addText({ id: "current-date-text", x: SIZE / 2, y: 20 * SCALE, text: "0", fontSize: 34 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, textAlign: "center" });

  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, fillColor: getBackgroundColor() });
  ui.addText({ id: "month-text", x: 13 * SCALE, y: 15 * SCALE, text: "MONTH", fontSize: 14 * SCALE, fontColor: getAccentColor(), fontFace: FONT_TYPE, textAlign: "left" });
  ui.addShape({ id: "current-day-highlight", type: "ellipse", x: -100, y: -100, width: 20 * SCALE, height: 20 * SCALE, fillColor: getAccentColor(), strokeWidth: 0, opacity: 0 });

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    ui.addText({ id: "weekday_" + i, x: 17 * SCALE + i * 21 * SCALE, y: 35 * SCALE, text: weekdays[i], fontSize: 11 * SCALE, fontColor: i >= 5 ? getSubtleColor() : getTextColor(), fontFace: FONT_TYPE, textAlign: "center" });
  }

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      ui.addText({ id: "day_" + idx, x: 17 * SCALE + col * 21 * SCALE, y: 55 * SCALE + row * 18 * SCALE, text: "", fontSize: 11 * SCALE, fontColor: getTextColor(), fontFace: FONT_TYPE, textAlign: "center" });
    }
  }

  ui.endUpdate();
}

// =============================================================================
// Initial Render
// =============================================================================

if (currentStyle === "large") largeStyle();
else if (currentStyle === "wide") wideStyle();
else if (currentStyle === "medium") mediumStyle();
else if (currentStyle === "small") smallStyle();
else largeStyle();

// =============================================================================
// IPC — Populate Calendar Grid
// =============================================================================

ipcRenderer.on("calendarUpdate", (event, data) => {
  // Ignore unknown styles
  if (!["large", "wide", "medium", "small"].includes(currentStyle)) return;

  ui.beginUpdate();

  // Month name (not shown in small style)
  if (currentStyle !== "small" && ui.isElementExist("month-text")) {
    ui.setElementProperty("month-text", "text", data.monthName);
  }

  // Day name + large date numeral (wide & small only)
  if (currentStyle === "wide" || currentStyle === "small") {
    if (ui.isElementExist("day-name-text")) ui.setElementProperty("day-name-text", "text", data.dayName);
    if (ui.isElementExist("current-date-text")) ui.setElementProperty("current-date-text", "text", String(data.currentDate));
  }

  // Grid not present in small style
  if (currentStyle !== "small") {
    let cellIndex = 0;

    // Leading empty cells before the 1st of the month
    for (let i = 0; i < data.startDay; i++) {
      const id = "day_" + cellIndex;
      if (ui.isElementExist(id)) ui.setElementProperty(id, "text", "");
      cellIndex++;
    }

    // Populate day numbers
    for (let day = 1; day <= data.daysInMonth; day++) {
      const id = "day_" + cellIndex;
      if (ui.isElementExist(id)) {
        ui.setElementProperty(id, "text", String(day));

        const col = cellIndex % 7;
        let fontColor = col >= 5 ? getSubtleColor() : getTextColor();

        // Highlight today's cell
        if (day === data.currentDate) {
          fontColor = "white";

          // Position the highlight ellipse behind today's number
          const row = Math.floor(cellIndex / 7);
          let x, y, ox, oy;

          if (currentStyle === "large") {
            x = 45 * SCALE + col * 45 * SCALE; y = 130 * SCALE + row * 40 * SCALE;
            ox = 18 * SCALE; oy = 3 * SCALE;
          } else if (currentStyle === "wide") {
            x = 190 * SCALE + col * 23 * SCALE; y = 55 * SCALE + row * 18 * SCALE;
            ox = 10 * SCALE; oy = 2 * SCALE;
          } else {
            // medium
            x = 17 * SCALE + col * 21 * SCALE; y = 55 * SCALE + row * 18 * SCALE;
            ox = 10 * SCALE; oy = 2 * SCALE;
          }

          if (ui.isElementExist("current-day-highlight")) {
            ui.setElementProperties("current-day-highlight", {
              x: x - ox,
              y: y - oy,
              opacity: 255,
            });
          }
        }

        ui.setElementProperty(id, "fontColor", fontColor);
      }
      cellIndex++;
    }

    // Clear remaining cells after end of month
    while (cellIndex < 42) {
      const id = "day_" + cellIndex;
      if (ui.isElementExist(id)) ui.setElementProperty(id, "text", "");
      cellIndex++;
    }
  }

  ui.endUpdate();
});
