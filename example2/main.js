var inject = require('reconnect-core')
var websocket = require('websocket-stream')
var router = require('../browser')
var yo = require('yo-yo')

var SUM_PROMISE = 'sum:promise'
var SUM_STREAM = 'sum:stream'
var loc = window.location
var uri = loc.protocol.replace('http', 'ws') + '//' + loc.host

var r = router()
var reconnect = inject(uri => websocket(uri))
var re = reconnect({}, ws => {
  ws.once('close', console.log.bind(console, 'ws closed'))
  ws.once('end', () => {
    console.log('ws ended')
    r.unpipe(ws)
    ws.unpipe(r)
  })

  r.pipe(ws).pipe(r, {end: false})
})

re.on('connnect', console.log.bind(console, 'connected - "%s"', uri))
re.on('error', err => console.error(err))

var handlers = {}
handlers[SUM_PROMISE] = r.method(SUM_PROMISE)
handlers[SUM_STREAM] = r.method(SUM_STREAM)

handlers[SUM_PROMISE].on('data', r => {
  data.resutlPromise = [r].concat(data.resutlPromise)
  update()
})
handlers[SUM_STREAM].on('data', r => {
  if (typeof r !== 'number') return
  data.resutlStream = [r].concat(data.resutlStream)
  update()
})

handlers[SUM_PROMISE].on('error', console.error.bind(console))
handlers[SUM_STREAM].on('error', console.error.bind(console))

re.connect(uri)

var data = {
  inputValue: '',
  resutlPromise: [],
  resutlStream: []
}
var el = render()

document.body.appendChild(el)

function update () {
  el = yo.update(el, render())
}

function render () {
  return yo `
    <main>
      <div>
        <input
          type="text"
          value=${data.inputValue}
          oninput=${e => oninput(e)}
        />
        ${button(SUM_PROMISE)}
        ${button(SUM_STREAM)}
      </div>
      <div style="display: flex;">
        <ul>
          <h3>${SUM_PROMISE}</h3>
          ${data.resutlPromise.map(r => yo `<li>${r}</li>`)}
        </ul>
        <ul>
          <h3>${SUM_STREAM}</h3>
          ${data.resutlStream.map(r => yo `<li>${r}</li>`)}
        </ul>
      </div>
    </main>
  `
}

function button (method) {
  return yo `
    <button
      type="button"
      onclick=${e => {
        e.stopPropagation()
        action(method)
      }}
    >${method}</button>
  `
}

function oninput (e) {
  data.inputValue = e.target.value
  update()
}

function action (method) {
  var params = data.inputValue.split(' ').filter(Boolean).map(m)
  handlers[method].broadcast(params)

  data.inputValue = ''
  update()

  function m (n) {return parseInt(n, 10)}
}
