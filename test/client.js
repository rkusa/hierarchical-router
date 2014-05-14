/*global suite, test, teardown */

var expect = require('chai').expect
var router = require('./app/app')

var stack = []
router.on('execute', function(path) {
  stack.push(path)
})
teardown(function() {
  stack = []
})

suite('Client-Side', function() {

  test('initialize properly', function(done) {
    router.start('GET', '/a')
    router.on('started', function() {
      expect(window.history.state).to.be.ok
      expect(window.history.state.method).to.equal('GET')
      expect(window.history.state.path).to.equal('/a')
      expect(stack).to.have.lengthOf(0)
      done()
    })
  })

  test('pushState', function(done) {
    navigateTo('/a/b')(function() {
      expect(window.location.pathname).to.equal('/a/b')

      done()
    })
  })

  test('redirect', function(done) {
    var executed = false

    var root = router.get('/target', function(cont) {
      executed = true
      cont()
    })

    root.get('/redirect', function(cont) {
      cont.redirect('../')
    })

    router.on('navigated', function navigated(path) {
      expect(path).to.equal('/target/redirect')
      // expect(window.location.pathname).to.equal(expected || path)

      router.removeListener('navigated', navigated)
      router.removeAllListeners('pushState')

      router.on('pushState', function navigated(path) {
        expect(path).to.equal('/target')
        expect(window.location.pathname).to.equal(path)

        router.removeListener('pushState', navigated)

        expect(stack).to.eql([
          '/target',
          '/target/redirect',
          '/target'
        ])

        done()
      })
    })

    navigateTo('/target/redirect')()
  })
})

function navigateTo(path, method) {
  return function(done) {
    router.on('pushState', function navigated(to) {
      var pos
      if ((pos = path.indexOf('?')) !== -1) {
        path = path.substr(0, pos)
      }

      expect(path).to.equal(to)
      expect(window.location.pathname).to.equal(path)

      router.removeListener('pushState', navigated)

      done()
    })

    var a = document.createElement('a')
    a.href = path
    document.body.appendChild(a)
    a.click()
  }
}

var Runnable = Mocha.Runnable
var run      = Runnable.prototype.run
var co       = require('co')

/**
 * Override the Mocha function runner and enable generator support with co.
 *
 * @param {Function} fn
 */
Runnable.prototype.run = function (fn) {
  if (this.fn.toString().match(/wrapGenerator/) /*&& this.fn.constructor.name === 'GeneratorFunction'*/) {
    this.fn   = co(this.fn());
    this.sync = !(this.async = true);
  }

  return run.call(this, fn);
};


require('./common')(router, navigateTo)
require('./routing')(router, navigateTo)