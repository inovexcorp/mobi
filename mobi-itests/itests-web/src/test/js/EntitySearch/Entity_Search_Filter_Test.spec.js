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

var recordTypeFilters = ['Ontology Record', 'Shapes Graph Record', 'Mapping Record', 'Workflow Record'];

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
        browser.useCss()
            .waitForElementVisible('app-entity-search-page info-message p')
            .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
    },

    'Step 7: Verify Filter Appearance': function (browser) {
        browser.page.entitySearchPage().verifyFilterItems('Record Type', recordTypeFilters);
        browser.page.entitySearchPage().assertNumFilterChips(0);
    },

    'Step 8: Verify No Search Filter Logic': function (browser) {
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record')
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', true);
        browser.page.entitySearchPage().assertNumFilterChips(1);
        browser.page.entitySearchPage().assertFilterChipExists('Ontology Record');
        browser.useCss()
            .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
        
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record')
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().assertNumFilterChips(0);
    },

    'Step 9: Apply Search Text & validate results': function (browser) {
        browser.page.entitySearchPage().applySearchText('shapes');
        browser.globals.wait_for_no_spinners(browser)
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);
        
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Shapes Graph Record')
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', true);
        browser.page.entitySearchPage().assertNumFilterChips(1);
        browser.page.entitySearchPage().assertFilterChipExists('Shapes Graph Record');
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 2);
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
    },

    'Step 10: Verify removing filter chip removes filter': function (browser) {
        browser.page.entitySearchPage().removeFilterChip('Shapes Graph Record');
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().assertNumFilterChips(0);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', false);
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);
        
        // Toggle filters on for the reset test next
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record')
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Shapes Graph Record')
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().assertNumFilterChips(2);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', true);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', true);
    },

    'Step 11: Verify reset button clears filter chips' : function(browser) {
        browser.page.entitySearchPage().resetFilters();
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().assertNumFilterChips(0);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', false);
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);

        // Toggle filter on for the navigation test
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Shapes Graph Record')
        browser.globals.wait_for_no_spinners(browser)
        browser.page.entitySearchPage().assertNumFilterChips(1);
    },

    'Step 12: Navigate Away and Back': function (browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.globals.wait_for_no_spinners(browser)
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 2);
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().assertNumFilterChips(1);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', true);
    },

    'Step 13: Logout and Log Back In': function (browser) {
        browser.useCss()
        browser.globals.logout(browser)
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 14: Verify Cleared State': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.useCss()
            .waitForElementVisible('app-entity-search-page info-message p')
            .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
        browser.useCss().assert.not.elementPresent('app-entity-search-page app-search-results-list mat-card-title');
        browser.page.entitySearchPage().assertNumFilterChips(0);
        browser.useCss().expect.element('input.mat-checkbox-input[aria-checked=true]').to.not.be.present;
    },

    'Step 15: Ensure Selected types are not still Being Stored': function (browser) {
        browser.page.entitySearchPage().applySearchText('shapes');
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
    },
}
