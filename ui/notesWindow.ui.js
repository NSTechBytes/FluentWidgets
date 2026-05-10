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
const notesStyle = JSON_DATA.WINDOW_STYLES.NOTES_WINDOW;

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
    const FONT_SIZE = 15 * SCALE;

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
        text: "Notes",
        x: LEFT_SIDE_SPACE, y: TOP_SHAPE_ELEMENT_HEIGHT / 2,
        fontSize: 20 * SCALE,
        fontColor: getFontColor(),
        fontFace: JSON_DATA.FONT_FACE,
        textAlign: "leftcenter",
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
        onLeftMouseUp: () => { ipcRenderer.send("notesInput", { x: LEFT_SIDE_SPACE, y: TOP_SHAPE_ELEMENT_HEIGHT + 30 * SCALE, width: NOTES_DISPLAY_WIDTH, height: NOTES_DISPLAY_HEIGHT, fontSize: FONT_SIZE, backgroundColor: getInputBoxColor(), defaultValue: JSON_DATA.NOTES_TEXT }); }
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

largeStyle();