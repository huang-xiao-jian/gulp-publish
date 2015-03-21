var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var coffee = require('gulp-coffee');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var cssmin = require('gulp-cssmin');
var publish = require('./index.js');

gulp.task('normal', function() {
  gulp.src('./test/fixture/*.html')
    .pipe(publish({
      enableResolve:false,
      debug: true
    }))
    .pipe(htmlmin({
      removeComment: true,
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('./build'));
});

gulp.task('standard', function() {
  gulp.src('./test/fixture/*.html')
    .pipe(publish({
      enableResolve: true,
      postfix: 'v0.2.5',
      debug: true,
      js: [[uglify, {}]],
      coffee: [[coffee, {}], [uglify, {}]],
      css: [[cssmin, {}]],
      less: [[less, {}], [cssmin, {}]]
    }))
    .pipe(htmlmin({
      removeComment: true,
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('./build'));
});