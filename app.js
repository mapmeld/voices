// app.js
// main server for the Voices app

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var compression = require('compression');
var csrf = require('csurf');
var AWS = require('aws-sdk');

AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY;
AWS.config.secretAccessKey = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET;

var s3 = new AWS.S3();

var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false })

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

var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;
});
