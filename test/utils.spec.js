var should = require('should');
var utils = require('../utils/utils.js');

var StyleComment = '<!-- build:css /style/build.css -->'
                 + '<link type="text/css" href="/style/origin.css">'
                 + '<!-- endbuild -->';
var scriptComment = '<!-- build:js /style/build.js -->'
                 + '<script src="/script/origin.js></script>'
                 + '<!-- endbuild -->';
var LessComment = '<!-- build:less /style/build.css -->'
                 + '<link type="text/css" href="/style/origin.less">'
                 + '<!-- endbuild -->';