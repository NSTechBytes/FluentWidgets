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

// =============================================================================
// Tab Switching State & Logic
// =============================================================================

let currentTab = "widgets";

function switchTab(tabName) {
    if (currentTab === tabName) return;
    clearTabContent();
    currentTab = tabName;
    updateSidebarSelection();
    renderTabContent();
}

function updateSidebarSelection() {
    ui.beginUpdate();

    const activeBgColor = "rgba(255, 255, 255, 0.08)";
    const inactiveBgColor = "rgba(0, 0, 0, 0)";

    ui.setElementProperty("sidebarWidgetItemShape", "fillColor", currentTab === "widgets" ? activeBgColor : inactiveBgColor);
    ui.setElementProperty("sidebarGeneralItemShape", "fillColor", currentTab === "general" ? activeBgColor : inactiveBgColor);
    ui.setElementProperty("sidebarAboutItemShape", "fillColor", currentTab === "about" ? activeBgColor : inactiveBgColor);

    let indicatorY = 180 * SCALE + 14.5 * SCALE;
    if (currentTab === "general") {
        indicatorY = (180 * SCALE + 55 * SCALE) + 14.5 * SCALE;
    } else if (currentTab === "about") {
        indicatorY = (180 * SCALE + 55 * SCALE * 2) + 14.5 * SCALE;
    }

    ui.setElementProperty("sidebarActiveIndicator", "y", indicatorY);

    ui.endUpdate();
}

function toggleWidgetState(widgetKey) {
    if (!JSON_DATA.LOADED_WIDGETS) JSON_DATA.LOADED_WIDGETS = {};
    const isLoaded = !JSON_DATA.LOADED_WIDGETS[widgetKey];
    JSON_DATA.LOADED_WIDGETS[widgetKey] = isLoaded;

    const imageId = widgetKey.toLowerCase() + "ToggleImage";
    ui.setElementProperty(imageId, "path", isLoaded ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png");

    ipcRenderer.send("toggleWidget", { widgetKey, loaded: isLoaded });
}

function clearTabContent() {
    // 1. Remove widgets tab list elements
    const widgetKeys = ["CLOCK", "CALENDAR", "MONITOR", "WEATHER", "NOTES", "MUSIC"];
    widgetKeys.forEach(key => {
        const lower = key.toLowerCase();
        const ids = [lower + "Icon", lower + "Text", lower + "ToggleImage"];
        ids.forEach(id => {
            if (ui.isElementExist(id)) ui.removeElementById(id);
        });
    });

    // 2. Remove placeholders
    const tabElementIds = ["widgetsPlaceholder", "generalPlaceholder", "aboutPlaceholder"];
    tabElementIds.forEach(id => {
        if (ui.isElementExist(id)) ui.removeElementById(id);
    });
}

function renderTabContent() {
    ui.beginUpdate();

    let titleText = "Widgets Settings";
    if (currentTab === "general") titleText = "General Settings";
    if (currentTab === "about") titleText = "About FluentWidgets";

    ui.setElementProperty("tabTitle", "text", titleText);

    if (currentTab === "widgets") {
        const AVAILABLE_WIDGETS = [
            { key: "CLOCK", title: "Clock", icon: "Clock.png" },
            { key: "CALENDAR", title: "Calendar", icon: "Calendar.png" },
            { key: "MONITOR", title: "Monitoring", icon: "Monitor.png" },
            { key: "WEATHER", title: "Weather", icon: "Weather.png" },
            { key: "NOTES", title: "Notes", icon: "Notes.png" },
            { key: "MUSIC", title: "Music", icon: "Music.png" }
        ];

        AVAILABLE_WIDGETS.forEach((widget, i) => {
            const rowY = 110 * SCALE + i * 65 * SCALE;
            const lower = widget.key.toLowerCase();
            const isLoaded = JSON_DATA.LOADED_WIDGETS && JSON_DATA.LOADED_WIDGETS[widget.key];

            // 1. Icon image
            ui.addImage({
                id: lower + "Icon",
                path: "assets/images/Settings/" + widget.icon,
                x: SIDEBAR_WIDTH + 30 * SCALE,
                y: rowY + 16.5 * SCALE,
                width: 32 * SCALE,
                height: 32 * SCALE
            });

            // 2. Widget Label
            ui.addText({
                id: lower + "Text",
                text: widget.title,
                x: SIDEBAR_WIDTH + 30 * SCALE + 32 * SCALE + 15 * SCALE,
                y: rowY + 32.5 * SCALE,
                textAlign: "leftcenter",
                fontSize: 15 * SCALE,
                fontWeight: 500,
                fontFace: FONT_FACE,
                fontColor: getFontColor()
            });

            // 3. Toggle Switch Image
            ui.addImage({
                id: lower + "ToggleImage",
                path: isLoaded ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png",
                x: BG_WIDTH - 30 * SCALE - 74 * SCALE,
                y: rowY + 12.5 * SCALE,
                width: 50 * SCALE,
                height: 40 * SCALE,
                onLeftMouseUp: () => toggleWidgetState(widget.key)
            });
        });

    } else if (currentTab === "general") {
        ui.addText({
            id: "generalPlaceholder",
            text: "Customize general application options including startup settings, themes, and font faces.",
            x: SIDEBAR_WIDTH + 30 * SCALE,
            y: 110 * SCALE,
            width: BG_WIDTH - SIDEBAR_WIDTH - 60 * SCALE,
            fontSize: 14 * SCALE,
            fontColor: getFontSubtleColor(),
            fontFace: FONT_FACE,
            textAlign: "lefttop"
        });
    } else if (currentTab === "about") {
        ui.addText({
            id: "aboutPlaceholder",
            text: "FluentWidgets v" + JSON_DATA.version + "\nA beautiful suite of system widgets built with Novadesk.\n\nCreated with love by Nasir Shahbaz.",
            x: SIDEBAR_WIDTH + 30 * SCALE,
            y: 110 * SCALE,
            width: BG_WIDTH - SIDEBAR_WIDTH - 60 * SCALE,
            fontSize: 14 * SCALE,
            fontColor: getFontSubtleColor(),
            fontFace: FONT_FACE,
            textAlign: "lefttop"
        });
    }

    ui.endUpdate();
}

// =============================================================================
// Static Layout Drawing
// =============================================================================

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
    id: "sidebarWidgetItemShape",
    type: "rectangle",
    x: 10 * SCALE,
    y: 180 * SCALE,
    width: SIDEBAR_WIDTH - 20 * SCALE,
    height: 45 * SCALE,
    strokeWidth: 0,
    radius: 8 * SCALE,
    fillColor: "rgba(255, 255, 255, 0.08)",
    onLeftMouseUp: () => switchTab("widgets")
})

ui.addImage({
    id: "sidebarWidgetItemImage",
    path: "assets/images/Settings/Widget.png",
    width: 24 * SCALE,
    height: 24 * SCALE,
    x: 20 * SCALE,
    y: 180 * SCALE + 10.5 * SCALE,
    onLeftMouseUp: () => switchTab("widgets")
})

ui.addText({
    id: "sidebarWidgetItemText",
    text: "Widgets",
    x: 54 * SCALE,
    y: 180 * SCALE + 22.5 * SCALE,
    textAlign: "leftcenter",
    fontSize: 14 * SCALE,
    fontWeight: 600,
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    onLeftMouseUp: () => switchTab("widgets")
})

ui.addShape({
    id: "sidebarGeneralItemShape",
    type: "rectangle",
    x: 10 * SCALE,
    y: 180 * SCALE + 55 * SCALE,
    width: SIDEBAR_WIDTH - 20 * SCALE,
    height: 45 * SCALE,
    strokeWidth: 0,
    radius: 8 * SCALE,
    fillColor: "rgba(0, 0, 0, 0)",
    onLeftMouseUp: () => switchTab("general")
})

ui.addImage({
    id: "sidebarGeneralItemImage",
    path: "assets/images/Settings/General.png",
    width: 24 * SCALE,
    height: 24 * SCALE,
    x: 20 * SCALE,
    y: (180 * SCALE + 55 * SCALE) + 10.5 * SCALE,
    onLeftMouseUp: () => switchTab("general")
})

ui.addText({
    id: "sidebarGeneralItemText",
    text: "General",
    x: 54 * SCALE,
    y: (180 * SCALE + 55 * SCALE) + 22.5 * SCALE,
    textAlign: "leftcenter",
    fontSize: 14 * SCALE,
    fontWeight: 600,
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    onLeftMouseUp: () => switchTab("general")
})

ui.addShape({
    id: "sidebarAboutItemShape",
    type: "rectangle",
    x: 10 * SCALE,
    y: 180 * SCALE + 55 * SCALE * 2,
    width: SIDEBAR_WIDTH - 20 * SCALE,
    height: 45 * SCALE,
    strokeWidth: 0,
    radius: 8 * SCALE,
    fillColor: "rgba(0, 0, 0, 0)",
    onLeftMouseUp: () => switchTab("about")
})

ui.addImage({
    id: "sidebarAboutItemImage",
    path: "assets/images/Settings/About.png",
    width: 24 * SCALE,
    height: 24 * SCALE,
    x: 20 * SCALE,
    y: (180 * SCALE + 55 * SCALE * 2) + 10.5 * SCALE,
    onLeftMouseUp: () => switchTab("about")
})

ui.addText({
    id: "sidebarAboutItemText",
    text: "About",
    x: 54 * SCALE,
    y: (180 * SCALE + 55 * SCALE * 2) + 22.5 * SCALE,
    textAlign: "leftcenter",
    fontSize: 14 * SCALE,
    fontWeight: 600,
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    onLeftMouseUp: () => switchTab("about")
})

ui.addShape({
    id: "sidebarActiveIndicator",
    type: "rectangle",
    x: 12 * SCALE,
    y: 180 * SCALE + 14.5 * SCALE,
    width: 3 * SCALE,
    height: 16 * SCALE,
    radius: 1.5 * SCALE,
    strokeWidth: 0,
    fillColor: getAccentColor()
})

ui.addText({
    id: "tabTitle",
    text: "Widgets Settings",
    x: SIDEBAR_WIDTH + 30 * SCALE,
    y: 50 * SCALE,
    textAlign: "leftcenter",
    fontSize: 24 * SCALE,
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

// Initialize first tab view on load
renderTabContent();