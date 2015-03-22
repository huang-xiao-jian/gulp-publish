"use strict";

var crypto = require('crypto');
var vfs = require('vinyl-fs');
var utils = require('../utils/utils.js');

describe('utils postfix method', function () {
  const Block =  '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const File = ['test/fixture/script/origin.js', 'test/fixture/script/complex.js'];

  it('should resolve fixed postfix', function () {
    utils.resolvePostfix('v0.2.5', Block, true).should.equal('?v0.2.5');
  });

  it('should resolve function postfix', function () {
    let postfix = function() { return 'love is complicated'};
    utils.resolvePostfix(postfix, Block, true).should.equal('?loveiscomplicated');
  });

  it('should resolve function postfix', function () {
    let postfix = function(buffer) { return buffer.length };
    let stream = vfs.src(File);
    return utils.streamToPromise(stream).then(function(value) {
      utils.resolvePostfix(postfix, Block, true).should.equal('?' + value.length);
    });
  });

  it('should resolve md5 postfix', function () {
    var hash = crypto.createHash('md5');
    let stream = vfs.src(File);
    return utils.streamToPromise(stream).then(function(value) {
      hash.update(value);
      utils.resolvePostfix('md5', Block, true).should.equal('?' + hash.digest('hex'));
    });
  });

  it('should resolve null un-supported postfix', function () {
    var block =  '<!-- build:js /script/build.js -->\n' + '<script src="/script/origin.js"></script>\n' + '<script src="/script/complex.js"></script>\n' + '<!-- endbuild -->\n';
    utils.resolvePostfix({}, block, true).should.equal('');
  });
});