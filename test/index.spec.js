"use strict";

var fs = require('fs');
var vfs = require('vinyl-fs');
var should = require('should');
var publish = require('../index.js');
var utils = require('../utils/utils.js');
var EventEmitter = require('events');
var uglify = require('gulp-uglify');
var coffee = require('gulp-coffee');
var emitter = new EventEmitter();

describe('plugin module', function () {
  it('should emit error event when pass stream', function (done) {
    vfs.src('test/fixture/integrate.html', { buffer: false })
      .pipe(publish())
      .on('error', function(err) {
        err.message.should.equal('Streams are not supported!');
        done();
      });
  });

  it('should generate destination normal mode', function () {
    let stream = vfs.src('test/fixture/integrate.html').pipe(publish());
    let promise = utils.streamToPromise(stream);
    let destination = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>'
      + '<link rel="stylesheet" href="/style/build.css"/><script src="/script/build.js"></script><script src="/script/build.js"></script>'
      + '<link rel="stylesheet" href="/style/build.css"/><script src="/script/build.js"></script></head><body></body></html>';
    return promise.then(function(value) {
      utils.escape(value.toString()).should.equal(utils.escape(destination));
    });
  });

  it('should resolve coffee files when enabled', function (done) {
    var expectedCoffee =
      "(function() { var number, opposite, square; number = 42; opposite = true; if (opposite) { number = -42; } square = function(x) { return x * x; };}).call(this);" +
      "(function() { var math; math = { root: Math.sqrt, square: square, cube: function(x) { return x * square(x); }}; }).call(this);";

    vfs.src('./test/fixture/coffee.html')
      .pipe(publish({
        enableResolve: true,
        coffee: [coffee()],
        debug: true,
        notify: {
          Trigger : emitter,
          Event: 'RESOLVE'
        }
      }))
      .pipe(vfs.dest('./build'));

    emitter.addListener('RESOLVE', function() {
      let value = fs.readFileSync('build/script/coffee.js');
      utils.escape(value.toString()).should.equal(utils.escape(expectedCoffee));
      done();
    });
  });
});