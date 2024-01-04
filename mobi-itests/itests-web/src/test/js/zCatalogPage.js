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

var CatalogPage = function() {
    this.recordsViewCssSelector = 'catalog-page records-view';
    this.recordViewCssSelector = 'catalog-page record-view';
    this.recordFiltersCssSelector = this.recordsViewCssSelector + ' record-filters';
    this.recordsViewSearchBarCssSelector = this.recordsViewCssSelector + ' .d-flex .search-form input'
    this.recordBodyTitleSelector = this.recordViewCssSelector + ' div.record-body h2.record-title div.inline-edit';
    this.recordBodyDescriptionSelector = this.recordViewCssSelector + ' div.record-body p inline-edit';

    this.recordTypeFilters = ['Dataset Record', 'Mapping Record', 'Ontology Record', 'Record', 'Shapes Graph Record',
        'Unversioned Record', 'Versioned RDF Record', 'Versioned Record', 'Workflow Record']
};

CatalogPage.prototype.getAllElementsTextValues = function(browser, selector, target) {
    var myPromiseAll = function (browser, result) {
        var elementIdTextPromise = function (elementId) {
            return new Promise(function (resolve, reject) {
                browser.elementIdText(elementId, function (a) { resolve(a.value) });
            });
        };

        return new Promise(function (resolve, reject) {
            var elementIdTextPromises = result.value.map(function (webElement) {
                return elementIdTextPromise(webElement.getId());
            });
            Promise.all(elementIdTextPromises)
                .then(function (values) { resolve(values) });
        });
    };

    return new Promise(function (resolve, reject) {
        browser.findElements(selector, target, function (result) {
            var api = this;
            myPromiseAll(browser, result)
                .then(function (values) { resolve(values) });
        });
    });
}

CatalogPage.prototype.createRecordFiltersXPathSelector = function(filterTypeHeader, filterType) {
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
CatalogPage.prototype.createRecordItemXPathSelector = function(titleOfRecord) {
    var selectors = ['//catalog-page//record-card',
        '//mat-card-title//span[text()[contains(., "' + titleOfRecord + '")]]',
        '//ancestor::mat-card'
    ]
    // '//open-record-button//button' adding this to selector opens up the ontology page
    return selectors.join('');
};

// openRecordItem is used to open Record item given the title of the record
CatalogPage.prototype.openRecordItem = function(browser, titleOfRecord) {
    var recordItemSelector = this.createRecordItemXPathSelector(titleOfRecord);
    browser.click('xpath', recordItemSelector, function(result) { this.assert.strictEqual(result.status, 0) });
    browser.waitForElementVisible('catalog-page record-view div.record-body');
    browser.expect.element('catalog-page record-view div.record-body h2.record-title div.inline-edit').text.to.contain(titleOfRecord);
};

CatalogPage.prototype.changeRecordFields = function(browser, titleOfRecord, changeObj) {
    if('description' in changeObj) {
        var description = changeObj.description;
        browser.expect.element(this.recordBodyTitleSelector).text.to.contain(titleOfRecord);
        browser
            .click('css selector', this.recordBodyDescriptionSelector, function(result) { this.assert.strictEqual(result.status, 0) })
            .setValue(this.recordBodyDescriptionSelector + ' textarea', [description, browser.Keys.ENTER])
            .waitForElementNotPresent('#spinner-full');
        browser.expect.element(this.recordBodyDescriptionSelector).text.to.contain(description);
    }

    if('keywords' in changeObj) {
        var keywords = changeObj.keywords;
        browser.expect.element(this.recordBodyTitleSelector).text.to.contain(titleOfRecord);
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
}

CatalogPage.prototype.leaveCatalogRecord = function(browser) {
    browser
        .click('css selector', 'catalog-page record-view div button', function(result) { this.assert.strictEqual(result.status, 0) })
        .waitForElementNotPresent('#spinner-full')
        .waitForElementVisible(this.recordsViewSearchBarCssSelector);
};

// verifyRecordFilters is used to verify filters on the catalog page,
// noKeywords is a boolean value to check if page has available keywords
CatalogPage.prototype.verifyRecordFilters = function(browser, noKeywords) {
    var cp = this;
    browser.expect.element(this.recordFiltersCssSelector).to.be.present;
    browser.expect.elements(this.recordFiltersCssSelector + ' div.record-filters mat-expansion-panel-header mat-panel-title').count.to.equal(3);

    CatalogPage.prototype.getAllElementsTextValues(browser, 'xpath', this.createRecordFiltersXPathSelector('Record Type'))
        .then(function(values) {
            // order of record types can be different sometimes, so sort array of values
            browser.assert.equal(values.sort(), cp.recordTypeFilters.join(','))
        });

    CatalogPage.prototype.getAllElementsTextValues(browser, 'css selector', this.recordFiltersCssSelector + ' mat-panel-title')
        .then(function(values) {
            browser.assert.equal(values, 'Record Type,Creators,Keywords')
        });

    if (noKeywords) {
        browser.expect.element(this.recordFiltersCssSelector + ' info-message p').text.to.contain('No Keywords available');
    } else {
        browser.expect.element(this.recordFiltersCssSelector + ' info-message p').to.not.be.present;
    }
};

CatalogPage.prototype.verifyRecordList = function(browser) {
    browser.expect.element(this.recordsViewCssSelector + ' div.col.d-flex.flex-column').to.be.present;
    browser.expect.element(this.recordsViewCssSelector + ' div.col.d-flex.flex-column mat-paginator').to.be.present;
};

CatalogPage.prototype.clearCatalogSearchBar = function(browser, searchObj) {
    browser
        .sendKeys(this.recordsViewSearchBarCssSelector,['', browser.Keys.ENTER], function(result) { this.assert.strictEqual(result.status, 0) })
        .waitForElementNotPresent('#spinner-full')
        .waitForElementVisible(this.recordsViewSearchBarCssSelector)
        .clearValue(this.recordsViewSearchBarCssSelector);
    browser.expect.element(this.recordsViewSearchBarCssSelector).text.to.contain('');
}

// searchRecords is used to search page give searchObj object
CatalogPage.prototype.searchRecords = function(browser, searchObj) {
    this.clearCatalogSearchBar(browser);

    if('searchText' in searchObj) {
        browser
            .waitForElementVisible(this.recordsViewSearchBarCssSelector)
            .sendKeys(this.recordsViewSearchBarCssSelector,[searchObj.searchText, browser.Keys.ENTER])
            .waitForElementNotPresent('#spinner-full');
        browser.getValue(this.recordsViewSearchBarCssSelector, function(result) {
            this.assert.equal(typeof result, "object");
            this.assert.equal(result.status, 0);
            this.assert.equal(result.value, searchObj.searchText);
          });
    } else {
        this.clearCatalogSearchBar(browser);
    }

    if('order' in searchObj) {
        browser
            .waitForElementVisible(this.recordsViewCssSelector + ' mat-form-field mat-select')
            .click(this.recordsViewCssSelector + ' mat-form-field mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "' + searchObj.order + '")]]')
            .waitForElementNotPresent('#spinner-full');
    }

    if('keywords' in searchObj) {
        var keywords = searchObj.keywords;
        var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };

        for(var keyword in keywords){ // keyword acts like index number instead of value
            var keywordFilterXPathSelector = this.createRecordFiltersXPathSelector('Keywords', keywords[keyword]);
            browser.assert.elementPresent({ selector: keywordFilterXPathSelector, locateStrategy: 'xpath' });
            browser.click('xpath', keywordFilterXPathSelector, clickFunc).waitForElementNotPresent('#spinner-full');
            browser.waitForElementNotPresent('#spinner-full');
        }
    }

    var recordTypeFilterXPathSelector = this.createRecordFiltersXPathSelector('Record Type', 'Versioned Record');
    browser.assert.elementPresent({ selector: recordTypeFilterXPathSelector, locateStrategy: 'xpath' });
    browser.click('xpath', recordTypeFilterXPathSelector, function(result) { this.assert.strictEqual(result.status, 0) })
        .waitForElementNotPresent('#spinner-full');
};

CatalogPage.prototype.assertRecordList = function(browser, recordList) {
    if (recordList) {
      CatalogPage.prototype.getAllElementsTextValues(browser, 'css selector', 'catalog-page record-card mat-card-title span')
            .then(function(values) {
                browser.assert.equal(values, recordList)
            });
    } else {
        browser.waitForElementVisible(this.recordsViewCssSelector + ' div.results-list info-message');
        browser.expect.element(this.recordsViewCssSelector + ' div.results-list info-message p').text.to.contain('No records found');
    }
};

module.exports = { catalogPage: new CatalogPage() };
