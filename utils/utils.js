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
"use strict";

var path =require('path');
var fs = require('fs');
var util = require('util');
var crypto = require('crypto');
var vfs = require('vinyl-fs');
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

utils.getScriptPath = function(script) {
  if (jsReg.test(script)) return jsReg.exec(script.replace(/^\s*/, ''))[2];
  gutil.log(gutil.colors.green('failed resolve source path from'), gutil.colors.green(script), 'the block type refers script', '\n');
  return null;
};

utils.getLinkPath = function(link) {
  if (cssReg.test(link)) return cssReg.exec(link.replace(/^\s*/, ''))[2];
  gutil.log(gutil.colors.green('failed resolve source path from'), gutil.colors.green(link), 'the block type refers link', '\n');
  return null;
};

utils.getReplacePath = function(line, mode) {
  if (utils._script.indexOf(mode) !== -1) return utils.getScriptPath(line);
  if (utils._stylesheet.indexOf(mode) !== -1) return utils.getLinkPath(line);
  return null;
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
utils.getBlockFilePath = function(block) {
  return block
    .replace(startReg, '')
    .replace(endReg, '')
    .split('\n')
    .filter(function(value) {
      return !spaceReg.test(value);
    })
    .map(function(value) {
      switch (true) {
        case utils._script.indexOf(utils.getBlockType(block)) !== -1 :
          return utils.getScriptPath(value);
          break;
        case utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1 :
          return utils.getLinkPath(value);
          break;
        case utils.getBlockType(block) === 'replace' :
          return utils.getReplacePath(value, path.extname(utils.getBlockPath(block)).slice(1));
          break;
        default :
          return null;
      }
    })
    .filter(function(value) {
      return value !== null;
    });
};

utils.getBlockStructure = function(block, debug) {
  if (!startMirrorReg.test(block)) return null;

  return {
    type: utils.getBlockType(block),
    destiny: utils.getBlockPath(block),
    files: utils.getFilePath(block, debug)
  }
};

/**
 * execute for source files path
 * @param {Array} blocks - Array consist of block
 * @param {Boolean} debug - whether execute in unit test environment
 * @returns {SourceArray}
 */
utils.getBlockFileSource = function(blocks, debug) {
  return blocks
    .map(function(block) {
      return utils.getBlockStructure(block, debug);
    });
};

/**
 * provide for calculate the postfix, e.g 'v0.2.0', 'md5' or just function with concat buffer as first argument
 * @param {String|Function} postfix - the postfix for link href or script src, simple string, 'md5' or just function
 * @param {block} block
 * @param {Boolean} debug - whether debug environment
 * @returns {string} - final postfix
 */
utils.resolvePostfix = function(postfix, block, debug) {
  if (util.isNullOrUndefined(postfix)) return '';
  if (util.isString(postfix) && postfix !== 'md5') return '?' + postfix;

  var content =[];
  var sources = utils.getFilePath(block, debug)
    .map(function(value) {
      return path.join(process.cwd(), value);
    });

  for (var i = 0; i < sources.length; i++) {
    try {
      content.push(fs.readFileSync(sources[i]));
    } catch (err) {
      gutil.log(gutil.colors.red('The file ' + sources[i] + ' not exist, maybe cause postfix deviation'));
    }
  }

  if (postfix === 'md5') {
    var hash = crypto.createHash('md5');
    for (var j = 0; j < content.length; j++) {
      hash.update(content[j]);
    }
    return '?' + hash.digest('hex');
  }

  if (typeof postfix === 'function') {
    var buffer = new Buffer(0);
    for (var k = 0; k < content.length; k++) {
      buffer = Buffer.concat([buffer, content[k]]);
    }
    return '?' + postfix.call(null, buffer).toString().replace(/\s*/g, '');
  }

  return '';
};

/**
 * resolve the HTML block, replace, remove, or add specific tags
 * @param {block} block - typical block
 * @param {Object} options - plugin argument object
 * @returns {String}
 */
utils.generateTags = function(block, options) {
  if (!startMirrorReg.test(block)) return block;
  if (utils._script.indexOf(utils.getBlockType(block)) !== -1) return '<script src="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"></script>';
  if (utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1) return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"/>';
  if (utils.getBlockType(block) === 'replace') {
    if (path.extname(utils.getBlockPath(block)) === '.js') return '<script src="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"></script>';
    if (path.extname(utils.getBlockPath(block)) === '.css') return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"/>';
  }
  if (utils.getBlockType(block) === 'remove') return null;
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
    var type = sources[i].type;
    var destiny = path.join('./', sources[i].destiny);
    var files = sources[i].files.map(function(value) {
      return path.join(process.cwd(), value);
    });
    if (files.length !== 0 && type !== 'replace' && destiny) {
      var parser = options[sources[i].type];
      if (!parser || parser.length === 0)  {
        utils.pathTraverse(files).pipe(utils.concat(destiny)).pipe(vfs.dest(path.join('./', options.directory)));
      }
      if (parser && parser.length !== 0) {
        utils.pathTraverse(files, parser).pipe(utils.concat(destiny)).pipe(vfs.dest(path.join('./', options.directory)));
      }
    }
  }
};

/**
 * resolve the HTML file, replace, remove, or add specific tags
 * @param {Array} blocks - array consist of block
 * @param {Object} options - plugin argument object
 * @returns {String}
 */
utils.resolveSourceToDestiny = function(blocks, options) {
  var result = blocks.map(function(block) {
    return utils.generateTags(block, options);
  });

  return result.join('\n');
};

utils.prerenderOriginPath = function(originPath, debug) {
  if (util.isString(originPath)) return !debug ? [path.join('./', originPath)] : [path.join('./', 'test/fixture/', originPath)];
  if (util.isArray(originPath)) {
    return originPath.map(function(value) {
      return !debug ? path.join('./', value) : path.join('./', 'test/fixture/', value);
    });
  }
};

/**
 * resolve source files through pipeline and return final transform stream
 * @param {Array} originPath - array consist of source file path
 * @param {Array} flow - array consist of transform stream, like [less(),cssmin()], or [coffee(), uglify()]
 * @returns {Object} - transform stream
 */
utils.pathTraverse = function(originPath, flow) {
  let destinyPath = utils.prerenderOriginPath(originPath);
  var stream = vfs.src(destinyPath);
  if (util.isArray(flow)) {
    for (var i = 0; i < flow.length; i++) {
      stream = stream.pipe(flow[i]);
    }
  }

  return stream;
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
utils.escape = function(string) {
  return string.replace(/[\n\s]*/gi, '');
};

/**
 * @description - transform stream into promise, the value concat all the content
 * @param stream
 * @returns {Object} - return promise actually
 */
utils.streamToPromise = function(stream) {
  if (util.isUndefined(stream.pipe)) return Promise.reject('argument is not stream');

  return new Promise(function(resolve, reject) {
    var destiny = new Buffer('');

    stream.pipe(through(function(file, encoding, callback) {
      destiny = Buffer.concat([destiny, file.contents || file]);
      callback();
    }, function(callback) {
      resolve(destiny);
      callback();
    }));
  });
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

// exports the object
module.exports = utils;