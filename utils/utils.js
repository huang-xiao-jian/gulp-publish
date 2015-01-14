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
var path =require('path');
var fs = require('fs');
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

/**
 * execute for source files path
 * @param {block} block
 * @param {Boolean} debug - whether execute in unit test environment
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
utils.getFilePath = function(block, debug) {
  return block
    .replace(startReg, '')
    .replace(endReg, '')
    .split('\n')
    .filter(function(value) {
      return !spaceReg.test(value);
    })
    .map(function(value) {
      if (utils._script.indexOf(utils.getBlockType(block)) !== -1) {
        try {
          return !debug ? jsReg.exec(value.replace(/^\s*/, ''))[2] : path.join('./', '/test/fixture', jsReg.exec(value.replace(/^\s*/, ''))[2]);
        } catch (err) {
          gutil.log(gutil.colors.green('failed resolve source path from'), gutil.colors.green(value), '\n');
          return null;
        }
      }
      if (utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1) {
        try {
          return !debug ? cssReg.exec(value.replace(/^\s*/, ''))[2] : path.join('./', '/test/fixture', cssReg.exec(value.replace(/^\s*/, ''))[2]);
        } catch (err) {
          gutil.log(gutil.colors.green('failed resolve source path from'), gutil.colors.green(value), '\n');
          return null;
        }
      }
      if (utils.getBlockType(block) === 'remove') return null;
    })
    .filter(function(value) {
      return value !== null;
    });
};

/**
 * execute for source files path
 * @param {Array} blocks - Array consist of block
 * @param {Boolean} debug - whether execute in unit test environment
 * @returns {SourceArray}
 */
utils.getFileSource = function(blocks, debug) {
  return blocks
    .filter(function(block) {
      return startMirrorReg.test(block);
    })
    .map(function(block) {
      return {
        type: utils.getBlockType(block),
        destiny: utils.getBlockPath(block),
        files: utils.getFilePath(block, debug)
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
    var destiny = path.join('./', sources[i].destiny);
    var files = sources[i].files.map(function(value) {
      return path.join(process.cwd(), value);
    });
    var parser = options[sources[i].type];
    if (files.length === 0 || !destiny) return false;
    if (!parser || parser.length === 0)  {
      utils.pathTraverse(files).pipe(utils.concat(destiny)).pipe(vfs.dest(path.join('./', options.directory)));
    }
    if (parser && parser.length !== 0) {
      utils.pathTraverse(files, parser).pipe(utils.concat(destiny)).pipe(vfs.dest(path.join('./', options.directory)));
    }
  }
};

/**
 * resolve source files through pipeline and return final transform stream
 * @param {Array} originPath - array consist of source file path
 * @param {Array} flow - array consist of transform stream, like [less(),cssmin()], or [coffee(), uglify()]
 * @returns {Object} - transform stream
 */
utils.pathTraverse = function(originPath, flow) {
  var option;
  var stream = vfs.src(originPath);
  if (Array.isArray(flow)) {
    flow = flow.map(function(value) {
      option = value.config || {};
      return value.generator(option);
    });

    for (var i = 0; i < flow.length; i++) {
      stream = stream.pipe(flow[i]);
    }
  }

  return stream;
};

/**
 * resolve the HTML file, replace, remove, or add specific tags
 * @param {Array} blocks - array consist of block
 * @param {Object} options - plugin argument object
 * @returns {String}
 */
utils.resolveSourceToDestiny = function(blocks, options) {
  var result = blocks.map(function(block) {
    if (!startMirrorReg.test(block)) return block;
    if (utils._script.indexOf(utils.getBlockType(block)) !== -1) return '<script src="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"></script>';
    if (utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1) return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"/>';
    if (utils.getBlockType(block) === 'remove') return null;
  });

  return result.join('\n');
};

/**
 * provide for calculate the postfix, e.g 'v0.2.0', 'md5' or just function with concat buffer as first argument
 * @param {String|Function} postfix - the postfix for link href or script src, simple string, 'md5' or just function
 * @param {block} block
 * @param {Boolean} debug - whether debug environment
 * @returns {string} - final postfix
 */
utils.resolvePostfix = function(postfix, block, debug) {
  if (typeof postfix === 'string' && postfix !== 'md5') return !postfix ? '' : '?' + postfix;

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