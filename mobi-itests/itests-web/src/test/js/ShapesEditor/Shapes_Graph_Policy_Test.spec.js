/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
var path = require('path');
var newUser = {
    username: 'newUserB',
    password: 'testB',
    firstName: 'firstTesterA',
    lastName: 'lastTesterA',
    email: 'testA@gmail.com'
};
var shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/semops_shapes.ttl');

module.exports = {
    '@tags': ['shapes-editor', 'shapes-editor-policy'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword)
    },

    'Step 2: Navigate to the Shapes Graph Editor': function(browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page');
    },

    'Step 3: Create a new shapes graph': function(browser) {
        browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph)
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.dismiss_toast(browser);
    },

    'Step 4: Verify shapes graph presentation': function(browser) {
        browser
            .waitForElementVisible('selected-details')
            .waitForElementVisible('properties-block')
            .waitForElementVisible('div.yate')
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'semops_shapes')
            .assert.valueEquals('@editorBranchSelectInput', 'MASTER')
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3)
    },

    'Step 5: Create a new branch': function(browser) {
        browser.page.shapesEditorPage().createBranch('Sem Ops Branch');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Verify switching of branches': function(browser) {
        browser
            .waitForElementVisible('selected-details')
            .waitForElementVisible('properties-block')
            .waitForElementVisible('div.yate')
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'semops_shapes')
            .assert.valueEquals('@editorBranchSelectInput', 'Sem Ops Branch')
        browser
            .page.shapesEditorPage()
            .expect.elements('@propertyValues').count.to.equal(3)
    },

    'Step 7: The admin user clicks on the Administration sidebar link' : function(browser) {
        browser.globals.switchToPage(browser, 'user-management')
    },

    'Step 8: A new user is created' : function(browser) {
        browser.page.administrationPage().createUser(newUser);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 9: The admin user clicks on the permissions tab' : function(browser) {
        browser.page.administrationPage().openPermissionsTab();
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 10: The admin user toggles off Create Shapes Graph permission' : function(browser) {
        browser.page.administrationPage().toggleEveryonePermission('Create Shapes Graph Record');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 11: The admin user clicks logout' : function(browser) {
        browser.globals.logout(browser)
    },

    'Step 12: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, newUser.username, newUser.password)
    },

    'Step 13: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 14: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.containsText('a.current-user-box div.user-title', newUser.firstName)
    },

    'Step 15: Navigate to shapes graph editor' : function(browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page')
    },

    'Step 16: Assert Create Shapes graph button is disabled' : function(browser) {
        browser.page.shapesEditorPage().openRecordSelect();
        browser.page.editorPage().useCss()
            .waitForElementVisible('@createRecordButton')
            .waitForElementVisible('@uploadRecordButton')
            .assert.not.enabled('@createRecordButton')
            .assert.not.enabled('@uploadRecordButton')
    },

    'Step 17: Assert Delete Shapes graph button is disabled' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "semops_shapes")]]/following::button[contains(@class,"delete-record")][@disabled]')
    },

    'Step 18: Open Shapes Graph' : function(browser) {
        browser.page.shapesEditorPage().openShapesGraph('semops_shapes');
    },

    'Step 19: Verify the correct buttons are disabled' : function(browser) {
        browser
            .page.editorPage()
            .waitForElementVisible('@createBranchButton')
            .assert.enabled('@createBranchButton')
            .assert.not.enabled('@mergeBranchesButton')
            .assert.enabled('@createTagButton')
            .assert.enabled('@downloadButton')
            .assert.not.enabled('@uploadChangesButton')
    },

    'Step 20: The user clicks logout' : function(browser) {
        browser.globals.logout(browser)
    },

    'Step 21: The admin user logs in' : function(browser) {
        browser.globals.login(browser, 'admin', 'admin')
    },

    'Step 22: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 23: The admin user navigates to the catalog page' : function(browser) {
        browser.globals.switchToPage(browser, 'catalog')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 24: The admin user removes modify permission for the shapes graph record' : function(browser) {
        browser.page.catalogPage().applySearchText('semops_shapes');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.catalogPage().assertRecordVisible('semops_shapes', 1);
        browser.page.catalogPage().openRecordItem('semops_shapes');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.catalogPage().openManage('semops_shapes');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.catalogPage().toggleRecordEveryonePermission('Modify Record');
        browser.globals.dismiss_toast(browser);
    },

    'Step 25: The admin user clicks logout' : function(browser) {
        browser.globals.logout(browser)
    },

    'Step 26: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, newUser.username, newUser.password)
    },

    'Step 27: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 28: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.textContains('a.current-user-box div.user-title', newUser.firstName)
    },

    'Step 29: Navigate to shapes graph editor' : function(browser) {
        browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page');
    },

    'Step 30: Open Shapes Graph' : function(browser) {
        browser.page.shapesEditorPage().openShapesGraph('semops_shapes');
    },

    'Step 31: Verify the correct buttons are disabled' : function(browser) {
        browser
            .page.editorPage()
            .waitForElementVisible('@createBranchButton')
            .assert.not.enabled('@createBranchButton')
            .assert.not.enabled('@mergeBranchesButton')
            .assert.not.enabled('@createTagButton')
            .assert.enabled('@downloadButton')
            .assert.not.enabled('@uploadChangesButton')
    }
}
