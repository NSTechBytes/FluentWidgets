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

let notesStyle = JSON_DATA.WINDOW_STYLES.NOTES_WINDOW;
let editingField = null;
let titleDraft = JSON_DATA.NOTES_TOP_TITLE;
let notesDraft = JSON_DATA.NOTES_TEXT;

function getWidgetSize(styleKey) {
  const key = (styleKey || notesStyle).toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

/** Remove an active edit input and restore display elements. */
function endEdit(restoreTitleHint) {
  if (ui.isElementExist("title_edit")) ui.removeElementById("title_edit");
  if (ui.isElementExist("notes_edit")) ui.removeElementById("notes_edit");
  editingField = null;

  if (restoreTitleHint !== false && ui.isElementExist("top_Shape_Element_Title")) {
    ui.setElementProperties("top_Shape_Element_Title", { show: true, text: titleDraft });
  }
  if (ui.isElementExist("notes_display")) {
    ui.setElementProperties("notes_display", { show: true, text: notesDraft });
  }
}

/** Save notes body via IPC when the multiline input loses focus. */
function commitNotesEdit() {
  if (editingField !== "notes") return;
  const text = ui.getElementProperty("notes_edit", "text") ?? "";
  notesDraft = text;
  JSON_DATA.NOTES_TEXT = text;
  editingField = null;
  if (ui.isElementExist("notes_edit")) ui.removeElementById("notes_edit");
  if (ui.isElementExist("notes_display")) {
    ui.setElementProperties("notes_display", { show: true, text: text });
  }
  if (ui.isElementExist("top_Shape_Element_Title")) {
    ui.setElementProperties("top_Shape_Element_Title", { text: titleDraft });
  }
  ipcRenderer.send("notesInput", { text });
}

/** Save notes title via IPC when the single-line input submits or blurs. */
function commitTitleEdit() {
  if (editingField !== "title") return;
  const text = ui.getElementProperty("title_edit", "text") ?? "";
  titleDraft = text;
  JSON_DATA.NOTES_TOP_TITLE = text;
  editingField = null;
  if (ui.isElementExist("title_edit")) ui.removeElementById("title_edit");
  if (ui.isElementExist("top_Shape_Element_Title")) {
    ui.setElementProperties("top_Shape_Element_Title", { show: true, text: text });
  }
  ipcRenderer.send("notesTitleInput", { text });
}

function startTitleEdit(opts) {
  if (editingField === "title") return;
  if (editingField === "notes") commitNotesEdit();

  editingField = "title";
  if (ui.isElementExist("top_Shape_Element_Title")) {
    ui.setElementProperties("top_Shape_Element_Title", { show: false });
  }
  if (ui.isElementExist("title_edit")) ui.removeElementById("title_edit");

  ui.addInputBox({
    id: "title_edit",
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    text: titleDraft,
    fontSize: opts.fontSize,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700,
    fillColor: getAccentColor(),
    borderWidth: 0,
    padding: [0, 0],
    onEnter: () => {
      ui.blurInputBox("title_edit");
    },
    onBlur: () => commitTitleEdit(),
  });
  ui.focusInputBox("title_edit");
}

function startNotesEdit(opts) {
  if (editingField === "notes") return;
  if (editingField === "title") commitTitleEdit();

  editingField = "notes";
  if (ui.isElementExist("notes_display")) {
    ui.setElementProperties("notes_display", { show: false });
  }
  if (ui.isElementExist("top_Shape_Element_Title")) {
    ui.setElementProperties("top_Shape_Element_Title", { text: "Click away to save" });
  }
  if (ui.isElementExist("notes_edit")) ui.removeElementById("notes_edit");

  ui.addInputBox({
    id: "notes_edit",
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    text: notesDraft,
    multiline: true,
    fontSize: opts.fontSize,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
    fillColor: "transparent",
    borderWidth: 0,
    padding: [0, 0],
    onBlur: () => commitNotesEdit(),
  });
  ui.focusInputBox("notes_edit");
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
    id: "top_Shape_Element_Title", text: titleDraft,
    x: PAD, y: HEADER_H / 2, width: SIZE - PAD, height: HEADER_H,
    fontSize: 16 * SCALE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700, textAlign: "leftcenter", textClip: "ellipsis",
    onLeftMouseUp: () => startTitleEdit({
      x: PAD, y: (HEADER_H / 2) - 10, width: (SIZE - PAD) - 10, height: HEADER_H / 2, fontSize: FONT_SIZE,
    }),
  });

  ui.addText({
    id: "notes_display", text: notesDraft,
    x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => startNotesEdit({
      x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H, fontSize: FONT_SIZE,
    }),
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
    id: "top_Shape_Element_Title", text: titleDraft,
    x: PAD, y: HEADER_H / 2, width: W - PAD * 2, height: HEADER_H,
    fontSize: 14 * SCALE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700, textAlign: "leftcenter", textClip: "ellipsis",
    onLeftMouseUp: () => startTitleEdit({
      x: PAD, y: (HEADER_H / 2) - 9.8, width: W - PAD * 2, height: HEADER_H / 2, fontSize: FONT_SIZE,
    }),
  });

  ui.addText({
    id: "notes_display", text: notesDraft,
    x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => startNotesEdit({
      x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H, fontSize: FONT_SIZE,
    }),
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
    id: "top_Shape_Element_Title", text: titleDraft,
    x: PAD, y: HEADER_H / 2, width: SIZE - PAD * 2, height: HEADER_H,
    fontSize: 13 * SCALE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700, textAlign: "leftcenter", textClip: "ellipsis",
    onLeftMouseUp: () => startTitleEdit({
      x: PAD, y: (HEADER_H / 2) - 11, width: SIZE - PAD * 2, height: HEADER_H / 2, fontSize: FONT_SIZE,
    }),
  });

  ui.addText({
    id: "notes_display", text: notesDraft,
    x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => startNotesEdit({
      x: PAD, y: NOTES_Y, width: NOTES_W, height: NOTES_H, fontSize: FONT_SIZE,
    }),
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
    id: "notes_display", text: notesDraft,
    x: PAD, y: PAD, width: SIZE - PAD * 2, height: SIZE - PAD * 2,
    fontSize: FONT_SIZE, fontColor: getFontColor(), fontFace: JSON_DATA.FONT_FACE,
    textAlign: "lefttop",
    onLeftMouseUp: () => startNotesEdit({
      x: PAD, y: PAD, width: SIZE - PAD * 2, height: SIZE - PAD * 2, fontSize: FONT_SIZE,
    }),
  });
  ui.endUpdate();
}

function render() {
  if (notesStyle === "large") largeStyle();
  else if (notesStyle === "wide") wideStyle();
  else if (notesStyle === "medium") mediumStyle();
  else if (notesStyle === "small") smallStyle();
  else largeStyle();
}

function clearUI() {
  endEdit(false);
  ["background_Shape", "top_Shape_Element", "top_Shape_Element_Title", "notes_display", "bottom_Shape_Element", "notes_Saved_Time_Label", "title_edit", "notes_edit"].forEach(id => {
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
