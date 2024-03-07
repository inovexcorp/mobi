/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
var adminUsername = 'admin'
var adminPassword = 'admin'
var Onto1 = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-1.ttl'
var Onto1e = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-1e.ttl'  // has syntax issue
var Onto1s = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-1s.ttl'  // same as test-local-imports-1
var Onto1Trig = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-1s.trig'
var Onto1TrigZip = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-1s.trig.zip'
var Onto2 = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-3.ttl'
var Onto4 = process.cwd()+ '/src/test/resources/rdf_files/unresolvableImport.owl' // OWL Files Processed Differently
var Onto5 = process.cwd()+ '/src/test/resources/rdf_files/test-class-empty-label.ttl' // Class has empty string for label

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1, Onto2, Onto3, Onto4, Onto5)
    },

    'Step 3: Upload Corrupt Ontologies' : function (browser) {
        browser
            .click('button.upload-button')
            .uploadFile('input[type=file]', Onto1e)
            .click('xpath', '//upload-ontology-overlay//span[text() = "Submit"]/parent::button')
            .waitForElementNotPresent('xpath', '//upload-ontology-overlay//span[text() = "Cancel"]/parent::button')
            .click('button.upload-button')
            .uploadFile('input[type=file]', Onto1s)
            .click('xpath', '//upload-ontology-overlay//span[text() = "Submit"]/parent::button')
            .waitForElementNotPresent('xpath', '//upload-ontology-overlay//span[text() = "Cancel"]/parent::button')
            .click('button.upload-button')
            .uploadFile('input[type=file]', Onto1TrigZip)
            .click('xpath', '//upload-ontology-overlay//span[text() = "Submit"]/parent::button')
            .waitForElementNotPresent('xpath', '//upload-ontology-overlay//span[text() = "Cancel"]/parent::button')
            .click('button.upload-button')
            .uploadFile('input[type=file]', Onto1Trig)
    },

    'Step 4: Submit all ontology files' : function (browser) {
        browser
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//upload-ontology-overlay//span[text() = "Submit All"]/parent::button')
    },

   'Step 5: Validate Ontology Appearance' : function (browser) {
       browser
           .waitForElementVisible('div.ontologies')
           .assert.not.elementPresent('div.modal-header')
           .waitForElementVisible('div.ontologies')
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', Onto1e.replace(process.cwd()+ '/src/test/resources/rdf_files/', ''))
           .keys(browser.Keys.ENTER)
           .useXpath()
           .assert.not.elementPresent('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")]//span[text()[contains(.,"' + Onto1e.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
           .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h4[text()[contains(.,"' + Onto1e.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
           .useCss()
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', Onto1s.replace(process.cwd()+ '/src/test/resources/rdf_files/', ''))
           .keys(browser.Keys.ENTER)
           .useXpath()
           .useXpath()
           .assert.not.elementPresent('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")]//span[text()[contains(.,"' + Onto1s.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
           .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h4[text()[contains(.,"' + Onto1s.replace(process.cwd()+ '/src/test/resources/rdf_files/', '').replace(/\.[^/.]+$/, '') + '")]]')
           .useCss()
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', '')
           .keys(browser.Keys.ENTER)
   },

    'Step 6: Open an Ontology called “test-local-imports-1' : function (browser) {
        browser
            .setValue('open-ontology-tab search-bar input', '')
            .globals.open_ontology(browser, Onto1)
    },

    'Step 7: Click classes tab' : function (browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
    },

    'Step 8: Check for Ontology classes' : function (browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 0")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]//ancestor::a/i[contains(@class, "fa-plus-square-o")]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
            .assert.attributeContains('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]//ancestor::tree-item', 'data-path-to', 'test-local-imports-2#Class2.http://mobi.com/ontology/test-local-imports-1#Class1')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3")]]'})
    },

    'Step 9: Search for a class in the classes tab' : function (browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(., "Search")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Search")]]')
            .useCss()
            .waitForElementVisible('search-bar input.search-bar-input.ng-valid')
            .click('search-bar input.search-bar-input.ng-valid')
            .setValue('search-bar input.search-bar-input', 'Class 0')
            .sendKeys('search-bar input.search-bar-input', browser.Keys.ENTER)
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//tree-item//span[text()[contains(.,"Class 0")]]'})
            .useXpath()
            .click('//tree-item//span[text()[contains(.,"Class 0")]]')
            .waitForElementVisible('//span[@class[contains(.,"value-display")]]//mark[text()[contains(.,"Class 0")]]')
    },

    'Step 10: Return to ontology search page' : function (browser) {
        browser.globals.return_to_ontology_editor_search(browser)
    },

    'Step 11: Open an Ontology called test-class-empty-label' : function (browser) {
        browser.globals.open_ontology(browser, Onto5)
    },

    'Step 12: Click classes tab' : function (browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
    },

    'Step 13: Check for Ontology classes' : function (browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
    }
}
