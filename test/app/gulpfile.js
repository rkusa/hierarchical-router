var gulp = require('gulp')
  , bg = require('gulp-bg')

gulp.task('server', bg('node', '--harmony', 'start.js'))

gulp.task('default', ['server'], function() {
  gulp.watch([
    '*.js',
    '../../lib/**.js',
  ], ['server'])
})