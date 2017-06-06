const test = require('tape')
const tarpit = require('../')()

test('artax with one key', function (t) {
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

test('artax with mulitple keys and a repeat', function (t) {
  tarpit(['key1', 'key2', 'key3'], function (err, wait) {
    t.ok(!err, 'no error')
    t.equals(wait, 1, 'after one request wait should be 1')
    tarpit(['key2'], function (err, wait) {
      t.ok(!err, 'no error')
      t.equals(wait, 10, 'after two requests wait should be 10')
      tarpit(['key1', 'key2'], function (err, wait) {
        t.ok(!err, 'no error')
        t.equals(wait, 100, 'after three requests wait should be 100')
        t.end()
      })
    })
  })
})

test('artax with mulitple keys no repeat', function (t) {
  tarpit(['key11', 'key12', 'key13'], function (err, wait) {
    t.ok(!err, 'no error')
    t.equals(wait, 1, 'after one request wait should be 1')
    tarpit(['key14'], function (err, wait) {
      t.ok(!err, 'no error')
      t.equals(wait, 1, 'after one request wait should still be 1')
      t.end()
    })
  })
})
