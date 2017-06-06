# artax
> exponentially stall a functional call based on frequency of a keyed request to call

[![Build Status](https://travis-ci.org/ashleygwilliams/artax.svg?branch=master)](https://travis-ci.org/ashleygwilliams/artax)

![artax](artax.gif)

`artax` is a package that allows you to exponentially stall responses based on the frequency of a keyed
request. for example, if a specific IP requests an endpoint too frequently, you can use artax to
stall the handler sending a response back, until the rate of request is reduced.

## installation

```
npm install @ag_dubs/artax --save
```

## usage

see this [example](examples/example.js).

`artax` uses [redis](https://redis.io/). you'll need to have a redis-server running for `artax` to work.
