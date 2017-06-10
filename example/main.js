var websocket = require('websocket-stream')
var missi = require('mississippi')
var safe = require('json-stringify-safe')
var loc = window.location
var uri = [loc.protocol.replace('http', 'ws'), '//', loc.host].join('')

var ws = websocket(uri)

ws.on('data', b => {
  console.log(JSON.parse(b))
})

ws.write(safe({
  method: 'multi', params: {count: 10}
}))

ws.write(safe({
  method: 'multi', params: {count: -11}
}))
