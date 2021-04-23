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
    this.recordViewSelector = 'catalog-page records-view';
    this.recordFiltersSelector = 'catalog-page records-view record-filters';

    this.recordTypeFilters = ['Dataset Record','Mapping Record','Ontology Record','Record',
        'Unversioned Record','Versioned RDF Record','Versioned Record']
};

CatalogPage.prototype.createRecordFiltersSelector = function(filterTypeHeader, filterType) {
    var selectors = ['//catalog-page',
        '//records-view','//record-filters','//div[contains(@class, "filter-container")]',
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
}

CatalogPage.prototype.verifyRecordFilters = function(browser, noKeywords) {
    var cp = this;
    browser.expect.element(this.recordFiltersSelector).to.be.present;
    browser.expect.elements(this.recordFiltersSelector + ' div.filter-container span.ng-binding').count.to.equal(2);

    browser.globals.generalUtils.getAllElementsTextValues(browser, 'xpath', this.createRecordFiltersSelector('Record Type'))
        .then(function(values) {
            // order of record types can be different sometimes, so sort array of values
            browser.assert.equal(values.sort(), cp.recordTypeFilters.join(','))
        });

    browser.globals.generalUtils.getAllElementsTextValues(browser, 'css selector', this.recordFiltersSelector + ' div.filter-container span.ng-binding')
        .then(function(values) {
            browser.assert.equal(values, 'Record Type,Keywords')
        });

    if (noKeywords) {
        browser.expect.element(this.recordFiltersSelector + ' info-message p').text.to.contain('No Keywords available');
    } else {
        browser.expect.element(this.recordFiltersSelector + ' info-message p').to.not.be.present;
    }

};

CatalogPage.prototype.verifyRecordList = function(browser) {
    browser.expect.element(this.recordViewSelector + ' div.col.d-flex.flex-column').to.be.present;
    browser.expect.element(this.recordViewSelector + ' div.col.d-flex.flex-column paging').to.be.present;
};

CatalogPage.prototype.searchRecords = function(browser, searchObj) {
    browser
       .clearValue(this.recordViewSelector + ' search-bar input')

    if('order' in searchObj) {
        browser
            .setValue(this.recordViewSelector + ' form sort-options select', searchObj.order)
    }

    if('searchText' in searchObj) {
        browser
           .setValue(this.recordViewSelector + ' search-bar input', searchObj.searchText)
           .keys(browser.Keys.ENTER)
           .waitForElementNotPresent('div.spinner');
    } else {
        browser
           .setValue(this.recordViewSelector + ' search-bar input', '')
           .keys(browser.Keys.ENTER)
           .waitForElementNotPresent('div.spinner');
    }

    var recordTypeFilterSelector = this.createRecordFiltersSelector('Record Type', 'Versioned Record');
    browser.assert.elementPresent({ selector: recordTypeFilterSelector, locateStrategy: 'xpath' });
    browser
        .click('xpath', recordTypeFilterSelector)
        .waitForElementNotPresent('div.spinner');

};

CatalogPage.prototype.assertRecordList = function(browser, recordList) {
    if (recordList) {
      browser.globals.generalUtils.getAllElementsTextValues(browser, 'css selector', this.recordViewSelector + ' record-card h5 span')
            .then(function(values) {
                browser.assert.equal(values, recordList)
            });
    } else {
        browser.waitForElementVisible(this.recordViewSelector + ' div.results-list info-message');
        browser.expect.element(this.recordViewSelector + ' div.results-list info-message p').text.to.contain('No records found');
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
        browser.globals.generalUtils.switchToPage(browser, 'catalog', this.recordViewSelector);
        catalogPage.verifyRecordFilters(browser, true);
        catalogPage.verifyRecordList(browser);
    },

    'Step 4: Search catalog page Empty' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'does-not-exist-record', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, null);
    },

    'Step 5: Search catalog page ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-1.ttl,z-catalog-ontology-2.ttl,z-catalog-ontology-3.ttl,z-catalog-ontology-4.ttl');
    },

    'Step 6: Search catalog page DESC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (desc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-4.ttl,z-catalog-ontology-3.ttl,z-catalog-ontology-2.ttl,z-catalog-ontology-1.ttl');
    },

    'Step 7: Search catalog page one item ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-1', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-1.ttl');
    },

    'Step Tear Down': function(browser) {
        browser.globals.generalUtils.switchToPage(browser, 'ontology-editor', 'ontology-editor-page')
    }
//    'Step 11: Switch to catalog page to see if previous selected filters are selected' : function(browser) {
//        browser.globals.generalUtils.switchToPage(browser, 'home', 'home-page');
//        browser.globals.generalUtils.switchToPage(browser, 'catalog', this.recordViewSelector);
//        catalogPage.verifyRecordFilters(browser, true);
//        catalogPage.verifyRecordList(browser);
//    },

}
