var canvas = $('canvas#photo')[0];
var ctx = canvas.getContext('2d');
var colorcanvas = $('canvas#drawn')[0];
var colorctx = colorcanvas.getContext('2d');

$(function() {
  if (typeof player != 'undefined') {
    var iw = 500;
    var ih = 500;
    var i = new Image();
    i.onload = function() {
      if (i.width / i.height < iw / ih) {
        iw = i.width * ih / i.height;
      } else {
        ih = i.height * iw / i.width;
      }
      ctx.drawImage(i, 0, 0, iw, ih);
    };
    i.src = imgurl;

    for (var a = 0; a < player.audioUrls.length; a++) {
      var play = $('<audio>');
      if (player.audioUrls[a]) {
        play.attr('src', player.audioUrls[a]);
      }
      $('#audios').append(play);
    }
  }
});
