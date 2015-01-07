# gulp-publish

![Build Status](https://img.shields.io/travis/bornkiller/gulp-publish/master.svg?style=flat)
![Coverage Report](http://img.shields.io/coveralls/bornkiller/gulp-publish.svg?style=flat)
![Package Dependency](https://david-dm.org/bornkiller/gulp-publish.svg?style=flat)
![Package DevDependency](https://david-dm.org/bornkiller/gulp-publish/dev-status.svg?style=flat)

## Attention
`gulp-publish` make out from `gulp-usemin` branch for some entire different idea, and not
ready for production environment.

Replace references to release scripts or stylesheets HTML tags, and provide API for resolve
linked files identified by `src` or `href`.

## Usage

First, install `gulp-publish` as a development dependency:

```shell
npm install --save-dev gulp-publish
```

Then, add it to your `gulpfile.js`:

```javascript
var release = require('gulp-publish');

gulp.task('publish', function () {
  return gulp.src('*.html')
      .pipe(publish()))
      .pipe(gulp.dest('build/'));
});
```

## Block
Block are expressed as:

```html
<!-- build:<type> <path> -->
Any link script markup
<!-- endbuild -->
```

- **type**: declare the way to resolve internal markups and related files
- **path**: the file path to output

**Remember not miss the block split flag**
Between normal HTML and block, block and block, block and normal HTML, add split flag
`<!-- split -->`.

An completed example form acts below:

```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>gulp release</title>
    <!-- split -->
    <!-- build:css /style/build.css -->
    <link rel="stylesheet" href="/style/origin.css">
    <link rel="stylesheet" href="/style/complex.css">
    <!-- endbuild -->
    <!-- split -->
    <!-- build:js /script/build.js -->
    <script src="/script/origin.js"></script>
    <script src="/script/complex.js"></script>
    <!-- endbuild -->
    <!-- split -->
</head>
<body>

</body>
</html>
```

The example HTML file will output below:

```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>gulp release</title>

<link rel="stylesheet" href="/style/build.css"/>
<script src="/script/build.js"></script>

</head>
<body>

</body>
</html>
```

## Options
progress.

## Contact
**hjj491229492@hotmail.com**