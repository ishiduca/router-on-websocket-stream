'use strict'
var stream = require('readable-stream')
var inherits = require('inherits')
var HandleStream = require('./handle-stream')

module.exports = Dup
inherits(Dup, stream.Duplex)

function Dup () {
  if (!(this instanceof Dup)) return new Dup()
  stream.Duplex.call(this, {
    highWaterMark: 16384,
    objectMode: true
  })
  this.handles = {}
}

Dup.prototype._read = function () {}
Dup.prototype._write = function _write (b, _, done) {
  var s = String(b)
  var res; try {
    res = JSON.parse(s)
  } catch (er) {
    return JSONParserError()
  }

  this.emit('response', res)

  var handle = this.handles[res.request.method]
  if (handle) {
    handle.emit('response', res)
    if (res.error) handle.emit('error', res.error)
    else if (res.result != null) handle.push(res.result)
  }

  done()

  function JSONParserError () {
    var err = new Error('JSON parse error')
    err.name = 'JSONParserError'
    err.JSONParserError = true
    err.data = s
    return done(err)
  }
}

Dup.prototype.method = function (method) {
  return (this.handles[method] = new HandleStream(this, method))
}
