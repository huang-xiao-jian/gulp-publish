"use strict";

var vfs = require('vinyl-fs');
var utils = require('../utils/utils.js');
var should = require('should');

describe('utils prepare method', function () {
  const StyleComment = '<!-- build:css /style/build.css -->\n<link type="text/css" href="/style/origin.css">\n<!-- endbuild -->';
  const StyleMirrorComment = '<!-- build:css ./style/build.css -->\n<link type="text/css" href="/style/origin.css">\n<!-- endbuild -->';
  const ScriptComment = '<!-- build:js /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  const CoffeeComment = '<!-- build:coffee /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  const LessComment = '<!-- build:less /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';
  const SassComment = '<!-- build:sass /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';
  const StylusComment = '<!-- build:stylus /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';

  it('should split html into blocks', function () {
    let expected = [
      '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>',
      '<!-- build:css /style/build.css --><link rel="stylesheet" href="/style/origin.css"><link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->',
      '<!-- build:js /script/build.js --><script src="/script/origin.js"></script><script src="/script/complex.js"></script><!-- endbuild -->',
      '</head><body></body></html>'
    ];
    let stream = vfs.src('./test/fixture/normal.html');
    return utils.streamToPromise(stream).then(function(value) {
      let result = utils.getSplitBlock(value.toString());
      (utils.escape(result[0])).should.equal(utils.escape(expected[0]));
      (utils.escape(result[1])).should.equal(utils.escape(expected[1]));
      (utils.escape(result[2])).should.equal(utils.escape(expected[2]));
      (utils.escape(result[3])).should.equal(utils.escape(expected[3]));
    });
  });

  it('should get css type', function () {
    utils.getBlockType(StyleComment).should.equal('css');
  });

  it('should get less type', function () {
    utils.getBlockType(LessComment).should.equal('less');
  });

  it('should get sass type', function () {
    utils.getBlockType(SassComment).should.equal('sass');
  });

  it('should get stylus type', function () {
    utils.getBlockType(StylusComment).should.equal('stylus');
  });

  it('should get js type', function () {
    utils.getBlockType(ScriptComment).should.equal('js');
  });

  it('should get coffee type', function () {
    utils.getBlockType(CoffeeComment).should.equal('coffee');
  });

  it('should get absolute destiny path', function () {
    utils.getBlockPath(StyleComment).should.equal('/style/build.css');
  });

  it('should get relative destiny path', function () {
    utils.getBlockPath(StyleMirrorComment).should.equal('./style/build.css');
  });
});

describe('utils generateTags method', function () {
  it('should resolve block into final tags when normal HTML tags only', function () {
    let normal = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';
    utils.generateTags(normal).should.equal(normal);
  });

  it('should resolve block into final tags when css reference with normal type', function () {
    let stylesheet = '<!-- build:css /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when css reference with less type', function () {
    let stylesheet = '<!-- build:less /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when css reference with sass type', function () {
    let stylesheet = '<!-- build:sass /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when css reference with stylus type', function () {
    let stylesheet = '<!-- build:stylus /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when js reference with normal type', function () {
    let scripts = '<!-- build:js /script/build.js --><!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags when js reference with coffee type', function () {
    let scripts = '<!-- build:coffee /script/build.js --><!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags when js reference with normal type and postfix', function () {
    let scripts = '<!-- build:js /script/build.js --><!-- endbuild -->';
    utils.generateTags(scripts, { postfix: 'v0.2.5'}).should.equal('<script src="/script/build.js?v0.2.5"></script>');
  });

  it('should resolve block into final tags when remove reference', function () {
    let remove = '<!-- build:remove /script/build.js --><script src="/script/origin.js"></script><!-- endbuild -->';
    should(utils.generateTags(remove, {})).equal(null);
  });

  it('should resolve block into final tags when replace reference', function () {
    let scripts = '<!-- build:replace /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags with postfix', function () {
    let stylesheet = '<!-- build:replace /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css">\n<!-- endbuild -->';
    utils.generateTags(stylesheet, { postfix: 'v0.2.5', debug: true }).should.equal('<link rel="stylesheet" href="/style/build.css?v0.2.5"/>');
  });
});

describe('utils main resolve methods', function () {
  var normalExpect =
    '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
    '<link rel="stylesheet" href="/style/build.css"/>' +
    '<script src="/script/build.js"></script>' +
    '</head><body></body></html>';

  var removeExpect =
    '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
    '</head><body></body></html>';

  it('should resolve source into destiny', function () {
    let stream = vfs.src('./test/fixture/normal.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks, {});
      utils.escape(result).should.equal(utils.escape(normalExpect));
    });
  });

  it('should resolve source into destiny when add tags', function () {
    let stream = vfs.src('./test/fixture/add.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks, {});
      utils.escape(result).should.equal(utils.escape(normalExpect));
    });
  });

  it('should resolve source into destiny when remove tags', function () {
    let stream = vfs.src('./test/fixture/remove.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks, {});
      utils.escape(result).should.equal(utils.escape(removeExpect));
    });
  });
});