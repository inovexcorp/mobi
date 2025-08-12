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
var OntoSample = path.resolve(__dirname + '/../../resources/rdf_files/uhtc-ontology.ttl');
var skosOnt = path.resolve(__dirname + '/../../resources/rdf_files/skos.rdf');
var OntoCSV = path.resolve(__dirname + '/../../resources/ontology_csv\'s/uhtc-compounds.csv');

module.exports = {
    '@tags': ['mapping-tool', 'mapping-tool-changes', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
    },

    'Step 2: Create New Ontology': function(browser) {
        browser.page.ontologyEditorPage().createOntology('ontology-mapping-updates', 'myDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
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
        browser.globals.switchToPage(browser, 'mapper', 'mapping-select-page');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 8: Create new mapping' : function(browser) {
        browser.page.mapperPage().createMapping('UHTC material Mapping', 'A mapping of materials listed in the UHTC csv file to the UHTC ontology');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Attach csv to mapping' : function(browser) {
        browser.page.mapperPage().selectDataFile(OntoCSV);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 10: Click on uploaded ontology' : function(browser) {
        browser.page.mapperPage().selectOntology('uhtc');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 11: Add class to mapping' : function(browser) {
        browser.page.mapperPage().addClassMapping('Material');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 12: Verify Class Mapping has been selected' : function(browser) {
        browser.page.mapperPage()
            .assert.valueEquals('@classMappingSelectInput', 'UHTC Material');
    },

    'Step 13: Choose new IRI template' : function(browser) {
        browser.page.mapperPage().setIRITemplateLocalName('Material');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 14: Commit to Ontology' : function(browser) {
        browser.page.mapperPage().commitToOntology('ontology-mapping-updates', true);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 15: Verify user is back on main mapping page' : function(browser) {
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
        browser.page.ontologyEditorPage().verifyUncommittedChanges(false);
        browser.page.ontologyEditorPage().verifyChangePageCommitNum(0);
        browser.useCss()
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