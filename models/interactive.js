var mongoose = require('mongoose');

var interactiveSchema = mongoose.Schema({
  imgurl: String,
  audioUrls: [String]
});

module.exports = mongoose.model('Interactive', interactiveSchema);
