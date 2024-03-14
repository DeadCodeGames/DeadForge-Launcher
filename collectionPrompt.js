const { BrowserWindow } = require('@electron/remote');
const { ipcRenderer } = require('electron');

const error = document.querySelector('span#error');

function cancelPrompt() {
  ipcRenderer.send('collectionPrompt', "cancel");
}

function confirmPrompt(name) {
  if (name.length < 1) {
    error.querySelector('span#errorText').textContent = "Collection name cannot be of length 0.";
    return;
  }
  ipcRenderer.send('collectionPrompt', "confirm", name);
}

ipcRenderer.on('error', (event, err) => {
  error.querySelector('span#errorText').textContent = err;
  error.querySelector('span.material-symbols').textContent = 'error';
})