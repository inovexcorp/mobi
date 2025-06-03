const Docker = require('dockerode');
const fetch = require('node-fetch');
const https = require('https');
const tar = require('tar-fs');
const fs = require('fs');
const path = require('path');

const docker =  new Docker({socketPath: '/var/run/docker.sock'});

//custom variables
let distributionName = '${distributionName}';
let sourceFiles = `${source-files}`.split(', ');
let containerObj = undefined;
let httpsPort = 10000;

// custom agent as global variable
const agent = new https.Agent({
    rejectUnauthorized: false,
});

const buildOptions = {
    context: __dirname,
    src: sourceFiles
}

module.exports = {
    'globalPort' : httpsPort,
    'adminUsername': 'admin',
    'adminPassword': 'admin',

    waitForConditionTimeout : 60000,
    waitForConditionPollInterval: 100,
    retryAssertionTimeout: 30000,
    asyncHookTimeout: 60000,

    before(done) {
        // Build the Docker image
        docker.buildImage(buildOptions, {t: `docker.io/${distributionName}/test`, dockerFile: __dirname + '/Dockerfile'}, function(err, stream) {
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
            Image: `docker.io/${distributionName}/test`,
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
                return await fetch(`https://localhost:${httpsPort}/${distributionName}/index.html#/home`, {
                    method: 'GET'
                }, agent).then(async response => {
                    if (response.status === 200) {
                        console.info(`Successfully connected to ${distributionName} front-end.`)
                        status = response.status;

                        console.info('trying to import files');
                        await runExec(containerObj, {
                            Cmd: ['sh', '/opt/mobi/import.sh', 'system', '/opt/mobi/dataFiles/z-catalog-ontology-9p-records.trig'],
                            Tty: true,
                            AttachStdout: true,
                            AttachStderr: true,
                        });
                    } else {
                      console.info(`Could not access ${distributionName}. trying again in 1 second.`);
                      counter++;
                      return delay(1000).then(() => testMobiAvailability());
                    }
                }).catch(() => {
                  console.info(`Error connecting to ${distributionName}. trying again in 5 seconds.`);
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
                    console.info(`Testing if ${distributionName} is accessible.`)
                    await testMobiAvailability();
                    console.info('Finished setup');
                    done();
                }
            });
        })
    },

    afterEach(browser, done) {
        function shutDown() {
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
            });
        }
        const currentTest = browser.currentTest;
        if (currentTest.results && currentTest.results.failed > 0) {
            console.log('Current test had a failure. Pulling logs');
            // Setup log output dir
            let testDate = new Date(currentTest.timestamp).toUTCString();
            let dateStr = testDate.substring(testDate.indexOf(', ') + 2).replaceAll(':', '').replaceAll(' ', '_');
            let outputPath = `/test-logs/${currentTest.module.replace('.spec', '')}/${dateStr}`;
            const dir = path.join(__dirname, '..', outputPath);
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }
            // Fetch console logs
            if (browser.consoleLogs.length) {
              const consoleLogFile = fs.createWriteStream(path.join(dir, 'console.log'));
              consoleLogFile.on('error', function(err) { console.error('Error writing browser log file', err); });
              browser.consoleLogs.forEach(function(v) { consoleLogFile.write(`${v}\n`); });
              consoleLogFile.end();
            }
            // Fetch rendered HTML
            browser.source(result => {
              const htmlFile = fs.createWriteStream(path.join(dir, 'index.html'));
              htmlFile.on('error', function(err) { console.error('Error writing HTML file', err); });
              htmlFile.write(result.value);
              htmlFile.end();
            });
            // Fetch Karaf logs
            containerObj.getArchive({path: '/opt/mobi/mobi-distribution/data/log/karaf.log'}, (err, stream) => {
                if (err) {
                    console.error('Error getting archive:', err);
                    done();
                }
              
                stream.pipe(tar.extract(`./target${outputPath}`));
                shutDown();
            });
        } else {
            shutDown();
        }
    },

    'initial_steps': function (browser, user, password) {
        browser.consoleLogs = [];
        browser.captureBrowserConsoleLogs((event) => {
            browser.consoleLogs.push(`${event.timestamp} ${event.type}: ${event.args.map(arg => arg.value || arg.description).join('\n')}`);
        }).url(`https://localhost:${httpsPort}/${distributionName}/index.html#/home`);
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
            .click("//span[text()[contains(.,'Logout')]]/parent::a")
            // .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
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
        browser.useCss().isVisible({
          selector: 'div.ngx-toastr',
          suppressNotFoundErrors: true,
          timeout: 2000
        }, function(result) {
            if (result && result.value) {
                browser.click('div.ngx-toastr');
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
