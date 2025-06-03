# Mobi Web Integration Tests
The web integration tests are written in Javascript and are run using the `nightwatch.js` suite inside of a Mobi docker image. Upon the complete build
of a distribution of Mobi, developers should then able to successfully run web integration tests. All web integration test are housed as `spec.js` files
and are found underneath the `src/test/js` directory, and all other resources needed to run the tests are found under `src/test/resources`.

## Requirements

In order for the tests to run completely, you must have the following requirements met:

| Software | Version                                                   |
|----------|-----------------------------------------------------------|
|Chrome    | latest (will not ignore local host certificate otherwise) |
|Docker    | 19.03.* and greater                                       |
|Node      | 16.20.2 and greater (test will fail otherwise)            |

## Running

For the Maven build, these integration tests are controlled by the `skipFunctional` system property which is disabled by default. To run the web itests as part of the Maven build, set the property to false:

```
mvn clean install -DskipFunctional=false
```

*NOTE:* This is known to take much longer than running them via Node directly via the scripts in the `package.json`.

If you want to minimize overall run time, you can run the Maven build up until the phase right before the tests are actually run (so all the Maven variable injection is performed and files are prepped in the `target` dir) and then run the `test` script directly:

1. Run `mvn clean pre-integration-test -DskipFunctional=false`
2. Run `npm run test`

The test run report will be output to `target/nightwatch-reports` in several formats, the most useful of which is in HTML form under `nightwatch-html-report`. In the event of a test failure, a screenshot will be taken and output under `target/nightwatch-screenshots` and the rendered HTML, Karaf logs, and browser logs will be output under `target/test-logs`/

### Nightwatch Environments
There are several different "environments" configured for Nightwatch to run the tests against different browsers in different ways.

- `default` - Chrome non-headless
- `headless` - Chrome headless
- `firefox` - Firefox non-headless
- `firefox-headless` - Firefox headless

The `test` script in the `package.json` uses the default environment. To use a specific one, run `npm run test -- --env [env name]`. The `test-headless` is shorthand for `npm run test -- --env headless`.

### Running Specific Tests
If you want to run an individual test or a suite of tests, you can utilize the `@tags` array at the beginning of a `spec.js` file. Either insert a new tag or identify one that hits the tests you are interested in. Then:

- If you are running the test through Maven:
    1. In the `package.json` file, add `--tag [your tag]` to the test script command
    2. Run the functional tests as normal
- If you are running through Node.js:
    1. Append `-- --tag [your tag]` to the end of the `npm run test` command

## Tips and Tricks
- The same technique for specifying the environment and tag when running via Node.js can be used to pass any Nightwatch parameters you need to the command
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
- To run the functional test against a running distribution of Mobi
    1. Change the url found on line 49 of the `nightwatch-globals.js` file to correspond to the url of the running
       distribution
    2. Build the functional test bundle (at least to the `pre-integration-test` phase)
    3. Run the functional tests as normal
- To inspect a test at a moment in time, add a `browser.debug()` statement which when running headless will pause the respective test file, allowing to inspect elements. More details https://nightwatchjs.org/guide/writing-tests/nightwatch-inspector.html[here]