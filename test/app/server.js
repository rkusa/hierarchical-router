var koa = require('koa')
var server = module.exports = koa()

var router = server.router = require('./app')

server.use(router.middleware())