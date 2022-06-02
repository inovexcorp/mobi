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
            .waitForElementVisible("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
            .click("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
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
            .click("//button/span[text() [contains(., 'Submit')]]")
            .assert.not.elementPresent("//button/span[text() [contains(., 'Submit')]]")
    },

    'Step 5: The new user is displayed in users list' : function(browser) {
        browser
            .useXpath()
            .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
                "[contains(., '" + newUser.firstName + "')]]", "new user is displayed")
    },

    'Step 6: The user clicks logout' : function(browser) {
        browser
            .pause(2000)
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
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
            .waitForElementNotPresent('div.spinner')
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
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible('div.btn-container button')
            .useXpath()
            .waitForElementVisible('//button[text()="New Ontology"]')
            .click('//button[text()="New Ontology"]')
            .useCss()
            .waitForElementVisible('new-ontology-overlay text-input[display-text="\'Title\'"] input')
            .setValue('new-ontology-overlay text-input[display-text="\'Title\'"] input', 'testOntology')
            .waitForElementVisible('new-ontology-overlay text-area[display-text="\'Description\'"] textarea')
            .setValue('new-ontology-overlay text-area[display-text="\'Description\'"] textarea', 'testDescription')
            .useXpath()
            .click('//new-ontology-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay .modal-header h3')
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
            .useXpath()
            .click('//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .click('xpath', '//search-bar')
            .keys("testOntology")
            .keys(browser.Keys.ENTER)
            .waitForElementNotPresent('css selector', 'div.spinner')
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "TestOntology")]')
            .click('css selector', 'div.action-menu.dropdown')
            .assert.visible('//div//div[contains(@class, "action-menu")]//i[contains(@class, "fa-lock")]')
    }

}
