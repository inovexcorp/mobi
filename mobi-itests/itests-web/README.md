# Mobi Web Integration Tests
The web integration tests are written using Selenium and are run through the `WebSuiteIT`. The `WebSuiteIT` sets up a single Karaf container for the entire suite of tests and contains a variable to hold the URL for the home page that can be used within the Selenium tests for convenience. To add a Selenium test to the suite, simply add it to the `@Suite.SuiteClasses` annotation in `WebSuiteIT`. The Selenium test file must not end in "IT" otherwise it will be run separate from the test suite and fail.

