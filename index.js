var through = require('through-gulp');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');

var utils = require('./utils/utils.js');
var PLUGIN = 'gulp-release';

function release(options) {
  return through(function(file, enc, callback) {
    if (file.isNull()) return callback(null, file);
    if (file.isStream()) return callback(new gutil.PluginError(PLUGIN, 'Streams are not supported!'));

    var blocks = utils.getSplitBlock(file.contents.toString());
    var result = utils.resolveSourceToDestiny(blocks);
    file.contents = new Buffer(result);
    callback(null, file);
  }, function(callback) {
    callback();
  });
}

module.exports = release;

