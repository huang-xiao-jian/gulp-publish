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
      if (utils.getBlockType(block) === 'js') return jsReg.exec(value.replace(/^\s*/, ''))[2];
      if (utils.getBlockType(block) === 'css') return cssReg.exec(value.replace(/^\s*/, ''))[2];
    });
};

utils.resolveSourceToDestiny = function(blocks) {
  var result = blocks.map(function(block) {
    if (!startMirrorReg.test(block)) return block;
    if (utils.getBlockType(block) === 'js') return '<script src="' + utils.getBlockPath(block) + '"></script>';
    if (utils.getBlockType(block) === 'css') return '<link rel="stylesheet" href="' + utils.getBlockPath(block) + '"/>';
  });

  return result.join('\n');
};

utils._escape = function(string) {
  return string.replace(/[\n\s]*/gi, '');
};

module.exports = utils;