const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
require('@electron/remote/main').initialize()
const DiscordRPC = require('discord-rpc');
const path = require('node:path');
const axios = require('axios');
const fs = require('fs');
const downloadsFolder = require('downloads-folder');

let mainWindow, updateStatus = (statusobject) => { mainWindow.webContents.send('updateStatus', statusobject); }, changeColorMode = (color) => { mainWindow.webContents.send('changeColorMode', color); }, preferences;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 555,
    minHeight: 350,
    height: 600,
    width: 800,
    frame: false,
    contextisolation: false,
    nodeIntegration: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    }
  });


  require("@electron/remote/main").enable(mainWindow.webContents);

  mainWindow.setBackgroundMaterial("acrylic");
  mainWindow.setBackgroundColor("#161616");

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}
app.whenReady().then(() => {
  createWindow()
  setTimeout(() => {
    if (fs.existsSync(path.join(downloadsFolder(), 'deadforge.preferences.json'))) {
      const preferencesBackupData = fs.readFileSync(path.join(downloadsFolder(), 'deadforge.preferences.json'), 'utf8');
      const preferencesBackup = JSON.parse(preferencesBackupData);

      const requiredKeys = ['colorScheme', 'discordRPC', 'startup', 'betaEnabled'];
      const missingKeys = requiredKeys.filter(key => !(key in preferencesBackup));

      if (missingKeys.length === 0) {
        fs.renameSync(path.join(downloadsFolder(), 'deadforge.preferences.json'), path.join(path.join(path.dirname(__dirname), 'app.asar.unpacked'), 'preferences.json'));
      }
    }
    fs.readFile(path.join(__dirname, 'preferences.json'), 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading preferences file:', err);
          return;
      }

      mainWindow.webContents.send('preferences', data);
      preferences = JSON.parse(data);
      JSON.parse(data).discordRPC ? connectRPC() : null;
  });
    checkUpdates()
    setInterval(checkUpdates, 10 * 60 * 1000);
  }, 2500)


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
    setTimeout(connectRPC, 5 * 1000);
  });
}

function disableUpdateButton(status) {
  mainWindow.webContents.send('disableUpdateButton', status);
}

async function checkUpdates() {
  disableUpdateButton(true);
  updateStatus({"status": "checking", "current": version});
  var JS = await fetch("https://api.github.com/repos/DeadCodeGames/DeadForge/releases").then(response => response.json()).catch(err => { updateStatus({ "status": "fail", "current": version, "latest": undefined, "failType": "check" }); console.error(err) }), assets, downloadLinksByOS = {}, platform, latestversion, installerPath, currentlydownloadedupdate, updateIndex = 0, pendingBetaUpdates = 0;
  var betaEnabled = JSON.parse(fs.readFileSync(path.join(__dirname, 'preferences.json'), 'utf8')).betaEnabled;
  if (!Array.isArray(JS)) { updateStatus({ "status": "fail", "current": version, "latest": undefined, "failType": "check" }); disableUpdateButton(false); return }

  for (updateIndex; updateIndex < JS.length; updateIndex++) {
    if (JS[updateIndex].tag_name == version) { break }
    if ((JS[updateIndex].prerelease == true && !betaEnabled)) { pendingBetaUpdates++; continue } else { break }
  }

  if (updateIndex == JS.length) { updateStatus({ "status": "uptodate", "current": version, "latest": latestversion, failType: null, betaEnabled: betaEnabled, pendingBetaUpdates: pendingBetaUpdates }); disableUpdateButton(false); return }
  
  assets = JS[updateIndex].assets;
  latestversion = JS[updateIndex].tag_name;

  if (latestversion == version) { updateStatus({ "status": "uptodate", "current": version, "latest": latestversion, failType: null, betaEnabled: betaEnabled, pendingBetaUpdates: pendingBetaUpdates }); disableUpdateButton(false); return }
  else if (latestversion == currentlydownloadedupdate) { updateStatus({ "status": "downloaded", "current": version, "latest": latestversion }); return };

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
  
    dialog.showMessageBox(null, options).then((result) => { if (result.response == 0) { app.quit(); shell.openExternal(installerPath); }});
  }

  async function downloadUpdate() {
    var writer;
    if (platform == "windows") { installerPath = path.join(downloadsFolder(), 'update.exe'); writer = fs.createWriteStream(installerPath); }
    else if (platform == "mac") { installerPath = path.join(downloadsFolder(), 'update.dmg'); writer = fs.createWriteStream(installerPath); }
    else if (platform == "linux") { installerPath = path.join(downloadsFolder(), 'update.deb'); writer = fs.createWriteStream(installerPath); }

    updateStatus({"status": "downloading", "current": version, "latest": latestversion});
  
    const response = await axios({
      url: downloadLinksByOS[platform],
      method: 'GET',
      responseType: 'stream',
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', () => { reject; updateStatus({"status": "fail", "current": version, "latest": latestversion, "failType": "download"}); });
    });
  }

  await downloadUpdate().then(() => { disableUpdateButton(false); updateStatus({ 'status': 'downloaded', 'current': version, 'latest': latestversion }); { app.on('before-quit', () => { fs.renameSync(path.join(path.join(path.dirname(__dirname), 'app.asar.unpacked'), 'preferences.json'), path.join(downloadsFolder(), 'deadforge.preferences.json')); shell.openExternal(installerPath); }); };  showInstallDialog()}).catch(err => { disableUpdateButton(false); updateStatus({"status": "fail", "current": version, "latest": latestversion, "failType": "download"}); console.error(err) });
}

  ipcMain.on('color-preference', (event, colorPreference) => {
    preferences.colorScheme = colorPreference;
    writePreferences()
  });

  ipcMain.on('toggleDiscordRichPresence', (event, discordPreference) => {
    preferences.discordRPC = discordPreference;
    discordPreference == false ? rpc.destroy() : connectRPC();
    writePreferences()
  });

  ipcMain.on('toggleRunOnStartup', (event, startupPreference) => {
    if (process.platform == 'linux') return;
    preferences.startup = startupPreference;
    startupPreference == false ? app.setLoginItemSettings({ openAtLogin: false }) : app.setLoginItemSettings({ openAtLogin: true });
    writePreferences()
  });

  ipcMain.on('toggleBeta', (event, betaPreference) => {
    preferences.betaEnabled = betaPreference;
    if (betaPreference == true) {
      checkUpdates();
    }
    writePreferences()
  })

  function writePreferences() {
    const jsonData = JSON.stringify(preferences, null, 2);

    fs.writeFile(path.join(__dirname, 'preferences.json'), jsonData, 'utf8', (err) => {
      if (err) {
        console.error('preferences', err);
        return;
      }
    });
  }

  ipcMain.on('update-check', (event) => {
    checkUpdates();
  })