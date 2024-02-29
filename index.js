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

ipcRenderer.on('updateStatus', (event, status) => {
  const statusElement = document.querySelector('div#updatestatus');
  statusElement.setAttribute('status', status);
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

ipcRenderer.on('preferences', (event, preferencesData) => {
  const preferences = JSON.parse(preferencesData);
  document.querySelector('html').classList.remove('light', 'dark');
  document.querySelector('html').classList.add(preferences.colorScheme);
});