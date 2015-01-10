/**
 * Export several useful method
 * @module utils
 */

/**
 * String block to execute file type, target path, and source files which comes from HTML file
 * @typedef {String} block
 * @example typical block
 * <!-- build:<type> <path> -->
 * <!-- build:css /style/build.css -->
 * <link rel="stylesheet" href="/style/origin.css">
 * <link rel="stylesheet" href="/style/complex.css">
 * <!-- endbuild -->
 */

/**
 * source files array, consist of object
 * @typedef {Array} SourceArray
 * @example typical SourceArray
 * [{
 *  type: 'js',
 *  destiny: '/script/build.js',
 *  files: ['script/origin.js', 'script/complex.js']
 * }];
 */

/**
 * Module dependencies
 */
var fs = require('vinyl-fs');
var path =require('path');
var through = require('through-gulp');
var gutil = require('gulp-util');

// normal regular expression
var startReg = /<!--\s+build:\w+\s+\/?[^\s]+\s+-->/gim;
var startMirrorReg = /<!--\s+build:\w+\s+\/?[^\s]+\s+-->/i;
var endReg = /<!--\s*endbuild\s*-->/gim;
var splitReg = /<!--\s+split\s+-->/gim;
var jsReg = /<\s*script\s+.*?src\s*=\s*("|')([^"']+?)\1.*?><\s*\/\s*script\s*>/i;
var cssReg = /<\s*link\s+.*?href\s*=\s*("|')([^"']+)\1.*?>/i;
var spaceReg = /^\s*$/;
var typeReg = /<!--\s+build:(\w+)\s+\/?[^\s]+\s+-->/i;
var pathReg = /<!--\s+build:\w+\s+(\/?[^\s]+)\s+-->/i;
var utils = {};

// supported file type
utils._stylesheet = ['css', 'less', 'stylus', 'sass'];
utils._script = ['js', 'coffee'];

/**
 * split the HTML into several blocks
 * @param {string} string
 * @returns {Array}
 */
utils.getSplitBlock = function(string) {
  return string.split(splitReg);
};

/**
 * execute for file type
 * @param {block} block
 * @returns {String}
 */
utils.getBlockType = function(block) {
  return typeReg.exec(block)[1];
};

/**
 * execute for file target path
 * @param {block} block
 * @returns {String}
 */
utils.getBlockPath = function(block) {
  return pathReg.exec(block)[1];
};

/**
 * execute for source files path
 * @param {block} block
 * @returns {Array}
 * @example - typical usage
 * var sample =
 *   <!-- build:css /style/build.css -->
 *   <link rel="stylesheet" href="/style/origin.css">
 *   <link rel="stylesheet" href="/style/complex.css">
 *   <!-- endbuild -->
 * // return ['style/origin.css', 'style/complex.css'];
 * utils.getFilePath(sample);
 */
utils.getFilePath = function(block) {
  return block
    .replace(startReg, '')
    .replace(endReg, '')
    .split('\n')
    .filter(function(value) {
      return !spaceReg.test(value);
    })
    .map(function(value) {
      if (utils._script.indexOf(utils.getBlockType(block)) !== -1) return jsReg.exec(value.replace(/^\s*/, ''))[2];
      if (utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1) return cssReg.exec(value.replace(/^\s*/, ''))[2];
    });
};

/**
 * execute for source files path
 * @param {Array} blocks - Array consist of block
 * @returns {SourceArray}
 */
utils.getFileSource = function(blocks) {
  return blocks
    .filter(function(block) {
      return startMirrorReg.test(block);
    })
    .map(function(block) {
      return {
        type: utils.getBlockType(block),
        destiny: utils.getBlockPath(block),
        files: utils.getFilePath(block)
      }
    });
};

/**
 * resolve linked source files and output
 * @param {SourceArray} sources
 * @param {Object} options
 * @returns {boolean}
 */
utils.resolveFileSource = function(sources, options) {
  if (!sources || !options) return false;

  for (var i = 0; i < sources.length; i++) {
    var files = sources[i].files;
    var destiny = path.join('./', sources[i].destiny);
    var parser = options[sources[i].type];

    if (files.length === 0 || !destiny) return false;
    if (!parser || parser.length === 0)  {
      utils.pathTraverse(files, [utils.concat(destiny)], options.debug).pipe(fs.dest(path.join('./', options.directory)));
    }
    if (parser && parser.length !== 0) {
      utils.pathTraverse(files, parser, options.debug).pipe(utils.concat(destiny)).pipe(fs.dest(path.join('./', options.directory)));
    }
  }
};

/**
 * resolve source files through pipeline and return final transform stream
 * @param {Array} originPath - array consist of source file path
 * @param {Array} flow - array consist of transform stream, like [less(),cssmin()], or [coffee(), uglify()]
 * @param {Boolean} debug - whether execute in unit test environment
 * @returns {Object} - transform stream
 */
utils.pathTraverse = function(originPath, flow, debug) {
  var targetPath = originPath.map(function(value) {
    if (!debug) return path.join('./', value);
    return path.join('./', '/test/fixture',  value);
  });
  var stream = fs.src(targetPath);
  for (var i = 0; i < flow.length; i++) {
    stream = stream.pipe(flow[i]);
  }
  return stream;
};

/**
 * resolve the HTML file, replace, remove, or add specific tags
 * @param {Array} blocks - array consist of block
 * @returns {String}
 */
utils.resolveSourceToDestiny = function(blocks) {
  var result = blocks.map(function(block) {
    if (!startMirrorReg.test(block)) return block;
    if (utils._script.indexOf(utils.getBlockType(block)) !== -1) return '<script src="' + utils.getBlockPath(block) + '"></script>';
    if (utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1) return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + '"/>';
    if (utils.getBlockType(block) === 'remove') return null;
  });

  return result.join('\n');
};

/**
 * concat several stream contents, like an simple gulp-concat plugin
 * @param {String} fileName - full relative path for final file, relative to process.cwd()
 * @returns {Object} - transform stream pipable
 */
utils.concat = function(fileName) {
  var assetStorage = new Buffer(0);
  var separator = new Buffer('\n');
  return through(function(file, enc, callback) {
    assetStorage = Buffer.concat([assetStorage, file.contents, separator]);
    callback();
  }, function(callback) {
    this.push(new gutil.File({
      path: fileName,
      contents: assetStorage
    }));
    callback();
  })
};

/**
 * Merge two object shallowly
 * @param {Object} source
 * @param {Object} destiny
 * @returns {Object} - object after merge
 * @example - typical usage
 * // return { title: 'story', content: 'never say goodbye' }
 * utils.shallowMerge({
 *     title: 'story',
 *     content: 'never say goodbye'
 *   },{
 *     title: 'love'
 *   });
 */
utils.shallowMerge = function(source, destiny) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      destiny[key] = source[key];
    }
  }

  return destiny;
};

/**
 * Replace all the white space(\s) and enter(\n) for easier unit-test
 * @param {String} string
 * @returns {String} - escaped string
 */
utils._escape = function(string) {
  return string.replace(/[\n\s]*/gi, '');
};

// exports the object
module.exports = utils;