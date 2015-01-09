var fs = require('vinyl-fs');
var path =require('path');
var through = require('through-gulp');
var gutil = require('gulp-util');

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

utils._stylesheet = ['css', 'less', 'stylus', 'sass'];
utils._script = ['js', 'coffee'];

utils.getSplitBlock = function(string) {
  return string.split(splitReg);
};

utils.getBlockType = function(block) {
  return typeReg.exec(block)[1];
};

utils.getBlockPath = function(block) {
  return pathReg.exec(block)[1];
};

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

utils.resolveSourceToDestiny = function(blocks) {
  var result = blocks.map(function(block) {
    if (!startMirrorReg.test(block)) return block;
    if (utils._script.indexOf(utils.getBlockType(block)) !== -1) return '<script src="' + utils.getBlockPath(block) + '"></script>';
    if (utils._stylesheet.indexOf(utils.getBlockType(block)) !== -1) return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + '"/>';
    if (utils.getBlockType(block) === 'remove') return null;
  });

  return result.join('\n');
};

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

utils.shallowMerge = function(source, destiny) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      destiny[key] = source[key];
    }
  }

  return destiny;
};

utils._escape = function(string) {
  return string.replace(/[\n\s]*/gi, '');
};

module.exports = utils;