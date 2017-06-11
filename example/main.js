var loc = window.location
var uri = [loc.protocol.replace('http', 'ws'), '//', loc.host].join('')
var websocket = require('websocket-stream')
var route = require('../browser')

var ws = websocket(uri)
var router = route()
var m = router.method('multi')

router.pipe(ws).pipe(router)

m.on('data', result => console.dir(result))

m.write({count: 10})
m.write({count: -11})
