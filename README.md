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
  gulp.src('*.html')
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

- **type**: declare the way to resolve internal markups and related files, e.g `js`, `coffee`, `typescript`, `jsx`, `css`, `less`, `sass`, `stylus`,
`stylus`, `sass`, `remove`, `replace`. Linked files should match type, if mismatch, will skip the specific tag. Such as, you place `css` type, but use `<script></script>` tags.
- **path**: the file output path relative to process.cwd().

**Remember not miss the block split flag between normal HTML and block, block and block, block and normal HTML, add split flag**
`<!-- split -->`.

Particularly, when `type` equal `remove`, the block will be destroyed.

```html
<!-- build:remove /build/script/build.js -->
<script src="/script/origin.js"></script>
<!-- endbuild -->
```

when `type` equal `replace`, will only replace tags, but will never resolve related files. This is necessary when you define almost the same block in several HTML file, but resolve the related files once complete the mission. 
As below, will generate `<script src="/script/build.js"></script>`, and will never try to generate the `/script/build.js` file.

```html
<!-- build:replace /script/build.js -->
<script src="/script/origin.js"></script>
<!-- endbuild -->
```

Also, when block do not have any HTML tags, will just add correspond tags, below will insert `<script src="/build/script/build.js"></script>` , `<link rel="stylesheet" href="/style/build.css"/>` into html.

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
  postfix: '',
  directory: './build',
  js: [[uglify, {}]],
  coffee: [[coffee, {}], [uglify, {}]],
  css: [[cssmin, {}]],
  less: [[less, {}], [cssmin, {}]]
  debug: true
}
```

### enableResolve
Type: Boolean

whether resolve related files that `script`, `link` point. if `false`, will only output resolved HTML file. if `true`, will try resolve linked `javascript`, `css` files.

### postfix
Type: md5 | String | Function

the postfix after source address.
if `md5`, will calculate md5 value of the buffer concat all the linked files.
if `String`, will use the string.
if `Function`, the argument is the buffer concat all the linked files, and use returned value as postfix.
For example, set postfix `v0.2.5`, will generate tags below:
```html
<link rel="stylesheet" href="/style/build.css?v0.2.5">
<script src="/script/build.js?v0.2.5"></script>
```

### css
Type: Array

Value consists of two-element array, the first is `generator`, the second is `config`.  Generally speaking, any `gulp-plugin` exports `generator` here, and `config` property pass to the `generator`. Declare how to resolve css type block files. if omitted or null, will only concat related files.
Also, you can just use `generator` here rather than two-element array when no additional options should pass in the `generator`.

For example:
```javascript
[
  less: [ [less, {}], [cssmin, {}] ]
]
```

### js, coffee, typescript, jsx, less, stylus, sass
Almost the same thing as `css` above, to resolve correspond files. `js`, `less`, `coffee` pass the test, `typescript`, `jsx`, `stylus`, `sass` will dance as well.

### debug
Type: boolean

whether used in debug environment, just for unit test.

## Additional Description
+ For some scene, you did special structure, such as build simple server to render `less`, `coffee` files, and import
like below:

```html
<link rel="stylesheet" href="/style/index.less" />
<script src="/script/index.coffee"></script>
```

Making an assumption, put `gulp-less`, `gulp-coffee` into `css` or `js` config array will achieve the same thing,
but I think provide `less`, `coffee` type is necessary.

+ The type option array consist of object to get the final stream, rather than normal stream. That's because there would be several source stream pass the `pipeline flow`, if stream, will cause content mismatch, and after any source stream emit `end`, the stream would never write again.

## Contact
**hjj491229492@hotmail.com**

## LICENSE
MIT
