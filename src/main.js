'use strict';

const electron = require('electron');
const globalShortcut = require('global-shortcut');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

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

    setTimeout(function () {
        var bounds = mainWindow.getBounds(),
            width = initWindowSize.width,
            height = initWindowSize.height;
        mainWindow.setBounds({
            x: bounds.x - width / 2,
            y: bounds.y - height / 2,
            width: width,
            height: height
        });
    }, 200);

    // 注册快捷键
    globalShortcut.register('ctrl+alt+b', function () {
        mainWindow.webContents.send('global-shortcut', 'ctrl+alt+b');
    });
    globalShortcut.register('ctrl+alt+u', function () {
        mainWindow.webContents.send('global-shortcut', 'ctrl+alt+u');
    });
    globalShortcut.register('ctrl+alt+r', function () {
        mainWindow.webContents.send('global-shortcut', 'ctrl+alt+r');
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

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
