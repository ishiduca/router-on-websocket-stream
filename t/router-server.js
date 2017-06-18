'use strict'
var test = require('tape')
var router = require('index')
var missi = require('mississippi')
var request = require('blue-frog-core/request')
var safe = require('json-stringify-safe')

test('var trnasformStream = router.route()', t => {
  var rs = missi.through.obj()
  var r = router()
  var rr = r.route()
  var spy = []

  rs.pipe(rr)

  rr.on('data', json => spy.push(JSON.parse(json)))
  rr.once('end', () => {
    t.is(spy.length, 1, 'spy called once')
    t.deepEqual(spy[0], {
      jsonrpc: '2.0',
      id: null,
      request: {
        jsonrpc: '2.0',
        id: null,
        method: 'foo'
      },
      error: {
        code: -32601,
        message: 'Method not found',
        data: '"foo" not found in router'
      }
    }, safe(spy[0]))
    t.end()
  })

  rs.end(safe(request(null, 'foo')))
})

test('readable.pipe(route.route()).pipe(writable)', t => {
  var spy = []
  var rs = missi.through.obj((o, _, done) => {
    done(null, safe(o))
  })
  var ws = missi.through.obj((json, _, done) => {
    done(null, JSON.parse(json))
  })

  var r = router()

  r.add('multi', (params, req) => {
    var flg = params && typeof params.first === 'number'
    if (!flg) return Promise.reject(new TypeError('params.first must be "number"'))

    var s = missi.through.obj()
    var max = 10
    var c = params.first
    var id = setInterval(() => {
      if (c > max) return end()
      s.write({count: c})
      c += 1
    }, 10)

    return s

    function end () {
      clearInterval(id)
      id = null
      s.end()
    }
  })

  rs.pipe(r.route()).pipe(ws/*, {end: false}*/)

  ws.on('data', json => spy.push(json))
  ws.on('end', () => {
    t.is(spy.length, 4, 'spy.length eq 4')
    t.deepEqual(spy[0], {
      jsonrpc: '2.0',
      id: '456',
      request: {
        jsonrpc: '2.0',
        id: '456',
        method: 'multi'
      },
      error: {
        code: -32603,
        message: 'Internal error',
        data: 'TypeError: params.first must be "number"'
      }
    }, safe(spy[0]))
    t.deepEqual(spy[1], {
      jsonrpc: '2.0',
      id: '789',
      request: {
        jsonrpc: '2.0',
        id: '789',
        method: 'multi',
        params: {first: 9}
      },
      result: {count: 9}
    }, safe(spy[1]))
    t.deepEqual(spy[2], {
      jsonrpc: '2.0',
      id: '789',
      request: {
        jsonrpc: '2.0',
        id: '789',
        method: 'multi',
        params: {first: 9}
      },
      result: {count: 10}
    }, safe(spy[2]))
    t.deepEqual(spy[3], {
      jsonrpc: '2.0',
      id: '789',
      request: {
        jsonrpc: '2.0',
        id: '789',
        method: 'multi',
        params: {first: 9}
      },
      result: {responseEnd: true}
    }, safe(spy[3]))
    t.end()
  })

  rs.write(request('456', 'multi'))
  rs.end(request('789', 'multi', {first: 9}))
})
