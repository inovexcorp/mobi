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

var user01 = {
    'username': 'SHICKS', 
    'password': 'sean',
    'firstName': 'sean', 
    'lastName': 'hicks', 
    'email': 'sean.hicks@inovexcorp.com', 
    'role': 'user' 
};

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
        browser.page.workflowsPage().createWorkflow('SeansWorkflowCreateTest1');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().createWorkflow('SeansWorkflowCreateTest2');
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
        browser.globals.switchToPage(browser, 'workflows'),
        browser.page.workflowsPage().useCss()
          .assert.attributeEquals('@createWorkflowButton', 'disabled', 'true');
    }
}
