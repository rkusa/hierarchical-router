/*global suite, test, teardown */

var expect = require('chai').expect

module.exports = function(router, navigateTo) {

  var stack = []
  router.on('execute', function(path) {
    stack.push(path)
  })
  teardown(function() {
    stack = []
  })

  suite('Common', function() {

    test('non-generator handler', function*() {
      var root = router.get('/non/generator', function(cont) {
        cont()
      })

      root.get('/handler', function(cont) {
        cont()
      })

      yield navigateTo('/non/generator/handler')

      expect(stack).to.eql([
        '/non/generator',
        '/non/generator/handler'
      ])
    })

    test('params', function*() {
      var params

      router.get('/foobar/:foobar/:id', function*(cont) {
        params = this.params
        yield cont
      })

      yield navigateTo('/foobar/asdf/42')

      expect(params).to.eql({
        foobar: 'asdf',
        id: '42'
      })
    })

    test('query', function*() {
      var query

      router.get('/query', function*(cont) {
        query = this.query
        yield cont
      })

      yield navigateTo('/query?foobar=42', 'get', '/query')

      expect(query).to.eql({
        foobar: '42',
      })
    })

  })

}