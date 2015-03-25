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
var endMirrorReg = /<!--\s*endbuild\s*-->/i;
var splitReg = /<!--\s+split\s+-->/gim;
var jsReg = /<\s*script\s+.*?src\s*=\s*("|')([^"']+?)\1.*?><\s*\/\s*script\s*>/i;
var cssReg = /<\s*link\s+.*?href\s*=\s*("|')([^"']+)\1.*?>/i;
var spaceReg = /^\s*$/;
var typeReg = /<!--\s+build:(\w+)\s+\/?[^\s]+\s+-->/i;
var pathReg = /<!--\s+build:\w+\s+(\/?[^\s]+)\s+-->/i;
var utils = {};

// supported file type
utils._stylesheet = ['css', 'less', 'stylus', 'sass'];
utils._script = ['js', 'coffee', 'typescript', 'jsx'];

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
 * execute for file target path
 * @param {String} script
 * @returns {String}
 * @example
 * // return "/js/origin.js"
 * utils.getScriptPath('<script src="/js/origin.js"></script>');
 */
utils.getScriptPath = function(script) {
  if (jsReg.test(script)) return jsReg.exec(script.replace(/^\s*/, ''))[2];
  gutil.log(gutil.colors.green('failed resolve source path from'), gutil.colors.green(script), 'the block type refers script', '\n');
  return null;
};

/**
 * execute for file target path
 * @param {String} link
 * @returns {String}
 * @example
 * // return "/style/origin.css"
 * utils.getLinkPath('<link rel="stylesheet" href="/style/origin.css">')
 */
utils.getLinkPath = function(link) {
  if (cssReg.test(link)) return cssReg.exec(link.replace(/^\s*/, ''))[2];
  gutil.log(gutil.colors.green('failed resolve source path from'), gutil.colors.green(link), 'the block type refers link', '\n');
  return null;
};

/**
 * execute for file target path
 * @param {String} line
 * @param {String} mode - the content property, must exists in ['js', 'coffee', 'typescript', 'jsx'], ['css', 'less', 'sass', 'stylus']
 * @returns {String}
 * @see refer {@links utils.getScriptPath}, {@links utils.getLinkPath} for details
 */
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
        case utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1 :
          return utils.getLinkPath(value);
        case utils.getBlockType(block) === 'replace' :
          return utils.getReplacePath(value, path.extname(utils.getBlockPath(block)).slice(1));
        case utils.getBlockType(block) === 'remove' :
          return null;
        default :
          return null;
      }
    })
    .filter(function(value) {
      return value !== null;
    });
};

/**
 * get block description structure
 * @param block
 * @returns {{type: String, destiny: String, files: Array}}
 */
utils.getBlockStructure = function(block) {
  return {
    type: utils.getBlockType(block),
    destiny: utils.getBlockPath(block),
    files: utils.getBlockFilePath(block)
  }
};

/**
 * check if fragment belongs block
 * @param {String} block
 * @returns {boolean}
 */
utils.isBlock = function(block) {
  return startMirrorReg.test(block) && endMirrorReg.test(block);
};

/**
 * execute for source files path
 * @param {Array} blocks - Array consist of block
 * @returns {SourceArray}
 */
utils.getBlockFileSource = function(blocks) {
  return blocks
    .filter(function(block) {
      return utils.isBlock(block);
    })
    .map(function(block) {
      return utils.getBlockStructure(block);
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

  var content;
  var source = !debug ? utils.getBlockFilePath(block) : utils.prerenderOriginPath(utils.getBlockFilePath(block), true);

  content = source.reduce(function(prev, current) {
    try {
      return Buffer.concat([prev, fs.readFileSync(current)]) ;
    } catch (err) {
      gutil.log(gutil.colors.red('The file ' + current + ' not exist, maybe cause postfix deviation'));
      return prev;
    }
  }, new Buffer(''));

  if (util.isFunction(postfix)) {
    return '?' + utils.escape(postfix.call(null, content));
  }

  if (postfix === 'md5') {
    var hash = crypto.createHash('md5');
    hash.update(content);
    return '?' + hash.digest('hex');
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
  switch (true) {
    case !utils.isBlock(block):
      return block;
    case utils._script.indexOf(utils.getBlockType(block)) !== -1 :
      return '<script src="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"></script>';
    case utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1 :
      return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"/>';
    case utils.getBlockType(block) === 'replace' && path.extname(utils.getBlockPath(block)) === '.js' :
      return '<script src="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"></script>';
    case utils.getBlockType(block) === 'replace' && path.extname(utils.getBlockPath(block)) === '.css' :
      return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + utils.resolvePostfix(options.postfix, block, options.debug) + '"/>';
    case utils.getBlockType(block) === 'remove' :
      return null;
    default :
      return null;
  }
};

/**
 * resolve linked source files and output
 * @param {SourceArray} sources
 * @param {Object} options
 * @returns {boolean}
 */
utils.resolveFileSource = function(sources, options) {
  if (!sources || !options) return false;

  sources = sources.filter(function(value) {
    return (utils._script.indexOf(value.type) !== -1 || utils._stylesheet.indexOf(value.type) !== -1) && value.files.length !== 0 && value.destiny;
  });

  if (sources.length === 0) return false;

  for (var i = 0; i < sources.length; i++) {
    var parser = options[sources[i].type];
    var files = sources[i].files;
    var destiny = path.join('./', sources[i].destiny);
    var stream;
    if (!parser || parser.length === 0)  {
      stream = utils.pathTraverse(files, null, options.debug).pipe(utils.concat(destiny)).pipe(vfs.dest(path.join('./', options.directory)));
    } else {
      stream = utils.pathTraverse(files, parser, options.debug).pipe(utils.concat(destiny)).pipe(vfs.dest(path.join('./', options.directory)));
    }
    stream.on('end', function() {
      var notify = options.notify;
      notify ? notify.Trigger.emit(notify.Event) : utils.noop();
    });
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
 * @param {Boolean} debug
 * @returns {Object} - transform stream
 */
utils.pathTraverse = function(originPath, flow, debug) {
  var destinyPath = utils.prerenderOriginPath(originPath, debug);
  var stream = vfs.src(destinyPath);
  if (util.isArray(flow)) {
    for (var i = 0; i < flow.length; i++) {
      var generator = flow[i][0];
      var options = flow[i][1];
      stream = stream.pipe(generator(options));
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
  return string.toString().replace(/[\n\s]*/gi, '');
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

/**
 * just a noop function
 */
utils.noop = function() {};

// exports the object
module.exports = utils;