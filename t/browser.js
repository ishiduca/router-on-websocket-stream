'use strict'
var test = require('tape')
var router = require('../browser')
var missi = require('mississippi')
var safe = require('json-stringify-safe')

test('', t => {
  var dup = router()
  t.ok(dup._writableState, 'dup._writableState')
  t.ok(dup._readableState, 'dup._readableState')
  t.ok(dup.write, 'dup.write')
  t.ok(dup.end, 'dup.end')
  t.ok(dup.method, 'dup.method')
  t.end()
})

test('someDuplex -> duplexRouter -> handleStream', t => {
  var readable = missi.through.obj()
  var dup = router()
  var up = dup.method('toUpperCase')

  dup.on('error', err => {
    t.ok(err, String(err))
  })
  dup.on('unpipe', rs => rs.pipe(dup))

  up.on('data', result => {
    t.deepEqual(result, {text: 'FOO'}, 'result - {"text"]: "FOO"}')
    t.end()
  })

  up.on('error', err => {
    t.ok(/^Error:\s*"text" not found$/.test(err), String(err))
  })

  readable.pipe(dup)

  readable.push('{:')

  readable.push(safe({
    request: {
      method: 'toUpperCase',
      params: {}
    },
    error: String(new Error('"text" not found'))
  }))

  readable.push(safe({
    request: {
      method: 'toUpperCase',
      params: {text: 'foo'}
    },
    result: {
      text: 'FOO'
    }
  }))
})

test('handleSteram -> duplexRouter -> someDuplex', t => {
  var writable = missi.through.obj((b, _, done) => {
    done()

    var str = String(b)
    var req = JSON.parse(str)
    t.ok(req.id, `request.id - "${req.id}"`)
    t.is(req.method, 'toUpperCase', 'req.method - "toUpperCase"')
    t.deepEqual(req.params, {text: 'foo'}, 'req.params "{text: "foo"}"')
    t.end()
  })
  var dup = router()
  var up = dup.method('toUpperCase')

  dup.pipe(writable)

  up.write({text: 'foo'})
})

test('dup.pipe(ts).pipe(dup)', t => {
  var dup = router()
  var c = dup.method('char')

  var ts = missi.through.obj(function (b, _, done) {
    var str = String(b)
    var req = JSON.parse(str)
    var s = req.params
    var id = setInterval(() => {
      var c = s.slice(0, 1)
      if (!c) {
        clearInterval(id)
        id = null
        this.push(safe({
          id: req.id,
          request: req,
          result: 'END'
        }))
      } else {
        this.push(safe({
          id: req.id,
          request: req,
          result: (c || '').toUpperCase()
        }))
        s = s.slice(1)
      }
    }, 300)

    done()
  })

  dup.pipe(ts).pipe(dup)
  dup.unpipe(function (ts) { ts.pipe(this) })

  var spy = []
  c.on('data', result => {
    if (result === 'END') {
      t.deepEqual(spy, ['A', 'B', 'C', 'D', 'E'])
      t.end()
    } else {
      spy.push(result)
    }
  })

  c.write('abcde')
})
