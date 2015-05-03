var canvas = $('canvas#photo')[0];
var ctx = canvas.getContext('2d');
var colorcanvas = $('canvas#drawn')[0];
var colorctx = colorcanvas.getContext('2d');
var editorState;

if (typeof console == 'undefined') {
  console = {
    log: function() { }
  };
}

function colorMatch(color1, color2) {
  return (Math.abs(color1[0] - color2[0]) < 20) && (Math.abs(color1[1] - color2[1]) < 20) && (Math.abs(color1[2] - color2[2]) < 20);
}

function playAudioForColor(pixelColor) {
  // should be same order as color palette in audio list
  var colors = [
    [0, 0, 0],
    [192, 0, 0],
    [0, 0, 192],
    [0, 192, 0],
    [192, 0, 192]
  ];

  for (var c = 0; c < colors.length; c++) {
    var targetColor = colors[c];
    if (colorMatch(targetColor, pixelColor)) {
      var matchingAudio = $($('#audios li')[c]).find('audio')[0];
      if (matchingAudio) {
        matchingAudio.play();
      }
      break;
    }
  }
}

function loadURLOnCanvas(url) {
  var iw = 500;
  var ih = 500;
  ctx.fillRect(0, 0, iw, ih);
  var i = new Image();
  i.onload = function() {
    if (i.width / i.height < iw / ih) {
      iw = i.width * ih / i.height;
    } else {
      ih = i.height * iw / i.width;
    }
    ctx.drawImage(i, 0, 0, iw, ih);
  };
  i.src = url;
  if (typeof allowDrawing != 'undefined') {
    allowDrawing();
  }
}

$(function() {
  if (typeof player != 'undefined') {
    loadURLOnCanvas(imgurl);

    var colorimg = new Image();
    colorimg.onload = function() {
      colorctx.drawImage(colorimg, 0, 0);
    };
    colorimg.src = player.colorkey;

    editorState = "test_audio";
  }

  $("canvas#drawn").click(function(e) {
    if (editorState == "test_audio") {
      var pixelColor = colorctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      if (pixelColor[3] > 0) {
        playAudioForColor(pixelColor);
      }
    }
  });
});
