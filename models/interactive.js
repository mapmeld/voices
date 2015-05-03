var mongoose = require('mongoose');

var interactiveSchema = mongoose.Schema({
  imgurl: String,
  colorkey: String,
  audioUrls: [String]
});

module.exports = mongoose.model('Interactive', interactiveSchema);
