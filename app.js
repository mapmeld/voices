// app.js
// main server for the Voices app

var express = require('express');

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express['static'](__dirname + '/static'));

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/demo', function (req, res) {
  res.render('demo');
});

app.get('/create', function (req, res) {
  res.render('create');
});

app.post('/create', function (req, res) {

});

var server = app.listen(3000, function () {
  var port = server.address().port;
});
