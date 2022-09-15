/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
var adminUsername = "admin"
var adminPassword = "admin"
var Onto1 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-3.ttl'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:' +browser.globals.globalPort+ '/mobi/index.html#/home')
            .waitForElementVisible('input#username')
            .waitForElementVisible('input#password')
            .setValue('input#username', adminUsername)
            .setValue('input#password', adminPassword)
            .click('button[type=submit]')
    },

    'Step 2: check for visibility of home elements' : function(browser) {
        browser
            .waitForElementVisible('.home-page')
    },

    'Step 3: navigate to the Ontology Editor page' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
    },

    'Step 4: click upload ontology' : function (browser) {
        browser
            .waitForElementNotVisible('div.spinner')
            .waitForElementVisible('div.btn-container button')
            .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
    },

    'Step 5: Upload an Ontology' : function (browser) {
        browser
            .uploadFile('input[type=file]', Onto1)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .uploadFile('input[type=file]', Onto2)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .uploadFile('input[type=file]', Onto3)
    },

    'Step 6: Submit all ontology files' : function (browser) {
        browser
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//button[text()[contains(.,"Submit All")]]')
    },

    'Step 7: Validate Ontology Appearance' : function (browser) {
        browser
            .waitForElementVisible('div.ontologies')
            .assert.not.elementPresent('div.modal-header')
            .waitForElementVisible('div.ontologies')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"test-local-imports-1.ttl")]]')
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"test-local-imports-2.ttl")]]')
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"test-local-imports-3.ttl")]]')
            .useCss()
    },

    'Step 8: Click on Ontology called “test-local-imports-1.ttl' : function (browser) {
        browser
            .click('xpath', '//div[contains(@class, "list-group")]//div//div[text()[contains(.,"test-local-imports-1.ttl")]]')
    },

    'Step 9: Validate Ontology Imports Appearance' : function (browser) {
        browser
            .waitForElementVisible('.imports-block')
            .useXpath()
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-2")]]')
            .assert.visible('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-3")]]')
            .assert.not.elementPresent('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-2")]]')
    },

    'Step 10: Click classes tab' : function (browser) {
        browser
            .useCss()
            .waitForElementVisible('div.material-tabset li.nav-item')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
    },

    'Step 11: Check for Ontology classes' : function (browser) {
        browser
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 0")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]//ancestor::a/i[contains(@class, "fa-plus-square-o")]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
            .assert.attributeContains('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]//ancestor::tree-item', 'data-path-to', 'test-local-imports-2#Class2.http://mobi.com/ontology/test-local-imports-1#Class1')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3")]]'})
    },

    'Step 11: Set Selected Item to an Ontology Class' : function (browser) {
        browser
            .useXpath()
            .click({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
    },

    'Step 12: Validate Ontology Imports Appearance' : function (browser) {
        browser
            .click("//material-tabset//a[@class='nav-link']//span[text()[contains(., 'Project')]]")
            .waitForElementVisible('//imports-block')
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-2")]]')
            .assert.visible('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-3")]]')
            .assert.not.elementPresent('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-2")]]')
    },
}
