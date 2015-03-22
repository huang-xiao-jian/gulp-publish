"use strict";

var should = require('should');
var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var utils = require('../utils/utils.js');

describe('utils path prerender method', function () {
  const OriginTarget = 'script/origin.js';
  const DebugTarget = 'test/fixture/script/origin.js';

  it('should prerender relative path string', function () {
    utils.prerenderOriginPath('./script/origin.js').should.eql([OriginTarget]);
    utils.prerenderOriginPath('./script/origin.js', true).should.eql([DebugTarget]);
  });

  it('should prerender absolute path string', function () {
    utils.prerenderOriginPath('/script/origin.js').should.eql([OriginTarget]);
    utils.prerenderOriginPath('/script/origin.js', true).should.eql([DebugTarget]);
  });

  it('should prerender relative path array', function () {
    utils.prerenderOriginPath(['./script/origin.js', './script/origin.js']).should.eql([OriginTarget, OriginTarget]);
    utils.prerenderOriginPath(['./script/origin.js', './script/origin.js'], true).should.eql([DebugTarget, DebugTarget]);
  });

  it('should prerender absolute path array', function () {
    utils.prerenderOriginPath(['/script/origin.js', '/script/origin.js']).should.eql([OriginTarget, OriginTarget]);
    utils.prerenderOriginPath(['/script/origin.js', '/script/origin.js'], true).should.eql([DebugTarget, DebugTarget]);
  });

  it('should prerender mixed path array', function () {
    utils.prerenderOriginPath(['./script/origin.js', '/script/origin.js']).should.eql([OriginTarget, OriginTarget]);
    utils.prerenderOriginPath(['./script/origin.js', '/script/origin.js'], true).should.eql([DebugTarget, DebugTarget]);
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
      (utils.escape(value.toString())).should.equal(utils.escape("angular.module('cloud', []);"));
    });
  });

  it('should concat separate file', function () {
    let stream = gulp.src(['./test/fixture/script/origin.js', './test/fixture/script/complex.js']).pipe(utils.concat('build.js'));
    return utils.streamToPromise(stream).then(function(value) {
      utils.escape(value.toString()).should.equal(utils.escape("angular.module('cloud', []);angular.module('cloud').controller('MainCtrl', function() {});"));
    })
  });
});