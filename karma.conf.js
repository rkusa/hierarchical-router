module.exports = function(config) {
  config.set({

    frameworks: ['mocha'],

    preprocessors: {
      'test/client.js': ['webpack']
    },

    webpack: {
      cache: false,

      module: {
        loaders: [
          { test: /\.js$/, loader: 'transform?regeneratorify' }
        ]
      }
    },

    client: {
      mocha: {
        ui: 'tdd'
      }
    },

    // browsers: ['Chrome'],

    sauceLabs: {
      testName: 'hierarchical-router',
      recordScreenshots: false
    },

    captureTimeout: 120000,

    customLaunchers: require('./test/browser.json')
  })
}