var customLaunchers = {
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7'
  },
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '27'
  },
  sl_ios_safari: {
    base: 'SauceLabs',
    browserName: 'iphone',
    platform: 'OS X 10.9',
    version: '7.1'
  },
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
  }
}

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

    reporters: ['story'],

    // browsers: ['Chrome'],

    sauceLabs: {
      testName: 'hierarchical-router',
      startConnect: true
    },

    customLaunchers: customLaunchers,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  })
}