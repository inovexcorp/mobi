# Mobi Web Integration Tests
The web integration tests are written using Selenium and are run through the `WebSuiteIT`. The `WebSuiteIT` sets up a single Karaf container for the entire suite of tests and contains a variable to hold the URL for the home page that can be used within the Selenium tests for convenience. To add a Selenium test to the suite, simply add it to the `@Suite.SuiteClasses` annotation in `WebSuiteIT`. The Selenium test file must not end in "IT" otherwise it will be run separate from the test suite and fail.

These integration tests are controlled by the `skipSelenium` and `skipITs` system properties and are disabled by default. To run the web itests as part of the build, set the properties to false:

```
mvn clean install -DskipSelenium=false -DskipITs=false
```

In order for the tests to run completely, you must have the following browsers installed:

| Browser | Version                                                           |
|---------|-------------------------------------------------------------------|
| Chrome  | 62 and greater (will not ignore local host certificate otherwise) |
| Firefox | 50.0 and greater                                                  |
