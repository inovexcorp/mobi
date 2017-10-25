# Mobi Web Integration Tests
The web integration tests are written using Selenium and are run through the `MobiWebTestSuite`. The `MobiWebTestSuite` sets up a single Karaf container for the entire suite of tests and contains a variable to hold the URL for the home page that can be used within the Selenium tests for convenience. To add a Selenium test to the suite, simply add it to the `@Suite.SuiteClasses` annotation in `MobiWebTestSuite`.

