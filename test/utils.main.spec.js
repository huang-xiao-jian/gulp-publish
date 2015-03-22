"use strict";

var vfs = require('vinyl-fs');
var utils = require('../utils/utils.js');
var should = require('should');

describe('utils split method', function () {
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
});

describe('utils generateTags method', function () {
  it('should resolve block into final tags when normal HTML tags only', function () {
    let normal = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';
    utils.generateTags(normal).should.equal(normal);
  });

  it('should resolve block into final tags when css reference', function () {
    let stylesheet = '<!-- build:css /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when js reference', function () {
    let scripts = '<!-- build:js /script/build.js --><!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags when replace reference with js extension', function () {
    let scripts = '<!-- build:replace /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags when replace reference with css extension', function () {
    let stylesheet = '<!-- build:replace /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css">\n<!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when remove reference', function () {
    let remove = '<!-- build:remove /script/build.js --><script src="/script/origin.js"></script><!-- endbuild -->';
    should(utils.generateTags(remove, {})).equal(null);
  });

  it('should resolve block into null when uncertain reference', function () {
    let anything = '<!-- build:anything /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css">\n<!-- endbuild -->';
    let stylesheet = '<!-- build:replace /style/build.less -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css">\n<!-- endbuild -->';
    should(utils.generateTags(anything, {})).equal(null);
    should(utils.generateTags(stylesheet, {})).equal(null);
  });
});

describe('utils main resolve methods', function () {
  const NormalExpect = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title><link rel="stylesheet" href="/style/build.css"/><script src="/script/build.js"></script></head><body></body></html>';

  const RemoveExpect = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';

  it('should resolve source into destiny', function () {
    let stream = vfs.src('./test/fixture/normal.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks, {});
      utils.escape(result).should.equal(utils.escape(NormalExpect));
    });
  });

  it('should resolve source into destiny when add tags', function () {
    let stream = vfs.src('./test/fixture/add.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks, {});
      utils.escape(result).should.equal(utils.escape(NormalExpect));
    });
  });

  it('should resolve source into destiny when remove tags', function () {
    let stream = vfs.src('./test/fixture/remove.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks, {});
      utils.escape(result).should.equal(utils.escape(RemoveExpect));
    });
  });
});