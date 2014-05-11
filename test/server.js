// The following terminology is applied to describe the routing algorithm:
// We define G(V,E) as a directed graph representing the route hierarchy,
// u ∈ V as a route and (x, y) ∈ E as a directed edge connecting dependent
// routes. Additionally, we define A(u) as a subset of G, with each node
// x ∈ A being an ancestor of u. A node a ∈ A is called a common ancestor
// of u and v if a is an ancestor of both of them. w(u, v) is called the
// lowest common ancestor of u and v. In analogy to A(u), we define D(u) as
// a subset of G, with each node x ∈ D being a descendant of u. Other trees
// like, e.g., T(k), can also exist within G(V,E).
//
// G(V, E):
// +--                           --+   +--             --+
// |     { (a)                     |   |       (e)       |
// |      /   \                    |   |      /   \      |
// |    (b)   (w) } = A(u)         |   |    (k)   (f)    |
// |         /   \                 |   |                 |
// |       (v)   (u)               |   |                 |
// |            /   \              |   |                 |
// | T(u)   { (c)   (d) } = D(u)   |   | T(k)            |
// +--                           --+   +--             --+

/*global describe, it, before, after */

require('co-mocha')
var expect = require('chai').expect
var request = require('co-supertest')

var port = process.env.PORT || 3001
var server = require('./app/server')

before(function(done) {
  server = server.listen(port, done)
})
after(function(done) {
  server.close(done)
})

var router = server.router
var stack = []
router.on('execute', function(path) {
  stack.push(path)
})
afterEach(function() {
  stack = []
})

// Calling a route v on the server-side results in executing v and all
// ancestors of v, i.e., all nodes being an element of A(v). These routes
// are executed in the order they are specified in.
describe('Server-Side', function() {

  it('should execute all ancestors and itself', function*() {
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

  it('should start at the root node for all (further) requests', function*() {
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

})