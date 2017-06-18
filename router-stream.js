'use strict'
var inherits = require('inherits')
var stream = require('readable-stream')
var safe = require('json-stringify-safe')
var eos = require('end-of-stream')
var iss = require('is-stream')
var isp = require('is-promise')
var response = require('blue-frog-core/response')
var error = require('blue-frog-core/error')

module.exports = RouterStream
inherits(RouterStream, stream.Transform)

function RouterStream (routes) {
  if (!(this instanceof RouterStream)) return new RouterStream(routes)
  stream.Transform.call(this, {
    highWaterMark: 16384,
    objectMode: true
  })
  this.routes = routes || {}
}

RouterStream.prototype._transform = function _transform (b, _, done) {
  var str = String(b)
  var req; try {
    req = JSON.parse(str)
  } catch (e) {
    return JSONParseError()
  }

  if (!req.method) {
    return InvalidRequest('method not found in request object')
  }
  if (typeof this.routes[req.method] !== 'function') {
    return MethodNotFound(`"${req.method}" not found in router`)
  }

  var me = this
  var some = this.routes[req.method](req.params, req)

  if (iss.readable(some)) {
    some.on('data', function (result) {
      me.push(rpcResponse(result))
    })

    eos(some, function (err) {
      if (err) InternalError(err)
      else done(null, rpcResponse({responseEnd: true}))
    })

    return
  }

  if (isp(some)) {
    some.then(function (result) {
      done(null, rpcResponse(result))
    })
    .catch(InternalError)

    return
  }

  var mes = 'router.add should return "promise" or "readable stream"'
  InternalError(new TypeError(mes))

  function rpcResponse (result) {
    var res = response((req || {}).id || null, result)
    return safe(response.extend(res, {request: req}))
  }

  function InternalError (_err) {
    _rpcError(error.InternalError(_err))
  }

  function InvalidRequest (_err) {
    _rpcError(error.InvalidRequest(_err))
  }

  function MethodNotFound (_err) {
    _rpcError(error.MethodNotFound(_err))
  }

  function _rpcError (err) {
    var opt = {request: req}
    var rpcError = response.error(req.id || null, err)
    done(null, safe(response.error.extend(rpcError, opt)))
  }

  function JSONParseError () {
    var err = error.ParseError(str)
    var opt = {request: str}
    var rpcError = response.error(null, err)
    done(null, safe(response.error.extend(rpcError, opt)))
  }
}
