const Promise = require('bluebird')
const redis = require('redis')
Promise.promisifyAll(redis.RedisClient.prototype)

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
  const client = redis.createClient(process.env.LOGIN_CACHE_REDIS || 'redis://127.0.0.1:6379')

  const id = 'tarpit:' + name + ':' + key
  client.getAsync(id).then(function (reply) {
    const record = json(reply) || {}
    if (record.err) throw new Error('There was an error fetching from redis. Error: ' + record.err)
    console.log('tarpit got', id)

    const count = (record.count || 0) + 1

    const data = JSON.stringify({time: Date.now(), count: count})
    client.setexAsync(id, max / 1000, data).then(function (reply) {
      cb(reply.err, record)
    })
  })
}

function json (str) {
  try {
    return JSON.parse(str)
  } catch (e) {}
}
