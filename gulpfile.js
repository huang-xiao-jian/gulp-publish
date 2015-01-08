var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var uglify = require('gulp-uglify');
var publish = require('./index.js');

gulp.task('test', function() {
  gulp.src('./test/fixture/*.html')
    .pipe(publish())
    .pipe(htmlmin({
      removeComment: true,
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('./build'));
});

