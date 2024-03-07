const { BrowserWindow } = require('@electron/remote');
const { ipcRenderer } = require('electron');

ipcRenderer.on('updateVersion', (event, version) => {
    document.querySelector('div#updatemessage').textContent = 'Update ' + version + ' has been downloaded.';
})

function updateNow() {
  ipcRenderer.send('update', true);
}

function updateUponClose() {
    ipcRenderer.send('update', false);
}