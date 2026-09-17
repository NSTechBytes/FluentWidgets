const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;

const RING_SIZE = 50 * SCALE;
const RING_RADIUS = 25 * SCALE;
const RING_THICKNESS = 5 * SCALE;
const ICON_SIZE = 20 * SCALE;
const ICON_OFFSET = (RING_SIZE - ICON_SIZE) / 2;

const FONT_FACE = JSON_DATA.FONT_FACE;
const FONT_FACE_SEMIBOLD = JSON_DATA.FONT_FACE_SEMIBOLD;
const ICONS_PATH = "assets/icons/";

const MAX_DISK_SPEED = 1000000000;
const MAX_NETWORK_SPEED = 1000000000;

let cpuUsage = 0,
  memoryUsage = 0,
  diskUsage = 0,
  networkUsage = 0;

const cpuHistory = [],
  memoryHistory = [],
  diskHistory = [],
  networkHistory = [];
const MAX_HISTORY = 60;

function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() {
  return getThemeColors().BACKGROUND;
}
function getFontColor() {
  return getThemeColors().FONT;
}
function getIconColor() {
  return getThemeColors().ICON;
}
function getSubtleColor() {
  return getThemeColors().SUBTLE;
}
function getAccentColor() {
  return JSON_DATA.APPEARANCE.ACCENT_COLOR;
}

function getLevelColor(percent) {
  const levels = JSON_DATA.APPEARANCE.LEVEL_COLORS;
  if (percent >= 0 && percent < 70) return levels.LOW;
  if (percent >= 70 && percent < 90) return levels.MEDIUM;
  return levels.HIGH;
}

function getWidgetSize() {
  const key = currentStyle.toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

let currentStyle = JSON_DATA.WINDOW_STYLES.MONITOR_WINDOW;

function smallStyle() {
  const { w: SIZE } = getWidgetSize();
  const cx = (SIZE - RING_SIZE) / 2;

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  ui.addRoundLine({
    id: "cpu-ring",
    x: cx,
    y: cx,
    width: RING_SIZE,
    height: RING_SIZE,
    thickness: RING_THICKNESS,
    radius: RING_RADIUS,
    value: 0,
    lineColor: getLevelColor(0),
    lineColorBg: getSubtleColor(),
    capType: "round",
  });
  ui.addImage({
    id: "cpu-ring-icon",
    x: cx + ICON_OFFSET,
    y: cx + ICON_OFFSET,
    width: ICON_SIZE,
    height: ICON_SIZE,
    path: ICONS_PATH + "cpu.png",
    imageTint: getIconColor(),
  });
  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize();
  const GAP = 15 * SCALE;
  const rowWidth = RING_SIZE * 2 + GAP;
  const colHeight = RING_SIZE * 2 + GAP;
  const startX = (SIZE - rowWidth) / 2;
  const startY = (SIZE - colHeight) / 2;

  const ringStyle = {
    width: RING_SIZE,
    height: RING_SIZE,
    thickness: RING_THICKNESS,
    radius: RING_RADIUS,
    value: 0,
    lineColor: getLevelColor(0),
    lineColorBg: getSubtleColor(),
    capType: "round",
  };
  const iconStyle = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    imageTint: getIconColor(),
  };

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  ui.addRoundLine({ id: "cpu-ring", x: startX, y: startY, ...ringStyle });
  ui.addImage({
    id: "cpu-ring-icon",
    x: startX + ICON_OFFSET,
    y: startY + ICON_OFFSET,
    path: ICONS_PATH + "cpu.png",
    ...iconStyle,
  });

  ui.addRoundLine({
    id: "memory-ring",
    x: startX + RING_SIZE + GAP,
    y: startY,
    ...ringStyle,
  });
  ui.addImage({
    id: "memory-ring-icon",
    x: startX + RING_SIZE + GAP + ICON_OFFSET,
    y: startY + ICON_OFFSET,
    path: ICONS_PATH + "memory.png",
    ...iconStyle,
  });

  const row2Y = startY + RING_SIZE + GAP;
  ui.addRoundLine({ id: "disk-ring", x: startX, y: row2Y, ...ringStyle });
  ui.addImage({
    id: "disk-ring-icon",
    x: startX + ICON_OFFSET,
    y: row2Y + ICON_OFFSET,
    path: ICONS_PATH + "disk.png",
    ...iconStyle,
  });

  ui.addRoundLine({
    id: "net-ring",
    x: startX + RING_SIZE + GAP,
    y: row2Y,
    ...ringStyle,
  });
  ui.addImage({
    id: "net-ring-icon",
    x: startX + RING_SIZE + GAP + ICON_OFFSET,
    y: row2Y + ICON_OFFSET,
    path: ICONS_PATH + "network.png",
    ...iconStyle,
  });

  ui.endUpdate();
}

function wideStyle() {
  const { w: W, h: H } = getWidgetSize();
  const GAP = 22 * SCALE;
  const totalWidth = RING_SIZE * 4 + GAP * 3;
  const startX = (W - totalWidth) / 2;
  const ringY = (H - RING_SIZE) / 3;

  const ringStyle = {
    y: ringY,
    width: RING_SIZE,
    height: RING_SIZE,
    thickness: RING_THICKNESS,
    radius: RING_RADIUS,
    value: 0,
    lineColor: getLevelColor(0),
    lineColorBg: getSubtleColor(),
    capType: "round",
  };
  const iconStyle = {
    y: ringY + ICON_OFFSET,
    width: ICON_SIZE,
    height: ICON_SIZE,
    imageTint: getIconColor(),
  };
  const textStyle = {
    y: ringY + RING_SIZE + 12 * SCALE,
    width: RING_SIZE,
    height: 20 * SCALE,
    text: "0%",
    fontSize: 20 * SCALE,
    fontColor: getFontColor(),
    textAlign: "center",
    fontFace: FONT_FACE,
  };

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: W,
    height: H,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  const labels = ["cpu", "memory", "disk", "net"];
  const iconFiles = ["cpu.png", "memory.png", "disk.png", "network.png"];
  for (let i = 0; i < 4; i++) {
    const x = startX + (RING_SIZE + GAP) * i;
    ui.addRoundLine({ id: labels[i] + "-ring", x, ...ringStyle });
    ui.addImage({
      id: labels[i] + "-ring-icon",
      x: x + ICON_OFFSET,
      path: ICONS_PATH + iconFiles[i],
      ...iconStyle,
    });
    ui.addText({
      id: labels[i] + "-ring-text",
      x: x + RING_SIZE / 2,
      ...textStyle,
    });
  }

  ui.endUpdate();
}

function largeStyle() {
  const { w: W, h: H } = getWidgetSize();
  const PAD = 20 * SCALE;
  const SECTION_H = H / 4;

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: W,
    height: H,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  const sections = [
    { id: "cpu", label: "CPU", icon: "cpu.png" },
    { id: "memory", label: "RAM", icon: "memory.png" },
    { id: "disk", label: "Disk", icon: "disk.png" },
    { id: "net", label: "Net", icon: "network.png" },
  ];

  sections.forEach((sec, i) => {
    const y = SECTION_H * i + 15 * SCALE;

    ui.addImage({
      id: sec.id + "-icon",
      x: PAD,
      y,
      width: 20 * SCALE,
      height: 20 * SCALE,
      path: ICONS_PATH + sec.icon,
      imageTint: getIconColor(),
    });
    ui.addText({
      id: sec.id + "-label",
      x: PAD + 30 * SCALE,
      y: y + 2 * SCALE,
      text: sec.label,
      fontSize: 16 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE_SEMIBOLD,
      textAlign: "left",
    });
    ui.addText({
      id: sec.id + "-value",
      x: W - PAD,
      y: y + 2 * SCALE,
      text: "0 %",
      fontSize: 16 * SCALE,
      fontColor: getFontColor(),
      fontFace: FONT_FACE,
      textAlign: "right",
    });

    ui.addAreaGraph({
      id: sec.id + "-graph",
      x: PAD,
      y: y + 25 * SCALE,
      data: [],
      width: W - PAD * 2,
      height: 35 * SCALE,
      minValue: 0,
      maxValue: 100,
      lineColor: "rgba(0, 255, 150, 0.6)",
      fillColor: "rgba(0, 255, 150, 0.15)",
      gridVisible: false,
      maxPoints: MAX_HISTORY,
    });

    if (i < sections.length - 1) {
      ui.addShape({
        id: "div-" + sec.id,
        type: "rectangle",
        x: 0,
        y: SECTION_H * (i + 1),
        width: W,
        height: 1 * SCALE,
        fillColor: getSubtleColor(),
        strokeWidth: 0,
      });
    }
  });

  ui.endUpdate();
}

function render() {
  if (currentStyle === "small") smallStyle();
  else if (currentStyle === "medium") mediumStyle();
  else if (currentStyle === "wide") wideStyle();
  else largeStyle();
}

function clearUI() {
  const ids = [
    "background_Shape",
    "cpu-ring",
    "cpu-ring-icon",
    "cpu-ring-text",
    "cpu-icon",
    "cpu-label",
    "cpu-value",
    "cpu-graph",
    "div-cpu",
    "memory-ring",
    "memory-ring-icon",
    "memory-ring-text",
    "memory-icon",
    "memory-label",
    "memory-value",
    "memory-graph",
    "div-memory",
    "disk-ring",
    "disk-ring-icon",
    "disk-ring-text",
    "disk-icon",
    "disk-label",
    "disk-value",
    "disk-graph",
    "div-disk",
    "net-ring",
    "net-ring-icon",
    "net-ring-text",
    "net-icon",
    "net-label",
    "net-value",
    "net-graph",
    "div-net",
  ];
  ids.forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

render();

ipcRenderer.on("changeMonitorStyle", (event, style) => {
  ui.beginUpdate();
  currentStyle = style;
  clearUI();
  render();
  ui.endUpdate();
});

/** Convert rgb(...) string to rgba(...) for graph transparency. */
function toRgba(color, alpha) {
  if (color === "red") return `rgba(255, 0, 0, ${alpha})`;
  if (color === "yellow") return `rgba(255, 255, 0, ${alpha})`;
  if (color.startsWith("rgb("))
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  return color;
}

function updateRing(id, percent) {
  if (!ui.isElementExist(id)) return;
  ui.setElementProperty(id, "value", percent / 100);
  ui.setElementProperty(id, "lineColor", getLevelColor(percent));
}

function updateRingText(ringId, percent) {
  const textId = ringId + "-text";
  if (ui.isElementExist(textId)) {
    ui.setElementProperty(textId, "text", Math.round(percent) + "%");
  }
}

function updateValueText(id, value) {
  if (ui.isElementExist(id)) {
    ui.setElementProperty(id, "text", Math.round(value) + " %");
  }
}

/** Push a data point to a sparkline graph and update its color based on usage level. */
function updateGraph(graphId, value, history) {
  if (!ui.isElementExist(graphId)) return;

  history.push(value);
  if (history.length > MAX_HISTORY) history.shift();
  ui.setElementProperty(graphId, "data", history);

  const color = getLevelColor(value);
  ui.setElementProperty(graphId, "lineColor", toRgba(color, 0.6));
  ui.setElementProperty(graphId, "fillColor", toRgba(color, 0.15));

  updateValueText(graphId.replace("-graph", "-value"), value);
}

/** Clamp a raw value to a 0-100 percentage relative to the given maximum. */
function computePercent(raw, maxVal) {
  return Math.min(Math.max((raw / maxVal) * 100, 0), 100);
}

ipcRenderer.on("monitor-window-stats", (event, data) => {
  cpuUsage = data.cpu;
  memoryUsage = data.memory;
  diskUsage = data.disk;
  networkUsage = data.network;

  const diskPercent = computePercent(diskUsage, MAX_DISK_SPEED);
  const netPercent = computePercent(networkUsage, MAX_NETWORK_SPEED);

  ui.beginUpdate();

  updateRing("cpu-ring", cpuUsage);
  updateRing("memory-ring", memoryUsage);
  updateRing("disk-ring", diskPercent);
  updateRing("net-ring", netPercent);

  updateRingText("cpu-ring", cpuUsage);
  updateRingText("memory-ring", memoryUsage);
  updateRingText("disk-ring", diskPercent);
  updateRingText("net-ring", netPercent);

  updateGraph("cpu-graph", cpuUsage, cpuHistory);
  updateGraph("memory-graph", memoryUsage, memoryHistory);
  updateGraph("disk-graph", diskPercent, diskHistory);
  updateGraph("net-graph", netPercent, networkHistory);

  ui.endUpdate();
});
