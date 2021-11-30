
var GeneralUtils = function(){};

GeneralUtils.prototype.getAllElementsTextValues = function(browser, selector, target){

    var myPromiseAll = function(browser, result){
        var elementIdTextPromise = function(elementId){
            return new Promise(function(resolve, reject) {
               browser.elementIdText(elementId, function(a){ resolve(a.value) } );
           });
        };

        return new Promise(function(resolve, reject) {
           var elementIdTextPromises = result.value.map(function(webElement){ return elementIdTextPromise(webElement.ELEMENT) });
           Promise.all(elementIdTextPromises)
            .then(function(values) { resolve(values) });
       });
    };

    return new Promise(function(resolve, reject) {
         browser.elements(selector, target, function(result){
                var api = this;
                myPromiseAll(browser, result)
                    .then(function(values){ resolve(values) });
            });
    });
};

GeneralUtils.prototype.switchToPage = function(browser, page, waitForElement){
    browser
      .click('sidebar div ul a[class=nav-link][href="#/' + page + '"]')
      .waitForElementNotPresent('div.spinner');

    if (waitForElement) {
        browser.waitForElementVisible(waitForElement);
    }
};


module.exports = {
  'globalPort' : '${https-port}',

  // default timeout value in milliseconds for waitFor commands and implicit waitFor value for
  // expect assertions
  waitForConditionTimeout : 15000,


  'initial_steps' : function (browser, user, password) {
      browser
          .url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home')
          .waitForElementVisible('input#username')
          .waitForElementVisible('input#password')
          .setValue('input#username', user)
          .setValue('input#password', password)
          .click('button[type=submit]')
          .waitForElementVisible('.home-page')
          .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
          .waitForElementNotPresent('div.spinner')
          .waitForElementVisible('div.btn-container button')
  },

  // TODO: Add a check to see if the ontology already exists, and if it does, either skip upload or delete and re-upload.
  'upload_ontologies' : function (browser, ...args) {
      browser
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
          .clearValue('open-ontology-tab search-bar input')
          .setValue('open-ontology-tab search-bar input', '')
          .keys(browser.Keys.ENTER)
          .waitForElementNotPresent('.spinner', 5000)
  },

  'open_ontology' : function (browser, ontology) {
      browser
          .setValue('open-ontology-tab search-bar input', ontology.replace(process.cwd()+ '/src/test/resources/ontologies/', ''))
          .keys(browser.Keys.ENTER)
          .waitForElementVisible('open-ontology-tab search-bar')
          .useXpath()
          .waitForElementVisible('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
          .click('//div[contains(@class, "ontology-info")]//div[contains(@class, "header-title")]//span[text()[contains(.,"' + ontology.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
          .useCss()
          .waitForElementNotPresent('.spinner', 5000)
          .waitForElementVisible('div.material-tabset li.nav-item') // ensures that project tab is showing
  },

  'generalUtils': new GeneralUtils()

}
