"use strict";

describe('utils main helper methods', function () {
  it('should split html into blocks', function () {
    let expected = [
      '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>',
      '<!-- build:css /style/build.css --><link rel="stylesheet" href="/style/origin.css"><link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->',
      '<!-- build:js /script/build.js --><script src="/script/origin.js"></script><script src="/script/complex.js"></script><!-- endbuild -->',
      '</head><body></body></html>'
    ];
    let stream = gulp.src('./test/fixture/source.html');
    return utils.streamToPromise(stream).then(function(value) {
      var result = utils.getSplitBlock(value.toString());
      (utils.escape(result[0])).should.equal(utils.escape(expected[0]));
      (utils.escape(result[1])).should.equal(utils.escape(expected[1]));

      (utils.escape(result[2])).should.equal(utils.escape(expected[2]));
      (utils.escape(result[3])).should.equal(utils.escape(expected[3]));
    });
  });

  it('should resolve block into final tags when normal HTML tags only', function () {
    var normal = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';
    utils.generateTags(normal).should.equal(normal);
  });

  it('should resolve block into final tags when css reference', function () {
    var stylesheet = '<!-- build:css /style/build.css --><!-- endbuild -->';
    utils.generateTags(stylesheet, {}).should.equal('<link rel="stylesheet" href="/style/build.css"/>');
  });

  it('should resolve block into final tags when js reference', function () {
    var scripts = '<!-- build:js /script/build.js --><!-- endbuild -->';
    utils.generateTags(scripts, {}).should.equal('<script src="/script/build.js"></script>');
  });

  it('should resolve block into final tags when remove reference', function () {
    var remove = '<!-- build:remove /script/build.js --><script src="/script/origin.js"></script><!-- endbuild -->';
    should(utils.generateTags(remove, {})).equal(null);
  });

  it('should resolve block into final tags when replace reference', function () {
    var scripts = '<!-- build:replace /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->';
    utils.generateTags(scripts, { postfix: 'md5', debug: true}).should.equal('<script src="/script/build.js?761b2346e32d7ce46a1a4a76ccda0b2c"></script>');
  });

  it('should resolve block into final tags when replace reference', function () {
    var stylesheet = '<!-- build:replace /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css">\n<!-- endbuild -->';
    utils.generateTags(stylesheet, { postfix: 'md5', debug: true }).should.equal('<link rel="stylesheet" href="/style/build.css?26ea1a2fe8faf4cdcf774344a6b70fc5"/>');
  });
});

describe('utils main resolve methods', function () {
  var normalExpect =
    '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
    '<link rel="stylesheet" href="/style/build.css"/>' +
    '<script src="/script/build.js"></script>' +
    '</head><body></body></html>';

  var removeExpect =
    '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title>' +
    '</head><body></body></html>';

  it('should resolve source into destiny', function () {
    let stream = gulp.src('./test/fixture/source.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks);
      utils.escape(result).should.equal(utils.escape(normalExpect));
    });
  });

  it('should resolve source into destiny when add tags', function (done) {
    let stream = gulp.src('./test/fixture/special.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks);
      utils.escape(result).should.equal(utils.escape(normalExpect));
    });
  });

  it('should resolve source into destiny when remove tags', function () {
    let stream = gulp.src('./test/fixture/remove.html');
    return utils.streamToPromise(stream).then(function(value) {
      let blocks = utils.getSplitBlock(value.toString());
      let result = utils.resolveSourceToDestiny(blocks);
      utils.escape(result).should.equal(utils.escape(removeExpect));
    });
  });
});