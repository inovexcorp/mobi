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
var path = require('path');
var adminUsername = 'admin'
var adminPassword = 'admin'
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/EntityDeletionOntology.ttl');

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies': function(browser) {
        browser.page.ontologyEditorPage().uploadOntology(Onto1);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 3: Click classes tab & open class': function(browser) {
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .selectItem('Test Class');
    },

    'Step 4: Delete ontology class': function(browser) {
        browser.page.ontologyEditorPage().deleteSelectedEntity('Test Class');
    },

    'Step 5: Verify class deletion': function(browser) {
        browser.page.ontologyEditorPage().verifyDeletedEntity('Test Class')
    },

    'Step 6: Click individuals tab & open individual': function(browser) {
        browser.page.ontologyEditorPage()
            .openIndividualsTab()
            .openIndividualTreeFolder('Second Test Class')
            .selectItem('Test Individual');
    },

    'Step 7: Ensure datatype properties can be deleted': function(browser) {
        browser.page.ontologyEditorPage()
            .removeDatatypeProperty('https://mobi.com/ontologies/EntityDeletionOntology#testDataProperty',
                'test value', 'https://mobi.com/ontologies/EntityDeletionOntology#TestIndividual')
    },

    'Step 8: Delete ontology individual': function(browser) {
        browser.page.ontologyEditorPage().deleteSelectedEntity('Test Individual');
    },

    'Step 9: Verify individual deletion': function(browser) {
        browser.page.ontologyEditorPage().verifyDeletedEntity('Test Individual')
    },

    'Step 10 : Click concepts tab & open concept': function(browser) {
        browser.page.ontologyEditorPage()
            .openConceptsTab()
            .selectItem('Test Concept');
    },

    'Step 11: Ensure datatype properties can be deleted': function(browser) {
        browser.page.ontologyEditorPage()
            .removeDatatypeProperty('https://mobi.com/ontologies/EntityDeletionOntology#testDataProperty',
                'test concept value', 'https://mobi.com/ontologies/EntityDeletionOntology#TestConcept')
    },

    'Step 12: Add broader property to concept': function(browser) {
        !browser
            .useXpath()
            .waitForElementVisible('//object-property-block//h5[text()[contains(., "Object Properties")]]')
            .click('//object-property-block//h5[text()[contains(., "Object Properties")]]//following-sibling::a')
            .waitForElementVisible('//object-property-overlay//form')
            .waitForElementVisible('//object-property-overlay//div[contains(@class, "mat-dialog-actions")]')
            .click('//object-property-overlay//form/mat-form-field')
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()=" has broader "]')
            .click('//mat-optgroup//mat-option//span[text()=" has broader "]')
            .click('//object-property-overlay//form/iri-select-ontology//mat-form-field')
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()=" Second test concept "]')
            .click('//mat-optgroup//mat-option//span[text()=" Second test concept "]')
    },

    'Step 13: Check if Value can be reselected': function(browser) {
        !browser
            .useXpath()
            .waitForElementVisible('//object-property-overlay//form')
            .waitForElementVisible('//object-property-overlay//div[contains(@class, "mat-dialog-actions")]')
            .click('//object-property-overlay//form/iri-select-ontology//mat-form-field')
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()=" Second test concept "]')
            .click('//mat-optgroup//mat-option//span[text()=" Second test concept "]')
            .click('//button//span[text()="Cancel"]')
    },

    'Step 14: Delete ontology concept': function(browser) {
        browser.page.ontologyEditorPage().deleteSelectedEntity('Test Concept');
    },

    'Step 15: Verify concept deletion': function(browser) {
        browser.page.ontologyEditorPage().verifyDeletedEntity('Test Concept')
    },

    'Step 16: Click properties tab & open property': function(browser) {
        browser.page.ontologyEditorPage()
            .openPropertiesTab()
            .openDataPropertiesFolder()
            .selectItem('Test Data Property');
    },

    'Step 17: Delete ontology property': function(browser) {
        browser.page.ontologyEditorPage().deleteSelectedEntity('Test Data Property');
    },

    'Step 18: Verify property deletion': function(browser) {
        browser.page.ontologyEditorPage().verifyDeletedEntity('Test Data Property')
    },

    'Step 19: Click schemes tab & open scheme': function(browser) {
        browser.page.ontologyEditorPage()
            .openSchemesTab()
            .selectItem('Test Scheme');
    },

    'Step 20: Delete ontology scheme': function(browser) {
        browser.page.ontologyEditorPage().deleteSelectedEntity('Test Scheme');
    },

    'Step 21: Verify scheme deletion': function(browser) {
        browser.page.ontologyEditorPage().verifyDeletedEntity('Test Scheme')
    },
}
