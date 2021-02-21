// based on https://gist.github.com/TravelingTechGuy/9996733

const gulp = require('gulp');
const clean = require('gulp-clean');
const cleanhtml = require('gulp-cleanhtml');
const minifycss = require('gulp-minify-css');
const eslint = require('gulp-eslint');
//const stripdebug = require('gulp-strip-debug');
//const uglify = require('gulp-uglify');
const zip = require('gulp-zip');

const manifest = require('./src/manifest');

// clean build directory
gulp.task('clean', () => gulp.src('build/*', { read: false })
  .pipe(clean()));

// copy static folders to build directory
gulp.task('copy', () => {
  gulp.src('src/icons/**')
    .pipe(gulp.dest('build/icons'));
  return gulp.src('src/manifest.json')
    .pipe(gulp.dest('build'));
});

// copy and compress HTML files
gulp.task('html', () => gulp.src('src/*.html')
  .pipe(cleanhtml())
  .pipe(gulp.dest('build')));

// run scripts through ESLint
gulp.task('eslint', () => gulp.src('src/scripts/*.js')
  .pipe(eslint({}))
  .pipe(eslint.format()));

// copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('scripts', gulp.series('eslint', (cb) => {
  gulp.src(['src/scripts/**/*.js'])
    //.pipe(stripdebug())
    //.pipe(uglify({ outSourceMap: true }))
    .pipe(gulp.dest('build/scripts'));
  cb();
}));

// minify styles
gulp.task('styles', () => gulp.src('src/styles/**/*.css')
  .pipe(minifycss({ root: 'src/styles', keepSpecialComments: 0 }))
  .pipe(gulp.dest('build/styles')));

// build ditributable and sourcemaps after other tasks completed
gulp.task('zip', gulp.series('html', 'scripts', 'styles', 'copy', (cb) => {
  const distFileName = `${manifest.name} v${manifest.version}.zip`;
  const mapFileName = `${manifest.name} v${manifest.version}-maps.zip`;
  // collect all source maps
  gulp.src('build/scripts/**/*.map')
    .pipe(zip(mapFileName))
    .pipe(gulp.dest('dist'));
  // build distributable extension
  gulp.src(['build/**', '!build/scripts/**/*.map'])
    .pipe(zip(distFileName))
    .pipe(gulp.dest('dist'));
  cb();
}));

// run all tasks after build directory has been cleaned
gulp.task('default', gulp.series('clean', 'zip'));
