var gulp = require('gulp')

gulp.task('default', ['lint', 'test'])

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

var karma = require('gulp-karma')
gulp.task('karma', function() {
  return gulp.src(['test/client.js'])
    .pipe(karma({
      configFile: 'karma.conf.js',
      browsers: ['Chrome'],
      action: 'run'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    })
})

gulp.task('saucelabs', function() {
  return gulp.src(['test/client.js'])
    .pipe(karma({
      configFile: 'karma.conf.js',
      browsers: ['sl_chrome', 'sl_firefox', 'sl_ios_safari', 'sl_ie_11'],
      singleRun: true,
      action: 'run'
    }))
})