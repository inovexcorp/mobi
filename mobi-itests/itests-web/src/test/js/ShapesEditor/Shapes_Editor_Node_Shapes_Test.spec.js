/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
var ontology = path.resolve(__dirname + '/../../resources/rdf_files/uhtc-ontology.ttl');

module.exports = {
    '@tags': ['sanity', 'shapes-editor', 'shapes-editor-node-shapes'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload source ontology': function(browser) {
        browser.page.ontologyEditorPage().uploadOntology(ontology);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 3: Upload a shapes graph': function(browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.page.shapesEditorPage().uploadShapesGraph(path.resolve(shapes_graph));
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 4: Verify shapes graph presentation': function(browser) {
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

    'Step 5: Navigate to Node Shapes tab': function(browser) {
        browser.page.shapesEditorPage().switchToNodeShapesTab();
    },

    'Step 6: Verify Node Shapes List': function(browser) {
        browser.page.shapesEditorPage().verifyNodeShapesTab();
        browser.page.shapesEditorPage().verifyNodeShapesNum(2);
        browser.page.shapesEditorPage()
            .verifyNodeShapeListItem({
                title: 'Test Node shape',
                iri: 'http://matonto.org/ontologies/uhtc#Material',
                target: 'UHTC Material',
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

    'Step 7: Verify search functionality': function(browser) {
        browser.page.shapesEditorPage().searchNodeShapes('Element');
        browser.page.shapesEditorPage().verifyNodeShapesNum(1);
        browser.page.shapesEditorPage()
            .verifyNodeShapeListItem({
                title: 'Test Element node shape',
                iri: 'http://schema.org/ElementShape',
                target: 'Element',
                type: 'Target Class',
                imported: false
            });
    },

    'Step 8: Verify selecting node shape': function(browser) {
        browser.page.shapesEditorPage()
            .selectNodeShape('Test Element node shape');
        // Validate Node Shape metadata
        browser.useXpath()
            .assert.elementPresent('//value-display//div//span[text()[contains(.,"Test Element node shape")]]//ancestor::property-values//p[text()[contains(.,"Title")]]');
        // Validate number of property shapes
        browser.page.shapesEditorPage().verifyPropertyShapesNum(2);
        // Validate path and constraints on first property shape
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(1, 'Symbol', 2);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(2, 'Element Name', 2);
    },

    'Step 9: Verify Target section details for selected Node Shape': function(browser) {
        browser.page.shapesEditorPage()
            .verifyTargetSectionForNodeShape('Types of Instance', 'Select a Type', 'http://matonto.org/ontologies/uhtc#Element', true);
    },

    'Step 10: Remove a Property Shape': function(browser) {
        browser.page.shapesEditorPage()
            .removePropertyShape(1);
        browser.page.shapesEditorPage().verifyPropertyShapesNum(1);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(1, 'Element Name', 2);
    },

    'Step 11: Verify Property Shape Removal': function(browser) {
        browser.page.shapesEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().verifyUncommittedChanges(true);
        browser.page.shapesEditorPage().verifyChangePageCommitNum(2);
    },

    'Step 12: Commit changes': function(browser) {
        // > Commit Changes
        browser.page.shapesEditorPage().commit('Property Shape Removal');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        // > Verify No Changes to commit
        browser.page.shapesEditorPage().verifyUncommittedChanges(false);
        browser.page.shapesEditorPage().verifyChangePageCommitNum(0);
        // > Toggle Back
        browser.page.shapesEditorPage().toggleChangesPage(false);
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 13: Open Add Property Shape Modal and verify appearance': function(browser) {
        browser.page.shapesEditorPage()
            .selectNodeShape('Test Element node shape');
        browser.page.shapesEditorPage().openAddPropertyShapeModal();
    },

    'Step 14: Verify untouched Add Property Shape Modal': function(browser) {
        browser.page.shapesEditorPage().verifyPathConfiguration(1);
        browser.page.shapesEditorPage().useCss()
            .assert.attributeEquals('@constraintSelect', 'aria-disabled', 'true')
            .assert.attributeEquals('@addPropertyShapeModalSubmit', 'disabled', 'true');
    },

    'Step 15: Add an object property to the path': function(browser) {
        browser.page.shapesEditorPage().clickPathButton('Target');
        browser.page.shapesEditorPage().submitAddPathNodeModal('Crystal Structure', true);
    },

    'Step 16: Verify state of Add Property Shape Modal': function(browser) {
        browser.page.shapesEditorPage().verifyPathConfiguration(2);
        browser.page.shapesEditorPage().useCss()
            .assert.attributeEquals('@constraintSelect', 'aria-disabled', 'false')
            .assert.attributeEquals('@addPropertyShapeModalSubmit', 'disabled', 'true');
    },

    'Step 17: Add a datatype property to the path and verify state': function(browser) {
        browser.page.shapesEditorPage().clickPathButton('Crystal Structure');
        browser.page.shapesEditorPage().submitAddPathNodeModal('Crystal Structure Name', false);
    },

    'Step 18: Verify state of Add Property Shape Modal': function(browser) {
        browser.page.shapesEditorPage().verifyPathConfiguration(3);
        browser.page.shapesEditorPage().useCss()
            .assert.attributeEquals('@constraintSelect', 'aria-disabled', 'false')
            .assert.attributeEquals('@addPropertyShapeModalSubmit', 'disabled', 'true');
    },

    'Step 19: Select a constraint and verify state': function(browser) {
        browser.page.shapesEditorPage().toggleConstraint('Datatype');
        browser.useCss()
            .waitForElementVisible('mat-select[ng-reflect-name="datatype"]');
    },

    'Step 20: Select another constraint and verify state': function(browser) {
        browser.page.shapesEditorPage().toggleConstraint('Count Range');
        browser.useCss()
            .waitForElementVisible('mat-select[ng-reflect-name="datatype"]')
            .waitForElementVisible('input[type="number"][name="minCount"]')
            .waitForElementVisible('input[type="number"][name="maxCount"]');
    },

    'Step 21: Remove a constraint and verify state': function(browser) {
        browser.page.shapesEditorPage().toggleConstraint('Datatype');
        browser.useCss()
            .waitForElementNotPresent('mat-select[ng-reflect-name="datatype"]')
            .waitForElementVisible('input[type="number"][name="minCount"]')
            .waitForElementVisible('input[type="number"][name="maxCount"]');
    },

    'Step 22: Set constraint values, enter name, and submit modal': function(browser) {
        browser.setValue('input[type="number"][name="minCount"]', '1');
        browser.setValue('input[type="number"][name="maxCount"]', '1');
        browser.page.shapesEditorPage()
            .waitForElementVisible('@propertyShapeNameInput')
            .setValue('@propertyShapeNameInput', 'Test Property Shape');
        browser.page.shapesEditorPage().submitAddPropertyShapeModal();
    },

    'Step 23: Verify Property Shape list after adding new shape': function(browser) {
        browser.page.shapesEditorPage().verifyPropertyShapesNum(2);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(1, 'Element Name', 2);
        // These two verify it's the same property shape
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay('Test Property Shape', '^( Crystal Structure ) / Crystal Structure Name', 2);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(2, '^( Crystal Structure ) / Crystal Structure Name', 2);
    },

    'Step 24: Verify in progress changes': function(browser) {
        browser.page.shapesEditorPage().verifyUncommittedChanges(true);
        browser.page.shapesEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('app-changes-page div.changes-info button.mat-warn')
            // For some reason Nightwatch really wanted to see the selector as XPath...
            .expect.elements({
              selector: 'app-changes-page mat-expansion-panel',
              locateStrategy: 'css selector'
            }).count.to.equal(5);
    },

    'Step 24: Confirm new property shape is still in list after navigating back': function(browser) {
        browser.page.shapesEditorPage().toggleChangesPage(false);
        browser.page.shapesEditorPage().verifyPropertyShapesNum(2);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(1, 'Element Name', 2);
        // These two verify it's the same property shape
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay('Test Property Shape', '^( Crystal Structure ) / Crystal Structure Name', 2);
        browser.page.shapesEditorPage().verifyPropertyShapeDisplay(2, '^( Crystal Structure ) / Crystal Structure Name', 2);
    },

    'Step 25: Commit changes': function(browser) {
        // > Commit Changes
        browser.page.shapesEditorPage().commit('New Property Shape');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        // > Verify No Changes to commit
        browser.page.shapesEditorPage().toggleChangesPage();
        browser.page.shapesEditorPage().verifyUncommittedChanges(false);
        browser.page.shapesEditorPage().verifyChangePageCommitNum(0);
        // > Toggle Back
        browser.page.shapesEditorPage().toggleChangesPage(false);
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 26: Edit Target': function(browser) {
        browser.page.shapesEditorPage()
            .selectNodeShape('Test Element node shape')
            .editShaclTarget('Specific Instance', 'urn:newTargetIri')
            .toggleChangesPage();
        browser.page.shapesEditorPage().verifyChangePageCommitNum(1);
    }
}
