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
|Node      | 10.16.3 and lower (test will fail otherwise)              |


##Tips and Tricks
- If attempting to run functional tests and the build fails, try these tips:
   1. If the error is docker related:
      - check to ensure that there is not an existing docker container with the same name already created. If there is already an existing container, you can remove it by running `docker rm [options] container [container id}`
      - check to ensure that the docker container from a previous test run has completely stopped running and has been removed.
      - check to ensure that you have completely built the mobi project.
   2. If the error is test related:
      - Ensure that you're not specifying a location strategy in your assert command. It is currently not supported
        by our current version of nightwatch.
      - Ensure you're not using a deprecated method
      - Ensure you're using the correct location strategy for the selector you're passing in
      - Try utilizing the global `wait_for_no_spinners` method found in the `nightwatch-globals.js` file as a race
        condition could be happening.


- To run an individual test in the functional test suite:
   1. Add a tag value into the `@tags` array at the beginning of the test file
   2. In the `package.json` file, add `--tag [your tag]` to the test script command
   3. Run the functional test as normal


- To run the functional test against a running distribution of Mobi
   1. Change the url found on line 49 of the `nightwatch-globals.js` file to correspond to the url of the running
      distribution
   2. Build the functional test bundle in its entirety
   3. Run the functional test as Normalg the "headless" flag found in `nightwatch.json` underneath `test_settings`.


NOTE: When running functional tests against a running distribution, after an initial build, the test script command
found in the `package.json` file can be run directly in the root of the `itests-web` bundle to run tests without
using DOCKER containers.

NOTE: You can also optionally set the web integration test to not run headless by erasing the "headless" flag found in
`nightwatch.json` underneath `test_settings`.