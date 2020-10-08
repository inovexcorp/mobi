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
var adminUsername = "admin"
var adminPassword = "admin"
var vocab = process.cwd()+ '/src/test/resources/ontologies/single-concept-vocab.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-3.ttl'
var skosOnt = process.cwd()+ '/src/test/resources/ontologies/skos.rdf'

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
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible('div.btn-container button')
            .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
    },

    'Step 5: Upload an Ontology' : function (browser) {
        browser
            .setValue('input[type=file]', vocab)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .setValue('input[type=file]', Onto2)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .setValue('input[type=file]', Onto3)
            .click('upload-ontology-overlay div.modal-footer button.btn')
            .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
            .setValue('input[type=file]', skosOnt)
    },

    'Step 6: Submit all ontology files' : function (browser) {
        browser
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//button[text()[contains(.,"Submit All")]]')
    },

    'Step 7: Validate Ontology Appearance' : function (browser) {
        browser
            .waitForElementVisible('div.ontologies')
            .assert.elementNotPresent('div.modal-header')
            .waitForElementVisible('div.ontologies')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"single-concept-vocab.ttl")]]')
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"test-local-imports-2.ttl")]]')
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"test-local-imports-3.ttl")]]')
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"skos.rdf")]]')
            .useCss()
    },

    'Step 8: Click on Ontology called “test-local-imports-2.ttl' : function (browser) {
            browser
                .click('xpath', '//div[contains(@class, "list-group")]//div//div[text()[contains(.,"test-local-imports-2.ttl")]]')
    },

    'Step 9: Validate Ontology Imports Appearance' : function (browser) {
            browser
                .waitForElementVisible('.imports-block')
                .useXpath()
                .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-3")]]')
                .assert.not.elementPresent('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/single-concept-vocab")]]')
                .assert.not.elementPresent('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://www.w3.org/2004/02/skos/core")]]')
    },

    'Step 10: Add a vocab as an import': function (browser) {
            browser
                .useCss()
                .click('.imports-block a.fa-plus')
                .useXpath()
                .waitForElementVisible('//imports-overlay//span[text()[contains(.,"On Server")]]//parent::a')
                .click('xpath', '//imports-overlay//span[text()[contains(.,"On Server")]]//parent::a')
                .waitForElementVisible('//imports-overlay//h4[text()[contains(.,"single-concept-vocab.ttl")]]')
                .click('//imports-overlay//h4[text()[contains(.,"single-concept-vocab.ttl")]]//parent::div//following-sibling::md-checkbox')
                .waitForElementVisible('//imports-overlay//h4[text()[contains(.,"single-concept-vocab.ttl")]]//parent::div//following-sibling::md-checkbox[contains(@class, "md-checked")]')
                .click('xpath', '//button[text()[contains(.,"Submit")]]')
                .useCss()
                .waitForElementNotPresent('div.spinner')
                .useXpath()
                .waitForElementNotPresent('//imports-overlay')
                .assert.visible('//imports-block//p//a[text()[contains(.,"http://www.w3.org/2004/02/skos/core")]]')
                .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/single-concept-vocab")]]');
    },

    'Step 11: Commit Changes': function(browser) {
            browser
                .useCss()
                .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
                .waitForElementVisible('circle-button-stack .fa-git')
                .click('circle-button-stack .fa-git')
                .waitForElementVisible('commit-overlay .modal-header h3')
                .assert.containsText('commit-overlay .modal-header h3', 'Commit')
                .setValue('commit-overlay textarea[name=comment]', 'commit456')
                .useXpath()
                .click('//commit-overlay//button[text()="Submit"]')
                .useCss()
                .waitForElementNotPresent('commit-overlay .modal-header h3', 5000)
    },

    'Step 12: Click the concepts tab' : function (browser) {
            browser
                .useXpath()
                .waitForElementVisible('//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Concepts")]]')
                .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Concepts")]]')
    },

    'Step 13: Check for Imported Concept' : function (browser) {
            browser
                .useXpath()
                .waitForElementVisible('//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]')
                .assert.visible('//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]//ancestor::div[contains(@class, "imported")]');
    },

    'Step 14: Click the properties tab' : function (browser) {
            browser
                .useXpath()
                .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Properties")]]')
    },

    'Step 15: Check for Add Subproperty Axiom to Object Property' : function (browser) {
            browser
                .useXpath()
                .waitForElementVisible('//property-tree//i[contains(@class, "fa-folder")]//following-sibling::span[text()[contains(., "Object Properties")]]')
                .click('//property-tree//i[contains(@class, "fa-folder")]//following-sibling::span[text()[contains(., "Object Properties")]]')
                .waitForElementVisible('//property-tree//tree-item//span[text()[contains(., "Object Property 0")]]')
                .click('//property-tree//tree-item//span[text()[contains(., "Object Property 0")]]')
                .waitForElementVisible('//selected-details//span[contains(@class, "entity-name")][text()[contains(., "Object Property 0")]]')
                .click('//div[contains(@class, "section-header")]//h5[text()[contains(., "Axioms")]]//following-sibling::a[contains(@class, "fa-plus")]')
                .useCss()
                .waitForElementPresent('axiom-overlay div[placeholder="Select an axiom"] span.btn')
                .waitForElementNotPresent('div.modal.ng-animate')
                .click('axiom-overlay div[placeholder="Select an axiom"] span.btn')
                .useXpath()
                .waitForElementVisible('//axiom-overlay//div[text()[contains(.,"subPropertyOf")]]')
                .click('//axiom-overlay//div[text()[contains(., "subPropertyOf")]]')
                .useCss()
                .waitForElementNotVisible('axiom-overlay ul.ui-select-dropdown')
                .useXpath()
                .click('//axiom-overlay//input[contains(@placeholder, "Select values")]')
                .waitForElementVisible('//axiom-overlay//div[contains(@title, "http://www.w3.org/2004/02/skos/core#broaderTransitive")]')
                .click('//axiom-overlay//div[contains(@title, "http://www.w3.org/2004/02/skos/core#broaderTransitive")]')
                .useCss()
                .waitForElementNotVisible('axiom-overlay ul.ui-select-dropdown')
                .useXpath()
                .click('//axiom-overlay//button[text()[contains(.,"Submit")]]')
                .waitForElementNotVisible('//axiom-overlay')
    },

    'Step 16: Click the concepts tab' : function (browser) {
            browser
                .useXpath()
                .waitForElementVisible('//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Concepts")]]')
                .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Concepts")]]')
    },

    'Step 17: Check for Imported Concept' : function (browser) {
                browser
                    .useXpath()
                    .waitForElementVisible('//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]')
                    .assert.visible('//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]//ancestor::div[contains(@class, "imported")]');
    }
}