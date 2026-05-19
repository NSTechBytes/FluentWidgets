const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;

// =============================================================================
// Theme Helpers
// =============================================================================

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

// =============================================================================
// Widget Size Helper
// =============================================================================

/** The configured widget style name (controls overlay appearance) */
let notesStyle = JSON_DATA.WINDOW_STYLES.NOTES_WINDOW;

/** Get the { w, h } dimensions (already scaled) for a given style key */
function getWidgetSize(styleKey) {
    const key = (styleKey || notesStyle).toUpperCase();
    const s = JSON_DATA.WIDGET_SIZES[key] || JSON_DATA.WIDGET_SIZES.LARGE;
    return { w: s.WIDTH * SCALE, h: s.HEIGHT * SCALE };
}

function largeStyle() {
    const { w: SIZE } = getWidgetSize("large");
    const TOP_SHAPE_ELEMENT_HEIGHT = 50 * SCALE;
    const BOTTOM_SHAPE_ELEMENT_HEIGHT = 50 * SCALE;
    const LEFT_SIDE_SPACE = 20 * SCALE;
    const NOTES_DISPLAY_Y = TOP_SHAPE_ELEMENT_HEIGHT + 20 * SCALE;
    const NOTES_DISPLAY_HEIGHT = SIZE - NOTES_DISPLAY_Y - 50 * SCALE;
    const NOTES_DISPLAY_WIDTH = SIZE - LEFT_SIDE_SPACE - 20 * SCALE;
    const FONT_SIZE = 14 * SCALE;

    ui.beginUpdate();
    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: SIZE, height: SIZE,
        strokeWidth: 0,
        fillColor: getBackgroundColor(),
    });
    ui.addShape({
        id: "top_Shape_Element",
        type: "rectangle",
        width: SIZE, height: TOP_SHAPE_ELEMENT_HEIGHT,
        fillColor: getAccentColor(),
        strokeWidth: 0,
        x: 0, y: 0
    });
    ui.addText({
        id: "top_Shape_Element_Title",
        text: JSON_DATA.NOTES_TOP_TITLE,
        x: LEFT_SIDE_SPACE, y: TOP_SHAPE_ELEMENT_HEIGHT / 2,
        width: SIZE - LEFT_SIDE_SPACE, height: TOP_SHAPE_ELEMENT_HEIGHT,
        fontSize: 16 * SCALE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        fontWeight: 700,
        textAlign: "leftcenter",
        textClip: "ellipsis",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesTitleInput", {
                x: LEFT_SIDE_SPACE, y: (TOP_SHAPE_ELEMENT_HEIGHT / 2) - 10, width:
                    (SIZE - LEFT_SIDE_SPACE) - 10, height: TOP_SHAPE_ELEMENT_HEIGHT / 2, fontSize: FONT_SIZE, backgroundColor: getAccentColor(), defaultValue: JSON_DATA.NOTES_TOP_TITLE
            });
        }
    });
    ui.addText({
        id: "notes_display",
        text: JSON_DATA.NOTES_TEXT,
        x: LEFT_SIDE_SPACE, y: NOTES_DISPLAY_Y,
        width: NOTES_DISPLAY_WIDTH, height: NOTES_DISPLAY_HEIGHT,
        fontSize: FONT_SIZE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        textAlign: "lefttop",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesInput", { x: LEFT_SIDE_SPACE, y: (TOP_SHAPE_ELEMENT_HEIGHT + 30 * SCALE) - 10, width: NOTES_DISPLAY_WIDTH, height: NOTES_DISPLAY_HEIGHT, fontSize: FONT_SIZE, backgroundColor: getInputBoxColor(), defaultValue: JSON_DATA.NOTES_TEXT });
            if (ui.isElementExist("top_Shape_Element_Title")) {
                ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
            }
        }
    });
    ui.addShape({
        id: "bottom_Shape_Element",
        type: "rectangle",
        width: SIZE, height: BOTTOM_SHAPE_ELEMENT_HEIGHT,
        fillColor: "rgba(0, 0, 0, 0)",
        strokeWidth: 0,
        x: 0, y: SIZE - BOTTOM_SHAPE_ELEMENT_HEIGHT
    });
    ui.addText({
        id: "notes_Saved_Time_Label",
        text: JSON_DATA.NOTES_SAVED_TIME,
        x: LEFT_SIDE_SPACE, y: SIZE - BOTTOM_SHAPE_ELEMENT_HEIGHT / 2,
        fontSize: 12 * SCALE,
        fontColor: getFontSubtleColor(),
        fontFace: JSON_DATA.FONT_FACE_SEMIBOLD,
        textAlign: "leftcenter"
    });
    ui.endUpdate();
}

function wideStyle() {
    const { w: W, h: H } = getWidgetSize("wide");
    const TOP_SHAPE_ELEMENT_HEIGHT = 35 * SCALE;
    const BOTTOM_SHAPE_ELEMENT_HEIGHT = 28 * SCALE;
    const LEFT_SIDE_SPACE = 16 * SCALE;
    const NOTES_DISPLAY_Y = TOP_SHAPE_ELEMENT_HEIGHT + 10 * SCALE;
    const NOTES_DISPLAY_HEIGHT = H - NOTES_DISPLAY_Y - BOTTOM_SHAPE_ELEMENT_HEIGHT - 5 * SCALE;
    const NOTES_DISPLAY_WIDTH = W - LEFT_SIDE_SPACE * 2;
    const FONT_SIZE = 13 * SCALE;

    ui.beginUpdate();
    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: W, height: H,
        strokeWidth: 0,
        fillColor: getBackgroundColor(),
    });
    ui.addShape({
        id: "top_Shape_Element",
        type: "rectangle",
        width: W, height: TOP_SHAPE_ELEMENT_HEIGHT,
        fillColor: getAccentColor(),
        strokeWidth: 0,
        x: 0, y: 0
    });
    ui.addText({
        id: "top_Shape_Element_Title",
        text: JSON_DATA.NOTES_TOP_TITLE,
        x: LEFT_SIDE_SPACE, y: TOP_SHAPE_ELEMENT_HEIGHT / 2,
        width: W - LEFT_SIDE_SPACE * 2, height: TOP_SHAPE_ELEMENT_HEIGHT,
        fontSize: 14 * SCALE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        fontWeight: 700,
        textAlign: "leftcenter",
        textClip: "ellipsis",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesTitleInput", {
                x: LEFT_SIDE_SPACE,
                y: (TOP_SHAPE_ELEMENT_HEIGHT / 2) - 9.8,
                width: W - LEFT_SIDE_SPACE * 2,
                height: TOP_SHAPE_ELEMENT_HEIGHT / 2,
                fontSize: FONT_SIZE,
                backgroundColor: getAccentColor(),
                defaultValue: JSON_DATA.NOTES_TOP_TITLE
            });
        }
    });
    ui.addText({
        id: "notes_display",
        text: JSON_DATA.NOTES_TEXT,
        x: LEFT_SIDE_SPACE, y: NOTES_DISPLAY_Y,
        width: NOTES_DISPLAY_WIDTH, height: NOTES_DISPLAY_HEIGHT,
        fontSize: FONT_SIZE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        textAlign: "lefttop",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesInput", {
                x: LEFT_SIDE_SPACE,
                y: TOP_SHAPE_ELEMENT_HEIGHT + 20 * SCALE - 10,
                width: NOTES_DISPLAY_WIDTH - 10,
                height: NOTES_DISPLAY_HEIGHT,
                fontSize: FONT_SIZE,
                backgroundColor: getInputBoxColor(),
                defaultValue: JSON_DATA.NOTES_TEXT
            });
            if (ui.isElementExist("top_Shape_Element_Title")) {
                ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
            }
        }
    });
    ui.addShape({
        id: "bottom_Shape_Element",
        type: "rectangle",
        width: W, height: BOTTOM_SHAPE_ELEMENT_HEIGHT,
        fillColor: "rgba(0, 0, 0, 0)",
        strokeWidth: 0,
        x: 0, y: H - BOTTOM_SHAPE_ELEMENT_HEIGHT
    });
    ui.addText({
        id: "notes_Saved_Time_Label",
        text: JSON_DATA.NOTES_SAVED_TIME,
        x: LEFT_SIDE_SPACE, y: H - BOTTOM_SHAPE_ELEMENT_HEIGHT / 2,
        fontSize: 10 * SCALE,
        fontColor: getFontSubtleColor(),
        fontFace: JSON_DATA.FONT_FACE_SEMIBOLD,
        textAlign: "leftcenter"
    });
    ui.endUpdate();
}

function mediumStyle() {
    const { w: SIZE } = getWidgetSize("medium");
    const TOP_SHAPE_ELEMENT_HEIGHT = 32 * SCALE;
    const BOTTOM_SHAPE_ELEMENT_HEIGHT = 28 * SCALE;
    const LEFT_SIDE_SPACE = 12 * SCALE;
    const NOTES_DISPLAY_Y = TOP_SHAPE_ELEMENT_HEIGHT + 10 * SCALE;
    const NOTES_DISPLAY_HEIGHT = SIZE - NOTES_DISPLAY_Y - BOTTOM_SHAPE_ELEMENT_HEIGHT - 5 * SCALE;
    const NOTES_DISPLAY_WIDTH = SIZE - LEFT_SIDE_SPACE * 2;
    const FONT_SIZE = 12 * SCALE;

    ui.beginUpdate();
    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: SIZE, height: SIZE,
        strokeWidth: 0,
        fillColor: getBackgroundColor(),
    });
    ui.addShape({
        id: "top_Shape_Element",
        type: "rectangle",
        width: SIZE, height: TOP_SHAPE_ELEMENT_HEIGHT,
        fillColor: getAccentColor(),
        strokeWidth: 0,
        x: 0, y: 0
    });
    ui.addText({
        id: "top_Shape_Element_Title",
        text: JSON_DATA.NOTES_TOP_TITLE,
        x: LEFT_SIDE_SPACE, y: TOP_SHAPE_ELEMENT_HEIGHT / 2,
        width: SIZE - LEFT_SIDE_SPACE * 2, height: TOP_SHAPE_ELEMENT_HEIGHT,
        fontSize: 13 * SCALE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        fontWeight: 700,
        textAlign: "leftcenter",
        textClip: "ellipsis",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesTitleInput", {
                x: LEFT_SIDE_SPACE,
                y: (TOP_SHAPE_ELEMENT_HEIGHT / 2) - 11,
                width: SIZE - LEFT_SIDE_SPACE * 2,
                height: TOP_SHAPE_ELEMENT_HEIGHT / 2,
                fontSize: FONT_SIZE,
                backgroundColor: getAccentColor(),
                defaultValue: JSON_DATA.NOTES_TOP_TITLE
            });
        }
    });
    ui.addText({
        id: "notes_display",
        text: JSON_DATA.NOTES_TEXT,
        x: LEFT_SIDE_SPACE, y: NOTES_DISPLAY_Y,
        width: NOTES_DISPLAY_WIDTH, height: NOTES_DISPLAY_HEIGHT,
        fontSize: FONT_SIZE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        textAlign: "lefttop",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesInput", {
                x: LEFT_SIDE_SPACE,
                y: TOP_SHAPE_ELEMENT_HEIGHT + 20 * SCALE - 10,
                width: NOTES_DISPLAY_WIDTH,
                height: NOTES_DISPLAY_HEIGHT,
                fontSize: FONT_SIZE,
                backgroundColor: getInputBoxColor(),
                defaultValue: JSON_DATA.NOTES_TEXT
            });
            if (ui.isElementExist("top_Shape_Element_Title")) {
                ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
            }
        }
    });
    ui.addShape({
        id: "bottom_Shape_Element",
        type: "rectangle",
        width: SIZE, height: BOTTOM_SHAPE_ELEMENT_HEIGHT,
        fillColor: "rgba(0, 0, 0, 0)",
        strokeWidth: 0,
        x: 0, y: SIZE - BOTTOM_SHAPE_ELEMENT_HEIGHT
    });
    ui.addText({
        id: "notes_Saved_Time_Label",
        text: JSON_DATA.NOTES_SAVED_TIME,
        x: LEFT_SIDE_SPACE, y: SIZE - BOTTOM_SHAPE_ELEMENT_HEIGHT / 2,
        fontSize: 10 * SCALE,
        fontColor: getFontSubtleColor(),
        fontFace: JSON_DATA.FONT_FACE_SEMIBOLD,
        textAlign: "leftcenter"
    });
    ui.endUpdate();
}

function smallStyle() {
    const { w: SIZE } = getWidgetSize("small");
    const PADDING = 8 * SCALE;
    const NOTES_DISPLAY_WIDTH = SIZE - PADDING * 2;
    const NOTES_DISPLAY_HEIGHT = SIZE - PADDING * 2;
    const FONT_SIZE = 11 * SCALE;

    ui.beginUpdate();
    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: SIZE, height: SIZE,
        strokeWidth: 0,
        fillColor: getBackgroundColor(),
    });
    // In small style, we do NOT show top_Shape_Element_Title (as requested).
    // And we also do not show top_Shape_Element at all to maximize typing/reading space.
    ui.addText({
        id: "notes_display",
        text: JSON_DATA.NOTES_TEXT,
        x: PADDING, y: PADDING,
        width: NOTES_DISPLAY_WIDTH, height: NOTES_DISPLAY_HEIGHT,
        fontSize: FONT_SIZE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        textAlign: "lefttop",
        onLeftMouseUp: () => {
            ipcRenderer.send("notesInput", {
                x: PADDING,
                y: PADDING + 10 * SCALE - 7,
                width: NOTES_DISPLAY_WIDTH,
                height: NOTES_DISPLAY_HEIGHT,
                fontSize: FONT_SIZE,
                backgroundColor: getInputBoxColor(),
                defaultValue: JSON_DATA.NOTES_TEXT
            });
            if (ui.isElementExist("top_Shape_Element_Title")) {
                ui.setElementProperty("top_Shape_Element_Title", "text", "CTRL+ENTER to save and ESC to cancel");
            }
        }
    });
    ui.endUpdate();
}

function inputBoxDismissed() {
    console.log("inputBoxDismissed");
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
    const ids = [
        "background_Shape", "top_Shape_Element", "top_Shape_Element_Title",
        "notes_display", "bottom_Shape_Element", "notes_Saved_Time_Label"
    ];
    ids.forEach(id => {
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