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
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/pizza.owl');
// shapes graph
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes.ttl');
var shapes_graph_title = 'UHTC_shapes';
var shapes_graph_update = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes_update.ttl');

module.exports = {
  '@tags': ['sanity', 'entity-search'],

  'Step 1: Initial Setup': function (browser) {
    browser.globals.initial_steps(browser, adminUsername, adminPassword)
  },

  'Step 2: Upload Ontologies': function (browser) {
    [Onto1].forEach(function (file) {
      browser.page.ontologyEditorPage().uploadOntology(file);
      browser.globals.wait_for_no_spinners(browser);
      browser.globals.dismiss_toast(browser);
    });
  },

  'Step 3: Switch to entity search page': function (browser) {
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page')
      .expect.element('app-entity-search-page app-search-results-list div.entity-results-list div info-message p').text.to.contain('No search has been performed');
    browser.waitForElementVisible('app-entity-search-page')
      .expect.element('app-entity-search-page app-search-results-list div.list-filters app-entity-search-filters app-list-filters div info-message p').text.to.contain('No Keywords available');
  },

  'Step 4: Search entity page Empty': function (browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('does-not-exist-record');
    browser.waitForElementVisible('app-entity-search-page app-search-results-list info-message')
      .expect.element('app-entity-search-page app-search-results-list div.entity-results-list div info-message p').text.to.contain('No entities found containing this search text');
  },

  'Step 5: Search entity results': function (browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('pizza');
    browser.expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.expect.element('app-entity-search-page app-search-results-list  open-record-button button').to.be.present;
    browser.page.entitySearchPage().verifyRecordListView();
  },

  'Step 6:Search entity results': function (browser) {
    browser.page.entitySearchPage().useCss()
      .click('@paginationNext');
    browser.globals.wait_for_no_spinners(browser);
    browser.expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(9);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', 'true')
      .assert.attributeEquals('@paginationPrevious', 'disabled', null);
  },

  'Step 7: Validate filter resets pagination': function (browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('pizza');
    browser.expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.useCss().page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', 'true');
  },

  'Step 8: Verify Matching Annotations': function (browser) {
    // Step to ensure we are on the entity search page before testing
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('pizza');

    // Wait for the annotations to be visible
    browser.waitForElementVisible('app-entity-search-page app-search-results-list mat-card mat-card-title');
    browser.expect.elements('app-entity-search-page app-search-results-list mat-card mat-card-title').count.to.equal(10);
    // Verify that the correct number of matching annotations is displayed for the selected entity
    var expectedAnnotationsCount = 1;
    browser.expect.elements('app-entity-search-page app-search-results-list app-search-result-item:nth-child(1) mat-card .annotation-section .annotation-list .annotation-item').count.to.equal(expectedAnnotationsCount);
    browser.expect.element('app-entity-search-page app-search-results-list app-search-result-item:nth-child(1) mat-card .annotation-section:nth-of-type(1) .mb-1 div').text.to.contain('1 Matching Annotation(s)');
    // Verify that each annotation is displayed correctly for the selected entity
    browser.expect.element('app-entity-search-page app-search-results-list app-search-result-item:nth-child(1) mat-card .annotation-section .annotation-list .annotation-item:nth-of-type(1) .prop-name').to.be.present;
    browser.expect.element('app-entity-search-page app-search-results-list app-search-result-item:nth-child(1) mat-card .annotation-section .annotation-list .annotation-item:nth-of-type(1) dd').to.be.present;
  },

  'Step 9: Open entity' : function(browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('pizza');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.entitySearchPage().openRecordItem('BaseDaPizza');
    browser.globals.wait_for_no_spinners(browser);
    browser.assert.not.elementPresent('app-entity-search-page app-search-results-list  open-record-button button');
    browser.waitForElementVisible('selected-details .entity-name')
      .assert.textContains('selected-details .entity-name', 'BaseDaPizza');
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page app-search-results-list');
  },

  'Step 10: View a record' : function(browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('pizza');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.entitySearchPage().viewRecord('BaseDaPizza', 'pizza');
    browser.globals.wait_for_no_spinners(browser);
    browser.assert.not.elementPresent('app-entity-search-page app-search-results-list  open-record-button button');
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page app-search-results-list');
  },

  'Step 11: Switch to SHACL shapes page': function(browser) {
    browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
  },

  'Step 12: Create a new shapes graph': function(browser) {
    browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph)
    browser.globals.wait_for_no_spinners(browser)
  },

  'Step 13: Verify shapes graph presentation': function(browser) {
    browser
      .waitForElementVisible('shapes-graph-details')
      .waitForElementVisible('shapes-graph-properties-block')
      .waitForElementVisible('div.yate')
      .page.editorPage()
      .assert.valueEquals('@editorRecordSelectInput', shapes_graph_title)
      .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
    browser
      .page.shapesEditorPage()
      .expect.elements('@propertyValues').count.to.equal(3)
  },

  'Step 14: Create a new branch': function(browser) {
    browser.page.shapesEditorPage().createBranch('Entity:UHTC Test Branch');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 15: Verify switching of branches': function(browser) {
    browser
      .waitForElementVisible('shapes-graph-details')
      .waitForElementVisible('shapes-graph-properties-block')
      .waitForElementVisible('div.yate')
      .page.editorPage()
      .assert.valueEquals('@editorRecordSelectInput', shapes_graph_title)
      .assert.valueEquals('@editorBranchSelectInput', 'Entity:UHTC Test Branch');
  },

  'Step `16`: Perform a new search': function (browser) {
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page')
    .page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('materials')
    .expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(1)
  },

  'Step 17: Open SHACL entity' : function(browser) {
    browser.globals.wait_for_no_spinners(browser);
    browser.page.entitySearchPage().openRecordItem('UHTC Shapes Graph');
    browser.globals.wait_for_no_spinners(browser);
    browser.assert.not.elementPresent('app-entity-search-page app-search-results-list  open-record-button button');
    browser.waitForElementVisible('shapes-graph-details .entity-name')
      .assert.textContains('shapes-graph-details .entity-name', 'UHTC Shapes Graph');
    browser.page.editorPage().assert.valueEquals('@editorBranchSelectInput', 'MASTER');
  },

  'Step 18: Upload Changes': function(browser) {
    browser.page.shapesEditorPage().createBranch('Entity:UHTC Test Branch-2');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.shapesEditorPage().uploadChanges(shapes_graph_update);
    browser.globals.wait_for_no_spinners(browser)
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.page.entitySearchPage().openRecordItem('UHTC Shapes Graph');
    browser.globals.wait_for_no_spinners(browser);
    browser.assert.not.elementPresent('app-entity-search-page app-search-results-list open-record-button button');
    browser.waitForElementVisible('shapes-graph-details .entity-name')
      .assert.textContains('shapes-graph-details .entity-name', 'UHTC Shapes Graph');
    browser.page.editorPage().assert.valueEquals('@editorBranchSelectInput', 'Entity:UHTC Test Branch-2');
  },
  'Step 19: Navigate to Workflows page' : function(browser) {
    browser.globals.switchToPage(browser, 'workflows', 'app-workflow-records');
  },
  'Step 20: Create Workflows': function(browser) {
    browser.page.workflowsPage().createWorkflow('Entity:Workflow')
      .returnToLanding();
    browser.globals.wait_for_no_spinners(browser);
  },
  'Step 21: Perform a new search': function (browser) {
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.waitForElementVisible('app-entity-search-page')
      .page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('action');
    browser.useCss()
      .waitForElementVisible('app-entity-search-page app-search-results-list mat-card-title')
  },
  'Step 22: Open Workflow entity' : function(browser) {
    browser.globals.wait_for_no_spinners(browser);
    browser.page.entitySearchPage().openRecordItem('Action');
    browser.globals.wait_for_no_spinners(browser);
    browser.assert.not.elementPresent('app-entity-search-page app-search-results-list open-record-button button');
    browser.waitForElementVisible('app-workflow-record .workflow-record-header .record-title')
      .assert.textContains('app-workflow-record .workflow-record-header .record-title', 'Entity:Workflow');
  }
}
