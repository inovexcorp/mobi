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

var shapes_graph_title = 'Test Shapes Graph';
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes.ttl');

var error_message = 'A Record already exists with tracked IRI'

module.exports = {
    '@tags': ['shapes-editor', 'shapes-editor-iri-change'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
    },

    'Step 2: Upload a shapes graph': function(browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph)
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.dismiss_toast(browser);
    },

    'Step 3: Verify shapes graph presentation': function(browser) {
        browser.page.shapesEditorPage()
            .verifyShapesEditorPage('UHTC_shapes', 'MASTER')
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3)
    },

    'Step 4: Navigate to Node Shapes tab': function(browser) {
        browser.page.shapesEditorPage().switchToNodeShapesTab();
    },

    'Step 5: Verify Node Shapes List': function(browser) {
        browser.page.shapesEditorPage().verifyNodeShapesTab();
        browser.page.shapesEditorPage().verifyNodeShapesNum(1);
        browser.page.shapesEditorPage()
            .verifyNodeShapeListItem({
                title: 'UHTC Material shapes graph',
                iri: 'http://schema.org/MaterialShape',
                target: 'Material',
                type: 'Class',
                imported: false
            });
    },

    'Step 6: Verify selecting node shape': function(browser) {
        browser.page.shapesEditorPage()
            .selectNodeShape('UHTC Material shapes graph');
        // Validate Node Shape metadata
        browser.useXpath()
            .assert.elementPresent('//value-display//div//span[text()[contains(.,"UHTC Material shapes graph")]]//ancestor::property-values//p[text()[contains(.,"Title")]]');
        // Validate number of property shapes
        browser.page.shapesEditorPage().verifyPropertyShapesNum(3);
        // Validate path and constraints on first property shape
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(1, 'Chemical', 4);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(2, 'Density', 2);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(3, 'Crystal Structure', 2);
    },

     'Step 7: Edit the shape graph IRI to be valid': function(browser) {
        browser.page.shapesEditorPage().editIri('MaterialShape1', 'http://schema.org');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 8: Navigate to Node Shapes that was committed to': function(browser) {
        browser.page.shapesEditorPage().switchToNodeShapesTab();
        browser.page.shapesEditorPage().verifyNodeShapesTab();
        browser.page.shapesEditorPage().verifyNodeShapesNum(1);
        browser.page.shapesEditorPage()
            .verifyNodeShapeListItem({
                title: 'UHTC Material shapes graph',
                iri: 'http://schema.org/MaterialShape1',
                target: 'Material',
                type: 'Class',
                imported: false
            });
        browser.page.shapesEditorPage().selectNodeShape('UHTC Material shapes graph');
    },

    'Step 9: Confirm the shapes graph changes': function(browser) {
        browser.page.shapesEditorPage().verifyUncommittedChanges(true);
        browser.page.shapesEditorPage().verifyStaticIriValue('http://schema.org/', 'MaterialShape1');
    },

    'Step 10: Change the IRI to be valid & commit the change': function(browser) {
        browser.page.shapesEditorPage().editIri('shapes-graph-iri-test');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().commit('testing iri change');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.useXpath()
        browser.page.shapesEditorPage().verifyStaticIriValue('http://schema.org/', 'shapes-graph-iri-test');
        browser.page.shapesEditorPage().verifyUncommittedChanges(false);
    },

    'Step 11: Create a new shapes graph': function(browser) {
        browser.page.shapesEditorPage().createShapesGraph('Test Shapes Graph', 'Test Shapes Graph Description');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 12: Verify New shapes graph presentation': function(browser) {
        browser.page.shapesEditorPage()
            .verifyShapesEditorPage(shapes_graph_title, 'MASTER')
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(2)
    },

    'Step 13: Edit the shape graph IRI to be invalid': function(browser) {
        browser.page.shapesEditorPage().editIri('shapes-graph', 'http://matonto.org/ontologies/uhtc');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 14: Confirm the shapes graph changes': function(browser) {
        browser.page.shapesEditorPage().verifyUncommittedChanges(true);
        browser.page.shapesEditorPage()
            .verifyStaticIriValue('http://matonto.org/ontologies/uhtc/', 'shapes-graph');
    },

    'Step 15: Attempt to commit the IRI changes': function(browser) {
        browser.page.shapesEditorPage().commit('testing iri change', error_message);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 16: Change the IRI to be valid & commit the change': function(browser) {
        browser.page.shapesEditorPage().editIri('shapes-graph-iri-test');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().commit('testing iri change');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.useXpath()
        browser.page.shapesEditorPage()
            .verifyStaticIriValue('http://matonto.org/ontologies/uhtc/', 'shapes-graph-iri-test');
        browser.page.shapesEditorPage().verifyUncommittedChanges(false);
    }
}