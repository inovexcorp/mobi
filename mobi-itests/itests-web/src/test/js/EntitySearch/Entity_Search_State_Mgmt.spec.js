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
var Ont = path.resolve(__dirname + '/../../resources/rdf_files/entity_search_test_ont.ttl');

module.exports = {
  '@tags': ['sanity', 'entity-search'],

  'Step 1: Initial Setup': function (browser) {
    browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword)
  },

  'Step 2: Upload Ontologies': function (browser) {
    [Ont].forEach(function (file) {
      browser.page.ontologyEditorPage().uploadOntology(file);
      browser.globals.wait_for_no_spinners(browser);
      browser.globals.dismiss_toast(browser);
    });
  },

  'Step 3: Switch to entity search page': function (browser) {
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.useCss().waitForElementVisible('app-entity-search-page')
      .expect.element('app-entity-search-page app-search-results-list div.entity-results-list div info-message p').text.to.contain('No search has been performed');
  },

  'Step 4: Search for "Class"': function (browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('class');
    browser.useCss().expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', 'true');
    browser.useCss().page.entitySearchPage()
        .expect.element('@paginationLabel').text.to.contain('1 – 10 of 22');
  },

  'Step 4: Go to next page of results': function (browser) {
    browser.page.entitySearchPage().useCss()
      .click('@paginationNext');
    browser.globals.wait_for_no_spinners(browser);
    browser.useCss().expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', null);
    browser.useCss().page.entitySearchPage()
      .expect.element('@paginationLabel').text.to.contain('11 – 20 of 22');
    browser.page.entitySearchPage().assertResultVisible('Class L');
  },

  'Step 5: Delete a class from the ontology': function (browser) {
    browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
    browser.page.editorPage()
        .assert.valueEquals('@editorRecordSelectInput', 'entity_search_test_ont')
        .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.ontologyEditorPage().openClassesTab()
      .selectItem('Class V');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.ontologyEditorPage().deleteSelectedEntity('Class V');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 6: Commit changes to the ontology': function (browser) {
    browser.page.ontologyEditorPage().commit('Removed ClassV');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 7: Navigate back to Entity Search Page and validate persisted results': function (browser) {
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.useCss().expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', null);
    browser.useCss().page.entitySearchPage()
      .expect.element('@paginationLabel').text.to.contain('11 – 20 of 22');
  },

  'Step 8: Go to next page and validate total results updated': function (browser) {
    browser.page.entitySearchPage().useCss()
      .click('@paginationNext');
    browser.globals.wait_for_no_spinners(browser);
    browser.useCss().expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(1);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', 'true')
      .assert.attributeEquals('@paginationPrevious', 'disabled', null);
    browser.useCss().page.entitySearchPage()
      .expect.element('@paginationLabel').text.to.contain('21 – 21 of 21');
  },

  'Step 9: Go back a page of results and validate display': function (browser) {
    browser.page.entitySearchPage().useCss()
      .click('@paginationPrevious');
    browser.globals.wait_for_no_spinners(browser);
    browser.useCss().expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', null);
    browser.useCss().page.entitySearchPage()
      .expect.element('@paginationLabel').text.to.contain('11 – 20 of 21');
    browser.page.entitySearchPage().assertResultVisible('Class L');
  },

  'Step 10: Delete another class from the ontology': function (browser) {
    browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
    browser.page.editorPage()
        .assert.valueEquals('@editorRecordSelectInput', 'entity_search_test_ont')
        .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.ontologyEditorPage().openClassesTab()
      .selectItem('Class L');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.ontologyEditorPage().deleteSelectedEntity('Class L');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 11: Commit changes to the ontology again': function (browser) {
    browser.page.ontologyEditorPage().commit('Removed ClassL');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 12: Navigate back to Entity Search Page and validate persisted results': function (browser) {
    browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
    browser.useCss().expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', null);
    browser.useCss().page.entitySearchPage()
      .expect.element('@paginationLabel').text.to.contain('11 – 20 of 21');
    browser.page.entitySearchPage().assertResultVisible('Class L');
  },

  'Step 13: Try to go to next page and validate behavior': function (browser) {
    browser.useCss().page.entitySearchPage()
      .click('@paginationNext');
    browser.globals.wait_for_no_spinners(browser);
    // Used selector object because it was determined to use xpath despite the useCss right before...
    browser.useCss().expect.elements({
      locateStrategy: 'css selector',
      selector: 'app-entity-search-page app-search-results-list mat-card-title'
    }).count.to.equal(10);
    browser.useCss()
      .assert.visible('mat-paginator')
      .page.entitySearchPage()
      .assert.attributeEquals('@paginationNext', 'disabled', null)
      .assert.attributeEquals('@paginationPrevious', 'disabled', 'true');
    browser.useCss().page.entitySearchPage()
      .expect.element('@paginationLabel').text.to.contain('1 – 10 of 20');
  }
}
