const { app, BrowserWindow, shell, dialog } = require('electron');
require('@electron/remote/main').initialize()
const DiscordRPC = require('discord-rpc');
const path = require('node:path');
const axios = require('axios');
const fs = require('fs');;

let mainWindow, updateStatus = (status) => {
  mainWindow.webContents.send('updateStatus', status);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 500,
    minHeight: 350,
    height: 600,
    width: 800,
    frame: false,
    contextisolation: false,
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
  createWindow()
  setTimeout(() => {
    checkUpdates()
    setInterval(checkUpdates, 10 * 60 * 1000);
  }, 1000)


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

console.log(BrowserWindow.getAllWindows())

var version, clientID = "1211721853324890143", rpc = null, startTime = new Date();
fs.readFile(path.join(__dirname, 'package.json'), 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const JSONData = JSON.parse(data)
  // handle the json data here
  console.log(JSONData.version);
  version = JSONData.version;
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

async function checkUpdates() {
  updateStatus('checking');
  var JS = await fetch("https://api.github.com/repos/DeadCodeGames/DeadForge/releases").then(response => response.json()).catch(err => { updateStatus('fail'); console.error(err) }), assets, downloadLinksByOS = {}, platform, latestversion, installerPath;

  assets = JS[0].assets;
  latestversion = JS[0].tag_name;

  if (latestversion == version) {updateStatus('uptodate'); return};

  assets.forEach(asset => {
    const fileName = asset.name.toLowerCase();
    if (fileName.endsWith('.exe')) {
      downloadLinksByOS['windows'] = asset.browser_download_url;
    } else if (fileName.endsWith('.dmg')) {
      downloadLinksByOS['mac'] = asset.browser_download_url;
    } else if (fileName.endsWith('.deb')) {
      downloadLinksByOS['linux'] = asset.browser_download_url;
    }
  });
  platform = process.platform;
  if (platform.includes('win')) {
    platform = "windows";
  } else if (platform.includes('darwin')) {
    platform = "mac";
  } else if (platform.includes('linux')) {
    platform = "linux";
  };

  async function showInstallDialog(callback) {
    const options = {
      type: 'question',
      buttons: ['Install Now', 'Install After Closing'],
      defaultId: 0,
      title: 'Update Available',
      message: 'An update is available. Would you like to install it now or after closing the application?',
      cancelId: 1
    };
  
    dialog.showMessageBox(null, options).then((result) => { if (result.response == 0) { app.quit(); shell.openExternal(installerPath); } else { app.on('before-quit', () => { app.quit(); shell.openExternal(installerPath);});}});
  }

  async function downloadUpdate() {
    var writer;
    if (platform == "windows") { installerPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'update.exe'); writer = fs.createWriteStream(installerPath); }
    else if (platform == "mac") { installerPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'update.dmg'); writer = fs.createWriteStream(installerPath); }
    else if (platform == "linux") { installerPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'update.deb'); writer = fs.createWriteStream(installerPath); }

    console.log(installerPath);
    updateStatus('downloading');
  
    const response = await axios({
      url: downloadLinksByOS[platform],
      method: 'GET',
      responseType: 'stream',
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', () => { reject;  updateStatus('fail');});
    });
  }

  await downloadUpdate().then(() => {updateStatus('downloaded'); showInstallDialog()}).catch(err => { updateStatus('fail'); console.error(err) });
}