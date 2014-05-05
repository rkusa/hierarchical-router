# Route

## API

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