# Mobi Web Integration Tests
The web integration tests are written in Javascript and are run using the `nightwatch.js` suite inside of a Mobi docker image. Upon the complete build 
of a distribution of Mobi, developers should then able to successfully run web integration tests. All web integration test are housed as `spec.js` files
and are found underneath the `src/test/js` directory, and all other resources needed to run the tests are found under `src/test/resources`. 
These integration tests are controlled by the `skipFunctional` and `skipITs` system properties and are disabled by default. To run the web itests as part of the build, set the properties to false:

```
mvn clean install -DskipFunctional=false -DskipITs=false
```

In order for the tests to run completely, you must have the following requirements met:

| Software | Version                                                   |
|----------|-----------------------------------------------------------|
|Chrome    | latest (will not ignore local host certificate otherwise) |
|Docker    | 19.03.* and greater                                       |
|Node      | 16.20.2 and greater (test will fail otherwise)            |


## Tips and Tricks
- If attempting to run functional tests and the build fails, try these tips:
   1. If the error seems to be docker related:
      - Ensure that Docker is installed and can be accessed from the command line.
      - Check to ensure that you have completely built the mobi project previous to running the tests.
      - Uncomment the console.log statements found in the `before` hook found in the `nightwatch-globals.js` file
   2. If the error seems to be test related:
      - Up the timeout either via the `--timeout` flag or by altering the `waitForConditionTimeout` variable in the `nightwatch-globals.js` file
      - Ensure you're not using a deprecated method
      - Ensure you're using the correct location strategy for the selector you're passing in
      - Try utilizing the global `wait_for_no_spinners` method found in the `nightwatch-globals.js` file as a race condition could be happening.
      - Lower the amount of workers specified in the `nightwatch.json` file
      - Make sure your docker instance has at least 16Gb of memory & 6 CPUs allotted for processes

- The tests run much slower when run through Maven than when you directly run the `test` script in the `package.json`. If you want to minimize overall time, you can run the maven build up until the phase right before the tests are actually run (so all the maven variable injection is performed and files are prepped in the target dir) and then run the `test` script directly:
    1. Run `mvn clean pre-integration-test -DskipFunctional=false`
    2. Run `npm run test`

- To run an individual test in the functional test suite:
   1. Add a tag value into the `@tags` array at the beginning of the test file
   2. In the `package.json` file, add `--tag [your tag]` to the test script command
   3. Run the functional tests as normal

- If you are running the `test` script directly and want to pass arguments to the nightwatch command, you can append them to `npm run test` by adding `--` at the end. For example, to run tests with a certain tag:
    1. Run `npm run test -- --tag [your tag]`

- To run the functional test against a running distribution of Mobi
   1. Change the url found on line 49 of the `nightwatch-globals.js` file to correspond to the url of the running
      distribution
   2. Build the functional test bundle in its entirety
   3. Run the functional tests as normal with the `headless` flag found in `nightwatch.json` underneath `test_settings`.

## Additional Notes: 
- If users wanted to visually inspect the process of a test running, they can do so by erasing the `headless` flag found
 underneath `test_settings` key and set the `enabled` key underneath `test-workers` to false; both found in the `nightwatch.json` file.

- To inspect a test at a moment in time, users can add a `browser.debug()` statement which when running headless will pause the respective test
file, allowing to inspect elements. More details here - https://nightwatchjs.org/guide/writing-tests/nightwatch-inspector.html