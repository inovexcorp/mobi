import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';
import 'core-js/es7/reflect';

const testing = require('@angular/core/testing');
const browser = require('@angular/platform-browser-dynamic/testing');

beforeAll(() => {
 testing.TestBed.resetTestEnvironment();
 testing.TestBed.initTestEnvironment(browser.BrowserDynamicTestingModule,
    browser.platformBrowserDynamicTesting());
});

const context = require.context('./src/main/resources/public', true, /\.spec\.ts$/);
context.keys().map(context);
function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

const modules = requireAll(context);