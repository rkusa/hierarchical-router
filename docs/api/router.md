# Router

## API

  `Router` specific methods and accessors.

### router.init(handler)

  This method can be used as a starting point for a route hierarchy. It is not bound to a specific path and its `handler` will always be executed (on the server-side) when one of its descendants is called. Unlike normal routes, this init-route's `handler` gets access to the request object `req` (which itself is adapter specific). It returns a [Route](route.md).

  The `handler(req, locals, done)` retrieves the current request object `req` and the current `locals`. When done, the callback should be called: `done()`.

```js
var root = router.init(function*(req, locals, done) {
  locals.user = req.user
  yield done
})
```