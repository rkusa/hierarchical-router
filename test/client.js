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

// On the client-side, only routes that are responsible for changes between two
// user interactions are executed. There are four sub-scenarios for client-side
// execution that take different positions of the target route into account.
suite('Client-Side', function() {

  test('initialize properly', function(done) {
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

})

function navigateTo(path, method) {
  return function(done) {
    router.on('navigated', function navigated(path) {
      expect(path).to.equal(path)

      router.removeListener('navigated', navigated)

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


require('./routing')(router, navigateTo)