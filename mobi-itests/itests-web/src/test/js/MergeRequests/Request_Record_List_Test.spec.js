
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

var shapegraph001_title = 'Ontology Shapes Graph MR Test';
var shapegraph001_branch001_title = 'MergeTestBranch001';
var shapegraph001_commit_message_001 = 'The first manual commit message';

var shapes_mr_test = process.cwd()+ '/src/test/resources/rdf_files/shapes_mr_test.ttl'
var shapes_mr_test_change = process.cwd()+ '/src/test/resources/rdf_files/shapes_mr_test_change_001.ttl'

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
 */
module.exports = {
    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Navigate to the Shapes Graph Editor': function(browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('shapes-graph-editor-page');
    },

    'Step 3: Create a new shapes graph': function(browser) {
        browser.page.shapesEditorPage().createShapesGraph(shapegraph001_title, shapes_mr_test);
    },

    'Step 4: Create a new branch for shape graph': function(browser) {
        browser.page.shapesEditorPage().createBranch(shapegraph001_branch001_title);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 5: Upload Changes to shape graph': function(browser) {
        browser.page.shapesEditorPage().upload(shapes_mr_test_change);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Verify Uploaded Changes': function(browser) {
        browser
            .assert.visible('mat-chip.uncommitted')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(3)
    },
    
    'Step 7: Verify ShapeGraph Change pages': function(browser) {
        browser
            .assert.not.elementPresent('div.toast-title');
        browser
            .click('editor-top-bar button.changes')
            .waitForElementVisible('shapes-graph-changes-page')
            .waitForElementVisible('xpath','//shapes-graph-changes-page//button//span[contains(text(), "Remove All Changes")]')
            .expect.elements('shapes-graph-changes-page mat-expansion-panel').count.to.equal(3)
    },

    'Step 8: Commit changes to shape graph': function(browser) {
        browser
            .useCss()
            .waitForElementVisible('shapes-graph-editor-page editor-top-bar button.commit')
            .click('shapes-graph-editor-page editor-top-bar button.commit')
            .sendKeys('commit-modal textarea', shapegraph001_commit_message_001)
            .click('commit-modal button.mat-primary');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Verify commit was made successfully': function(browser) {
        browser
            .useCss()
            .assert.not.elementPresent('mat-chip.uncommitted');
        browser.assert.not.elementPresent('shapes-graph-changes-page mat-expansion-panel');
        browser
            .assert.textContains('shapes-graph-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2)
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "' + shapegraph001_commit_message_001 + '")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
    },

    'Step 10: Ensure that user is on Ontology editor page': function(browser) {
        browser.globals.switchToPage(browser, 'ontology-editor', 'button.upload-button');
        browser.page.editorPage().isActive();
    },

    'Step 11: Open new Ontology Overlay': function(browser) {
        browser.page.editorPage().openNewOntologyOverlay();
    },

    'Step 12: Edit New Ontology Overlay': function(browser) {
        browser.page.editorPage().editNewOntologyOverlay('ontMrTest001', 'myDescription');
    },

    'Step 13: Submit New Ontology Overlay': function(browser) {
        browser.page.editorPage().submitNewOntologyOverlay();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().onProjectTab();
    },

    'Step 14: Verify new ontology properties': function(browser) {
        browser.page.editorPage().verifyProjectTab('ontMrTest001', 'myDescription', 'OntMrTest001')
    },

    'Step 15: Edit IRI for ontology': function(browser) {
        browser.page.editorPage().editIri('mrTest002');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 16: Open Commit overlay': function(browser) {
        browser.page.editorPage().openCommitOverlay();
    },

    'Step 17: Edit Commit message and Submit': function(browser) {
        browser.page.editorPage().editCommitOverlayAndSubmit('Changed IRI');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .waitForElementNotPresent('commit-overlay')
            .waitForElementNotPresent('commit-overlay h1.mat-dialog-title'); // intermittent issue caused by backend
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        browser.page.editorPage().isActive('ontology-tab');
    },

    'Step 18: Navigate to Merge Request Page': function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 19: Navigate to New Merge Request page': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//merge-requests-page//button//span[text()[contains(.,'New Request')]]")
            .click("//merge-requests-page//button//span[text()[contains(.,'New Request')]]");
        browser.useCss()
            .waitForElementVisible('merge-requests-page create-request');
    },

    'Step 20: Validate list of records': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//create-request');
        for (var title in [shapegraph001_title, ontology001_title]) {
            browser.page.mergeRequestPage().assertMatCardTitle(title);
        }
    }
}
