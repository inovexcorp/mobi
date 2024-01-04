
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
var adminUsername = 'admin';
var adminPassword = 'admin';

var ontologyEditorPage = require('./zOntologyEditorPage').ontologyEditorPage;
var datasetPage = require('./zDatasetPage').datasetPage;
var mergeRequestPage = require('./zMergeRequestsPage').mergeRequestsPage;
var administrationPage = require('./zAdministrationPage').administrationPage;
var shapesEditorPage = require('./zShapesEditorPage').shapesEditorPage;

var shapegraph001_title = 'Ontology Shapes Graph MR Test';
var shapegraph001_branch001_title = 'MergeTestBranch001';
var shapegraph001_commit_message_001 = 'The first manual commit message';

var shapes_mr_test = process.cwd()+ '/src/test/resources/rdf_files/shapes_mr_test.ttl'
var shapes_mr_test_change = process.cwd()+ '/src/test/resources/rdf_files/shapes_mr_test_change_001.ttl'

var dataset001_title = 'DatasetMergeTest001';
var dataset001_desc = 'A dataset made for testing MergeRequest Page';

var ontology001_title = 'ontMrTest001';
var ontology001_title_changed = '';
var ontology001_desc = '';

var iconMappings = {
    'http://mobi.com/ontologies/ontology-editor#OntologyRecord': 'fa-sitemap',
    'http://mobi.com/ontologies/dataset#DatasetRecord': 'fa-database',
    'http://mobi.com/ontologies/delimited#MappingRecord': 'fa-map',
    'http://mobi.com/ontologies/shapes-graph-editor#ShapesGraphRecord': 'mat rule'
};

/**
 * Functional Test for Merge Request Module
 * 
 * Functions Tested:
 * - The Merge Request Record Select list includes
 *   all VersionedRdfRecord instances in the application, including Shapes Records
 * - The branches, commits, and differences displays in the Merge Requests are 
 *   pulled the same for other records as Ontology Records
 */
module.exports = {
    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup' : function(browser) {
        browser.url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home');
        administrationPage.login(browser, adminUsername, adminPassword);
    },

    'Step 2: Navigate to the Shapes Graph Editor': function(browser) {
        shapesEditorPage.goToPage(browser);
    },

    'Step 3: Create a new shapes graph': function (browser) {
        shapesEditorPage.createShapesGraph(browser, shapegraph001_title, shapes_mr_test);
    },

    'Step 4: Create a new branch for shape graph': function (browser) {
        shapesEditorPage.createBranch(browser, shapegraph001_branch001_title);
    },

    'Step 5: Upload Changes to shape graph': function (browser) {
        shapesEditorPage.uploadFile(browser, shapes_mr_test_change);
        browser.pause(3200);  // wait for div.toast-message[success] to be done, prevents element click intercepted 
    },

    'Step 6: Verify Uploaded Changes': function (browser) {
        browser
            .assert.visible('mat-chip.uncommitted')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(3)
    },
    
    'Step 7: Verify ShapeGraph Change pages': function (browser) {
        browser
            .assert.not.elementPresent('div.toast-title')
            .click('editor-top-bar button.changes')
            .waitForElementVisible('shapes-graph-changes-page')
            .waitForElementVisible('xpath','//shapes-graph-changes-page//button//span[contains(text(), "Remove All Changes")]')
            .expect.elements('shapes-graph-changes-page mat-expansion-panel').count.to.equal(3)
    },

    'Step 8: Commit changes to shape graph': function (browser) {
        browser
            .useCss()
            .waitForElementVisible('shapes-graph-editor-page editor-top-bar button.commit')
            .click('shapes-graph-editor-page editor-top-bar button.commit')
            .sendKeys('commit-modal textarea', shapegraph001_commit_message_001)
            .click('commit-modal button.mat-primary');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Verify commit was made successfully': function (browser) {
        browser
            .useCss()
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('shapes-graph-changes-page mat-expansion-panel')
            .assert.textContains('shapes-graph-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2)
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "' + shapegraph001_commit_message_001 + '")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
    },

    'Step 7: Navigate to datasets page' : function (browser) {
        datasetPage.goToPage(browser);
    },

    'Step 8: Create a new Dataset' : function (browser) {
        datasetPage.createDataset(browser, dataset001_title, dataset001_desc);
    },

    'Step 9: Ensure that user is on Ontology editor page' : function(browser) {
        browser.click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]');
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('button.upload-button');
        ontologyEditorPage.isActive(browser);
    },

    'Step 10: Open new Ontology Overlay' : function(browser) {
        ontologyEditorPage.openNewOntologyOverlay(browser);
    },

    'Step 11: Edit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.editNewOntologyOverlay(browser, 'ontMrTest001', 'myDescription');
    },

    'Step 12: Submit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.submitNewOntologyOverlay(browser);
    },

    'Step 13: Verify new ontology properties' : function(browser) {
        ontologyEditorPage.verifyProjectTab(browser, 'ontMrTest001', 'myDescription', 'OntMrTest001')
    },

    'Step 14: Edit IRI for ontology' : function(browser) { 
        ontologyEditorPage.editIri(browser, 'mrTest002');
    },

    'Step 15: Open Commit overlay' : function(browser) {
        ontologyEditorPage.openCommitOverlay(browser);
    },

    'Step 16: Edit Commit message and Submit' : function(browser) { 
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'Changed IRI');
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        ontologyEditorPage.isActive(browser, 'ontology-tab');
    },

    'Step 17: Navigate to Merge Request Page' : function (browser) {
        mergeRequestPage.goToPage(browser);
    },

    'Step 18: Navigate to New Merge Request page' : function (browser) {
        browser
            .useXpath()
            .waitForElementVisible("//merge-requests-page//button//span[text()[contains(.,'New Request')]]")
            .click("//merge-requests-page//button//span[text()[contains(.,'New Request')]]");
        browser.useCss()
            .waitForElementVisible('merge-requests-page create-request');
    },

    'Step 18: Validate a merge request': function(browser) {
        mergeRequestPage.assertMatCardTitles(browser, [shapegraph001_title, ontology001_title]);
    }
}
