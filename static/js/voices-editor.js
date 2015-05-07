var mainstream, recorder, browserAudioContext;
var recording = false;

function prepareDrawingCanvas() {
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.fillText("Drop an image on the page!", 0, 30)
}

function processDroppedImage (e) {
  loadURLOnCanvas(e.target.result);

  // upload that image to S3
  var fd = new FormData();
  fd.append('data', e.target.result);
  fd.append('_csrf', $('#csrf').val());
  $.ajax({
    type: 'POST',
    url: '/imgurl',
    data: fd,
    processData: false,
    contentType: false
  }).done(function (data) {
    $('#imgurl').val(data.url);
  });
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

function watchForUploadedImage() {
  $(".canvas-container input").change(function(e) {
    var image = this.files[0];
    if (image) {
      loadURLOnCanvas(URL.createObjectURL(image), function() {
        var photoURL = $("canvas#photo")[0].toDataURL();
        var fd = new FormData();
        fd.append('data', photoURL);
        fd.append('_csrf', $('#csrf').val());
        $.ajax({
          type: 'POST',
          url: '/imgurl',
          data: fd,
          processData: false,
          contentType: false
        }).done(function (data) {
          $('#imgurl').val(data.url);
        });
      });
    }
  });
}

function watchForAudioUpload() {
  $("#audios input[type=file]").change(function(e) {
    var audio = this.files[0];
    if (audio) {
      var audioBox = $(e.currentTarget).parent('li');
      var audioFileURL = URL.createObjectURL(audio);
      $(audioBox).find('audio').show()[0].src = audioFileURL;
      $(audioBox).find('button, input').hide();
      putUploadURL(audio, audioBox.find('input[type="text"]'));
    }
  });
}

function allowDrawing() {
  editorState = "color_an_area";

  colorctx.fillStyle = "#000";
  colorctx.stokeStyle = "#000";
  colorctx.lineWidth = 8;
  if (window.devicePixelRatio && window.devicePixelRatio > 1) {
    colorctx.lineWidth = 12;
  }

  $(".draw-tools, .canvas-tools").removeClass('hide');
  $(".draw-tools .color").click(function(e) {
    $(".color").removeClass("highlight");
    $(e.currentTarget).addClass("highlight");
    colorctx.strokeStyle = $(e.currentTarget).css('color');
    colorctx.fillStyle = $(e.currentTarget).css('color');
  });

  var writing = false;
  var areas = false;
  var lastPt = null;

  var drawPixels = function(e) {
    if (writing && !areas) {
      if (lastPt) {
        colorctx.lineTo(e.offsetX, e.offsetY);
        colorctx.stroke();
      }
      colorctx.moveTo(e.offsetX, e.offsetY);
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
  .on("mousedown", function(e) {
    writing = true;
    lastPt = null;
    if (!areas) {
      colorctx.beginPath();
    }
  })
  .on("mouseup mouseout", function() {
    writing = false;
  })
  .on("click", function(e) {
    if (areas) {
      colorctx.lineTo(e.offsetX, e.offsetY);
      colorctx.stroke();
    }
  })
  .on("dblclick", function(e) {
    if (areas) {
      colorctx.lineTo(e.offsetX, e.offsetY);
      colorctx.closePath();
      colorctx.fill();
    } else {
      colorctx.beginPath();
      colorctx.moveTo(e.offsetX, e.offsetY);
    }
    areas = !areas;
  })
  .on("mousemove", drawPixels);

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

  $("#save").click(function() {
    var mergeUrl = [];
    for (var c = 0; c < $('#audios li').length; c++) {
      mergeUrl.push($($('#audios li')[c]).find('input[type="text"]').val());
    }
    var fd = new FormData();
    fd.append('img', $('#imgurl').val());
    fd.append('colorkey', $("canvas#drawn")[0].toDataURL());
    fd.append('audios', mergeUrl.join('|'));
    fd.append('_csrf', $('#csrf').val());
    $.ajax({
      type: 'POST',
      url: '/save',
      data: fd,
      processData: false,
      contentType: false
    }).done(function (data) {
      window.location = data.redirect;
    });
  });
}

function toggleRecording(e) {
  recording = !recording;
  if(!recording){
    $(e.currentTarget).text('Re-record');
    recorder.stop();
    mainstream.stop();
    recorder.exportWAV(function(wavaudio) {
      var audioBox = $(e.currentTarget).parent('li');
      audioBox.find('audio').show()[0].src = URL.createObjectURL(wavaudio);
      putUploadURL(wavaudio, audioBox.find('input[type="text"]'));
    });
  }
  else {
    $(e.currentTarget).siblings("input[type=file]").hide();
    $(e.currentTarget).text('Approve');
    navigator.getUserMedia({audio: true, video: false}, function(stream){
      $(e.currentTarget).text('Stop');
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

function putUploadURL(blobData, input) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var fd = new FormData();
    fd.append('data', e.target.result);
    fd.append('_csrf', $('#csrf').val());
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
  if (typeof AudioContext === "undefined") {
    browserAudioContext = webkitAudioContext;
  }
  else {
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
    watchForAudioUpload();
  } else {
    // wait for image to add
    editorState = "add_an_image";
    watchForDroppedImage();
    watchForUploadedImage();
  }
});
