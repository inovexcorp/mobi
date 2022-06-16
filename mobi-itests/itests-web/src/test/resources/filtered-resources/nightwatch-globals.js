
module.exports = {
    'globalPort' : '${https-port}',

    // default timeout value in milliseconds for waitFor commands and implicit waitFor value for
    // expect assertions
    waitForConditionTimeout : 20000,
    retryAssertionTimeout: 15000,
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

    'initial_steps': function (browser, user, password) {
        browser
            .url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home');
        browser.globals.login(browser, user, password);
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible('div.btn-container button')
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
        browser
            .click('xpath', '//div[contains(@class, \'ontology-sidebar\')]//button[@class=\'btn btn-primary\']')
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, \'open-ontology-tab\')]//div[contains(@class, \'search-bar\')]/input'})
    },

    // TODO: Add a check to see if the ontology already exists, and if it does, either skip upload or delete and re-upload.
    'upload_ontologies': function (browser, ...args) {
      for (var i = 0; i < args.length - 1; i++) {
          browser
              .uploadFile('input[type=file]', args[i])
              .click('upload-ontology-overlay div.modal-footer button.btn')
              .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
      }
      browser
          .uploadFile('input[type=file]', args[args.length - 1])
          .waitForElementVisible('upload-ontology-overlay')
          .click('xpath', '//button[text()[contains(.,"Submit All")]]')
          .waitForElementVisible('div.ontologies')
          .assert.not.elementPresent('div.modal-header');
      for (var j = 0; j < args.length; j++) {
          browser
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', args[j].replace(process.cwd()+ '/src/test/resources/rdf_files/', ''))
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
            .useXpath()
            .assert.visible('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + args[j].replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
            .useCss()
      }
      browser
          .clearValue('open-ontology-tab search-bar input')
          .setValue('open-ontology-tab search-bar input', '')
          .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
          .waitForElementNotPresent('.spinner')
    },

    'open_ontology': function (browser, ontology) {
      browser
          .useCss()
          .setValue('open-ontology-tab search-bar input', ontology.replace(process.cwd()+ '/src/test/resources/rdf_files/', ''))
          .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
          .waitForElementNotPresent('div.spinner')
          .waitForElementNotPresent('mat-spinner')
          .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
          .waitForElementNotPresent('div.fade')
          .useXpath()
          .waitForElementVisible('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
          .click('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
          .useCss()
          .waitForElementNotPresent('.spinner')
          .waitForElementVisible('div.material-tabset li.nav-item') // ensures that project tab is showing
    },

    'create_shapes_graph': function (browser, title, shapes_file) {
      browser
          .useCss()
          .waitForElementVisible('shapes-graph-editor-page editor-record-select')
          .click('shapes-graph-editor-page editor-record-select')
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
              .waitForElementVisible('//mat-optgroup/label[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option')
              .click('//mat-optgroup/label[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option');
          browser.globals.wait_for_no_spinners(browser);
          browser
              .useCss()
              .waitForElementVisible('shapes-graph-details')
              .waitForElementVisible('shapes-graph-properties-block')
              .waitForElementVisible('div.yate')
              .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
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
            .click('css selector', 'editor-record-select')
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
            .click('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
            .click('css selector', 'editor-record-select')
            .click('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
            .click('css selector', 'confirm-modal-ajs div.modal-footer button.btn-primary')
            .click('css selector', 'editor-record-select')
            .assert.not.elementPresent('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]')
            .useCss()
    },

    'add_new_user' : function(browser, newUser) {
            browser
                .useXpath()
                .waitForElementVisible("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
                .click("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
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

    'wait_for_no_spinners': function (browser) {
        browser
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .waitForElementNotPresent('mat-spinner')
            .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
            .waitForElementNotPresent('div.fade')
    },

    'switchToPage': function(browser, page, waitForElement){
        browser
            .click('sidebar div ul a[class=nav-link][href="#/' + page + '"]')
            .waitForElementNotPresent('div.spinner');

        if (waitForElement) {
            browser.waitForElementVisible(waitForElement);
        }
    },

}
