var Router = require('./router')

var Context = module.exports = function(ctx, opts) {
  this.opts = opts
  this.ctx  = ctx

  this.method = ctx.method
  this.path   = ctx.path

  this.body   = ctx.body
  if (this.body && Array.isArray(this.body) && this.body.length > 0) {
    var obj = {}
    this.body.forEach(function(input) {
      obj[input.name] = input.value
    })
    this.body = obj
  }

  this.location = { route: null, path: null }
}

Context.prototype.ready = Context.prototype.cleanup = function() {
  // do nothing
}

Context.prototype.finalize = function(opts) {
  // TODO
  return
  process.nextTick(function() {
    this.state.currentView = 'layout'
    console.error('RENDER')
    // this._res.render(opts.layout, this.app)
  }.bind(this))
}

Context.prototype.redirect = function(url) {
  // this.state.emit('redirect', this._req)
  // this._res.redirect(url)
  console.error('REDIRECT')
}

Context.prototype.render = function*(viewName) {
  this.ctx.type = 'text/html; charset=utf-8'
  this.ctx.body = yield Router.render(viewName, this.opts.viewPath)
}