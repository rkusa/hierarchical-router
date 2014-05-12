var Router = require('./router')
var _location = { route: null, path: null }

var Context = module.exports = function(method, path) {
  this.method = method
  this.path = path

  this.location = _location
}

Context.prototype.render = function*(viewName) {
  yield Router.render(viewName, this.viewPath)
}