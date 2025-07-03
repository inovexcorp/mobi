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
    '@tags': ['shapes-editor'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
    },

    'Step 2: Upload a shapes graph': function(browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph)
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 3: Verify shapes graph presentation': function(browser) {
        browser
            .waitForElementVisible('selected-details')
            .waitForElementVisible('properties-block')
            .waitForElementVisible('div.yate')
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'UHTC_shapes')
            .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3)
    },

    'Step 4: Create a new shapes graph': function(browser) {
        browser.page.shapesEditorPage().createShapesGraph('Test Shapes Graph', 'Test Shapes Graph Description');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 5: Verify New shapes graph presentation': function(browser) {
        browser
            .waitForElementVisible('selected-details')
            .waitForElementVisible('properties-block')
            .waitForElementVisible('div.yate')
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', shapes_graph_title)
            .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(2)
    },

    'Step 6: Edit the shape graph IRI to be invalid': function(browser) {
        browser.useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-iri")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .waitForElementVisible('//edit-iri-overlay')
            .waitForElementVisible("//edit-iri-overlay//h1[text() [contains(., 'Edit IRI')]]")
            .useCss()
            .pause(1000) // To avoid clashes with autofocusing
            .setValue('edit-iri-overlay input[name=iriBegin]', 'http://matonto.org/ontologies/uhtc')
            .setValue('edit-iri-overlay input[name=iriEnd]', 'shapes-graph')
            .useXpath()
            .click("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
            .waitForElementNotPresent('//edit-iri-overlay')
            .assert.not.elementPresent("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Confirm the shapes graph changes': function(browser) {
        browser.useXpath()
            .expect.element('//app-editor-top-bar//mat-chip-list//mat-chip[text() [contains(., "Uncommitted Changes")]]').to.be.visible;
        browser.expect.element('//selected-details//static-iri//strong//span[text() [contains(., "http://matonto.org/ontologies/uhtc/")]]').to.be.visible;
        browser.expect.element('//selected-details//static-iri//strong//span[text() [contains(., "shapes-graph")]]').to.be.visible;
    },

    'Step 8: Attempt to commit the IRI changes': function(browser) {
        browser
            .useCss()
            .click('app-editor-top-bar button.commit')
            .waitForElementVisible('app-commit-modal')
            .waitForElementVisible('app-commit-modal textarea')
            .waitForElementVisible('app-commit-modal div.mat-dialog-actions button.mat-primary')
            .sendKeys('app-commit-modal textarea', 'testing iri change')
            .click('app-commit-modal div.mat-dialog-actions button.mat-primary')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .expect.element('//app-commit-modal//error-display//p[text() [contains(., "' + error_message + '")]]').to.be.visible;
        browser.click('//app-commit-modal//button/span[text() [contains(., "Cancel")]]')
    },

    'Step 9: Change the IRI to be valid & commit the change': function(browser) {
        browser
            .waitForElementVisible('//static-iri//div[contains(@class, "static-iri")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .waitForElementVisible('//edit-iri-overlay')
            .waitForElementVisible("//edit-iri-overlay//h1[text() [contains(., 'Edit IRI')]]")
            .useCss()
            .pause(1000) // To avoid clashes with autofocusing
            .setValue('edit-iri-overlay input[name=iriEnd]', 'shapes-graph-iri-test')
            .useXpath()
            .click("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
            .waitForElementNotPresent('//edit-iri-overlay')
            .assert.not.elementPresent("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
        browser.globals.wait_for_no_spinners(browser);
        browser.page.shapesEditorPage().commit('testing iri change');
        browser.globals.wait_for_no_spinners(browser);
        browser.useXpath()
        browser.expect.element('//selected-details//static-iri//strong//span[text() [contains(., "http://matonto.org/ontologies/uhtc/")]]').to.be.visible;
        browser.expect.element('//selected-details//static-iri//strong//span[text() [contains(., "shapes-graph-iri-test")]]').to.be.visible;
        browser.assert.not.elementPresent('//app-editor-top-bar//mat-chip-list//mat-chip[text() [contains(., "Uncommitted Changes")]]');
    },
}
