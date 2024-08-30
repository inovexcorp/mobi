// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['parallel', 'waitwebpack', 'jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('./karma.waitwebpack'),
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-parallel'),
        require('karma-coverage-istanbul-reporter'),
        require('@angular-devkit/build-angular/plugins/karma')
      ],
      client: {
        clearContext: true, // leave Jasmine Spec Runner output visible in browser
        args: ['--build']
      },
      coverageIstanbulReporter: {
        dir: require('path').join(__dirname, '../coverage/mobi'),
        reports: ['html', 'lcovonly', 'text-summary'],
        fixWebpackSourcePaths: true
      },
      reporters: ['progress', 'kjhtml'],
      jasmineHtmlReporter: {
        suppressAll: true, // Suppress all messages (overrides other suppress settings)
        suppressFailed: true // Suppress failed messages
      },
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: true,
      browsers: ['ChromeHeadlessNoSandbox'],
      customLaunchers: {
        ChromeHeadlessNoSandbox: {
            base: 'ChromeHeadless',
            flags: [
              '--no-sandbox',
            ],
        }
      },
      singleRun: true,
      restartOnFileChange: true,
      // Concurrency level
      // how many browser should be started simultaneous
      concurrency: Infinity,
      // Increased timeouts for connecting to the browser
      captureTimeout: 210000,
      browserDisconnectTolerance: 3,
      browserDisconnectTimeout: 210000,
      browserNoActivityTimeout: 210000
    });
  };
