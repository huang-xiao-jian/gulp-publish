"use strict";

var vfs = require('vinyl-fs');
var should = require('should');
var publish = require('../index.js');
var utils = require('../utils/utils.js');

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
});