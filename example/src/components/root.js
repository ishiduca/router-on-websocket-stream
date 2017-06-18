'use strict'
var d = require('global/document')
var yo = require('yo-yo')
var xtend = require('xtend')

module.exports = function rootRender (defaultState, emit) {
  var state = xtend(defaultState)
  var el = render()

  el.update = update
  el.notif = notif

  Object.defineProperty(el, 'state', {
    get () { return xtend(state) }
  })

  return el

  function notif (mes) {
    update({notifier: mes})
    setTimeout(() => update({notifier: null}), 5000)
  }

  function update (part) {
    state = xtend(state, part)
    _update()
  }

  function _update () {
    return (el = yo.update(el, render()))
  }

  function render () {
    return yo `
       <main role="main">
         <section role="dialog">
           ${notify(state, emit)}
         </section>
         <section>
           ${button(10, state, emit)}
           ${button("hoge", state, emit)}
           ${button(-10, state, emit)}
         </section>
         <article role="application">
           ${resultList(state, emit)}
         </article>
       </main>
    `
  }
}

function resultList (state, emit) {
  return yo `<ul>${state.result.map(res => li(res))}</ul>`

  function li (res) {
    var as = [_count, _responseEnd]
    for (var i = 0; i < as.length; i++) {
      var e = as[i](res)
      if (e) return e
    }

    _empty()
  }

  function _responseEnd (res) {
    if (res.responseEnd) return yo `<li><b>!! count ended</b></li>`
  }

  function _count (res) {
    if (typeof res.count === 'number') {
      return yo `<li>${res.count}</li>`
    }
  }

  function _empty () {
    return yo `<li>--</li>`
  }
}

function notify (state, emit) {
  var as = [_hasMessage, _isString]
  for (var i = 0; i < as.length; i++) {
    var e = as[i]()
    if (e) return e
  }

  return _empty()

  function _hasMessage () {
    if (state.notifier && state.notifier.message) {
      return yo `
        <div>
          <h2>${state.notifier.message}</h2>
          ${state.notifier.data && yo `<blockquote>${state.notifier.data}</blockquote>`}
        </div>
      `
    }
  }

  function _isString () {
    if (typeof state.notifier === 'string') {
      return yo `<div><h2>${state.notifier}</h2></div>`
    }
  }

  function _empty () {
    return d.createTextNode('')
  }
}

function button (c, state, emit) {
  return yo `
    <div>
      <button onclick=${onclick}>count up "${c}"</button>
    </div>
  `
  function onclick (e) {
    e.stopPropagation()
    emit('multi', c)
  }
}

module.exports.defaultState = {
  result: [],
  notifier: null
}
