var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;

var ROUND_LINE_SHAPE_WIDTH = 50 * SCALE;
var ROUND_LINE_SHAPE_HEIGHT = 50 * SCALE;
var ROUND_LINE_SHAPE_RADIUS = 25 * SCALE;
var ROUND_LINE_SHAPE_THICKNESS = 5 * SCALE;

var ICON_SIZE = 20 * SCALE;
var ICON_OFFSET_X = (ROUND_LINE_SHAPE_WIDTH - ICON_SIZE) / 2;
var ICON_OFFSET_Y = (ROUND_LINE_SHAPE_HEIGHT - ICON_SIZE) / 2;

var ICONS_PATH = "assets/icons/";

var MAX_DISK_SPEED = 1000000000; // 1 GB/s in bytes
var MAX_NETWORK_SPEED = 1000000000; // 1 Gbps in bytes

//============================================================================
// Functions to get colors based on the theme   
//============================================================================
function getBackgroundColor() {
    if (JSON_DATA.APPEARANCE.THEME == "dark") {
        return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.BACKGROUND_COLOR
    }
    else {
        return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.BACKGROUND_COLOR
    }
}

function getSubtleColor() {
    if (JSON_DATA.APPEARANCE.THEME == "dark") {
        return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.SUBTLE_COLOR
    }
    else {
        return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.SUBTLE_COLOR
    }
}

function getIconColor() {
    if (JSON_DATA.APPEARANCE.THEME == "dark") {
        return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.ICON_COLOR
    }
    else {
        return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.ICON_COLOR
    }
}

function getTextColor() {
    if (JSON_DATA.APPEARANCE.THEME == "dark") {
        return JSON_DATA.APPEARANCE.THEME_DARK_CONFIG.FONT_COLOR
    }
    else {
        return JSON_DATA.APPEARANCE.THEME_LIGHT_CONFIG.FONT_COLOR
    }
}

function wideStyle() {

    var BACKGROUND_WIDTH = 350 * SCALE;
    var BACKGROUND_HEIGHT = 160 * SCALE;

    var RING_SPACING = 22 * SCALE;
    var TOTAL_WIDTH = (ROUND_LINE_SHAPE_WIDTH * 4) + (RING_SPACING * 3);
    var START_X = (BACKGROUND_WIDTH - TOTAL_WIDTH) / 2;
    var CENTER_Y = (BACKGROUND_HEIGHT - ROUND_LINE_SHAPE_HEIGHT) / 3;

    let ROUND_LINE_ELEMENT_STYLE = {
        y: CENTER_Y,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        radius: ROUND_LINE_SHAPE_RADIUS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    }

    ui.beginUpdate();

    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: BACKGROUND_WIDTH,
        height: BACKGROUND_HEIGHT,
        strokeWidth: 0,
        fillColor: getBackgroundColor()
    });

    ui.addRoundLine({
        id: "cpu-ring",
        x: START_X,
        ...ROUND_LINE_ELEMENT_STYLE
    });
    ui.addImage({
        id: "cpu-ring-icon",
        x: START_X + ICON_OFFSET_X,
        y: CENTER_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "cpu.png",
        imageTint: getIconColor()
    });
    ui.addText({
        id: "cpu-ring-text",
        x: START_X + ROUND_LINE_SHAPE_WIDTH / 2,
        y: CENTER_Y + ROUND_LINE_SHAPE_HEIGHT + 12 * SCALE,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: 20 * SCALE,
        text: "0%",
        fontSize: 20 * SCALE,
        fontColor: getTextColor(),
        textAlign: "center",
        fontFace: "Segoe UI"
    });

    ui.addRoundLine({
        id: "memory-ring",
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING,
        ...ROUND_LINE_ELEMENT_STYLE
    });
    ui.addImage({
        id: "memory-ring-icon",
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ICON_OFFSET_X,
        y: CENTER_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "memory.png",
        imageTint: getIconColor()
    });
    ui.addText({
        id: "memory-ring-text",
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ROUND_LINE_SHAPE_WIDTH / 2,
        y: CENTER_Y + ROUND_LINE_SHAPE_HEIGHT + 12 * SCALE,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: 20 * SCALE,
        text: "0%",
        fontSize: 20 * SCALE,
        fontColor: getTextColor(),
        textAlign: "center",
        fontFace: "Segoe UI"
    });

    ui.addRoundLine({
        id: "disk-ring",
        x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2,
        ...ROUND_LINE_ELEMENT_STYLE
    });
    ui.addImage({
        id: "disk-ring-icon",
        x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2 + ICON_OFFSET_X,
        y: CENTER_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "disk.png",
        imageTint: getIconColor()
    });
    ui.addText({
        id: "disk-ring-text",
        x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2 + ROUND_LINE_SHAPE_WIDTH / 2,
        y: CENTER_Y + ROUND_LINE_SHAPE_HEIGHT + 12 * SCALE,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: 20 * SCALE,
        text: "0%",
        fontSize: 20 * SCALE,
        fontColor: getTextColor(),
        textAlign: "center",
        fontFace: "Segoe UI"
    });

    // Network Ring with text
    ui.addRoundLine({
        id: "net-ring",
        x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3,
        ...ROUND_LINE_ELEMENT_STYLE
    });
    ui.addImage({
        id: "net-ring-icon",
        x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3 + ICON_OFFSET_X,
        y: CENTER_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "network.png",
        imageTint: getIconColor()
    });
    ui.addText({
        id: "net-ring-text",
        x: START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3 + ROUND_LINE_SHAPE_WIDTH / 2,
        y: CENTER_Y + ROUND_LINE_SHAPE_HEIGHT + 12 * SCALE,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: 20 * SCALE,
        text: "0%",
        fontSize: 20 * SCALE,
        fontColor: getTextColor(),
        textAlign: "center",
        fontFace: "Segoe UI"
    });

    ui.endUpdate();
}

function mediumStyle() {

    var BACKGROUND_WIDTH = 160 * SCALE;
    var BACKGROUND_HEIGHT = 160 * SCALE;

    var RING_SPACING = 15 * SCALE;
    var TOTAL_WIDTH = (ROUND_LINE_SHAPE_WIDTH * 2) + RING_SPACING;
    var START_X = (BACKGROUND_WIDTH - TOTAL_WIDTH) / 2;

    var TOTAL_HEIGHT = (ROUND_LINE_SHAPE_HEIGHT * 2) + RING_SPACING;
    var START_Y = (BACKGROUND_HEIGHT - TOTAL_HEIGHT) / 2;

    ui.beginUpdate();

    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: BACKGROUND_WIDTH,
        height: BACKGROUND_HEIGHT,
        strokeWidth: 0,
        fillColor: getBackgroundColor()
    });

    // Row 1: CPU and Memory
    ui.addRoundLine({
        id: "cpu-ring",
        radius: ROUND_LINE_SHAPE_RADIUS,
        x: START_X,
        y: START_Y,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    });
    ui.addImage({
        id: "cpu-ring-icon",
        x: START_X + ICON_OFFSET_X,
        y: START_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "cpu.png",
        imageTint: getIconColor()
    });

    ui.addRoundLine({
        id: "memory-ring",
        radius: ROUND_LINE_SHAPE_RADIUS,
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING,
        y: START_Y,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    });
    ui.addImage({
        id: "memory-ring-icon",
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ICON_OFFSET_X,
        y: START_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "memory.png",
        imageTint: getIconColor()
    });

    // Row 2: Disk and Network
    ui.addRoundLine({
        id: "disk-ring",
        radius: ROUND_LINE_SHAPE_RADIUS,
        x: START_X,
        y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    });
    ui.addImage({
        id: "disk-ring-icon",
        x: START_X + ICON_OFFSET_X,
        y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "disk.png",
        imageTint: getIconColor()
    });

    ui.addRoundLine({
        id: "net-ring",
        radius: ROUND_LINE_SHAPE_RADIUS,
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING,
        y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    });
    ui.addImage({
        id: "net-ring-icon",
        x: START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING + ICON_OFFSET_X,
        y: START_Y + ROUND_LINE_SHAPE_HEIGHT + RING_SPACING + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "network.png",
        imageTint: getIconColor()
    });

    ui.endUpdate();
}

function smallStyle() {

    var BACKGROUND_WIDTH = 75 * SCALE;
    var BACKGROUND_HEIGHT = 75 * SCALE;

    var CENTER_X = (BACKGROUND_WIDTH - ROUND_LINE_SHAPE_WIDTH) / 2;
    var CENTER_Y = (BACKGROUND_HEIGHT - ROUND_LINE_SHAPE_HEIGHT) / 2;

    ui.beginUpdate();

    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: BACKGROUND_WIDTH,
        height: BACKGROUND_HEIGHT,
        strokeWidth: 0,
        fillColor: getBackgroundColor()
    });

    ui.addRoundLine({
        id: "cpu-ring",
        radius: ROUND_LINE_SHAPE_RADIUS,
        x: CENTER_X,
        y: CENTER_Y,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    });
    ui.addImage({
        id: "cpu-ring-icon",
        x: CENTER_X + ICON_OFFSET_X,
        y: CENTER_Y + ICON_OFFSET_Y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        path: ICONS_PATH + "cpu.png",
        imageTint: getIconColor()
    });

    ui.endUpdate();
}

// Choose which style to use: wideStyle(), mediumStyle(), or smallStyle()
mediumStyle()

function getLevelColor(PERCENT) {
    if (PERCENT >= 0 && PERCENT < 70) {
        return JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR;
    } else if (PERCENT >= 70 && PERCENT < 90) {
        return JSON_DATA.APPEARANCE.MEDIUM_LEVEL_COLOR;
    } else {
        return JSON_DATA.APPEARANCE.HIGH_LEVEL_COLOR;
    }
}

function updateRingContent(RING_ID, PERCENT) {
    if (ui.isElementExist(RING_ID)) {
        ui.setElementProperty(RING_ID, "value", PERCENT / 100);
        ui.setElementProperty(RING_ID, "lineColor", getLevelColor(PERCENT));

        // Update the percentage text
        var TEXT_ID = RING_ID + "-text";
        if (ui.isElementExist(TEXT_ID)) {
            ui.setElementProperty(TEXT_ID, "text", Math.round(PERCENT) + "%");
        }
    }
}

function calculatePercent(VALUE, MAX_VALUE) {
    var PERCENT = (VALUE / MAX_VALUE) * 100;
    return Math.min(Math.max(PERCENT, 0), 100); // Clamp between 0-100
}

ipcRenderer.on("monitor-window-stats", (event, data) => {
    CPU_USAGE = data.cpu;
    MEMORY_USAGE = data.memory;
    DISK_USAGE = data.disk;
    NETWORK_USAGE = data.network;

    ui.beginUpdate();
    // CPU and Memory are already percentages (0-100)
    updateRingContent("cpu-ring", CPU_USAGE);
    updateRingContent("memory-ring", MEMORY_USAGE);

    // Disk and Network are speeds in bytes/sec, convert to percentage
    var DISK_PERCENT = calculatePercent(DISK_USAGE, MAX_DISK_SPEED);
    var NETWORK_PERCENT = calculatePercent(NETWORK_USAGE, MAX_NETWORK_SPEED);
    updateRingContent("disk-ring", DISK_PERCENT);
    updateRingContent("net-ring", NETWORK_PERCENT);
    ui.endUpdate();
});
