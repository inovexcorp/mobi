/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
var vocab = process.cwd()+ '/src/test/resources/rdf_files/single-concept-vocab.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-3.ttl'
var skosOnt = process.cwd()+ '/src/test/resources/rdf_files/skos.rdf'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Login and navigate to Ontology Editor' : function (browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, vocab, Onto2, Onto3, skosOnt)
    },

    'Step 3: Open test-local-imports-2 Ontology' : function (browser) {
        browser.globals.open_ontology(browser, Onto2)
    },

    'Step 4: Validate Ontology Imports Appearance' : function (browser) {
        browser
            .waitForElementVisible('.imports-block')
            .useXpath()
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-3")]]')
            .assert.not.elementPresent('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/single-concept-vocab")]]')
            .assert.not.elementPresent('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://www.w3.org/2004/02/skos/core")]]')
    },

    'Step 5: Add a vocab as an import': function (browser) {
        browser
            .useCss()
            .click('.imports-block a.fa-plus') // clicking this opens imports-overlay
            .waitForElementVisible('imports-overlay')
            .useXpath()
            .waitForElementVisible('//imports-overlay//div[text()[contains(.,"On Server")]]')
            .waitForElementVisible('//imports-overlay//button//span[text()[contains(.,"Submit")]]')
            .pause(1000)
            .click('xpath', '//imports-overlay//div[text()[contains(.,"On Server")]]')
            .useCss().waitForElementNotVisible('div.spinner') // waits for imports to loads up
            .useXpath().waitForElementVisible('//imports-overlay//h4[text()[contains(.,"single-concept-vocab")]]')
            .click('//imports-overlay//h4[text()[contains(.,"single-concept-vocab")]]//parent::div')
            .waitForElementVisible('//imports-overlay//mat-chip-list//mat-chip[text()[contains(.,"single-concept-vocab")]]')
            .click('xpath', '//button//span[text()[contains(.,"Submit")]]')
            .useCss()
            .waitForElementNotPresent('imports-overlay')
            .waitForElementVisible('.imports-block')
            .useXpath()
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://www.w3.org/2004/02/skos/core")]]')
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/single-concept-vocab")]]');
    },

    'Step 6: Commit Changes': function(browser) {
        browser
            .useCss()
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0) // hover over + element
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay')
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'commit456')
            .useXpath()
            .click('//commit-overlay//button//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay')
            .waitForElementVisible('.imports-block') // ensure that still on correct tab after committing
    },

    'Step 7: Click the concepts tab and ensure hierarchy block is showing' : function (browser) {
        // 'const' is available in ES6
        var conceptTabXpath = '//mat-tab-header//div[text()[contains(., "Concepts")]]';
        browser
            .click('ontology-sidebar span.close-icon')
            .useXpath()
        browser.globals.open_ontology(browser, Onto2)
        browser
            .useXpath()
            .waitForElementVisible(conceptTabXpath)
            .waitForElementVisible(conceptTabXpath)
            .click('xpath', conceptTabXpath)
            .useCss()
            .waitForElementPresent('div.concepts-tab concept-hierarchy-block')
    },

    'Step 8: Check for Imported Concept' : function (browser) {
        var concept1Xpath = '//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]'
        browser
            .useCss()
            .waitForElementPresent('div.concepts-tab concept-hierarchy-block')
            .useXpath()
            .waitForElementVisible(concept1Xpath)
            .assert.visible(concept1Xpath + '//ancestor::div[contains(@class, "imported")]');
    },

    'Step 9: Click the properties tab and ensure hierarchy block is showing' : function (browser) {
        var propertiesTabXpath = '//mat-tab-header//div[text()[contains(., "Properties")]]'
        browser
            .useXpath()
            .waitForElementVisible(propertiesTabXpath)
            .click('xpath', propertiesTabXpath)
            .useCss()
            .waitForElementPresent('div.properties-tab property-hierarchy-block')
    },
    
    'Step 10: Click on Object Properties and ensure that correct object properties are on page' : function (browser) {
        var objectPropertiesTreeXPath = '//property-tree//i[contains(@class, "fa-folder")]//following-sibling::span[text()[contains(., "Object Properties")]]'
        // click on 'Object Property 0' and ensure that selected-property has right property
        browser
            .useCss()
            .waitForElementPresent('div.properties-tab property-hierarchy-block')
            .useXpath()
            .waitForElementVisible(objectPropertiesTreeXPath)
            .click(objectPropertiesTreeXPath)
            .waitForElementVisible('//property-tree//tree-item//span[text()[contains(., "Object Property 0")]]')
            .waitForElementVisible('//property-tree//tree-item//span[text()[contains(., "Object Property 1")]]')
            .waitForElementVisible('//property-tree//tree-item//span[text()[contains(., "Object Property 2")]]')
            .pause(2000)
            .click('//property-tree//tree-item//span[text()[contains(., "Object Property 0")]]')
            .useCss()
            .waitForElementVisible('properties-tab .selected-property')
            .useXpath()
            .waitForElementVisible('//selected-details//span[contains(@class, "entity-name")][text()[contains(., "Object Property 0")]]')
    },
    
    'Step 11: Open Axiom Overlay for Object Property 0' : function (browser) {
        browser
            .useCss()
            .waitForElementVisible('properties-tab .selected-property')
            .useXpath()
            .waitForElementVisible('//selected-details//span[contains(@class, "entity-name")][text()[contains(., "Object Property 0")]]')
            .click('//div[contains(@class, "section-header")]//h5[text()[contains(., "Axioms")]]//following-sibling::a[contains(@class, "fa-plus")]') // opens overlay
            .useCss()
            .waitForElementPresent('axiom-overlay')
    },

    'Step 12: Axiom Overlay - Edit SubProperty Axiom for Object Property' : function (browser) {
        browser
            .waitForElementVisible('axiom-overlay')
            .waitForElementVisible('mat-optgroup mat-option')
            .useXpath()
            .waitForElementVisible('//mat-option//span[text()[contains(.,"subPropertyOf")]]')
            .click('//mat-option//span[text()[contains(.,"subPropertyOf")]]')
            .useCss()
            .waitForElementNotPresent('mat-optgroup')
    },

    'Step 13: Axiom Overlay - Edit SubProperty values for Object Property' : function (browser) {
        browser
            .waitForElementPresent('axiom-overlay') // ensure still on overlay
            .assert.not.elementPresent('mat-optgroup') // ensure list is hidden
            .useXpath()
            .click('//axiom-overlay//input[contains(@data-placeholder, "Values")]');
        // after clicking select value, then ul.ui-select-choices should not be hidden anymore
        browser
            .useCss()
            .waitForElementPresent('mat-optgroup mat-option')
            .useXpath()
            .waitForElementVisible('//mat-option//span[text()[contains(.,"has broader transitive")]]')
            .click('//mat-option//span[text()[contains(.,"has broader transitive")]]')
        // After clicking on value, choices should be hidden
        browser
            .useCss()
            .waitForElementNotPresent('mat-optgroup mat-option')
    },

    'Step 14: Axiom Overlay - Submit data' : function (browser) {
        browser
            .useCss()
            .waitForElementPresent('axiom-overlay')
            .useXpath()
            .click('//axiom-overlay//button//span[text()[contains(.,"Submit")]]')
        // ensure axiom-overlay not displayed
        browser
            .useCss()
            .waitForElementNotPresent('axiom-overlay')
    },

    'Step 15: Click the concepts tab' : function (browser) {
        var conceptTabXpath = '//mat-tab-header//div[text()[contains(., "Concepts")]]';
        browser
            .useXpath()
            .waitForElementVisible(conceptTabXpath)
            .click('xpath', conceptTabXpath)
            .useCss()
            .waitForElementPresent('div.concepts-tab concept-hierarchy-block')
    },

    'Step 16: Check for Imported Concept' : function (browser) {
        var concept1Xpath = '//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]'
        browser
            .useCss()
            .waitForElementPresent('div.concepts-tab concept-hierarchy-block')
            .useXpath()
            .waitForElementVisible(concept1Xpath)
            .assert.visible(concept1Xpath + '//ancestor::div[contains(@class, "imported")]');
    }
}
