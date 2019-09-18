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
var adminUsername = "admin"
var adminPassword = "admin"
var newUsername = "newUser"
var newUserPassword = "test"
var newName = "tester"
var newUserRole = "admin"

module.exports = {
    '@tags': ['mobi', 'administration', 'sanity'],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:8443/mobi/index.html#/home')
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
            .waitForElementVisible("//button[text() [contains(., 'Create User')]]")
            .click("//button[text() [contains(., 'Create User')]]")
            .useCss()
            .setValue('input[name=username]', newUsername )
            .setValue('input[name=password]', newUserPassword )
            .setValue('input[name=confirmPassword]', newUserPassword )
            .setValue('input[name=firstName]', '' + newName )
            .setValue('input[name=lastName]', 'testerly')
            .setValue('input[name=email]', 'test@gmail.com')

        if (newUserRole == "admin"){
            browser.click("input[type='checkbox']")
        }

        browser
            .useXpath()
            .click("//button[text() [contains(., 'Submit')]]")
            .waitForElementNotVisible("//button[text() [contains(., 'Submit')]]")
    },

    'Step 5: The new user is displayed in users list' : function(browser) {
        browser
            .useXpath()
            .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() [contains(., '" + newName + "')]]", "new user is displayed")
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
            .setValue('//div[@class="form-group"]//input[@id="username"]', newUsername )
            .setValue('//div[@class="form-group"]//input[@id="password"]', newUserPassword )
            .click('//button[@type="submit"]')
    },

    'Step 8: check for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 9: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useXpath()
            .assert.visible('//a[@class="current-user-box p-2 my-2 text-truncate"]')
            .getText('//a[@class="current-user-box p-2 my-2 text-truncate"]', function(result) {browser.assert.ok(result.value == newName)})
    },

    'Step 10: The user clicks logout' : function(browser) {
        browser
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
    }
}
