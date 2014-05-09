module.exports = require('./router')

var debug = require('debug')
if (typeof window !== 'undefined' && !!window.document) {
  debug.enable('router')
}