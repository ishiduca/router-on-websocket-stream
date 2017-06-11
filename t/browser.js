'use strict'
var test = require('tape')
var fact = require('../browser')
var missi = require('mississippi')

test('pipe', t => {
  var rpc = fact()
  var m = rpc.method('test')

  rpc.pipe(missi.through.obj((b, _, done) => {
    var str = String(b)
    var req = JSON.parse(str)

    if (!req.params.text) {
      return done(null, JSON.stringify({
        id: req.id,
        request: req,
        error: String(new Error('"text" not found'))
      }))
    }

    done(null, JSON.stringify({
      id: req.id,
      request: req,
      result: req.params.text.toUpperCase()
    }))
  }))
  .pipe(rpc)

  m.on('data', result => {
    t.is(result, 'HOGE', 'result eq "HOGE"')
    t.end()
  })

  m.on('error', err => {
    t.ok(/Error:\s*"text" not found/.test(err), `exists ${err}`)
  })

  m.write({})
  m.write({text: 'hoge'})
})
