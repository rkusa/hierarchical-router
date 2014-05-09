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
    var context = new Context(this)
    context.viewPath = router.viewPath
    var route = router.match(context)
    if (route) yield route(context)
    else       yield next
  }
}

var co = require('co')
var qs = require('qs')

Router.prototype.start = function() {
  var router = this, state = {}

  // intercept link clicks
  document.body.addEventListener('click', function(e) {
    if (e.ctrlKey || e.metaKey) return
    if (e.defaultPrevented) return

    // ensure link
    var el = e.target
    while (el && 'A' != el.nodeName) el = el.parentNode
    if (!el || 'A' != el.nodeName) return

    // if the `data-external` attribute is set to `true`, do not
    // intercept this link
    if (Boolean(el.dataset.external)) return

    // ensure protocol
    if (el.protocol !== 'http:' && el.protocol !== 'https:') return

    // ensure non has for the same path
    var href = el.getAttribute('href')
    if (el.hash || !href || href == '#') return

    // do not intercept x-orgin links
    if (!sameOrigin(href)) return

    // intercept link
    e.preventDefault()
    var path = el.pathname + el.search

    // provide confirm functionality through `data-confirm`
    if (el.dataset.confirm && !confirm(el.dataset.confirm)) return

    // trigger route
    var silent  = el.dataset.silent  === 'true' ? true : false
    var trigger = el.dataset.trigger === 'false' ? false : true
    var context = new Context(state, 'get', path)
    var route = router.match(context)
    if (route) {
      co(function*() {
        yield route(context, trigger)
        if (!silent) {
          // update URL
          window.history.pushState({ method: 'get', path: path }, null, path)
        }
      })()
    }
  })

  // intercept form submits
  document.body.addEventListener('submit', function(e) {
    var el = e.target

    // if the `data-side` attribute is set to `server`, do not
    // intercept this link
    if (el.dataset.side === 'server') return

    var origin = window.location.protocol + "//" + window.location.host
      , method = el.method
      , path   = el.action
      , ctx

    // remove origin from path (action)
    if (path.indexOf(origin) === 0) {
      path = path.substr(origin.length)
    }

    var silent = el.dataset.silent  === 'true' ? true : false
    var route, body

    // POST submits
    if (method === 'post') {
      // support method overwrite
      var _method = el.querySelector('input[name=_method]')
      if (_method) method = _method.value

      path = path === '' ? '/' : path

      // serialize form elements
      body = qs.parse(serializeForm(el))
      if (body && Array.isArray(body) && body.length > 0) {
        var obj = {}
        body.forEach(function(input) {
          obj[input.name] = input.value
        })
        body = obj
      }

      silent = true
    }
    // GET submits
    else {
      // serialize form elements
      if (path.indexOf('?') > -1) path += '&'
      else path += '?'
      path += serializeForm(el)
    }

    var context = new Context(state, method, path)
    context.body = body || null
    var route = router.match(context)
    if (route) {
      co(function*() {
        yield route(context, trigger)
        if (!silent && method === 'post') {
          // update URL
          window.history.pushState({ method: method, path: path }, null, path)
        }
      })()
    }
    // if no route found, send POST request to server
    else {
      e.preventDefault()
    }
  })

  window.addEventListener('popstate', function(e) {
    console.log(e)
    if (e.state) {
      var state = e.state
      var context = new Context(state, state.method, state.path)
      var route = router.match(context)
      co(function*() {
        yield route(context)
        // window.history.replaceState(e.state, null, state.path)
      })()
    }
  }, false)

  document.addEventListener('DOMContentLoaded', function() {
    var path = window.location.pathname + window.location.search
    var context = new Context(state, 'get', path)
    var route = router.match(context)
    co(function*() {
      yield route(context)
      window.history.replaceState({ method: 'get', path: path }, null, path)
    })()
  })
}

if (!isClient) delete Router.prototype.init

function sameOrigin(href) {
  var origin = location.protocol + "//" + location.hostname + ":" + location.port
  return href.indexOf('http') == -1 || href.indexOf(origin) === 0
}

Router.render = function() {
  throw new Error('Router.render not yet defined')
}

Router.getArguments = function() {
  return []
}