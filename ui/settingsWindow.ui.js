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
const FONT_FACE = JSON_DATA.FONT_FACE;
const BG_WIDTH = 600 * SCALE;
const BG_HEIGHT = 765 * SCALE;
const SIDEBAR_WIDTH = BG_WIDTH / 4;
const SIDEBAR_HEIGHT = BG_HEIGHT;

function getThemeColors() {
  const key = String(JSON_DATA.APPEARANCE.THEME || "dark").toUpperCase();
  return JSON_DATA.APPEARANCE[key] || JSON_DATA.APPEARANCE.DARK;
}

function getBackgroundColor() {
  return getThemeColors().BACKGROUND;
}
function getBackgroundSubtle() {
  return (
    getThemeColors().BACKGROUND_SUBTLE ||
    JSON_DATA.APPEARANCE.BACKGROUND_SUBTLE
  );
}
function getFontColor() {
  return getThemeColors().FONT;
}
function getInputCaretColor() {
  const theme = String(JSON_DATA.APPEARANCE.THEME || "dark").toLowerCase();
  return ["dark", "dracula", "github"].includes(theme)
    ? "rgb(255, 255, 255)"
    : "rgb(0, 0, 0)";
}
function getFontSubtleColor() {
  return getThemeColors().FONT_SUBTLE;
}
function getAccentColor() {
  return getThemeColors().ACCENT || JSON_DATA.APPEARANCE.ACCENT_COLOR;
}
function getCardColor() {
  return getThemeColors().CARD || getBackgroundSubtle();
}
function getCardHoverColor() {
  return getThemeColors().CARD_HOVER || getBackgroundSubtle();
}
function getCloseButtonFill() {
  return isDarkTheme()
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(0, 0, 0, 0.12)";
}
function getCloseButtonHoverFill() {
  return "rgba(232, 17, 35, 0.9)";
}

const SIDEBAR_IDLE_FILL = "rgba(0, 0, 0, 0)";
const THEME_OPTIONS = ["dark", "light", "dracula", "github"];
const BLUR_TYPE_OPTIONS = ["none", "acrylic", "blur"];
// InputBox bounds include its 10px padding on both sides.
const SETTING_INPUT_OUTER_WIDTH = 140 * SCALE;

function isDarkTheme() {
  return getThemeColors().MODE !== "light";
}

function getThemeLabel(themeId) {
  const key = String(themeId || "dark").toUpperCase();
  const palette = JSON_DATA.APPEARANCE[key];
  return (palette && palette.LABEL) || key.charAt(0) + key.slice(1).toLowerCase();
}

function getBlurTypeLabel(blurType) {
  const type = String(blurType || "blur").toLowerCase();
  return type === "none" ? "None" : type === "acrylic" ? "Acrylic" : "Blur";
}

function getSidebarActiveFill() {
  return isDarkTheme()
    ? "rgba(255, 255, 255, 0.11)"
    : "rgba(0, 0, 0, 0.06)";
}

function getSidebarHoverFill() {
  return isDarkTheme()
    ? "rgba(255, 255, 255, 0.17)"
    : "rgba(0, 0, 0, 0.1)";
}

// Sidebar item hover: highlight inactive tabs; restore active/idle fill on leave.
function sidebarHoverHandlers(shapeId, tabName) {
  return {
    onMouseOver: () => {
      if (currentTab !== tabName)
        ui.setElementProperty(shapeId, "fillColor", getSidebarHoverFill());
    },
    onMouseLeave: () => {
      ui.setElementProperty(
        shapeId,
        "fillColor",
        currentTab === tabName ? getSidebarActiveFill() : SIDEBAR_IDLE_FILL,
      );
    },
  };
}

// Image hover: full opacity on hover, slightly muted when idle.
function imageHoverHandlers(id) {
  return {
    onMouseOver: () => ui.setElementProperties(id, { imageAlpha: 255 }),
    onMouseLeave: () => ui.setElementProperties(id, { imageAlpha: 210 }),
  };
}

// Text hover: brighten to accent color, restore on leave.
function textHoverHandlers(id, normalColor) {
  return {
    onMouseOver: () => ui.setElementProperty(id, "fontColor", getAccentColor()),
    onMouseLeave: () => ui.setElementProperty(id, "fontColor", normalColor),
  };
}

// Shape hover: swap fill (and optional stroke) while hovered.
function shapeHoverHandlers(
  id,
  normalFill,
  hoverFill,
  normalStroke,
  hoverStroke,
) {
  return {
    onMouseOver: () => {
      const props = { fillColor: hoverFill };
      if (hoverStroke) props.strokeColor = hoverStroke;
      ui.setElementProperties(id, props);
    },
    onMouseLeave: () => {
      const props = { fillColor: normalFill };
      if (normalStroke) props.strokeColor = normalStroke;
      ui.setElementProperties(id, props);
    },
  };
}

function addDropdownChevron(id, x, y, expanded) {
  ui.addShape({
    id,
    type: "path",
    x,
    y,
    width: 12 * SCALE,
    height: 6 * SCALE,
    pathData: expanded ? "M0 6 L6 0 L12 6" : "M0 0 L6 6 L12 0",
    fillColor: "rgba(0,0,0,0)",
    strokeColor: getFontSubtleColor(),
    strokeWidth: 1.5 * SCALE,
    strokeLineJoin: "round",
  });
}

let currentTab = JSON_DATA.SETTINGS_ACTIVE_TAB || "widgets";
let isCornerDropdownOpen = false;
let isThemeDropdownOpen = false;
let isBlurTypeDropdownOpen = false;
let lastCornerDropdownPointerLog = "";

function getSidebarIndicatorY(tabName) {
  if (tabName === "general") {
    return 180 * SCALE + 55 * SCALE + 14.5 * SCALE;
  }
  if (tabName === "about") {
    return 180 * SCALE + 55 * SCALE * 2 + 14.5 * SCALE;
  }
  return 180 * SCALE + 14.5 * SCALE;
}

// Animate display-only tab content into place. Input boxes and dropdown
// popups are deliberately excluded so focusing or opening a control remains
// immediate and does not disturb its caret or hit target.
function animateTabContentEntrance() {
  let ids = [];
  if (currentTab === "widgets") {
    const widgetIds = ["clock", "calendar", "monitor", "weather", "notes", "music", "volume"];
    widgetIds.forEach((id) => {
      ids.push(id + "Icon", id + "Text", id + "ToggleImage");
    });
  } else if (currentTab === "general") {
    ids = [
      "themeText", "blurTypeText", "opacityText", "scaleText",
      "latitudeText", "longitudeText", "cityText", "cornerText",
      "backgroundRadiusText", "use24HourText", "use24HourToggleImage",
    ];
  } else if (currentTab === "about") {
    ids = [
      "aboutPanel", "aboutLogo", "aboutAppName", "aboutVersion",
      "aboutAuthor", "aboutDivider", "aboutLicenseLabel", "aboutLicense",
      "aboutGithubCard", "aboutGithubLogo", "aboutGithubTitle",
      "aboutGithubDesc", "aboutPatreonCard", "aboutPatreonLogo",
      "aboutPatreonTitle", "aboutPatreonDesc", "aboutUpdateBtn",
      "aboutUpdateText",
    ];
  }

  ids.forEach((id) => {
    if (!ui.isElementExist(id)) return;
    const x = Number(ui.getElementProperty(id, "x"));
    if (!Number.isFinite(x)) return;
    ui.animate({
      id,
      duration: 200,
      easing: "ease-out",
      from: { x: x + 14 * SCALE },
      to: { x },
    });
  });
}

// Temporary diagnostic kept deliberately low-volume: it reports only when
// the pointer enters a different dropdown row (or leaves the popup).
ui.on("mouseMove", (e) => {
  if (!isCornerDropdownOpen || !e) return;

  const x = Math.round(e.__clientX);
  const y = Math.round(e.__clientY);
  const left = BG_WIDTH - 30 * SCALE - 120 * SCALE;
  const top = 565 * SCALE + 40 * SCALE;
  let location = "outside";
  if (x >= left && x < left + SETTING_INPUT_OUTER_WIDTH && y >= top && y < top + 90 * SCALE) {
    const row = Math.floor((y - (top + 5 * SCALE)) / (28 * SCALE));
    location = row >= 0 && row < 3 ? "row " + row : "popup gap";
  }

  if (location !== lastCornerDropdownPointerLog) {
    lastCornerDropdownPointerLog = location;
    //console.log("[Corner dropdown] pointer " + location + " at " + x + "," + y);
  }
});

// Dropdowns are overlays, not modal controls. Close the open one when the
// next pointer press is outside its popup and its own toggle field. Keeping
// the field excluded lets a second click close it through its normal
// onLeftMouseUp handler.
ui.on("mouseDown", (e) => {
  if ((!isCornerDropdownOpen && !isThemeDropdownOpen && !isBlurTypeDropdownOpen) || !e) return;

  const x = e.__clientX;
  const y = e.__clientY;
  const left = BG_WIDTH - 30 * SCALE - 120 * SCALE;
  const isInDropdown = (inputTop, popupTop, popupHeight) => {
    const inInput =
      x >= left && x < left + SETTING_INPUT_OUTER_WIDTH &&
      y >= inputTop && y < inputTop + 32 * SCALE;
    const inPopup =
      x >= left && x < left + SETTING_INPUT_OUTER_WIDTH &&
      y >= popupTop && y < popupTop + popupHeight;
    return inInput || inPopup;
  };

  const inCornerDropdown = isInDropdown(
    565 * SCALE + 4 * SCALE,
    565 * SCALE + 40 * SCALE,
    90 * SCALE,
  );
  const inThemeDropdown = isInDropdown(
    110 * SCALE + 4 * SCALE,
    110 * SCALE + 40 * SCALE,
    5 * SCALE + THEME_OPTIONS.length * 28 * SCALE,
  );
  const inBlurTypeDropdown = isInDropdown(
    175 * SCALE + 4 * SCALE,
    175 * SCALE + 40 * SCALE,
    5 * SCALE + BLUR_TYPE_OPTIONS.length * 28 * SCALE,
  );

  let closed = false;
  if (isCornerDropdownOpen && !inCornerDropdown) {
    isCornerDropdownOpen = false;
    closed = true;
    //console.log("[Corner dropdown] closed by outside click");
  }
  if (isThemeDropdownOpen && !inThemeDropdown) {
    isThemeDropdownOpen = false;
    closed = true;
    //console.log("[Theme dropdown] closed by outside click");
  }
  if (isBlurTypeDropdownOpen && !inBlurTypeDropdown) {
    isBlurTypeDropdownOpen = false;
    closed = true;
    console.log("[Blur type dropdown] closed by outside click");
  }

  if (closed) {
    refreshTabContent();
  }
});

function switchTab(tabName) {
  if (currentTab === tabName) return;
  const previousTab = currentTab;
  clearTabContent();
  currentTab = tabName;
  isCornerDropdownOpen = false;
  isThemeDropdownOpen = false;
  isBlurTypeDropdownOpen = false;
  ipcRenderer.send("setSettingsActiveTab", tabName);
  updateSidebarSelection(true, previousTab);
  renderTabContent(true);
}

function updateSidebarSelection(animateIndicator = false, previousTab = currentTab) {
  ui.beginUpdate();

  ui.setElementProperty(
    "sidebarWidgetItemShape",
    "fillColor",
    currentTab === "widgets" ? getSidebarActiveFill() : SIDEBAR_IDLE_FILL,
  );
  ui.setElementProperty(
    "sidebarGeneralItemShape",
    "fillColor",
    currentTab === "general" ? getSidebarActiveFill() : SIDEBAR_IDLE_FILL,
  );
  ui.setElementProperty(
    "sidebarAboutItemShape",
    "fillColor",
    currentTab === "about" ? getSidebarActiveFill() : SIDEBAR_IDLE_FILL,
  );

  const indicatorY = getSidebarIndicatorY(currentTab);
  if (!animateIndicator) {
    ui.setElementProperty("sidebarActiveIndicator", "y", indicatorY);
  }
  ui.endUpdate();

  if (animateIndicator && ui.isElementExist("sidebarActiveIndicator")) {
    ui.animate({
      id: "sidebarActiveIndicator",
      duration: 180,
      easing: "ease-out",
      from: { y: getSidebarIndicatorY(previousTab) },
      to: { y: indicatorY },
    });
  }
}

// Toggle a widget's enabled state and update the toggle switch image.
function toggleWidgetState(widgetKey) {
  if (!JSON_DATA.LOADED_WIDGETS) JSON_DATA.LOADED_WIDGETS = {};
  const isLoaded = !JSON_DATA.LOADED_WIDGETS[widgetKey];
  JSON_DATA.LOADED_WIDGETS[widgetKey] = isLoaded;

  const imageId = widgetKey.toLowerCase() + "ToggleImage";
  ui.setElementProperty(
    imageId,
    "path",
    isLoaded
      ? "assets/images/Settings/on.png"
      : "assets/images/Settings/off.png",
  );
  ipcRenderer.send("toggleWidget", { widgetKey, loaded: isLoaded });
}

function toggleDarkMode() {
  const next = isDarkTheme() ? "light" : "dark";
  JSON_DATA.APPEARANCE.THEME = next;
  ipcRenderer.send("setTheme", next);
}

function setTheme(themeId) {
  JSON_DATA.APPEARANCE.THEME = themeId;
  const palette = JSON_DATA.APPEARANCE[String(themeId).toUpperCase()];
  if (palette && palette.ACCENT) {
    JSON_DATA.APPEARANCE.ACCENT_COLOR = palette.ACCENT;
  }
  ipcRenderer.send("setTheme", themeId);
}

function toggle24HourClock() {
  const use24 = !JSON_DATA.USE_24_HOUR_FORMAT;
  JSON_DATA.USE_24_HOUR_FORMAT = use24;
  ui.setElementProperty(
    "use24HourToggleImage",
    "path",
    use24 ? "assets/images/Settings/on.png" : "assets/images/Settings/off.png",
  );
  ipcRenderer.send("set24HourFormat", use24);
}

// Submit a settings field value from an addInputBox when it changes from the stored value.
function submitSetting(settingType, elementId, originalValue) {
  const text = ui.getElementProperty(elementId, "text") ?? "";
  if (String(text) === String(originalValue)) return;
  ipcRenderer.send("settingsInput", { type: settingType, text });
}

// Create a styled addInputBox used for editable general settings fields.
function addSettingInputBox(id, opts) {
  ui.addInputBox({
    id,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    text: String(opts.value),
    inputType: opts.inputType || "any",
    align: "leftcenter",
    fontSize: 14 * SCALE,
    fontFace: FONT_FACE,
    fontColor: getFontColor(),
    caretColor: getInputCaretColor(),
    fillColor: getBackgroundSubtle(),
    borderWidth: 1 * SCALE,
    borderColor: getFontSubtleColor(),
    borderFocusColor: getAccentColor(),
    borderRadius: 4 * SCALE,
    padding: [10 * SCALE, 0],
    onEnter: () => ui.blurInputBox(id),
    onBlur: () => submitSetting(opts.type, id, opts.value),
  });
}

function clearTabContent() {
  ui.beginUpdate();

  const widgetKeys = [
    "CLOCK",
    "CALENDAR",
    "MONITOR",
    "WEATHER",
    "NOTES",
    "MUSIC",
    "VOLUME",
  ];
  widgetKeys.forEach((key) => {
    const lower = key.toLowerCase();
    ["Icon", "Text", "ToggleImage"].forEach((suffix) => {
      const id = lower + suffix;
      if (ui.isElementExist(id)) ui.removeElementById(id);
    });
  });

  [
    "themeText",
    "themeInputBg",
    "themeInputText",
    "themeInputChevron",
    "themeDropdownBg",
    "themeOptionDark",
    "themeOptionDarkBg",
    "themeOptionLight",
    "themeOptionLightBg",
    "themeOptionDracula",
    "themeOptionDraculaBg",
    "themeOptionGithub",
    "themeOptionGithubBg",
    "blurTypeText",
    "blurTypeInputBg",
    "blurTypeInputText",
    "blurTypeInputChevron",
    "blurTypeDropdownBg",
    "blurTypeOptionNone",
    "blurTypeOptionNoneBg",
    "blurTypeOptionAcrylic",
    "blurTypeOptionAcrylicBg",
    "blurTypeOptionBlur",
    "blurTypeOptionBlurBg",
    "darkModeText",
    "darkModeToggleImage",
    "opacityText",
    "opacityInput",
    "backgroundRadiusText",
    "backgroundRadiusInput",
    "scaleText",
    "scaleInput",
    "latitudeText",
    "latitudeInput",
    "longitudeText",
    "longitudeInput",
    "cityText",
    "cityInput",
    "cornerText",
    "cornerInputBg",
    "cornerInputText",
    "cornerInputChevron",
    "cornerDropdownBg",
    "cornerOptionNone",
    "cornerOptionNoneBg",
    "cornerOptionRoundSmall",
    "cornerOptionRoundSmallBg",
    "cornerOptionRound",
    "cornerOptionRoundBg",
    "use24HourText",
    "use24HourToggleImage",
  ].forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });

  [
    "widgetsPlaceholder",
    "generalPlaceholder",
    "aboutPlaceholder",
    "aboutPanel",
    "aboutLogo",
    "aboutAppName",
    "aboutVersion",
    "aboutAuthor",
    "aboutDivider",
    "aboutLicenseLabel",
    "aboutLicense",
    "aboutGithubCard",
    "aboutGithubLogo",
    "aboutGithubTitle",
    "aboutGithubDesc",
    "aboutPatreonCard",
    "aboutPatreonLogo",
    "aboutPatreonTitle",
    "aboutPatreonDesc",
    "aboutUpdateBtn",
    "aboutUpdateText",
  ].forEach((id) => {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });

  ui.endUpdate();
}

// Keep the old content on screen until its replacement is complete. This
// avoids presenting a transient empty frame when a dropdown opens or closes.
function refreshTabContent() {
  ui.beginUpdate();
  clearTabContent();
  renderTabContent();
  ui.endUpdate();
}

function renderTabContent(animate = false) {
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
      const isLoaded =
        JSON_DATA.LOADED_WIDGETS && JSON_DATA.LOADED_WIDGETS[widget.key];

      ui.addImage({
        id: lower + "Icon",
        path: "assets/images/Settings/" + widget.icon,
        x: SIDEBAR_WIDTH + 30 * SCALE,
        y: rowY + 16.5 * SCALE,
        width: 32 * SCALE,
        height: 32 * SCALE,
      });
      ui.addText({
        id: lower + "Text",
        text: widget.title,
        x: SIDEBAR_WIDTH + 30 * SCALE + 32 * SCALE + 15 * SCALE,
        y: rowY + 32.5 * SCALE,
        textAlign: "leftcenter",
        fontSize: 15 * SCALE,
        fontWeight: 500,
        fontFace: FONT_FACE,
        fontColor: getFontColor(),
      });
      ui.addImage({
        id: lower + "ToggleImage",
        path: isLoaded
          ? "assets/images/Settings/on.png"
          : "assets/images/Settings/off.png",
        x: BG_WIDTH - 30 * SCALE - 40 * SCALE,
        y: rowY + 12.5 * SCALE,
        width: 40 * SCALE,
        height: 40 * SCALE,
        imageAlpha: 210,
        ...imageHoverHandlers(lower + "ToggleImage"),
        onLeftMouseUp: () => toggleWidgetState(widget.key),
      });
    });
  } else if (currentTab === "general") {
    const currentTheme = String(JSON_DATA.APPEARANCE.THEME || "dark").toLowerCase();
    // One shared geometry for input boxes and dropdown fields.
    const settingControlX = BG_WIDTH - 30 * SCALE - 120 * SCALE;
    const settingControlWidth = SETTING_INPUT_OUTER_WIDTH;

    ui.addText({
      id: "themeText",
      text: "Theme",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 110 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    ui.addShape({
      id: "themeInputBg",
      type: "rectangle",
      x: settingControlX,
      y: 110 * SCALE + 4 * SCALE,
      width: settingControlWidth,
      height: 32 * SCALE,
      radius: 4 * SCALE,
      strokeWidth: 1 * SCALE,
      strokeColor: getFontSubtleColor(),
      fillColor: getBackgroundSubtle(),
      ...shapeHoverHandlers(
        "themeInputBg",
        getBackgroundSubtle(),
        getCardHoverColor(),
        getFontSubtleColor(),
        getAccentColor(),
      ),
      onLeftMouseUp: () => {
        isThemeDropdownOpen = !isThemeDropdownOpen;
        isCornerDropdownOpen = false;
        isBlurTypeDropdownOpen = false;
        refreshTabContent();
      },
    });
    ui.addText({
      id: "themeInputText",
      text: getThemeLabel(currentTheme),
      x: settingControlX + 10 * SCALE,
      y: 110 * SCALE + 20 * SCALE,
      width: 120 * SCALE,
      textAlign: "leftcenter",
      fontSize: 14 * SCALE,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
      ...shapeHoverHandlers(
        "themeInputBg",
        getBackgroundSubtle(),
        getCardHoverColor(),
        getFontSubtleColor(),
        getAccentColor(),
      ),
      onLeftMouseUp: () => {
        isThemeDropdownOpen = !isThemeDropdownOpen;
        isCornerDropdownOpen = false;
        isBlurTypeDropdownOpen = false;
        refreshTabContent();
      },
    });
    addDropdownChevron(
      "themeInputChevron",
      settingControlX + settingControlWidth - 22 * SCALE,
      110 * SCALE + 17 * SCALE,
      isThemeDropdownOpen,
    );

    const currentBlurType = String(JSON_DATA.BB_STYLE.BLUR_TYPE || "blur").toLowerCase();
    ui.addText({
      id: "blurTypeText",
      text: "Blur Effect",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 175 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    const toggleBlurTypeDropdown = () => {
      isBlurTypeDropdownOpen = !isBlurTypeDropdownOpen;
      isThemeDropdownOpen = false;
      isCornerDropdownOpen = false;
      refreshTabContent();
    };
    ui.addShape({
      id: "blurTypeInputBg",
      type: "rectangle",
      x: settingControlX,
      y: 175 * SCALE + 4 * SCALE,
      width: settingControlWidth,
      height: 32 * SCALE,
      radius: 4 * SCALE,
      strokeWidth: 1 * SCALE,
      strokeColor: getFontSubtleColor(),
      fillColor: getBackgroundSubtle(),
      ...shapeHoverHandlers("blurTypeInputBg", getBackgroundSubtle(), getCardHoverColor(), getFontSubtleColor(), getAccentColor()),
      onLeftMouseUp: toggleBlurTypeDropdown,
    });
    ui.addText({
      id: "blurTypeInputText",
      text: getBlurTypeLabel(currentBlurType),
      x: settingControlX + 10 * SCALE,
      y: 175 * SCALE + 20 * SCALE,
      width: 120 * SCALE,
      textAlign: "leftcenter",
      fontSize: 14 * SCALE,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
      ...shapeHoverHandlers("blurTypeInputBg", getBackgroundSubtle(), getCardHoverColor(), getFontSubtleColor(), getAccentColor()),
      onLeftMouseUp: toggleBlurTypeDropdown,
    });
    addDropdownChevron(
      "blurTypeInputChevron",
      settingControlX + settingControlWidth - 22 * SCALE,
      175 * SCALE + 17 * SCALE,
      isBlurTypeDropdownOpen,
    );

    const inputX = settingControlX;
    const inputW = 120 * SCALE;
    const inputH = 32 * SCALE;
    const opacityValue =
      JSON_DATA.APPEARANCE.BACKGROUND_OPACITY !== undefined
        ? JSON_DATA.APPEARANCE.BACKGROUND_OPACITY
        : 0.55;

    ui.addText({
      id: "opacityText",
      text: "Background Opacity (0 - 1)",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 240 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    addSettingInputBox("opacityInput", {
      type: "opacity",
      x: inputX,
      y: 240 * SCALE + 4 * SCALE,
      width: inputW,
      height: inputH,
      value: opacityValue,
      inputType: "float",
    });

    ui.addText({
      id: "backgroundRadiusText",
      text: "Background Corner Radius (0 - 100)",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 630 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    addSettingInputBox("backgroundRadiusInput", {
      type: "backgroundRadius",
      x: inputX,
      y: 630 * SCALE + 4 * SCALE,
      width: inputW,
      height: inputH,
      value: JSON_DATA.APPEARANCE.BACKGROUND_RADIUS ?? 16,
      inputType: "integer",
    });

    ui.addText({
      id: "scaleText",
      text: "UI Scale (0.5 - 3.0)",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 305 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    addSettingInputBox("scaleInput", {
      type: "scale",
      x: inputX,
      y: 305 * SCALE + 4 * SCALE,
      width: inputW,
      height: inputH,
      value: JSON_DATA.SCALE,
      inputType: "float",
    });

    ui.addText({
      id: "latitudeText",
      text: "Weather Latitude",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 370 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    addSettingInputBox("latitudeInput", {
      type: "latitude",
      x: inputX,
      y: 370 * SCALE + 4 * SCALE,
      width: inputW,
      height: inputH,
      value: JSON_DATA.LOCATION.LATITUDE,
      inputType: "float",
    });

    ui.addText({
      id: "longitudeText",
      text: "Weather Longitude",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 435 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    addSettingInputBox("longitudeInput", {
      type: "longitude",
      x: inputX,
      y: 435 * SCALE + 4 * SCALE,
      width: inputW,
      height: inputH,
      value: JSON_DATA.LOCATION.LONGITUDE,
      inputType: "float",
    });

    ui.addText({
      id: "cityText",
      text: "Weather City Name",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 500 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    addSettingInputBox("cityInput", {
      type: "city",
      x: inputX,
      y: 500 * SCALE + 4 * SCALE,
      width: inputW,
      height: inputH,
      value: JSON_DATA.LOCATION.CITY_NAME,
      inputType: "any",
    });

    ui.addText({
      id: "cornerText",
      text: "Corner Style",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 565 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    ui.addShape({
      id: "cornerInputBg",
      type: "rectangle",
      x: settingControlX,
      y: 565 * SCALE + 4 * SCALE,
      width: settingControlWidth,
      height: 32 * SCALE,
      radius: 4 * SCALE,
      strokeWidth: 1 * SCALE,
      strokeColor: getFontSubtleColor(),
      fillColor: getBackgroundSubtle(),
      ...shapeHoverHandlers(
        "cornerInputBg",
        getBackgroundSubtle(),
        getCardHoverColor(),
        getFontSubtleColor(),
        getAccentColor(),
      ),
      onLeftMouseUp: () => {
        isCornerDropdownOpen = !isCornerDropdownOpen;
        isThemeDropdownOpen = false;
        isBlurTypeDropdownOpen = false;
        refreshTabContent();
      },
    });
    ui.addText({
      id: "cornerInputText",
      text: String(JSON_DATA.BB_STYLE.ROUND_TYPE),
      x: settingControlX + 10 * SCALE,
      y: 565 * SCALE + 20 * SCALE,
      width: 120 * SCALE,
      textAlign: "leftcenter",
      fontSize: 14 * SCALE,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
      ...shapeHoverHandlers(
        "cornerInputBg",
        getBackgroundSubtle(),
        getCardHoverColor(),
        getFontSubtleColor(),
        getAccentColor(),
      ),
      onLeftMouseUp: () => {
        isCornerDropdownOpen = !isCornerDropdownOpen;
        isThemeDropdownOpen = false;
        isBlurTypeDropdownOpen = false;
        refreshTabContent();
      },
    });
    addDropdownChevron(
      "cornerInputChevron",
      settingControlX + settingControlWidth - 22 * SCALE,
      565 * SCALE + 17 * SCALE,
      isCornerDropdownOpen,
    );

    const use24 = JSON_DATA.USE_24_HOUR_FORMAT;
    ui.addText({
      id: "use24HourText",
      text: "24-Hour Clock",
      x: SIDEBAR_WIDTH + 30 * SCALE,
      y: 695 * SCALE + 20 * SCALE,
      textAlign: "leftcenter",
      fontSize: 16 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    ui.addImage({
      id: "use24HourToggleImage",
      path: use24
        ? "assets/images/Settings/on.png"
        : "assets/images/Settings/off.png",
      x: BG_WIDTH - 30 * SCALE - 40 * SCALE,
      y: 695 * SCALE,
      width: 40 * SCALE,
      height: 40 * SCALE,
      imageAlpha: 210,
      ...imageHoverHandlers("use24HourToggleImage"),
      onLeftMouseUp: () => toggle24HourClock(),
    });

    // Render this overlay after the General controls so it stays on top of
    // the opacity field below it.
    if (isBlurTypeDropdownOpen) {
      const dropdownTop = 175 * SCALE + 40 * SCALE;
      const optionHoverFill = getCardHoverColor();
      ui.addShape({
        id: "blurTypeDropdownBg", type: "rectangle",
        x: settingControlX, y: dropdownTop,
        width: settingControlWidth, height: 5 * SCALE + BLUR_TYPE_OPTIONS.length * 28 * SCALE,
        radius: 4 * SCALE, strokeWidth: 1 * SCALE, strokeColor: getFontSubtleColor(),
        fillColor: isDarkTheme() ? "rgba(36, 36, 40, 0.96)" : "rgba(255, 255, 255, 0.94)",
        mouseEventCursor: false, onLeftMouseDown: () => {}, onLeftMouseUp: () => {},
      });
      BLUR_TYPE_OPTIONS.forEach((opt, idx) => {
        const suffix = opt.charAt(0).toUpperCase() + opt.slice(1);
        const optId = "blurTypeOption" + suffix;
        const optBgId = optId + "Bg";
        const rowY = dropdownTop + 5 * SCALE + idx * 28 * SCALE;
        const normalText = getFontColor();
        const hover = {
          onMouseOver: () => { ui.setElementProperty(optBgId, "fillColor", optionHoverFill); ui.setElementProperty(optId, "fontColor", getAccentColor()); },
          onMouseLeave: () => { ui.setElementProperty(optBgId, "fillColor", "rgba(0,0,0,0)"); ui.setElementProperty(optId, "fontColor", normalText); },
        };
        const selectOption = () => {
          JSON_DATA.BB_STYLE.BLUR_TYPE = opt;
          ipcRenderer.send("setBlurType", opt);
          isBlurTypeDropdownOpen = false;
          refreshTabContent();
        };
        ui.addShape({
          id: optBgId, type: "rectangle", x: settingControlX + 4 * SCALE, y: rowY,
          width: 132 * SCALE, height: 26 * SCALE, radius: 3 * SCALE, strokeWidth: 0,
          fillColor: "rgba(0,0,0,0)", mouseEventCursor: true, mouseEventCursorName: "hand",
          ...hover, onLeftMouseUp: selectOption,
        });
        ui.addText({
          id: optId, text: getBlurTypeLabel(opt), x: settingControlX + 10 * SCALE,
          y: rowY + 13 * SCALE, width: 120 * SCALE, height: 26 * SCALE,
          textAlign: "leftcenter", fontSize: 14 * SCALE, fontFace: FONT_FACE, fontColor: normalText,
        });
      });
    }

    if (isThemeDropdownOpen) {
      const dropdownFill = isDarkTheme()
        ? "rgba(36, 36, 40, 0.96)"
        : "rgba(255, 255, 255, 0.94)";
      const optionHoverFill = getCardHoverColor();
      const themeDropdownH = 5 * SCALE + THEME_OPTIONS.length * 28 * SCALE;
      ui.addShape({
        id: "themeDropdownBg",
        type: "rectangle",
        x: settingControlX,
        y: 110 * SCALE + 40 * SCALE,
        width: settingControlWidth,
        height: themeDropdownH,
        radius: 4 * SCALE,
        strokeWidth: 1 * SCALE,
        strokeColor: getFontSubtleColor(),
        fillColor: dropdownFill,
        mouseEventCursor: false,
        onLeftMouseDown: () => {},
        onLeftMouseUp: () => {},
      });

      THEME_OPTIONS.forEach((opt, idx) => {
        const suffix = opt.charAt(0).toUpperCase() + opt.slice(1);
        const optId = "themeOption" + suffix;
        const optBgId = optId + "Bg";
        const rowY = 110 * SCALE + 40 * SCALE + 5 * SCALE + idx * 28 * SCALE;
        const normalText = getFontColor();
        const selectOption = () => {
          isThemeDropdownOpen = false;
          setTheme(opt);
          refreshTabContent();
        };
        const itemHover = {
          onMouseOver: () => {
            ui.setElementProperty(optBgId, "fillColor", optionHoverFill);
            ui.setElementProperty(optId, "fontColor", getAccentColor());
          },
          onMouseLeave: () => {
            ui.setElementProperty(optBgId, "fillColor", "rgba(0,0,0,0)");
            ui.setElementProperty(optId, "fontColor", normalText);
          },
        };
        ui.addShape({
          id: optBgId,
          type: "rectangle",
          x: settingControlX + 4 * SCALE,
          y: rowY,
          width: 132 * SCALE,
          height: 26 * SCALE,
          radius: 3 * SCALE,
          strokeWidth: 0,
          fillColor: "rgba(0,0,0,0)",
          ...itemHover,
          onLeftMouseUp: selectOption,
        });
        ui.addText({
          id: optId,
          text: getThemeLabel(opt),
          x: settingControlX + 10 * SCALE,
          y: rowY + 13 * SCALE,
          width: 120 * SCALE,
          height: 26 * SCALE,
          textAlign: "leftcenter",
          fontSize: 14 * SCALE,
          fontFace: FONT_FACE,
          fontColor: normalText,
          ...itemHover,
          onLeftMouseUp: selectOption,
        });
      });
    }

    if (isCornerDropdownOpen) {
      //console.log("[Corner dropdown] rendering options");
      lastCornerDropdownPointerLog = "";
      const dropdownFill = isDarkTheme()
        ? "rgba(36, 36, 40, 0.96)"
        : "rgba(255, 255, 255, 0.94)";
      const optionHoverFill = getCardHoverColor();
      ui.addShape({
        id: "cornerDropdownBg",
        type: "rectangle",
        x: settingControlX,
        y: 565 * SCALE + 40 * SCALE,
        width: settingControlWidth,
        height: 90 * SCALE,
        radius: 4 * SCALE,
        strokeWidth: 1 * SCALE,
        strokeColor: getFontSubtleColor(),
        fillColor: dropdownFill,
        mouseEventCursor: false,
        onLeftMouseDown: () => {},
        onLeftMouseUp: () => {},
      });

      const options = ["none", "roundsmall", "round"];
      options.forEach((opt, idx) => {
        const suffix =
          idx === 0 ? "None" : idx === 1 ? "RoundSmall" : "Round";
        const optId = "cornerOption" + suffix;
        const optBgId = optId + "Bg";
        const rowY = 565 * SCALE + 40 * SCALE + 5 * SCALE + idx * 28 * SCALE;
        const normalText = getFontColor();
        const selectOption = () => {
          JSON_DATA.BB_STYLE.ROUND_TYPE = opt;
          ipcRenderer.send("setCornerStyle", opt);
          isCornerDropdownOpen = false;
          refreshTabContent();
        };
        const itemHover = {
          onMouseOver: () => {
            //console.log("[Corner dropdown] hover enter: " + opt);
            ui.setElementProperty(optBgId, "fillColor", optionHoverFill);
            ui.setElementProperty(optId, "fontColor", getAccentColor());
          },
          onMouseLeave: () => {
            //console.log("[Corner dropdown] hover leave: " + opt);
            ui.setElementProperty(optBgId, "fillColor", "rgba(0,0,0,0)");
            ui.setElementProperty(optId, "fontColor", normalText);
          },
        };
        ui.addShape({
          id: optBgId,
          type: "rectangle",
          x: settingControlX + 4 * SCALE,
          y: rowY,
          width: 132 * SCALE,
          height: 26 * SCALE,
          radius: 3 * SCALE,
          strokeWidth: 0,
          fillColor: "rgba(0,0,0,0)",
          mouseEventCursor: true,
          mouseEventCursorName: "hand",
          ...itemHover,
          onLeftMouseUp: () => {
            //console.log("[Corner dropdown] selected: " + opt);
            selectOption();
          },
        });
        ui.addText({
          id: optId,
          text: opt,
          x: settingControlX + 10 * SCALE,
          y: rowY + 13 * SCALE,
          width: 120 * SCALE,
          height: 26 * SCALE,
          textAlign: "leftcenter",
          fontSize: 14 * SCALE,
          fontFace: FONT_FACE,
          fontColor: normalText,
          // The background owns pointer events for the complete row. Keeping
          // this overlay display-only avoids the label and background
          // repeatedly stealing hover ownership from one another.
        });
      });
    }
  } else if (currentTab === "about") {
    const isDark = isDarkTheme();
    const contentX = SIDEBAR_WIDTH + 30 * SCALE;
    const contentW = BG_WIDTH - SIDEBAR_WIDTH - 60 * SCALE;
    const muted = getFontSubtleColor();
    const cardFill = getCardColor();
    const cardHover = getCardHoverColor();
    const panelFill = isDark
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(255, 255, 255, 0.55)";
    const dividerColor = getThemeColors().SUBTLE;
    const accent = getAccentColor();
    const accentHover = isDark
      ? "rgba(40, 160, 245, 1)"
      : "rgba(0, 120, 212, 0.92)";

    /** Shared full-width action row used for GitHub / Patreon cards. */
    function addAboutActionCard(opts) {
      const cardId = opts.id + "Card";
      const logoId = opts.id + "Logo";
      const titleId = opts.id + "Title";
      const descId = opts.id + "Desc";
      const hover = shapeHoverHandlers(cardId, cardFill, cardHover);

      ui.addShape({
        id: cardId,
        type: "rectangle",
        x: contentX,
        y: opts.y,
        width: contentW,
        height: 64 * SCALE,
        radius: 10 * SCALE,
        strokeWidth: 0,
        fillColor: cardFill,
        ...hover,
        onLeftMouseUp: opts.onClick,
      });
      ui.addImage({
        id: logoId,
        path: opts.icon,
        x: contentX + 16 * SCALE,
        y: opts.y + 14 * SCALE,
        width: 36 * SCALE,
        height: 36 * SCALE,
        ...hover,
        onLeftMouseUp: opts.onClick,
      });
      ui.addText({
        id: titleId,
        text: opts.title,
        x: contentX + 68 * SCALE,
        y: opts.y + 24 * SCALE,
        textAlign: "leftcenter",
        fontSize: 14 * SCALE,
        fontWeight: 600,
        fontFace: FONT_FACE,
        fontColor: getFontColor(),
        ...hover,
        onLeftMouseUp: opts.onClick,
      });
      ui.addText({
        id: descId,
        text: opts.desc,
        x: contentX + 68 * SCALE,
        y: opts.y + 44 * SCALE,
        textAlign: "leftcenter",
        fontSize: 12 * SCALE,
        fontFace: FONT_FACE,
        fontColor: muted,
        ...hover,
        onLeftMouseUp: opts.onClick,
      });
    }

    // Soft panel behind the about content for grouping
    ui.addShape({
      id: "aboutPanel",
      type: "rectangle",
      x: contentX - 8 * SCALE,
      y: 88 * SCALE,
      width: contentW + 16 * SCALE,
      height: 470 * SCALE,
      radius: 14 * SCALE,
      strokeWidth: 0,
      fillColor: panelFill,
    });

    // Identity row: logo + name / version / author
    ui.addImage({
      id: "aboutLogo",
      path: "assets/images/Settings/logo.png",
      x: contentX + 12 * SCALE,
      y: 110 * SCALE,
      width: 72 * SCALE,
      height: 72 * SCALE,
    });
    ui.addText({
      id: "aboutAppName",
      text: "FluentWidgets",
      x: contentX + 100 * SCALE,
      y: 128 * SCALE,
      textAlign: "leftcenter",
      fontSize: 22 * SCALE,
      fontWeight: 700,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });
    ui.addText({
      id: "aboutVersion",
      text: "Version " + (JSON_DATA.version || "1.0.0.0"),
      x: contentX + 100 * SCALE,
      y: 156 * SCALE,
      textAlign: "leftcenter",
      fontSize: 13 * SCALE,
      fontFace: FONT_FACE,
      fontColor: muted,
    });
    ui.addText({
      id: "aboutAuthor",
      text: "Created by " + (JSON_DATA.author || "nstechbytes"),
      x: contentX + 100 * SCALE,
      y: 176 * SCALE,
      textAlign: "leftcenter",
      fontSize: 13 * SCALE,
      fontFace: FONT_FACE,
      fontColor: muted,
    });

    ui.addShape({
      id: "aboutDivider",
      type: "rectangle",
      x: contentX + 12 * SCALE,
      y: 208 * SCALE,
      width: contentW - 24 * SCALE,
      height: 1 * SCALE,
      strokeWidth: 0,
      fillColor: dividerColor,
    });

    ui.addText({
      id: "aboutLicenseLabel",
      text: "License",
      x: contentX + 12 * SCALE,
      y: 236 * SCALE,
      textAlign: "leftcenter",
      fontSize: 12 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: muted,
    });
    ui.addText({
      id: "aboutLicense",
      text: "Apache License, Version 2.0",
      x: contentX + 12 * SCALE,
      y: 258 * SCALE,
      textAlign: "leftcenter",
      fontSize: 14 * SCALE,
      fontFace: FONT_FACE,
      fontColor: getFontColor(),
    });

    addAboutActionCard({
      id: "aboutGithub",
      y: 290 * SCALE,
      icon: "assets/images/Settings/github.png",
      title: "GitHub Repository",
      desc: "View source code and contribute",
      onClick: () => ipcRenderer.send("openGithub"),
    });

    addAboutActionCard({
      id: "aboutPatreon",
      y: 366 * SCALE,
      icon: "assets/patreon.png",
      title: "Support on Patreon",
      desc: "Help keep FluentWidgets growing",
      onClick: () => ipcRenderer.send("openPatreon"),
    });

    const updateY = 452 * SCALE;
    const updateH = 44 * SCALE;
    const updateHover = shapeHoverHandlers("aboutUpdateBtn", accent, accentHover);

    ui.addShape({
      id: "aboutUpdateBtn",
      type: "rectangle",
      x: contentX,
      y: updateY,
      width: contentW,
      height: updateH,
      radius: 10 * SCALE,
      strokeWidth: 0,
      fillColor: accent,
      ...updateHover,
      onLeftMouseUp: () => ipcRenderer.send("checkForUpdate"),
    });
    ui.addText({
      id: "aboutUpdateText",
      text: "Check for Updates",
      x: contentX + contentW / 2,
      y: updateY + updateH / 2,
      textAlign: "centercenter",
      fontSize: 14 * SCALE,
      fontWeight: 600,
      fontFace: FONT_FACE,
      fontColor: "rgb(255, 255, 255)",
      ...updateHover,
      onLeftMouseUp: () => ipcRenderer.send("checkForUpdate"),
    });
  }

  ui.endUpdate();

  // A small title motion gives tab changes a clear visual transition without
  // animating interactive controls or causing dropdown/input flicker.
  if (animate && ui.isElementExist("tabTitle")) {
    const titleX = SIDEBAR_WIDTH + 30 * SCALE;
    ui.animate({
      id: "tabTitle",
      duration: 180,
      easing: "ease-out",
      from: { x: titleX + 12 * SCALE },
      to: { x: titleX },
    });
    animateTabContentEntrance();
  }
}

const configuredSettingsRadius = parseFloat(JSON_DATA.APPEARANCE.BACKGROUND_RADIUS);
const settingsBackgroundRadius = Math.max(0, Math.min(
  100,
  isNaN(configuredSettingsRadius) ? 16 : configuredSettingsRadius,
)) * SCALE;

ui.addShape({
  id: "backgroundShape",
  type: "rectangle",
  width: BG_WIDTH,
  height: BG_HEIGHT,
  radius: settingsBackgroundRadius,
  fillColor: getBackgroundColor(),
  strokeWidth: 0,
});

// Curve only the outer left edge. The sidebar's right edge remains flush with
// the main Settings panel.
const sidebarRadius = Math.min(
  settingsBackgroundRadius,
  SIDEBAR_WIDTH / 2,
  SIDEBAR_HEIGHT / 2,
);
const sidebarPath =
  "M" + sidebarRadius + " 0" +
  " L" + SIDEBAR_WIDTH + " 0" +
  " L" + SIDEBAR_WIDTH + " " + SIDEBAR_HEIGHT +
  " L" + sidebarRadius + " " + SIDEBAR_HEIGHT +
  " Q0 " + SIDEBAR_HEIGHT + " 0 " + (SIDEBAR_HEIGHT - sidebarRadius) +
  " L0 " + sidebarRadius +
  " Q0 0 " + sidebarRadius + " 0 Z";

ui.addShape({
  id: "sideBar",
  type: "path",
  x: 0,
  y: 0,
  pathData: sidebarPath,
  strokeWidth: 0,
  fillColor: getBackgroundSubtle(),
});

ui.addImage({
  id: "settingsLogo",
  path: "assets/images/Settings/Settings.png",
  width: SIDEBAR_WIDTH / 2,
  height: SIDEBAR_WIDTH / 2,
  x: SIDEBAR_WIDTH / 2 / 2,
  y: SIDEBAR_WIDTH / 2 / 2,
});
ui.addText({
  id: "settingsText",
  text: "Settings",
  x: SIDEBAR_WIDTH / 2,
  y:
    ui.getElementProperty("settingsLogo", "y") +
    ui.getElementProperty("settingsLogo", "height") +
    10 * SCALE,
  textAlign: "center",
  fontSize: 25 * SCALE,
  fontWeight: 700,
  fontFace: FONT_FACE,
  fontColor: getFontColor(),
});

ui.addShape({
  id: "sidebarWidgetItemShape",
  type: "rectangle",
  x: 10 * SCALE,
  y: 180 * SCALE,
  width: SIDEBAR_WIDTH - 20 * SCALE,
  height: 45 * SCALE,
  strokeWidth: 0,
  radius: 8 * SCALE,
  fillColor: getSidebarActiveFill(),
  ...sidebarHoverHandlers("sidebarWidgetItemShape", "widgets"),
  onLeftMouseUp: () => switchTab("widgets"),
});
ui.addImage({
  id: "sidebarWidgetItemImage",
  path: "assets/images/Settings/Widget.png",
  width: 24 * SCALE,
  height: 24 * SCALE,
  x: 20 * SCALE,
  y: 180 * SCALE + 10.5 * SCALE,
  ...sidebarHoverHandlers("sidebarWidgetItemShape", "widgets"),
  onLeftMouseUp: () => switchTab("widgets"),
});
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
  ...sidebarHoverHandlers("sidebarWidgetItemShape", "widgets"),
  onLeftMouseUp: () => switchTab("widgets"),
});

ui.addShape({
  id: "sidebarGeneralItemShape",
  type: "rectangle",
  x: 10 * SCALE,
  y: 180 * SCALE + 55 * SCALE,
  width: SIDEBAR_WIDTH - 20 * SCALE,
  height: 45 * SCALE,
  strokeWidth: 0,
  radius: 8 * SCALE,
  fillColor: SIDEBAR_IDLE_FILL,
  ...sidebarHoverHandlers("sidebarGeneralItemShape", "general"),
  onLeftMouseUp: () => switchTab("general"),
});
ui.addImage({
  id: "sidebarGeneralItemImage",
  path: "assets/images/Settings/General.png",
  width: 24 * SCALE,
  height: 24 * SCALE,
  x: 20 * SCALE,
  y: 180 * SCALE + 55 * SCALE + 10.5 * SCALE,
  ...sidebarHoverHandlers("sidebarGeneralItemShape", "general"),
  onLeftMouseUp: () => switchTab("general"),
});
ui.addText({
  id: "sidebarGeneralItemText",
  text: "General",
  x: 54 * SCALE,
  y: 180 * SCALE + 55 * SCALE + 22.5 * SCALE,
  textAlign: "leftcenter",
  fontSize: 14 * SCALE,
  fontWeight: 600,
  fontFace: FONT_FACE,
  fontColor: getFontColor(),
  ...sidebarHoverHandlers("sidebarGeneralItemShape", "general"),
  onLeftMouseUp: () => switchTab("general"),
});

ui.addShape({
  id: "sidebarAboutItemShape",
  type: "rectangle",
  x: 10 * SCALE,
  y: 180 * SCALE + 55 * SCALE * 2,
  width: SIDEBAR_WIDTH - 20 * SCALE,
  height: 45 * SCALE,
  strokeWidth: 0,
  radius: 8 * SCALE,
  fillColor: SIDEBAR_IDLE_FILL,
  ...sidebarHoverHandlers("sidebarAboutItemShape", "about"),
  onLeftMouseUp: () => switchTab("about"),
});
ui.addImage({
  id: "sidebarAboutItemImage",
  path: "assets/images/Settings/About.png",
  width: 24 * SCALE,
  height: 24 * SCALE,
  x: 20 * SCALE,
  y: 180 * SCALE + 55 * SCALE * 2 + 10.5 * SCALE,
  ...sidebarHoverHandlers("sidebarAboutItemShape", "about"),
  onLeftMouseUp: () => switchTab("about"),
});
ui.addText({
  id: "sidebarAboutItemText",
  text: "About",
  x: 54 * SCALE,
  y: 180 * SCALE + 55 * SCALE * 2 + 22.5 * SCALE,
  textAlign: "leftcenter",
  fontSize: 14 * SCALE,
  fontWeight: 600,
  fontFace: FONT_FACE,
  fontColor: getFontColor(),
  ...sidebarHoverHandlers("sidebarAboutItemShape", "about"),
  onLeftMouseUp: () => switchTab("about"),
});

ui.addShape({
  id: "sidebarActiveIndicator",
  type: "rectangle",
  x: 12 * SCALE,
  y: 180 * SCALE + 14.5 * SCALE,
  width: 3 * SCALE,
  height: 16 * SCALE,
  radius: 1.5 * SCALE,
  strokeWidth: 0,
  fillColor: getAccentColor(),
});
ui.addText({
  id: "tabTitle",
  text: "Widgets Settings",
  x: SIDEBAR_WIDTH + 30 * SCALE,
  y: 50 * SCALE,
  textAlign: "leftcenter",
  fontSize: 24 * SCALE,
  fontWeight: 700,
  fontFace: FONT_FACE,
  fontColor: getFontColor(),
});
ui.addShape({
  id: "close",
  type: "rectangle",
  x: BG_WIDTH - 35 * SCALE,
  y: 10 * SCALE,
  width: 25 * SCALE,
  height: 25 * SCALE,
  strokeWidth: 0,
  radius: 25 * SCALE,
  fillColor: getCloseButtonFill(),
  onMouseOver: () => {
    ui.setElementProperty("close", "fillColor", getCloseButtonHoverFill());
    if (ui.isElementExist("closeText")) {
      ui.setElementProperty("closeText", "fontColor", "rgb(255, 255, 255)");
    }
  },
  onMouseLeave: () => {
    ui.setElementProperty("close", "fillColor", getCloseButtonFill());
    if (ui.isElementExist("closeText")) {
      ui.setElementProperty("closeText", "fontColor", getFontColor());
    }
  },
  onLeftMouseUp: () => ipcRenderer.send("closeSettings"),
});
ui.addText({
  id: "closeText",
  text: "×",
  x: BG_WIDTH - 22.5 * SCALE,
  y: 20.5 * SCALE,
  textAlign: "centercenter",
  fontSize: 16 * SCALE,
  fontWeight: 600,
  fontFace: FONT_FACE,
  fontColor: getFontColor(),
  onMouseOver: () => {
    ui.setElementProperty("close", "fillColor", getCloseButtonHoverFill());
    ui.setElementProperty("closeText", "fontColor", "rgb(255, 255, 255)");
  },
  onMouseLeave: () => {
    ui.setElementProperty("close", "fillColor", getCloseButtonFill());
    ui.setElementProperty("closeText", "fontColor", getFontColor());
  },
  onLeftMouseUp: () => ipcRenderer.send("closeSettings"),
});

updateSidebarSelection();
renderTabContent(true);
