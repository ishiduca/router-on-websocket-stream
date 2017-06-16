'use strict'
var w = require('global/window')
var d = require('global/document')
var loc = w.location
var uri = [loc.protocol.replace('http', 'ws'), '//', loc.host].join('')
var inject = require('reconnect-core')
var websocket = require('websocket-stream')
var route = require('../browser')
var yo = require('yo-yo')

var state = {
  result: [],
  message: null
}

var root = render()

var router = route()
var m = router.method('multi')

var reconnect = inject(uri => websocket(uri))
var re = reconnect({}, ws => {
  ws.once('close', () => console.log('ws ended'))
  ws.once('end', () => {
    console.log('ws ended')
    ws.unpipe(router)
    router.unpipe(ws)
  })
  router.pipe(ws).pipe(router, {end: false})

  m.write({count: 'hoge'})
})

re.on('connect', () => console.log('connect'))
re.on('reconnect', (n, delay) => console.log('reconnect "%s" times, delay "%s"', n, delay))
re.on('error', err => console.error(err))

m.on('data', result => {
  state.result = state.result.concat(result)
  update()
})
m.on('error', err => {
  state.message = err
  setTimeout(() => (state.message = null) || update(), 3000)
  update()
})

d.body.appendChild(root)
re.connect(uri)

m.write({count: 10})
m.write({count: -11})

function render () {
  return yo `
    <main>
      <div role="dialog">
        ${state.message ? message() : d.createTextNode('')}
      </div>
      <ul>
        ${state.result.map(li)}
      </ul>
    </main>
  `

  function message () {
    return yo `<h2><p>${String(state.message)}</p></h2>`
  }

  function li (r) {
    if (r.end) {
      return yo `<li>! multi - ended</li>`
    }

    return yo `<li>count: "${r.count}"</li>`
  }
}

function update () {
  root = yo.update(root, render())
}
