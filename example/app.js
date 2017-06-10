var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')(path.join(__dirname, 'static'))
var websocket = require('websocket-stream')
var missi = require('mississippi')
var Router = require('../')
var app = http.createServer(ecstatic)
var port = process.env.PORT || 8888

var router = Router()

router.add('multi', (params) => {
  var t = missi.through.obj()
  var c = 0
  var id = setInterval(() => {
    if (c === 10) {
      clearInterval(id)
      id = null
      t.end({end: true})
      return
    }
    t.write({count: params.count + c})
    c += 1
  }, 500)

  return t
})

websocket.createServer({server: app}, sock => {
  sock.pipe(router.route()).pipe(sock)
})

if (!module.parent) {
  app.listen(port, () => {
    console.log(`server start to listen on port "${port}"`)
  })
}

module.exports = app
