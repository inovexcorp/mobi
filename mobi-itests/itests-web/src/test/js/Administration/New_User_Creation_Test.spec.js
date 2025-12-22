/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

var newUser = {
    username: 'newUser',
    password: 'test',
    firstName: 'firstTester', 
    lastName: 'lastTester', 
    email: 'test@gmail.com',
    role: 'admin'
};

var newUserChanged = { 'firstName': 'fcTester', 'lastName': 'lcTester', 'email': 'testc@gmail.com', 'role': 'admin' };

module.exports = {
    '@tags': ['login', 'administration', 'sanity', 'new-user-creation'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
    },

    'Step 2: The user clicks on the Administration sidebar link' : function(browser) {
        browser.globals.switchToPage(browser, 'user-management');
    },

    'Step 3: A new user is created' : function(browser) {
        browser.page.administrationPage().createUser(newUser);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 4: The new user is displayed in users list' : function(browser) {
        browser.page.administrationPage().validateUserList(newUser.firstName);
    },

    'Step 5: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    'Step 6: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, newUser.username, newUser.password);
    },

    'Step 7: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.textContains('a.current-user-box div.user-title', newUser.firstName);
    },

    'Step 8: Go to profile tab and verify user info' : function(browser) {
        browser
            .useCss()
            .click('div.sidebar a.current-user-box')
            .waitForElementVisible('div.settings-page div.profile-tab');

        browser.page.myAccountPage().verifyProfileTab(newUser);
    },

    'Step 9: Edit User' : function(browser) {
        browser.page.myAccountPage().editProfileTab(newUserChanged);
        
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.textContains('a.current-user-box div.user-title', newUserChanged.firstName);

        browser.page.myAccountPage().verifyProfileTab(newUserChanged);
    },

    'Step 10: The user successfully logs out' : function(browser) {
        browser.globals.logout(browser);
    },

    'Step 11: Test logins as the newly created user after name change' : function(browser) {
        browser.globals.login(browser, newUser.username, newUser.password);
    },

    'Step 12: Go to profile tab and verify user info' : function(browser) {
        browser
            .useCss()
            .click('div.sidebar a.current-user-box')
            .waitForElementVisible('div.settings-page div.profile-tab');

        browser.page.myAccountPage().verifyProfileTab(newUserChanged);
    },

    'Step 13: The new user can create an ontology' : function(browser) {
        browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().createOntology('testOntology', 'testDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 14: The user successfully logs out' : function(browser) {
        browser.globals.logout(browser);
    },

    'Step 15: The admin user logs in' : function(browser) {
        browser.globals.login(browser, browser.globals.adminUsername, browser.globals.adminPassword);
    },

    'Step 16: The admin user can manage the newly created ontology' : function(browser) {
        browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.catalogPage().waitForElementPresent('@searchBar')
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText('testOntology');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.catalogPage().openRecordItem('testOntology');
        browser.globals.wait_for_no_spinners(browser);
        browser.assert.elementPresent('catalog-page record-view div.record-sidebar manage-record-button button');
    }
}
