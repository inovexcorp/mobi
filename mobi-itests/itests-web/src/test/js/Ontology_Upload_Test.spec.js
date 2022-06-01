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
            .uploadFile('input[type=file]', Onto1e)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .uploadFile('input[type=file]', Onto1s)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .uploadFile('input[type=file]', Onto1TrigZip)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .uploadFile('input[type=file]', Onto1Trig)
    },

    'Step 4: Submit all ontology files' : function (browser) {
        browser
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//button[text()[contains(.,"Submit All")]]')
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
           .assert.not.elementPresent('//div[contains(@class, "list-group")]//div[text()[contains(.,"' + Onto1e.replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
           .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h3[text()[contains(.,"' + Onto1e.replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
           .useCss()
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', Onto1s.replace(process.cwd()+ '/src/test/resources/rdf_files/', ''))
           .keys(browser.Keys.ENTER)
           .useXpath()
           .assert.not.elementPresent('//div[contains(@class, "list-group")]//div[text()[contains(.,"' + Onto1s.replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
           .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h3[text()[contains(.,"' + Onto1s.replace(process.cwd()+ '/src/test/resources/rdf_files/', '') + '")]]')
           .useCss()
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', '')
           .keys(browser.Keys.ENTER)
   },

    'Step 6: Open an Ontology called test-local-imports-1.ttl' : function (browser) {
        browser.globals.open_ontology(browser, Onto1)
    },

    'Step 7: Click classes tab' : function (browser) {
        browser
            .waitForElementVisible('div.material-tabset li.nav-item')
            .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Classes")]]')
    },

    'Step 8: Check for Ontology classes' : function (browser) {
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

    'Step 9: Return to ontology search page' : function (browser) {
        browser.globals.return_to_ontology_editor_search(browser)
    },

    'Step 10: Open an Ontology called test-class-empty-label.ttl' : function (browser) {
        browser.globals.open_ontology(browser, Onto5)
    },

    'Step 11: Click classes tab' : function (browser) {
        browser
            .waitForElementVisible('div.material-tabset li.nav-item')
            .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Classes")]]')
    },

    'Step 12: Check for Ontology classes' : function (browser) {
        browser
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
    }
}
