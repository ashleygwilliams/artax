const logger = require('bole')('tarpit')
const Promise = require('bluebird')

module.exports = tarpit

function tarpit (opts = {}) {
  const wait = opts.wait || 10
  const max = opts.max || 10000
  const name = opts.name || ''

  return function (key, target) {
    const keys = [].concat(key)
    const getRecords = Promise.all(keys.map(key => pit(key, name, max)))

    return getRecords.then(records => {
      const record = getHighestCount(records)

      const now = Date.now()
      record.time = record.time || 0

      if (maxDoesntExist(record)) record.max = max
      if (countDoesntExist(record)) record.count = 0
      if (escapesDoesntExist(record)) record.escapes = 0

      if (shouldEscape(record, now, max)) {
        record.count = 0
        record.escapes += 1
      }

      if (repeatVisitor) record.max = record.max * record.escapes

      var delay = calculateDelay(wait, record.count)
      if (delay > max) delay = max

      if (delay > 100) logger.warn(`key ${key} is now delayed for ${delay}`)
      return tar(null, delay, target)
    })
    .catch(err => {
      return tar(err, 0, target)
    })
  }
}

function getHighestCount (records) {
  return Array.from(records).sort((a, b) => a.count < b.count)[0]
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

function escapesDoesntExist (record) {
  return !record.escapes || isNaN(record.escapes)
}

function maxDoesntExist (record) {
  return !record.max || isNaN(record.max)
}
function repeatVisitor (record) {
  return record.escapes > 1
}

function pit (key, name, max) {
  const redis = require('redis')
  const client = redis.createClient(process.env.LOGIN_CACHE_REDIS || 'redis://127.0.0.1:6379')

  const id = `tarpit: ${name}:${key}`

  return new Promise((resolve, reject) => {
    client.get(id, function (err, reply) {
      if (err) return reject(new Error(`There was an error fetching from redis. Error: ${err}`))

      console.log('tarpit got', id)

      const record = json(reply) || {}
      const count = (record.count || 0) + 1

      const data = JSON.stringify({time: Date.now(), count: count})
      client.setex(id, max / 1000, data, function (err) {
        if (err) return reject(err)
        client.unref()
        return resolve(record)
      })
    })
  })
}

function json (str) {
  try {
    return JSON.parse(str)
  } catch (e) {}
}
