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
// +--                           --+   +--                  --+
// |     { (a)                     |   |      (:e)            |
// |      /   \                    |   |      /  \            |
// |    (b)   (w) } = A(u)         |   |    (k)  (:f)         |
// |         /   \                 |   |         /  \         |
// |       (v)   (u)               |   |       (g)  (:h)      |
// |            /   \              |   |            /  \      |
// | T(u)   { (c)   (d) } = D(u)   |   | T(k)     (i)  (j)    |
// +--                           --+   +--                  --+

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

  // On the client-side, only routes that are responsible for changes between two
  // user interactions are executed. There are four sub-scenarios for client-side
  // execution that take different positions of the target route into account.
  suite('Client-Side Routing', function() {

    test('initialize', function*() {
      yield navigateTo('/a')
    })

    // If v being a descendant of u, every route from u down to v is executed.
    test('move forward', function*() {
      // from '/a'
      yield navigateTo('/a/w/v')

      expect(stack).to.eql([
        '/a/w',
        '/a/w/v'
      ])
    })

    // If target route v is neither an ancestor nor an descendent, every route
    // from the lowest common ancestor w(u, v) down to v is executed.
    test('move further', function*() {
      // from '/a/w/v'
      yield navigateTo('/a/w/u/d')

      expect(stack).to.eql([
        '/a/w/u',
        '/a/w/u/d'
      ])
    })

    // In case v is an ancestor of u, only v is executed.
    test('move back', function*() {
      // from '/a/w/u/d'
      yield navigateTo('/a/w')
      expect(stack).to.eql([
        '/a/w'
      ])
    })

    // If target route v is not an element of tree T(u) of starting position u,
    // it is executed the same way as on the server-side. That is, v and all
    // ancestors A(v) are executed in their appropriate order.
    test('change tree', function*() {
      // from '/a/w'
      yield navigateTo('/e/k')

      expect(stack).to.eql([
        '/:e',
        '/:e/k'
      ])
    })

    test('move further with changed parameters', function*() {
      // from '/e/k'
      yield navigateTo('/e/1/h/i')

      expect(stack).to.eql([
        '/:e/:f',
        '/:e/:f/:h',
        '/:e/:f/:h/i'
      ])

      stack = []
      yield navigateTo('/e/2/h/j')

      expect(stack).to.eql([
        '/:e/:f',
        '/:e/:f/:h',
        '/:e/:f/:h/j'
      ])

      stack = []
      yield navigateTo('/1/2/3/j')

      expect(stack).to.eql([
        '/:e',
        '/:e/:f',
        '/:e/:f/:h',
        '/:e/:f/:h/j'
      ])
    })

  })

}