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
var shapes_graph_title = 'UHTC_shapes';
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes.ttl');
var additional_shapes_graph_title = 'additional_shapes';
var additional_shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/additional_shapes.ttl');
var shapes_graph_update = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes_update.ttl');
var shapes_graph_conflict = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes_conflict.ttl');

module.exports = {
    '@tags': ['shapes-editor', 'sanity', 'shapes-editor-001'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page');
    },

    'Step 2: Create a new shapes graph': function(browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 3: Verify shapes graph presentation': function(browser) {
        browser
            .waitForElementVisible('app-shapes-project-tab selected-details')
            .waitForElementVisible('app-shapes-project-tab properties-block')
            .waitForElementVisible('app-shapes-project-tab properties-block .section-header a.fa-plus')
            .waitForElementVisible('div.yate')
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', shapes_graph_title)
            .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3);
    },

    'Step 4: Create a new branch': function(browser) {
        browser.page.shapesEditorPage().createBranch('UHTC Test Branch');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 5: Verify switching of branches': function(browser) {
        browser
            .waitForElementVisible('app-shapes-project-tab selected-details')
            .waitForElementVisible('app-shapes-project-tab properties-block')
            .waitForElementVisible('app-shapes-project-tab div.yate')
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', shapes_graph_title)
            .assert.valueEquals('@editorBranchSelectInput', 'UHTC Test Branch');
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3);
    },

    'Step 6: Upload Changes': function(browser) {
        browser.page.shapesEditorPage().uploadChanges(shapes_graph_update);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 7: Verify Uploaded Changes': function(browser) {
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(5);
        browser.page.shapesEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().verifyUncommittedChanges(true);
        browser.page.shapesEditorPage().verifyChangePageCommitNum(4);
    },

    'Step 8: Commit changes and verify commit was made successfully': function(browser) {
        browser.page.shapesEditorPage().commit('The first manual commit message');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.shapesEditorPage().verifyUncommittedChanges(false);
        browser.page.shapesEditorPage().verifyChangePageCommitNum(0);
        browser.useCss()
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2);
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "The first manual commit message")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]');
    },

    'Step 9: Upload merge conflict into master': function(browser) {
        browser.page.shapesEditorPage().switchBranch('MASTER');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().uploadChanges(shapes_graph_conflict);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.shapesEditorPage().commit('A conflict commit on master');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 10: Merge created branch into master': function(browser) {
        browser.page.shapesEditorPage().switchBranch('UHTC Test Branch');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage()
            .click('@mergeBranchesButton');
        browser
            .waitForElementVisible('app-merge-page branch-select input')
            .waitForElementVisible('app-merge-page button.mat-primary')
            .click('app-merge-page branch-select')
            .waitForElementVisible('xpath', '//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('xpath', '//div//mat-option//span[contains(text(), "MASTER")]')
            .assert.visible('commit-difference-tabset')
            .expect.elements('commit-difference-tabset div.mat-tab-label').count.to.equal(2);
        browser
            .click('app-merge-page button.mat-primary');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 11: Resolve conflicts and Verify successful merge': function(browser) {
        browser
            .waitForElementVisible('resolve-conflicts-block')
            .waitForElementVisible('resolve-conflicts-form p small')
            .click('resolve-conflicts-form p small');
        browser.globals.wait_for_no_spinners(browser);
        browser.expect.elements('resolve-conflicts-form div.conflict').count.to.equal(2);
        browser
            .click('xpath', '//resolve-conflicts-form//div[contains(@class,"conflict")]//div[@class="card"][1]')
            .click('resolve-conflicts-block div.btn-container button.mat-primary');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser
            .waitForElementVisible('selected-details')
            .waitForElementVisible('properties-block')
            .waitForElementVisible('div.yate')
            .useXpath()
            .assert.textContains('//property-values//div//p[contains(text(), "Title")]/../..//value-display', 'UHTC Shapes Graph with some changes');
    },

    'Step 12: Delete created branch and verify successful deletion': function(browser) {
        browser
            .useCss()
            .page.editorPage()
            .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
        browser.page.shapesEditorPage().deleteBranchOrTag('UHTC Test Branch');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 13: Add RDF#Comment Property and verify count': function(browser) {
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(5);
        browser
            .waitForElementVisible('app-shapes-project-tab properties-block')
            .waitForElementVisible('app-shapes-project-tab properties-block .section-header a.fa-plus')
            .click('app-shapes-project-tab properties-block .section-header a.fa-plus');
        browser
            .waitForElementVisible('property-overlay')
            .waitForElementVisible('h1.mat-dialog-title');
        browser
            .waitForElementVisible('property-overlay input[placeholder="Select a property..."]')
            .setValue('property-overlay input[placeholder="Select a property..."]', 'http://www.w3.org/2000/01/rdf-schema#comment')
            .sendKeys('property-overlay input[placeholder="Select a property..."]', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('property-overlay textarea[name="value"]')
            .setValue('property-overlay textarea[name="value"]', 'ValueComment')
            .sendKeys('property-overlay textarea[name="value"]', browser.Keys.ENTER);
        browser
            .waitForElementVisible('property-overlay button.mat-primary')
            .click('property-overlay button.mat-primary');
        browser
            .assert.not.elementPresent('property-overlay');
        
        browser.page.shapesEditorPage().commit('add rdf:comment');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(6);
    },

    'Step 14: Create tag and verify successful creation': function(browser) {
        browser.page.shapesEditorPage().createTag('UHTC Test Tag');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().assert.valueEquals('@editorBranchSelectInput', 'UHTC Test Tag');
    },

    'Step 15: Delete created tag and verify deletion': function(browser) {
      // TODO: Ideally this would be handled by the deleteBranchOrTag function
      browser.page.editorPage()
          .waitForElementVisible('@editorBranchSelectInput')
          .click('@editorBranchSelectIcon')
          .pause(1000);
      browser
          .useXpath()
          .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]')
          .click('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]');
      browser.globals.wait_for_no_spinners(browser);
      
      browser.page.shapesEditorPage().deleteBranchOrTag('UHTC Test Tag', false);
      browser.globals.wait_for_no_spinners(browser);
      browser.globals.dismiss_toast(browser);
    },

    'Step 16: Create and open a new record': function(browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(additional_shapes_graph);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 17: Verify both records are open': function(browser) {
        browser
            .page.editorPage()
            .click('@editorRecordSelectIcon');
        browser
            .useXpath()
            .assert.visible('//mat-optgroup//span[contains(text(), "Open")]/..//span[contains(text(), "' + shapes_graph_title + '")]')
            .assert.visible('//mat-optgroup//span[contains(text(), "Open")]/..//span[contains(text(), "' + additional_shapes_graph_title + '")]');
    },

    'Step 18: Delete the Records': function(browser) {
        browser.page.shapesEditorPage().deleteShapesGraph(additional_shapes_graph_title); // intermittent issue
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().deleteShapesGraph(shapes_graph_title);
        browser.globals.wait_for_no_spinners(browser);
    }
}
