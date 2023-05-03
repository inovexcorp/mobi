// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['waitwebpack', 'jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('./karma.waitwebpack'),
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-coverage-istanbul-reporter'),
        require('@angular-devkit/build-angular/plugins/karma')
      ],
      client: {
        clearContext: false // leave Jasmine Spec Runner output visible in browser
      },
      coverageIstanbulReporter: {
        dir: require('path').join(__dirname, '../coverage/mobi'),
        reports: ['html', 'lcovonly', 'text-summary'],
        fixWebpackSourcePaths: true
      },
      reporters: ['progress', 'kjhtml'],
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: true,
      browsers: ['Chrome'],
      customLaunchers: {
        ChromeHeadlessNoSandbox: {
          base: 'ChromeHeadless',
          flags: [
            '--no-sandbox',
            '--user-data-dir=/tmp/chrome-test-profile',
            '--disable-web-security',
            '--remote-debugging-address=0.0.0.0',
            '--remote-debugging-port=9222',
          ],
          debug: true,
        },
      },
      singleRun: false,
      restartOnFileChange: true,
      captureTimeout: 210000,
      browserDisconnectTolerance: 3,
      browserDisconnectTimeout: 210000,
      browserNoActivityTimeout: 210000,
    });
  };