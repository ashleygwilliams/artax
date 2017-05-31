const logger = require('bole')('tarpit')

module.exports = tarpit

function tarpit (opts) {
  const wait = opts.wait || 10
  const max = opts.max || 10000
  const name = opts.name || ''

  return function (key, target) {
    pit(key, name, max, function (err, record) {
      const now = Date.now()
      record.time = record.time || 0

      if (countDoesntExist(record)) record.count = 0
      if (shouldEscape(record, now, max)) record.count = 0

      var delay = calculateDelay(wait, record.count)
      if (delay > max) delay = max

      if (delay > 100) logger.warn(`key ${key} is now delayed for ${delay}`)
      tar(err, delay, target)
    })
  }
}

function tar (err, delay, target) {
  setTimeout(function () {
    target(err, delay)
  }, delay || 0)
  return delay
}

function calculateDelay (wait, count) {
  return Math.pow(wait, count)
}

function shouldEscape (record, now, max) {
  return record.time < now - (max * 2)
}

function countDoesntExist (record) {
  return !record.count || isNaN(record.count)
}

function pit (key, name, max, cb) {
  const redis = require('redis')
  const client = redis.createClient(process.env.LOGIN_CACHE_REDIS || 'redis://127.0.0.1:6379')

  const id = 'tarpit:' + name + ':' + key
  client.get(id, function (err, reply) {
    if (err) throw new Error('There was an error fetching from redis. Error: ' + err)
    console.log('tarpit got', id)

    const record = json(reply) || {}
    const count = (record.count || 0) + 1

    const data = JSON.stringify({time: Date.now(), count: count})
    client.setex(id, max / 1000, data, function (err) {
      client.unref()
      cb(err, record)
    })
  })
}

function json (str) {
  try {
    return JSON.parse(str)
  } catch (e) {}
}
