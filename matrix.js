var canvas = document.querySelector('canvas'),
    ctx    = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヰヱ';
var hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゐゑ';
var letters = (katakana + hiragana).split("");

var fontSize = 16,
    columns = canvas.width / fontSize;

var drops = [];
for (var i = 0; i < columns; i++) {
  drops[i] = 1;
}

function draw() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < drops.length; i++) {
      var text = letters[Math.floor(Math.random() * letters.length)];
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        ctx.fillStyle = '#6495ed';
    } else {
        ctx.fillStyle = '#404'
    }
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > .95) {
      drops[i] = 0;
    }
  }
}

setInterval(draw, 66);