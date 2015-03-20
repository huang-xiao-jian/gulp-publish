"use strict";

var should = require('should');
var gulp = require('gulp');
var through = require('through-gulp');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var utils = require('../utils/utils.js');

describe('utils module', function () {
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
});

describe('utils block description structure', function () {
  it('should resolve block structure', function () {
    let scriptComment = '<!-- build:js /style/build.js -->\n<script src="/script/origin.js"></script>\n<!-- endbuild -->';
    (utils.getBlockStructure(scriptComment)).should.containEql({
      type: 'js',
      destiny: '/style/build.js',
      files: [path.join('script/origin.js')]
    });

    (utils.getBlockStructure(scriptComment, true)).should.containEql({
      type: 'js',
      destiny: '/style/build.js',
      files: [path.join('test/fixture/script/origin.js')]
    })
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

describe('utils helper method', function () {
  it('should merge object', function () {
    let source = { title: 'story', content: 'never say goodbye' };
    let destiny = { title: 'love' };
    (utils.shallowMerge(source, destiny)).should.containEql({ title: 'story', content: 'never say goodbye' })
  });

  it('should escape strings', function () {
    let source = "angular.module('cloud', []);\n";
    (utils.escape(source)).should.equal("angular.module('cloud',[]);")
  });

  it('should transform stream into promise', function () {
    let stream = fs.createReadStream(path.join(__dirname, 'fixture/script/origin.js'));
    let destiny = utils.streamToPromise(stream);
    return destiny.then(function(value) {
      (value.toString()).should.equal("angular.module('cloud', []);");
    });
  });

  it('should concat separate file', function () {
    let stream = gulp.src(['./test/fixture/script/origin.js', './test/fixture/script/complex.js']).pipe(utils.concat('build.js'));
    return utils.streamToPromise(stream).then(function(value) {
      utils.escape(value.toString()).should.equal(utils.escape("angular.module('cloud', []);angular.module('cloud').controller('MainCtrl', function() {});"));
    })
  });
});