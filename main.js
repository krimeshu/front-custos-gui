'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
const globalShortcut = electron.globalShortcut;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const initWindowSize = {
    width: 1280,
    height: 720
};

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 2,
        height: 2,
        autoHideMenuBar: true,
        useContentSize: true,
        hasShadow: false,
        transparent: true,
        frame: false
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    var bounds = mainWindow.getBounds(),
        width = initWindowSize.width,
        height = initWindowSize.height;

    mainWindow.setBounds({
        x: bounds.x - width / 2,
        y: bounds.y - height / 2,
        width: width,
        height: height
    });

    // 注册快捷键
    [
        'CmdOrCtrl+Alt+b',
        'CmdOrCtrl+Alt+u',
        'CmdOrCtrl+Alt+r'
    ].forEach((key) => {
        globalShortcut.register(key, function () {
            var pageKey = key.toLowerCase().replace(/CmdOrCtrl/gi, 'ctrl');
            mainWindow.webContents.send('global-shortcut', pageKey);
        });
    });
    globalShortcut.register('CmdOrCtrl+Alt+d', function () {
        mainWindow.webContents.openDevTools();
    });
}

// 设置应用菜单（修复 Mac OS 内常用编辑快捷键）
function setAppMenu() {
    var template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { label: "DevTools", selector: "CmdOrCtrl+Alt+D", click: () => mainWindow.webContents.openDevTools() },
            { type: "separator" },
            { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => app.quit() }
        ]
    }, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]
    }];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
    createWindow();
    setAppMenu();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
