'use strict'
var RouteStream = require('./route-stream')

module.exports = Router

function Router () {
  if (!(this instanceof Router)) return new Router()
  this.routes = {}
}

Router.prototype.add = function (method, f) {
  return (this.routes[method] = f)
}

Router.prototype.route = function createRouteStream () {
  var ts = new RouteStream(this.routes)
  ts.once('pipe', function (socket) {
    socket.once('close', socket.unpipe.bind(socket, this))
  })
  ts.once('unpipe', function (socket) {
    this.unpipe(socket)
  })
  return ts
}
