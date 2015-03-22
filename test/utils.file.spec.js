"use strict";

var fs = require('fs');
var should = require('should');
var utils = require('../utils/utils.js');
var EventEmitter = require('events');
var cssmin = require('gulp-cssmin');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var coffee = require('gulp-coffee');
var through = require('through-gulp');
var emitter = new EventEmitter();

describe('utils path traverse method', function () {
  var generatePassStream = function() {
    return through(function(file, enc, callback) {
      file.contents = Buffer.concat([new Buffer('PASS '), file.contents]);
      callback(null, file);
    });
  };

  it('should achieve just pass through stream when flow miss ', function () {
    let stream = utils.pathTraverse(['test/fixture/script/origin.js']);
    let promise = utils.streamToPromise(stream);
    return promise.then(function(value) {
      value.toString().should.equal("angular.module('cloud', []);");
    });
  });

  it('should achieve path traverse', function () {
    let stream = utils.pathTraverse(['test/fixture/script/origin.js'], [[generatePassStream, {}]]);
    let promise = utils.streamToPromise(stream);
    return promise.then(function(value) {
      value.toString().should.equal("PASS angular.module('cloud', []);");
    });
  });
});

describe('utils resolveFileSource method', function () {
  it('should not resolve source files when miss sources or options', function () {
    let sources = [{
      type: 'js',
      destiny: 'script/build.js',
      files: ['/script/origin.js', '/script/complex.js']
    }];

    let incompatible = [{
      type: 'any',
      destiny: 'script/build.js',
      files: ['/script/origin.js', '/script/complex.js']
    }];

    (utils.resolveFileSource()).should.be.false;
    (utils.resolveFileSource(sources)).should.be.false;
    (utils.resolveFileSource(incompatible, {})).should.be.false;
  });

  it('should concat source files when un-declared', function (done) {
    var expectedJs = "angular.module('cloud',[]);angular.module('cloud').controller('MainCtrl',function(){});";

    let sources = [{
        type: 'js',
        destiny: 'script/normal.concat.js',
        files: ['/script/origin.js', '/script/complex.js']
    }];

    let options = {
      directory: './build',
      debug: true,
      notify: {
        Trigger : emitter,
        Event: 'NORMAL'
      }
    };

    utils.resolveFileSource(sources, options);

    emitter.addListener('NORMAL', function() {
      let value = fs.readFileSync('build/script/normal.concat.js');
      utils.escape(value.toString()).should.equal(utils.escape(expectedJs));
      done();
    });
  });

  it('should compile sources files when declared', function (done) {
    var expectedJs = "(function(){varn,t,c;n=42,t=!0,t&&(n=-42),c=function(n){returnn*n}}).call(this);(function(){varr;r={root:Math.sqrt,square:square,cube:function(r){returnr*square(r)}}}).call(this);"
    let sources = [{
      type: 'coffee',
      destiny: 'script/coffee.compile.js',
      files: ['/script/cloud.coffee', '/script/template.coffee']
    }];

    let options = {
      directory: './build',
      debug: true,
      coffee: [[coffee, {}], [uglify, {}]],
      notify: {
        Trigger : emitter,
        Event: 'COFFEE'
      }
    };

    utils.resolveFileSource(sources, options);

    emitter.addListener('COFFEE', function() {
      let value = fs.readFileSync('build/script/coffee.compile.js');
      utils.escape(value.toString()).should.equal(utils.escape(expectedJs));
      done();
    });
  });

  it('should compile source files when declared', function (done) {
    var expectedCss = "body {background-color: #000}body div {border:1pxsolid#fff}body div .form-inline {float: left}.form-control {font-size: 16px;font-weight: 500}";
    let sources = [{
      type: 'less',
      destiny: 'style/less.compile.css',
      files: ['/style/cloud.less', '/style/template.less']
    }];

    let options = {
      directory: './build',
      debug: true,
      less: [[less, {}], [cssmin, {}]],
      notify: {
        Trigger : emitter,
        Event: 'LESS'
      }
    };

    utils.resolveFileSource(sources, options);

    emitter.addListener('LESS', function() {
      let value = fs.readFileSync('build/style/less.compile.css');
      utils.escape(value.toString()).should.equal(utils.escape(expectedCss));
      done();
    });
  });
});