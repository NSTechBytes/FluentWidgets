/*
 * Copyright (c) 2024 nstechbytes
 *
 * Licensed under the Apache License, Version 2.0.
 * You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const configuredBackgroundRadius = parseFloat(JSON_DATA.APPEARANCE.BACKGROUND_RADIUS);
const BACKGROUND_RADIUS = Math.max(0, Math.min(100,
  isNaN(configuredBackgroundRadius) ? 16 : configuredBackgroundRadius)) * SCALE;
const addShapeWithBackgroundRadius = ui.addShape.bind(ui);
ui.addShape = (options) => {
  if (options && options.id === "background_Shape") options.radius = BACKGROUND_RADIUS;
  return addShapeWithBackgroundRadius(options);
};

function getThemeColors() {
  const key = String(JSON_DATA.APPEARANCE.THEME || "dark").toUpperCase();
  return JSON_DATA.APPEARANCE[key] || JSON_DATA.APPEARANCE.DARK;
}

function getBackgroundColor() {
  const color = getThemeColors().BACKGROUND;
  const opacity = parseFloat(JSON_DATA.APPEARANCE.BACKGROUND_OPACITY);
  if (isNaN(opacity)) return color;
  const a = Math.max(0, Math.min(1, opacity));
  const m = String(color).match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
  );
  if (!m) return color;
  return "rgba(" + m[1] + ", " + m[2] + ", " + m[3] + ", " + a + ")";
}
function getFontColor() {
  return getThemeColors().FONT;
}
function getFontSubtleColor() {
  return getThemeColors().FONT_SUBTLE;
}
function getAccentColor() {
  return getThemeColors().ACCENT || JSON_DATA.APPEARANCE.ACCENT_COLOR;
}

function addRoundedTopHeader(width, height) {
  const configuredRadius = parseFloat(JSON_DATA.APPEARANCE.BACKGROUND_RADIUS);
  const radius = Math.max(0, Math.min(
    Math.min(width / 2, height),
    (isNaN(configuredRadius) ? 16 : configuredRadius) * SCALE,
  ));
  const right = width;
  const bottom = height;
  const pathData =
    "M0 " + radius +
    " Q0 0 " + radius + " 0" +
    " L" + (right - radius) + " 0" +
    " Q" + right + " 0 " + right + " " + radius +
    " L" + right + " " + bottom +
    " L0 " + bottom + " Z";

  ui.addShape({
    id: "top_Shape_Element",
    type: "path",
    x: 0,
    y: 0,
    pathData,
    fillColor: getAccentColor(),
    strokeWidth: 0,
  });
}

let notesStyle = JSON_DATA.WINDOW_STYLES.NOTES_WINDOW;
let titleDraft = JSON_DATA.NOTES_TOP_TITLE;
let notesDraft = JSON_DATA.NOTES_TEXT;

function getWidgetSize(styleKey) {
  const key = (styleKey || notesStyle).toUpperCase();
  const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
  return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

function saveNotes() {
  const text = ui.getElementProperty("notesInput", "text") ?? "";
  notesDraft = text;
  JSON_DATA.NOTES_TEXT = text;
  ipcRenderer.send("notesInput", { text });
}

function saveTitle() {
  const text = ui.getElementProperty("titleInput", "text") ?? "";
  titleDraft = text;
  JSON_DATA.NOTES_TOP_TITLE = text;
  ipcRenderer.send("notesTitleInput", { text });
}

function addTitleInput(opts) {
  ui.addInputBox({
    id: "titleInput",
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    text: titleDraft,
    fontSize: opts.fontSize,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700,
    fillColor: "rgba(0, 0, 0, 0)",
    borderWidth: 0,
    padding: [0, 0],
    onEnter: () => ui.blurInputBox("titleInput"),
    onBlur: saveTitle,
  });
}

function addNotesInput(opts) {
  ui.addInputBox({
    id: "notesInput",
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
    onBlur: saveNotes,
  });
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
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  addRoundedTopHeader(SIZE, HEADER_H);

  addTitleInput({
    x: PAD,
    y: 0,
    width: SIZE - PAD,
    height: HEADER_H,
    fontSize: 16 * SCALE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700,
  });

  addNotesInput({
    x: PAD,
    y: NOTES_Y,
    width: NOTES_W,
    height: NOTES_H,
    fontSize: FONT_SIZE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
  });

  ui.addShape({
    id: "bottom_Shape_Element",
    type: "rectangle",
    width: SIZE,
    height: FOOTER_H,
    fillColor: "rgba(0, 0, 0, 0)",
    strokeWidth: 0,
    x: 0,
    y: SIZE - FOOTER_H,
  });
  ui.addText({
    id: "notes_Saved_Time_Label",
    text: JSON_DATA.NOTES_SAVED_TIME,
    x: PAD,
    y: SIZE - FOOTER_H / 2,
    fontSize: 12 * SCALE,
    fontColor: getFontSubtleColor(),
    fontFace: JSON_DATA.FONT_FACE_SEMIBOLD,
    textAlign: "leftcenter",
  });
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
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: W,
    height: H,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  addRoundedTopHeader(W, HEADER_H);

  addTitleInput({
    x: PAD,
    y: 0,
    width: W - PAD * 2,
    height: HEADER_H,
    fontSize: 14 * SCALE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700,
  });

  addNotesInput({
    x: PAD,
    y: NOTES_Y,
    width: NOTES_W,
    height: NOTES_H,
    fontSize: FONT_SIZE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
  });

  ui.addShape({
    id: "bottom_Shape_Element",
    type: "rectangle",
    width: W,
    height: FOOTER_H,
    fillColor: "rgba(0, 0, 0, 0)",
    strokeWidth: 0,
    x: 0,
    y: H - FOOTER_H,
  });
  ui.addText({
    id: "notes_Saved_Time_Label",
    text: JSON_DATA.NOTES_SAVED_TIME,
    x: PAD,
    y: H - FOOTER_H / 2,
    fontSize: 10 * SCALE,
    fontColor: getFontSubtleColor(),
    fontFace: JSON_DATA.FONT_FACE_SEMIBOLD,
    textAlign: "leftcenter",
  });
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
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });
  addRoundedTopHeader(SIZE, HEADER_H);

  addTitleInput({
    x: PAD,
    y: 0,
    width: SIZE - PAD * 2,
    height: HEADER_H,
    fontSize: 13 * SCALE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
    fontWeight: 700,
  });

  addNotesInput({
    x: PAD,
    y: NOTES_Y,
    width: NOTES_W,
    height: NOTES_H,
    fontSize: FONT_SIZE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
  });

  ui.addShape({
    id: "bottom_Shape_Element",
    type: "rectangle",
    width: SIZE,
    height: FOOTER_H,
    fillColor: "rgba(0, 0, 0, 0)",
    strokeWidth: 0,
    x: 0,
    y: SIZE - FOOTER_H,
  });
  ui.addText({
    id: "notes_Saved_Time_Label",
    text: JSON_DATA.NOTES_SAVED_TIME,
    x: PAD,
    y: SIZE - FOOTER_H / 2,
    fontSize: 10 * SCALE,
    fontColor: getFontSubtleColor(),
    fontFace: JSON_DATA.FONT_FACE_SEMIBOLD,
    textAlign: "leftcenter",
  });
  ui.endUpdate();
}

function smallStyle() {
  const { w: SIZE } = getWidgetSize("small");
  const PAD = 8 * SCALE;
  const FONT_SIZE = 11 * SCALE;

  ui.beginUpdate();
  ui.addShape({
    id: "background_Shape",
    type: "rectangle",
    width: SIZE,
    height: SIZE,
    strokeWidth: 0,
    fillColor: getBackgroundColor(),
  });

  addNotesInput({
    x: PAD,
    y: PAD,
    width: SIZE - PAD * 2,
    height: SIZE - PAD * 2,
    fontSize: FONT_SIZE,
    fontColor: getFontColor(),
    fontFace: JSON_DATA.FONT_FACE,
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
  [
    "background_Shape",
    "top_Shape_Element",
    "titleInput",
    "notesInput",
    "bottom_Shape_Element",
    "notes_Saved_Time_Label",
  ].forEach((id) => {
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
