module.exports = function(config) {
  config.set({
    autoWatch: false,

    frameworks: ['mocha'],

    client: {
      mocha: {
        ui: 'tdd'
      }
    },

    sauceLabs: {
      testName: 'hierarchical-router',
      recordScreenshots: false
    },

    captureTimeout: 120000,

    customLaunchers: require('./test/browser.json')
  })
}