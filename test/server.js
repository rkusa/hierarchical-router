/*global suite, test, suiteSetup, suiteTeardown, teardown */

require('co-mocha')
var expect = require('chai').expect
var request = require('co-supertest')

var port = process.env.PORT || 3001
var server = require('./app/server')

suiteSetup(function(done) {
  server = server.listen(port, done)
})
suiteTeardown(function(done) {
  server.close(done)
})

var router = server.router
var stack = []
router.on('execute', function(path) {
  stack.push(path)
})
teardown(function() {
  stack = []
})

// Calling a route v on the server-side results in executing v and all
// ancestors of v, i.e., all nodes being an element of A(v). These routes
// are executed in the order they are specified in.
suite('Server-Side', function() {

  test('execute all ancestors and itself', function*() {
    yield request(server)
      .get('/a/w/v')
      .expect(200)
      .end()

    expect(stack).to.eql([
      '/a',
      '/a/w',
      '/a/w/v'
    ])
  })

  test('start at the root node for all (further) requests', function*() {
    yield request(server)
      .get('/a/w/u')
      .expect(200)
      .end()

    expect(stack).to.eql([
      '/a',
      '/a/w',
      '/a/w/u'
    ])
    stack = []

    yield request(server)
      .get('/a/w/u/d')
      .expect(200)
      .end()

    expect(stack).to.eql([
      '/a',
      '/a/w',
      '/a/w/u',
      '/a/w/u/d'
    ])
  })

  test('redirect', function*() {
    router.get('/redirect', function*(cont) {
      yield cont.redirect('/some/path')
    })

    yield request(server)
      .get('/redirect')
      .expect('Location', '/some/path')
      .expect(302)
      .end()
  })
})

function requestTo(path, method) {
  return function*() {
    yield request(server)
      .get(path)
      .expect(200)
      .end()
  }
}

require('./common')(router, requestTo)

var router = require('./app/app')
var context = require('../lib/context.client.js')

function navigateTo(path, method) {
  return function*() {
    var route = router.match(path, method || 'GET', context)

    if (route) {
      yield route(context)
    }

    return route
  }
}

require('./routing')(router, navigateTo)