/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
var adminUsername = 'admin'
var adminPassword = 'admin'
var CatalogOnto1 = process.cwd()+ '/src/test/resources/ontologies/z-catalog-ontology-1.ttl'
var CatalogOnto2 = process.cwd()+ '/src/test/resources/ontologies/z-catalog-ontology-2.ttl'
var CatalogOnto3 = process.cwd()+ '/src/test/resources/ontologies/z-catalog-ontology-3.ttl'
var CatalogOnto4 = process.cwd()+ '/src/test/resources/ontologies/z-catalog-ontology-4.ttl'

var CatalogPage = function() {
    this.recordsViewCssSelector = 'catalog-page records-view';
    this.recordViewCssSelector = 'catalog-page record-view';
    this.recordFiltersCssSelector = this.recordsViewCssSelector + ' record-filters';
    this.recordsViewSearchBarCssSelector = this.recordsViewCssSelector + ' search-bar input'
    this.recordBodyTitleSelector = this.recordViewCssSelector + ' div.record-body h2.record-title div.inline-edit';
    this.recordBodyDescriptionSelector = this.recordViewCssSelector + ' div.record-body p inline-edit';

    this.recordTypeFilters = ['Dataset Record', 'Mapping Record', 'Ontology Record','Record',
        'Unversioned Record', 'Versioned RDF Record', 'Versioned Record']
};

CatalogPage.prototype.createRecordFiltersXPathSelector = function(filterTypeHeader, filterType) {
    var selectors = ['//catalog-page',
        '//records-view', '//record-filters', '//div[contains(@class, "filter-container")]',
        '//*[span[contains(@class, "ng-binding")][text()[contains(., "' + filterTypeHeader + '")]]]/parent::*',
        '//div[contains(@class, "filter-option")][contains(@class, "ng-scope")]',
        '//div[contains(@class, "custom-control")]']
    if (filterType) {
        selectors = selectors.concat([
            '//label[contains(@class, "ng-binding")][text()[contains(., "' + filterType + '")]]',
            '/parent::*/label'
        ])
    }
    return selectors.join('');
};

// createRecordItemXPathSelector is used to get the xpath selector for an individual record's button given the title string
CatalogPage.prototype.createRecordItemXPathSelector = function(titleOfRecord) {
    var selectors = ['//catalog-page//records-view//record-card',
        '//*[div[contains(@class, "card-body")]//h5[contains(@class, "card-title")]',
        '//span[contains(@class, "ng-binding")][text()[contains(., "' + titleOfRecord + '")]]]']
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

CatalogPage.prototype.changeRecordDescription = function(browser, titleOfRecord, description) {
    browser.expect.element(this.recordBodyTitleSelector).text.to.contain(titleOfRecord);
    browser
        .click('css selector', this.recordBodyDescriptionSelector, function(result) { this.assert.strictEqual(result.status, 0) })
        .setValue(this.recordBodyDescriptionSelector + ' textarea', [description, browser.Keys.ENTER])
    browser.expect.element(this.recordBodyDescriptionSelector).text.to.contain(description);
}

// verifyRecordFilters is used to verify filters on the catalog page,
// noKeywords is a boolean value to check if page has available keywords
CatalogPage.prototype.verifyRecordFilters = function(browser, noKeywords) {
    var cp = this;
    browser.expect.element(this.recordFiltersCssSelector).to.be.present;
    browser.expect.elements(this.recordFiltersCssSelector + ' div.filter-container span.ng-binding').count.to.equal(2);

    browser.globals.generalUtils.getAllElementsTextValues(browser, 'xpath', this.createRecordFiltersXPathSelector('Record Type'))
        .then(function(values) {
            // order of record types can be different sometimes, so sort array of values
            browser.assert.equal(values.sort(), cp.recordTypeFilters.join(','))
        });

    browser.globals.generalUtils.getAllElementsTextValues(browser, 'css selector', this.recordFiltersCssSelector + ' div.filter-container span.ng-binding')
        .then(function(values) {
            browser.assert.equal(values, 'Record Type,Keywords')
        });

    if (noKeywords) {
        browser.expect.element(this.recordFiltersCssSelector + ' info-message p').text.to.contain('No Keywords available');
    } else {
        browser.expect.element(this.recordFiltersCssSelector + ' info-message p').to.not.be.present;
    }

};

CatalogPage.prototype.verifyRecordList = function(browser) {
    browser.expect.element(this.recordsViewCssSelector + ' div.col.d-flex.flex-column').to.be.present;
    browser.expect.element(this.recordsViewCssSelector + ' div.col.d-flex.flex-column paging').to.be.present;
};

// searchRecords is used to search page give searchObj object
CatalogPage.prototype.searchRecords = function(browser, searchObj) {
    browser
        .waitForElementVisible(this.recordsViewSearchBarCssSelector)
        .clearValue(this.recordsViewSearchBarCssSelector);

    if('order' in searchObj) {
        browser
            .waitForElementVisible(this.recordsViewCssSelector + ' form sort-options select')
            .setValue(this.recordsViewCssSelector + ' form sort-options select', searchObj.order)
    }

    if('searchText' in searchObj) {
        browser
           .waitForElementVisible(this.recordsViewSearchBarCssSelector)
           .setValue(this.recordsViewSearchBarCssSelector, [searchObj.searchText, browser.Keys.ENTER])
           .waitForElementNotPresent('div.spinner');
    } else {
        browser
           .waitForElementVisible(this.recordsViewSearchBarCssSelector)
           .setValue(this.recordsViewSearchBarCssSelector, [searchObj.searchText, browser.Keys.ENTER])
           .waitForElementNotPresent('div.spinner');
    }

    var recordTypeFilterXPathSelector = this.createRecordFiltersXPathSelector('Record Type', 'Versioned Record');
    browser.assert.elementPresent({ selector: recordTypeFilterXPathSelector, locateStrategy: 'xpath' });
    browser.click('xpath', recordTypeFilterXPathSelector, function(result) { this.assert.strictEqual(result.status, 0) })
        .waitForElementNotPresent('div.spinner');
};

CatalogPage.prototype.assertRecordList = function(browser, recordList) {
    if (recordList) {
      browser.globals.generalUtils.getAllElementsTextValues(browser, 'css selector', this.recordsViewCssSelector + ' record-card h5 span')
            .then(function(values) {
                browser.assert.equal(values, recordList)
            });
    } else {
        browser.waitForElementVisible(this.recordsViewCssSelector + ' div.results-list info-message');
        browser.expect.element(this.recordsViewCssSelector + ' div.results-list info-message p').text.to.contain('No records found');
    }
};

var catalogPage = new CatalogPage();

module.exports = {
    '@tags': ['sanity', "catalog"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, CatalogOnto1, CatalogOnto2, CatalogOnto3, CatalogOnto4)
    },

    'Step 3: Switch to catalog page' : function(browser) {
        browser.globals.generalUtils.switchToPage(browser, 'catalog', this.recordsViewCssSelector);
        catalogPage.verifyRecordFilters(browser, true);
        catalogPage.verifyRecordList(browser);
    },

    'Step 4: Search catalog page Empty' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'does-not-exist-record', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, null);
    },

    'Step 5: Search catalog page ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-1.ttl,z-catalog-ontology-2.ttl,z-catalog-ontology-3.ttl,z-catalog-ontology-4.ttl,z-catalog-ontology-9p.ttl');
    },

    'Step 6: Search catalog page DESC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (desc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-9p.ttl,z-catalog-ontology-4.ttl,z-catalog-ontology-3.ttl,z-catalog-ontology-2.ttl,z-catalog-ontology-1.ttl');
    },

    'Step 7: Search catalog page one item ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-1', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-1.ttl');
    },

    'Step 8: Click on z-catalog-ontology-9p.ttl and see if modified date is updated' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (desc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-9p.ttl,z-catalog-ontology-4.ttl,z-catalog-ontology-3.ttl,z-catalog-ontology-2.ttl,z-catalog-ontology-1.ttl');
        catalogPage.openRecordItem(browser, 'z-catalog-ontology-9p.ttl');
        catalogPage.changeRecordDescription(browser, 'z-catalog-ontology-9p.ttl', 'new description')
        browser.expect.element({
            locateStrategy: 'xpath',
            selector: '//catalog-page//record-view//div[contains(@class, "record-sidebar")]//dd[contains(@class, "ng-binding")][1]'}).text.to.not.contain('5/27/21 1:12 PM');
    }

}
