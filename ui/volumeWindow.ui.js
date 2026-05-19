// =============================================================================
// FluentWidgets — Volume Control Widget (Renderer)
// =============================================================================
// Displays system volume status, supports click-to-mute, slider dragging, and
// scroll-wheel adjusting for small, medium, wide, and large sizes.
// =============================================================================

const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_FACE = JSON_DATA.FONT_FACE;
let currentStyle = JSON_DATA.WINDOW_STYLES.VOLUME_WINDOW || "large";

let volumeVal = 50;
let isMuted = false;

// =============================================================================
// Theme Helpers
// =============================================================================
function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() { return getThemeColors().BACKGROUND; }
function getTextColor() { return getThemeColors().FONT; }
function getSubtleColor() { return getThemeColors().FONT_SUBTLE; }
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
// Helper: Get Volume Icon Path
// =============================================================================
function getVolumeIcon(vol, muted) {
  if (muted || vol === 0) return "assets/icons/Volume/Volume-1.png";
  if (vol <= 33) return "assets/icons/Volume/Volume1.png";
  if (vol <= 66) return "assets/icons/Volume/Volume2.png";
  return "assets/icons/Volume/Volume3.png";
}

// =============================================================================
// Interactive Actions
// =============================================================================
function toggleMute() {
  console.log("[VolumeUI] toggleMute called");
  ipcRenderer.send("toggleMute");
}

function setVolume(pct) {
  console.log("[VolumeUI] setVolume called with percentage:", pct);
  ipcRenderer.send("setVolume", pct);
}

function handleScroll(direction) {
  const delta = direction === "up" ? 5 : -5;
  ipcRenderer.send("changeVolumeStep", delta);
}

function getEventPercent(e) {
  if (!e) return 0;
  const pct = e.__offsetXPercent !== undefined ? e.__offsetXPercent : e.offsetXPercent;
  if (pct === undefined || pct === null || isNaN(pct)) return 0;
  return pct;
}

// =============================================================================
// Style Builders
// =============================================================================

function smallStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    fillColor: getBackgroundColor(),
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down"),
    onLeftMouseUp: toggleMute
  });

  // Circular progress ring showing volume value
  ui.addRoundLine({
    id: "volume_ring",
    x: 5 * SCALE,
    y: 5 * SCALE,
    width: 65 * SCALE,
    height: 65 * SCALE,
    radius: 28 * SCALE,
    thickness: 4 * SCALE,
    value: isMuted ? 0 : volumeVal / 100,
    lineColor: getAccentColor(),
    lineColorBg: getSubtleColor(),
    capType: "round",
    startAngle: 0,
    totalAngle: 360,
    clockwise: true
  });

  ui.addImage({
    id: "volume_icon",
    x: 17.5 * SCALE,
    y: 17.5 * SCALE,
    width: 40 * SCALE,
    height: 40 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
  });

  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    fillColor: getBackgroundColor(),
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down")
  });

  // Centered Volume Icon
  ui.addImage({
    id: "volume_icon",
    x: SIZE / 2 - 22.5 * SCALE,
    y: 20 * SCALE,
    width: 45 * SCALE,
    height: 45 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
    onLeftMouseUp: toggleMute
  });

  // Centered Volume Text
  ui.addText({
    id: "volume_text",
    text: isMuted ? "MUTED" : volumeVal + "%",
    x: SIZE / 2,
    y: 80 * SCALE,
    fontSize: 20 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getTextColor(),
    textAlign: "center"
  });

  // Slider Track (120px wide)
  ui.addShape({
    id: "slider_track",
    type: "rectangle",
    x: 20 * SCALE,
    y: 120 * SCALE,
    width: 120 * SCALE,
    height: 8 * SCALE,
    radius: 4 * SCALE,
    strokeWidth: 0,
    fillColor: getSubtleColor()
  });

  // Slider Fill Accent Track
  const fillWidth = isMuted ? 0 : (volumeVal / 100) * 120 * SCALE;
  ui.addShape({
    id: "slider_fill",
    type: "rectangle",
    x: 20 * SCALE,
    y: 120 * SCALE,
    width: fillWidth,
    height: 8 * SCALE,
    radius: 4 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor()
  });

  // Transparent Slider Hit Overlay (shields track & fill underneath)
  ui.addShape({
    id: "slider_hit",
    type: "rectangle",
    x: 20 * SCALE,
    y: 120 * SCALE,
    width: 120 * SCALE,
    height: 8 * SCALE,
    radius: 4 * SCALE,
    strokeWidth: 0,
    fillColor: "rgba(0,0,0,0)",
    onLeftMouseDown: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Medium slider_hit: onLeftMouseDown, pct =", pct);
      setVolume(pct);
    },
    onDragStart: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Medium slider_hit: onDragStart, pct =", pct);
      setVolume(pct);
    },
    onDrag: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Medium slider_hit: onDrag, pct =", pct);
      setVolume(pct);
    }
  });

  ui.endUpdate();
}

function wideStyle() {
  const { w: W, h: H } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: W,
    height: H,
    fillColor: getBackgroundColor(),
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down")
  });

  // Big Icon on the left
  ui.addImage({
    id: "volume_icon",
    x: 25 * SCALE,
    y: 35 * SCALE,
    width: 90 * SCALE,
    height: 90 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
    onLeftMouseUp: toggleMute
  });

  // Header Title
  ui.addText({
    id: "volume_title",
    text: "Master Volume",
    x: 135 * SCALE,
    y: 40 * SCALE,
    fontSize: 16 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getTextColor(),
    textAlign: "left"
  });

  // Header Status
  ui.addText({
    id: "volume_status",
    text: isMuted ? "MUTED" : volumeVal + "%",
    x: W - 30 * SCALE,
    y: 40 * SCALE,
    fontSize: 16 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getAccentColor(),
    textAlign: "right"
  });

  // Interactive slider track (190px wide)
  ui.addShape({
    id: "slider_track",
    type: "rectangle",
    x: 135 * SCALE,
    y: 85 * SCALE,
    width: 190 * SCALE,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getSubtleColor()
  });

  const fillWidth = isMuted ? 0 : (volumeVal / 100) * 190 * SCALE;
  ui.addShape({
    id: "slider_fill",
    type: "rectangle",
    x: 135 * SCALE,
    y: 85 * SCALE,
    width: fillWidth,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor()
  });

  // Transparent Slider Hit Overlay
  ui.addShape({
    id: "slider_hit",
    type: "rectangle",
    x: 135 * SCALE,
    y: 85 * SCALE,
    width: 190 * SCALE,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: "rgba(0,0,0,0)",
    onLeftMouseDown: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Wide slider_hit: onLeftMouseDown, pct =", pct);
      setVolume(pct);
    },
    onDragStart: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Wide slider_hit: onDragStart, pct =", pct);
      setVolume(pct);
    },
    onDrag: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Wide slider_hit: onDrag, pct =", pct);
      setVolume(pct);
    }
  });

  ui.endUpdate();
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize();

  ui.beginUpdate();

  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    fillColor: getBackgroundColor(),
    mouseEventCursor: false,
    onScrollUp: () => handleScroll("up"),
    onScrollDown: () => handleScroll("down")
  });

  // Large Dynamic Icon in center top
  ui.addImage({
    id: "volume_icon",
    x: SIZE / 2 - 45 * SCALE,
    y: 45 * SCALE,
    width: 90 * SCALE,
    height: 90 * SCALE,
    path: getVolumeIcon(volumeVal, isMuted),
    onLeftMouseUp: toggleMute
  });

  // Large Bold Percentage
  ui.addText({
    id: "volume_text",
    text: isMuted ? "MUTED" : volumeVal + "%",
    x: SIZE / 2,
    y: 155 * SCALE,
    fontSize: 42 * SCALE,
    fontWeight: "bold",
    fontFace: FONT_FACE,
    fontColor: getTextColor(),
    textAlign: "center"
  });

  // Subtitle
  ui.addText({
    id: "volume_subtitle",
    text: isMuted ? "Tap to unmute" : "Scroll or drag to adjust",
    x: SIZE / 2,
    y: 215 * SCALE,
    fontSize: 14 * SCALE,
    fontFace: FONT_FACE,
    fontColor: getSubtleColor(),
    textAlign: "center"
  });

  // Custom wide slider track at the bottom (280px wide)
  ui.addShape({
    id: "slider_track",
    type: "rectangle",
    x: 40 * SCALE,
    y: 275 * SCALE,
    width: 280 * SCALE,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getSubtleColor()
  });

  const fillWidth = isMuted ? 0 : (volumeVal / 100) * 280 * SCALE;
  ui.addShape({
    id: "slider_fill",
    type: "rectangle",
    x: 40 * SCALE,
    y: 275 * SCALE,
    width: fillWidth,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor()
  });

  // Transparent Slider Hit Overlay
  ui.addShape({
    id: "slider_hit",
    type: "rectangle",
    x: 40 * SCALE,
    y: 275 * SCALE,
    width: 280 * SCALE,
    height: 10 * SCALE,
    radius: 5 * SCALE,
    strokeWidth: 0,
    fillColor: "rgba(0,0,0,0)",
    onLeftMouseDown: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Large slider_hit: onLeftMouseDown, pct =", pct);
      setVolume(pct);
    },
    onDragStart: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Large slider_hit: onDragStart, pct =", pct);
      setVolume(pct);
    },
    onDrag: (e) => {
      const pct = Math.round(getEventPercent(e));
      console.log("[VolumeUI] Large slider_hit: onDrag, pct =", pct);
      setVolume(pct);
    }
  });

  ui.endUpdate();
}

function clearUI() {
  const ids = [
    "background_Shape",
    "volume_icon",
    "volume_text",
    "volume_status",
    "volume_subtitle",
    "slider_track",
    "slider_fill",
    "slider_hit",
    "volume_ring"
  ];
  ids.forEach(id => {
    if (ui.isElementExist(id)) {
      ui.removeElementById(id);
    }
  });
}

// =============================================================================
// Initial Render
// =============================================================================
function render() {
  if (currentStyle === "small") smallStyle();
  else if (currentStyle === "medium") mediumStyle();
  else if (currentStyle === "wide") wideStyle();
  else largeStyle();
}

render();

// =============================================================================
// IPC — Hot Style Swapping
// =============================================================================
ipcRenderer.on("changeVolumeStyle", (event, style) => {
  ui.beginUpdate();
  currentStyle = style;
  clearUI();
  render();
  ui.endUpdate();
});

// =============================================================================
// IPC — Update volume properties in real time
// =============================================================================
ipcRenderer.on("volumeUpdate", (event, data) => {
  volumeVal = data.volume;
  isMuted = data.isMuted;

  ui.beginUpdate();

  // 1. Update icon path
  if (ui.isElementExist("volume_icon")) {
    ui.setElementProperty("volume_icon", "path", getVolumeIcon(volumeVal, isMuted));
  }

  // 2. Update status texts
  if (ui.isElementExist("volume_text")) {
    ui.setElementProperty("volume_text", "text", isMuted ? "MUTED" : volumeVal + "%");
  }
  if (ui.isElementExist("volume_status")) {
    ui.setElementProperty("volume_status", "text", isMuted ? "MUTED" : volumeVal + "%");
  }
  if (ui.isElementExist("volume_subtitle")) {
    ui.setElementProperty("volume_subtitle", "text", isMuted ? "Tap to unmute" : "Scroll or drag to adjust");
  }

  // 3. Update slider track fills
  if (ui.isElementExist("slider_fill")) {
    let maxW = 120 * SCALE;
    if (currentStyle === "wide") maxW = 190 * SCALE;
    if (currentStyle === "large") maxW = 280 * SCALE;

    const fillWidth = isMuted ? 0 : (volumeVal / 100) * maxW;
    ui.setElementProperty("slider_fill", "width", fillWidth);
  }

  // 4. Update circular volume ring
  if (ui.isElementExist("volume_ring")) {
    const val = isMuted ? 0 : volumeVal / 100;
    ui.setElementProperty("volume_ring", "value", val);
  }

  ui.endUpdate();
});
