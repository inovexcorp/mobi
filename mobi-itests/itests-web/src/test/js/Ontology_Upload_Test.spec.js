/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
var Onto1 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1.ttl'
var Onto1e = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1e.ttl'  // has syntax issue
var Onto1s = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1s.ttl'  // same as test-local-imports-1
var Onto2 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-3.ttl'
var Onto4 = process.cwd()+ '/src/test/resources/ontologies/unresolvableImport.owl' // OWL Files Processed Differently

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1, Onto2, Onto3, Onto4)
    },

    'Step 3: Upload Corrupt Ontologies' : function (browser) {
        browser
            .setValue('input[type=file]', Onto1e)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .setValue('input[type=file]', Onto1s)
    },

    'Step 4: Submit all ontology files' : function (browser) {
        browser
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//button[text()[contains(.,"Submit All")]]')
    },

   'Step 5: Validate Ontology Appearance' : function (browser) {
       browser
           .waitForElementVisible('div.ontologies')
           .assert.elementNotPresent('div.modal-header')
           .waitForElementVisible('div.ontologies')
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', Onto1e.replace(process.cwd()+ '/src/test/resources/ontologies/', ''))
           .keys(browser.Keys.ENTER)
           .useXpath()
           .assert.elementNotPresent('//div[contains(@class, "list-group")]//div[text()[contains(.,"' + Onto1e.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
           .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h3[text()[contains(.,"' + Onto1e.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
           .useCss()
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', Onto1s.replace(process.cwd()+ '/src/test/resources/ontologies/', ''))
           .keys(browser.Keys.ENTER)
           .useXpath()
           .assert.elementNotPresent('//div[contains(@class, "list-group")]//div[text()[contains(.,"' + Onto1s.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
           .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h3[text()[contains(.,"' + Onto1s.replace(process.cwd()+ '/src/test/resources/ontologies/', '') + '")]]')
           .useCss()
           .clearValue('open-ontology-tab search-bar input')
           .setValue('open-ontology-tab search-bar input', '')
           .keys(browser.Keys.ENTER)
   },

    'Step 6: Open an Ontology called “test-local-imports-1.ttl' : function (browser) {
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
    }
}