
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
var shapegraph001_title = 'shapes_mr_test';
var shapegraph001_branch001_title = 'MergeTestBranch001';
var shapegraph001_commit_message_001 = 'The first manual commit message';
var shapes_mr_test = path.resolve( __dirname + '/../../resources/rdf_files/shapes_mr_test.ttl');
var shapes_mr_test_change = path.resolve(__dirname + '/../../resources/rdf_files/shapes_mr_test_change_001.ttl');
var ontology001_title = 'ontMrTest001';

/**
 * Functional Test for Merge Request Module
 * 
 * Functions Tested:
 * - The Merge Request Record Select list includes
 *   all VersionedRdfRecord instances in the application, including Shapes Records
 */
module.exports = {
    '@tags': ['ontology-editor', 'shapes-editor', 'sanity', 'merge-requests'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword)
    },

    'Step 2: Navigate to the Shapes Graph Editor': function(browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 3: Create a new shapes graph': function(browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_mr_test);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 4: Create a new branch for shape graph': function(browser) {
        browser.page.shapesEditorPage().createBranch(shapegraph001_branch001_title);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 5: Upload Changes to shape graph': function(browser) {
        browser.page.shapesEditorPage().uploadChanges(shapes_mr_test_change);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 6: Verify Uploaded Changes': function(browser) {
        browser
            .assert.visible('mat-chip.uncommitted')
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3)
    },
    
    'Step 7: Verify Shapes Graph Change pages': function(browser) {
        browser.globals.dismiss_toast(browser);
        browser.page.shapesEditorPage().toggleChangesPage();
        browser
            .waitForElementVisible('app-changes-page div.changes-info button.mat-warn')
            .expect.elements('app-changes-page mat-expansion-panel').count.to.equal(3)
    },

    'Step 8: Commit changes to shape graph': function(browser) {
        browser.page.shapesEditorPage().commit(shapegraph001_commit_message_001);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 9: Verify commit was made successfully': function(browser) {
        browser
            .useCss()
            .assert.not.elementPresent('mat-chip.uncommitted');
        browser.assert.not.elementPresent('app-changes-page mat-expansion-panel');
        browser
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2)
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "' + shapegraph001_commit_message_001 + '")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
    },

    'Step 10: Ensure that user is on Ontology editor page' : function(browser) {
        browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 11: Create New Ontology' : function(browser) {
        browser.page.ontologyEditorPage().createOntology('ontMrTest001', 'myDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 12: Verify new ontology properties' : function(browser) {
        browser.page.ontologyEditorPage().verifyProjectTab('ontMrTest001', 'myDescription', 'OntMrTest001')
    },

    'Step 13: Edit IRI for ontology' : function(browser) {
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().editIri('mrTest002');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 14: Commit IRI change' : function(browser) {
        browser.page.ontologyEditorPage().commit('Changed IRI');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 15: Navigate to Merge Request Page' : function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 16: Navigate to New Merge Request page' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//merge-requests-page//button//span[text()[contains(.,'New Request')]]")
            .click("//merge-requests-page//button//span[text()[contains(.,'New Request')]]");
        browser.useCss()
            .waitForElementVisible('merge-requests-page create-request');
    },

    'Step 17: Validate a merge request': function(browser) {
        browser
            .waitForElementVisible('merge-requests-page create-request');
        for (var title in [shapegraph001_title, ontology001_title]) {
            browser.page.mergeRequestPage().assertMatCardTitle(title);
        }
    }
}
