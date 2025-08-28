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
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_Node_List.ttl');

module.exports = {
  '@tags': ['shapes-editor', 'shapes-editor-create-node-shapes'],

  'Step 1: Initial Setup': function (browser) {
    browser.globals.initial_steps(browser, adminUsername, adminPassword)
    browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
  },

  'Step 2: Upload a shapes graph': function (browser) {
    browser.page.shapesEditorPage().uploadShapesGraph(path.resolve(shapes_graph));
    browser.globals.wait_for_no_spinners(browser);
    browser.globals.dismiss_toast(browser);
  },

  'Step 3: Verify shapes graph presentation': function (browser) {
    browser
      .waitForElementVisible('selected-details')
      .waitForElementVisible('properties-block')
      .waitForElementVisible('div.yate')
      .page.editorPage()
      .assert.valueEquals('@editorRecordSelectInput', 'UHTC_Node_List')
      .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
    browser
      .page.shapesEditorPage()
      .expect.elements('@propertyValues').count.to.equal(3)
  },

  'Step 4: Navigate to Node Shapes tab': function (browser) {
    browser.page.shapesEditorPage().switchToNodeShapesTab();
  },

  'Step 5: Verify Node Shapes List': function (browser) {
    browser.page.shapesEditorPage().verifyNodeShapesTab();
    browser.page.shapesEditorPage().verifyNodeShapesNum(2);
    browser.page.shapesEditorPage()
      .verifyNodeShapeListItem({
        title: 'Test Node shape',
        iri: 'http://matonto.org/ontologies/uhtc#Material',
        target: 'Test Node shape',
        type: 'Implicit Target',
        imported: false
      });
    browser.page.shapesEditorPage()
      .verifyNodeShapeListItem({
        title: 'Test Element node shape',
        iri: 'http://schema.org/ElementShape',
        target: 'Element',
        type: 'Target Class',
        imported: false
      });
  },

  'Step 6: Create a Node Shape with Implicit Target': function (browser) {
    var shapeDetails = {
      title: 'Node Shape Implicit Target',
      description: 'Node Shape Implicit Target Description.',
      target: {
        type: 'Implicit',
      }
    };
    // Open form/Fill in form/Submit the form
    browser.page.shapesEditorPage().openCreateNodeShapeModal();
    browser.page.shapesEditorPage().createNodeShape(shapeDetails);
    browser.globals.dismiss_toast(browser);
    // Verify the list has updated
    browser.page.shapesEditorPage()
      .verifyNodeShapesNum(3)
      .verifyNodeShapeListItem({
        title: 'Node Shape Implicit Target',
        iri: 'http://matonto.org/ontologies/uhtc/shapes-graph#NodeShapeImplicitTarget',
        target: 'Node Shape Implicit Target',
        type: 'Implicit Target',
        imported: false
      });
  },

  'Step 7: Create a Node Shape with a SHACL Target': function (browser) {
    var shapeDetails = {
      title: 'Specific Instance Shape',
      description: 'Specific Instance Shape Description',
      target: {
        type: 'Specific Instance',
        value: 'urn:newTargetIri'
      }
    };
    browser.page.shapesEditorPage().openCreateNodeShapeModal();
    browser.page.shapesEditorPage().createNodeShape(shapeDetails);
    browser.globals.dismiss_toast(browser);
    // Verify the list has updated
    browser.page.shapesEditorPage().verifyNodeShapesNum(4);
    // Verify the new item exists in the list using the page object command
    browser.page.shapesEditorPage().verifyNodeShapeListItem({
      title: 'Specific Instance Shape',
      iri: 'http://matonto.org/ontologies/uhtc/shapes-graph#SpecificInstanceShape',
      target: 'New Target Iri',
      type: 'Target Node',
      imported: false
    });
  },
}