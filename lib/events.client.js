/*global confirm */

var Context = require('./context.client')
var co = require('co')
var qs = require('qs')

module.exports = function(router) {
  function dispatch(context, silent, trigger) {
    var route = router.match(context)

    if (route) {
      co(function*() {
        yield route(context, trigger)
        if (!silent && context.method === 'get') {
          var state = {
            method: context.method,
            path: context.path,
            body: context.body,
            params: context.params,
            query: context.query
          }
          // update URL
          window.history.pushState(state, null, context.path)
        }
      })()
    }

    return route
  }

  return {
    click: function(e) {
      if (e.ctrlKey || e.metaKey) return
      if (e.defaultPrevented) return

      // ensure link
      var el = e.target
      while (el && 'A' !== el.nodeName) el = el.parentNode
      if (!el || 'A' !== el.nodeName) return

      // if the `data-external` attribute is set to `true`, do not
      // intercept this link
      if (el.dataset.external === 'true') return

      // ensure protocol
      if (el.protocol !== ':' && el.protocol !== 'http:' && el.protocol !== 'https:') return

      // ensure non has for the same path
      var href = el.getAttribute('href')
      if (el.hash || !href || href === '#') return

      // do not intercept x-orgin links
      if (!sameOrigin(href)) return

      // intercept link
      e.preventDefault()
      var path = el.pathname + el.search

      // provide confirm functionality through `data-confirm`
      if (el.dataset.confirm && !confirm(el.dataset.confirm)) return

      // trigger route
      var silent  = el.dataset.silent  === 'true' ? true : false
      var trigger = el.dataset.trigger === 'false' ? false : true
      var context = new Context('get', path)
      dispatch(context, silent, trigger)
    },

    submit: function(e) {
      var el = e.target

      // if the `data-side` attribute is set to `server`, do not
      // intercept this link
      if (el.dataset.side === 'server') return

      var origin = window.location.protocol + "//" + window.location.host
        , method = el.method
        , path   = el.action

      // remove origin from path (action)
      if (path.indexOf(origin) === 0) {
        path = path.substr(origin.length)
      }

      var silent = el.dataset.silent  === 'true' ? true : false
      var body

      // POST submits
      if (method === 'post') {
        // support method overwrite
        var _method = el.querySelector('input[name=_method]')
        if (_method) method = _method.value

        path = path === '' ? '/' : path

        // serialize form elements
        body = qs.parse(serializeForm(el))
        if (body && Array.isArray(body) && body.length > 0) {
          var obj = {}
          body.forEach(function(input) {
            obj[input.name] = input.value
          })
          body = obj
        }

        silent = true
      }
      // GET submits
      else {
        // serialize form elements
        if (path.indexOf('?') > -1) path += '&'
        else path += '?'
        path += serializeForm(el)
      }

      var context = new Context(method, path)
      context.body = body || null
      if (!dispatch(context, silent, method === 'get')) {
        // if no route found, send POST request to server
        e.preventDefault()
      }
    },

    popstate: function(e) {
      if (e.state) {
        var state = e.state
        var context = new Context(state.method, state.path)
        context.body = state.body
        context.params = state.params
        context.query = state.query
        dispatch(context, true, true)
      }
    }
  }
}

function sameOrigin(href) {
  var origin = location.protocol + "//" + location.hostname + ":" + location.port
  return href.indexOf('http') === -1 || href.indexOf(origin) === 0
}

function serializeForm(form) {
  var values = []
  Array.prototype.slice.call(form.elements).forEach(function(el) {
    var type = el.getAttribute('type')
    if (el.nodeName.toLowerCase() !== 'fieldset' &&
      !el.disabled && type !== 'submit' && type !== 'reset' && type !== 'button' &&
      ((type !== 'radio' && type !== 'checkbox') || el.checked)) {

      values.push(encodeURIComponent(el.getAttribute('name')) + '=' + encodeURIComponent(el.value))
    }
  })
  return values.join('&')
}