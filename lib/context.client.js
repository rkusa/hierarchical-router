var Router = require('./router')
var path   = require('path')
var co     = require('co')

// Context prototype.
module.exports = {
  location: { route: null, path: null },

  redirect: function(url, opts) {
    if (!opts) opts = {}
    if (url[0] !== '/') {
      url = path.normalize(this.path + '/' + url)
      // remove / from ending
      if (url.length > 1 && url[url.length - 1] === '/')
        url = url.substr(0, url.length - 1)
    }
    var route = this.router.match(url)

    if (!route || opts.external) {
      window.location.href = url
      return
    }

    var router = this.router
    setTimeout(function() {
      router.pushState(route, opts.silent, opts.trigger)
    })
  },

  render: function*(viewName) {

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