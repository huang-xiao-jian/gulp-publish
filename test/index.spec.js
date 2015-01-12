var gulp = require('gulp');
var should = require('should');
var path = require('path');
var fs = require('fs');
var through = require('through-gulp');

var publish = require('../index.js');
var utils = require('../utils/utils.js');

var cssmin = require('gulp-cssmin');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var coffee = require('gulp-coffee');

var fileInspector = function(path) {
  return function() {
    return fs.readFileSync(path);
  }
};

describe('plugin module', function () {
  it('should not resolve any files when disabled', function (done) {
    gulp.src('./test/fixture/source.html')
      .pipe(publish({
        enableResolve: false
      }))
      .pipe(gulp.dest('./build'));

    setTimeout(function() {
      (fileInspector(path.join(process.cwd(), './build/script/build.js'))).should.throw();
      done();
    }, 100);
  });

  it('should emit error event when pass stream', function (done) {
    gulp.src('test/fixture/source.html', { buffer: false })
      .pipe(publish())
      .on('error', function(err) {
        err.message.should.equal('Streams are not supported!');
        done();
      });
  });

  it('should resolve stylesheet, javascript files when enabled', function (done) {
    var expectedJs = 'angular.module("cloud",[]);angular.module("cloud").controller("MainCtrl",function(){});';
    var expectedCss = 'body{font-size:16px}body{overflow:hidden}';

    gulp.src('./test/fixture/source.html')
      .pipe(publish({
        enableResolve: true,
        css: [{
          generator: cssmin
        }],
        js: [{
          generator: uglify
        }],
        debug: true
      }))
      .pipe(gulp.dest('./build'));

    setTimeout(function() {
      (utils._escape(fs.readFileSync(path.join(process.cwd(), '/build/script/build.js')).toString())).should.equal(utils._escape(expectedJs));
      (utils._escape(fs.readFileSync(path.join(process.cwd(), '/build/style/build.css')).toString())).should.equal(utils._escape(expectedCss));
      done();
    }, 200);
  });

  it('should resolve less files when enabled', function (done) {
    var expectedLess =
      'body { background-color: #000000; } body div { border: solid 1px #ffffff; } body div .form-inline { float: left; }' +
      '.form-control { font-size: 16px; font-weight: 500; }';

    gulp.src('./test/fixture/less.html')
      .pipe(publish({
        enableResolve: true,
        less: [{
          generator: less
        }],
        debug: true
      }))
      .pipe(gulp.dest('./build'));

    setTimeout(function() {
      (utils._escape(fs.readFileSync(path.join(process.cwd(), '/build/style/less.css')).toString())).should.equal(utils._escape(expectedLess));
      done();
    }, 100);
  });

  it('should resolve coffee files when enabled', function (done) {
    var expectedCoffee =
      "(function() { var number, opposite, square; number = 42; opposite = true; if (opposite) { number = -42; } square = function(x) { return x * x; };}).call(this);" +
      "(function() { var math; math = { root: Math.sqrt, square: square, cube: function(x) { return x * square(x); }}; }).call(this);";

    gulp.src('./test/fixture/coffee.html')
      .pipe(publish({
        enableResolve: true,
        coffee: [{
          generator: coffee
        }],
        debug: true
      }))
      .pipe(gulp.dest('./build'));

    setTimeout(function() {
      (utils._escape(fs.readFileSync(path.join(process.cwd(), '/build/script/coffee.js')).toString())).should.equal(utils._escape(expectedCoffee));
      done();
    }, 100);
  });
});