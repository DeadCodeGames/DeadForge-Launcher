const { ipcRenderer } = require('electron');
const { BrowserWindow } = require('@electron/remote');

let notificationActionA, notificationActionB, timer;

function closeNotification(callbackFn = null) {
    document.querySelector('div#notification').classList.add('hidden');
    setTimeout(() => {
        ipcRenderer.send('notificationclose', callbackFn);
    }, 125);
}

ipcRenderer.on('notification', (event, notification) => {
    console.log(notification);
    const title = notification.title;
    const message = notification.message;
    const actionA = notification.actionA && notification.actionA.message ? notification.actionA : null;
    const actionB = notification.actionB && notification.actionB.message ? notification.actionB : null;

    document.querySelector('div#notificationinfotitle').textContent = title;
    document.querySelector('div#notificationinfo').textContent = message;

    if (actionA != null) {
        document.querySelector('button#notificationbuttonA').textContent = actionA.message;
        notificationActionA = () => { closeNotification(actionA.callbackFn) };
    }

    if (actionB != null) {
        document.querySelector('button#notificationbuttonB').textContent = actionB.message;
        notificationActionB = () => { closeNotification(actionB.callbackFn) };
    }
})

const startTimeout = () => {
    timer = setTimeout(closeNotification, 5000);
};

const resetTimeout = () => {
    clearTimeout(timer);
};

window.addEventListener('load', () => {
    startTimeout();
});

document.querySelector('div#notification').addEventListener('mouseenter', () => {
    resetTimeout();
});

document.querySelector('div#notification').addEventListener('mouseleave', () => {
    startTimeout();
});