# Mobi Web Integration Tests
The web integration tests are written in Javascript and are run using the `nightwatch.js` suite inside of a Mobi docker image. Upon the complete build 
of a developer distribution of Mobi, users should then able to successfully run web integration tests. All web integration test are housed as `spec.js` files
and are found underneath the `src/test/js` directory, and all other resources needed to run the tests are found under `src/test/resources`. 
These integration tests are controlled by the `skipFunctional` and `skipITs` system properties and are disabled by default. To run the web itests as part of the build, set the properties to false:

```
mvn clean install -DskipFunctional=false -DskipITs=false
```

In order for the tests to run completely, you must have the following requirements met:

| Software | Version                                                           |
|----------|-------------------------------------------------------------------|
|Chrome    | 80 and greater (will not ignore local host certificate otherwise) |
|Docker    | 19.03.* and greater                                                    |
|Node      | 10.16.3 and lower (test will fail otherwise)                      |

##Tips and Tricks
If attempting to run functional tests and the build fails, try these tips:
1. If it is an npm error, check `package.json` and ensure npm is utilizing the latest version of chromedriver.
2. If the error is docker related:
   - check to ensure that there is not an existing docker container with the same name already created.
   - check to ensure that the docker container from a previous test run has completely stopped running.
   - check to ensure that you have completely built the mobi project.
   
You can also optionally set the web integration test to not run headless by erasing the "headless" flag found in `nightwatch.json` underneath `test_settings`.