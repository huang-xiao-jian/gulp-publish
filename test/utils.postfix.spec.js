describe('utils postfix method', function () {
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
});