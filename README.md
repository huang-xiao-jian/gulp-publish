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
var publish = require('gulp-publish');

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

- **type**: declare the way to resolve internal markups and related files, e.g `js`, `css`, `less`, `coffee`,
`stylus`, `sass`. (Linked files should match type)
- **path**: the file path to output.

**Remember not miss the block split flag**
Between normal HTML and block, block and block, block and normal HTML, add split flag
`<!-- split -->`.

Particularly, when `type` equal 'remove', the block will be destroyed.

```html
<!-- build:remove /build/script/build.js -->
<script src="/script/origin.js"></script>
<!-- endbuild -->
```

Also, support add tags when build, below will insert `<script src="/build/script/build.js">` , `<link rel="stylesheet" href="/style/build.css"/>` into html.

```html
<!-- build:js /build/script/build.js -->
<!-- endbuild -->

<!-- build:css /style/build.css -->
<!-- endbuild -->
```

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
Complete options act like below:

```javascript
{
  enableResolve: true,
  directory: './build',
  css: [cssmin({})],
  js: [uglify({}],
  debug: true
}
```

### enableResolve
Type: Boolean

whether resolve related files that `script`, `link` point. if `false`, will only output resolved HTML file. if `true`, will try resolve linked `javascript`, `css` files.

### css
Type: Array

Value consists of stream object that  `gulp-plugin` generate. Declare how to resolve css files. if omitted or null, will only concat related files.

### js
Type: Array

Value consists of stream object that  `gulp-plugin` generate. Declare how to resolve javascript files. if omitted or null, will only concat related files.

### less, stylus, sass, coffee
Almost the same thing as `css`, `js` above, to resolve correspond files. `less`, `coffee` pass the test, `stylus`, `sass` will dance as well.

### debug
Type: boolean

whether used in debug environment, just for unit test.

For some scene, you did special structure, such as build simple server to render `less`, `coffee` files, and import
like below:

```html
<link rel="stylesheet" href="/style/index.less" />
<script src="/script/index.coffee"></script>
```

Making an assumption, put `gulp-less`, `gulp-coffee` into `css` or `js` config array will achieve the same thing,
but I think provide `less`, `coffee` type is necessary.

## Contact
**hjj491229492@hotmail.com**

## LICENSE
MIT
