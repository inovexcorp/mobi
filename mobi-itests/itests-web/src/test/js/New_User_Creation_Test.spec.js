/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
var adminUsername = "admin"
var adminPassword = "admin"

var newUser = { 'username': 'newUser', 'password': 'test',
    'firstName': 'firstTester', 'lastName': 'lastTester', 'email': 'test@gmail.com', 'role': 'admin' };

var newUserChanged = { 'firstName': 'fcTester', 'lastName': 'lcTester', 'email': 'testc@gmail.com', 'role': 'admin' };

var selectors = {
    'profileTabFirstName': '//settings-page//mat-tab-group//profile-tab//form//mat-form-field//input[@name="firstName"]',
    'profileTabLastName': '//settings-page//mat-tab-group//profile-tab//form//mat-form-field//input[@name="lastName"]',
    'profileTabEmail': '//settings-page//mat-tab-group//profile-tab//form//mat-form-field//input[@name="email"]',
};

var verifyProfileTab = function(browser, userObject){
    browser.useXpath().waitForElementVisible(selectors.profileTabFirstName)
    browser.assert.valueEquals(selectors.profileTabFirstName, userObject.firstName)
    browser.assert.valueEquals(selectors.profileTabLastName, userObject.lastName)
    browser.assert.valueEquals(selectors.profileTabEmail, userObject.email)
};

module.exports = {
    '@tags': ['login', 'administration', 'sanity'],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home')
            .useXpath()
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', adminUsername )
            .setValue('//div[@class="form-group"]//input[@id="password"]', adminPassword )
            .click('//button[@type="submit"]')
    },

    'Step 2: check for visibility of home page Element' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 3: The user clicks on the Administration sidebar link' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
    },

    'Step 4: A new user is created' : function(browser) {
        browser
            .waitForElementVisible("//button/span[text() [contains(., 'Create User')]]")
            .click("//button/span[text() [contains(., 'Create User')]]")
            .waitForElementVisible("//h1[text() [contains(., 'Create User')]]")
            .useCss()
            .setValue('create-user-overlay input[name=username]', newUser.username)
            .setValue('create-user-overlay input[name=unmaskPassword]', newUser.password)
            .setValue('create-user-overlay input[name=firstName]', newUser.firstName)
            .setValue('create-user-overlay input[name=lastName]', newUser.lastName)
            .setValue('create-user-overlay input[name=email]', newUser.email)
            .click('label.mat-slide-toggle-label')
            .useXpath()
            .click("//button/span[text() [contains(., 'Submit')]]");
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 5: The new user is displayed in users list' : function(browser) {
        browser
            .useXpath()
            .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
                "[contains(., '" + newUser.firstName + "')]]", "new user is displayed")
    },

    'Step 6: The user clicks logout' : function(browser) {
        browser
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
    },

    'Step 7: Test logins as the newly created user' : function(browser) {
        browser
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', newUser.username )
            .setValue('//div[@class="form-group"]//input[@id="password"]', newUser.password )
            .click('//button[@type="submit"]')
    },

    'Step 8: check for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 9: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.textContains('a.current-user-box div.user-title', newUser.firstName)
    },

    'Step 10: Go to profile tab and verify user info' : function(browser) {
        browser
            .useCss()
            .click('div.sidebar a.current-user-box')
            .waitForElementVisible('div.settings-page div.profile-tab')

        verifyProfileTab(browser, newUser)
    },

    'Step 11: Edit User ' : function(browser) {
        browser
            .useXpath()
            .clearValue(selectors.profileTabFirstName)
            .setValue(selectors.profileTabFirstName, newUserChanged.firstName )
            .clearValue(selectors.profileTabLastName)
            .setValue(selectors.profileTabLastName, newUserChanged.lastName)
            .clearValue(selectors.profileTabEmail)
            .setValue(selectors.profileTabEmail, newUserChanged.email )
            .click('//mat-tab-group//profile-tab//form//button[@type="submit"]')
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.textContains('a.current-user-box div.user-title', newUserChanged.firstName)

        verifyProfileTab(browser, newUserChanged)
    },

    'Step 12: The user successfully logs out' : function(browser) {
        browser
            .useXpath()
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
            .assert.visible('//div[@class="form-group"]//input[@id="username"]')
            .assert.visible('//div[@class="form-group"]//input[@id="password"]')
    },

    'Step 13: Test logins as the newly created user after name change' : function(browser) {
        browser
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', newUser.username)
            .setValue('//div[@class="form-group"]//input[@id="password"]', newUser.password)
            .click('//button[@type="submit"]')
    },

    'Step 14: Go to profile tab and verify user info' : function(browser) {
        browser
            .useCss()
            .click('div.sidebar a.current-user-box')
            .waitForElementVisible('div.settings-page div.profile-tab')

        verifyProfileTab(browser, newUserChanged)
    },

    'Step 15: The new user can create an ontology' : function(browser) {
        browser
            .useXpath()
            .click('//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementVisible('//span[text()="New Ontology"]/parent::button')
            .click('//span[text()="New Ontology"]/parent::button')
            .useCss()
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', 'testOntology')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', 'testDescription')
            .useXpath()
            .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay h1')
    },

    'Step 16: The user successfully logs out' : function(browser) {
        browser
            .useXpath()
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
            .assert.visible('//div[@class="form-group"]//input[@id="username"]')
            .assert.visible('//div[@class="form-group"]//input[@id="password"]')
    },

    'Step 17: The admin user logs in' : function(browser) {
        browser
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', adminUsername )
            .setValue('//div[@class="form-group"]//input[@id="password"]', adminPassword )
            .click('//button[@type="submit"]')
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 18: The admin user can manage the newly created ontology' : function(browser) {
        browser
            .click('sidebar div ul a[class=nav-link][href="#/catalog"]')
            .waitForElementNotPresent('#spinner-full')
            .setValue('catalog-page records-view .d-flex .search-form input','z-catalog-ontology-1')
            .sendKeys('catalog-page records-view .d-flex .search-form input', browser.Keys.ENTER)
            .waitForElementNotPresent('#spinner-full')
            .click('xpath', '//catalog-page//record-card//mat-card-title//span[text()[contains(., "z-catalog-ontology-1")]]//ancestor::mat-card')
            .waitForElementVisible('catalog-page record-view div.record-body')
            .expect.element('catalog-page record-view div.record-body h2.record-title div.inline-edit').text.to.contain('z-catalog-ontology-1');
        browser.assert.elementPresent('catalog-page record-view div.record-sidebar manage-record-button button');

    }

}