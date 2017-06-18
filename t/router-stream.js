'use strict'
var test = require('tape')
var RouterStream = require('router-stream')
var missi = require('mississippi')

test('var routerStream = new RouterStream({routes})', t => {
  t.ok(new RouterStream({}).write, 'new RouterStream({}).write')
  t.ok(RouterStream({}).write, 'RouterStream({}).write')
  t.end()
})

test('routerStream.write(rpcStr) # application -> value or error', t => {
  var toUpperCase = (params, req) => {
    try {
      return params.value.toUpperCase()
    } catch (err) {
      return err
    }
  }
  var spy = []
  var s = new RouterStream({toUpperCase: toUpperCase})

  s.on('data', str => spy.push(str))
  s.once('end', () => {
    t.is(spy.length, 1, 'spy.length eq 1')
    t.deepEqual(JSON.parse(spy[0]), {
      jsonrpc: '2.0',
      id: 'return-result',
      request: {
//        jsonrpc: '2.0',
        id: 'return-result',
        method: 'toUpperCase',
        params: {value: 'foo'}
      },
      error: {
        code: -32603,
        message: 'Internal error',
        data: 'TypeError: router.add should return "promise" or "readable stream"'
      }
    }, spy[0])
    t.end()
  })

  s.end(JSON.stringify({id: 'return-result', method: 'toUpperCase', params: {value: 'foo'}}))
})

test('routerStream.write(rpcStr) # application -> promise', t => {
  var toUpperCase = (params, req) => {
     return (params && params.value && typeof params.value === 'string')
      ? Promise.resolve(params.value.toUpperCase())
      : Promise.reject(new Error('params.value not found'))
  }
  var spy = []
  var s = new RouterStream({toUpperCase: toUpperCase})

  s.on('data', str => spy.push(str))
  s.once('end', () => {
    t.is(spy.length, 2, 'spy.length eq 2')
    t.deepEqual(JSON.parse(spy[0]), {
      jsonrpc: '2.0',
      id: 'promise-return-error',
      request: {
//        jsonrpc: '2.0',
        id: 'promise-return-error',
        method: 'toUpperCase'
      },
      error: {
        code: -32603,
        message: 'Internal error',
        data: "Error: params.value not found"
      }
    }, spy[0])
    t.deepEqual(JSON.parse(spy[1]), {
      jsonrpc: '2.0',
      id: 'promise-return-result',
      request: {
//        jsonrpc: '2.0',
        id: 'promise-return-result',
        method: 'toUpperCase',
        params: {value: 'foo'}
      },
      result: 'FOO'
    }, spy[1])
    t.end()
  })

  s.write(JSON.stringify({id: 'promise-return-error', method: 'toUpperCase'}))
  s.end(JSON.stringify({id: 'promise-return-result', method: 'toUpperCase', params: {value: 'foo'}}))
})

test('routerStream.write(rpcStr) # application -> readable.stream', t => {
  var toUpperCase = (params, req) => {
    var s = missi.through.obj()
    var flg = params && params.value && typeof params.value === 'string'

    if (!flg) {
       process.nextTick(() => s.emit('error', new TypeError('params.value must be "string"')))
    } else {
      process.nextTick(() => {
        params.value.split(' ').map(v => {
          s.write(v.toUpperCase())
        })
        s.end()
      })
    }

    return s
  }
  var spy = []
  var s = new RouterStream({toUpperCase: toUpperCase})

  s.on('data', str => spy.push(str))
  s.once('end', () => {
    t.is(spy.length, 4, 'spy.length eq 4')
    t.deepEqual(JSON.parse(spy[0]), {
      jsonrpc: '2.0',
      id: 'stream-return-error',
      request: {
//        jsonrpc: '2.0',
        id: 'stream-return-error',
        method: 'toUpperCase'
      },
      error: {
        code: -32603,
        message: 'Internal error',
        data: 'TypeError: params.value must be "string"'
      }
    }, spy[0])
    t.deepEqual(JSON.parse(spy[1]), {
      jsonrpc: '2.0',
      id: 'stream-return-result',
      request: {
//        jsonrpc: '2.0',
        id: 'stream-return-result',
        method: 'toUpperCase',
        params: {value: 'foo fooo'}
      },
      result: 'FOO'
    }, spy[1])
    t.deepEqual(JSON.parse(spy[2]), {
      jsonrpc: '2.0',
      id: 'stream-return-result',
      request: {
//        jsonrpc: '2.0',
        id: 'stream-return-result',
        method: 'toUpperCase',
        params: {value: 'foo fooo'}
      },
      result: 'FOOO'
    }, spy[2])
    t.deepEqual(JSON.parse(spy[3]), {
      jsonrpc: '2.0',
      id: 'stream-return-result',
      request: {
//        jsonrpc: '2.0',
        id: 'stream-return-result',
        method: 'toUpperCase',
        params: {value: 'foo fooo'}
      },
      result: {responseEnd: true}
    }, spy[3])
    t.end()
  })

  s.write(JSON.stringify({id: 'stream-return-error', method: 'toUpperCase'}))
  s.end(JSON.stringify({id: 'stream-return-result', method: 'toUpperCase', params: {value: 'foo fooo'}}))
})
