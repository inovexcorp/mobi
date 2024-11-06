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
var path = require('path');
var adminUsername = 'admin'
var adminPassword = 'admin'
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/shacl.ttl');
// shapes graph
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes.ttl');

var filterItem = '//app-entity-search-page//app-entity-search-filters//mat-expansion-panel//div//label//span';
var checkboxStatusItem = '//app-entity-search-page//app-entity-search-filters//mat-expansion-panel//div//label//input[@aria-checked="true"]/ancestor-or-self::mat-checkbox//label//span';

var chipList = '//app-entity-search-page//app-filters-selected-list//mat-chip-list';
var chipItem = chipList + '//span[text()[contains(.,"Shapes Graph Record")]]';

module.exports = {
    '@tags': ['sanity', 'entity-search', 'entity-search-filters'],

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

    'Step 3: Switch to SHACL shapes page': function (browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
    },

    'Step 4: Create a new shapes graph': function (browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph)
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 5: Verify shapes graph presentation': function (browser) {
        browser.page.shapesEditorPage().verifyShapesEditorPage('UHTC_shapes', "MASTER");
        browser
            .page.shapesEditorPage()
            .assert.elementsCount('@propertyValues', 3)
    },

    'Step 6: Switch to Entity Shapes page': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser
            .waitForElementVisible('app-entity-search-page info-message p')
            .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
    },

    'Step 7: Verify Filter Appearance': function (browser) {
        browser
            .waitForElementVisible('app-entity-search-page app-entity-search-filters app-list-filters')
            .useXpath()
            .waitForElementVisible(filterItem + '[text()[contains(.,"Ontology Record")]]')
    },

    'Step 8: Verify No Search Filter Logic': function (browser) {
        browser.click(filterItem + '[text()[contains(.,"Ontology Record")]]')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
        browser
            .useXpath()
            .click(filterItem + '[text()[contains(.,"Ontology Record")]]')
    },

    'Step 9: Apply Search Text & validate results': function (browser) {
        browser.page.entitySearchPage().applySearchText('shapes');
        browser.assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);
        browser
            .useXpath()
            .click(filterItem + '[text()[contains(.,"Shapes Graph Record")]]')
            .useCss()
        browser.assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 2);
        browser.expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
    },

    'Step 10: Verify selected filter chip list': function (browser) {
        browser
          .useXpath()
          .waitForElementVisible(chipList)
          .assert.elementsCount(chipItem, 1);
        browser
          .click(chipList + '//mat-icon')
        browser.globals.wait_for_no_spinners(browser)
        browser
          .useXpath()
          .assert.not.elementPresent(chipItem)
          .click(filterItem + '[text()[contains(.,"Shapes Graph Record")]]')
          .waitForElementVisible(chipList)
          .assert.elementsCount(chipItem, 1);
    },

    'Step 11: Navigate Away and Back': function (browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.globals.wait_for_no_spinners(browser)
        browser.assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 2);
        browser.expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser
            .useXpath()
            .assert.not.elementPresent(checkboxStatusItem + '[text()[contains(.,"Ontology Record")]]')
            .assert.visible(checkboxStatusItem + '[text()[contains(.,"Shapes Graph Record")]]')
    },

    'Step 12: Logout and Log Back In': function (browser) {
        browser.useCss()
        browser.globals.logout(browser)
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 13: Verify Cleared State': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser
            .waitForElementVisible('app-entity-search-page info-message p')
            .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
        browser.assert.not.elementPresent('app-entity-search-page app-search-results-list mat-card-title');
        browser
            .useXpath()
            .assert.not.elementPresent(checkboxStatusItem + '[text()[contains(.,"Ontology Record")]]')
            .assert.not.elementPresent(checkboxStatusItem + '[text()[contains(.,"Shapes Graph Record")]]')
            .assert.not.elementPresent(checkboxStatusItem + '[text()[contains(.,"Workflow Record")]]')
            .assert.not.elementPresent(checkboxStatusItem + '[text()[contains(.,"Mapping Record")]]')
    },

    'Step 14: Ensure Selected types are Not still Being Stored': function (browser) {
        browser.page.entitySearchPage().applySearchText('shapes');
        browser.assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title',10);
        browser.expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
    },
}
