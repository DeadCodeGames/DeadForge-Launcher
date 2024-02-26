const { app, BrowserWindow, shell } = require('electron');
require('@electron/remote/main').initialize()
const DiscordRPC = require('discord-rpc');
const path = require('node:path');
const fs = require('fs');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 400,
    minHeight: 300,
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
    // Open the link in the user's default web browser
    shell.openExternal(url);
    return { action: 'deny' }; // Prevent opening a new window in Electron
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

var version, clientID = "1211721853324890143", rpc = new DiscordRPC.Client({ transport: 'ipc' }), startTime = new Date();
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

/*function setRPC() {
  console.log("setting activity");
  rpc.setActivity({
    details: `running version v0.0.0-RPC`,
    startTimestamp: startTime,
    largeImageKey: 'deadcodelogo',
    largeImageText: 'made by deadcode',
  });
}

rpc.on('ready', () => {
  setRPC();
});

rpc.login({ clientID }).catch(console.error);*/



async function setActivity() {
  if (!rpc || !mainWindow) {
    return;
  }

  // You'll need to have snek_large and snek_small assets uploaded to
  // https://discord.com/developers/applications/<application_id>/rich-presence/assets
  rpc.setActivity({
    details: `the launcher by deadcode.`,
    state: `running version ${version}.`,
    startTimestamp: startTime,
    largeImageKey: 'deadcodelogo',
    largeImageText: 'made by deadcode',
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity();

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login({ clientId: clientID }).catch(console.error);