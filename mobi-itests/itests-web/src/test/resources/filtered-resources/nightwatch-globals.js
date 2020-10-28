module.exports = {
  "globalPort" : "${https-port}",

  "initial_steps" : function (browser) {
      var adminUsername = "admin"
      var adminPassword = "admin"

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
          .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
  },

  "cleanup_steps" : function (browser) {
      browser
  }
}
