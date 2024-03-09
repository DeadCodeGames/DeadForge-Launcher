const { app, BrowserWindow, shell, dialog, ipcMain, Menu, Tray, screen } = require('electron');
require('@electron/remote/main').initialize()
const windowStateKeeper = require('electron-window-state');
const DiscordRPC = require('discord-rpc');
const path = require('node:path');
const axios = require('axios');
const fs = require('fs');
const downloadsFolder = require('downloads-folder');
const isOnline = require('on-line');

let mainWindow, updateModal, quitConfirm, notificationWindow, updateStatus = (statusobject) => { mainWindow.webContents.send('updateStatus', statusobject); }, changeColorMode = (color) => { mainWindow.webContents.send('changeColorMode', color); }, preferences = { "colorScheme": "dark","discordRPC": true,"startup": false,"betaEnabled": true,"closeToTray": true }, tray, contextMenuHidden, contextMenuVisible, currentDownloads = [], onlineState, currentlydownloadedupdate, notificationQ = [], isNotificationShowing = false;
function askToQuit() {
  /*let questionString = 'There '; questionString += Object.keys(currentDownloads).length == 1 ? 'is ' : 'are currently '; questionString += Object.keys(currentDownloads).length; questionString += Object.keys(currentDownloads).length == 1 ? ' item being downloaded:\n' : ' downloads being downloaded:\n'; questionString += currentDownloads.map(item => { const key = Object.keys(item)[0]; const value = item[key]; return `${value.string} ${value.version}`; }).join('\n'); questionString += '\n\nAre you sure you want to quit?'
  dialog.showMessageBox({
    type: 'question',
    message: questionString,
    buttons: ['Yes', 'No']
  }).then((response) => { if (response.response == 0) { forceQuitAllowed = true; app.exit(); } })*/
  createQuitQuestion();
  quitConfirm.on('ready-to-show', () => { quitConfirm.webContents.send('askToQuit', currentDownloads); quitConfirm.show(); });
  ipcMain.on('quitConfirmation', (event, arg) => { if (arg == true) { forceQuitAllowed = true; app.exit(); } else { quitConfirm.destroy(); } });
};

const singleInstanceLock = app.requestSingleInstanceLock();
const createWindow = () => {
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
    contextisolation: false,
    nodeIntegration: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    }
  });

  contextMenuHidden = Menu.buildFromTemplate([
    { label: 'Show', click: () => { mainWindow.show(); tray.setContextMenu(contextMenuVisible); } },
    { label: 'Quit', click: () => app.quit() }
  ]);

  contextMenuVisible = Menu.buildFromTemplate([
    { label: 'Hide', click: () => { mainWindow.hide(); tray.setContextMenu(contextMenuHidden); } },
    { label: 'Quit', click: () => app.quit() }
  ]);

  mainWindowState.manage(mainWindow);

  require("@electron/remote/main").enable(mainWindow.webContents);

  mainWindow.setBackgroundMaterial("acrylic");
  mainWindow.setBackgroundColor("#161616");

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

const createUpdateModal = () => {
  updateModal = new BrowserWindow({
    width: 450,
    height: 300,
    resizable: false,
    closable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    contextisolation: false,
    nodeIntegration: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    },
    parent: mainWindow,
    modal: true,
    show: false
  });

  require("@electron/remote/main").enable(updateModal.webContents);

  updateModal.setBackgroundMaterial("acrylic");
  updateModal.setBackgroundColor("#161616");

  updateModal.loadFile('update.html');

  updateModal.on('close', (e) => { e.preventDefault(); });
}

const createQuitQuestion = () => {
  if (quitConfirm != undefined) { quitConfirm.destroy() }
  quitConfirm = new BrowserWindow({
    width: 450,
    height: 400,
    resizable: false,
    closable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    contextisolation: false,
    nodeIntegration: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    },
    parent: mainWindow,
    modal: true,
    show: false
  });

  require("@electron/remote/main").enable(quitConfirm.webContents);

  quitConfirm.setBackgroundMaterial("acrylic");
  quitConfirm.setBackgroundColor("#161616");

  quitConfirm.loadFile('askToQuit.html');

  quitConfirm.on('close', (e) => { e.preventDefault(); });
}

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // If a second instance is launched, focus the main window
    if (mainWindow) {
        if (mainWindow.isMinimized()) { mainWindow.restore(); }
        try { mainWindow.show(); } catch (err) { }; mainWindow.focus();
    }
});

app.whenReady().then(() => {
  createWindow()
  setTimeout(() => {
    fs.readFile(path.join(app.getPath('userData'), 'preferences.json'), 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading preferences file:', err);
          return;
      }

      mainWindow.webContents.send('preferences', data);
      preferences = JSON.parse(data);
      preferences.discordRPC ? connectRPC() : null;
      if (preferences.closeToTray == true) {
        tray = new Tray(process.platform == 'darwin' ? path.join(__dirname, 'res', 'DEADFORGE.icon.Template.png') : path.join(__dirname, 'res', 'DEADFORGE.icon.png'));
        tray.setContextMenu(contextMenuVisible);
      };
      let forceQuitAllowed = false;
      app.on('before-quit', (event) => {
        if (Object.keys(currentDownloads).length == 0 || forceQuitAllowed == true) {
          app.exit();
          if (currentlydownloadedupdate != undefined) {
            if (process.platform == "win32") { installerPathGoal = path.join(downloadsFolder(), 'update.exe'); }
            else if (process.platform == "darwin") { installerPathGoal = path.join(downloadsFolder(), 'update.dmg'); }
            else if (process.platform == "linux") { installerPathGoal = path.join(downloadsFolder(), 'update.deb'); }
            shell.openExternal(installerPathGoal);
          }}
        else { event.preventDefault(); askToQuit(); }
      })

      ipcMain.on('close', (event) => {
        if (!app.isQuiting && preferences.closeToTray == true) {
          event.preventDefault();
          mainWindow.hide(); 
          tray.setContextMenu(contextMenuHidden);
        } else {
          if (Object.keys(currentDownloads).length == 0 || forceQuitAllowed == true) { mainWindow.destroy(); }
          else { event.preventDefault(); askToQuit(); }
        }
      });

      mainWindow.on('close', (event) => {
        if (!app.isQuiting && preferences.closeToTray == true) {
          event.preventDefault();
          mainWindow.hide(); 
          tray.setContextMenu(contextMenuHidden);
        } else {
          if (Object.keys(currentDownloads).length == 0 || forceQuitAllowed == true) { mainWindow.destroy(); }
          else { event.preventDefault(); askToQuit(); }
        }
      });
  });
    checkUpdates();
    setInterval(checkUpdates, 10 * 60 * 1000);
  }, 2500)


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
  
}


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

  if (onlineState == false) return;

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
  var JS = await fetch("https://api.github.com/repos/DeadCodeGames/DeadForge/releases").then(response => response.json()).catch(err => { updateStatus({ "status": "fail", "current": version, "latest": undefined, "failType": "check" }); console.error(err) }), assets, downloadLinksByOS = {}, platform, latestversion, installerPath, installerPathGoal, updateIndex = 0, pendingBetaUpdates = 0;
  var betaEnabled = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'preferences.json'), 'utf8')).betaEnabled;
  if (!Array.isArray(JS)) { updateStatus({ "status": "fail", "current": version, "latest": undefined, "failType": "check" }); disableUpdateButton(false); return }

  for (updateIndex; updateIndex < JS.length; updateIndex++) {
    if (JS[updateIndex].tag_name == version) { break }
    if ((JS[updateIndex].prerelease == true && !betaEnabled)) { pendingBetaUpdates++; continue } else { break }
  }

  if (updateIndex == JS.length) { updateStatus({ "status": "uptodate", "current": version, "latest": latestversion, failType: null, betaEnabled: betaEnabled, pendingBetaUpdates: pendingBetaUpdates }); disableUpdateButton(false); return }
  
  assets = JS[updateIndex].assets;
  latestversion = JS[updateIndex].tag_name;

  if (latestversion == version) { updateStatus({ "status": "uptodate", "current": version, "latest": latestversion, failType: null, betaEnabled: betaEnabled, pendingBetaUpdates: pendingBetaUpdates }); disableUpdateButton(false); return }
  else if (latestversion == currentlydownloadedupdate) { updateStatus({ "status": "downloaded", "current": version, "latest": latestversion }); disableUpdateButton(false); return };

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
    /*const options = {
      type: 'question',
      buttons: ['Install Now', 'Install After Closing'],
      defaultId: 0,
      title: 'Update Available',
      message: 'An update is available. Would you like to install it now or after closing the application?',
      cancelId: 1
    };
  
    dialog.showMessageBox(null, options).then((result) => { if (result.response == 0) { app.quit(); shell.openExternal(installerPath); }});*/
    createUpdateModal(); updateModal.on('ready-to-show', () => { updateModal.webContents.send('updateVersion', latestversion); updateModal.show(); }); 
  }

  async function downloadUpdate() {
    var writer, updateDownloaded = '';
    if (currentlydownloadedupdate != undefined) { updateDownloaded = 'x'; }
    if (platform == "windows") { installerPath = path.join(downloadsFolder(), 'update' + updateDownloaded + '.exe'); writer = fs.createWriteStream(installerPath); }
    else if (platform == "mac") { installerPath = path.join(downloadsFolder(), 'update' + updateDownloaded + '.dmg'); writer = fs.createWriteStream(installerPath); }
    else if (platform == "linux") { installerPath = path.join(downloadsFolder(), 'update' + updateDownloaded + '.deb'); writer = fs.createWriteStream(installerPath); }

    if (platform == "windows") { installerPathGoal = path.join(downloadsFolder(), 'update.exe'); }
    else if (platform == "mac") { installerPathGoal = path.join(downloadsFolder(), 'update.dmg'); }
    else if (platform == "linux") { installerPathGoal = path.join(downloadsFolder(), 'update.deb'); }

    updateStatus({ "status": "downloading", "current": version, "latest": latestversion });
    currentDownloads.push({ "launcherUpdate": { "string": "DeadForge", "version": latestversion } });
    var downloadProgress = 0;

    createNotification({ "title": "Launcher Update", "message": "Downloading update " + latestversion });

    const response = await axios({
      url: downloadLinksByOS[platform],
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const totalLength = progressEvent.total;
        if (totalLength !== null) {
          downloadProgress = progressEvent.loaded / totalLength;
          try { mainWindow.webContents.send('launcherUpdateDownloadProgress', downloadProgress) } catch (err) { };
        }
      }
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', () => { reject; updateStatus({"status": "fail", "current": version, "latest": latestversion, "failType": "download"}); currentDownloads.splice(currentDownloads.findIndex(item => Object.keys(item)[0] === 'launcherUpdate'), 1); disableUpdateButton(false); });
    });
  }

  await downloadUpdate().then(() => { if (installerPathGoal != undefined) if (installerPath != installerPathGoal) { fs.renameSync(installerPath, installerPathGoal); }; ipcMain.on('update', (event, updateNow) => { console.log(updateNow); if (updateNow == true) { app.quit(); } else { updateModal.destroy(); } }); currentlydownloadedupdate = latestversion; currentDownloads.splice(currentDownloads.findIndex(item => Object.keys(item)[0] === 'launcherUpdate'), 1); disableUpdateButton(false); updateStatus({ 'status': 'downloaded', 'current': version, 'latest': latestversion }); showInstallDialog(); downloadProgress = 0; mainWindow.webContents.send('launcherUpdateDownloadProgress', downloadProgress);}).catch(err => { disableUpdateButton(false); updateStatus({"status": "fail", "current": version, "latest": latestversion, "failType": "download"}); console.error(err) });
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

    fs.writeFile(path.join(app.getPath('userData'), 'preferences.json'), jsonData, 'utf8', (err) => {
      if (err) {
        console.error('preferences', err);
        return;
      }
    });
  }

  ipcMain.on('update-check', (event) => {
    checkUpdates();
  })

  ipcMain.on('toggleTray', (event, trayPreference) => {
    preferences.closeToTray = trayPreference;
    if (trayPreference == false) { tray.destroy() } else { tray = tray = new Tray(process.platform == 'darwin' ? path.join(__dirname, 'res', 'DEADFORGE.icon.Template.png') : path.join(__dirname, 'res', 'DEADFORGE.icon.png')); tray.setContextMenu(contextMenuVisible) };
    writePreferences()
  })

  ipcMain.on('checkForConnection', (event) => {
    isOnline(function (error, online) { onlineState = online; mainWindow.webContents.send('connectionCheck', online) });
  })

const notificationCallbacks = {

  }

function createNotification(notificationData) {
  notificationQ.push(notificationData);

  if (isNotificationShowing) return;

  showNextNotification();
}

function showNextNotification() {
  if (notificationQ.length == 0) {
    isNotificationShowing = false;
    return;
  };

  const notificationData = notificationQ.shift();

  notificationWindow = new BrowserWindow({
    x: screen.getPrimaryDisplay().bounds.width - 375,
    y: 25,
    width: 350,
    height: 200,
    resizable: false,
    closable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    transparent: true,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    }
  });
  
  require("@electron/remote/main").enable(notificationWindow.webContents);

  notificationWindow.loadFile('notification.html');

  notificationWindow.webContents.on('did-finish-load', () => { 
    notificationWindow.webContents.send('notification', notificationData);
    notificationWindow.show();
  });

  ipcMain.on('notificationclose', (event, notificationCallback) => {
    notificationWindow.destroy();
    if (notificationCallbacks[notificationCallback] != undefined && notificationCallback != null) { notificationCallbacks[notificationCallback](); }
    showNextNotification();
  })
}