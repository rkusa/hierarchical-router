var debug = require('debug')('router')

var isClient = typeof window !== 'undefined' && !!window.document
  , isServer = !isClient

var initialized = isClient ? false : true

var Route = function(router, method, pattern, action) {
  this.router = router
  this.path   = this.pattern = pattern
  this.method = method
  this.action = action
  this.rdy    = this.cleanup = null
  this.depth  = 0
}

Route.prototype.execute = function(context, req, args, cont) {
  if (this.rdy) context.ready(this.rdy, !initialized)

  var self = this
  return function*() {
    if (!initialized) {
      return yield cont
    }

    debug(self.method.toUpperCase() + ' ' + self.path)

    self.router.emit('execute', self.path)

    if (self.method === 'init') {
      yield *self.action.apply(req, [context.ctx].concat(args, cont))
    } else {
      yield *self.action.apply(req, args.concat(cont))
    }
  }
}

Route.prototype.ready = function(fn) {
  this.rdy = fn
}

Route.prototype.cleanup = function(fn) {
  this.cleanup = fn
}

Route.prototype.revert = function() {
  if (isServer) return
  debug('Revert %s ', this.path)
  this.router.emit('revert', this.path)
}

Route.prototype.appendAfter = function(parent) {
  if (!(parent instanceof Route)) return

  this.parent = parent
  this.depth  = parent.depth + 1

  // chain pattern with parent patterns
  parent = this
  while ((parent = parent.parent) && parent.pattern) {
    this.path = parent.pattern + this.path
  }
  // cleanup slashes
  this.path = this.path.replace(/^\/\//, '/')
}

Route.prototype.createChild = function(method, pattern, action) {
  // arguments
  if (method === 'init' || typeof pattern === 'function') {
    action = pattern
    pattern = ''
  }

  // cleanup pattern
  if (pattern !== '') {
    // force / at the beginning
    if (pattern[0] !== '/') pattern = '/' + pattern
    // remove / from ending
    if (pattern.length > 1 && pattern[pattern.length - 1] === '/')
      pattern = pattern.substr(0, pattern.length - 1)
  }

  var child = new Route(this.router, method, pattern, action)
  child.appendAfter(this)

  if (!child.path) return child

  var router = this.router
  var handler = function(context, trigger) {
    return function*() {
      router.emit('navigate', context.path, context.method, context)
      var root = new Route(router, '', '', function(_, cb) { cb() })
      var from = context.location && context.location.route || root
      yield from.executeUntil(child, context, trigger)
    }
  }

  // add route
  this.router.add(method, child.path, handler)

  return child
}

Route.prototype.executeUntil = function(to, context, trigger) {
  var from = this, stack = [to], revert = [], router = this.router
  if (initialized) debug('From: %s', from.path)
  if (initialized) debug('To: %s', to.path)

  return function*() {
    // traverse up, until both are on the same depth
    while (from.depth !== to.depth) {
      if (from.depth > to.depth) {
        if (!!!~stack.indexOf(from)) revert.push(from)
        from = from.parent
      } else {
        if (!!!~stack.indexOf(to)) stack.push(to)
        to = to.parent
      }
    }

    // find first shared ancestor
    while (from.depth >= 1 && from !== to) {
      if (!!!~stack.indexOf(to)) stack.push(to)
      if (!!!~revert.indexOf(from)) revert.push(from)
      from = from.parent
      to   = to.parent
    }

    // if from and to are still not the same, we are at depth 0,
    // i.e., both nodes are in different trees and we are done here,
    if (from.depth === 0 && from !== to) {
      if (!!!~stack.indexOf(to)) stack.push(to)
      if (!!!~revert.indexOf(from)) revert.push(from)
    }

    var route

    // otherwise:
    if (from === to) {
      // we are not done here, because it could be possible that some
      // parameters have changed, e.g., having the pattern /:id the
      // parameter id could have changed

      route = to
      while((route = route.parent)) {
        // count the relevant sections of the pattern
        var relevant   = (route.pattern.match(/\//g) || []).length

        // count the relevant sections of the full path to calcularte the
        // count of sections that are irrelevant
        var irrelevant = (route.path.match(/\//g) || []).length - relevant

        if (relevant === 0 || irrelevant === 0) continue

        // split into sections
        // TODO: fix state._path
        var lhs = state._path.replace(/^\/_(post|put|delete)\//, '/').split('/').splice(irrelevant + 1, relevant)
          , rhs = context.path.replace(/^\/_(post|put|delete)\//, '/').split('/').splice(irrelevant + 1, relevant)
        for (var i = 0; i < lhs.length; ++i) {
          if (lhs[i] !== rhs[i]) {
            // parameter has changed
            stack.push(route.parent)
            revert.push(route.parent)
            break
          }
        }
      }
    }

    if (initialized) debug('Stack: %s', stack.map(function(r) { return r.pattern }))

    // revert routes that are not in the path anymore
    revert.forEach(function(route) {
      route.revert(context)
    })

    var args = router.constructor.getArguments()
    var req  = {
      body: context.body,
      params: context.params,
      query: context.query
    }

    // finalize the request
    var finalize = function*() {
      initialized = true
      context.location.route = route
      context.location.path = context.path
      // context.finalize(this.opts)
    }

    // the callback method that is provided to each route node
    var cont = function *cont() {
      // get the next route from the stack
      route = stack.pop()

      var next
      // if the stack is not empty yet, i.e., if this is not
      // the last route part, the callback standard callback is provided
      if (stack.length) {
        next = cont
      }
      // otherwise a slightly modified callback is provided
      else {
        next = function*() {
          yield cont.end
        }
        next.redirect = cont.redirect
        next.render = function*(viewName) {
          yield* context.render(viewName)
          yield finalize
        }
      }

      // exectue the route part
      if (trigger === false) yield next
      else yield route.execute(context, req, args, next)
    }
    cont.end      = finalize
    cont.redirect = function(url, opts) {
      context.location.route = route
      context.location.path = context.path
      context.redirect(url, opts)
    }
    cont.render   = function*(viewName) {
      // catch most recent render
      cont.end = function*() {
        yield context.render(viewName)
        yield finalize
      }
      yield cont
    }

    yield cont
  }
}

exports.createRoute = function createRoute(router, parent, method, pattern, action) {
  var route = Route.prototype.createChild.call(parent || { router: router }, method, pattern, action)

  var ret = {
    get:    createRoute.bind(null, router, route, 'get'),
    post:   createRoute.bind(null, router, route, 'post'),
    put:    createRoute.bind(null, router, route, 'put'),
    delete: createRoute.bind(null, router, route, 'delete'),
  }
  ret.del = ret.delete
  ret.ready = function(fn) {
    route.ready(fn)
    return ret
  }
  ret.cleanup = function(fn) {
    route.cleanup(fn)
    return ret
  }
  return ret
}