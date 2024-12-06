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
const recordsViewCssSelector = 'catalog-page records-view';
const recordViewCssSelector = 'catalog-page record-view';
const recordFiltersCssSelector = `${recordsViewCssSelector} record-filters`;
const recordsViewSearchBarCssSelector = `${recordsViewCssSelector} .d-flex .search-form input`;
const recordBodyTitleSelector = `${recordViewCssSelector} div.record-body h2.record-title div.inline-edit`;
const recordBodyDescriptionSelector = `${recordViewCssSelector} div.record-body p inline-edit`;
const recordManageButtonSelector = `${recordViewCssSelector} div.record-sidebar manage-record-button button`;
const selectedFilterChipList = `${recordsViewCssSelector} app-filters-selected-list mat-chip-list`;
const selectedFilterChipListXpath = '//catalog-page//records-view//app-filters-selected-list//mat-chip-list';
const filterItemXpath = '//catalog-page//record-filters//mat-expansion-panel//div//label//span';

var createRecordFiltersXPathSelector = function(filterTypeHeader, filterType) {
    var selectors = ['//catalog-page',
        '//records-view//record-filters//div[contains(@class, "record-filters")]//mat-expansion-panel-header',
        '//mat-panel-title[contains(@class, "mat-expansion-panel-header-title")][text()[contains(.,"' + filterTypeHeader + '")]]//ancestor::mat-expansion-panel',
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

// createRecordItemXPathSelector is used to get the xpath selector for an individual record's button given the title string
const createRecordItemXPathSelector = function(titleOfRecord) {
    var selectors = ['//catalog-page//record-card',
        '//mat-card-title//span[text()[contains(., "' + titleOfRecord + '")]]',
        '//ancestor::mat-card'
    ]
    // '//open-record-button//button' adding this to selector opens up the ontology page
    return selectors.join('');
};

const catalogPageCommands = {
    assertRecordVisible: function(recordTitle, index) {
        return this.useXpath()
            .assert.textContains(`(//catalog-page//record-card//mat-card-title//span[contains(@class, "title-text")])[${index}]`, recordTitle)
    },

    clearCatalogSearchBar: function() {
        return this.useCss()
            .sendKeys(recordsViewSearchBarCssSelector,['', browser.Keys.ENTER], function(result) { this.assert.strictEqual(result.status, 0) })
            .waitForElementNotPresent('#spinner-full')
            .waitForElementVisible(recordsViewSearchBarCssSelector)
            .clearValue(recordsViewSearchBarCssSelector)
            .expect.element(recordsViewSearchBarCssSelector).text.to.contain('');
    },

    verifyFilterItems: function(filterName, items) {
        items.forEach(function(item) {
            var filterCss = createRecordFiltersXPathSelector(filterName, item);
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
        const button = `${recordsViewCssSelector} app-filters-selected-list .reset-button-container button`;
        return this.useCss()
            .waitForElementVisible(button)
            .click(button);
    },

    applySearchText: function(searchText) {
        return this.useCss()
            .waitForElementVisible(recordsViewSearchBarCssSelector)
            .sendKeys(recordsViewSearchBarCssSelector, [searchText, this.api.Keys.ENTER])
            .waitForElementNotPresent('#spinner-full')
            .getValue(recordsViewSearchBarCssSelector, function (result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, searchText);
            });
    },

    applyOrderFilter: function(orderString) {
        return this.waitForElementVisible(recordsViewCssSelector + ' mat-form-field mat-select')
            .click(recordsViewCssSelector + ' mat-form-field mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath', '//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath', '//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "' + orderString + '")]]')
            .waitForElementNotPresent('#spinner-full');
    },

    verifyFilterItemCheckedState: function(filterItemName, isChecked) {
        const checkbox = `${filterItemXpath}[text()[contains(.,"${filterItemName}")]]/preceding-sibling::span//input`;
        return this.useXpath()
            .waitForElementVisible(`${checkbox}[@aria-checked="${isChecked ? 'true' : 'false'}"]`)
    },

    applyKeywordFilter: function(keyword) {
        var keywordFilterXPathSelector = createRecordFiltersXPathSelector('Keywords', keyword);

        return this.assert.elementPresent({selector: keywordFilterXPathSelector, locateStrategy: 'xpath'})
            .click('xpath', keywordFilterXPathSelector, function (result) {
                this.assert.strictEqual(result.status, 0)
            })
            .waitForElementNotPresent('#spinner-full')
    },

    finishSearch: function() {
        var recordTypeFilterXPathSelector = createRecordFiltersXPathSelector('Record Type', 'Versioned Record');

        return this.assert.elementPresent({selector: recordTypeFilterXPathSelector, locateStrategy: 'xpath'})
            .click('xpath', recordTypeFilterXPathSelector, function (result) {
                this.assert.strictEqual(result.status, 0)
            })
            .waitForElementNotPresent('#spinner-full');
    }
}

const catalogRecordCommands = {
    leaveCatalogRecord: function() {
        return this.click('css selector', 'catalog-page record-view div button', function(result) { this.assert.strictEqual(result.status, 0) })
            .waitForElementNotPresent('#spinner-full')
            .waitForElementVisible(recordsViewSearchBarCssSelector);
    },


    //openRecordItem is used to open Record item given the title of the record
    openRecordItem: function(titleOfRecord) {
        const recordItemSelector = createRecordItemXPathSelector(titleOfRecord);
        const viewButtonSelector = recordItemSelector + '//button[contains(@class, "view-button")]';

        const openCommands = function() {
            browser.useCss()
                .click('xpath', recordItemSelector)
                .expect.element('catalog-page record-view div.record-body').to.not.be.present;
            browser.click('xpath', viewButtonSelector, function(result) { this.assert.strictEqual(result.status, 0) })
                .waitForElementVisible('catalog-page record-view div.record-body')
                .expect.element('catalog-page record-view div.record-body h2.record-title div.inline-edit').text.to.contain(titleOfRecord);
        }
        return openCommands();
    },

    verifyRecordList: function() {
        const verifyCommands = function() {
            this.expect.element(recordsViewCssSelector + ' div.col.d-flex.flex-column').to.be.present;
            this.expect.element(recordsViewCssSelector + ' div.col.d-flex.flex-column mat-paginator').to.be.present;
        };

        return verifyCommands();
    },

    changeRecordFields: function(titleOfRecord, changeObj) {
        if ('description' in changeObj) {
            var description = changeObj.description;
            browser.expect.element(recordBodyTitleSelector).text.to.contain(titleOfRecord);
            browser
                .click('css selector', recordBodyDescriptionSelector, function(result) { this.assert.strictEqual(result.status, 0) })
                .setValue(recordBodyDescriptionSelector + ' textarea', [description, browser.Keys.ENTER])
                .waitForElementNotPresent('#spinner-full');
            browser.expect.element(recordBodyDescriptionSelector).text.to.contain(description);
        }

        if ('keywords' in changeObj) {
            var keywords = changeObj.keywords;
            browser.expect.element(recordBodyTitleSelector).text.to.contain(titleOfRecord);
            browser
                .click('css selector', 'catalog-page record-view catalog-record-keywords', function(result) { this.assert.strictEqual(result.status, 0) })
                .waitForElementNotPresent('#spinner-full');

            for(var keyword in keywords){ // keyword acts like index number instead of value
                browser.setValue('catalog-page record-view catalog-record-keywords input', [keywords[keyword], browser.Keys.ENTER]);
            }

            browser
                .click('css selector', 'catalog-page record-view catalog-record-keywords a', function(result) { this.assert.strictEqual(result.status, 0) })
                .waitForElementNotPresent('#spinner-full');
        }
    },

    openManage: function() {
        return this.useCss()
            .assert.elementPresent(recordManageButtonSelector)
            .click(recordManageButtonSelector)
            .waitForElementVisible('.record-permission-view');
    },

    toggleRecordEveryonePermission: function(permissionTitle) {
        return this.useXpath()
            .waitForElementVisible(`//user-access-controls//*[h4="${permissionTitle}"]//mat-slide-toggle`)
            .click(`//user-access-controls//*[h4="${permissionTitle}"]//mat-slide-toggle`)
            .useCss()
            .click('div.save-container')
            .api.globals.wait_for_no_spinners(this);
    }
}

module.exports = {
    elements: {
        recordsSelector: recordsViewCssSelector,
        recordSelector: recordViewCssSelector,
        filterSelector: recordFiltersCssSelector,
        searchBar: recordsViewSearchBarCssSelector,
        recordTitle: recordBodyTitleSelector,
        recordDescription: recordBodyDescriptionSelector,
        recordManageButton: recordManageButtonSelector,
        selectedFilterChipList: selectedFilterChipList
    },
    commands: [catalogPageCommands, catalogRecordCommands]
}
