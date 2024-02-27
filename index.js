const heading = document.querySelector('heading');
const subheading = document.querySelector('subheading');
const button = document.querySelector('downloadbutton');
const buttonlink = document.querySelector("a#downloadbutton");
const smallbuttonsarray = document.querySelector("downloadbuttonsarray");
const winbutton = document.querySelector("a#downloadwin");
const linuxbutton = document.querySelector("a#downloadlinux");
const macbutton = document.querySelector("a#downloadmac");
      
document.addEventListener('mousemove', (e) => {
    const offsetX = (window.innerWidth / 2 - e.clientX) * 0.05; // Adjust the factor to control the movement intensity
    const offsetY = (window.innerHeight / 2 - e.clientY) * 0.05; // Adjust the factor to control the movement intensity
        
    heading.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    subheading.style.transform = `translate(${offsetX * 1.5}px, ${offsetY * 1.5}px)`; // Adjust the factor for faster movement
    buttonlink.style.transform = `translate(${offsetX * 2}px, ${offsetY * 2}px)`;
    smallbuttonsarray.style.transform = `translate(${offsetX * 3}px, ${offsetY * 3}px)`;
});

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var JS = JSON.parse(this.responseText);     
    button.textContent += " " + JS[0].tag_name;
    buttonlink.setAttribute("href", JS[0].html_url);
    button.removeAttribute("disabled");
    
    var assets = JS[0].assets;
    var downloadLinksByOS = {};

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

    winbutton.setAttribute("href", downloadLinksByOS['windows']);
    linuxbutton.setAttribute("href", downloadLinksByOS['linux']);
    macbutton.setAttribute("href", downloadLinksByOS['mac']);
    smallbuttonsarray.removeAttribute("disabled");
    winbutton.querySelector("downloadbuttonsmall").removeAttribute("disabled");
    linuxbutton.querySelector("downloadbuttonsmall").removeAttribute("disabled");
    macbutton.querySelector("downloadbuttonsmall").removeAttribute("disabled");
  }
};
xmlhttp.open("GET", "https://api.github.com/repos/DeadCodeGames/DeadForge-Launcher/releases", true);
xmlhttp.send();