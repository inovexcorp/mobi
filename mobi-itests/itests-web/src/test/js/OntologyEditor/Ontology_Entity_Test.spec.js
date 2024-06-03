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
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 3: Click classes tab & open class': function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "tree-item-wrapper")]//span[text()="Test Class"]')
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()="Test Class"]')
    },

    'Step 4: Delete ontology class': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .click('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .waitForElementVisible('//confirm-modal')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary')
    },

    'Step 5: Verify class deletion': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementNotPresent('//div[contains(@class, "tree-item-wrapper")]//span[text()="Test Class"]')
    },

    'Step 6: Click properties tab & open property': function(browser) {
        var propertiesTabXpath = '//mat-tab-header//div[text()[contains(., "Properties")]]'
        var dataPropertiesTreeXPath = '//property-tree//i[contains(@class, "fa-folder")]//following-sibling::span[text()[contains(., "Data Properties")]]'
        browser
            .useXpath()
            .waitForElementVisible(propertiesTabXpath)
            .click('xpath', propertiesTabXpath)
            .useCss()
            .waitForElementPresent('div.properties-tab property-hierarchy-block')
            .useXpath()
            .waitForElementVisible(dataPropertiesTreeXPath)
            .click(dataPropertiesTreeXPath)
            .waitForElementVisible('//property-tree//tree-item//span[text()[contains(., "Test Data Property")]]')
            .click('xpath', '//property-tree//tree-item//span[text()[contains(., "Test Data Property")]]')
    },

    'Step 7: Delete ontology property': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .click('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .waitForElementVisible('//confirm-modal')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary')
    },

    'Step 8: Verify property deletion': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementNotPresent('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Data Property")]]')
    },

    'Step 9: Click individuals tab & open individual': function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Individuals")]]')
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Second Test Class")]]')
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Second Test Class")]]')
            .waitForElementVisible('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Individual")]]')
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Individual")]]')
    },

    'Step 10: Delete ontology individual': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .click('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .waitForElementVisible('//confirm-modal')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary')
    },

    'Step 11: Verify individual deletion': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementNotPresent('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Individual")]]')
    },

    'Step 12 : Click concepts tab & open concept': function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Concepts")]]')
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Concept")]]')
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Concept")]]')
    },

    'Step 13: Add broader property to concept': function(browser) {
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

    'Step 14: Check if Value can be reselected': function(browser) {
        !browser
            .useXpath()
            .waitForElementVisible('//object-property-overlay//form')
            .waitForElementVisible('//object-property-overlay//div[contains(@class, "mat-dialog-actions")]')
            .click('//object-property-overlay//form/iri-select-ontology//mat-form-field')
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()=" Second test concept "]')
            .click('//mat-optgroup//mat-option//span[text()=" Second test concept "]')
            .click('//button//span[text()="Cancel"]')
    },

    'Step 15: Delete ontology concept': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .click('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .waitForElementVisible('//confirm-modal')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary')
            .pause(2000)
    },

    'Step 16: Verify concept deletion': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useXpath()
            .waitForElementNotPresent('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Concept")]]')
    },

    'Step 17: Click schemes tab & open scheme': function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Schemes")]]')
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Scheme")]]')
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Scheme")]]')
    },

    'Step 18: Delete ontology scheme': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .click('//div[contains(@class, "selected-header")]//button//span[text()[contains(., "Delete")]]')
            .waitForElementVisible('//confirm-modal')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary')
    },

    'Step 19: Verify scheme deletion': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useXpath()
            .waitForElementNotPresent('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Test Scheme")]]')
    },
}
