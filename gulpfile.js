var gulp = require('gulp')

gulp.task('default', ['lint', 'test'])

var mocha = require('gulp-mocha')
gulp.task('test', function() {
  return gulp.src('test/server.js')
             .pipe(mocha({ reporter: 'spec' }))
})

var jshint = require('gulp-jshint')
gulp.task('lint', function() {
  gulp.src(['lib/*.js', 'test/*.js', 'gulpfile.js'])
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('fail'))
})

var regenerator = require('gulp-regenerator')
gulp.task('es5:libs', function() {
  return gulp.src('lib/*.js')
      .pipe(regenerator({ includeRuntime:true }))
      .pipe(gulp.dest('test/es5/lib'))
})
gulp.task('es5:tests', function() {
  return gulp.src('test/app/app.js')
      .pipe(regenerator({ includeRuntime:true }))
      .pipe(gulp.dest('test/es5/test/app'))
})

var spawn = require('child_process').spawn
gulp.task('testling', ['es5:libs', 'es5:tests'], function(done) {
  spawn('./node_modules/testling/bin/cmd.js', ['-x chrome'], { stdio: 'inherit' })
  .on('exit', done)
})