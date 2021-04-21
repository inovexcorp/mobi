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

var catalogUtils = {
    switchToCatalogPage: function(browser) {
        browser
          .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/catalog"]')
          .waitForElementNotPresent('div.spinner')
          .waitForElementVisible('.records-view');
    },
    searchRecords: function(browser, searchObj) {
        browser.setValue('records-view search-bar input', searchObj.searchText)
           .keys(browser.Keys.ENTER)
           .waitForElementNotPresent('div.spinner');
    },
    assertNoRecords: function(browser) {
        browser.waitForElementVisible({
            locateStrategy: 'xpath',
            selector: '//div[contains(@class, "records-view")]//div[contains(@class, "results-list")]//info-message'});
            // [text()[contains(., "No records found")]]'});
    }
}

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1, Onto2, Onto3)
    },

    'Step 3: Switch to catalog page' : function(browser) {
        catalogUtils.switchToCatalogPage(browser);
    },

    'Step 4: Search catalog page' : function(browser) {
        catalogUtils.searchRecords(browser, { searchText : "does-not-exist-record" });
        catalogUtils.assertNoRecords(browser);
//        browser.waitForElementPresent('div.spinner');
    }

}
