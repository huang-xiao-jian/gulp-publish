/**
 * A module to replace link, script tags, and provide API for resolve linked files.
 * @module gulp-publish
 * @version v0.8.0
 */

/**
 * Module dependencies
 */
"use strict";

var through = require('through-gulp');
var gutil = require('gulp-util');
var utils = require('./utils/utils.js');
const PLUGIN = 'gulp-publish';

/**
 * Return transform stream which resolve HTML files.
 * @param {object} opts - stream options
 * @returns {Stream}
 */
function publish(opts) {
  // stream options
  var defaults = {
    enableResolve: false,
    directory: './build',
    debug: false
  };
  var options = utils.shallowMerge(opts, defaults);

  return through(function(file, enc, callback) {
    if (file.isNull()) return callback(null, file);

    // emit error event when pass stream
    if (file.isStream()) {
      this.emit('error', new gutil.PluginError(PLUGIN, 'Streams are not supported!'));
      return callback();
    }

    // resolve the HTML files
    var blocks = utils.getSplitBlock(file.contents.toString());
    var result = utils.resolveSourceToDestiny(blocks, options);
    file.contents = new Buffer(result);

    // resolve the files linked by tag script and link
    if (options.enableResolve) {
      let fileSource = utils.getBlockFileSource(blocks);
      utils.resolveFileSource(fileSource, options);
    }

    callback(null, file);
  });
}

module.exports = publish;

