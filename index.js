const { BrowserWindow } = require('@electron/remote');
const { ipcRenderer } = require('electron');

const minimizeBtn = document.querySelector("div#window>div#controls>div#minimize");
const maximizeBtn = document.querySelector("div#window>div#controls>div#maximize");
const closeBtn = document.querySelector("div#window>div#controls>div#close");

minimizeBtn.addEventListener('click', () => {
    const window = BrowserWindow.getFocusedWindow();
    window.minimize();
});

maximizeBtn.addEventListener('click', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window.isMaximized()) {
    window.restore();
  } else {
    window.maximize();
  }
});

closeBtn.addEventListener('click', () => {
  const window = BrowserWindow.getFocusedWindow();
  window.close();
});

ipcRenderer.on('updateStatus', (event, statusobject) => {
  const { status, current, latest, failType, betaEnabled, pendingBetaUpdates } = statusobject;
  const statusElement = document.querySelector('div#updatestatus');
  const settingsStatusElement = document.querySelector('section#settings div#updatestatusSETTINGS');
  const statusString = document.querySelector('div#updatestatusSETTINGSstring');
  statusElement.setAttribute('status', status);
  settingsStatusElement.setAttribute('status', status);
  if (status == 'checking') {
    statusString.textContent = 'Checking for updates...';
  } else if (status == 'uptodate' && betaEnabled) {
    statusString.textContent = 'You are running the latest version: ' + current;
  } else if (status == 'uptodate' && !betaEnabled) {
    statusString.textContent = 'There are no newer stable updates. You are running version ' + current + '. There ' + (pendingBetaUpdates == 1 ? 'is' : 'are') + ' ' + (pendingBetaUpdates == 0 ? 'no' : pendingBetaUpdates) + ' beta update' + (pendingBetaUpdates == 1 ? '' : 's') + ' available.';
  } else if (status == 'downloading') {
    statusString.textContent = 'Downloading latest update... ' + current + ' -> ' + latest;
  } else if (status == 'downloaded') {
    statusString.textContent = 'Downloaded latest update: ' + latest;
  } else if (status == 'fail' && failType == 'check') {
    statusString.textContent = 'Failed to check for updates. Are you connected to the internet?';
  } else if (status == 'fail' && failType == 'download') {
    statusString.textContent = 'Failed to download update. Are you connected to the internet?';
  }
});

function updateColorPreference() {
  if (document.querySelector("html").classList.contains("light")) {
    document.querySelector("html").classList.remove("light");
    document.querySelector("html").classList.add("dark");
  } else {
    document.querySelector("html").classList.remove("dark");
    document.querySelector("html").classList.add("light");
  }
  sendColorPreference();
}

function sendColorPreference() {
  ipcRenderer.send('color-preference', document.querySelector('html').classList.contains('dark') ? 'dark' : 'light');
}

const discordRichPresenceSwitch = document.querySelector('input#DiscordRPCSwitch');
const startupSwitch = document.querySelector('input#StartupSwitch');
const betaSwitch = document.querySelector('input#BetaSwitch');

ipcRenderer.on('preferences', (event, preferencesData) => {
  const preferences = JSON.parse(preferencesData);
  document.querySelector('html').classList.remove('light', 'dark');
  document.querySelector('html').classList.add(preferences.colorScheme);
  discordRichPresenceSwitch.checked = preferences.discordRPC;
  if (process.platform !== 'linux') { startupSwitch.checked = preferences.startup } else { startupSwitch.disabled = true };
  betaSwitch.checked = preferences.betaEnabled;
});

function checkForUpdates() {
  ipcRenderer.send('update-check');
}

discordRichPresenceSwitch.addEventListener('change', (event) => {
  const isChecked = event.target.checked;
  ipcRenderer.send('toggleDiscordRichPresence', isChecked);
});

startupSwitch.addEventListener('change', (event) => {
  const isChecked = event.target.checked;
  ipcRenderer.send('toggleRunOnStartup', isChecked);
});

betaSwitch.addEventListener('change', (event) => {
  const isChecked = event.target.checked;
  ipcRenderer.send('toggleBeta', isChecked);
});

ipcRenderer.on('disableUpdateButton', (event, status) => {
  betaSwitch.disabled = status;
  status == true ? betaSwitch.setAttribute('temp', status) : betaSwitch.removeAttribute('temp');
})