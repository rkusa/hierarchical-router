var gulp = require('gulp')

gulp.task('default', ['test', 'saucelabs'])

var mocha = require('gulp-mocha')
gulp.task('test', function() {
  return gulp.src(['test/server.js'])
             .pipe(mocha({ reporter: 'spec', ui: 'tdd' }))
})

var jshint = require('gulp-jshint')
gulp.task('lint', function() {
  gulp.src(['lib/*.js', 'test/*.js', 'gulpfile.js'])
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('fail'))
})

var source = require('vinyl-source-stream')
var browserify = require('browserify')
gulp.task('karma:bundle', function() {
  var bundle = browserify('./test/client.js')
  bundle.transform(require('regeneratorify'))

  return bundle.bundle({ debug: true })
    .pipe(source('client.bundle.js'))
    .pipe(gulp.dest('./test'))
})

var karma = require('gulp-karma')
gulp.task('karma:test', ['karma:bundle'], function() {
  return gulp.src('test/client.bundle.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      // browsers: ['Chrome'],
      reporters: ['story'],
      action: 'run'
    }))
    // .on('error', function(err) {
    //   // Make sure failed tests cause gulp to exit non-zero
    //   throw err;
    // })
})

var clean = require('gulp-clean')
gulp.task('karma:cleanup', ['karma:test'], function() {
  return gulp.src('test/client.bundle.js', { read: false })
    .pipe(clean())
})

gulp.task('karma', ['karma:bundle', 'karma:test', 'karma:cleanup'])

gulp.task('saucelabs', ['karma:bundle'], function() {
  return gulp.src('test/client.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      browsers: Object.keys(require('./test/browser')),
      reporters: ['dots', 'saucelabs'],
      singleRun: true,
      action: 'run'
    }))
})