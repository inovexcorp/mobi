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

var newUser = { 
    'username': 'newUser1', 
    'password': 'test',
    'firstName': 'firstTester', 
    'lastName': 'lastTester', 
    'email': 'test@gmail.com', 
    'role': 'admin' 
};

var recordTypeFilters = ['Dataset Record', 'Mapping Record', 'Ontology Record', 'Record', 'Shapes Graph Record',
    'Unversioned Record', 'Versioned RDF Record', 'Versioned Record', 'Workflow Record']

var keywordsList = ['1', '1,1', '1\'1', '1"1', 'keyword2', '\\/', '/\\' ];

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

module.exports = {
    '@tags': ['sanity', "catalog"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, CatalogOnto1, CatalogOnto2, CatalogOnto3, CatalogOnto4)
    },

    'Step 3: Switch to catalog page' : function(browser) {
        browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view')
        browser.page.catalogPage().waitForElementPresent('@filterSelector')
        browser.expect.elements('catalog-page records-view record-filters div.record-filters mat-expansion-panel-header mat-panel-title').count.to.equal(3);
        browser.expect.element('catalog-page records-view record-filters info-message p').text.to.contain('No Keywords available');
    },

    'Step 4: Verify Catalog Filters' : function(browser) {
        browser.useXpath()
        recordTypeFilters.forEach(function(type) {
            var filterCss = createRecordFiltersXPathSelector('Record Type', type);
            browser.assert.visible(filterCss);
        })
    },

    'Step 5: Verify Record List' : function(browser) {
        browser.useCss();
        browser.page.catalogPage().verifyRecordList();
    },

    'Step 6: Search catalog page Empty' : function(browser) {
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('does-not-exist-record');
        browser.page.catalogPage().applyOrderFilter('Title (asc)');
        browser.page.catalogPage().finishSearch();
        browser.waitForElementVisible('catalog-page records-view div.results-list info-message');
        browser.expect.element('catalog-page records-view div.results-list info-message p').text.to.contain('No records found');
    },

    'Step 7: Search catalog page ASC' : function(browser) {
        var recordTitles = ['z-catalog-ontology-1' , 'z-catalog-ontology-2' , 'z-catalog-ontology-3' , 'z-catalog-ontology-4' , 'z-catalog-ontology-9p.ttl']
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('z-catalog-ontology-');
        browser.page.catalogPage().applyOrderFilter('Title (asc)');
        browser.page.catalogPage().finishSearch();
        recordTitles.forEach(function(title, index) {
            browser.page.catalogPage().assertRecordVisible(title, index + 1)
        })
    },

    'Step 8: Search catalog page DESC' : function(browser) {
        var recordTitles = ['z-catalog-ontology-9p.ttl', 'z-catalog-ontology-4', 'z-catalog-ontology-3', 'z-catalog-ontology-2', 'z-catalog-ontology-1']
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('z-catalog-ontology-');
        browser.page.catalogPage().applyOrderFilter('Title (desc)');
        browser.page.catalogPage().finishSearch();
        recordTitles.forEach(function(title, index) {
            browser.page.catalogPage().assertRecordVisible(title, index + 1)
        })
    },

    'Step 9: Search catalog page one item ASC' : function(browser) {
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('z-catalog-ontology-1');
        browser.page.catalogPage().applyOrderFilter('Title (asc)');
        browser.page.catalogPage().finishSearch();
        browser.page.catalogPage().assertRecordVisible('z-catalog-ontology-1', 1);
    },

    'Step 10: Check metadata of z-catalog-ontology-9p.ttl' : function(browser) {
        var recordTitles = ['z-catalog-ontology-9p.ttl', 'z-catalog-ontology-4', 'z-catalog-ontology-3', 'z-catalog-ontology-2', 'z-catalog-ontology-1']
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('z-catalog-ontology-');
        browser.page.catalogPage().applyOrderFilter('Title (desc)');
        browser.page.catalogPage().finishSearch();
        recordTitles.forEach(function(title, index) {
            browser.page.catalogPage().assertRecordVisible(title, index + 1)
        })
        browser.page.catalogPage().openRecordItem('z-catalog-ontology-9p.ttl');
        browser.page.catalogPage().changeRecordFields('z-catalog-ontology-9p.ttl', {'description': 'new description', 'keywords': keywordsList});
        browser.expect.element('//catalog-page//record-view//div[contains(@class,"record-sidebar")]//dd[2]', 'xpath').text.to.not.contain('5/27/21 1:12 PM')
        browser.page.catalogPage().leaveCatalogRecord(browser);
    },

    'Step 11: Check metadata of z-catalog-ontology-1' : function(browser) {
        var recordTitles = ['z-catalog-ontology-9p.ttl', 'z-catalog-ontology-4', 'z-catalog-ontology-3', 'z-catalog-ontology-2', 'z-catalog-ontology-1']
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('z-catalog-ontology-');
        browser.page.catalogPage().applyOrderFilter('Title (desc)');
        browser.page.catalogPage().finishSearch();
        recordTitles.forEach(function(title, index) {
            browser.page.catalogPage().assertRecordVisible(title, index + 1)
        })
        browser.page.catalogPage().openRecordItem('z-catalog-ontology-1');
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
        browser.page.catalogPage().leaveCatalogRecord(browser);
    },

    'Step 12: Search catalog page one item ASC' : function(browser) {
        var keywords = ['1,1','1\'1', '\\/', '/\\'];
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('z-catalog-ontology-');
        browser.page.catalogPage().applyOrderFilter('Title (asc)');
        keywords.forEach(function(keyword) {
            browser.page.catalogPage().applyKeywordFilter(keyword);
        });
        browser.page.catalogPage().finishSearch();
        browser.page.catalogPage().assertRecordVisible('z-catalog-ontology-9p.ttl', 1);
    },

    'Step 13: The user clicks on the Administration sidebar link' : function(browser) {
        browser.globals.switchToPage(browser, 'user-management')
    },

    'Step 14: A new user is created' : function(browser) {
        browser
            .useXpath()
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

    'Step 15: The user successfully logs out' : function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .assert.visible('//div[@class="form-group"]//input[@id="username"]')
            .assert.visible('//div[@class="form-group"]//input[@id="password"]');
    },

    'Step 16: Test logins as the newly created user' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', newUser.username )
            .setValue('//div[@class="form-group"]//input[@id="password"]', newUser.password )
            .click('//button[@type="submit"]');
    },

    'Step 17: check for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 18: Switch to catalog page' : function(browser) {
        browser
            .click('sidebar div ul a[class=nav-link][href="#/catalog"]')
            .waitForElementNotPresent('#spinner-full')
        browser.page.catalogPage().openRecordItem('z-catalog-ontology-1');
        browser.assert.not.elementPresent('catalog-page record-view div.record-sidebar manage-record-button button');
    }

}
