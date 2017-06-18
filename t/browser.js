'use strict'
var test = require('tape')
var router = require('browser')
var missi = require('mississippi')
var response = require('blue-frog-core/response')

test('var r = router()', t => {
  t.ok(router().method, 'exists rotuer().method')
  t.ok(new router().method, 'exists new router().method')
  t.end()
})

test('r.pipe(ws).pipe(r)', t => {
  var r = router()
  var to = r.method('inc')
  var ws = missi.through.obj(function (json, _, done) {
    var me = this
    var req = JSON.parse(json)
    var c = req.params.value
    var id = setInterval(write, 10)

    write()

    function write () {
      if (c < 0) return end()
      var res = response(req.id, {count: c})
      var x = response.extend(res, {request: req})
      me.push(JSON.stringify(x))
      c -= 1
    }

    function end () {
      id && clearInterval(id)
      id = null
      done()
    }
  })

  var spy = []

  to.once('finish', () => r.push(null))
  to.on('data', result => spy.push(result))
  ws.once('end', () => {
    t.deepEqual(spy, [
      {count: 2},
      {count: 1},
      {count: 0},
      {count: 3},
      {count: 2},
      {count: 1},
      {count: 0},
    ], JSON.stringify(spy))
    t.end()
  })

  r.pipe(ws).pipe(r)

  to.write({value: 2})
  to.end({value: 3})
})
