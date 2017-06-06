const test = require('tape')
const tarpit = require('../')()

test('aaaaarrrrtttaaxxx', function (t) {
  tarpit('testpit', function (err, wait) {
    t.ok(!err, 'no error')
    t.equals(wait, 1, 'after one request wait should be 1')
    tarpit('testpit', function (err, wait) {
      t.ok(!err, 'no error')
      t.equals(wait, 10, 'after two requests wait should be 10')
      t.end()
    })
  })
})
