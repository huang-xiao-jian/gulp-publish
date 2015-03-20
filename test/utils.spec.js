"use strict";

var should = require('should');
var gulp = require('gulp');
var through = require('through-gulp');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var utils = require('../utils/utils.js');

describe('utils module', function () {
  var StyleComment = '<!-- build:css /style/build.css --><link type="text/css" href="/style/origin.css"><!-- endbuild -->';
  var StyleMirrorComment = '<!-- build:css ./style/build.css --><link type="text/css" href="/style/origin.css"><!-- endbuild -->';
  var ScriptComment = '<!-- build:js /style/build.js --><script src="/script/origin.js></script><!-- endbuild -->';
  var LessComment = '<!-- build:less /style/build.css --><link type="text/css" href="/style/origin.less"><!-- endbuild -->';

  it('should merge object', function () {
    var source = {
      title: 'story',
      content: 'never say goodbye'
    };

    var destiny = {
      title: 'love'
    };

    (utils.shallowMerge(source, destiny)).should.eql({
      title: 'story',
      content: 'never say goodbye'
    })
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

  it('should get file path from blocks', function (done) {
    gulp.src('./test/fixture/source.html')
      .pipe(through(function(file, enc, callback) {
        var blocks = utils.getSplitBlock(file.contents.toString());
        var result = utils.getFileSource(blocks);
        result[0].should.eql({
          type: 'css',
          destiny: '/style/build.css',
          files: ['/style/origin.css', '/style/complex.css']
        });

        result[1].should.eql({
          type: 'js',
          destiny: '/script/build.js',
          files: ['/script/origin.js', '/script/complex.js']
        });

        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should get file path from empty blocks', function (done) {
    gulp.src('./test/fixture/special.html')
      .pipe(through(function(file, enc, callback) {
        var blocks = utils.getSplitBlock(file.contents.toString());
        var result = utils.getFileSource(blocks);
        result[0].should.eql({
          type: 'css',
          destiny: '/style/build.css',
          files: []
        });

        result[1].should.eql({
          type: 'js',
          destiny: '/script/build.js',
          files: []
        });

        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should resolve fixed postfix', function () {
    var block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    utils.resolvePostfix('v0.2.5', block, true).should.equal('?v0.2.5');
  });

  it('should resolve function postfix', function () {
    var block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    var postfix = function() { return 'love is complicated'};
    var mirrorPostfix = function(buffer) { return buffer.length };
    var length = fs.readFileSync(path.join(process.cwd(), '/test/fixture/script/origin.js')).length + fs.readFileSync(path.join(process.cwd(), '/test/fixture/script/complex.js')).length;
    utils.resolvePostfix(postfix, block, true).should.equal('?loveiscomplicated');
    utils.resolvePostfix(mirrorPostfix, block, true).should.equal('?' + length.toString());
  });

  it('should resolve md5 postfix', function () {
    var block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    var hash = crypto.createHash('md5');
    hash.update(fs.readFileSync(path.join(process.cwd(), '/test/fixture/script/origin.js')));
    hash.update(fs.readFileSync(path.join(process.cwd(), '/test/fixture/script/complex.js')));
    utils.resolvePostfix('md5', block, true).should.equal('?' + hash.digest('hex'));
  });

  it('should resolve null un-supported postfix', function () {
    var block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    utils.resolvePostfix({}, block, true).should.equal('');
  });

  it('should resolve block into final tags when normal HTML tags only', function () {
    var normal = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';
    utils.generateTags(normal).should.equal(normal);
  });

  it('should resolve block into final tags when css reference', function () {
    var stylesheet = '<!-- build:css /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when js reference', function () {
    var scripts = '<!-- build:js /script/build.js --><!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags when remove reference', function () {
    var remove = '<!-- build:remove /script/build.js --><script src="/script/origin.js"></script><!-- endbuild -->';
    (utils.generateTags(remove, {}) === null).should.be.true;
  });

  it('should resolve block into final tags when replace reference', function () {
    var scripts = '<!-- build:replace /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->';
    utils.generateTags(scripts, { postfix: 'md5', debug: true}).should.equal('<script src="/script/build.js?761b2346e32d7ce46a1a4a76ccda0b2c"></script>');
  });

  it('should resolve block into final tags when replace reference', function () {
    var stylesheet = '<!-- build:replace /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css">\n<!-- endbuild -->';
    utils.generateTags(stylesheet, { postfix: 'md5', debug: true }).should.equal('<link rel="stylesheet" href="/style/build.css?26ea1a2fe8faf4cdcf774344a6b70fc5"/>');
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
        var result = utils.resolveSourceToDestiny(blocks, {postfix: ''});
        (utils._escape(result)).should.equal(utils._escape(expected));
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should not resolve source files when miss sources or options', function () {
    var sources = [{
      type: 'js',
      destiny: 'script/build.js',
      files: ['test/fixture/script/origin.js', 'test/fixture/script/complex.js']
    }];

    (utils.resolveFileSource()).should.be.false;
    (utils.resolveFileSource(sources)).should.be.false;
  });

  it('should resolve source files into destiny', function (done) {
    var sources = [
      {
        type: 'js',
        destiny: 'script/build.js',
        files: ['test/fixture/script/origin.js', 'test/fixture/script/complex.js']
      },
      {
        type: 'css',
        destiny: 'style/build.css',
        files: ['test/fixture/style/origin.css', 'test/fixture/style/complex.css']
      }
    ];

    function generateLess() {
      return through(function(file, enc, callback) {
        callback(null, file);
      });
    }

    var options = {
      js: [{
        generator: generateLess
      }],
      css: [{
        generator: generateLess
      }],
      directory: './build',
      debug: true
    };

    utils.resolveFileSource(sources, options);

    setTimeout(function() {
      var content;
      content = utils._escape(fs.readFileSync(path.join(process.cwd(), './build/script/build.js')).toString());
      content.should.equal(utils._escape("angular.module('cloud', []);angular.module('cloud').controller('MainCtrl', function() {});"));
      content = utils._escape(fs.readFileSync(path.join(process.cwd(), './build/style/build.css')).toString());
      content.should.equal(utils._escape("body { font-size: 16px; } body { overflow: hidden;}"));
      done();
    }, 100);
  });

  it('should concat source files when un-declared', function (done) {
    var sources = [
      {
        type: 'js',
        destiny: 'script/build.js',
        files: ['test/fixture/script/origin.js', 'test/fixture/script/complex.js']
      },
      {
        type: 'css',
        destiny: 'style/build.css',
        files: ['test/fixture/style/origin.css', 'test/fixture/style/complex.css']
      }
    ];

    var options = {
      directory: './build',
      debug: true
    };

    utils.resolveFileSource(sources, options);

    setTimeout(function () {
      var content;
      content = utils._escape(fs.readFileSync(path.join(process.cwd(), './build/script/build.js')).toString());
      content.should.equal(utils._escape("angular.module('cloud', []);angular.module('cloud').controller('MainCtrl', function() {});"));
      content = utils._escape(fs.readFileSync(path.join(process.cwd(), './build/style/build.css')).toString());
      content.should.equal(utils._escape("body { font-size: 16px; } body { overflow: hidden;}"));
      done();
    }, 100);
  });

  it('should concat separate file', function (done) {
    gulp.src(['./test/fixture/script/origin.js', './test/fixture/script/complex.js'])
      .pipe(utils.concat('build.js'))
      .pipe(through(function(file, enc, callback) {
        utils._escape(file.contents.toString()).should.equal(utils._escape("angular.module('cloud', []);angular.module('cloud').controller('MainCtrl', function() {});"));
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
        var result = utils.resolveSourceToDestiny(blocks, {postfix: ''});
        (utils._escape(result)).should.equal(utils._escape(expected));
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should resolve source into destiny when remove tags', function (done) {
    gulp.src('./test/fixture/special.html')
      .pipe(through(function(file, enc, callback) {
        var expected =
          '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
          '<link rel="stylesheet" href="/style/build.css"/>' +
          '<script src="/script/build.js"></script>' +
          '</head><body></body></html>';

        var blocks = utils.getSplitBlock(file.contents.toString());
        var result = utils.resolveSourceToDestiny(blocks, {postfix: ''});
        (utils._escape(result)).should.equal(utils._escape(expected));
        callback();
      }, function(callback) {
        callback();
        done();
      }))
  });

  it('should transform stream into promise', function () {
    var stream = fs.createReadStream(path.join(__dirname, 'fixture/script/origin.js'));
    var destiny = utils.streamToPromise(stream);
    return destiny.then(function(value) {
      (value.toString()).should.equal("angular.module('cloud', []);");
    });
  });
});

describe('utils block information collection', function () {
  var StyleComment = '<!-- build:css /style/build.css -->\n<link type="text/css" href="/style/origin.css">\n<!-- endbuild -->';
  var StyleMirrorComment = '<!-- build:css ./style/build.css -->\n<link type="text/css" href="/style/origin.css">\n<!-- endbuild -->';
  var ScriptComment = '<!-- build:js /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  var LessComment = '<!-- build:less /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';

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

describe('utils line path collection', function () {
  var scriptComment = '<script src="/script/origin.js"></script>';
  var linkScript = '<link rel="stylesheet" href="/style/origin.css">';
  var scriptPathSampleA = path.join('script/origin.js');
  var scriptPathSampleB = path.join('test/fixture/script/origin.js');
  var linkPathSampleA = path.join('style/origin.css');
  var linkPathSampleB = path.join('test/fixture/style/origin.css');

  it('should get script path', function () {
    utils.getScriptPath(scriptComment).should.equal(scriptPathSampleA);
    utils.getScriptPath(scriptComment, true).should.equal(scriptPathSampleB)
  });

  it('should get link path', function () {
    utils.getLinkPath(linkScript).should.equal(linkPathSampleA);
    utils.getLinkPath(linkScript, true).should.equal(linkPathSampleB);
  });

  it('should get uncertain path', function () {
    utils.getReplacePath(scriptComment, '.js').should.equal(scriptPathSampleA);
    utils.getReplacePath(scriptComment, '.js', true).should.equal(scriptPathSampleB);
    utils.getReplacePath(linkScript, '.css').should.equal(linkPathSampleA);
    utils.getReplacePath(linkScript, '.css', true).should.equal(linkPathSampleB);
  });
});

describe.only('utils block file path collection', function () {
  var scriptPathSampleA = path.join('script/origin.js');
  var scriptPathSampleB = path.join('test/fixture/script/origin.js');
  var scriptPathSampleC = path.join('script/complex.js');
  var scriptPathSampleD = path.join('test/fixture/script/complex.js');
  var linkPathSampleA = path.join('style/origin.css');
  var linkPathSampleB = path.join('test/fixture/style/origin.css');
  var linkPathSampleC = path.join('style/complex.css');
  var linkPathSampleD = path.join('test/fixture/style/complex.css');

  it('should resolve source file path from script block', function () {
    let block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([scriptPathSampleA, scriptPathSampleC]);
    utils.getFilePath(block, true).should.eql([scriptPathSampleB, scriptPathSampleD]);
  });

  it('should resolve source file path from link block', function () {
    let block =  '<!-- build:css /style/build.css -->\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<link rel="stylesheet" href="/style/complex.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([linkPathSampleA, linkPathSampleC]);
    utils.getFilePath(block, true).should.eql([linkPathSampleB, linkPathSampleD]);
  });

  it('should resolve script file path from mixed block', function () {
    let block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([scriptPathSampleA]);
    utils.getFilePath(block, true).should.eql([scriptPathSampleB]);
  });

  it('should resolve link file path from mixed block', function () {
    let block =  '<!-- build:css /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([linkPathSampleA]);
    utils.getFilePath(block, true).should.eql([linkPathSampleB]);
  });

  it('should resolve remove file path from mixed block', function () {
    let block =  '<!-- build:remove /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([]);
    utils.getFilePath(block, true).should.eql([])
  });

  it('should resolve replace file path from script block', function () {
    var block =  '<!-- build:replace /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([scriptPathSampleA, scriptPathSampleC]);
    utils.getFilePath(block, true).should.eql([scriptPathSampleB, scriptPathSampleD]);
  });

  it('should resolve replace file path from block', function () {
    let block =  '<!-- build:replace /style/build.css -->\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<link rel="stylesheet" href="/style/complex.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([linkPathSampleA, linkPathSampleC]);
    utils.getFilePath(block, true).should.eql([linkPathSampleB, linkPathSampleD]);
  });

  it('should resolve replace file path from mixed block', function () {
    var block =  '<!-- build:replace /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([scriptPathSampleA]);
    utils.getFilePath(block, true).should.eql([scriptPathSampleB]);
  });

  it('should resolve replace file path from mixed block', function () {
    let block =  '<!-- build:replace /script/build.css -->\n' + '<script src="/script/origin.js"></script>\n' + '<link rel="stylesheet" href="/style/origin.css">\n' + '<!-- endbuild -->\n';
    utils.getFilePath(block).should.eql([linkPathSampleA]);
    utils.getFilePath(block, true).should.eql([linkPathSampleB]);
  });
});

describe('utils path traverse method', function () {
  var generatePassStream = function() {
    return through(function(file, enc, callback) {
      file.contents = Buffer.concat([new Buffer('PASS '), file.contents]);
      callback(null, file);
    });
  };

  it('should achieve path traverse', function () {
    let stream = utils.pathTraverse(['test/fixture/script/origin.js'], [generatePassStream()]);
    let promise = utils.streamToPromise(stream);
    return promise.then(function(value) {
      value.toString().should.equal("PASS angular.module('cloud', []);");
    });
  });

  it('should achieve just pass through stream when flow miss ', function () {
    let stream = utils.pathTraverse(['test/fixture/script/origin.js']);
    let promise = utils.streamToPromise(stream);
    return promise.then(function(value) {
      value.toString().should.equal("angular.module('cloud', []);");
    });
  });
});

describe('utils path prerender method', function () {
  var targetA = path.join('script/origin.js');
  var targetB = path.join('test/fixture/script/origin.js');

  it('should prerender relative path string', function () {
    utils.prerenderOriginPath('./script/origin.js').should.eql([targetA]);
    utils.prerenderOriginPath('./script/origin.js', true).should.eql([targetB]);
  });

  it('should prerender relative path string', function () {
    utils.prerenderOriginPath('/script/origin.js').should.eql([targetA]);
    utils.prerenderOriginPath('/script/origin.js', true).should.eql([targetB]);
  });

  it('should prerender relative path array', function () {
    utils.prerenderOriginPath(['./script/origin.js', './script/origin.js']).should.eql([targetA, targetA]);
    utils.prerenderOriginPath(['./script/origin.js', './script/origin.js'], true).should.eql([targetB, targetB]);
  });

  it('should prerender absolute path array', function () {
    utils.prerenderOriginPath(['/script/origin.js', '/script/origin.js']).should.eql([targetA, targetA]);
    utils.prerenderOriginPath(['/script/origin.js', '/script/origin.js'], true).should.eql([targetB, targetB]);
  });

  it('should prerender mixed path array', function () {
    utils.prerenderOriginPath(['./script/origin.js', '/script/origin.js']).should.eql([targetA, targetA]);
    utils.prerenderOriginPath(['./script/origin.js', '/script/origin.js'], true).should.eql([targetB, targetB]);
  });
});