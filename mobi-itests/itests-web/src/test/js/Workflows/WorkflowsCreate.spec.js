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
var path = require('path');
var adminUsername = 'admin'
var adminPassword = 'admin'

var user01 = {
    'username': 'SHICKS', 
    'password': 'sean',
    'firstName': 'sean', 
    'lastName': 'hicks', 
    'email': 'sean.hicks@inovexcorp.com', 
    'role': 'user' 
};

var badWorkflowFile = path.resolve(__dirname + '/../../resources/rdf_files/invalid-workflow.ttl' ); // has workflow def issue
var validWorkflowFile = path.resolve(__dirname + '/../../resources/rdf_files/test-workflow.ttl');

module.exports = {
    '@tags': ['sanity', 'workflows'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword),
        browser.globals.switchToPage(browser, 'user-management'),
        browser.page.administrationPage().createUser(user01),
        browser.page.administrationPage().toggleWorkflowCreatePermission();
    },
    'Step 2: Navigate to Workflows page' : function(browser) {
        browser.globals.switchToPage(browser, 'workflows');
    },
    'Step 3: Create two workflows' : function(browser) {
        browser.page.workflowsPage().createWorkflow('SeansWorkflowCreateTest1').returnToLanding();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().createWorkflow('SeansWorkflowCreateTest2').returnToLanding();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage()
            .useCss()
            .assert.not.attributeEquals('@createWorkflowButton', 'disabled', 'true')
        browser.page.workflowsPage().searchWorkflows('SeansWorkflowCreateTest');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(2);
    },
    'Step 4: Logout and Login as new user without create permissions' : function(browser) {
        browser.globals.logout(browser),
        browser.globals.login(browser, user01.username, user01.password);
    },
    'Step 5: Assert that the new user cannot create a new workflow' : function(browser) {
        browser.globals.switchToPage(browser, 'workflows');
        browser.page.workflowsPage().useCss()
          .assert.attributeEquals('@createWorkflowButton', 'disabled', 'true')
          .assert.attributeEquals('@uploadWorkflowButton', 'disabled', 'true');
    },
    'Step 6: Verify upload new workflow functionality': function(browser) {
        browser.globals.logout(browser);
        browser.globals.login(browser, adminUsername, adminPassword);
        browser.globals.switchToPage(browser, 'workflows');
        browser.page.workflowsPage().useCss()
            .assert.visible('@uploadWorkflowButton')
            .click('@uploadWorkflowButton');
        browser.useCss()
            .uploadFile('input[type=file]', badWorkflowFile)
            .waitForElementVisible('mat-dialog-container')
            .click('mat-dialog-container .mat-dialog-actions > button:nth-child(2)')
            .assert.visible('mat-dialog-container error-display')
            .click('mat-dialog-container .mat-dialog-actions > button:nth-child(1)');
        browser.page.workflowsPage().useCss()
            .click('@uploadWorkflowButton');
        browser.useCss()
            .uploadFile('input[type=file]', validWorkflowFile)
            .waitForElementVisible('mat-dialog-container')
            .click('mat-dialog-container .mat-dialog-actions > button:nth-child(2)');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .assert.visible('app-workflow-record')
    }
}
