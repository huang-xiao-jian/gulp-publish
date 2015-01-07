//var startReg = /<!--\s*build:(\w+)(?:(?:\(([^\)]+?)\))?\s+(\/?([^\s]+?))?)?\s*-->/gim;
//var endReg = /<!--\s*endbuild\s*-->/gim;
//var jsReg = /<\s*script\s+.*?src\s*=\s*("|')([^"']+?)\1.*?><\s*\/\s*script\s*>/gi;
//var cssReg = /<\s*link\s+.*?href\s*=\s*("|')([^"']+)\1.*?>/gi;
//var cssMediaReg = /<\s*link\s+.*?media\s*=\s*("|')([^"']+)\1.*?>/gi;

var typeReg = /<!--\s+build:(\w+)\s+\/?[^\s]+\s+-->/i;
var pathReg = /<!--\s+build:\w+\s+(\/?[^\s]+)\s+-->/i;
var utils = {};

utils.getBlockType = function(string) {
  return typeReg.exec(string)[1];
};

utils.getBlockPath = function(string) {
  return pathReg.exec(string)[1];
};

module.exports = utils;