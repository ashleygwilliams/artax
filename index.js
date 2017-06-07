const logger = require('bole')('tarpit')
const Promise = require('bluebird')
const redis = require('redis')

module.exports = tarpit

function tarpit (opts = {}) {
  const wait = opts.wait || 10
  const max = opts.max || 10000
  const name = opts.name || ''

  return function (key, target) {
    const client = redis.createClient(process.env.LOGIN_CACHE_REDIS || 'redis://127.0.0.1:6379')
    const keys = [].concat(key)
    const getRecords = Promise.all(keys.map(key => pit(client, key, name, max)))

    return getRecords.then(records => {
      const record = getHighestCount(records)
      record.time = record.time || 0
      if (maxDoesntExist(record)) record.max = max
      if (countDoesntExist(record)) record.count = 0
      if (escapesDoesntExist(record)) record.escapes = 0

      const now = Date.now()

      if (shouldEscape(record, now)) {
        console.log(`key ${record.key} escaped`)
        record.count = 0
        record.escapes += 1
      }

      if (repeatVisitor(record)) record.max = record.max * record.escapes

      const id = `${name}:${record.key}`
      return updateRecord(client, id, record).then(record => {
        var delay = calculateDelay(wait, record)
        console.log(`key ${record.key} is now delayed for ${delay}`)
        if (delay > 100) logger.warn(`key ${record.key} is now delayed for ${delay}`)
        client.unref()
        return tar(null, delay, target)
      })
    })
    .catch(err => {
      return tar(err, 0, target)
    })
  }
}

function updateRecord (client, id, newRecord) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(newRecord)
    client.setex(id, newRecord.max / 1000, data, function (err) {
      if (err) return reject(err)
      return resolve(newRecord)
    })
  })
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

function calculateDelay (wait, record) {
  // on the first visit the wait should be 1, so put it ^0th (1-1)
  const delay = Math.pow(wait, record.count - 1)
  return delay > record.max ? record.max : delay
}

function shouldEscape (record, now) {
  const isNotFirstTime = record.count > 1
  const hasWaitedLongEnough = record.time < now - (record.max * 2)
  return isNotFirstTime && hasWaitedLongEnough
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

function pit (client, key, name, max) {
  const id = `${name}:${key}`

  return new Promise((resolve, reject) => {
    client.get(id, function (err, reply) {
      if (err) return reject(new Error(`There was an error fetching from redis. Error: ${err}`))

      console.log('tarpit got', key)

      const record = json(reply) || {}

      record.count = (record.count || 0) + 1
      record.time = Date.now()
      record.key = key

      const data = JSON.stringify(record)
      client.setex(id, max / 1000, data, function (err) {
        if (err) return reject(err)
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
