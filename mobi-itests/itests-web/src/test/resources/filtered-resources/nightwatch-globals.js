module.exports = {
  'globalPort' : '${https-port}',

  'initial_steps' : function (browser) {
      var adminUsername = 'admin'
      var adminPassword = 'admin'

      browser
          .url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home')
          .waitForElementVisible('input#username')
          .waitForElementVisible('input#password')
          .setValue('input#username', adminUsername)
          .setValue('input#password', adminPassword)
          .click('button[type=submit]')
          .waitForElementVisible('.home-page')
          .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
          .waitForElementNotPresent('div.spinner')
          .waitForElementVisible('div.btn-container button')
  },

  // TODO: Add a check to see if the ontology already exists, and if it does, either skip upload or delete and re-upload.
  'upload_ontologies' : function (browser, ...args) {
      browser
          .useCss()
          .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
      for (var i = 0; i < args.length - 1; i++) {
          browser
              .setValue('input[type=file]', args[i])
              .click('upload-ontology-overlay div.modal-footer button.btn')
              .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
      }
      browser
          .setValue('input[type=file]', args[args.length - 1])
          .waitForElementVisible('upload-ontology-overlay')
          .click('xpath', '//button[text()[contains(.,"Submit All")]]')
          .waitForElementVisible('div.ontologies')
          .assert.elementNotPresent('div.modal-header');
      for (var j = 0; j < args.length; j++) {
          browser
            .useCss()
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', args[j].replace(process.cwd()+ '/src/test/resources/ontologies/', ''))
            .keys(browser.Keys.ENTER)
            .waitForElementVisible('open-ontology-tab search-bar input')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + args[j].replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
            .assert.visible('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + args[j].replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
            .useCss()
      }
      browser
          .useCss()
          .clearValue('open-ontology-tab search-bar input')
          .setValue('open-ontology-tab search-bar input', '')
          .keys(browser.Keys.ENTER)
          .waitForElementNotPresent('.spinner', 5000)
  },

  'open_ontology' : function (browser, ontology) {
      browser
          .useCss()
          .setValue('open-ontology-tab search-bar input', ontology.replace(process.cwd()+ '/src/test/resources/ontologies/', ''))
          .keys(browser.Keys.ENTER)
          .waitForElementVisible('open-ontology-tab search-bar')
          .useXpath()
          .waitForElementVisible('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
          .click('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
          .useCss()
          .waitForElementVisible('div.material-tabset li.nav-item')
  },

  "cleanup_steps" : function (browser) {
      browser
  }
}
