const { app, BrowserWindow, ipcMain } = require("electron")
require("@electron/remote/main").initialize()
const windowStateKeeper = require('electron-window-state');

const path = require("path")

let mainWindow;

const singleInstanceLock = app.requestSingleInstanceLock();

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultHeight: 600,
        defaultWidth: 800,
        maximize: true
    })

    mainWindow = new BrowserWindow({
        minWidth: 555,
        minHeight: 350,
        height: mainWindowState.height,
        width: mainWindowState.width,
        frame: false,
        fullscreen: false,
        contextIsolation: false,
        nodeIntegration: true,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            devtools: app.isPackaged ? false : true
        }
    });

    mainWindow.loadURL(app.isPackaged ? `file://${path.join(__dirname, "../build/index.html")}` : "http://localhost:3000");

    ipcMain.on('window-control', (event, action) => {
        // eslint-disable-next-line default-case
        switch (action) {
          case 'minimize':
            mainWindow.minimize();
            break;
          case 'maximize':
            if (mainWindow.isMaximized()) {
              mainWindow.unmaximize();
            } else {
              mainWindow.maximize();
            }
            break;
          case 'close':
            mainWindow.close();
            break;
        }
    });
    
    ipcMain.handle('is-window-maximized', () => {
        return mainWindow.isMaximized();
    });
}

app.on("ready", createWindow)