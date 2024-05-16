const Docker = require('dockerode');
const fetch = require('node-fetch');
const https = require('https');

const docker =  new Docker({socketPath: '/var/run/docker.sock'});

// custom agent as global variable
const agent = new https.Agent({
    rejectUnauthorized: false,
});

const buildOptions = {
    context: __dirname,
    src: ['Dockerfile', 'import.sh', 'mobi-distribution.tar.gz', 'dataFiles']
}

let containerObj = undefined;
let httpsPort = 10000;

module.exports = {
    'globalPort' : httpsPort,

    // default timeout value in milliseconds for waitFor commands and implicit waitFor value for
    // expect assertions
    waitForConditionTimeout : 60000,
    retryAssertionTimeout: 30000,
    asyncHookTimeout: 60000,

    before(done) {
        // Build the Docker image
        docker.buildImage(buildOptions, {t: 'docker.io/mobi/test', dockerFile: __dirname + '/Dockerfile'}, function(err, stream) {
            if (err) {
                console.error('Error building image:', err);
                return;
            }

            // Log build output
            docker.modem.followProgress(stream, onFinished, onProgress);

            function onFinished(err, output) {
                if (err) {
                    console.error('Error building image:', err);
                    return;
                }
                console.log('Image built successfully');
                done();
            }

            function onProgress(event) {
                // uncomment if running into errors and want to see build progress
                //console.log('Build progress:', event);
            }
        });
    },

    beforeEach(browser, done) {
        httpsPort = Math.floor(Math.random() * 500 + 10000);
        let counter = 0;
        let status = 0;

        const containerOptions = {
            Image: 'docker.io/mobi/test',
            name: `FTest-${httpsPort}`,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            ExposedPorts: { '8443/tcp': {} }, // Ports exposed by the container
            HostConfig: {
                PortBindings: {
                    '8443/tcp': [{HostPort: `${httpsPort}`}] // Map container's port 80 to host's port 8080
                }
            }
        }

        // Wraps a timeout as a Promise so it can be chained
        async function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Used to run a command on a Docker container within a Promise and wait for the results appropriately
        function runExec(container, options) {
          return new Promise((resolve, reject) => container.exec(options, function(err, exec) {
            if (err) {
              reject(err)
            }
        
            exec.start({ I: true, T: true }, function(err, stream) {
              if (err) {
                reject(err)
              }
          
              stream.on('end', function() {
                resolve()
              });
        
              docker.modem.demuxStream(stream, process.stdout, process.stderr)
        
              exec.inspect(function(err) {
                if (err) {
                  return;
                }
              });
            })
          }));
        }
        browser.globals.runExec = runExec;

        async function testMobiAvailability() {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'
            if (counter < 30 && status !== 200) {
                return await fetch(`https://localhost:${httpsPort}/mobi/index.html#/home`, {
                    method: 'GET'
                }, agent).then(async response => {
                    if (response.status === 200) {
                        console.info('Successfully connected to mobi front-end.')
                        status = response.status;

                        console.info('trying to import files');
                        await runExec(containerObj, {
                            Cmd: ['sh', '/opt/mobi/import.sh', 'system', '/opt/mobi/dataFiles/z-catalog-ontology-9p-records.trig'],
                            Tty: true,
                            AttachStdout: true,
                            AttachStderr: true,
                        });
                    } else {
                      console.info('Could not access mobi. trying again in 1 second.');
                      counter++;
                      return delay(1000).then(() => testMobiAvailability());
                    }
                }).catch(() => {
                  console.info('Error connecting to mobi. trying again in 5 seconds.');
                  counter++;
                  return delay(5000).then(() => testMobiAvailability());
                });
            }
        }

        docker.createContainer(containerOptions, function(err, container) {
            if (err) {
                console.error('Error creating container:', err);
                done()
                return;
            }

            containerObj = container;
            browser.globals.containerObj = container;
            container.start(async function (err, data) {
                if (err) {
                    browser.assert.fail('Error starting container:', err);
                    done();
                } else {
                    console.log(`Container ${containerObj.id} started successfully`);
                    console.info('Testing if Mobi is accessible.')
                    await testMobiAvailability();
                    console.info('Finished setup');
                    done();
                }
            });
        })
    },

    afterEach(browser, done) {
        containerObj.stop(function (err, data) {
            if (err) {
                console.log('Error stopping container:', err);
            } else {
                console.log(`Container ${containerObj.id} successfully stopped`);
                containerObj.remove(function (err, data) {
                    if (err) {
                        browser.assert.fail(`Error removing container ${containerObj.id}:`, err);
                        done();
                    } else {
                        console.log(`Container ${containerObj.id} successfully removed`);
                        done();
                    }
                });
            }
        })
    },

    'initial_steps': function (browser, user, password) {
        browser.url(`https://localhost:${httpsPort}/mobi/index.html#/home`);
        browser.globals.login(browser, user, password);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
    },

    'login': function (browser, username, password) {
        browser
            .useCss()
            .waitForElementVisible('div.form-group input#username')
            .waitForElementVisible('div.form-group input#password')
            .setValue('div.form-group input#username', username )
            .setValue('div.form-group input#password', password )
            .click('button[type="submit"]')
            .waitForElementVisible('.home-page')
    },

    'logout': function(browser) {
        browser
            .useXpath()
            .pause(2000)
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
    },

    'wait_for_no_spinners': function (browser, timeout) {
        const t = timeout || 15000;
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full', t)
            .waitForElementNotPresent('div.fade', t)
    },

    'dismiss_toast': function(browser) {
        browser.useCss().isVisible('div#toast-container', function(result) {
            if (result) {
                browser.click('div#toast-container')
                    .waitForElementNotVisible('div#toast-container');
            }
        });
    },

    'switchToPage': function(browser, page, waitForElement){
        browser
            .useCss()
            .waitForElementVisible('sidebar div ul a[class=nav-link][href="#/' + page + '"]')
            .click('sidebar div ul a[class=nav-link][href="#/' + page + '"]')
            .waitForElementNotPresent('#spinner-full', 30000);
        if (waitForElement) {
            browser.waitForElementVisible(waitForElement);
        }
    },

}
