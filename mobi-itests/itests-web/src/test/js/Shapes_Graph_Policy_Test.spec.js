
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
var adminUsername = 'admin'
var adminPassword = 'admin'
var newUser = { 'username': 'newUserB', 'password': 'testB',
    'firstName': 'firstTesterA', 'lastName': 'lastTesterA', 'email': 'testA@gmail.com' };

module.exports = {
    '@tags': ['ontology-editor', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: The admin user clicks on the Administration sidebar link' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
            .click("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
    },

    'Step 3: A new user is created' : function(browser) {
        browser
            .waitForElementVisible("//button/span[text() [contains(., 'Create User')]]")
            .click("//button/span[text() [contains(., 'Create User')]]")
            .waitForElementVisible("//h1[text() [contains(., 'Create User')]]")
            .useCss()
            .setValue('input[name=username]', newUser.username)
            .setValue('input[name=unmaskPassword]', newUser.password)
            .setValue('input[name=firstName]', newUser.firstName)
            .setValue('input[name=lastName]', newUser.lastName)
            .setValue('input[name=email]', newUser.email)
            .click('label.mat-slide-toggle-label')
            .useXpath()
            .click("//button/span[text() [contains(., 'Submit')]]")
            .assert.not.elementPresent("//button/span[text() [contains(., 'Submit')]]")
    },

    'Step 4: The new user is displayed in users list' : function(browser) {
        browser
            .useXpath()
            .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
                "[contains(., '" + newUser.firstName + "')]]", "new user is displayed")
    },

    'Step 5: The admin user clicks on the permissions tab' : function(browser) {
        browser
            .click("//*[@id='mat-tab-label-0-2']/div")
    },

    'Step 6: The admin user toggles off Create Shapes Graph permission' : function(browser) {
        browser
            .waitForElementVisible('//mat-slide-toggle[1]')
            .click('//mat-slide-toggle[1]')
            .useCss()
            .waitForElementVisible('.save-container')
            .click('.save-container')
    },
    
    'Step 7: The admin user clicks logout' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
    },
    
    'Step 8: Test logins as the newly created user' : function(browser) {
        browser
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', newUser.username )
            .setValue('//div[@class="form-group"]//input[@id="password"]', newUser.password )
            .click('//button[@type="submit"]')
    },
    
    'Step 9: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },
    
    'Step 10: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.containsText('a.current-user-box div.user-title', newUser.firstName)
    },

    'Step 11: Navigate to shapes graph editor' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//a[starts-with(@href, '#/shapes-graph-editor')][1]")
            .click("//a[starts-with(@href, '#/shapes-graph-editor')][1]")
    },

    'Step 12: Assert button is disabled' : function(browser) {
        browser
            .waitForElementVisible('//mat-form-field/div/div[1]/div[2]/mat-icon')
            .click('//mat-form-field/div/div[1]/div[2]/mat-icon')
            .waitForElementVisible('//span[@class="mat-option-text"]/span/button')
            .assert.not.enabled('//span[@class="mat-option-text"]/span/button')
    }

}