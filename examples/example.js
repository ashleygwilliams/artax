const tarpit = require('../')

var opts = {
  name: 'testpit'
}

const testpit = tarpit(opts)
testpit(['randomkey'], function (err, wait) {
  if (err) throw err
  console.log('i had to wait', wait, 'in the tarpit')

  testpit(['randomkey'], function (err, wait) {
    if (err) throw err
    console.log('i had to wait', wait, 'in the tarpit')

    testpit(['randomkey'], function (err, wait) {
      if (err) throw err
      console.log('i had to wait', wait, 'in the tarpit')
    })
  })
})
