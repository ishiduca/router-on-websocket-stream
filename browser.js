'use strict'
var stream = require('readable-stream')
var inherits = require('inherits')
var HandleS = require('./handle-stream')

module.exports = Dup
inherits(Dup, stream.Duplex)

function Dup () {
  if (!(this instanceof Dup)) return new Dup()
  stream.Duplex.call(this, {objectMode: true})
  this._handers = {}
}

Dup.prototype._read = function () {}
Dup.prototype._write = function _write (b, _, done) {
  var s = String(b)
  var res; try {
    res = JSON.parse(s)
  } catch (e) {
    return JSONParseError()
  }

  this.emit('response', res)

  var hs = this._handers[res.request.method]
  if (hs) {
    hs.emit('response', res)
    if (res.error) rpcResponseError()
    else if (res.result != null) hs.push(res.result)
  }

  done()

  function JSONParseError () {
    var err = new Error('JSON parse error')
    err.name = 'JSONParseError'
    err.JSONParseError = true
    err.data = s
    return done(err)
  }

  function rpcResponseError () {
    if (res.error instanceof Error) return hs.emit('error', res.error)
    var reg = (res.error || '').match(/^(.*Error):\s*(.+)$/)
    if (reg) {
      var err = new Error(reg[2])
      err.name = reg[1]
      return hs.emit('error', err)
    }
  }
}

Dup.prototype.method = function createHandleStream (method) {
  return (this._handers[method] = new HandleS(this, method))
}
