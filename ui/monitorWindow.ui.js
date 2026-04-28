var JSON_DATA = ipcRenderer.invoke("getJSON");
var SCALE = JSON_DATA.SCALE;

var BACKGROUND_WIDTH = 350 * SCALE;
var BACKGROUND_HEIGHT = 160 * SCALE;

var ROUND_LINE_SHAPE_WIDTH = 60 * SCALE;
var ROUND_LINE_SHAPE_HEIGHT = 60 * SCALE;
var ROUND_LINE_SHAPE_RADIUS = 30 * SCALE;
var ROUND_LINE_SHAPE_THICKNESS = 6 * SCALE;

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

function addRoundLine(ID_PARAM, X_PARAM, Y_PARAM) {
    ui.addRoundLine({
        id: ID_PARAM,
        radius: ROUND_LINE_SHAPE_RADIUS,
        x: X_PARAM,
        y: Y_PARAM,
        thickness: ROUND_LINE_SHAPE_THICKNESS,
        value: 0,
        width: ROUND_LINE_SHAPE_WIDTH,
        height: ROUND_LINE_SHAPE_HEIGHT,
        lineColor: JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR,
        lineColorBg: getSubtleColor(),
        capType: "round"
    });
}

function wideStyle() {
    ui.beginUpdate();
    ui.addShape({
        id: "background_Shape",
        type: "rectangle",
        width: BACKGROUND_WIDTH,
        height: BACKGROUND_HEIGHT,
        strokeWidth: 0,
        fillColor: getBackgroundColor()
    });

    var RING_SPACING = 22 * SCALE;
    var TOTAL_WIDTH = (ROUND_LINE_SHAPE_WIDTH * 4) + (RING_SPACING * 3);
    var START_X = (BACKGROUND_WIDTH - TOTAL_WIDTH) / 2;
    var CENTER_Y = (BACKGROUND_HEIGHT - ROUND_LINE_SHAPE_HEIGHT) / 3;

    addRoundLine("cpu-ring", START_X, CENTER_Y);
    addRoundLine("memory-ring", START_X + ROUND_LINE_SHAPE_WIDTH + RING_SPACING, CENTER_Y);
    addRoundLine("disk-ring", START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 2, CENTER_Y);
    addRoundLine("net-ring", START_X + (ROUND_LINE_SHAPE_WIDTH + RING_SPACING) * 3, CENTER_Y);
    ui.endUpdate();
}


wideStyle()

// Maximum values for converting speeds to percentages
var MAX_DISK_SPEED = 1000000000; // 1 GB/s in bytes
var MAX_NETWORK_SPEED = 1000000000; // 1 Gbps in bytes

function getLevelColor(PERCENT) {
    if (PERCENT >= 0 && PERCENT < 70) {
        return JSON_DATA.APPEARANCE.LOW_LEVEL_COLOR;
    } else if (PERCENT >= 70 && PERCENT < 90) {
        return JSON_DATA.APPEARANCE.MEDIUM_LEVEL_COLOR;
    } else {
        return JSON_DATA.APPEARANCE.HIGH_LEVEL_COLOR;
    }
}

function updateRingColor(RING_ID, PERCENT) {
    if (ui.isElementExist(RING_ID)) {
        ui.setElementProperty(RING_ID, "value", PERCENT / 100);
        ui.setElementProperty(RING_ID, "lineColor", getLevelColor(PERCENT));
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
    updateRingColor("cpu-ring", CPU_USAGE);
    updateRingColor("memory-ring", MEMORY_USAGE);
    
    // Disk and Network are speeds in bytes/sec, convert to percentage
    var DISK_PERCENT = calculatePercent(DISK_USAGE, MAX_DISK_SPEED);
    var NETWORK_PERCENT = calculatePercent(NETWORK_USAGE, MAX_NETWORK_SPEED);
    updateRingColor("disk-ring", DISK_PERCENT);
    updateRingColor("net-ring", NETWORK_PERCENT);
    ui.endUpdate();
});
