"use strict";

var should = require('should');
var gulp = require('gulp');
var through = require('through-gulp');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var utils = require('../utils/utils.js');

describe('utils module', function () {

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