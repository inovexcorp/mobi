// Karma configuration
// Generated on Tue Jan 17 2017 09:54:51 GMT-0500 (EST)

const webpackConfig = require('./webpack-configs/webpack.common');

module.exports = function(config) {
  config.set({
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['parallel', 'jasmine'],

    files: [
        'target/classes/build/vendor.*.js',
        'target/classes/build/app.*.js',
        'webpack.tests.js'
    ],

    preprocessors: {
        'webpack.tests.js': ['webpack']
    },

    webpack: {
        resolve: webpackConfig.resolve,
        module: webpackConfig.module,
        node: webpackConfig.node
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'html'],

    // configuration for the html reporter
    htmlReporter: {
        outputDir: 'target',
        namedFiles: true,
        urlFriendlyName: true,
        reportName: 'specReport'
    },

    browserNoActivityTimeout: 100000,

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // karma-parallel configuration
    parallelOptions: {
        executors: (Math.ceil(require('os').cpus().length / 2))
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
