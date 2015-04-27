var canvas, ctx, editorState, mainstream, recorder, browserAudioContext;
var recording = false;

function prepareDrawingCanvas() {
  canvas = $('canvas#photo')[0];
  ctx = canvas.getContext('2d');
  ctx.strokeStyle = "#000";
  ctx.fill = "#fff";
  ctx.fillText("Drop an image on the page!", 0, 30)
}

function processDroppedImage (e) {
  var iw = 500;
  var ih = 500;
  ctx.fillRect(0, 0, iw, ih);

  var i = new Image();
  i.onload = function () {
    if (i.width / i.height < iw / ih) {
      iw = i.width * ih / i.height;
    } else {
      ih = i.height * iw / i.width;
    }
    ctx.drawImage(i, 0, 0, iw, ih);

    allowDrawing();
  };
  i.src = e.target.result;
}

function watchForDroppedImage() {
  var blockHandler = function (e) {
    e.stopPropagation();
    e.preventDefault();
  };

  // file drop handlers
  var dropFile = function (e) {
    e.stopPropagation();
    e.preventDefault();
    files = e.dataTransfer.files;
    if (files && files.length && editorState == "add_an_image") {
      var reader = new FileReader();
      var fileType = files[0].type.toLowerCase();
      if(fileType.indexOf("image") > -1){
        // process an image
        reader.onload = processDroppedImage;
        reader.readAsDataURL(files[0]);
      }
    }
  };

  window.addEventListener('dragenter', blockHandler, false);
  window.addEventListener('dragexit', blockHandler, false);
  window.addEventListener('dragover', blockHandler, false);
  window.addEventListener('drop', dropFile, false);
}

function allowDrawing() {
  editorState = "color_an_area";

  canvas = $('canvas#drawn')[0];
  ctx = canvas.getContext('2d');

  ctx.fill = "#fff";
  ctx.stokeStyle = "#000";
  ctx.lineWidth = 8;

  $(".draw-tools, .canvas-tools").removeClass('hide');
  $(".draw-tools .color").click(function(e) {
    $(".color").removeClass("highlight");
    $(e.currentTarget).addClass("highlight");
    ctx.strokeStyle = $(e.currentTarget).css('color');
  });

  var writing = false;
  var lastPt = null;

  var drawPixels = function(e) {
    if (writing) {
      if (lastPt) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      }
      ctx.moveTo(e.offsetX, e.offsetY);
      lastPt = [e.offsetX, e.offsetY];
    }
  };

  $("canvas#drawn")
  .on("mouseover", function() {
    $("canvas#drawn").addClass('active');
  })
  .on("mouseout", function() {
    $("canvas#drawn").removeClass('active');
  })
  .on("mousedown", function() {
    writing = true;
    lastPt = null;
    ctx.beginPath();
  })
  .on("mouseup mouseout", function() {
    writing = false;
  })
  .on("mousemove", drawPixels);

  $("canvas#photo").click(function(e) {
    if (editorState == "test_audio") {
      var pixelColor = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      if (pixelColor[3] > 0) {
        playAudioForColor(pixelColor);
      }
    }
  });

  $("#tryCanvas").click(function() {
    $(".draw-tools, #tryCanvas, canvas#drawn").addClass("hide");
    $("#restoreCanvas").removeClass("hide");
    $("canvas#drawn").off("mousemove");
    editorState = "test_audio";
  });
  $("#restoreCanvas").click(function() {
    $(".draw-tools, #tryCanvas, canvas#drawn").removeClass("hide");
    $("#restoreCanvas").addClass("hide");
    $("canvas#drawn").on("mousemove", drawPixels);
    editorState = "color_an_area";
  });

  $(".record").show().click(toggleRecording);
}

function toggleRecording(e) {
  recording = !recording;
  if(!recording){
    $(e.currentTarget).hide();
    recorder.stop();
    mainstream.stop();
    recorder.exportWAV(function(wavaudio) {
      var audioBox = $(e.currentTarget).parent('li');
      audioBox.find('audio').show()[0].src = window.URL.createObjectURL(wavaudio);
      putUploadURL(wavaudio, audioBox.find('input'));
    });
  }
  else {
    $(e.currentTarget).text('Stop');
    navigator.getUserMedia({audio: true, video: false}, function(stream){
      mainstream = stream;
      var context = new browserAudioContext();
      var mediaStreamSource = context.createMediaStreamSource(stream);
      recorder = new Recorder(mediaStreamSource);
      recorder.record();
    }, function(err){
      console.log(err);
    });
  }
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

function putUploadURL(blobData, input) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var fd = new FormData();
    fd.append('fname', 'recording.wav');
    fd.append('data', e.target.result);
    $.ajax({
      type: 'POST',
      url: '/create',
      data: fd,
      processData: false,
      contentType: false
    }).done(function (data) {
      input.val(data.url);
    });
  };
  reader.readAsDataURL(blobData);
}

function checkRecordability() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if(typeof AudioContext === "undefined"){
    browserAudioContext = webkitAudioContext;
  }
  else{
    browserAudioContext = AudioContext;
  }
  if (typeof navigator.getUserMedia === 'undefined') {
    $(".record").hide();
  }
}

// run JS when ready
$(function() {
  prepareDrawingCanvas();
  checkRecordability();

  if (window.location.href.indexOf("demo") > -1) {
    // special demo mode
    allowDrawing();
  } else {
    // wait for image to add
    editorState = "add_an_image";
    watchForDroppedImage();
  }
});
