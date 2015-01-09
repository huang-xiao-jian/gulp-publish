var gulp = require('gulp');
var should = require('should');
var path = require('path');
var fs = require('fs');

var publish = require('../index.js');
var utils = require('../utils/utils.js');

var cssmin = require('gulp-cssmin');
var uglify = require('gulp-uglify');

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

  it('should resolve any files when enabled', function (done) {
    var expectedJs = 'angular.module("cloud",[]);angular.module("cloud").controller("MainCtrl",function(){});';
    var expectedCss = 'body{font-size:16px}body{overflow:hidden}';

    gulp.src('./test/fixture/source.html')
      .pipe(publish({
        enableResolve: true,
        css: [cssmin({})],
        js: [uglify()],
        debug: true
      }))
      .pipe(gulp.dest('./build'));

    setTimeout(function() {
      (utils._escape(fs.readFileSync(path.join(process.cwd(), '/build/script/build.js')).toString())).should.equal(utils._escape(expectedJs));
      (utils._escape(fs.readFileSync(path.join(process.cwd(), '/build/style/build.css')).toString())).should.equal(utils._escape(expectedCss));
      done();
    }, 100);
  });
});