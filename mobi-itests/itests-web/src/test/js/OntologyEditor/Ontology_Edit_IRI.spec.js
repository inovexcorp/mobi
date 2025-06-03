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
var validURL = 'https://avm.inovexcorp.com/ontologies/10/2019';
var invalidURL = 'https://avm.inovexcorp.com/ontolo<gies/10/2019';
var invalidEndsWidth = 'test`-local-`imports-1';
var input_iriBegin = '//mat-label[text()[contains(.,"Begins With")]]//ancestor::mat-form-field//input';
var input_iriEnds = '//mat-label[text()[contains(.,"Ends With")]]//ancestor::mat-form-field//input';

var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/CurrencyUnitOntology.ttl');

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.page.ontologyEditorPage().uploadOntology(Onto1);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 3: Open edit IRI Modal' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .waitForElementVisible('//edit-iri-overlay')
            .waitForElementVisible(input_iriBegin)
            .waitForElementVisible(input_iriEnds)
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, invalidURL)
            .assert.visible('//edit-iri-overlay//mat-error[text()[contains(.,"This value is invalid")]]')
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, validURL)
            .clearValue(input_iriEnds)
            .setValue(input_iriEnds, invalidEndsWidth)
            .assert.visible('//edit-iri-overlay//mat-error[text()[contains(.,"This value is invalid")]]')
            .useXpath()
            .click("//button/span[text() [contains(., 'Cancel')]]");
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 4: Open create class modal' : function(browser) {
        browser.page.ontologyEditorPage().openCreateOwlClassModal();
    },

    'Step 5: Set the IRI' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
            .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', 'Class A')
            .waitForElementVisible('//create-class-overlay//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//create-class-overlay//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .waitForElementVisible('//edit-iri-overlay')
            .waitForElementVisible(input_iriBegin)
            .waitForElementVisible(input_iriEnds)
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, 'http://www.ontologyrepository.com/CommonCoreOntologies')
            .useCss()
            .waitForElementVisible('edit-iri-overlay mat-form-field mat-select')
            .click('edit-iri-overlay mat-form-field mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "/")]]')
            .useXpath()
            .click("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
            .useCss()
            .waitForElementNotPresent('edit-iri-overlay h1.mat-dialog-title');
    },

    'Step 6: Create class' : function(browser) {
        browser
            .useXpath()
            .click('//create-class-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-class-overlay h1.mat-dialog-title')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Verify class was created' : function(browser) {
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .verifyItemVisible('Class A');
    },

    'Step 8: Verify new class IRI is correct' : function(browser) {
        browser.page.ontologyEditorPage()
            .selectItem('Class A')
            .useCss()
            .waitForElementVisible('static-iri div.static-iri')
            .assert.textContains('static-iri div.static-iri span strong', 'http://www.ontologyrepository.com/CommonCoreOntologies/ClassA')
    },

    'Step 9: Open create class modal' : function(browser) {
        browser.page.ontologyEditorPage().openCreateOwlClassModal();
    },

    'Step 10: Validate duplicate check' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
            .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', 'CurrencyUnit')
            .assert.visible('//create-class-overlay//p[text()[contains(.,"This IRI already exists")]]')
    },
}
