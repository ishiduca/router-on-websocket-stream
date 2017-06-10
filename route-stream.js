'use strict'
var eos = require('end-of-stream')
var safe = require('json-stringify-safe')
var stream = require('readable-stream')
var iss = require('is-stream')
var inherits = require('inherits')

module.exports = RouterStream
inherits(RouterStream, stream.Transform)

function RouterStream (routes) {
  if (!(this instanceof RouterStream)) return new RouterStream(routes)
  stream.Transform.call(this, {objectMode: true})
  this.routes = routes || {}
}

RouterStream.prototype._transform = function _write (b, _, done) {
  var str = String(b)
  var req; try {
    req = JSON.parse(str)
  } catch (e) {
    return JSONParseError()
  }

  if (!req.method) return notFoundRequestMethodError()
  if (typeof this.routes[req.method] !== 'function') return notFoundRoutesMethodError()

  var me = this
  var s = this.routes[req.method](req.params)

  if (!iss.readable(s)) return isNotStreamError(s)

  s.on('data', function (data) {
    me.push(safe({
      request: req,
      result: data
    }))
  })

  eos(s, function (err) {
    if (err) onError(err)
    else done()
  })

  function JSONParseError () {
    var err = new Error('JSON parse error')
    err.data = str
    err.name = 'JSONParseError'
    err.JSONParseError = true
    return onError(err)
  }

  function notFoundRequestMethodError () {
    var err = new Error('"method" not found in request')
    err.data = req
    err.name = 'notFoundRequestMethodError'
    err.notFoundRequestMethodError = true
    return onError(err)
  }

  function notFoundRoutesMethodError () {
    var err = new Error(`"${req.method}" not found in this.routes`)
    err.data = req
    err.name = 'notFoundRoutesMethodError'
    err.notFoundRoutesMethodError = req.method
    return onError(err)
  }

  function isNotStreamError (s) {
    var err = new Error('is not readableStream')
    return onError(err)
  }

  function onError (err) {
    done(null, safe({
      request: req || str,
      error: String(err)
    }))
  }
}
