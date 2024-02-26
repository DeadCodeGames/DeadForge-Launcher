const { app, BrowserWindow, shell } = require('electron');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    minWidth: 400,
    minHeight: 300,
    height: 600,
    width: 800,
    frame: false,
    contextisolation: true,
    nodeIntegration: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#161616',
      symbolColor: '#F0F0F0',
      height: 40
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open the link in the user's default web browser
    shell.openExternal(url);
    return { action: 'deny' }; // Prevent opening a new window in Electron
  });
}
app.whenReady().then(() => {-7
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
