# hierarchical-router

[![NPM](https://badge.fury.io/js/hierarchical-router.svg)](https://npmjs.org/package/hierarchical-router)
[![Build Status](https://secure.travis-ci.org/rkusa/hierarchical-router.svg)](http://travis-ci.org/rkusa/hierarchical-router)
[![Dependency Status](https://david-dm.org/rkusa/hierarchical-router.svg?theme=shields.io)](https://david-dm.org/rkusa/hierarchical-router)

[![browser support](https://ci.testling.com/rkusa/hierarchical-router.png)
](https://ci.testling.com/rkusa/hierarchical-router)

## Route Hierarchy

  With `hierarchical-router` routes are defined hierarchically. The resulting route hierarchy is used to determine the necessary parts that have to be executed to reflect changes between two user interactions. The business logic of a route is thereby separated into parts, where each part reflects the changes necessary to move from one route to an immediately following one.

  **Example:**

```js
var root     = swac.get('/')             // = /
var projects = root.get('/projects')     // = /projects
var project  = projects.get('/:project') // = /projects/:project
var tasks    = project.get('/tasks')     // = /projects/:project/tasks
```

## Router

  `Router` specific methods and accessors.

```js
var Router = require('hierarchical-router')
```

### new Router(opts)

### router.init(handler)

  This method can be used as a starting point for a route hierarchy. It is not bound to a specific path and its `handler` will always be executed (on the server-side) when one of its descendants is called. Unlike normal routes, this init-route's `handler` gets access to the request object `req` (which itself is adapter specific). It returns a [Route](route.md).

  The `handler(req, locals, done)` retrieves the current request object `req` and the current `locals`. When done, the callback should be called: `done()`.

```js
var root = router.init(function*(req, locals, done) {
  locals.user = req.user
  yield done
})
```

## Route

### route.get([pattern,] handler)

  This methods establishes a `GET` route. It returns a new `Route` object, which is used to chain descendant routes. The `pattern` is optional. If provided, it is appended to the joined pattern of all its ancestors. When matched, the `handler` is executed.

  The `handler(locals, done, params, body, query)` retrieves

- the current `locals`,
- the route's parameter values `params` (e.g., `params.id` for the pattern `/:id`),
- the `body` containing the POST/PUT values and
- the URL `query` paramters.

  When done, the callback should be called: `done()`, `done.render(viewName)` or `done.redirect(path, opts)`. The `done.redirect` accepts the following options:

- `opts.silent` - whether the browser's address bar should be updated (default: `false`)
- `opts.trigger` - whether the targeted route should be executed (default: `true`)

  The methods `route.post`, `route.put` and `route.delete` (alias: `route.del`) can be used accordingly.

```js
var todos = route.get('/', function*(locals, done) {
  locals.todos = yield Todo.all()
  done.render('index')
})

todos.get('/:id', function*(locals, done, params) {
  locals.todo = yield Todo.get(params.id)
  if (!locals.todo) return done.redirect('../', { trigger: false })
  done.render('todo')
})
```

### route.ready(fn)
### route.cleanup(fn)

## MIT License
Copyright (c) 2014 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.