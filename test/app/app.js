var Router = require('../../lib')
var router = module.exports = new Router({
  viewPath: 'views'
})

var a = router.get('/a', function*(cont) {
  yield cont
})

a.get('/b', function*(cont) {
  yield cont
})

var w = a.get('/w', function*(cont) {
  yield cont
})

w.get('/v', function*(cont) {
  yield cont
})

var u = w.get('/u', function*(cont) {
  yield cont
})

u.get('/c', function*(cont) {
  yield cont
})

u.get('/d', function*(cont) {
  yield cont
})

var e = router.get('/:e', function*(cont) {
  yield cont
})

e.get('/k', function*(cont) {
  yield cont
})

var f = e.get('/:f', function*(cont) {
  yield cont
})

f.get('/g', function*(cont) {
  yield cont
})

var h = f.get('/:h', function*(cont) {
  yield cont
})

h.get('/i', function*(cont) {
  yield cont
})

h.get('/j', function*(cont) {
  yield cont
})