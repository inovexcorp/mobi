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
var badWorkflowFile = path.resolve(__dirname + '/../../resources/rdf_files/invalid-workflow.ttl');  // has workflow def issue
var validWorkflowFile = path.resolve(__dirname + '/../../resources/rdf_files/test-workflow.ttl');

var adminUsername = 'admin';
var adminPassword = 'admin';

var newUser = { 'username': 'test', 'password': 'test',
    'firstName': 'Johnny', 'lastName': 'Test', 'email': 'test@gmail.com', 'role': 'admin' };

module.exports = {
    '@tags': ['sanity', 'workflows'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
    },
    'Step 2: Navigate to Workflows page' : function(browser) {
        browser.globals.switchToPage(browser, 'workflows', 'app-workflow-records');
    },
    'Step 3: Validate Workflow Search/Filter elements': function(browser) {
        browser.page.workflowsPage().useCss()
            .assert.visible('@workflowSearchText')
            .assert.visible('@workflowStatusFilter')
            .assert.visible('@workflowTimeRangeFilter');
    },
    'Step 4: Validate Pagination and Table not shown': function(browser) {
        browser.useCss()
            .assert.not.elementPresent('mat-paginator')
            .assert.not.elementPresent('app-workflow-records table');
    },
    'Step 5: Create Workflows': function(browser) {
        for (var i = 1; i <= 25; i++) {
            browser.page.workflowsPage().createWorkflow('Workflow' + i)
                .returnToLanding();
            browser.globals.wait_for_no_spinners(browser);
        }
    },
    'Step 6: Validate Pagination visible': function(browser) {
        browser.useCss()
            .assert.visible('mat-paginator')
            .page.workflowsPage()
            .assert.visible('@workflowsTableNext')
            .assert.attributeEquals('@workflowsTableNext', 'disabled', null)
            .assert.visible('@workflowsTablePrevious')
            .assert.attributeEquals('@workflowsTablePrevious', 'disabled', 'true');
    },
    'Step 7: Validate Table visible': function(browser) {
        var tableXpath = browser.page.workflowsPage().elements.workflowsTableXpath.selector;
        browser.useXpath()
            .assert.visible(tableXpath)
            .assert.visible(tableXpath + '//thead')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Workflow")]')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Active")]')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Status")]')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Executor")]')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Execution ID")]')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Start Time")]')
            .assert.visible(tableXpath + '//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Running Time")]')
            .assert.visible(tableXpath + '//tbody');
        browser.page.workflowsPage().validateWorkflowTableRowCount(20);
    },
    'Step 8: Workflows table is paginated': function(browser) {
        browser.page.workflowsPage().useCss()
            .click('@workflowsTableNext');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(5);
        browser.useCss()
            .assert.visible('mat-paginator')
            .page.workflowsPage()
            .assert.attributeEquals('@workflowsTableNext', 'disabled', 'true')
            .assert.attributeEquals('@workflowsTablePrevious', 'disabled', null);
    },
    'Step 9: Validate filter resets pagination': function(browser) {
        browser.page.workflowsPage().selectWorkflowStatusFilter('Success');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .assert.not.elementPresent('mat-paginator')
            .page.workflowsPage()
            .assert.not.elementPresent('@workflowsTable');
        browser.page.workflowsPage().selectWorkflowStatusFilter('--');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .assert.visible('mat-paginator')
            .page.workflowsPage()
            .assert.attributeEquals('@workflowsTableNext', 'disabled', null)
            .assert.attributeEquals('@workflowsTablePrevious', 'disabled', 'true');
    },
    'Step 10: Validate initial state of buttons with nothing selected': function(browser) {
        browser.page.workflowsPage()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true')
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', 'true')
            .assert.attributeEquals('@downloadWorkflowButton', 'disabled', 'true');
    },
    'Step 11: Validate user cannot execute when multiple workflows are selected': function(browser) {
        browser.useCss()
            .click('.workflow-list table tr:nth-child(1) mat-checkbox')
            .click('.workflow-list table tr:nth-child(2) mat-checkbox');
        browser.page.workflowsPage()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true');
    },
    'Step 12: Validate user cannot execute a single workflow if it is not active even if user has permissions': function(browser) {
        browser.useCss()
            .click('.workflow-list table tr:nth-child(2) mat-checkbox');
        browser.page.workflowsPage()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true');
    },
    'Step 13: Validate user with modify master permission can activate workflow': function(browser) {
        browser.useCss()
            .assert.not.hasClass('.workflow-list table tr:nth-child(1) mat-slide-toggle', 'mat-disabled')
            .click('.workflow-list table tr:nth-child(1) mat-slide-toggle');
        browser.globals.wait_for_no_spinners(browser);
    },
    'Step 14: Validate user can execute when a single workflow is selected, it is active, and has modify master permissions': function(browser) {
        browser.page.workflowsPage()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', null);
    },
    'Step 15: Validate user can download when at least one workflow is selected': function(browser) {
        browser.page.workflowsPage()
            .assert.attributeEquals('@downloadWorkflowButton', 'disabled', null); // First test button is enabled with one
        browser.useCss()
            .click('.workflow-list table tr:nth-child(2) mat-checkbox');
        browser.page.workflowsPage()
            .assert.attributeEquals('@downloadWorkflowButton', 'disabled', null)
            .downloadWorkflow();
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .assert.not.hasClass('.workflow-list table tr:nth-child(1) mat-checkbox', 'mat-checkbox-checked')
            .assert.not.hasClass('.workflow-list table tr:nth-child(2) mat-checkbox', 'mat-checkbox-checked');
    },
    'Step 16: Validate user can delete when multiple workflows are selected and user has delete permission': function(browser) {
        browser.useCss()
            .click('.workflow-list table tr:nth-child(5) mat-checkbox'); // First test button is enabled with one
        browser.page.workflowsPage()
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', null);
        browser
            .click('.workflow-list table tr:nth-child(6) mat-checkbox')
            .click('.workflow-list table tr:nth-child(7) mat-checkbox')
            .click('.workflow-list table tr:nth-child(8) mat-checkbox'); // Test button is enabled with multiple
        browser.page.workflowsPage()
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', null)
            .deleteWorkflow();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(20);
        browser.useCss()
            .assert.visible('mat-paginator')
            .page.workflowsPage()
            .assert.attributeEquals('@workflowsTableNext', 'disabled', null);
    },
    'Step 17: Open Individual Workflow': function(browser) {
        browser.page.workflowsPage()
            .openWorkflowPage('Workflow10');
        browser.globals.wait_for_no_spinners(browser);
    },
    'Step 18: Validate user can download a workflow': function(browser) {
      browser.page.workflowsPage().useCss()
          .assert.attributeEquals('@downloadWorkflowButton', 'disabled', null)
          .downloadWorkflow();
      browser.globals.wait_for_no_spinners(browser);
    },
    'Step 19: Validate user can activate and execute a workflow with modify master permission': function(browser) {
        browser.page.workflowsPage().useCss()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true');
        browser.useCss()
            .assert.not.hasClass('app-workflow-record .record-header mat-slide-toggle', 'mat-disabled')
            .click('app-workflow-record .record-header mat-slide-toggle');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().useCss()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', null);
    },
    'Step 20: Validate user can delete a workflow with delete permission': function(browser) {
        browser.page.workflowsPage()
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', null)
            .deleteWorkflow();
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .assert.elementPresent('app-workflow-records');
        browser.page.workflowsPage().validateWorkflowTableRowCount(20);
        browser.useCss()
            .assert.visible('mat-paginator')
            .page.workflowsPage()
            .assert.attributeEquals('@workflowsTableNext', 'disabled', 'true');
    },
    'Step 21: Create a New user': function(browser) {
        browser.globals.switchToPage(browser, 'user-management')
        browser.page.administrationPage().createUser(newUser);
        browser.globals.wait_for_no_spinners(browser);
    },
    'Step 22: Navigate to Catalog': function(browser) {
        browser.globals.switchToPage(browser, 'catalog', 'div.catalog-page');
        browser.globals.wait_for_no_spinners(browser);
    },
    'Step 23: Remove read permission on a workflow': function(browser) {
      browser.page.catalogPage()
          .applySearchText('Workflow20')
          .assertRecordVisible('Workflow20', 1)
          .openRecordItem('Workflow20');
      browser.globals.wait_for_no_spinners(browser);
      browser.page.catalogPage()
          .openManage()
          .toggleRecordEveryonePermission('View Record');
    },
    'Step 24: Logout and Sign-in as New User': function(browser) {
        browser.globals.logout(browser);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.login(browser, newUser.username, newUser.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'workflows', 'app-workflow-records');
        browser.globals.wait_for_no_spinners(browser);
    },
    'Step 25: Validate user can only see records they are allowed to': function(browser) {
        browser.useCss()
            .assert.visible('mat-paginator')
            .assert.visible('app-workflow-records table');
        browser.page.workflowsPage().validateWorkflowTableRowCount(19);
    },
    'Step 26: Validate that user cannot execute or delete workflow without modify master or delete permission': function(browser) {
        browser.useCss()
            .click('.workflow-list table tr:nth-child(1) mat-checkbox');
        browser.page.workflowsPage()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true')
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', 'true');
    },
    'Step 27: Validate that user cannot activate workflow without modify master permission': function(browser) {
        browser.useCss()
            .assert.hasClass('.workflow-list table tr:nth-child(1) mat-slide-toggle', 'mat-disabled')
    },
    'Step 28: Open Individual Workflow': function(browser) {
        browser.page.workflowsPage()
            .openWorkflowPage('Workflow1');
        browser.globals.wait_for_no_spinners(browser);
      },
    'Step 29: Validate that user cannot execute or delete workflow without modify master or delete permission': function(browser) {
        browser.page.workflowsPage()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true')
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', 'true');
    },
    'Step 30: Validate that user cannot activate workflow without modify master permission': function(browser) {
        browser.useCss()
            .assert.hasClass('app-workflow-record .record-header mat-slide-toggle', 'mat-disabled')
    },
    'Step 31: Verify edit mode functionality when in edit mode': function(browser) {
        browser.globals.logout(browser);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.login(browser, adminUsername, adminPassword);
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'workflows');
        browser.page.workflowsPage()
            .openWorkflowPage('Workflow1')
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage()
            .editWorkflow();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().useCss()
            .assert.attributeEquals('@runWorkflowButton', 'disabled', 'true')
            .assert.attributeEquals('@deleteWorkflowButton', 'disabled', 'true')
            .assert.attributeEquals('@downloadWorkflowButton', 'disabled', null);
        browser.useCss()
            .assert.hasClass('app-workflow-record .record-header mat-slide-toggle', 'mat-disabled')
            .assert.attributeEquals('app-execution-history-table .field-status', 'disabled', null)
            .assert.attributeEquals('app-execution-history-table .field-time-range', 'disabled', null)
            .click('app-workflows .mat-tab-labels > div:nth-child(2)')
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'catalog', 'div.catalog-page')
        browser.globals.switchToPage(browser, 'workflows');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage()
            .assert.visible('@editIcon');
    },
    'Step 32: Verify upload changes functionality': function(browser) {
        browser.page.workflowsPage()
            .openUploadChanges()
            .submitUploadChanges(badWorkflowFile);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .assert.visible('mat-dialog-container error-display');
        browser.page.workflowsPage().submitUploadChanges(validWorkflowFile);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .assert.visible('app-workflows .info-message');
        browser.page.workflowsPage().saveChanges();
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .click('app-workflows .mat-tab-labels > div:nth-child(2)');
        browser.globals.wait_for_no_spinners(browser);
        browser.useXpath()
            .assert.visible('//*[contains(text(), "test-workflow")]');
    }
}
