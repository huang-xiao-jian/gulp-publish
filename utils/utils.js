var startReg = /<!--\s*build:(\w+)(?:(?:\(([^\)]+?)\))?\s+(\/?([^\s]+?))?)?\s*-->/gim;
var endReg = /<!--\s*endbuild\s*-->/gim;
var jsReg = /<\s*script\s+.*?src\s*=\s*("|')([^"']+?)\1.*?><\s*\/\s*script\s*>/gi;
var cssReg = /<\s*link\s+.*?href\s*=\s*("|')([^"']+)\1.*?>/gi;
var cssMediaReg = /<\s*link\s+.*?media\s*=\s*("|')([^"']+)\1.*?>/gi;
var startCondReg = /<!--\[[^\]]+\]>/gim;
var endCondReg = /<!\[endif\]-->/gim;

var utils = {};

utils.getBlockType = function() {}

