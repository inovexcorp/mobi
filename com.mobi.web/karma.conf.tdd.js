// Karma configuration
// Generated on Tue Jan 17 2017 09:54:51 GMT-0500 (EST)

const commonConfig = require('./webpack-configs/webpack.common');
const devConfig = require(`./webpack-configs/webpack.dev.js`);
const webpackMerge = require('webpack-merge');
const webpackConfig = webpackMerge.smart(commonConfig, devConfig);

module.exports = function(config) {
  config.set({
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    files: [
        'webpack.tests.tdd.js',
        'webpack.tests.ng.js'
    ],

    preprocessors: {
        'webpack.tests.tdd.js': ['webpack', 'sourcemap'],
        'webpack.tests.ng.js': ['webpack', 'sourcemap']
    },

    webpack: {
        resolve: webpackConfig.resolve,
        module: webpackConfig.module,
        node: webpackConfig.node,
        devtool: 'inline-source-map'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
