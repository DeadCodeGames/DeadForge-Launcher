const { BrowserWindow } = require('@electron/remote');
const { ipcRenderer } = require('electron');

const minimizeBtn = document.querySelector("div#window>div#controls>div#minimize");
const maximizeBtn = document.querySelector("div#window>div#controls>div#maximize");
const closeBtn = document.querySelector("div#window>div#controls>div#close");

var Collections, fixcontextmenu = { "ConRPG": false, "RestoreBackup?": false }, lightsout = false;

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
  ipcRenderer.send('close');
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
    try {
      document.querySelector("#webiFrame").contentDocument.querySelector("html").classList.remove("light");
      document.querySelector("#webiFrame").contentDocument.querySelector("html").classList.add("dark");
    } catch (error) {
      console.warn(error + "\nThis is most likely caused by trying to change the color scheme on the #webiFrame element, while the current iFrame is the DeadCode website. If not, please report this issue @ https://github.com/DeadCodeGames/DeadForge/issues.");
    }
  } else {
    document.querySelector("html").classList.remove("dark");
    document.querySelector("html").classList.add("light");
    try {
      document.querySelector("#webiFrame").contentDocument.querySelector("html").classList.remove("dark");
      document.querySelector("#webiFrame").contentDocument.querySelector("html").classList.add("light");
    } catch (error) {
      console.warn(error + "\nThis is most likely caused by trying to change the color scheme on the #webiFrame element, while the current iFrame is the DeadCode website. If not, please report this issue @ https://github.com/DeadCodeGames/DeadForge/issues.");
    }
  }
  sendColorPreference();
}

function sendColorPreference() {
  ipcRenderer.send('color-preference', document.querySelector('html').classList.contains('dark') ? 'dark' : 'light');
}

const discordRichPresenceSwitch = document.querySelector('input#DiscordRPCSwitch');
const startupSwitch = document.querySelector('input#StartupSwitch');
const betaSwitch = document.querySelector('input#BetaSwitch');
const traySwitch = document.querySelector('input#TraySwitch');

ipcRenderer.on('collections', (event, collections) => {
  Collections = JSON.parse(collections);
  if (collections != undefined && Object.keys(Collections.collections).length > 0) {
    document.querySelector('select#collectionSelect').querySelectorAll("option:nth-of-type(n+3)").forEach((option) => {option.remove()});
    document.querySelector('select#collectionSelect').innerHTML += '<option disabled id="selectSeparator">&nbsp;</option>';
    Object.keys(Collections.collections).forEach((key) => {
      document.querySelector('select#collectionSelect').innerHTML += '<option value="' + key + '">' + key + '</option>';
    });
    Collections.favourites.forEach((fav) => {
      document.querySelector('[data-gametitle="' + fav + '"]').querySelector("label.favourite-checkbox>input").checked = true;
    });
    const contextMenus = document.querySelectorAll("contextmenu");
    contextMenus.forEach((contextMenu) => {
      const game = contextMenu.getAttribute("for");
      const menuContent = contextMenu.querySelector(".item.exmenu>.menu-content");
      while (menuContent.children.length > 1) {
        menuContent.children[1].remove();
      }
      Object.keys(Collections.collections).forEach((collectionName) => {
        menuContent.innerHTML += `<li class="item" onclick="toggleCollection('${game}', '${collectionName}')"><i class="material-symbols">${Collections.collections[collectionName].includes(game) ? "check" : "close"}</i><span>${collectionName}</span></li>`;
      });
    });

  }
})

ipcRenderer.on('preferences', (event, preferencesData) => {
  const preferences = JSON.parse(preferencesData);
  document.querySelector('html').classList.remove('light', 'dark');
  document.querySelector('html').classList.add(preferences.colorScheme);
  try { document.querySelector('#webiFrame').contentDocument.querySelector('html').classList.add(preferences.colorScheme); } catch { };
  discordRichPresenceSwitch.checked = preferences.discordRPC;
  if (process.platform !== 'linux') { startupSwitch.checked = preferences.startup } else { startupSwitch.disabled = true };
  betaSwitch.checked = preferences.betaEnabled;
  traySwitch.checked = preferences.closeToTray;
  if (preferences.menubarCollapsed == true) { document.querySelector('#sidebar').classList.add('collapsed') };
  if (preferences.libraryStyle == "banner") {
    document.querySelector('input#inputViewBanner').checked = true;
    document.querySelector('section#library').setAttribute('viewstyle', 'banner');
  } else if (preferences.libraryStyle == "list") {
    document.querySelector('input#inputViewList').checked = true;
    document.querySelector('section#library').setAttribute('viewstyle', 'list');
  } else if (preferences.libraryStyle == "grid") {
    document.querySelector('input#inputViewGrid').checked = true;
    document.querySelector('section#library').setAttribute('viewstyle', 'grid');
  };
  if (preferences.currentLibCollection.length != "") { document.querySelector('select#collectionSelect').value = preferences.currentLibCollection; }
  const games = Array.from(document.querySelectorAll('games>gamesection'));
  games.forEach((game) => { game.setAttribute('data-currentcollection', preferences.currentLibCollection == "" ? "true" : preferences.currentLibCollection == "❤️" ? Collections.favourites.includes(game.getAttribute('data-gametitle')) : Collections.collections[preferences.currentLibCollection].includes(game.getAttribute('data-gametitle'))); game.querySelector("label.favourite-checkbox>input").checked = Collections.favourites.includes(game.getAttribute('data-gametitle')) ? true : false});
  if (preferences.librarySort) { document.querySelector('select#sortSelect').value = preferences.librarySort;}
  const gamesUnsorted = Array.from(document.querySelectorAll('games>gamesection'));
  var gamesSorted; const selectedSort = preferences.librarySort;
  if (selectedSort == "nameAscending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gametitle') < b.getAttribute('data-gametitle')) ? -1 : (a.getAttribute('data-gametitle') > b.getAttribute('data-gametitle')) ? 1 : 0; }) }
  else if (selectedSort == "nameDescending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gametitle') < b.getAttribute('data-gametitle')) ? 1 : (a.getAttribute('data-gametitle') > b.getAttribute('data-gametitle')) ? -1 : 0; }) }
  else if (selectedSort == "DORAscending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gamedor') < b.getAttribute('data-gamedor')) ? -1 : (a.getAttribute('data-gamedor') > b.getAttribute('data-gamedor')) ? 1 : 0; }) }
  else if (selectedSort == "DORDescending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gamedor') < b.getAttribute('data-gamedor')) ? 1 : (a.getAttribute('data-gamedor') > b.getAttribute('data-gamedor')) ? -1 : 0; })}
  gamesSorted.forEach((game) => { document.querySelector('section#library>games').appendChild(game); });
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

traySwitch.addEventListener('change', (event) => {
  const isChecked = event.target.checked;
  ipcRenderer.send('toggleTray', isChecked);
})

ipcRenderer.on('launcherUpdateDownloadProgress', (event, progress) => {
  document.querySelector('progress#launcherUpdateProgress').setAttribute('value', progress);
})

setInterval(() => { ipcRenderer.send('checkForConnection') }, 30000);
ipcRenderer.send('checkForConnection');

ipcRenderer.on('connectionCheck', (event, status) => {
  document.querySelector('div#onlinestatus').setAttribute('status', status ? 'online' : 'offline');
  if (document.querySelector('div#updatestatus').getAttribute('status') == 'fail' && status == true) { checkForUpdates(); }
  if (document.querySelector('iframe#webiFrame').getAttribute('src') != 'https://deadcode.is-a.dev' && status == true) { document.querySelector('iframe#webiFrame').setAttribute('src', 'https://deadcode.is-a.dev'); }
  else if (document.querySelector('iframe#webiFrame').getAttribute('src') != '418.html' && status == false) { document.querySelector('iframe#webiFrame').setAttribute('src', '418.html'); }
})

const radioButtons = document.querySelectorAll('input[name="libraryViewOptions"]');

radioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', (event) => {
      const selectedView = event.target.id.replace('inputView', '').toLowerCase();
        document.querySelector('section#library').setAttribute('viewstyle', selectedView);
        ipcRenderer.send('changeLibraryView', selectedView);
    });
});

const sortingSystems = {
  "nameAscending": (a, b) => { return (a.getAttribute('data-gametitle') < b.getAttribute('data-gametitle')) ? -1 : (a.getAttribute('data-gametitle') > b.getAttribute('data-gametitle')) ? 1 : 0; },
  "nameDescending": (a, b) => { return (a.getAttribute('data-gametitle') < b.getAttribute('data-gametitle')) ? 1 : (a.getAttribute('data-gametitle') > b.getAttribute('data-gametitle')) ? -1 : 0; },
  "DORAscending": (a, b) => { return (a.getAttribute('data-gamedor') < b.getAttribute('data-gamedor')) ? -1 : (a.getAttribute('data-gamedor') > b.getAttribute('data-gamedor')) ? 1 : 0; },
  "DORDescending": (a, b) => { return (a.getAttribute('data-gamedor') < b.getAttribute('data-gamedor')) ? 1 : (a.getAttribute('data-gamedor') > b.getAttribute('data-gamedor')) ? -1 : 0; },

}

document.querySelector('select#sortSelect').addEventListener('change', (event) => {
  const selectedSort = event.target.value;

  ipcRenderer.send('changeLibrarySort', selectedSort);

  const gamesUnsorted = Array.from(document.querySelectorAll('games>gamesection'));
  let gamesSorted;
  if (selectedSort == "nameAscending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gametitle') < b.getAttribute('data-gametitle')) ? -1 : (a.getAttribute('data-gametitle') > b.getAttribute('data-gametitle')) ? 1 : 0; }) }
  else if (selectedSort == "nameDescending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gametitle') < b.getAttribute('data-gametitle')) ? 1 : (a.getAttribute('data-gametitle') > b.getAttribute('data-gametitle')) ? -1 : 0; }) }
  else if (selectedSort == "DORAscending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gamedor') < b.getAttribute('data-gamedor')) ? -1 : (a.getAttribute('data-gamedor') > b.getAttribute('data-gamedor')) ? 1 : 0; }) }
  else if (selectedSort == "DORDescending") { gamesSorted = gamesUnsorted.toSorted((a, b) => { return (a.getAttribute('data-gamedor') < b.getAttribute('data-gamedor')) ? 1 : (a.getAttribute('data-gamedor') > b.getAttribute('data-gamedor')) ? -1 : 0; })}
  gamesSorted.forEach((game) => { document.querySelector('section#library>games').appendChild(game); });
});

document.querySelector('select#collectionSelect').addEventListener('change', (event) => {
  const selectedCollection = event.target.value;

  ipcRenderer.send('changeLibraryCollection', selectedCollection);

  const games = Array.from(document.querySelectorAll('games>gamesection'));
  games.forEach((game) => { game.setAttribute('data-currentcollection', selectedCollection == "" ? "true" : selectedCollection == "❤️" ? Collections.favourites.includes(game.getAttribute('data-gametitle')) : Collections.collections[selectedCollection].includes(game.getAttribute('data-gametitle'))); game.querySelector("label.favourite-checkbox>input").checked = Collections.favourites.includes(game.getAttribute('data-gametitle')) ? true : false});
})

function toggleFavourite(game, wait = true) {
  ipcRenderer.send('toggleFavourite', game, wait);
}
    

function openContextMenu(e, game) {
  document.querySelectorAll("contextmenu").forEach((contextMenu) => {contextMenu.style.visibility = "hidden"});
  const contextMenu = document.querySelector(`contextmenu[for="${game}"]`);
    let x = e.clientX, y = e.clientY,
    winWidth = window.innerWidth,
    winHeight = window.innerHeight,
    cmWidth = contextMenu.offsetWidth,
    cmHeight = contextMenu.offsetHeight;
    shareMenu = contextMenu.querySelector(".menu-content");
    console.log(e, x, y, window, cmWidth, cmHeight, winWidth, winHeight, shareMenu.offsetWidth, shareMenu.offsetHeight);

      if(x > (winWidth - cmWidth - shareMenu.offsetWidth)) {
          shareMenu.style.left = (- shareMenu.offsetWidth) + "px";
      } else {
          shareMenu.style.left = "";
          shareMenu.style.right = (- shareMenu.offsetWidth) + "px";
      }
      
      if (x + cmWidth > winWidth) {
        contextMenu.style.right = `${winWidth - x}px`;
        contextMenu.style.left = "";
      } else {
        contextMenu.style.left = `${x}px`;
        contextMenu.style.right = "";
      }
      if (y + cmHeight > winHeight) {
        contextMenu.style.bottom = `${winHeight - y}px`;
        contextMenu.style.top = "";
      } else {
        contextMenu.style.top = `${y}px`;
        contextMenu.style.bottom = "";
      }
      if (fixcontextmenu[game] == false) { fixcontextmenu[game] = true; return openContextMenu(e, game); }
      contextMenu.style.visibility = "visible";
  document.addEventListener("click", (event) => { if (!contextMenu.contains(event.target) || contextMenu.querySelector('.content .menu-content .collectionscontextadd').contains(event.target)) contextMenu.style.visibility = "hidden" });
}

function createCollection(game = undefined) {
  ipcRenderer.send('createCollection', game);
}

function toggleCollection(game, collection) {
    ipcRenderer.send('toggleCollection', game, collection);
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key == "r") { event.preventDefault(); if (lightsout == false){ipcRenderer.send('refresh');} }
})

let clicktimeouts = [];

const droneStartSFX = new Audio("res/droneStart.wav");
const droneSFX = new Audio("res/drone.wav");
const lightbulbSFX = new Audio("res/lightbulbhum.wav");

function handleButtonClick() {
  if (clicktimeouts.length >= 10) {
    ipcRenderer.send('amoledmode');
    lightsout = true;
    document.addEventListener('keydown', (event) => {
      if (event.key == "F11" || (event.altKey && event.key == "F4") || (event.ctrlKey && event.key == "r")) { event.preventDefault(); }
    });
    droneStartSFX.play();
    droneSFX.play();
    document.querySelector("html").classList.remove("dark", "light"); document.querySelector("html").classList.add("amoled");
    setTimeout(() => {
      lightbulbCSS.generateKeyframes({ animationName: "flicker" }, { selector: "div#void" });
      lightbulbSFX.play();
      lightbulbSFX.loop = true;
      setTimeout(() => {
        ipcRenderer.send('achievement', 'deadforge', 'darkwasnotenough', true);
      }, 666000)
      setInterval(() => {
        lightbulbCSS.generatePoints({selector: "div#void"});
      }, 750)
    }, 5000)
  };

  const timeout = setTimeout(() => {
      clicktimeouts = clicktimeouts.filter(t => t !== timeout);
  }, 2500);

  clicktimeouts.push(timeout);
}

document.querySelector('div#switchColorMode').addEventListener('click', handleButtonClick);