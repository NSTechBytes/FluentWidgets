const JSON_DATA = ipcRenderer.invoke("getJSON");
const SCALE = parseFloat(JSON_DATA.SCALE) || 1;
const FONT_FACE = JSON_DATA.FONT_FACE;
const BG_WIDTH = 600 * SCALE;
const BG_HEIGHT = 650 * SCALE;
const SIDEBAR_WIDTH = BG_WIDTH / 4;
const SIDEBAR_HEIGHT = BG_HEIGHT;

function getThemeColors() {
  return JSON_DATA.APPEARANCE.THEME === "dark"
    ? JSON_DATA.APPEARANCE.DARK
    : JSON_DATA.APPEARANCE.LIGHT;
}

function getBackgroundColor() { return getThemeColors().BACKGROUND; }
function getBackgroundSubtle() { return JSON_DATA.APPEARANCE.BACKGROUND_SUBTLE; }
function getFontColor() { return getThemeColors().FONT; }
function getFontSubtleColor() { return getThemeColors().FONT_SUBTLE; }
function getAccentColor() { return JSON_DATA.APPEARANCE.ACCENT_COLOR; }

let currentTab = JSON_DATA.SETTINGS_ACTIVE_TAB || "widgets";
let isCornerDropdownOpen = false;

function switchTab(tabName) {
  if (currentTab === tabName) return;
  clearTabContent();
  currentTab = tabName;
  isCornerDropdownOpen = false;
  ipcRenderer.send("setSettingsActiveTab", tabName);
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

/** Toggle a widget's enabled state and update the toggle switch image. */
function toggleWidgetState(widgetKey) {
  if (!JSON_DATA.LOADED_WIDGETS) JSON_DATA.LOADED_WIDGETS = {};
  const isLoaded = !JSON_DATA.LOADED_WIDGETS[widgetKey];
  JSON_DATA.LOADED_WIDGETS[widgetKey] = isLoaded;

  const imageId = widgetKey.toLowerCase() + "ToggleImage";
  ui.setElementProperty(imageId, "path", isLoaded ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png");
  ipcRenderer.send("toggleWidget", { widgetKey, loaded: isLoaded });
}

function toggleDarkMode() {
  const isDark = JSON_DATA.APPEARANCE.THEME === "dark";
  const newTheme = isDark ? "light" : "dark";
  JSON_DATA.APPEARANCE.THEME = newTheme;
  ui.setElementProperty("darkModeToggleImage", "path", newTheme === "dark" ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png");
  ipcRenderer.send("setDarkMode", newTheme === "dark");
}

function toggle24HourClock() {
  const use24 = !JSON_DATA.USE_24_HOUR_FORMAT;
  JSON_DATA.USE_24_HOUR_FORMAT = use24;
  ui.setElementProperty("use24HourToggleImage", "path", use24 ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png");
  ipcRenderer.send("set24HourFormat", use24);
}

/** Open an input box for editing a general settings field (scale, location, corner style). */
function editGeneralSetting(settingType, elementId, defaultValue, inputType) {
  const x = ui.getElementProperty(elementId, "x");
  const y = ui.getElementProperty(elementId, "y");
  const width = ui.getElementProperty(elementId, "width");
  const height = ui.getElementProperty(elementId, "height");
  const finalWidth = Math.max(120 * SCALE, width);

  ipcRenderer.send("settingsInput", {
    type: settingType,
    x, y,
    width: finalWidth,
    height,
    fontSize: 13 * SCALE,
    backgroundColor: getThemeColors().INPUT_BOX_BG || "rgb(18, 18, 18)",
    defaultValue: String(defaultValue),
    inputType: inputType || "Number",
  });
}

function clearTabContent() {
  ui.beginUpdate();

  const widgetKeys = ["CLOCK", "CALENDAR", "MONITOR", "WEATHER", "NOTES", "MUSIC", "VOLUME"];
  widgetKeys.forEach(key => {
    const lower = key.toLowerCase();
    ["Icon", "Text", "ToggleImage"].forEach(suffix => {
      const id = lower + suffix;
      if (ui.isElementExist(id)) ui.removeElementById(id);
    });
  });

  ["darkModeText", "darkModeToggleImage", "scaleText", "scaleInputBg", "scaleInputText",
    "latitudeText", "latitudeInputBg", "latitudeInputText", "longitudeText", "longitudeInputBg",
    "longitudeInputText", "cityText", "cityInputBg", "cityInputText", "cornerText", "cornerInputBg",
    "cornerInputText", "cornerDropdownBg", "cornerOptionNone", "cornerOptionRoundSmall", "cornerOptionRound",
    "use24HourText", "use24HourToggleImage"
  ].forEach(id => { if (ui.isElementExist(id)) ui.removeElementById(id); });

  ["widgetsPlaceholder", "generalPlaceholder", "aboutPlaceholder",
    "aboutLogo", "aboutTitle", "aboutVersion", "aboutAuthor", "aboutLicense",
    "aboutGithubLogo", "aboutGithubLink",
  ].forEach(id => { if (ui.isElementExist(id)) ui.removeElementById(id); });

  ui.endUpdate();
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
      { key: "MUSIC", title: "Music", icon: "Music.png" },
      { key: "VOLUME", title: "Volume", icon: "Volume.png" },
    ];

    AVAILABLE_WIDGETS.forEach((widget, i) => {
      const rowY = 110 * SCALE + i * 65 * SCALE;
      const lower = widget.key.toLowerCase();
      const isLoaded = JSON_DATA.LOADED_WIDGETS && JSON_DATA.LOADED_WIDGETS[widget.key];

      ui.addImage({ id: lower + "Icon", path: "assets/images/Settings/" + widget.icon, x: SIDEBAR_WIDTH + 30 * SCALE, y: rowY + 16.5 * SCALE, width: 32 * SCALE, height: 32 * SCALE });
      ui.addText({ id: lower + "Text", text: widget.title, x: SIDEBAR_WIDTH + 30 * SCALE + 32 * SCALE + 15 * SCALE, y: rowY + 32.5 * SCALE, textAlign: "leftcenter", fontSize: 15 * SCALE, fontWeight: 500, fontFace: FONT_FACE, fontColor: getFontColor() });
      ui.addImage({ id: lower + "ToggleImage", path: isLoaded ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png", x: BG_WIDTH - 30 * SCALE - 40 * SCALE, y: rowY + 12.5 * SCALE, width: 40 * SCALE, height: 40 * SCALE, onLeftMouseUp: () => toggleWidgetState(widget.key) });
    });

  } else if (currentTab === "general") {
    const isDark = JSON_DATA.APPEARANCE.THEME === "dark";

    ui.addText({ id: "darkModeText", text: "Dark Mode", x: SIDEBAR_WIDTH + 30 * SCALE, y: 110 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addImage({ id: "darkModeToggleImage", path: isDark ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png", x: BG_WIDTH - 30 * SCALE - 40 * SCALE, y: 110 * SCALE + 12.5 * SCALE, width: 40 * SCALE, height: 40 * SCALE, onLeftMouseUp: () => toggleDarkMode() });

    ui.addText({ id: "scaleText", text: "UI Scale (0.5 - 3.0)", x: SIDEBAR_WIDTH + 30 * SCALE, y: 175 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addShape({ id: "scaleInputBg", type: "rectangle", x: BG_WIDTH - 30 * SCALE - 120 * SCALE, y: 175 * SCALE + 4 * SCALE, width: 120 * SCALE, height: 32 * SCALE, radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(), fillColor: getBackgroundSubtle(), onLeftMouseUp: () => editGeneralSetting("scale", "scaleInputBg", JSON_DATA.SCALE) });
    ui.addText({ id: "scaleInputText", text: String(JSON_DATA.SCALE), x: BG_WIDTH - 30 * SCALE - 110 * SCALE, y: 175 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => editGeneralSetting("scale", "scaleInputBg", JSON_DATA.SCALE) });

    ui.addText({ id: "latitudeText", text: "Weather Latitude", x: SIDEBAR_WIDTH + 30 * SCALE, y: 240 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addShape({ id: "latitudeInputBg", type: "rectangle", x: BG_WIDTH - 30 * SCALE - 120 * SCALE, y: 240 * SCALE + 4 * SCALE, width: 120 * SCALE, height: 32 * SCALE, radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(), fillColor: getBackgroundSubtle(), onLeftMouseUp: () => editGeneralSetting("latitude", "latitudeInputBg", JSON_DATA.LOCATION.LATITUDE) });
    ui.addText({ id: "latitudeInputText", text: String(JSON_DATA.LOCATION.LATITUDE), x: BG_WIDTH - 30 * SCALE - 110 * SCALE, y: 240 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => editGeneralSetting("latitude", "latitudeInputBg", JSON_DATA.LOCATION.LATITUDE) });

    ui.addText({ id: "longitudeText", text: "Weather Longitude", x: SIDEBAR_WIDTH + 30 * SCALE, y: 305 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addShape({ id: "longitudeInputBg", type: "rectangle", x: BG_WIDTH - 30 * SCALE - 120 * SCALE, y: 305 * SCALE + 4 * SCALE, width: 120 * SCALE, height: 32 * SCALE, radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(), fillColor: getBackgroundSubtle(), onLeftMouseUp: () => editGeneralSetting("longitude", "longitudeInputBg", JSON_DATA.LOCATION.LONGITUDE, "Number") });
    ui.addText({ id: "longitudeInputText", text: String(JSON_DATA.LOCATION.LONGITUDE), x: BG_WIDTH - 30 * SCALE - 110 * SCALE, y: 305 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => editGeneralSetting("longitude", "longitudeInputBg", JSON_DATA.LOCATION.LONGITUDE, "Number") });

    ui.addText({ id: "cityText", text: "Weather City Name", x: SIDEBAR_WIDTH + 30 * SCALE, y: 370 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addShape({ id: "cityInputBg", type: "rectangle", x: BG_WIDTH - 30 * SCALE - 120 * SCALE, y: 370 * SCALE + 4 * SCALE, width: 120 * SCALE, height: 32 * SCALE, radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(), fillColor: getBackgroundSubtle(), onLeftMouseUp: () => editGeneralSetting("city", "cityInputBg", JSON_DATA.LOCATION.CITY_NAME, "Text") });
    ui.addText({ id: "cityInputText", text: String(JSON_DATA.LOCATION.CITY_NAME), x: BG_WIDTH - 30 * SCALE - 110 * SCALE, y: 370 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => editGeneralSetting("city", "cityInputBg", JSON_DATA.LOCATION.CITY_NAME, "Text") });

    ui.addText({ id: "cornerText", text: "Corner Style", x: SIDEBAR_WIDTH + 30 * SCALE, y: 435 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addShape({ id: "cornerInputBg", type: "rectangle", x: BG_WIDTH - 30 * SCALE - 120 * SCALE, y: 435 * SCALE + 4 * SCALE, width: 120 * SCALE, height: 32 * SCALE, radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(), fillColor: getBackgroundSubtle(), onLeftMouseUp: () => { isCornerDropdownOpen = !isCornerDropdownOpen; clearTabContent(); renderTabContent(); } });
    ui.addText({ id: "cornerInputText", text: String(JSON_DATA.BB_STYLE.ROUND_TYPE), x: BG_WIDTH - 30 * SCALE - 110 * SCALE, y: 435 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => { isCornerDropdownOpen = !isCornerDropdownOpen; clearTabContent(); renderTabContent(); } });

    if (isCornerDropdownOpen) {
      ui.addShape({ id: "cornerDropdownBg", type: "rectangle", x: BG_WIDTH - 30 * SCALE - 120 * SCALE, y: 435 * SCALE + 40 * SCALE, width: 120 * SCALE, height: 90 * SCALE, radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(), fillColor: "rgba(30, 30, 30, 0.9)" });

      const options = ["none", "roundsmall", "round"];
      options.forEach((opt, idx) => {
        const optId = "cornerOption" + (idx === 0 ? "None" : (idx === 1 ? "RoundSmall" : "Round"));
        ui.addText({ id: optId, text: opt, x: BG_WIDTH - 30 * SCALE - 110 * SCALE, y: 435 * SCALE + 40 * SCALE + (15 * SCALE) + (idx * 30 * SCALE), textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => { JSON_DATA.BB_STYLE.ROUND_TYPE = opt; ipcRenderer.send("setCornerStyle", opt); isCornerDropdownOpen = false; clearTabContent(); renderTabContent(); } });
      });
    }

    const use24 = JSON_DATA.USE_24_HOUR_FORMAT;
    ui.addText({ id: "use24HourText", text: "24-Hour Clock", x: SIDEBAR_WIDTH + 30 * SCALE, y: 500 * SCALE + 20 * SCALE, textAlign: "leftcenter", fontSize: 16 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor() });
    ui.addImage({ id: "use24HourToggleImage", path: use24 ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png", x: BG_WIDTH - 30 * SCALE - 40 * SCALE, y: 500 * SCALE + 12.5 * SCALE, width: 40 * SCALE, height: 40 * SCALE, onLeftMouseUp: () => toggle24HourClock() });

  } else if (currentTab === "about") {
    const contentWidth = BG_WIDTH - SIDEBAR_WIDTH;
    const centerX = SIDEBAR_WIDTH + contentWidth / 2;

    ui.addImage({ id: "aboutLogo", path: "assets/images/Settings/logo.png", x: centerX - 36 * SCALE, y: 100 * SCALE, width: 72 * SCALE, height: 72 * SCALE });
    ui.addText({ id: "aboutTitle", text: "FluentWidgets", x: centerX, y: 190 * SCALE, fontSize: 18 * SCALE, fontWeight: "bold", fontFace: FONT_FACE, fontColor: getFontColor(), textAlign: "center" });
    ui.addText({ id: "aboutVersion", text: "Version " + (JSON_DATA.version || "1.0.0.0"), x: centerX, y: 220 * SCALE, fontSize: 13 * SCALE, fontFace: FONT_FACE, fontColor: getFontSubtleColor(), textAlign: "center" });
    ui.addText({ id: "aboutAuthor", text: "Created by " + (JSON_DATA.author || "nstechbytes"), x: centerX, y: 250 * SCALE, fontSize: 13 * SCALE, fontFace: FONT_FACE, fontColor: getFontSubtleColor(), textAlign: "center" });
    ui.addText({ id: "aboutLicense", text: "Licensed under the Apache License, Version 2.0", x: centerX, y: 280 * SCALE, fontSize: 13 * SCALE, fontFace: FONT_FACE, fontColor: getFontSubtleColor(), textAlign: "center" });
    ui.addImage({ id: "aboutGithubLogo", path: "assets/images/Settings/github.png", x: centerX - 20 * SCALE, y: 330 * SCALE, width: 40 * SCALE, height: 40 * SCALE, onLeftMouseUp: () => ipcRenderer.send("openGithub") });
    ui.addText({ id: "aboutGithubLink", text: "View Repository on GitHub", x: centerX, y: 380 * SCALE, fontSize: 13 * SCALE, fontFace: FONT_FACE, fontColor: getAccentColor(), textAlign: "center", onLeftMouseUp: () => ipcRenderer.send("openGithub") });
  }

  ui.endUpdate();
}

ui.addShape({ id: "backgroundShape", type: "rectangle", width: BG_WIDTH, height: BG_HEIGHT, fillColor: getBackgroundColor(), strokeWidth: 0 });
ui.addShape({ id: "sideBar", type: "rectangle", width: SIDEBAR_WIDTH, height: SIDEBAR_HEIGHT, strokeWidth: 0, fillColor: getBackgroundSubtle() });

ui.addImage({ id: "settingsLogo", path: "assets/images/Settings/Settings.png", width: SIDEBAR_WIDTH / 2, height: SIDEBAR_WIDTH / 2, x: (SIDEBAR_WIDTH / 2) / 2, y: (SIDEBAR_WIDTH / 2) / 2 });
ui.addText({ id: "settingsText", text: "Settings", x: (SIDEBAR_WIDTH / 2), y: ui.getElementProperty("settingsLogo", "y") + ui.getElementProperty("settingsLogo", "height") + 10 * SCALE, textAlign: "center", fontSize: 25 * SCALE, fontWeight: 700, fontFace: FONT_FACE, fontColor: getFontColor() });

ui.addShape({ id: "sidebarWidgetItemShape", type: "rectangle", x: 10 * SCALE, y: 180 * SCALE, width: SIDEBAR_WIDTH - 20 * SCALE, height: 45 * SCALE, strokeWidth: 0, radius: 8 * SCALE, fillColor: "rgba(255, 255, 255, 0.08)", onLeftMouseUp: () => switchTab("widgets") });
ui.addImage({ id: "sidebarWidgetItemImage", path: "assets/images/Settings/Widget.png", width: 24 * SCALE, height: 24 * SCALE, x: 20 * SCALE, y: 180 * SCALE + 10.5 * SCALE, onLeftMouseUp: () => switchTab("widgets") });
ui.addText({ id: "sidebarWidgetItemText", text: "Widgets", x: 54 * SCALE, y: 180 * SCALE + 22.5 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => switchTab("widgets") });

ui.addShape({ id: "sidebarGeneralItemShape", type: "rectangle", x: 10 * SCALE, y: 180 * SCALE + 55 * SCALE, width: SIDEBAR_WIDTH - 20 * SCALE, height: 45 * SCALE, strokeWidth: 0, radius: 8 * SCALE, fillColor: "rgba(0, 0, 0, 0)", onLeftMouseUp: () => switchTab("general") });
ui.addImage({ id: "sidebarGeneralItemImage", path: "assets/images/Settings/General.png", width: 24 * SCALE, height: 24 * SCALE, x: 20 * SCALE, y: (180 * SCALE + 55 * SCALE) + 10.5 * SCALE, onLeftMouseUp: () => switchTab("general") });
ui.addText({ id: "sidebarGeneralItemText", text: "General", x: 54 * SCALE, y: (180 * SCALE + 55 * SCALE) + 22.5 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => switchTab("general") });

ui.addShape({ id: "sidebarAboutItemShape", type: "rectangle", x: 10 * SCALE, y: 180 * SCALE + 55 * SCALE * 2, width: SIDEBAR_WIDTH - 20 * SCALE, height: 45 * SCALE, strokeWidth: 0, radius: 8 * SCALE, fillColor: "rgba(0, 0, 0, 0)", onLeftMouseUp: () => switchTab("about") });
ui.addImage({ id: "sidebarAboutItemImage", path: "assets/images/Settings/About.png", width: 24 * SCALE, height: 24 * SCALE, x: 20 * SCALE, y: (180 * SCALE + 55 * SCALE * 2) + 10.5 * SCALE, onLeftMouseUp: () => switchTab("about") });
ui.addText({ id: "sidebarAboutItemText", text: "About", x: 54 * SCALE, y: (180 * SCALE + 55 * SCALE * 2) + 22.5 * SCALE, textAlign: "leftcenter", fontSize: 14 * SCALE, fontWeight: 600, fontFace: FONT_FACE, fontColor: getFontColor(), onLeftMouseUp: () => switchTab("about") });

ui.addShape({ id: "sidebarActiveIndicator", type: "rectangle", x: 12 * SCALE, y: 180 * SCALE + 14.5 * SCALE, width: 3 * SCALE, height: 16 * SCALE, radius: 1.5 * SCALE, strokeWidth: 0, fillColor: getAccentColor() });
ui.addText({ id: "tabTitle", text: "Widgets Settings", x: SIDEBAR_WIDTH + 30 * SCALE, y: 50 * SCALE, textAlign: "leftcenter", fontSize: 24 * SCALE, fontWeight: 700, fontFace: FONT_FACE, fontColor: getFontColor() });
ui.addShape({ id: "close", type: "rectangle", x: BG_WIDTH - 35 * SCALE, y: 10 * SCALE, width: 25 * SCALE, height: 25 * SCALE, strokeWidth: 0, radius: 25 * SCALE, fillColor: getBackgroundSubtle(), onLeftMouseUp: () => ipcRenderer.send("closeSettings") });

updateSidebarSelection();
renderTabContent();
