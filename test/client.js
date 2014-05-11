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

var expect = require('chai').expect
var router = require('./es5/test/app/app')

var stack = []
router.on('execute', function(path) {
  stack.push(path)
})
afterEach(function() {
  stack = []
})

// On the client-side, only routes that are responsible for changes between two
// user interactions are executed. There are four sub-scenarios for client-side
// execution that take different positions of the target route into account.
describe('Client-Side', function() {

  it('should initialize properly', function(done) {
    router.start('GET', '/a')
    router.on('started', function() {
      expect(window.history.state).to.be.ok
      with (window.history.state) {
        expect(method).to.equal('GET')
        expect(path).to.equal('/a')
      }
      expect(stack).to.have.lengthOf(0)
      done()
    })
  })

  // If v being a descendant of u, every route from u down to v is executed.
  it('move forward', navigateTo('/a/w/v', function(done) {
    expect(stack).to.eql([
      '/a/w',
      '/a/w/v'
    ])

    done()
  }))

  // If target route v is neither an ancestor nor an descendent, every route
  // from the lowest common ancestor w(u, v) down to v is executed.
  it('move further', navigateTo('/a/w/u/d', function(done) {
    expect(stack).to.eql([
      '/a/w/u',
      '/a/w/u/d'
    ])

    done()
  }))

  // In case v is an ancestor of u, only v is executed.
  it('move back', navigateTo('/a/w', function(done) {
    expect(stack).to.eql([
      '/a/w'
    ])

    done()
  }))

  // If target route v is not an element of tree T(u) of starting position u,
  // it is executed the same way as on the server-side. That is, v and all
  // ancestors A(v) are executed in their appropriate order.
  it('change tree', navigateTo('/e/f', function(done) {
    expect(stack).to.eql([
      '/e',
      '/e/f'
    ])

    done()
  }))

})

function navigateTo(path, fn) {
  return function(done) {
    router.on('navigated', function navigated(path) {
      expect(path).to.equal(path)

      fn(done)

      router.removeListener('navigated', navigated)
    })

    var a = document.createElement('a')
    a.href = path
    document.body.appendChild(a)
    a.click()
  }
}