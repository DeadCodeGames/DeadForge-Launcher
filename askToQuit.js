const { BrowserWindow } = require('@electron/remote');
const { ipcRenderer } = require('electron');

ipcRenderer.on('askToQuit', (event, downloads) => {
    let questionString = '\nThere '; questionString += Object.keys(downloads).length == 1 ? 'is ' : 'are currently '; questionString += Object.keys(downloads).length; questionString += Object.keys(downloads).length == 1 ? ' item being downloaded:\n\n' : ' downloads being downloaded:\n\n'; questionString += downloads.map(item => { const key = Object.keys(item)[0]; const value = item[key]; return `${value.string} ${value.version}`; }).join('\n');
    document.querySelector('div#quitmessage').textContent += questionString;
})

function quitConfirm() {
  ipcRenderer.send('quitConfirmation', true);
}

function quitCancel() {
    ipcRenderer.send('quitConfirmation', false);
}