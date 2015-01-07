var should = require('should');
var utils = require('../utils/utils.js');

describe('utils module', function () {
  var StyleComment = '<!-- build:css /style/build.css -->'
                   + '<link type="text/css" href="/style/origin.css">'
                   + '<!-- endbuild -->';

  var StyleMirrorComment = '<!-- build:css ./style/build.css -->'
                         + '<link type="text/css" href="/style/origin.css">'
                         + '<!-- endbuild -->';

  var ScriptComment = '<!-- build:js /style/build.js -->'
                    + '<script src="/script/origin.js></script>'
                    + '<!-- endbuild -->';

  var LessComment = '<!-- build:less /style/build.css -->'
                  + '<link type="text/css" href="/style/origin.less">'
                  + '<!-- endbuild -->';

  it('should get js type', function () {
    utils.getBlockType(StyleComment).should.equal('css');
  });

  it('should get css type', function () {
    utils.getBlockType(ScriptComment).should.equal('js');
  });

  it('should get other type', function () {
    utils.getBlockType(LessComment).should.equal('less');
  });

  it('should get absolute destiny path', function () {
    utils.getBlockPath(StyleComment).should.equal('/style/build.css');
  });

  it('should get relative destiny path', function () {
    utils.getBlockPath(StyleMirrorComment).should.equal('./style/build.css');
  });
});