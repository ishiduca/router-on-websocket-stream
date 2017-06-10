'use strict'
var test = require('tape')
var safe = require('json-stringify-safe')
var routeStream = require('../route-stream')
var missi = require('mississippi')

test('notFoundRequestMethodError', t => {
  var route = routeStream({})

  route.on('data', str => {
    var o = JSON.parse(str)
    t.ok(o.error, 'error ok')
    t.ok(/notFoundRequestMethodError/.test(o.error), o.error)
    t.end()
  })

  missi.finished(route, err => {
    if (err) console.error(err)
    console.log('end')
  })

  route.write(safe({
    params: {foo: true}
  }))
})

test('notFoundRoutesMethodError', t => {
  var route = routeStream({})

  route.on('data', str => {
    var o = JSON.parse(str)
    t.ok(o.error, 'error ok')
    t.ok(/notFoundRoutesMethodError/.test(o.error), o.error)
    t.end()
  })

  missi.finished(route, err => {
    if (err) console.error(err)
    console.log('end')
  })

  route.write(safe({
    method: 'foo', params: {foo: true}
  }))
})

test('multi response # stream', t => {
  var spy = []
  var route = routeStream({
    'm': (params) => {
      var c = 0
      var s = missi.through.obj()
      var id = setInterval(() => {
        if ((c += 1) > 10) {
          clearInterval(id)
          id = null
          return s.end({end: true})
        }
        s.write({count: params.first + c})
      }, 10)
      return s
    }
  })

  route.on('data', s => spy.push(JSON.parse(s).result))

  missi.finished(route, err => {
    t.notOk(err, 'no exists error')
    t.deepEqual(spy, [
      {count: 11},
      {count: 12},
      {count: 13},
      {count: 14},
      {count: 15},
      {count: 16},
      {count: 17},
      {count: 18},
      {count: 19},
      {count: 20},
      {end: true},
      {count: -9},
      {count: -8},
      {count: -7},
      {count: -6},
      {count: -5},
      {count: -4},
      {count: -3},
      {count: -2},
      {count: -1},
      {count: 0},
      {end: true}
    ],
    'can send multi response')
    t.end()
  })

  route.write(safe({
    method: 'm',
    params: {
      first: 10
    }
  }))

  route.end(safe({
    method: 'm',
    params: {
      first: -10
    }
  }))
})

test('multi response # promise', t => {
  var spy = []
  var route = routeStream({
    'm': (params) => {
      var ps = [10, 20, 30, 40].map((n, i) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({count: params.first + i})
          }, n)
        })
      })
      return Promise.all(ps)
    }
  })

  route.on('data', s => spy.push(JSON.parse(s).result))

  missi.finished(route, err => {
    t.notOk(err, 'no exists error')
    t.deepEqual(spy, [[
      {count: 10},
      {count: 11},
      {count: 12},
      {count: 13}], [
      {count: -10},
      {count: -9},
      {count: -8},
      {count: -7}]
    ],
    'can send multi response')
    t.end()
  })

  route.write(safe({
    method: 'm',
    params: {
      first: 10
    }
  }))

  route.end(safe({
    method: 'm',
    params: {
      first: -10
    }
  }))
})

test('a response # promise', t => {
  var spy = []
  var route = routeStream({
    'm': (params) => {
      return Promise.resolve({count: params.first * -1})
    }
  })

  route.on('data', s => spy.push(JSON.parse(s).result))

  missi.finished(route, err => {
    t.notOk(err, 'no exists error')
    t.deepEqual(spy, [
      {count: -10},
      {count: 10}
    ],
    'can send multi response')
    t.end()
  })

  route.write(safe({
    method: 'm',
    params: {
      first: 10
    }
  }))

  route.end(safe({
    method: 'm',
    params: {
      first: -10
    }
  }))
})
