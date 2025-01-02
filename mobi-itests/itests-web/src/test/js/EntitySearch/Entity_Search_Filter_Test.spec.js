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
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/shacl.ttl');
// shapes graph
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes.ttl');

var recordTypeFilters = ['Ontology Record', 'Shapes Graph Record', 'Mapping Record', 'Workflow Record'];

module.exports = {
    '@tags': ['sanity', 'entity-search', 'entity-search-filters'],

    'Step 1: Initial Setup': function (browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
    },

    'Step 2: Upload Ontologies': function (browser) {
        [Onto1].forEach(function (file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 3: Switch to catalog and add keyword to pizza ontology': function (browser) {
        browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.catalogPage().waitForElementPresent('@filterSelector')

        browser.page.catalogPage().openRecordItem('shacl');
        browser.page.catalogPage().changeRecordFields('shacl', {'description': 'new description', 'keywords': ['shacl1', 'shacl2']});
        browser.page.catalogPage().leaveCatalogRecord(browser);
      },

    'Step 4: Switch to SHACL shapes page': function (browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page');
    },

    'Step 5: Create a new shapes graph': function (browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Verify shapes graph presentation': function (browser) {
        browser.page.shapesEditorPage().verifyShapesEditorPage('UHTC_shapes', "MASTER");
        browser
            .page.shapesEditorPage()
            .assert.elementsCount('@propertyValues', 3);
    },

    'Step 7: Switch to Entity Shapes page': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.useCss()
            .waitForElementVisible('app-entity-search-page info-message p')
            .expect.element('app-entity-search-page app-search-results-list div.entity-results-list div info-message p').text.to.contain('No search has been performed');
    },

    'Step 8: Verify Sort Dropdown Appearance': function (browser) {
        browser.page.entitySearchPage().verifyEntitySearchPageSort('Entity Name (asc)');
    },

    'Step 9: Verify Filter Appearance': function (browser) {
        browser.page.entitySearchPage().verifyFilterItems('Record Type', recordTypeFilters);
        browser.page.entitySearchPage().verifyFilterItems('Keywords', ['shacl1', 'shacl2']);
        browser.page.entitySearchPage().assertNumFilterChips(0);
    },

    'Step 10: Verify Reset Button for Filters': function (browser) {
        // Toggle Filters ON
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().toggleFilterItem('Keywords', 'shacl1');
        browser.globals.wait_for_no_spinners(browser);
        // Validate Filters
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', true);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', true);
        browser.page.entitySearchPage().assertNumFilterChips(2);
        // Check Filters List
        browser.page.entitySearchPage().assertFilterChipExists('Ontology Record');
        browser.page.entitySearchPage().assertFilterChipExists('shacl1');
        // RESET button
        browser.page.entitySearchPage().resetFilter('Record Type');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().resetFilter('Keywords');
        browser.globals.wait_for_no_spinners(browser);
        // Validate that filters was cleared
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', false);
        browser.page.entitySearchPage().assertNumFilterChips(0);
    },

    'Step 11: Verify No Search Filter Logic': function (browser) {
        // Toggle Filters ON
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().toggleFilterItem('Keywords', 'shacl1');
        browser.globals.wait_for_no_spinners(browser);
        // Validate Filters
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', true);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', true);
        browser.page.entitySearchPage().assertNumFilterChips(2);
        // Check Filters List
        browser.page.entitySearchPage().assertFilterChipExists('Ontology Record');
        browser.page.entitySearchPage().assertFilterChipExists('shacl1');
        browser.useCss()
            .expect.element('app-entity-search-page app-search-results-list div.entity-results-list div info-message p').text.to.contain('No search has been performed');
        // Toggle Filters OFF
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().toggleFilterItem('Keywords', 'shacl1');
        browser.globals.wait_for_no_spinners(browser);
        // Validate Filters
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', false);
        browser.page.entitySearchPage().assertNumFilterChips(0);
    },

    'Step 12: Apply Search Text & validate results': function (browser) {
        // Search Page without filters
        browser.page.entitySearchPage().applySearchText('shapes');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);
        // Apply Filter - Record Type
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Shapes Graph Record')
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', true);
        browser.page.entitySearchPage().assertNumFilterChips(1);
        browser.page.entitySearchPage().assertFilterChipExists('Shapes Graph Record');
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 2);
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
        // Apply Filter - Keyword
        browser.page.entitySearchPage().toggleFilterItem('Keywords', 'shacl1');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', true);
        browser.page.entitySearchPage().assertNumFilterChips(2);
        browser.page.entitySearchPage().assertFilterChipExists('shacl1');
        browser.useCss().expect.element('app-entity-search-page app-search-results-list mat-card-title').not.to.be.present; // There are no records that match both filters
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').not.to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
    },

    'Step 13: Verify removing filter chip removes filter': function (browser) {
        browser.page.entitySearchPage().removeFilterChip('Shapes Graph Record');
        browser.page.entitySearchPage().removeFilterChip('shacl1');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().assertNumFilterChips(0);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', false);
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);

        // Toggle filters on for the reset test next
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Ontology Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Shapes Graph Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().assertNumFilterChips(2);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', true);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', true);
    },

    'Step 14: Verify reset button clears filter chips' : function(browser) {
        browser.page.entitySearchPage().resetFilters();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().assertNumFilterChips(0);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl2', false);
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);

        // Toggle filter on for the navigation test
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Shapes Graph Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().assertNumFilterChips(1);
    },

    'Step 15: Navigate Away and Back': function (browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 2);
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().assertNumFilterChips(1);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', true);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().toggleFilterItem('Keywords', 'shacl1');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', true);
        browser.page.entitySearchPage().assertNumFilterChips(2);
    },

    'Step 16: Logout and Log Back In': function (browser) {
        browser.useCss();
        browser.globals.logout(browser);
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
    },

    'Step 17: Verify Cleared State': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.useCss()
            .waitForElementVisible('app-entity-search-page info-message p')
            .expect.element('app-entity-search-page app-search-results-list div.entity-results-list div info-message p').text.to.contain('No search has been performed');
        browser.useCss().assert.not.elementPresent('app-entity-search-page app-search-results-list mat-card-title');
        // Validate Filter Chips
        browser.page.entitySearchPage().assertNumFilterChips(0);
        // Validate Filters
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Ontology Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('Shapes Graph Record', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl1', false);
        browser.page.entitySearchPage().verifyFilterItemCheckedState('shacl2', false);
        // Validate there are no enabled checkboxes for the filters
        browser.useCss().expect.element('input.mat-checkbox-input[aria-checked=true]').to.not.be.present;
    },

    'Step 18: Ensure Selected types are not still Being Stored': function (browser) {
        browser.page.entitySearchPage().applySearchText('shapes');
        browser.useCss().assert.elementsCount('app-entity-search-page app-search-results-list mat-card-title', 10);
        browser.useCss().expect.element('app-entity-search-page app-search-results-list open-record-button button').to.be.present;
        browser.page.entitySearchPage().verifyRecordListView();
    },

    'Step 19: Change Dropdown Value': function (browser) {
        browser.page.entitySearchPage().applyOrderFilter('Entity Name (desc)')
        browser.page.entitySearchPage().verifyEntitySearchPageSort('Entity Name (desc)');
    },

    'Step 20: Verify Sort Option Does Not Change When Switching Pages': function (browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().verifyEntitySearchPageSort('Entity Name (desc)');
    },

    'Step 21: Verify Sort Option is Reset When Logging Out': function (browser) {
        browser.useCss();
        browser.globals.logout(browser);
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().verifyEntitySearchPageSort('Entity Name (asc)');
    }
}
