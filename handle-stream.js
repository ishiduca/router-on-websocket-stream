'use strict'
var stream = require('readable-stream')
var inherits = require('inherits')
var uniq = require('unique-string')
var safe = require('json-stringify-safe')
var request = require('blue-frog-core/request')

module.exports = HandleStream
inherits(HandleStream, stream.Duplex)

function HandleStream (dup, method) {
  if (!(this instanceof HandleStream)) return new HandleStream(dup, method)
  stream.Duplex.call(this, {
    highWaterMark: 16384,
    objectMode: true
  })
  this._method = method
  this._duplex = dup
}

HandleStream.prototype._read = function () {}
HandleStream.prototype._write = function _write (params, _, done) {
  var req = request(uniq(), this._method, params)
  this._duplex.push(safe(req))
  this.emit('request', req)
  this._duplex.emit('request', req)
  done()
}
