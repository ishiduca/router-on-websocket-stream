var safe = require('json-stringify-safe')
var uniq = require('unique-string')
var through = require('through2')
var duplex = require('duplexify')

module.exports = function createStream () {
  var methods = {}
  var readable = through.obj()
  var writable = through.obj(function (b, _, done) {
    var str = String(b)
    var res; try {
      res = JSON.parse(str)
    } catch (e) {
      return JSONParseError()
    }

    dup.emit('response', res)

    var req = res.request
    var dp = methods[req.method]
    if (dp) {
      dp.emit('response', res)
      if (res.error) dp.emit('error', res.error)
      else dp.push(res.result)
    }

    done()

    function JSONParseError () {
      var err = new Error('JSON parse error')
      err.name = 'JSONParseError'
      err.JSONParseError = true
      err.data = str
      dup.emit('error', err)
      done()
    }
  })

  var dup = duplex.obj(writable, readable)

  dup.method = function (method) {
    var rs = through.obj()
    var ws = through.obj(function (params, _, done) {
      readable.write(safe({
        id: uniq(),
        method: method,
        params: params
      }))
      done()
    })

    return (methods[method] = duplex.obj(ws, rs))
  }

  return dup
}
