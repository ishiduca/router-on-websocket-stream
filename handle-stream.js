'use strict'
var stream = require('readable-stream')
var inherits = require('inherits')
var safe = require('json-stringify-safe')
var uniq = require('unique-string')
var xtend = require('xtend')

module.exports = HandleS
inherits(HandleS, stream.Duplex)

function HandleS (s, method) {
  if (!(this instanceof HandleS)) return new HandleS(s, method)
  stream.Duplex.call(this, {objectMode: true})
  this._request = {method: method}
  this._duplex = s
}

HandleS.prototype._read = function () {}
HandleS.prototype._write = function _write (params, _, done) {
  var rpc = xtend({
    id: uniq(),
    params: params
  }, this._request)
  this._duplex.push(safe(rpc))
  this.emit('request', rpc)
  this._duplex.emit('request', rpc)
  done()
}
