var Recognizer = require('route-recognizer').default
  , Route = require('./route')

var METHODS = ['get', 'post', 'put', 'delete']

var Router = module.exports = function(opts) {
  if (!opts) opts = {}
  this.viewPath = opts.viewPath || ''

  this.routes = {}
  METHODS.forEach(function(method) {
    this.routes[method] = new Recognizer
  }, this)

  METHODS.concat(['init']).forEach(function(method) {
    this[method] = Route.createRoute.bind(null, this, false, method)
  }, this)
  this.del = this.delete
}

var EventEmitter = require('events').EventEmitter
Router.prototype = Object.create(EventEmitter.prototype, {
  constructor: { value: Router, enumerable: false }
})

Router.prototype.add = function(method, path, handler) {
  this.routes[method.toLowerCase()].add([{
    path: path,
    handler: handler
  }])
}

Router.prototype.match = function(ctx) {
  var routes = this.routes[ctx.method.toLowerCase()].recognize(ctx.path)
  if (!routes || !routes.length) return null
  var route = routes[0]
  ctx.params = route.params
  ctx.query  = routes.queryParams || {}
  return route.handler
}

var isClient = typeof window !== 'undefined' && !!window.document
  , isServer = !isClient

var Context = isServer ? require('./context.server')
                       : require('./context.client')

Router.prototype.middleware = function() {
  var router = this
  return function*(next) {
    var context = new Context(this, {
      viewPath: router.viewPath
    })
    var route = router.match(context)
    if (route) yield route(context)
    else       yield next
  }
}

var co = require('co')

Router.prototype.start = function(method, path, params, query) {
  var events = require('./events.client')(this)

  // intercept link clicks
  document.body.addEventListener('click', events.click)

  // intercept form submits
  document.body.addEventListener('submit', events.submit)

  window.addEventListener('popstate', events.popstate)

  var context = new Context(method, path)
  context.params = params
  context.query  = query
  var route = this.match(context)
  co(function*() {
    yield route(context)
    var state = {
      method: context.method,
      path: context.path,
      body: context.body,
      params: context.params,
      query: context.query
    }
    window.history.replaceState(state, null, path)
  })()
}

if (isClient) {
  delete Router.prototype.init
  delete Router.prototype.middleware
} else {
  delete Router.prototype.start
}

Router.render = function() {
  throw new Error('Router.render not yet defined')
}

Router.getArguments = function() {
  return []
}