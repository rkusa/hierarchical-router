var Router = require('./router')

// Context prototype.
module.exports = {
  location: null,

  redirect: function(url) {
    this.ctx.redirect(url)
  },

  render: function*(viewName) {
    this.ctx.type = 'text/html; charset=utf-8'
    this.ctx.body = yield Router.render(viewName, this.opts.viewPath)
  },

  get state() {
    return {
      method: this.method,
      path:   this.path,
      body:   this.body,
      params: this.params,
      query:  this.query
    }
  }
}