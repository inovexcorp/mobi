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
var Onto1 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-3.ttl'


var getAllElementsTextValues = function(browser, selector, target){

    var myPromiseAll = function(browser, result){
        var elementIdTextPromise = function(elementId){
            return new Promise(function(resolve, reject) {
               browser.elementIdText(elementId, function(a){ resolve(a.value) } );
           });
        };

        return new Promise(function(resolve, reject) {
           var elementIdTextPromises = result.value.map(function(webElement){ return elementIdTextPromise(webElement.ELEMENT) });
           Promise.all(elementIdTextPromises)
            .then(function(values) { resolve(values) });
       });
    };

    return new Promise(function(resolve, reject) {
         browser.elements(selector, target, function(result){
                var api = this;
                myPromiseAll(browser, result)
                    .then(function(values){ resolve(values) });
            });
    });
};


var CatalogUtils = function(){};

CatalogUtils.prototype.switchToPage = function(browser, page){
    browser
      .click('sidebar div ul a[class=nav-link][href="#/' + page + '"]')
      .waitForElementNotPresent('div.spinner');
};

CatalogUtils.prototype.verifyRecordFilters = function(browser, noKeywords) {
    browser.expect.element('catalog-page records-view record-filters').to.be.present;
    browser.expect.elements('catalog-page records-view record-filters div.filter-container span.ng-binding').count.to.equal(2);

    getAllElementsTextValues(browser, 'css selector', 'catalog-page records-view record-filters div.filter-container span.ng-binding')
        .then(function(values){
            browser.assert.equal(values, 'Record Type,Keywords')
        });

    if (noKeywords) {
        browser.expect.element('catalog-page records-view record-filters info-message p').text.to.contain('No Keywords available');
    } else {
        browser.expect.element('catalog-page records-view record-filters info-message p').to.not.be.present;
    }
};

CatalogUtils.prototype.verifyRecordList = function(browser) {
    browser.expect.element('catalog-page records-view div.col.d-flex.flex-column').to.be.present;
    browser.expect.element('catalog-page records-view div.col.d-flex.flex-column paging').to.be.present;
};

CatalogUtils.prototype.switchToCatalogPage = function(browser, noKeywords) {
    this.switchToPage(browser, 'catalog');
    browser.waitForElementVisible('catalog-page records-view');
    this.verifyRecordFilters(browser, noKeywords);
    this.verifyRecordList(browser);
};

CatalogUtils.prototype.searchRecords = function(browser, searchObj) {
    browser
       .clearValue('records-view search-bar input')
       .setValue('records-view search-bar input', searchObj.searchText)
       .keys(browser.Keys.ENTER)
       .waitForElementNotPresent('div.spinner');
};

CatalogUtils.prototype.assertNoRecords = function(browser, exist) {
    browser.waitForElementVisible('catalog-page records-view div.results-list info-message');
    browser.expect.element('catalog-page records-view div.results-list info-message p').text.to.contain('No records found');
};

var cu = new CatalogUtils();

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1, Onto2, Onto3)
    },

    'Step 3: Switch to catalog page' : function(browser) {
        cu.switchToCatalogPage(browser, true);
    },

    'Step 4: Search catalog page' : function(browser) {
        cu.searchRecords(browser, { searchText : "does-not-exist-record" });
        cu.assertNoRecords(browser, true);
        cu.searchRecords(browser, { searchText : "" });
    },

    'Step 5: Switch to catalog page to see if previous selected filters are selected' : function(browser) {
        cu.switchToPage(browser, "home");
        cu.switchToCatalogPage(browser, true);
    },


}
