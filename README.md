# example-router-on-websocket-stream

## example

### server

```js
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')(path.join(__dirname, 'static'))
var websocket = require('websocket-stream')
var Router = require('router-on-websocket-stream')
var missi = require('mississippi')

var port = process.env.PORT
var app = http.createServer(ecstatic)
var router = new Router()

router.add('countup', params => {
  var stream = missi.through.obj()
  var c = 0
  var id = setInterval(() => {
    if (c === 10) {
      clearInterval(id)
      id = null
      return stream.end({end: true})
    }

    stream.write({count: params.count + c})

    c += 1
  }, 1000)

  return stream
})

websocket.createServer({server: app}, stream => {
  stream.pipe(router.route()).pipe(stream)
})

app.listen(port, () => {
  console.log('server start to listen on port "%s", port)
})
```

### browser

```js
var loc = window.location
var uri = [loc.protocol, '//', loc.host].join('')
var websocket = require('websocket-stream')
var safe = require('json-stringify-safe')

var ws = websocket(uri)

ws.on('data', b => {
  var res = JSON.parse(String(b))
  if (res.error) {
    console.log(res.error)
  } else {
    console.log('count %s', res.result.count)
  }
})

ws.write(safe({
  method: 'countup', params: {count: 10}
}))

ws.write(safe({
  method: 'countup', params: {count: -5}
}))
```
