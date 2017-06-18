'use strict'
var d = require('global/document')
var events = require('events')
var setupApi = require('./api')
var render = require('./components/root')
var emitter = new events.EventEmitter()

setupApi(emitter)

var root = render(render.defaultState, emit)

emitter.on('notif', notifier => {
  root.notif(notifier)
})
emitter.on('add result', result => {
  var list = root.state.result
  root.update({result: list.concat(result)})
})

d.body.appendChild(root)

function emit () {
  emitter.emit.apply(emitter, arguments)
}
