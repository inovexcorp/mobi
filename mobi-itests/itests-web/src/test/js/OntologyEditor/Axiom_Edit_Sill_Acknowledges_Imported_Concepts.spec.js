/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
var path = require('path');
var adminUsername = 'admin'
var adminPassword = 'admin'
var vocab = path.resolve(__dirname + '/../../resources/rdf_files/single-concept-vocab.ttl');
var Onto2 = path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-2.ttl');
var Onto3 = path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-3.ttl');
var skosOnt = path.resolve(__dirname + '/../../resources/rdf_files/skos.rdf');

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Login and navigate to Ontology Editor' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        [vocab, skosOnt, Onto3, Onto2].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 3: Ensure test-local-imports-2 Ontology is open' : function(browser) {
        browser.page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'test-local-imports-2');
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Validate Ontology Imports Appearance' : function(browser) {
        browser
            .waitForElementVisible('.imports-block')
            .useXpath()
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/test-local-imports-3")]]')
            .assert.not.elementPresent('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/single-concept-vocab")]]')
            .assert.not.elementPresent('//imports-block//div[contains(@class, "indirect-import-container")]//p//a[text()[contains(.,"http://www.w3.org/2004/02/skos/core")]]')
    },

    'Step 5: Add a vocab as an import': function(browser) {
        browser.page.ontologyEditorPage().addServerImport('single-concept-vocab');
        browser.globals.wait_for_no_spinners(browser);  
        browser
            .useCss()
            .waitForElementVisible('.imports-block')
            .useXpath()
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://www.w3.org/2004/02/skos/core")]]')
            .assert.visible('//imports-block//p//a[text()[contains(.,"http://mobi.com/ontology/single-concept-vocab")]]');
    },

    'Step 6: Commit Changes': function(browser) {
        browser.page.ontologyEditorPage().commit('commit456');
        browser.globals.wait_for_no_spinners(browser);  
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 7: Click the concepts tab and ensure hierarchy block is showing' : function(browser) {
        browser.page.ontologyEditorPage().closeOntology('test-local-imports-2');
        browser.globals.wait_for_no_spinners(browser);  
        browser.page.ontologyEditorPage().openOntology('test-local-imports-2');
        browser.globals.wait_for_no_spinners(browser);  
        browser.page.ontologyEditorPage().openConceptsTab();
    },

    'Step 8: Check for Imported Concept' : function(browser) {
        var concept1Xpath = '//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]'
        browser
            .useCss()
            .waitForElementPresent('div.concepts-tab concept-hierarchy-block')
            .useXpath()
            .waitForElementVisible(concept1Xpath)
            .assert.visible(concept1Xpath + '//ancestor::div[contains(@class, "imported")]');
    },

    'Step 9: Click the properties tab and ensure hierarchy block is showing' : function(browser) {
        browser.page.ontologyEditorPage().openPropertiesTab();
    },
    
    'Step 10: Click on Object Properties and ensure that correct object properties are on page' : function(browser) {
        // click on 'Object Property 0' and ensure that selected-property has right property
        browser.page.ontologyEditorPage()
            .openObjectPropertiesFolder()
            .verifyItemVisible('Object Property 0')
            .verifyItemVisible('Object Property 1')
            .verifyItemVisible('Object Property 2')
    },

    'Step 11: Click on Data Properties and ensure that correct Data properties are on page' : function(browser) {
        // click on 'Object Property 0' and ensure that selected-property has right property
        browser.page.ontologyEditorPage()
            .openDataPropertiesFolder()
            .verifyItemVisible('Data Property 0')
            .verifyItemVisible('Data Property 1')
            .verifyItemVisible('Data Property 2')
            .selectItem('Data Property 0');
    },

    'Step 12: Open Axiom Overlay for Data Property 0' : function(browser) {
        browser
            .useXpath()
            .click('//div[contains(@class, "section-header")]//h5[text()[contains(., "Axioms")]]//following-sibling::a[contains(@class, "fa-plus")]') // opens overlay
            .useCss()
            .waitForElementPresent('axiom-overlay')
    },

    'Step 13: Axiom Overlay - Edit Domain Property through Manchester Editor' : function(browser) {
        browser
            .waitForElementVisible('axiom-overlay')
            .waitForElementVisible('mat-optgroup mat-option')
            .useXpath()
            .waitForElementVisible('//mat-option//span[text()[contains(.,"subPropertyOf")]]')
            .click('//mat-option//span[text()[contains(.,"subPropertyOf")]]')
            .useCss()
            .waitForElementNotPresent('mat-optgroup')
            .assert.not.elementPresent('mat-optgroup') // ensure list is hidden
            .useXpath()
            .click('//axiom-overlay//mat-tab-header//div[contains(@class, "mat-tab-label-content")][text()[contains(., "Editor")]]')
            .waitForElementNotPresent('//axiom-overlay//input[contains(@data-placeholder, "Values")]')
            .assert.not.elementPresent('//axiom-overlay//input[contains(@data-placeholder, "Values")]')
            .waitForElementVisible('//axiom-overlay//ngx-codemirror')
            .waitForElementPresent('//axiom-overlay//ngx-codemirror//div[contains(@Class, "CodeMirror")]//textarea')
            .click('//axiom-overlay//ngx-codemirror//span[contains(@role, "presentation")]')
            .sendKeys('//axiom-overlay//ngx-codemirror//div[contains(@Class, "CodeMirror")]//textarea' ,"DataProperty1 or DataProperty2")
            .click('//axiom-overlay//button//span[text()[contains(.,"Submit")]]')
            .useCss()
            .waitForElementNotPresent('axiom-overlay')
    },

    'Step 14: Axiom Overlay - Verify Expression was added to data property' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementVisible('//selected-details//span[contains(@class, "entity-name")][text()[contains(., "Data Property 0")]]')
            .waitForElementVisible('//div[contains(@class, "section-header")]//h5[text()[contains(., "Axioms")]]//following-sibling::a[contains(@class, "fa-plus")]') // opens overlay
            .assert.visible('//axiom-block//datatype-property-axioms//property-values//p[text()[contains(., "Sub Property Of")]]')
            .assert.visible('//axiom-block//datatype-property-axioms//property-values//blank-node-value-display //span[text()[contains(., "DataProperty1")]]')
            .assert.visible('//axiom-block//datatype-property-axioms//property-values//blank-node-value-display //span[text()[contains(., "or")]]')
            .assert.visible('//axiom-block//datatype-property-axioms//property-values//blank-node-value-display //span[text()[contains(., "DataProperty2")]]')
    },
    
    'Step 15: Open Axiom Overlay for Object Property 0' : function(browser) {
        browser
            .click('//property-tree//tree-item//span[text()[contains(., "Object Property 0")]]')
            .useCss()
            .waitForElementVisible('properties-tab .selected-property')
            .useXpath()
            .waitForElementVisible('//selected-details//span[contains(@class, "entity-name")][text()[contains(., "Object Property 0")]]')
            .useCss()
            .waitForElementVisible('properties-tab .selected-property')
            .useXpath()
            .waitForElementVisible('//selected-details//span[contains(@class, "entity-name")][text()[contains(., "Object Property 0")]]')
            .click('//div[contains(@class, "section-header")]//h5[text()[contains(., "Axioms")]]//following-sibling::a[contains(@class, "fa-plus")]') // opens overlay
            .useCss()
            .waitForElementPresent('axiom-overlay')
    },

    'Step 16: Axiom Overlay - Edit SubProperty Axiom for Object Property' : function(browser) {
        browser
            .waitForElementVisible('axiom-overlay')
            .waitForElementVisible('mat-optgroup mat-option')
            .useXpath()
            .waitForElementVisible('//mat-option//span[text()[contains(.,"subPropertyOf")]]')
            .click('//mat-option//span[text()[contains(.,"subPropertyOf")]]')
            .useCss()
            .waitForElementNotPresent('mat-optgroup')
    },

    'Step 17: Axiom Overlay - Edit SubProperty values for Object Property' : function(browser) {
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

    'Step 18: Axiom Overlay - Submit data' : function(browser) {
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

    'Step 19: Click the concepts tab' : function(browser) {
        browser.page.ontologyEditorPage().openConceptsTab();
    },

    'Step 20: Check for Imported Concept' : function(browser) {
        var concept1Xpath = '//hierarchy-tree//tree-item//span[text()[contains(., "Concept 1")]]'
        browser
            .useCss()
            .waitForElementPresent('div.concepts-tab concept-hierarchy-block')
            .useXpath()
            .waitForElementVisible(concept1Xpath)
            .assert.visible(concept1Xpath + '//ancestor::div[contains(@class, "imported")]');
    }
}
