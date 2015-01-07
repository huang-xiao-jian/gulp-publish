var should = require('should');
var gulp = require('gulp');
var through = require('through-gulp');
var utils = require('../utils/utils.js');

describe('utils module', function () {
  var StyleComment = '<!-- build:css /style/build.css --><link type="text/css" href="/style/origin.css"><!-- endbuild -->';
  var StyleMirrorComment = '<!-- build:css ./style/build.css --><link type="text/css" href="/style/origin.css"><!-- endbuild -->';
  var ScriptComment = '<!-- build:js /style/build.js --><script src="/script/origin.js></script><!-- endbuild -->';
  var LessComment = '<!-- build:less /style/build.css --><link type="text/css" href="/style/origin.less"><!-- endbuild -->';

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

  it('should split html into blocks', function (done) {
    var expected = [
      '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>',
      '<!-- build:css /style/build.css --><link rel="stylesheet" href="/style/origin.css"><link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->',
      '<!-- build:js /script/build.js --><script src="/script/origin.js"></script><script src="/script/complex.js"></script><!-- endbuild -->',
      '</head><body></body></html>'
    ];
    gulp.src('./test/fixture/source.html')
      .pipe(through(function(file, enc, callback) {
        var result = utils.getSplitBlock(file.contents.toString());
        (utils._escape(result[0])).should.equal(utils._escape(expected[0]));
        (utils._escape(result[1])).should.equal(utils._escape(expected[1]));

        (utils._escape(result[2])).should.equal(utils._escape(expected[2]));
        (utils._escape(result[3])).should.equal(utils._escape(expected[3]));
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it.skip('should resolve file path from blocks', function (done) {
    var ScriptPath = ['/script/origin.js', '/script/complex.js'];
    var StylePath = ['/style/origin.css', '/script/complex.css'];
    gulp.src('./test/fixture/source.html')
      .pipe(through(function(file, enc, callback) {
        var expected = [
          '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>',
          '<!-- build:css /style/build.css --><link rel="stylesheet" href="/style/origin.css"><link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->',
          '<!-- build:js /style/build.js --><script src="/script/origin.js"></script><script src="/script/complex.js"></script><!-- endbuild -->',
          '</head><body></body></html>'
        ];
        var result = utils.getSplitBlock(file.contents.toString());
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should resolve source into destiny', function (done) {
    gulp.src('./test/fixture/source.html')
      .pipe(through(function(file, enc, callback) {
        var expected =
          '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
          '<link rel="stylesheet" href="/style/build.css"/>' +
          '<script src="/script/build.js"></script>' +
          '</head><body></body></html>';

        var blocks = utils.getSplitBlock(file.contents.toString());
        var result = utils.resolveSourceToDestiny(blocks);
        (utils._escape(result)).should.equal(utils._escape(expected));
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should resolve source into destiny when add tags', function (done) {
    gulp.src('./test/fixture/special.html')
      .pipe(through(function(file, enc, callback) {
        var expected =
          '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
          '<link rel="stylesheet" href="/style/build.css"/>' +
          '<script src="/script/build.js"></script>' +
          '</head><body></body></html>';

        var blocks = utils.getSplitBlock(file.contents.toString());
        var result = utils.resolveSourceToDestiny(blocks);
        (utils._escape(result)).should.equal(utils._escape(expected));
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });
});