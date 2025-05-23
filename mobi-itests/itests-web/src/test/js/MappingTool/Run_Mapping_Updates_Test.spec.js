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
var OntoSample = path.resolve(__dirname + '/../../resources/rdf_files/uhtc-ontology.ttl');
var skosOnt = path.resolve(__dirname + '/../../resources/rdf_files/skos.rdf');
var OntoCSV = path.resolve(__dirname + '/../../resources/ontology_csv\'s/uhtc-compounds.csv');

module.exports = {
    '@tags': ['mapping-tool', 'mapping-tool-changes', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
    },

    'Step 2: Create New Ontology': function(browser) {
        browser.page.ontologyEditorPage().createOntology('ontology-mapping-updates', 'myDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 3: Verify new ontology properties' : function(browser) {
        browser
            .waitForElementVisible('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block');
        browser.page.ontologyEditorPage().verifyProjectTab('ontology-mapping-updates', 'myDescription', 'Ontologymappingupdates');
    },

    'Step 4: Upload Ontologies' : function(browser) {
        [OntoSample, skosOnt].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 5: Link ontologies' : function(browser) {
        browser.page.ontologyEditorPage().openOntology('uhtc-ontology');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().addServerImport('skos');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Commit IRI change' : function(browser) { 
        browser.page.ontologyEditorPage().commit('Changed Import');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 7: Navigate to Mapping page' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'mapper', 'mapper-page');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 8: Create new mapping' : function(browser) {
        browser
            .click('button.new-button');
        browser
            .waitForElementVisible('create-mapping-overlay')
            .waitForElementVisible('create-mapping-overlay input[name="title"]')
            .setValue('form.mat-dialog-content input[name=title]', "UHTC material Mapping")
            .setValue('form.mat-dialog-content textarea', "A mapping of materials listed in the UHTC csv file to the UHTC ontology")
            .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
            .click('div.mat-dialog-actions button.mat-primary');
        browser
            .waitForElementNotPresent('class-mapping-overlay');
    },

    'Step 9: Attach csv to mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementNotPresent('div.modal.fade')
            .waitForElementVisible('div.file-input button')
            .click('div.file-input button')
            .uploadFile('input[type=file]', OntoCSV)
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('button.continue-btn:enabled')
            .click('button.continue-btn');
    },

    'Step 10: Click on uploaded ontology' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('mapping-config-overlay')
            .waitForElementVisible('div.mat-dialog-content input[data-placeholder="Search..."]')
            .setValue('div.mat-dialog-content input[data-placeholder="Search..."]', 'uhtc')
            .keys(browser.Keys.ENTER)
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//mat-list-option//h4[text()[contains(.,"uhtc")]]'})
            .click('xpath', '//mat-list-option//h4[text()[contains(.,"uhtc")]]')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
            .click('div.mat-dialog-actions button.mat-primary');
        browser.waitForElementNotPresent('mapping-config-overlay');
    },

    'Step 11: Add class to mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('edit-mapping-tab .editor-form')
            .waitForElementVisible('div.class-mappings button.add-class-mapping-button')
            .click('div.class-mappings button.add-class-mapping-button');
        browser.waitForElementVisible('class-mapping-overlay')
            .waitForElementVisible('class-mapping-overlay class-select')
            .click('form.mat-dialog-content class-select')
        browser
            .pause(2000) // Wait for REST call to finish
            .click('xpath', '//div//mat-option//span[contains(text(), "Material")]')
            .useXpath()
            .waitForElementVisible('//button/span[text() [contains(., "Submit")]]')
            .click('//button/span[text() [contains(., "Submit")]]')
            .useCss()
            .waitForElementNotPresent('class-mapping-overlay');
    },

    'Step 12: Verify Class Mapping has been selected' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .assert.valueEquals('edit-mapping-tab class-mapping-select input', 'UHTC Material');
    },

    'Step 13: Choose new IRI template' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('.iri-template .field-label button.mat-primary')
            .click('.iri-template .field-label button.mat-primary')
        browser
            .waitForElementVisible('iri-template-overlay')
            .waitForElementVisible('iri-template-overlay mat-form-field.template-ends-with mat-select')
            .click('form.mat-dialog-content mat-form-field.template-ends-with mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Material")]]');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
            .click('div.mat-dialog-actions button.mat-primary');
        browser.waitForElementNotPresent('iri-template-overlay');
    },

    'Step 14: Commit to Ontology' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('edit-mapping-tab .button-container .drop-down-button')
            .click('edit-mapping-tab .button-container .drop-down-button');
        browser
            .waitForElementVisible('div.mat-menu-content button.mat-menu-item.run-ontology')
            .click('div.mat-menu-content button.mat-menu-item.run-ontology');
        browser
            .click('xpath', '//div//mat-option//span[contains(text(), "ontology-mapping-updates")]');
        browser
            .click('xpath', '//mat-dialog-container//run-mapping-ontology-overlay//mat-radio-group/mat-radio-button[2]//span[contains(text(), "Commit as updates")]');
        browser
            .waitForElementVisible('xpath', '//button/span[text() [contains(., "Submit")]]')
            .click('xpath', '//button/span[text() [contains(., "Submit")]]');
        browser.waitForElementNotPresent('run-mapping-ontology-overlay');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 15: Verify user is back on main mapping page' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .assert.visible('mapping-select-page');
    },

    'Step 16: Navigate to Ontology Editor' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 17: Open Ontology ontology-mapping-updates' : function(browser) {
        browser.page.ontologyEditorPage().openOntology('ontology-mapping-updates');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('xpath', '//ontology-editor-page//app-editor-top-bar//button/span[text() [contains(., "Update with HEAD")]]')
            .click('xpath', '//ontology-editor-page//app-editor-top-bar//button/span[text() [contains(., "Update with HEAD")]]');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2)
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "Mapping data from https://mobi.com/records#")]]');
    },

    'Step 18: Verify ontology-mapping-updates commit table' : function(browser) {
        browser
            .click('css selector','ontology-editor-page app-changes-page commit-history-table commit-history-graph svg g g:nth-child(2) g:nth-child(2) g:nth-child(2) g:nth-child(1) g text:nth-child(1)')
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('css selector', 'commit-info-overlay');
        browser
            .useXpath()
            .waitForElementVisible('css selector', 'commit-info-overlay div.changes-container')
            .expect.elements('//commit-info-overlay//mat-accordion').count.to.equal(13);
    }
}