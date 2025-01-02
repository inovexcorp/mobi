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
const mergeRequestPage = 'merge-requests-page ';
const mergeRequestPageList = `${mergeRequestPage}merge-request-list`;
const mergeRequestPageForm = `${mergeRequestPage}.search-container`;
const mergeRequestSearch = `${mergeRequestPageForm} input`;
const mergeRequestSort = `${mergeRequestPageForm} mat-select`;
const mergeRequestFilters = `${mergeRequestPage}merge-request-filter`;
const mergeRequestPaginator = `${mergeRequestPage}.merge-request-paginator mat-paginator`;
const selectedFilterChipList = `${mergeRequestPageList} app-filters-selected-list mat-chip-list`;
const selectedFilterChipListXpath = '//merge-requests-page//merge-request-list//app-filters-selected-list//mat-chip-list';

var createFilterXPathSelector = function(filterTypeHeader, filterOption) {
  var selectors = ['//merge-requests-page',
      '//merge-request-filter//div[contains(@class, "merge-request-filter")]//mat-expansion-panel-header',
      `//mat-panel-title[contains(@class, "mat-expansion-panel-header-title")][text()[contains(.,"${filterTypeHeader}")]]//ancestor::mat-expansion-panel`,
      '//div[contains(@class, "mat-expansion-panel-content")]'
  ];
  if (filterOption) {
      if (filterTypeHeader === 'Request Status') {
          selectors = selectors.concat([
              '//div[contains(@class, "filter-option")]//mat-radio-group//mat-radio-button',
              `//span[contains(@class, "mat-radio-label")][text()[contains(., "${filterOption}")]]`,
          ]);
      } else {
          selectors = selectors.concat([
              '//div[contains(@class, "filter-option")]//mat-checkbox',
              `//span[contains(@class, "mat-checkbox-label")][text()[contains(., "${filterOption}")]]`,
              '//ancestor::mat-checkbox//label[contains(@class, "mat-checkbox-layout")]'
          ]);
      }
  }
  return selectors.join('');
}

const mergeRequestPageCommands = {
    verifyRecordFilters: function () {
        return this.useCss()
            .waitForElementPresent(mergeRequestFilters)
            .expect.elements(`${mergeRequestFilters} mat-expansion-panel-header mat-panel-title`).count.to.equal(4);
    },

    verifyMergeRequestList: function () {
        return this.useCss()
            .waitForElementPresent(mergeRequestPageList)
            .waitForElementPresent(mergeRequestPaginator)
    },

    verifyMergePageSort: function () {
        return this.useCss()
            .waitForElementPresent(mergeRequestPageForm)
            .waitForElementPresent(mergeRequestSort)
            .useXpath()
            .waitForElementPresent('//merge-requests-page//mat-select//span[text()[contains(.,"Issued (desc)")]]')
            .useCss();
    },

// Used to execute a search on the main merge request landing page
    searchList: function (searchText) {
        return this.useCss()
            .waitForElementVisible(mergeRequestSearch)
            .clearValue(mergeRequestSearch)
            .sendKeys(mergeRequestSearch, [searchText, browser.Keys.ENTER])
            .waitForElementNotPresent('#spinner-full')
            .getValue(mergeRequestSearch, function(result) {
                this.assert.equal(typeof result, 'object');
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, searchText);
            });
    },

    assertMatCardTitle: function (title) {
        return this.useXpath()
            .waitForElementVisible(`//merge-requests-page//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"${title}")]`)
    },

    changeStatusType: function (status) {
        var statusXpath = `//merge-request-list//merge-request-filter//mat-expansion-panel//mat-panel-title[text()[contains(.,"Request Status")]]//ancestor::mat-expansion-panel//mat-radio-button//span[text()[contains(.,"${status}")]]`
        return this.useXpath()
            .waitForElementVisible(statusXpath)
            .click(statusXpath)
    },

    verifyFilterHeader: function(filterName) {
      const filterXpathSelector = createFilterXPathSelector(filterName);
      return this.assert.elementPresent({ selector: filterXpathSelector, locateStrategy: 'xpath' });
    },

    searchFilterList: function(filterName, searchText) {
        const filterSearchXPathSelector = `${createFilterXPathSelector(filterName)}//input`;
        this.assert.elementPresent({ selector: filterSearchXPathSelector, locateStrategy: 'xpath' });
        return this.useXpath()
            .sendKeys(filterSearchXPathSelector, [searchText, browser.Keys.ENTER])
            .useCss()
            .waitForElementNotPresent('#spinner-full');
    },

    toggleFilterItem: function(filterName, itemName) {
        var filterXPathSelector = createFilterXPathSelector(filterName, itemName);

        return this.assert.elementPresent({selector: filterXPathSelector, locateStrategy: 'xpath'})
            .click('xpath', filterXPathSelector, function (result) {
                this.assert.strictEqual(result.status, 0)
            })
            .waitForElementNotPresent('#spinner-full')
    },

    verifyFilterItems: function(filterName, items) {
        items.forEach(function(item) {
            var filterCss = createFilterXPathSelector(filterName, item);
            this.useXpath()
              .waitForElementVisible(filterCss);
        }.bind(this));
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

    resetFilters: function() {
        const button = `${mergeRequestPageList} app-filters-selected-list .reset-button-container button`;
        return this.useCss()
            .waitForElementVisible(button)
            .click(button);
    },
}

const mergeRequestCommands = {
// Selects the merge request with the specified title from the main merge request landing page
    selectRequest: function(mrTitle) {
        return this.useXpath()
            .waitForElementVisible("//merge-requests-page//merge-request-list")
            .waitForElementVisible("//merge-requests-page//merge-request-list//button//span[text()[contains(.,'New Request')]]")
            .useCss()
            .assert.textContains('div.request-contents .details h3', mrTitle)
            .click('xpath', '//div[contains(@class, "request-contents")]//h3//span[text()[contains(.,"' + mrTitle + '")]]')

    },

// MergeRequestView Check for mat-chip status: open, accepted, closed
    mergeRequestViewCheckStatus: function(statusTitle) {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//mat-chip[contains(text(), "' + statusTitle + '")]');
    },

// Accepts the currently displayed merge request
    acceptRequest: function() {
        return this.useXpath()
            .waitForElementVisible("//merge-requests-page//merge-request-view//button//span[text()[contains(.,'Accept')]]")
            .click("//merge-requests-page//merge-request-view//button//span[text()[contains(.,'Accept')]]")
            .useCss()
            .waitForElementVisible('div.mat-dialog-actions button.mat-primary')
            .click('div.mat-dialog-actions button.mat-primary')
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementNotPresent('div.fade')
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success')
            .waitForElementVisible('xpath', '//mat-chip[text()[contains(.,"Accepted")]]')
            .useXpath()
            .waitForElementVisible("//merge-requests-page//merge-request-view//button//span[text()[contains(.,'Back')]]")
            .click("//merge-requests-page//merge-request-view//button//span[text()[contains(.,'Back')]]")
    },

// Create New Request
    createNewRequest: function() {
        return this.useXpath()
            .waitForElementVisible("//merge-requests-page//button//span[text()[contains(.,'New Request')]]")
            .click("//merge-requests-page//button//span[text()[contains(.,'New Request')]]")
            .useXpath()
            .waitForElementVisible('//merge-requests-page//create-request');
    },

    assertMatCardTitle: function(title) {
        return this.useXpath()
            .waitForElementVisible(`//merge-requests-page//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"${title}")]`)
    },

    clickMatCard: function(title) {
        return this.useXpath()
            .waitForElementVisible(`//merge-requests-page//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"${title}")]`)
            .click(`//merge-requests-page//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"${title}")]`);
    },

    createRequestSourceBranchSelect: function(branchTitle) {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//create-request//mat-horizontal-stepper//request-branch-select')
            .waitForElementVisible('(//branch-select//div[contains(@class, "mat-form-field-infix")])[1]/input')
            .click('(//branch-select//div[contains(@class, "mat-form-field-infix")])[1]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"' + branchTitle + '")]]')
            .click('//mat-option//span[text()[contains(.,"' + branchTitle + '")]]');
    },

    createRequestTargetBranchSelect: function(branchTitle) {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//create-request//mat-horizontal-stepper//request-branch-select')
            .waitForElementVisible('(//branch-select//div[contains(@class, "mat-form-field-infix")])[2]/input')
            .click('(//branch-select//div[contains(@class, "mat-form-field-infix")])[2]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"' + branchTitle + '")]]')
            .click('//mat-option//span[text()[contains(.,"' + branchTitle + '")]]');
    },

    createRequestSubmit: function() {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//create-request//button//span[text()="Submit"]')
            .click('//merge-requests-page//create-request//button//span[text()="Submit"]')
    },

    createRequestNext: function() {
        return this.useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Next")]/parent::button')
            .assert.enabled('//button//span[contains(text(), "Next")]/parent::button')
            .click('//button//span[contains(text(), "Next")]/parent::button')
            .useCss()
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');
    },

    closeMergeRequest: function() {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button', 'disabled', null)
            .click('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .waitForElementVisible('//mat-dialog-container//confirm-modal')
            .click('//mat-dialog-container//confirm-modal//button//span[contains(text(), "Yes")]/parent::button');
    },

    reopenMergeRequest: function(mrTitle) {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button')
            .click('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button')
            .waitForElementVisible('//mat-dialog-container//confirm-modal//p[contains(text(), "Are you sure you want to reopen ")]')
            .waitForElementVisible('//mat-dialog-container//confirm-modal//p//strong[contains(text(), "' + mrTitle +'")]')
            .useCss()
            .waitForElementVisible('mat-dialog-container confirm-modal button.mat-primary')
            .click('mat-dialog-container confirm-modal button.mat-primary')
    },

    verifyMergeRequestButtons: function () {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button', 'disabled', null)
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button', 'disabled', null)
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button', 'disabled', null)
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);

    },

    verifyClosedMergeRequestButtons: function () {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button', 'disabled', null)
            .waitForElementNotPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .waitForElementNotPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button', 'disabled', null)
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null)
    },

    verifyClosedMergeRequestButtonsNoPermissions: function () {
        return this.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button', 'disabled', null)
            .waitForElementNotPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .waitForElementNotPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button', 'disabled', 'true')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', 'true')
    },
}

module.exports = {
    elements: {
        page: mergeRequestPage,
        pageList: mergeRequestPageList,
        pageForm: mergeRequestPageForm,
        pageSearch: mergeRequestSearch,
        pageSort: mergeRequestSort,
        pageFilters: mergeRequestFilters,
        pagePaginator: mergeRequestPaginator
    },
    commands: [mergeRequestPageCommands, mergeRequestCommands]
}
