'use strict'
var RouterSteram = require('./router-stream')
module.exports = Router

function Router () {
  if (!(this instanceof Router)) return new Router()
  this.routes = {}
  this.writables = []
}

Router.prototype.add = function (method, f) {
  return (this.routes[method] = f)
}

Router.prototype.route = function createRouterStream () {
  var me = this
  var ts = new RouterSteram(this)

  ts.once('pipe', function (socket) {
    if (me.writables.indexOf(socket) === -1) me.writables.push(socket)
    socket.once('close', socket.unpipe.bind(socket, this))
  })

  ts.once('unpipe', function (socket) {
    this.unpipe(socket)
    me.writables = me.writables.filter(function (s) { return s !== socket })
  })

  return ts
}
