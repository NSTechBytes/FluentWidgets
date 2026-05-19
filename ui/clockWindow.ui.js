// =============================================================================
// FluentWidgets — Analog / Digital Clock Widget (Renderer)
// =============================================================================
// Renders an analog clock (hour / minute / second hands over a face image)
// for small / medium / large sizes, or a digital H:MM / SS / date layout
// for the wide size. Hand positions are computed from angles via sin / cos.
// =============================================================================

const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_FACE = JSON_DATA.FONT_FACE;
const currentStyle = JSON_DATA.WINDOW_STYLES.CLOCK_WINDOW;

// Pick the correct clock-face image based on the active theme
const smallFace =
  JSON_DATA.APPEARANCE.THEME === "dark"
    ? "assets/icons/small-face-1.png"
    : "assets/icons/small-face-0.png";

const largeFace =
  JSON_DATA.APPEARANCE.THEME === "dark"
    ? "assets/icons/face-1.png"
    : "assets/icons/face-0.png";

// Current time values (set by IPC messages)
let hour = 0;
let minute = 0;
let second = 0;

/** Stores the center point and hand lengths for the active style */
let clockGeometry = null;

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

/** Get the { w, h } dimensions (already scaled) for the current widget style */
function getWidgetSize() {
  const key = currentStyle.toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

// =============================================================================
// Style Builders
// =============================================================================

/**
 * Save the geometry parameters needed to position the clock hands.
 * @param {number} size   - Widget width／height (square)
 * @param {number} hLen   - Hour hand length from center
 * @param {number} mLen   - Minute hand length from center
 * @param {number} sLen   - Second hand length from center
 */
function setClockGeometry(size, hLen, mLen, sLen) {
  clockGeometry = { center: size / 2, hourLen: hLen, minLen: mLen, secLen: sLen };
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize();
  const CENTER = SIZE / 2;
  const PAD = 5 * SCALE;
  const FACE = SIZE - PAD * 2;

  setClockGeometry(SIZE, 14 * SCALE, 22 * SCALE, 24 * SCALE);

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  ui.addImage({
    id: "clock-face",
    x: PAD, y: PAD,
    width: FACE, height: FACE,
    path: smallFace,
  });

  // Clock hands (line shapes pivoting from center)
  ui.addShape({ id: "hour-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 14 * SCALE, strokeColor: getTextColor(), strokeWidth: 3 * SCALE });
  ui.addShape({ id: "minute-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 22 * SCALE, strokeColor: getTextColor(), strokeWidth: 2 * SCALE });
  ui.addShape({ id: "second-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 24 * SCALE, strokeColor: getAccentColor(), strokeWidth: 1 * SCALE });

  // Center pin
  ui.addShape({ id: "pin", type: "ellipse", x: CENTER - 2 * SCALE, y: CENTER - 2 * SCALE, width: 4 * SCALE, height: 4 * SCALE, fillColor: getAccentColor(), strokeColor: getTextColor(), strokeWidth: 1 * SCALE });

  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize();
  const CENTER = SIZE / 2;
  const PAD = 10 * SCALE;
  const FACE = SIZE - PAD * 2;

  setClockGeometry(SIZE, 28 * SCALE, 46 * SCALE, 52 * SCALE);

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, strokeWidth: 0, fillColor: getBackgroundColor() });
  ui.addImage({ id: "clock-face", x: PAD, y: PAD, width: FACE, height: FACE, path: largeFace });

  ui.addShape({ id: "hour-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 28 * SCALE, strokeColor: getTextColor(), strokeWidth: 4 * SCALE });
  ui.addShape({ id: "minute-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 46 * SCALE, strokeColor: getTextColor(), strokeWidth: 3 * SCALE });
  ui.addShape({ id: "second-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 52 * SCALE, strokeColor: getAccentColor(), strokeWidth: 2 * SCALE });

  ui.addShape({ id: "pin", type: "ellipse", x: CENTER - 4 * SCALE, y: CENTER - 4 * SCALE, width: 8 * SCALE, height: 8 * SCALE, fillColor: getAccentColor(), strokeColor: getTextColor(), strokeWidth: 1 * SCALE });

  ui.endUpdate();
}

function wideStyle() {
  const { w: W, h: H } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: W, height: H, strokeWidth: 0, strokeWidth: 0, fillColor: getBackgroundColor() });

  ui.addText({ id: "time-text", x: W / 2 - 15 * SCALE, y: 5 * SCALE, text: "00:00", fontSize: 90 * SCALE, fontColor: getTextColor(), fontFace: FONT_FACE, textAlign: "center" });
  ui.addText({ id: "seconds-text", x: W / 2 + 110 * SCALE, y: 30 * SCALE, text: "00", fontSize: 35 * SCALE, fontColor: getSubtleColor(), fontFace: FONT_FACE, textAlign: "left" });
  ui.addText({ id: "date-text", x: W / 2, y: 115 * SCALE, text: "Date Loading...", fontSize: 22 * SCALE, fontColor: getTextColor(), fontFace: FONT_FACE, textAlign: "center" });

  ui.endUpdate();
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize();
  const CENTER = SIZE / 2;
  const PAD = 10 * SCALE;

  setClockGeometry(SIZE, 60 * SCALE, 100 * SCALE, 120 * SCALE);

  ui.beginUpdate();

  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, strokeWidth: 0, fillColor: getBackgroundColor() });
  ui.addShape({ id: "ellipse_Shape", type: "ellipse", x: PAD, y: PAD, width: SIZE - PAD * 2, height: SIZE - PAD * 2, strokeWidth: 0, fillColor: getBackgroundColor() });

  ui.addImage({ id: "clock-face", x: PAD, y: PAD, width: SIZE - PAD * 2, height: SIZE - PAD * 2, path: largeFace });

  ui.addShape({ id: "hour-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 60 * SCALE, strokeColor: getTextColor(), strokeWidth: 8 * SCALE });
  ui.addShape({ id: "minute-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 100 * SCALE, strokeColor: getTextColor(), strokeWidth: 5 * SCALE });
  ui.addShape({ id: "second-hand", type: "line", startX: CENTER, startY: CENTER, endX: CENTER, endY: CENTER - 120 * SCALE, strokeColor: getAccentColor(), strokeWidth: 2 * SCALE });

  // Center pin
  ui.addShape({ id: "pin", type: "ellipse", x: CENTER - 6 * SCALE, y: CENTER - 6 * SCALE, width: 12 * SCALE, height: 12 * SCALE, fillColor: getAccentColor(), strokeColor: getTextColor(), strokeWidth: 2 * SCALE });

  ui.endUpdate();
}

// =============================================================================
// Initial Render
// =============================================================================

if (currentStyle === "small") smallStyle();
else if (currentStyle === "medium") mediumStyle();
else if (currentStyle === "wide") wideStyle();
else if (currentStyle === "large") largeStyle();
else wideStyle();

// =============================================================================
// Hand Positioning (Trigonometry)
// =============================================================================

/**
 * Rotate the three clock hands to match the current time.
 *
 * Angles are measured clockwise from 12 o'clock:
 *   hour   = (hours % 12) * 30 + minutes * 0.5
 *   minute = minutes * 6
 *   second = seconds * 6
 */
function updateHands() {
  if (!clockGeometry) return;

  const { center, hourLen, minLen, secLen } = clockGeometry;

  // Hour hand (30° per hour + 0.5° per minute for smooth sweep)
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const hourRad = (hourAngle * Math.PI) / 180;
  ui.setElementProperties("hour-hand", {
    endX: center + hourLen * Math.sin(hourRad),
    endY: center - hourLen * Math.cos(hourRad),
  });

  // Minute hand (6° per minute)
  const minAngle = minute * 6;
  const minRad = (minAngle * Math.PI) / 180;
  ui.setElementProperties("minute-hand", {
    endX: center + minLen * Math.sin(minRad),
    endY: center - minLen * Math.cos(minRad),
  });

  // Second hand (6° per second)
  const secAngle = second * 6;
  const secRad = (secAngle * Math.PI) / 180;
  ui.setElementProperties("second-hand", {
    endX: center + secLen * Math.sin(secRad),
    endY: center - secLen * Math.cos(secRad),
  });
}

// =============================================================================
// IPC — Handle Time Updates
// =============================================================================

ipcRenderer.on("timeUpdate", (event, timeStr) => {
  if (currentStyle === "wide" && ui.isElementExist("time-text")) {
    ui.setElementProperty("time-text", "text", timeStr);
  }
});

ipcRenderer.on("secondsUpdate", (event, secondsStr) => {
  if (currentStyle === "wide" && ui.isElementExist("seconds-text")) {
    ui.setElementProperty("seconds-text", "text", secondsStr);
  }
});

ipcRenderer.on("clockUpdate", (event, data) => {
  if (!data || data.style !== currentStyle) return;

  if (currentStyle === "wide") {
    if (ui.isElementExist("time-text")) ui.setElementProperty("time-text", "text", data.timeText);
    if (ui.isElementExist("seconds-text")) ui.setElementProperty("seconds-text", "text", data.secondsText);
    if (ui.isElementExist("date-text")) ui.setElementProperty("date-text", "text", data.dateText);
    return;
  }

  // Analog styles — update stored time and rotate hands
  if (currentStyle === "large" || currentStyle === "medium" || currentStyle === "small") {
    hour = data.hour24;
    minute = data.minute;
    second = data.second;
    updateHands();
  }
});

ipcRenderer.on("dateUpdate", (event, dateStr) => {
  if (ui.isElementExist("date-text")) {
    ui.setElementProperty("date-text", "text", dateStr);
  }
});
