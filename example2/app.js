'use strict'
var missi = require('mississippi')
var path = require('path')
var http = require('http')
var websocket = require('websocket-stream')
var router = require('../index')
var ecstatic = require('ecstatic')(path.join(__dirname, 'static'))
var app = module.exports = http.createServer(ecstatic)
var r = router()

r.add('sum:promise', p => {
  try {
    validate(p)
    return Promise.resolve(p.reduce((x, n) => (x + n), 0))
  } catch (err) {
    return Promise.reject(err)
  }
})

r.add('sum:stream', p => {
  var rs = missi.through.obj()
  process.nextTick(() => {
    try {
      validate(p)
      rs.end(p.reduce((x, n) => (x + n), 0))
    } catch (err) {
      rs.emit('error', err)
    }
  })
  return rs
})

websocket.createServer({server: app}, socket => {
  socket.pipe(r.route()).pipe(socket)
})

if (!module.parent) {
  var port = process.env.PORT || 8765
  var mes = 'start to listen on port "%s"'
  app.listen(port, () => console.log(mes, port))
}

function validate (p) {
  if (!Array.isArray(p)) throw new TypeEror('params must be "array"')
  if (!p.every(n => typeof n ==='number')) {
    throw new TypeError('params member must be "number"')
  }
}
