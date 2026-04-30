var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;

var ROUND_LINE_SHAPE_WIDTH = 50 * SCALE;
var ROUND_LINE_SHAPE_HEIGHT = 50 * SCALE;
var ROUND_LINE_SHAPE_RADIUS = 25 * SCALE;
var ROUND_LINE_SHAPE_THICKNESS = 5 * SCALE;

var ICON_SIZE = 20 * SCALE;
var ICON_OFFSET_X = (ROUND_LINE_SHAPE_WIDTH - ICON_SIZE) / 2;
var ICON_OFFSET_Y = (ROUND_LINE_SHAPE_HEIGHT - ICON_SIZE) / 2;

var ICONS_PATH = "assets/icons/";

var MAX_DISK_SPEED = 1000000000; // 1 GB/s in bytes
var MAX_NETWORK_SPEED = 1000000000; // 1 Gbps in bytes

var CPU_USAGE = 0;
var MEMORY_USAGE = 0;
var DISK_USAGE = 0;
var NETWORK_USAGE = 0;

var CPU_HISTORY = [];
var MEMORY_HISTORY = [];
var DISK_HISTORY = [];
var NETWORK_HISTORY = [];
var MAX_HISTORY = 60;

//============================================================================
// Functions to get colors based on the theme
//============================================================================
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

function getIconColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.ICON_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.ICON_COLOR;
  }
}

function getTextColor() {
  if (JSON_DATA.APPEARANCE.THEME == "dark") {
    return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.FONT_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.FONT_COLOR;
  }
}

//============================================================================
// Styles
//============================================================================

function smallStyle() {
  var BACKGROUND_WIDTH = 75 * SCALE;
  var BACKGROUND_HEIGHT = 75 * SCALE;

  var CENTER_X = (BACKGROUND_WIDTH - ROUND_LINE_SHAPE_WIDTH) / 2;
  var CENTER_Y = (BACKGROUND_HEIGHT - ROUND_LINE_SHAPE_HEIGHT) / 2;

  let ROUND_LINE_ELEMENT_STYLE = {
    y: CENTER_Y,
    thickness: ROUND_LINE_SHAPE_THICKNESS,
    radius: ROUND_LINE_SHAPE_RADIUS,
    value: 0,
    width: ROUND_LINE_SHAPE_WIDTH,
    height: ROUND_LINE_SHAPE_HEIGHT,
    lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
    lineColorBg: getSubtleColor(),
    capType: "round",
  };

  let ICON_ELEMENT_STYLE = {
    y: CENTER_Y + ICON_OFFSET_Y,
    width: ICON_SIZE,
    height: ICON_SIZE,
    imageTint: getIconColor(),
  };

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  ui.addRoundLine({
    id: "cpu-ring",
    x: CENTER_X,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "cpu-ring-icon",
    x: CENTER_X + ICON_OFFSET_X,
    path: ICONS_PATH + "cpu.png",
    ...ICON_ELEMENT_STYLE,
  });

  ui.endUpdate();
}

function wideStyle() {
  var BACKGROUND_WIDTH = 350 * SCALE;
  var BACKGROUND_HEIGHT = 160 * SCALE;

  var RING_SPACING = 22 * SCALE;
  var TOTAL_WIDTH = ROUND_LINE_SHAPE_WIDTH * 4 + RING_SPACING * 3;
  var START_X = (BACKGROUND_WIDTH - TOTAL_WIDTH) / 2;
  var CENTER_Y = (BACKGROUND_HEIGHT - ROUND_LINE_SHAPE_HEIGHT) / 3;

  let ROUND_LINE_ELEMENT_STYLE = {
    y: CENTER_Y,
    thickness: ROUND_LINE_SHAPE_THICKNESS,
    radius: ROUND_LINE_SHAPE_RADIUS,
    value: 0,
    width: ROUND_LINE_SHAPE_WIDTH,
    height: ROUND_LINE_SHAPE_HEIGHT,
    lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
    lineColorBg: getSubtleColor(),
    capType: "round",
  };

  let ICON_ELEMENT_STYLE = {
    y: CENTER_Y + ICON_OFFSET_Y,
    width: ICON_SIZE,
    height: ICON_SIZE,
    imageTint: getIconColor(),
  };

  let TEXT_ELEMENT_STYLE = {
    y: CENTER_Y + ROUND_LINE_SHAPE_HEIGHT + 12 * SCALE,
    width: ROUND_LINE_SHAPE_WIDTH,
    height: 20 * SCALE,
    text: "0%",
    fontSize: 20 * SCALE,
    fontColor: getTextColor(),
    textAlign: "center",
    fontFace: "Segoe UI",
  };
  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  ui.addRoundLine({
    id: "cpu-ring",
    x: START_X,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "cpu-ring-icon",
    x: START_X + ICON_OFFSET_X,
    path: ICONS_PATH + "cpu.png",
    ...ICON_ELEMENT_STYLE,
  });
  ui.addText({
    id: "cpu-ring-text",
    x: START_X + ROUND_LINE_SHAPE_WIDTH / 2,
    ...TEXT_ELEMENT_STYLE,
  });

  ui.addRoundLine({
    id: "memory-ring",
    x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "memory-ring-icon",
    x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ICON_OFFSET_X,
    path: ICONS_PATH + "memory.png",
    ...ICON_ELEMENT_STYLE,
  });
  ui.addText({
    id: "memory-ring-text",
    x:
      START_X +
      ROUND_LINE_SHAPE_WIDTH +
      RING_SPACING +
      ROUND_LINE_SHAPE_WIDTH / 2,
    ...TEXT_ELEMENT_STYLE,
  });

  ui.addRoundLine({
    id: "disk-ring",
    x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "disk-ring-icon",
    x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2 + ICON_OFFSET_X,
    path: ICONS_PATH + "disk.png",
    ...ICON_ELEMENT_STYLE,
  });
  ui.addText({
    id: "disk-ring-text",
    x:
      START_X +
      (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2 +
      ROUND_LINE_SHAPE_WIDTH / 2,
    ...TEXT_ELEMENT_STYLE,
  });

  // Network Ring with text
  ui.addRoundLine({
    id: "net-ring",
    x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "net-ring-icon",
    x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3 + ICON_OFFSET_X,
    path: ICONS_PATH + "network.png",
    ...ICON_ELEMENT_STYLE,
  });
  ui.addText({
    id: "net-ring-text",
    x:
      START_X +
      (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3 +
      ROUND_LINE_SHAPE_WIDTH / 2,
    ...TEXT_ELEMENT_STYLE,
  });

  ui.endUpdate();
}

function mediumStyle() {
  var BACKGROUND_WIDTH = 160 * SCALE;
  var BACKGROUND_HEIGHT = 160 * SCALE;

  var RING_SPACING = 15 * SCALE;
  var TOTAL_WIDTH = ROUND_LINE_SHAPE_WIDTH * 2 + RING_SPACING;
  var START_X = (BACKGROUND_WIDTH - TOTAL_WIDTH) / 2;

  var TOTAL_HEIGHT = ROUND_LINE_SHAPE_HEIGHT * 2 + RING_SPACING;
  var START_Y = (BACKGROUND_HEIGHT - TOTAL_HEIGHT) / 2;

  let ROUND_LINE_ELEMENT_STYLE = {
    thickness: ROUND_LINE_SHAPE_THICKNESS,
    radius: ROUND_LINE_SHAPE_RADIUS,
    value: 0,
    width: ROUND_LINE_SHAPE_WIDTH,
    height: ROUND_LINE_SHAPE_HEIGHT,
    lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
    lineColorBg: getSubtleColor(),
    capType: "round",
  };

  let ICON_ELEMENT_STYLE = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    imageTint: getIconColor(),
  };

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  // Row 1: CPU and Memory
  ui.addRoundLine({
    id: "cpu-ring",
    x: START_X,
    y: START_Y,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "cpu-ring-icon",
    x: START_X + ICON_OFFSET_X,
    y: START_Y + ICON_OFFSET_Y,
    path: ICONS_PATH + "cpu.png",
    ...ICON_ELEMENT_STYLE,
  });

  ui.addRoundLine({
    id: "memory-ring",
    x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING,
    y: START_Y,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "memory-ring-icon",
    x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ICON_OFFSET_X,
    y: START_Y + ICON_OFFSET_Y,
    path: ICONS_PATH + "memory.png",
    ...ICON_ELEMENT_STYLE,
  });

  // Row 2: Disk and Network
  ui.addRoundLine({
    id: "disk-ring",
    x: START_X,
    y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "disk-ring-icon",
    x: START_X + ICON_OFFSET_X,
    y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING + ICON_OFFSET_Y,
    path: ICONS_PATH + "disk.png",
    ...ICON_ELEMENT_STYLE,
  });

  ui.addRoundLine({
    id: "net-ring",
    x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING,
    y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING,
    ...ROUND_LINE_ELEMENT_STYLE,
  });
  ui.addImage({
    id: "net-ring-icon",
    x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ICON_OFFSET_X,
    y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING + ICON_OFFSET_Y,
    path: ICONS_PATH + "network.png",
    ...ICON_ELEMENT_STYLE,
  });

  ui.endUpdate();
}

function largeStyle() {
  var BACKGROUND_WIDTH = 350 * SCALE;
  var BACKGROUND_HEIGHT = 360 * SCALE;

  var SECTION_HEIGHT = BACKGROUND_HEIGHT / 4;
  var PADDING_X = 20 * SCALE;
  var CONTENT_Y_OFFSET = 15 * SCALE;

  let LABEL_STYLE = {
    fontSize: 16 * SCALE,
    fontColor: getTextColor(),
    fontFace: "Segoe UI Semibold",
    textAlign: "left",
  };

  let VALUE_STYLE = {
    fontSize: 16 * SCALE,
    fontColor: getTextColor(),
    fontFace: "Segoe UI",
    textAlign: "right",
  };

  let GRAPH_STYLE = {
    width: BACKGROUND_WIDTH - PADDING_X * 2,
    height: 35 * SCALE,
    minValue: 0,
    maxValue: 100,
    lineColor: "rgba(0, 255, 150, 0.6)",
    fillColor: "rgba(0, 255, 150, 0.15)",
    gridVisible: false,
    maxPoints: MAX_HISTORY,
  };

  let DIV_LINE_STYLE = {
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: 1 * SCALE,
    fillColor: getSubtleColor(),
    strokeWidth: 0,
  };

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: BACKGROUND_WIDTH,
    height: BACKGROUND_HEIGHT,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  // CPU Section
  let cpuY = 0;
  ui.addImage({
    id: "cpu-icon",
    x: PADDING_X,
    y: cpuY + CONTENT_Y_OFFSET,
    width: 20 * SCALE,
    height: 20 * SCALE,
    path: ICONS_PATH + "cpu.png",
    imageTint: getIconColor(),
  });
  ui.addText({
    id: "cpu-label",
    x: PADDING_X + 30 * SCALE,
    y: cpuY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "CPU",
    ...LABEL_STYLE,
  });
  ui.addText({
    id: "cpu-value",
    x: BACKGROUND_WIDTH - PADDING_X,
    y: cpuY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "0 %",
    ...VALUE_STYLE,
  });
  ui.addAreaGraph({
    id: "cpu-graph",
    x: PADDING_X,
    y: cpuY + CONTENT_Y_OFFSET + 25 * SCALE,
    data: [],
    ...GRAPH_STYLE,
  });
  ui.addShape({
    id: "div-cpu",
    x: 0,
    y: cpuY + SECTION_HEIGHT,
    ...DIV_LINE_STYLE,
  });

  // RAM Section
  let memY = SECTION_HEIGHT;
  ui.addImage({
    id: "memory-icon",
    x: PADDING_X,
    y: memY + CONTENT_Y_OFFSET,
    width: 20 * SCALE,
    height: 20 * SCALE,
    path: ICONS_PATH + "memory.png",
    imageTint: getIconColor(),
  });
  ui.addText({
    id: "memory-label",
    x: PADDING_X + 30 * SCALE,
    y: memY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "RAM",
    ...LABEL_STYLE,
  });
  ui.addText({
    id: "memory-value",
    x: BACKGROUND_WIDTH - PADDING_X,
    y: memY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "0 %",
    ...VALUE_STYLE,
  });
  ui.addAreaGraph({
    id: "memory-graph",
    x: PADDING_X,
    y: memY + CONTENT_Y_OFFSET + 25 * SCALE,
    data: [],
    ...GRAPH_STYLE,
  });
  ui.addShape({
    id: "div-mem",
    x: 0,
    y: memY + SECTION_HEIGHT,
    ...DIV_LINE_STYLE,
  });

  // Disk Section
  let diskY = SECTION_HEIGHT * 2;
  ui.addImage({
    id: "disk-icon",
    x: PADDING_X,
    y: diskY + CONTENT_Y_OFFSET,
    width: 20 * SCALE,
    height: 20 * SCALE,
    path: ICONS_PATH + "disk.png",
    imageTint: getIconColor(),
  });
  ui.addText({
    id: "disk-label",
    x: PADDING_X + 30 * SCALE,
    y: diskY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "Disk",
    ...LABEL_STYLE,
  });
  ui.addText({
    id: "disk-value",
    x: BACKGROUND_WIDTH - PADDING_X,
    y: diskY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "0 %",
    ...VALUE_STYLE,
  });
  ui.addAreaGraph({
    id: "disk-graph",
    x: PADDING_X,
    y: diskY + CONTENT_Y_OFFSET + 25 * SCALE,
    data: [],
    ...GRAPH_STYLE,
  });
  ui.addShape({
    id: "div-disk",
    x: 0,
    y: diskY + SECTION_HEIGHT,
    ...DIV_LINE_STYLE,
  });

  // Net Section
  let netY = SECTION_HEIGHT * 3;
  ui.addImage({
    id: "net-icon",
    x: PADDING_X,
    y: netY + CONTENT_Y_OFFSET,
    width: 20 * SCALE,
    height: 20 * SCALE,
    path: ICONS_PATH + "network.png",
    imageTint: getIconColor(),
  });
  ui.addText({
    id: "net-label",
    x: PADDING_X + 30 * SCALE,
    y: netY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "Net",
    ...LABEL_STYLE,
  });
  ui.addText({
    id: "net-value",
    x: BACKGROUND_WIDTH - PADDING_X,
    y: netY + CONTENT_Y_OFFSET + 2 * SCALE,
    text: "0 %",
    ...VALUE_STYLE,
  });
  ui.addAreaGraph({
    id: "net-graph",
    x: PADDING_X,
    y: netY + CONTENT_Y_OFFSET + 25 * SCALE,
    data: [],
    ...GRAPH_STYLE,
  });

  ui.endUpdate();
}

// Choose which style to use: wideStyle(), mediumStyle(), smallStyle(), or largeStyle()
largeStyle();

function getLevelColor(PERCENT) {
  if (PERCENT >= 0 && PERCENT < 70) {
    return JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR;
  } else if (PERCENT >= 70 && PERCENT < 90) {
    return JSON_DATA.APPEARANCE.MEDIUM_LEVEL_COLOR;
  } else {
    return JSON_DATA.APPEARANCE.HIGH_LEVEL_COLOR;
  }
}

function updateRingContent(RING_ID, PERCENT) {
  if (ui.isElementExist(RING_ID)) {
    ui.setElementProperty(RING_ID, "value", PERCENT / 100);
    ui.setElementProperty(RING_ID, "lineColor", getLevelColor(PERCENT));

    // Update the percentage text
    var TEXT_ID = RING_ID + "-text";
    if (ui.isElementExist(TEXT_ID)) {
      ui.setElementProperty(TEXT_ID, "text", Math.round(PERCENT) + "%");
    }
  }
}

function updateValueText(ID, VALUE) {
  if (ui.isElementExist(ID)) {
    ui.setElementProperty(ID, "text", Math.round(VALUE) + " %");
  }
}

function getAlphaColor(color, alpha) {
  if (color === "red") return "rgba(255, 0, 0, " + alpha + ")";
  if (color === "yellow") return "rgba(255, 255, 0, " + alpha + ")";
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", ", " + alpha + ")");
  }
  return color;
}

function updateGraphContent(GRAPH_ID, VALUE, HISTORY) {
  if (ui.isElementExist(GRAPH_ID)) {
    HISTORY.push(VALUE);
    if (HISTORY.length > MAX_HISTORY) HISTORY.shift();
    ui.setElementProperty(GRAPH_ID, "data", HISTORY);

    // Dynamic Coloring
    let levelColor = getLevelColor(VALUE);
    ui.setElementProperty(GRAPH_ID, "lineColor", getAlphaColor(levelColor, 0.6));
    ui.setElementProperty(GRAPH_ID, "fillColor", getAlphaColor(levelColor, 0.15));
  }
  // Always try to update the value text
  updateValueText(GRAPH_ID.replace("-graph", "-value"), VALUE);
}

function calculatePercent(VALUE, MAX_VALUE) {
  var PERCENT = (VALUE / MAX_VALUE) * 100;
  return Math.min(Math.max(PERCENT, 0), 100); // Clamp between 0-100
}

ipcRenderer.on("monitor-window-stats", (event, data) => {
  CPU_USAGE = data.cpu;
  MEMORY_USAGE = data.memory;
  DISK_USAGE = data.disk;
  NETWORK_USAGE = data.network;
  BATTERY_USAGE = data.battery || 0;

  ui.beginUpdate();

  // Rings (for other styles)
  updateRingContent("cpu-ring", CPU_USAGE);
  updateRingContent("memory-ring", MEMORY_USAGE);

  var DISK_PERCENT = calculatePercent(DISK_USAGE, MAX_DISK_SPEED);
  var NETWORK_PERCENT = calculatePercent(NETWORK_USAGE, MAX_NETWORK_SPEED);
  updateRingContent("disk-ring", DISK_PERCENT);
  updateRingContent("net-ring", NETWORK_PERCENT);

  // Graphs (for large style)
  updateGraphContent("cpu-graph", CPU_USAGE, CPU_HISTORY);
  updateGraphContent("memory-graph", MEMORY_USAGE, MEMORY_HISTORY);
  updateGraphContent("disk-graph", DISK_PERCENT, DISK_HISTORY);
  updateGraphContent("net-graph", NETWORK_PERCENT, NETWORK_HISTORY);

  ui.endUpdate();
});
