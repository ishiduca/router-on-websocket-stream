# example-router-on-websocket-stream

websocket-stream上でJSON-RPCっぽいやりとりをする。そのためのフレームワーク

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
  console.log('server start to listen on port "%s"', port)
})
```

### browser

```js
var inject = require('reconnect-core')
var websocket = require('websocket-stream')
var router = requrie('router-on-websocket-stream')

var loc = window.location
var uri = [loc.protocol, '//', loc.host].join('')

var r = router()
var reconnect = inject(uri => websocket(uri))
var re = reconnect({}, ws => {
  ws.once('close', () => console.log('ws closed'))
  ws.once('end', () => {
    console.log('ws ended')
    r.unpipe(ws)
    ws.unpipe(r)
  })

  r.pipe(ws).pipe(r, {end: false})
})

re.on('connect', () => console.log('connected - "%s", uri))
re.on('reconnect', (n, delay) => {
  console.log('recon "%s" times, delay "%s"', n, delay)
})
re.on('error', err => console.error(err))

var countup = r.method('countup')

countup.on('data', result => console.dir(result))
countup.on('error', err => console.error(err))

re.connect(uri)

countup.write({count: 10})
countup.write({count: -10})
```

## api

### server

#### var router = new Router()

create "Router" instance.

##### router.add(method, func)

* __method__ `method` key in json-rpc-object
* __func__ function. this function argment is `params` in json-rpc-object. this function return `readable-stream` or `Promise`.

```js
router.add('toUpperCase', function (params) {
  var s = through.obj(function (params, _, done) {
    done(null, {text: params.text.toUpperCase()})
  })

  process.nextTick(function () {
    s.end(params)
  })

  return s
})
// or
router.add('toUpperCase', function (params) {
  return Promise.resolve({text: params.text.toUpperCase()})
})
```

##### router.route()

create transform-stream.

```js
ws.createServer({server: app}, function (stream) {
  stream.pipe(router.route()).pipe(stream)
})
```

### browser

#### var ioStream = router()

create duplex-stream.

```js
ioStream.pipe(ws).pipe(ioStream)
```

##### ioStream.on('response', function (json-rpc-response) {})

ioStream emit `response`.

#### var handleStream = ioStream.method(method)

create handling stream.

```js
var upper = ioStream.method('toUpperCase')
upper.on('data', function (result) {
  ...
})
upper.on('error', function (err) {
  ...
})

upper.write({text: 'foo'})
```
