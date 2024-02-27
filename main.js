const { app, BrowserWindow, shell } = require('electron');
require('@electron/remote/main').initialize()
const DiscordRPC = require('discord-rpc');
const path = require('node:path');
const fs = require('fs');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 500,
    minHeight: 350,
    height: 600,
    width: 800,
    frame: false,
    contextisolation: true,
    nodeIntegration: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  require("@electron/remote/main").enable(mainWindow.webContents);

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

var version, clientID = "1211721853324890143", rpc = null, startTime = new Date();
fs.readFile(path.join(__dirname, 'package.json'), 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const JSONData = JSON.parse(data)
  // handle the json data here
  console.log(JSONData.version);
  version =  JSONData.version;
});


async function setActivity() {
  if (!rpc || !mainWindow) {
    return;
  }
  rpc.setActivity({
    details: `the launcher by deadcode.`,
    state: `running version ${version}.`,
    startTimestamp: startTime,
    largeImageKey: 'deadcodelogo',
    largeImageText: 'made by deadcode',
    instance: false,
  });
}




function connectRPC() {
  if (rpc) {
    rpc.destroy();
  }

  rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    setActivity();
  });

  rpc.login({ clientId: clientID }).catch(err => {
    console.error('Failed to connect to Discord:', err);
    setTimeout(connectRPC, 5 * 1000); // Retry connection after 15 seconds
  });
}

connectRPC()