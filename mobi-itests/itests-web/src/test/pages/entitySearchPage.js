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
const searchResultsViewCssSelector = 'app-entity-search-page app-search-results-list';
const itemCssSelector = 'app-entity-search-page app-search-results-list app-search-result-item';
const searchBarCssSelector = `${searchResultsViewCssSelector} .d-flex .search-form input`;
const itemTitleSelector = `${itemCssSelector} div.record-body h2.record-title div.inline-edit`;
const itemDescriptionSelector = `${itemCssSelector} div.record-body p inline-edit`;
const paginationNext = `${searchResultsViewCssSelector} button.mat-paginator-navigation-next`;
const paginationPrevious = `${searchResultsViewCssSelector} button.mat-paginator-navigation-previous`;

const createRecordItemXPathSelector = function(titleOfRecord) {
  var selectors = ['//app-entity-search-page//app-search-result-item',
    '//mat-card-title//span[text()[contains(., "' + titleOfRecord + '")]]',
    '//ancestor::mat-card'
  ]
  return selectors.join('');
};

const entitySearchPageCommands = {
  assertRecordVisible: function (recordTitle, index) {
    return this.useXpath()
      .assert.textContains(`(//app-entity-search-page//app-search-results-list//mat-card-title//div//span)[${index}]`, recordTitle)
  },

  clearEntitySearchBar: function () {
    return this.useCss()
      .sendKeys(searchBarCssSelector, ['', browser.Keys.ENTER], function (result) {
        this.assert.strictEqual(result.status, 0)
      })
      .waitForElementNotPresent('#spinner-full')
      .waitForElementVisible(searchResultsViewCssSelector)
      .clearValue(searchBarCssSelector)
      .expect.element(searchBarCssSelector).text.to.contain('');
  },

  applySearchText: function (searchText) {
    return this.useCss()
      .waitForElementVisible(searchBarCssSelector)
      .sendKeys(searchBarCssSelector, [searchText, this.api.Keys.ENTER])
      .waitForElementNotPresent('#spinner-full')
      .getValue(searchBarCssSelector, function (result) {
        this.assert.equal(typeof result, "object");
        this.assert.equal(result.status, 0);
        this.assert.equal(result.value, searchText);
      });
  },

  openRecordItem: function(titleOfRecord) {
    const recordItemSelector = createRecordItemXPathSelector(titleOfRecord);
    const openButtonSelector = recordItemSelector + '//open-record-button//button';

    const openCommands = function() {
      browser.click('xpath', openButtonSelector, function(result) { this.assert.strictEqual(result.status, 0) })
        .waitForElementNotPresent('app-entity-search-page app-search-results-list')
    }
    return openCommands();
  }
}

const entitySearchResults = {
  verifyRecordList: function () {
    const verifyCommands = function () {
      this.expect.element(`${searchResultsViewCssSelector} div.col.d-flex.flex-column`).to.be.present;
      this.expect.element(`${searchResultsViewCssSelector} div.col.d-flex.flex-column mat-paginator`).to.be.present;
    };

    return verifyCommands();
  }
}

module.exports = {
  elements: {
    searchResultsSelector: searchResultsViewCssSelector,
    entitySelector: itemCssSelector,
    searchBar: searchBarCssSelector,
    paginationNext: paginationNext,
    paginationPrevious: paginationPrevious,
    entityTitle: itemTitleSelector,
    entityDescription: itemDescriptionSelector
  },
  commands: [entitySearchPageCommands, entitySearchResults]
}
