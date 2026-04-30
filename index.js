import { widgetWindow, addon, app } from "novadesk";
import * as fs from "fs";
import { json, cpu, memory, network, disk } from "system";


var JSON_DATA = {};
var JSON_FILE_PATH = path.join(app.getAppDataPath(), "FluentWidgets", "config.json");

var MONITOR_WINDOW = null;
var MONITOR_WINDOW_TIMER = null;

const bb_Addon = addon.load(path.join(__addonsPath, "BlurBehind"));

function parseJSON() {
    if (!fs.exists(JSON_FILE_PATH)) {
        fs.mkdir(path.join(app.getAppDataPath(), "FluentWidgets"))
        fs.copyFile(path.join(__dirname, "config/config.json"), JSON_FILE_PATH);
        JSON_DATA = json.read(JSON_FILE_PATH);
    }
    else {
        fs.copyFile(path.join(__dirname, "config/config.json"), JSON_FILE_PATH, true);
        JSON_DATA = json.read(JSON_FILE_PATH);
    }
}

parseJSON();

ipcMain.handle("getJSON", () => {
    return JSON_DATA;
});

function applyBB(hwnd) {
    bb_Addon.apply(hwnd, JSON_DATA.BB_STYLE.BLUR_TYPE, JSON_DATA.BB_STYLE.ROUND_TYPE);
}

function monitorWindowStats() {
    const CPU_USAGE = cpu.usage();
    const MEMORY_USAGE = memory.usagePercent();
    const DISK_USAGE = disk.writeSpeed();
    const NETWORK_USAGE = network.rxSpeed();

    ipcMain.send("monitor-window-stats", { 
        cpu: CPU_USAGE, 
        memory: MEMORY_USAGE, 
        disk: DISK_USAGE, 
        network: NETWORK_USAGE
    });
}

function loadMonitorWindow() {
    MONITOR_WINDOW = new widgetWindow({
        id: "MONITOR_WINDOW",
        script: "ui/monitorWindow.ui.js",
        show: false,
    });
    applyBB(String(MONITOR_WINDOW.getHandle()));
    MONITOR_WINDOW.show();
    MONITOR_WINDOW_TIMER = setInterval(monitorWindowStats, 1000)

}

loadMonitorWindow();