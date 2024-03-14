const Docker = require('dockerode');
const fetch = require('node-fetch');
const https = require('https');

const docker =  new Docker({socketPath: '/var/run/docker.sock'});
const contextDir = '${contextDir}';
const dockerFile = '${dockerFile}';

// custom agent as global variable
const agent = new https.Agent({
    rejectUnauthorized: false,
});

const buildOptions = {
    context: contextDir,
    src: ['Dockerfile', 'import.sh', 'mobi-distribution-2.6.0-SNAPSHOT.tar.gz', 'z-catalog-ontology-9p-records.trig']
}

let containerObj = undefined;
let httpsPort = 10000;

module.exports = {
    'globalPort' : httpsPort,

    // default timeout value in milliseconds for waitFor commands and implicit waitFor value for
    // expect assertions
    waitForConditionTimeout : 45000,
    retryAssertionTimeout: 30000,
    asyncHookTimeout: 60000,
    create_shapes_graph_branch_button: {
        css: 'shapes-graph-editor-page button.create-branch'
    },
    merge_shapes_graph_button: {
        css: 'shapes-graph-editor-page button.merge-branch'
    },
    create_shapes_graph_tag_button: {
        css: 'shapes-graph-editor-page button.create-tag'
    },
    download_shapes_graph_button: {
        css: 'shapes-graph-editor-page button.download-record'
    },
    upload_changes_shapes_graph_button: {
        css: 'shapes-graph-editor-page button.upload-changes'
    },

    before(done) {
        // Build the Docker image
        docker.buildImage(buildOptions, {t: 'docker.io/mobi/test', dockerFile: dockerFile}, function(err, stream) {
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

        async function testMobiAvailability() {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'
            if (counter < 30 && status !== 200) {
                fetch(`https://localhost:${httpsPort}/mobi/index.html#/home`, {
                    method: 'GET'
                }, agent).then(async response => {
                    if (response.status === 200) {
                        console.info('Successfully connected to mobi front-end.')
                        status = response.status;

                        console.info('trying to import files');
                        await containerObj.exec({
                            Cmd: ['sh', '/opt/mobi/import.sh'],
                            Tty: true,
                            AttachStdout: true,
                            AttachStderr: true,
                        }, async (err, exec) => {
                            if (err) {
                                browser.assert.fail('err:', err);
                                done();
                                return;
                            }

                            await exec.start(async (err, stream) => {
                                if (err) {
                                    browser.assert.fail('Error creating command for Docker Container:', err);
                                } else {
                                    done();
                                }

                                // uncomment if you need to see output stream of import command
                                // stream.on('data', (chunk) => {
                                //     console.log('log:', chunk.toString('utf8'));
                                // });

                                // uncomment if you want to see error stream
                                // exec.modem.demuxStream(stream, process.stdout, process.stderr);
                            });
                        })
                    } else {
                        setTimeout(() => {
                            console.info('Could not access mobi. trying again in 1 second.');
                            counter++;
                            testMobiAvailability();
                        }, 1000);
                    }
                }).catch(error => {
                    setTimeout(() => {
                        console.info('Error connecting to mobi. trying again in 5 seconds.');
                        counter++;
                        testMobiAvailability();
                    }, 5000);
                })
            }
        }

        docker.createContainer(containerOptions, function(err, container) {
            if (err) {
                console.error('Error creating container:', err);
                done()
                return;
            }

            containerObj = container;
            container.start(async function (err, data) {
                if (err) {
                    browser.assert.fail('Error starting container:', err);
                    done();
                } else {
                    console.log(`Container ${containerObj.id} started successfully`);
                    console.info('Testing if Mobi is accessible.')
                    await testMobiAvailability();
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
        browser.globals.switchToPage(browser, 'ontology-editor', 'button.upload-button');
    },

    'login': function (browser, username, password) {
        browser
            .useXpath()
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', username )
            .setValue('//div[@class="form-group"]//input[@id="password"]', password )
            .click('//button[@type="submit"]')
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'logout': function (browser) {
        browser
            .useXpath()
            .pause(2000)
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
    },

    'return_to_ontology_editor_search': function (browser) {
        browser.click('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button');
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementPresent('ontology-editor-page open-ontology-tab');
    },

    'upload_ontologies': function (browser, ...args) {
      for (var i = 0; i < args.length - 1; i++) {
          browser
              .click('button.upload-button')
              .uploadFile('input[type=file]', args[i])
              .useXpath()
              .waitForElementVisible('//upload-ontology-overlay//span[text() = "Submit"]/parent::button')
              .click('//upload-ontology-overlay//span[text() = "Submit"]/parent::button')
              .waitForElementNotPresent('//upload-ontology-overlay//span[text() = "Cancel"]/parent::button')
              .useCss()
      }
      browser
          .click('button.upload-button')
          .uploadFile('input[type=file]', args[args.length - 1])
          .waitForElementVisible('upload-ontology-overlay')
          .click('xpath', '//upload-ontology-overlay//span[text() = "Submit All"]/parent::button')
          .waitForElementVisible('div.ontologies')
          .assert.not.elementPresent('upload-ontology-overlay');
      for (var j = 0; j < args.length; j++) {
          browser
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', args[j].replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, ''))
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
          browser.globals.wait_for_no_spinners(browser);
          browser
            .waitForElementVisible('open-ontology-tab search-bar input')
            .useXpath()
            .assert.visible('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")]//span[text()[contains(.,"' + args[j].replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
            .useCss()
      }
      browser
          .clearValue('open-ontology-tab search-bar input')
          // .setValue('open-ontology-tab search-bar input', '')
          .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
      browser.globals.wait_for_no_spinners(browser);
      browser
          .waitForElementNotPresent('div.fade')

    },

    'search_for_ontology': function (browser, ontology) {
        browser
              .useCss()
              .setValue('open-ontology-tab search-bar input', ontology.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, ''))
              .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser
              // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
            .pause(1000)
              .useXpath()
              .waitForElementVisible('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
        },

    'open_ontology': function (browser, ontology) {
        browser.globals.search_for_ontology(browser, ontology);
        browser
          .click('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
          .useCss()
          .waitForElementVisible('mat-tab-header div.mat-tab-label-content') // ensures that project tab is showing
    },

    'create_shapes_graph': function (browser, title, shapes_file) {
      browser
          .useCss()
          .waitForElementNotVisible('.spinner')
          .waitForElementVisible('shapes-graph-editor-page editor-record-select')
          .click('shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
          .waitForElementVisible('mat-option')
          .click('mat-option button.create-record')
          .waitForElementVisible('new-shapes-graph-record-modal')
          .waitForElementVisible('new-shapes-graph-record-modal file-input')
          .waitForElementVisible('new-shapes-graph-record-modal button.mat-raised-button')
          .useXpath()
          .sendKeys('//new-shapes-graph-record-modal//mat-form-field[1]//input', title)
          .uploadFile('//new-shapes-graph-record-modal//file-input//input', shapes_file)
          .useCss()
          .click('new-shapes-graph-record-modal button.mat-primary')
    },

    'open_shapes_graph': function (browser, title) {
          browser
              .useCss()
              .waitForElementVisible('shapes-graph-editor-page editor-record-select')
              .click('shapes-graph-editor-page editor-record-select')
              .useXpath()
              .pause(1000)
              .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option')
              .click('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option');
          browser.globals.wait_for_no_spinners(browser);
          browser
              .useCss()
              .waitForElementVisible('shapes-graph-details')
              .waitForElementVisible('shapes-graph-properties-block')
              .waitForElementVisible('div.yate')
              // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
        },

    'create_shapes_graph_branch': function (browser, branch_title) {
        browser
            .useCss()
            .click(browser.globals.create_shapes_graph_branch_button.css)
            .waitForElementVisible('create-branch-modal')
            .waitForElementVisible('create-branch-modal mat-form-field input')
            .waitForElementVisible('create-branch-modal button.mat-primary')
            .sendKeys('xpath','//create-branch-modal//mat-form-field[1]//input', branch_title)
            .click('create-branch-modal button.mat-primary');
        browser.globals.wait_for_no_spinners(browser);
    },

    'delete_shapes_graph': function (browser, title) {
        browser
            .useXpath()
            .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
            .click('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
            .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .click('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
            .waitForElementVisible('css selector', 'confirm-modal .mat-dialog-actions button.mat-primary')
            .click('css selector', 'confirm-modal .mat-dialog-actions button.mat-primary')
            .waitForElementVisible('xpath', '//div[@id="toast-container"]')
            // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
            .pause(1000)
            .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .assert.not.elementPresent('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]')
            .useCss()
    },

    'add_new_user' : function(browser, newUser) {
            browser
                .useXpath()
                .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
                .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
                .waitForElementVisible("//button/span[text() [contains(., 'Create User')]]")
                .click("//button/span[text() [contains(., 'Create User')]]")
                .waitForElementVisible("//h1[text() [contains(., 'Create User')]]")
                .useCss()
                .setValue('input[name=username]', newUser.username)
                .setValue('input[name=unmaskPassword]', newUser.password)
                .setValue('input[name=firstName]', newUser.firstName)
                .setValue('input[name=lastName]', newUser.lastName)
                .setValue('input[name=email]', newUser.email)
                .click('label.mat-slide-toggle-label')
                .useXpath()
                .click("//button/span[text() [contains(., 'Submit')]]");
            browser.globals.wait_for_no_spinners(browser);
            browser.useXpath()
                .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
                                "[contains(., '" + newUser.firstName + "')]]", "new user is displayed")
    },

    'wait_for_no_spinners': function (browser, timeout) {
        const t = timeout || 15000;
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full', t)
            //TODO make sure toaster containers are being removed
            // .waitForElementNotVisible('xpath', '//div[@id="toast-container"]', t)
            .waitForElementNotPresent('div.fade', t)
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
