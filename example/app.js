var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')(path.join(__dirname, 'static'))
var websocket = require('websocket-stream')
var missi = require('mississippi')
var app = http.createServer(ecstatic)
var port = process.env.PORT || 8888
var router = require('../')()

router.add('multi', (params) => {
  if (typeof params.count !== 'number') return error()

  var t = missi.through.obj()
  var c = 0
  var id = setInterval(() => {
    if (c === 10) return clear()
    t.write({count: params.count + c})
    c += 1
  }, 500)

  return t

  function clear () {
    clearInterval(id)
    id = null
    t.end({end: true})
  }

  function error () {
    var mes = 'params.count must be "number"'
    var err = new TypeError(mes)
    return Promise.reject(err)
  }
})

websocket.createServer({server: app}, sock => {
  sock.pipe(router.route()).pipe(sock)
})

listen()

function listen () {
  var mes = `server start to listen on port "${port}"`
  app.listen(port, () => console.log(mes))
}
