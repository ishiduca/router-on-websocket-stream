'use strict'
var test = require('tape')
var router = require('browser')
var missi = require('mississippi')

test('', t => {
  var spy = []
  var r = router()
  var add = r.method('add')
  var ws = missi.through.obj((p, _, done) => {
    spy.push(JSON.parse(p))
    done()
  })

  add.once('finish', () => r.push(null))
  ws.once('finish', () => {
    t.is(spy[0].method, 'add', 'spy[0].method eq "add"')
    t.is(spy[1].method, 'add', 'spy[1].method eq "add"')
    t.is(spy[2].method, 'add', 'spy[2].method eq "add"')
    t.notOk(spy[0].broadcast, 'spy[0].broadcast eq false')
    t.ok(spy[1].broadcast, 'spy[1].broadcast eq true')
    t.notOk(spy[2].broadcast, 'spy[2].broadcast eq false')
    t.deepEqual(spy[0].params, [1, 2], 'spy[0].params e [1, 2]')
    t.deepEqual(spy[1].params, [2, 3], 'spy[1].params e [2, 3]')
    t.deepEqual(spy[2].params, [3, 4], 'spy[2].params e [3, 4]')
    t.end()
  })

  r.pipe(ws)

  add.write([1, 2])
  add.broadcast([2, 3])
  add.end([3, 4])
})
