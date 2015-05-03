// app.js
// main server for the Voices app

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var compression = require('compression');
var csrf = require('csurf');
var AWS = require('aws-sdk');
var mongoose = require('mongoose');
var request = require('request');

AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY;
AWS.config.secretAccessKey = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET;

var s3 = new AWS.S3();

var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false })

var Interactive = require('./models/interactive');
mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI || 'localhost');

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express['static'](__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer());
app.use(compression());
app.use(cookieParser());

app.get('/', csrfProtection, function (req, res) {
  res.render('index');
});

app.get('/demo', csrfProtection, function (req, res) {
  res.render('demo');
});

app.get('/view/:id', csrfProtection, function (req, res) {
  Interactive.findById(req.params.id, function (err, int) {
    request(int.imgurl, function(err, resp, dataURI) {
      var loadAudioURL = function(i) {
        if (i > int.audioUrls.length) {
          return res.render('view', { interactive: int, imgurl: dataURI });
        }
        if (int.audioUrls[i]) {
          request(int.audioUrls[i], function(err, resp, dt) {
            int.audioUrls[i] = dt;
            loadAudioURL(i + 1);
          });
        } else {
          loadAudioURL(i + 1);
        }
      };
      loadAudioURL(0);
    });
  });
});

app.get('/create', csrfProtection, function (req, res) {
  res.render('create', { csrfToken: req.csrfToken() });
});

app.post('/create', parseForm, csrfProtection, function (req, res) {
  var tstamp = '' + Date.now();
  var params = { Bucket: S3_BUCKET, Key: tstamp, Body: req.body.data };
  s3.putObject(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      res.json({ url: 'http://endangered-language-voices.s3-website-us-east-1.amazonaws.com/' + tstamp });
    }
  });
});

app.post('/imgurl', parseForm, csrfProtection, function (req, res) {
  var tstamp = '' + Date.now();
  var params = { Bucket: S3_BUCKET, Key: tstamp, Body: req.body.data };
  s3.putObject(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      res.json({ url: 'http://endangered-language-voices.s3-website-us-east-1.amazonaws.com/' + tstamp });
    }
  });
});

app.post('/save', parseForm, csrfProtection, function (req, res) {
  //console.log(req.body);
  var int = new Interactive();
  int.imgurl = req.body.img;
  int.audioUrls = req.body.audios.split('|');
  int.colorkey = req.body.colorkey;
  int.save(function(err) {
    res.json({ redirect: '/view/' + int._id });
  });
});

var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;
});
