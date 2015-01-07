var gulp = require('gulp');
var release = require('./index.js');

gulp.task('test', function() {
  gulp.src('./test/fixture/*.html')
    .pipe(release())
    .pipe(gulp.dest('./tmp'));
});