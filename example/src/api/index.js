'use strict'
var w = require('global/window')
var websocket = require('websocket-stream')
var inject = require('reconnect-core')
var router = require('../../../browser')

var loc = w.location
var uri = loc.protocol.replace('http', 'ws') + '//' + loc.host

module.exports = function setupApi (emitter) {
  var r = router()
  var m = r.method('multi')

  var reconnect = inject(uri => websocket(uri))
  var re = reconnect({}, ws => {
    ws.once('close', () => notif('wsProxy closed'))
    ws.once('end', () => {
      notif('wsProxy ended')
      r.unpipe(ws)
      ws.unpipe(r)
    })

    r.pipe(ws).pipe(r, {end: false})
  })

  r.on('error', err => notif(err))
  m.on('error', err => notif(err))

  re.on('connect', con => notif(`connected "${uri}"`))
  re.on('reconnect', (n, d) => notif(`reconnected "${n}" times, delay "${d}"`))
  re.on('error', err => notif(err))

  m.on('data', result => emitter.emit('add result', result))

  emitter.on('multi', n => m.write({count: n}))

  re.connect(uri)

  function notif (mes) { emitter.emit('notif', mes) }
}
