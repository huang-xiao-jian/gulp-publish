"use strict";

var utils = require('../utils/utils.js');
var should = require('should');

describe('utils line file path collection', function () {
  const scriptComment = '<script src="/script/origin.js"></script>';
  const linkComment = '<link rel="stylesheet" href="/style/origin.css">';
  const scriptPathSample = '/script/origin.js';
  const linkPathSample = '/style/origin.css';

  it('should get script path', function () {
    utils.getScriptPath(scriptComment).should.equal(scriptPathSample);
  });

  it('should get null when wrong tags', function () {
    should(utils.getScriptPath(linkComment)).equal(null);
  });

  it('should get link path', function () {
    utils.getLinkPath(linkComment).should.equal(linkPathSample);
  });

  it('should get null when wrong tags', function () {
    should(utils.getLinkPath(scriptComment)).equal(null);
  });

  it('should get uncertain path', function () {
    utils.getReplacePath(scriptComment, 'js').should.equal(scriptPathSample);
    utils.getReplacePath(scriptComment, 'coffee').should.equal(scriptPathSample);
    utils.getReplacePath(linkComment, 'css').should.equal(linkPathSample);
    utils.getReplacePath(linkComment, 'less').should.equal(linkPathSample);
    utils.getReplacePath(linkComment, 'stylus').should.equal(linkPathSample);
    utils.getReplacePath(linkComment, 'sass').should.equal(linkPathSample);
    should(utils.getReplacePath(linkComment, 'ghost')).equal(null);
  });
});

describe('utils block file path collection', function () {
  const ScriptPathSampleA = '/script/origin.js';
  const ScriptPathSampleB = '/script/complex.js';
  const LinkPathSampleA = '/style/origin.css';
  const LinkPathSampleB = '/style/complex.css';
  const ScriptBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const CoffeeBlock = '<!-- build:coffee /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const LinkBlock = '<!-- build:css /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->\n';
  const LessBlock = '<!-- build:less /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->\n';
  const SassBlock = '<!-- build:sass /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->\n';
  const StylusBlock = '<!-- build:stylus /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->\n';
  const ScriptMixedBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const CoffeeMixedBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const LinkMixedBlock = '<!-- build:css /script/build.css -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const LessMixedBlock = '<!-- build:css /script/build.css -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const SassMixedBlock = '<!-- build:css /script/build.css -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const StylusMixedBlock = '<!-- build:css /script/build.css -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const RemoveBlock = '<!-- build:remove /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const ReplaceScriptBlock = '<!-- build:replace /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const ReplaceWrongBlock = '<!-- build:replace /script/build.anything -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const AnyBlock = '<!-- build:anything /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';

  it('should resolve file path from script block', function () {
    utils.getBlockFilePath(ScriptBlock).should.eql([ScriptPathSampleA, ScriptPathSampleB]);
    utils.getBlockFilePath(CoffeeBlock).should.eql([ScriptPathSampleA, ScriptPathSampleB]);
  });

  it('should resolve script file path from mixed block with js block type', function () {
    utils.getBlockFilePath(ScriptMixedBlock).should.eql([ScriptPathSampleA]);
    utils.getBlockFilePath(CoffeeMixedBlock).should.eql([ScriptPathSampleA]);
  });

  it('should resolve file path from link block', function () {
    utils.getBlockFilePath(LinkBlock).should.eql([LinkPathSampleA, LinkPathSampleB]);
    utils.getBlockFilePath(LessBlock).should.eql([LinkPathSampleA, LinkPathSampleB]);
    utils.getBlockFilePath(SassBlock).should.eql([LinkPathSampleA, LinkPathSampleB]);
    utils.getBlockFilePath(StylusBlock).should.eql([LinkPathSampleA, LinkPathSampleB]);
  });

  it('should resolve link file path from mixed block with type css', function () {
    utils.getBlockFilePath(LinkMixedBlock).should.eql([LinkPathSampleA]);
    utils.getBlockFilePath(LessMixedBlock).should.eql([LinkPathSampleA]);
    utils.getBlockFilePath(SassMixedBlock).should.eql([LinkPathSampleA]);
    utils.getBlockFilePath(StylusMixedBlock).should.eql([LinkPathSampleA]);
  });

  it('should resolve replace file path from script block', function () {
    utils.getBlockFilePath(ReplaceScriptBlock).should.eql([ScriptPathSampleA, ScriptPathSampleB]);
  });

  it('should resolve replace null file path from wrong block', function () {
    utils.getBlockFilePath(ReplaceWrongBlock).should.eql([]);
  });

  it('should resolve remove file path', function () {
    utils.getBlockFilePath(RemoveBlock).should.eql([]);
  });

  it('should resolve un-known file path', function () {
    utils.getBlockFilePath(AnyBlock).should.eql([]);
  });
});
