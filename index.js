const heading = document.querySelector('heading');
const subheading = document.querySelector('subheading');
const button = document.querySelector('downloadbutton');
const buttonlink = document.querySelector("a#downloadbutton")
      
document.addEventListener('mousemove', (e) => {
    const offsetX = (window.innerWidth / 2 - e.clientX) * 0.05; // Adjust the factor to control the movement intensity
    const offsetY = (window.innerHeight / 2 - e.clientY) * 0.05; // Adjust the factor to control the movement intensity
        
    heading.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    subheading.style.transform = `translate(${offsetX * 1.5}px, ${offsetY * 1.5}px)`; // Adjust the factor for faster movement
    button.style.transform = `translate(${offsetX * 2}px, ${offsetY * 2}px)`;
});

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var JS = JSON.parse(this.responseText);     
      button.textContent += " " + JS[0].tag_name;
      buttonlink.setAttribute("href", JS[0].html_url);
      button.removeAttribute("disabled");
  }
};
xmlhttp.open("GET", "https://api.github.com/repos/DeadCodeGames/DeadForge-Launcher/releases", true);
xmlhttp.send();