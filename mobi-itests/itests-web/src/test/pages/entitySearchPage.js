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
const sortDropdownCssSelector = `${searchResultsViewCssSelector} .d-flex .search-form mat-select`;
const itemTitleSelector = `${itemCssSelector} div.record-body h2.record-title div.inline-edit`;
const itemDescriptionSelector = `${itemCssSelector} div.record-body p inline-edit`;
const paginationLabel = `${searchResultsViewCssSelector} .mat-paginator-range-label`;
const paginationNext = `${searchResultsViewCssSelector} button.mat-paginator-navigation-next`;
const paginationPrevious = `${searchResultsViewCssSelector} button.mat-paginator-navigation-previous`;
const selectedFilterChipList = 'app-entity-search-page app-filters-selected-list mat-chip-list';
const selectedFilterChipListXpath = '//app-entity-search-page//app-filters-selected-list//mat-chip-list';
const filterItemXpath = '//app-entity-search-page//app-entity-search-filters//mat-expansion-panel//div//label//span';

const createRecordItemXPathSelector = function(titleOfEntity, titleOfRecord) {
  var selectors = ['//app-entity-search-page//app-search-result-item',
    `//mat-card-title//span[text()[contains(., "${titleOfEntity}")]]`,
    '//ancestor::mat-card'
  ];
  if (titleOfRecord) {
    selectors = selectors.concat([
      `//mat-card-subtitle//span[text()[contains(.,"${titleOfRecord}")]]`,
      '//ancestor::mat-card'
    ]);
  }
  return selectors.join('');
};

const createFiltersXPathSelector = function(filterTypeHeader, filterType) {
  var selectors = ['//app-entity-search-page',
      '//app-entity-search-filters//div[contains(@class, "entity-search-filters")]//mat-expansion-panel-header',
      `//mat-panel-title//div[contains(@class, "filter-panel-title") and contains(text(), '${filterTypeHeader}')]//ancestor::mat-expansion-panel`,
      '//div[contains(@class, "mat-expansion-panel-content")]',
      '//div[contains(@class, "filter-option")]//mat-checkbox']
  if (filterType) {
      selectors = selectors.concat([
          '//span[contains(@class, "mat-checkbox-label")][text()[contains(., "' + filterType + '")]]',
          '//ancestor::mat-checkbox//label[contains(@class, "mat-checkbox-layout")]'
      ])
  }
  return selectors.join('');
};

const entitySearchPageCommands = {
  assertResultVisible: function (titleOfEntity) {
    const resultSelector = createRecordItemXPathSelector(titleOfEntity);
    return this.useXpath()
      .waitForElementVisible(resultSelector);
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

  verifyFilterItems: function(filterName, items) {
      items.forEach(function(item) {
          var filterCss = createFiltersXPathSelector(filterName, item);
          this.useXpath()
            .waitForElementVisible(filterCss);
      }.bind(this));
  },

  toggleFilterItem: function(filterName, itemName) {
      var filterXPathSelector = createFiltersXPathSelector(filterName, itemName);

      return this.assert.elementPresent({selector: filterXPathSelector, locateStrategy: 'xpath'})
          .click('xpath', filterXPathSelector, function (result) {
              this.assert.strictEqual(result.status, 0)
          })
          .waitForElementNotPresent('#spinner-full')
  },

  verifyFilterItemCheckedState: function(filterItemName, isChecked) {
      const checkbox = `${filterItemXpath}[text()[contains(.,"${filterItemName}")]]/preceding-sibling::span//input`;
      return this.useXpath()
          .waitForElementVisible(`${checkbox}[@aria-checked="${isChecked ? 'true' : 'false'}"]`)
  },

  assertNumFilterChips: function(num) {
      if (num === 0) {
          return this.useCss()
              .waitForElementVisible(selectedFilterChipList)
              .expect.element(`${selectedFilterChipList} mat-chip`).to.not.be.present;
      }
      return this.useCss()
          .waitForElementVisible(selectedFilterChipList)
          .assert.elementsCount(`${selectedFilterChipList} mat-chip`, num);
  },

  assertFilterChipExists: function(chipName) {
      return this.useCss()
          .waitForElementVisible(selectedFilterChipList)
          .useXpath()
          .assert.visible(`${selectedFilterChipListXpath}//span[text()[contains(.,"${chipName}")]]`);
  },

  removeFilterChip: function(chipName) {
      const iconXPath = `${selectedFilterChipListXpath}//span[text()[contains(.,"${chipName}")]]/following-sibling::mat-icon`;
      return this.useCss()
          .waitForElementVisible(selectedFilterChipList)
          .useXpath()
          .waitForElementVisible(iconXPath)
          .click(iconXPath)
          .waitForElementNotPresent(iconXPath);
  },

  resetFilter: function(filterTitle) {
    const buttonXpath = `//mat-panel-title//div[contains(@class, 'filter-panel-title') and contains(text(), '${filterTitle}')]/ancestor::mat-panel-title//button`;
    return this.useXpath()
      .waitForElementVisible(buttonXpath)
      .click(buttonXpath);
  },

  resetFilters: function() {
      const button = `${searchResultsViewCssSelector} app-filters-selected-list .reset-button-container button`;
      return this.useCss()
          .waitForElementVisible(button)
          .click(button);
  },

  verifyEntitySearchPageSort: function (sortOptionString) {
    return this.useCss()
        .waitForElementVisible(sortDropdownCssSelector)
        .useXpath()
        .waitForElementPresent('//app-entity-search-page//div[contains(@class, "search-form")]//mat-select//span[text()[contains(.,"' + sortOptionString + '")]]')
        .useCss();
  },

  applyOrderFilter: function(orderString) {
    return this.waitForElementVisible(sortDropdownCssSelector)
        .click(sortDropdownCssSelector)
        .waitForElementVisible('div.mat-select-panel')
        .waitForElementVisible('xpath', '//div[contains(@class, "mat-select-panel")]//mat-option')
        .click('xpath', '//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "' + orderString + '")]]')
        .waitForElementNotPresent('#spinner-full');
  },

  openRecordItem: function(titleOfRecord) {
    const recordItemSelector = createRecordItemXPathSelector(titleOfRecord);
    const openButtonSelector = recordItemSelector + '//open-record-button//button';

    const openCommands = function() {
      browser.click('xpath', openButtonSelector, function(result) { this.assert.strictEqual(result.status, 0) })
        .waitForElementNotPresent('app-entity-search-page app-search-results-list')
    }
    return openCommands();
  },

  viewRecord: function(titleOfEntity, titleOfRecord) {
    const recordItemSelector = createRecordItemXPathSelector(titleOfEntity);
    const viewRecordSelector = recordItemSelector + '//button[contains(@class, "view-button")]';

    const viewCommands = function() {
      browser.click('xpath', viewRecordSelector, function(result) { this.assert.strictEqual(result.status, 0) })
          .waitForElementNotPresent('app-entity-search-page app-search-results-list')
          .waitForElementVisible('catalog-page record-view div.record-body')
          .expect.element('catalog-page record-view div.record-body h2.record-title div.inline-edit').text.to.contain(titleOfRecord);
    }
    return viewCommands();
  }
}

const entitySearchResults = {
  verifyRecordListView: function () {
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
    paginationLabel: paginationLabel,
    entityTitle: itemTitleSelector,
    entityDescription: itemDescriptionSelector
  },
  commands: [entitySearchPageCommands, entitySearchResults]
}
