const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_FACE = JSON_DATA.FONT_FACE;
const BG_WIDTH = 600 * SCALE;
const BG_HEIGHT = 650 * SCALE
const SIDEBAR_WIDTH = BG_WIDTH / 4
const SIDEBAR_HEIGHT = BG_HEIGHT

// =============================================================================
// Theme Helpers
// =============================================================================

function getThemeColors() {
    return JSON_DATA.APPEARANCE.THEME === "dark"
        ? JSON_DATA.APPEARANCE.DARK
        : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() { return getThemeColors().BACKGROUND; }
function getBackgroundSubtle() { return JSON_DATA.APPEARANCE.BACKGROUND_SUBTLE }
function getFontColor() { return getThemeColors().FONT; }
function getFontSubtleColor() { return getThemeColors().FONT_SUBTLE; }
function getAccentColor() { return JSON_DATA.APPEARANCE.ACCENT_COLOR; }


ui.addShape({
    id: "backgroundShape",
    type: "rectangle",
    width: BG_WIDTH,
    height: BG_HEIGHT,
    fillColor: getBackgroundColor(),
    strokeWidth: 0
})

ui.addShape({
    id: "sideBar",
    type: "rectangle",
    width: SIDEBAR_WIDTH,
    height: SIDEBAR_HEIGHT,
    strokeWidth: 0,
    fillColor: getBackgroundSubtle(),
})

ui.addImage({
    id: "settingsLogo",
    path: "assets/images/Settings/Settings.png",
    width: SIDEBAR_WIDTH / 2,
    height: SIDEBAR_WIDTH / 2,
    x: ((SIDEBAR_WIDTH / 2)) / 2,
    y: ((SIDEBAR_WIDTH / 2)) / 2
})

ui.addText({
    id: "settingsText",
    text: "Settings",
    x: (SIDEBAR_WIDTH / 2),
    y: ui.getElementProperty("settingsLogo", "y") + ui.getElementProperty("settingsLogo", "height") + 10 * SCALE,
    textAlign: "center",
    fontSize: 25 * SCALE,
    fontWeight: 700,
    fontFace: FONT_FACE,
    fontColor: getFontColor()
})

ui.addShape({
    id: "close",
    type: "rectangle",
    x: BG_WIDTH - 35 * SCALE,
    y: 10 * SCALE,
    width: 25 * SCALE,
    height: 25 * SCALE,
    strokeWidth: 0,
    radius: 25 * SCALE,
    fillColor: getBackgroundSubtle(),
})