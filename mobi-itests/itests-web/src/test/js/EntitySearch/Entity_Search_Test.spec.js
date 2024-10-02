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
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/pizza.owl');


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
      .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No search has been performed');
  },

  'Step 4: Search entity page Empty': function (browser) {
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('does-not-exist-record');
    browser.waitForElementVisible('app-entity-search-page app-search-results-list info-message')
      .expect.element('app-entity-search-page app-search-results-list info-message p').text.to.contain('No entities found containing this search text');
  },

  'Step 5: Search entity results': function (browser) {
    var recordTitles = ['Sorvete', 'PizzaVegetarianaEquivalente2', 'PizzaVegetarianaEquivalente1'];
    browser.page.entitySearchPage().clearEntitySearchBar();
    browser.page.entitySearchPage().applySearchText('pizza');
    browser.expect.elements('app-entity-search-page app-search-results-list mat-card-title').count.to.equal(10);
    browser.page.entitySearchPage().verifyRecordList();
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
}