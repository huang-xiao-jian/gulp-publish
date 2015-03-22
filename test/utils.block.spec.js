"use strict";

var utils = require('../utils/utils.js');
var should = require('should');

describe('utils check fragment belongs block', function () {
  it('should check block belongs', function () {
    const ScriptBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
    const AbnormalBlock = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';
    utils.isBlock(ScriptBlock).should.be.true;
    utils.isBlock(AbnormalBlock).should.be.false;
  });
});

describe('utils block basic info collection', function () {
  const StyleComment = '<!-- build:css /style/build.css -->\n<link type="text/css" href="/style/origin.css">\n<!-- endbuild -->';
  const StyleMirrorComment = '<!-- build:css ./style/build.css -->\n<link type="text/css" href="/style/origin.css">\n<!-- endbuild -->';
  const ScriptComment = '<!-- build:js /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  const CoffeeComment = '<!-- build:coffee /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  const TypescriptComment = '<!-- build:typescript /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  const JSXComment = '<!-- build:jsx /style/build.js -->\n<script src="/script/origin.js></script>\n<!-- endbuild -->';
  const LessComment = '<!-- build:less /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';
  const SassComment = '<!-- build:sass /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';
  const StylusComment = '<!-- build:stylus /style/build.css -->\n<link type="text/css" href="/style/origin.less">\n<!-- endbuild -->';

  it('should get css type', function () {
    utils.getBlockType(StyleComment).should.equal('css');
  });

  it('should get less type', function () {
    utils.getBlockType(LessComment).should.equal('less');
  });

  it('should get sass type', function () {
    utils.getBlockType(SassComment).should.equal('sass');
  });

  it('should get stylus type', function () {
    utils.getBlockType(StylusComment).should.equal('stylus');
  });

  it('should get js type', function () {
    utils.getBlockType(ScriptComment).should.equal('js');
  });

  it('should get coffee type', function () {
    utils.getBlockType(CoffeeComment).should.equal('coffee');
  });

  it('should get typescript type', function () {
    utils.getBlockType(TypescriptComment).should.equal('typescript');
  });

  it('should get coffee type', function () {
    utils.getBlockType(JSXComment).should.equal('jsx');
  });

  it('should get absolute destiny path', function () {
    utils.getBlockPath(StyleComment).should.equal('/style/build.css');
  });

  it('should get relative destiny path', function () {
    utils.getBlockPath(StyleMirrorComment).should.equal('./style/build.css');
  });
});

describe('utils line file path collection', function () {
  const ScriptComment = '<script src="/script/origin.js"></script>';
  const LinkComment = '<link rel="stylesheet" href="/style/origin.css">';
  const ScriptPathSample = '/script/origin.js';
  const LinkPathSample = '/style/origin.css';

  it('should get script path', function () {
    utils.getScriptPath(ScriptComment).should.equal(ScriptPathSample);
  });

  it('should get null when wrong tags', function () {
    should(utils.getScriptPath(LinkComment)).equal(null);
  });

  it('should get link path', function () {
    utils.getLinkPath(LinkComment).should.equal(LinkPathSample);
  });

  it('should get null when wrong tags', function () {
    should(utils.getLinkPath(ScriptComment)).equal(null);
  });

  it('should get uncertain path', function () {
    utils.getReplacePath(ScriptComment, 'js').should.equal(ScriptPathSample);
    utils.getReplacePath(ScriptComment, 'coffee').should.equal(ScriptPathSample);
    utils.getReplacePath(ScriptComment, 'typescript').should.equal(ScriptPathSample);
    utils.getReplacePath(ScriptComment, 'jsx').should.equal(ScriptPathSample);
    utils.getReplacePath(LinkComment, 'css').should.equal(LinkPathSample);
    utils.getReplacePath(LinkComment, 'less').should.equal(LinkPathSample);
    utils.getReplacePath(LinkComment, 'stylus').should.equal(LinkPathSample);
    utils.getReplacePath(LinkComment, 'sass').should.equal(LinkPathSample);
    should(utils.getReplacePath(LinkComment, 'ghost')).equal(null);
  });
});

describe('utils block file path collection', function () {
  const ScriptPathSampleA = '/script/origin.js';
  const ScriptPathSampleB = '/script/complex.js';
  const LinkPathSampleA = '/style/origin.css';
  const LinkPathSampleB = '/style/complex.css';
  const ScriptBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const LinkBlock = '<!-- build:css /style/build.css -->\n<link rel="stylesheet" href="/style/origin.css">\n<link rel="stylesheet" href="/style/complex.css"><!-- endbuild -->\n';
  const ScriptMixedBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const LinkMixedBlock = '<!-- build:css /script/build.css -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const RemoveBlock = '<!-- build:remove /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const ReplaceScriptBlock = '<!-- build:replace /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const ReplaceWrongBlock = '<!-- build:replace /script/build.anything -->\n<script src="/script/origin.js"></script>\n<link rel="stylesheet" href="/style/origin.css">\n<!-- endbuild -->\n';
  const AnyBlock = '<!-- build:anything /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';

  it('should resolve file path from script block', function () {
    utils.getBlockFilePath(ScriptBlock).should.eql([ScriptPathSampleA, ScriptPathSampleB]);
  });

  it('should resolve file path from link block', function () {
    utils.getBlockFilePath(LinkBlock).should.eql([LinkPathSampleA, LinkPathSampleB]);
  });

  it('should resolve replace file path from script block', function () {
    utils.getBlockFilePath(ReplaceScriptBlock).should.eql([ScriptPathSampleA, ScriptPathSampleB]);
  });

  it('should resolve remove file path', function () {
    utils.getBlockFilePath(RemoveBlock).should.eql([]);
  });

  it('should resolve script file path from mixed block with js block type', function () {
    utils.getBlockFilePath(ScriptMixedBlock).should.eql([ScriptPathSampleA]);
  });

  it('should resolve link file path from mixed block with type css', function () {
    utils.getBlockFilePath(LinkMixedBlock).should.eql([LinkPathSampleA]);
  });

  it('should resolve un-certain replace from wrong block', function () {
    utils.getBlockFilePath(ReplaceWrongBlock).should.eql([]);
  });

  it('should resolve un-certain file path from wrong block', function () {
    utils.getBlockFilePath(AnyBlock).should.eql([]);
  });
});

describe('utils block file structure', function () {
  it('should resolve block structure', function () {
    let scriptComment = '<!-- build:js /style/build.js -->\n<script src="/script/origin.js"></script>\n<!-- endbuild -->';
    (utils.getBlockStructure(scriptComment)).should.containEql({
      type: 'js',
      destiny: '/style/build.js',
      files: ['/script/origin.js']
    });
  });
});

describe('utils block file source', function () {
  const ScriptBlock = '<!-- build:js /script/build.js -->\n<script src="/script/origin.js"></script>\n<script src="/script/complex.js"></script>\n<!-- endbuild -->\n';
  const AbnormalBlock = '<!DOCTYPE html><html><head lang="en"><meta charset="UTF-8"><title>gulp release</title></head><body></body></html>';

  it('should resolve basic blocks', function () {
    let source = utils.getBlockFileSource([ScriptBlock]);
    source.length.should.equal(1);
    source[0].should.containEql({
      type: 'js',
      destiny: '/script/build.js',
      files: ['/script/origin.js', '/script/complex.js']
    });
  });

  it('should filter pass-in blocks', function () {
    let source = utils.getBlockFileSource([ScriptBlock, AbnormalBlock]);
    source.length.should.equal(1);
    source[0].should.containEql({
      type: 'js',
      destiny: '/script/build.js',
      files: ['/script/origin.js', '/script/complex.js']
    });
  });
});