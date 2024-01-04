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
var adminUsername = 'admin'
var adminPassword = 'admin'
var CatalogOnto1 = process.cwd()+ '/src/test/resources/rdf_files/z-catalog-ontology-1.ttl'
var CatalogOnto2 = process.cwd()+ '/src/test/resources/rdf_files/z-catalog-ontology-2.ttl'
var CatalogOnto3 = process.cwd()+ '/src/test/resources/rdf_files/z-catalog-ontology-3.ttl'
var CatalogOnto4 = process.cwd()+ '/src/test/resources/rdf_files/z-catalog-ontology-4.ttl'

var catalogPage = require('../js/zCatalogPage').catalogPage;

var newUser = { 
    'username': 'newUser1', 
    'password': 'test',
    'firstName': 'firstTester', 
    'lastName': 'lastTester', 
    'email': 'test@gmail.com', 
    'role': 'admin' 
};

var keywordsList = ['1', '1,1', '1\'1', '1"1', 'keyword2', '\\/', '/\\' ];

module.exports = {
    '@tags': ['sanity', "catalog"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, CatalogOnto1, CatalogOnto2, CatalogOnto3, CatalogOnto4)
    },

    'Step 3: Switch to catalog page' : function(browser) {
        browser.globals.switchToPage(browser, 'catalog', this.recordsViewCssSelector)
        catalogPage.verifyRecordFilters(browser, true)
        catalogPage.verifyRecordList(browser);
    },

    'Step 4: Search catalog page Empty' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'does-not-exist-record', order: 'Title (asc)'})
        catalogPage.assertRecordList(browser, null);
    },

    'Step 5: Search catalog page ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-1,z-catalog-ontology-2,z-catalog-ontology-3,z-catalog-ontology-4,z-catalog-ontology-9p.ttl');
        
    },

    'Step 6: Search catalog page DESC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (desc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-9p.ttl,z-catalog-ontology-4,z-catalog-ontology-3,z-catalog-ontology-2,z-catalog-ontology-1');
        
    },

    'Step 7: Search catalog page one item ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-1', order: 'Title (asc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-1');
        
    },

    'Step 8: Check metadata of z-catalog-ontology-9p.ttl' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (desc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-9p.ttl,z-catalog-ontology-4,z-catalog-ontology-3,z-catalog-ontology-2,z-catalog-ontology-1');
        catalogPage.openRecordItem(browser, 'z-catalog-ontology-9p.ttl');
        catalogPage.changeRecordFields(browser, 'z-catalog-ontology-9p.ttl', {'description': 'new description', 'keywords': keywordsList});

        browser.expect.element('//catalog-page//record-view//div[contains(@class,"record-sidebar")]//dd[2]', 'xpath').text.to.not.contain('5/27/21 1:12 PM')

        catalogPage.leaveCatalogRecord(browser);
    },

    'Step 9: Check metadata of z-catalog-ontology-1' : function(browser) {
        // browser.waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (desc)'});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-9p.ttl,z-catalog-ontology-4,z-catalog-ontology-3,z-catalog-ontology-2,z-catalog-ontology-1')
        catalogPage.openRecordItem(browser, 'z-catalog-ontology-1');

        browser.useCss()
        browser.expect.element('catalog-page record-view div.record-sidebar manage-record-button button').to.be.present;
        browser
            .useXpath()
            .click('//record-view-tabset//mat-tab-header//div[contains(@class,"mat-tab-label-content")][text()[contains(.,"Branches")]]')
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .useXpath()
            .waitForElementVisible('//record-view//entity-publisher//span[text()[contains(.,"admin")]]')
            .useCss();

        catalogPage.leaveCatalogRecord(browser);
    },

    'Step 10: Search catalog page one item ASC' : function(browser) {
        catalogPage.searchRecords(browser, { searchText : 'z-catalog-ontology-', order: 'Title (asc)', keywords: ['1,1','1\'1', '\\/', '/\\']});
        catalogPage.assertRecordList(browser, 'z-catalog-ontology-9p.ttl');
    },

    'Step 11: The user clicks on the Administration sidebar link' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]");
    },

    'Step 12: A new user is created' : function(browser) {
        browser
            .waitForElementVisible("//button/span[text() [contains(., 'Create User')]]")
            .click("//button/span[text() [contains(., 'Create User')]]")
            .waitForElementVisible("//h1[text() [contains(., 'Create User')]]")
            .useCss()
            .waitForElementVisible("create-user-overlay input[name=unmaskPassword]")
            .click('create-user-overlay input[name=username]')
            .setValue('create-user-overlay input[name=username]', newUser.username)
            .click('create-user-overlay input[name=unmaskPassword]')
            .setValue('create-user-overlay input[name=unmaskPassword]', newUser.password)
            .click('create-user-overlay input[name=firstName]')
            .setValue('create-user-overlay input[name=firstName]', newUser.firstName)
            .click('create-user-overlay input[name=lastName]')
            .setValue('create-user-overlay input[name=lastName]', newUser.lastName)
            .click('create-user-overlay input[name=email]')
            .setValue('create-user-overlay input[name=email]', newUser.email)
            .click('label.mat-slide-toggle-label')
            .useXpath()
            .click("//button/span[text() [contains(., 'Submit')]]")
            .waitForElementNotPresent('create-user-overlay')
            .assert.not.elementPresent("//button/span[text() [contains(., 'Submit')]]");
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 13: The user successfully logs out' : function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .assert.visible('//div[@class="form-group"]//input[@id="username"]')
            .assert.visible('//div[@class="form-group"]//input[@id="password"]');
    },

    'Step 14: Test logins as the newly created user' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', newUser.username )
            .setValue('//div[@class="form-group"]//input[@id="password"]', newUser.password )
            .click('//button[@type="submit"]');
    },

    'Step 15: check for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 16: Switch to catalog page' : function(browser) {
        browser
            .click('sidebar div ul a[class=nav-link][href="#/catalog"]')
            .waitForElementNotPresent('#spinner-full')
        catalogPage.openRecordItem(browser, 'z-catalog-ontology-1');
        browser.assert.not.elementPresent('catalog-page record-view div.record-sidebar manage-record-button button');
    }

}
