const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;

function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() { return getThemeColors().BACKGROUND; }
function getFontColor() { return getThemeColors().FONT; }
function getFontSubtleColor() { return getThemeColors().FONT_SUBTLE; }
function getAccentColor() { return JSON_DATA.APPEARANCE.ACCENT_COLOR; }
function getInputBoxColor() { return getThemeColors().INPUT_BOX_BG; }

let notesStyle = JSON_DATA.WINDOW_STYLES.NOTES_WINDOW;

function getWidgetSize(styleKey) {
  const key = (styleKey || notesStyle).toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

function largeStyle() {
  const { w: SIZE } = getWidgetSize("large");
  const HEADER_H = 50 * SCALE;
  const FOOTER_H = 50 * SCALE;
  const PAD = 20 * SCALE;
  const NOTES_Y = HEADER_H + 20 * SCALE;
  const NOTES_H = SIZE - NOTES_Y - FOOTER_H;
  const NOTES_W = SIZE - PAD - 20 * SCALE;
  const FONT_SIZE = 14 * SCALE;

  ui.beginUpdate();
  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, strokeWidth: 0, fillColor: getBackgroundColor() });
  ui.addShape({ id: "top_Shape_Element", type: "rectangle", width: SIZE, height: HEADER_H, fillColor: getAccentColor(), strokeWidth: 0, x: 0, y: 0 });

  ui.addText({
    id: "top_Shape_Element_Title", text: JSON_DATA.NOTES_TOP_TITLE,
    x: PAD, y: HEADER_H / 2, width: SIZE - PAD, height: HEADER_H,
    fontSize: 16 * SCALE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700, textAlign: "leftcenter", textClip: "ellipsis",
    onLeftMouseUp: () => ipcRenderer.send("notesTitleInput", { x: PAD, y: (HEADER_H / 2) - 10, width: (SIZE - PAD) - 10, height: HEADER_H / 2, fontSize: FONT_SIZE, backgroundColor: getAccentColor(), defaultValue: JSON_DATA.NOTES_TOP_TITLE }),
  });

  ui.addText({
    id: "notes_display", text: JSON_DATA.NOTES_TEXT,
    x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => {
      ipcRenderer.send("notesInput", { x: PAD, y: (HEADER_H + 30 * SCALE) - 10, width: NOTES_W, height: NOTES_H, fontSize: FONT_SIZE, backgroundColor: getInputBoxColor(), defaultValue: JSON_DATA.NOTES_TEXT });
      if (ui.isElementExist("top_Shape_Element_Title")) {
        ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
      }
    },
  });

  ui.addShape({ id: "bottom_Shape_Element", type: "rectangle", width: SIZE, height: FOOTER_H, fillColor: "rgba(0, 0, 0, 0)", strokeWidth: 0, x: 0, y: SIZE - FOOTER_H });
  ui.addText({ id: "notes_Saved_Time_Label", text: JSON_DATA.NOTES_SAVED_TIME, x: PAD, y: SIZE - FOOTER_H / 2, fontSize: 12 * SCALE, fontColor: getFontSubtleColor(), fontFace: JSON_DATA.FONT_FACE_SEMIBOLD, textAlign: "leftcenter" });
  ui.endUpdate();
}

function wideStyle() {
  const { w: W, h: H } = getWidgetSize("wide");
  const HEADER_H = 35 * SCALE;
  const FOOTER_H = 28 * SCALE;
  const PAD = 16 * SCALE;
  const NOTES_Y = HEADER_H + 10 * SCALE;
  const NOTES_H = H - NOTES_Y - FOOTER_H - 5 * SCALE;
  const NOTES_W = W - PAD * 2;
  const FONT_SIZE = 13 * SCALE;

  ui.beginUpdate();
  ui.addShape({ id: "background_Shape", type: "rectangle", width: W, height: H, strokeWidth: 0, fillColor: getBackgroundColor() });
  ui.addShape({ id: "top_Shape_Element", type: "rectangle", width: W, height: HEADER_H, fillColor: getAccentColor(), strokeWidth: 0, x: 0, y: 0 });

  ui.addText({
    id: "top_Shape_Element_Title", text: JSON_DATA.NOTES_TOP_TITLE,
    x: PAD, y: HEADER_H / 2, width: W - PAD * 2, height: HEADER_H,
    fontSize: 14 * SCALE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700, textAlign: "leftcenter", textClip: "ellipsis",
    onLeftMouseUp: () => ipcRenderer.send("notesTitleInput", { x: PAD, y: (HEADER_H / 2) - 9.8, width: W - PAD * 2, height: HEADER_H / 2, fontSize: FONT_SIZE, backgroundColor: getAccentColor(), defaultValue: JSON_DATA.NOTES_TOP_TITLE }),
  });

  ui.addText({
    id: "notes_display", text: JSON_DATA.NOTES_TEXT,
    x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => {
      ipcRenderer.send("notesInput", { x: PAD, y: HEADER_H + 20 * SCALE - 10, width: NOTES_W - 10, height: NOTES_H, fontSize: FONT_SIZE, backgroundColor: getInputBoxColor(), defaultValue: JSON_DATA.NOTES_TEXT });
      if (ui.isElementExist("top_Shape_Element_Title")) {
        ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
      }
    },
  });

  ui.addShape({ id: "bottom_Shape_Element", type: "rectangle", width: W, height: FOOTER_H, fillColor: "rgba(0, 0, 0, 0)", strokeWidth: 0, x: 0, y: H - FOOTER_H });
  ui.addText({ id: "notes_Saved_Time_Label", text: JSON_DATA.NOTES_SAVED_TIME, x: PAD, y: H - FOOTER_H / 2, fontSize: 10 * SCALE, fontColor: getFontSubtleColor(), fontFace: JSON_DATA.FONT_FACE_SEMIBOLD, textAlign: "leftcenter" });
  ui.endUpdate();
}

function mediumStyle() {
  const { w: SIZE } = getWidgetSize("medium");
  const HEADER_H = 32 * SCALE;
  const FOOTER_H = 28 * SCALE;
  const PAD = 12 * SCALE;
  const NOTES_Y = HEADER_H + 10 * SCALE;
  const NOTES_H = SIZE - NOTES_Y - FOOTER_H - 5 * SCALE;
  const NOTES_W = SIZE - PAD * 2;
  const FONT_SIZE = 12 * SCALE;

  ui.beginUpdate();
  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, strokeWidth: 0, fillColor: getBackgroundColor() });
  ui.addShape({ id: "top_Shape_Element", type: "rectangle", width: SIZE, height: HEADER_H, fillColor: getAccentColor(), strokeWidth: 0, x: 0, y: 0 });

  ui.addText({
    id: "top_Shape_Element_Title", text: JSON_DATA.NOTES_TOP_TITLE,
    x: PAD, y: HEADER_H / 2, width: SIZE - PAD * 2, height: HEADER_H,
    fontSize: 13 * SCALE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700, textAlign: "leftcenter", textClip: "ellipsis",
    onLeftMouseUp: () => ipcRenderer.send("notesTitleInput", { x: PAD, y: (HEADER_H / 2) - 11, width: SIZE - PAD * 2, height: HEADER_H / 2, fontSize: FONT_SIZE, backgroundColor: getAccentColor(), defaultValue: JSON_DATA.NOTES_TOP_TITLE }),
  });

  ui.addText({
    id: "notes_display", text: JSON_DATA.NOTES_TEXT,
    x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => {
      ipcRenderer.send("notesInput", { x: PAD, y: HEADER_H + 20 * SCALE - 10, width: NOTES_W, height: NOTES_H, fontSize: FONT_SIZE, backgroundColor: getInputBoxColor(), defaultValue: JSON_DATA.NOTES_TEXT });
      if (ui.isElementExist("top_Shape_Element_Title")) {
        ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
      }
    },
  });

  ui.addShape({ id: "bottom_Shape_Element", type: "rectangle", width: SIZE, height: FOOTER_H, fillColor: "rgba(0, 0, 0, 0)", strokeWidth: 0, x: 0, y: SIZE - FOOTER_H });
  ui.addText({ id: "notes_Saved_Time_Label", text: JSON_DATA.NOTES_SAVED_TIME, x: PAD, y: SIZE - FOOTER_H / 2, fontSize: 10 * SCALE, fontColor: getFontSubtleColor(), fontFace: JSON_DATA.FONT_FACE_SEMIBOLD, textAlign: "leftcenter" });
  ui.endUpdate();
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize("small");
  const PAD = 8 * SCALE;
  const FONT_SIZE = 11 * SCALE;

  ui.beginUpdate();
  ui.addShape({ id: "background_Shape", type: "rectangle", width: SIZE, height: SIZE, strokeWidth: 0, fillColor: getBackgroundColor() });

  ui.addText({
    id: "notes_display", text: JSON_DATA.NOTES_TEXT,
    x: PAD, y: PAD, width: SIZE - PAD * 2, height: SIZE - PAD * 2,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => {
      ipcRenderer.send("notesInput", { x: PAD, y: PAD + 10 * SCALE - 7, width: SIZE - PAD * 2, height: SIZE - PAD * 2, fontSize: FONT_SIZE, backgroundColor: getInputBoxColor(), defaultValue: JSON_DATA.NOTES_TEXT });
      if (ui.isElementExist("top_Shape_Element_Title")) {
        ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
      }
    },
  });
  ui.endUpdate();
}

function inputBoxDismissed() {
  if (ui.isElementExist("top_Shape_Element_Title")) {
    ui.setElementProperty("top_Shape_Element_Title", "text", JSON_DATA.NOTES_TOP_TITLE);
  }
  if (ui.isElementExist("notes_display")) {
    ui.setElementProperty("notes_display", "text", JSON_DATA.NOTES_TEXT);
  }
}

ipcRenderer.on("inputBoxDismissed", inputBoxDismissed);

function render() {
  if (notesStyle === "large") largeStyle();
  else if (notesStyle === "wide") wideStyle();
  else if (notesStyle === "medium") mediumStyle();
  else if (notesStyle === "small") smallStyle();
  else largeStyle();
}

function clearUI() {
  ["background_Shape", "top_Shape_Element", "top_Shape_Element_Title", "notes_display", "bottom_Shape_Element", "notes_Saved_Time_Label"].forEach(id => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });
}

render();

ipcRenderer.on("changeNotesStyle", (event, style) => {
  ui.beginUpdate();
  notesStyle = style;
  clearUI();
  render();
  ui.endUpdate();
});
