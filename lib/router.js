var Recognizer = require('route-recognizer').default
var Route = require('./route')
var co = require('co')
var qs = require('qs')

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

var isClient = typeof window !== 'undefined' && !!window.document
  , isServer = !isClient

var context = isServer ? require('./context.server')
                       : require('./context.client')

Router.prototype.match = function(path, method, ctx) {
  method = method && method.toLowerCase() || 'get'
  var routes = this.routes[method].recognize(path)
  if (!routes || !routes.length) return null
  var route = routes[0]

  var pos
  if ((pos = path.indexOf('?')) !== -1) {
    path = path.substr(0, pos)
  }

  function handler(trigger) {
    return route.handler(handler.context, trigger)
  }
  handler.context = Object.create(ctx || context)
  handler.context.router = this
  handler.context.method = method.toUpperCase()
  handler.context.path   = path
  handler.context.params = route.params
  handler.context.query  = routes.queryParams
  handler.context.body   = null

  return handler
}

Router.prototype.middleware = function() {
  var router = this
  return function*(next) {
    var route = router.match(this.originalUrl, this.method)
    if (!route) return yield next

    this.status = 200

    route.context.ctx      = this
    route.context.body     = normalizeBody(this.body)
    route.context.location = { route: null, path: null }

    yield route()
  }
}

Router.prototype.onclick = function(e) {
  if (e.ctrlKey || e.metaKey) return
  if (e.defaultPrevented) return

  // ensure link
  var el = e.target
  while (el && 'A' !== el.nodeName) el = el.parentNode
  if (!el || 'A' !== el.nodeName) return

  // if the `data-external` attribute is set to `true`, do not
  // intercept this link
  if (el.dataset.external === 'true') return

  // ensure protocol
  if (el.protocol !== ':' && el.protocol !== 'http:' && el.protocol !== 'https:') return

  // ensure non has for the same path
  var href = el.getAttribute('href')
  if (el.hash || !href || href === '#') return

  // do not intercept x-orgin links
  if (!sameOrigin(href)) return

  var path = el.pathname + el.search

  // provide confirm functionality through `data-confirm`
  if (el.dataset.confirm && !confirm(el.dataset.confirm)) return

  // trigger route
  var silent  = el.dataset.silent  === 'true' ? true : false
  var trigger = el.dataset.trigger === 'false' ? false : true

  var route   = this.match(path, 'get')
  if (!route) return

  e.preventDefault()  // intercept link
  this.pushState(route, silent, trigger)
}

Router.prototype.onsubmit = function(e) {
  var el = e.target

  // if the `data-side` attribute is set to `server`, do not
  // intercept this link
  if (el.dataset.side === 'server') return

  var origin = window.location.protocol + "//" + window.location.host
    , method = el.method
    , path   = el.action

  // remove origin from path (action)
  if (path.indexOf(origin) === 0) {
    path = path.substr(origin.length)
  }

  var silent = el.dataset.silent  === 'true' ? true : false
  var body

  // POST submits
  if (method === 'post') {
    // support method overwrite
    var _method = el.querySelector('input[name=_method]')
    if (_method) method = _method.value

    path = path === '' ? '/' : path

    // serialize form elements
    body = normalizeBody(qs.parse(serializeForm(el)))

    silent = true
  }
  // GET submits
  else {
    // serialize form elements
    if (path.indexOf('?') > -1) path += '&'
    else path += '?'
    path += serializeForm(el)
  }

  var route = this.match(path, method)
  if (!route) return

  e.preventDefault()
  route.context.body = body || null
  this.pushState(route, silent, true)
}

Router.prototype.onpopstate = function(e) {
  var state = e.state
  if (!e.state) return

  var route = this.match(state.path, state.method)
  route.context.body   = state.body
  route.context.params = state.params
  route.context.query  = state.query

  dispatch(route, true, true)
}

Router.prototype.pushState = function(route, silent, trigger) {
  var router = this
  co(function*() {
    yield route(trigger)

    if (silent || route.context.method !== 'GET') {
      return
    }

    // update URL
    window.history.pushState(route.context.state, null, route.context.path)
    router.emit('pushState', route.context.path)
  })()
}

Router.prototype.start = function(method, path, params, query) {
  // intercept link clicks, submits and popstate
  window.addEventListener('click', this.onclick.bind(this))
  window.addEventListener('submit', this.onsubmit.bind(this))
  window.addEventListener('popstate', this.onpopstate.bind(this))

  var route = this.match(path, method)
  route.context.params = params
  route.context.query  = query

  if (!route) return

  var router = this
  co(function*() {
    yield route()
    window.history.replaceState(route.context.state, null, path)
    router.emit('started')
  })()
}

if (isClient) {
  delete Router.prototype.init
  delete Router.prototype.middleware
} else {
  delete Router.prototype.start
  delete Router.prototype.onclick
  delete Router.prototype.onsubmit
  delete Router.prototype.onpopstate
  delete Router.prototype.pushState
}

Router.render = function() {
  throw new Error('Router.render not yet defined')
}

Router.getArguments = function() {
  return []
}

function normalizeBody(body) {
  if (body && Array.isArray(body) && body.length > 0) {
    var obj = {}
    body.forEach(function(input) {
      obj[input.name] = input.value
    })
    body = obj
  }
  return body
}

function sameOrigin(href) {
  var origin = location.protocol + "//" + location.hostname + ":" + location.port
  return href.indexOf('http') === -1 || href.indexOf(origin) === 0
}

function serializeForm(form) {
  var values = []
  Array.prototype.slice.call(form.elements).forEach(function(el) {
    var type = el.getAttribute('type')
    if (el.nodeName.toLowerCase() !== 'fieldset' &&
      !el.disabled && type !== 'submit' && type !== 'reset' && type !== 'button' &&
      ((type !== 'radio' && type !== 'checkbox') || el.checked)) {

      values.push(encodeURIComponent(el.getAttribute('name')) + '=' + encodeURIComponent(el.value))
    }
  })
  return values.join('&')
}