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
var adminUsername = 'admin';
var adminPassword = 'admin';

var successWorkflow = 'Success Workflow';
var workflowA = 'Workflow A';
var neverRunWorkflow = 'Never Run Workflow';

module.exports = {
    '@tags': ['sanity', 'workflows'],

    before: function(browser, done) {
        browser.globals.runExec(browser.globals.containerObj, {
            Cmd: ['sh', '/opt/mobi/import.sh', 'system', '/opt/mobi/dataFiles/workflows.trig'],
            Tty: true,
            AttachStdout: true,
            AttachStderr: true,
        }).then(function() {
            return browser.globals.runExec(browser.globals.containerObj, {
                Cmd: ['sh', '/opt/mobi/import.sh', 'prov', '/opt/mobi/dataFiles/workflows_prov.trig'],
                Tty: true,
                AttachStdout: true,
                AttachStderr: true,
            });
        }).then(function() {
            done();
        });
    },

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
    },

    'Step 2: Navigate to Workflows and validate initial state': function(browser) {
        browser.globals.switchToPage(browser, 'workflows', 'app-workflow-records');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(4);
    },

    'Step 3: Verify run button status': function(browser) {
        browser.page.workflowsPage().verifyRunButton('true');
        browser.page.workflowsPage().selectWorkflow(workflowA);
        browser.page.workflowsPage().verifyRunButton(null);
    },

    'Step 4: Validate default alphabetical ordering': function(browser) {
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 3);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 4);
    },

    'Step 5: Validate column sorting': function(browser) {
        browser.page.workflowsPage().sortByHeader('Running Time');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 2);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 3);

        browser.page.workflowsPage().sortByHeader('Running Time');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 2);

        browser.page.workflowsPage().sortByHeader('Start Time');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 2);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 3);

        browser.page.workflowsPage().sortByHeader('Start Time');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 3);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 2);

        browser.page.workflowsPage().sortByHeader('Execution ID');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 2);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 3);

        browser.page.workflowsPage().sortByHeader('Execution ID');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 2);

        browser.page.workflowsPage().sortByHeader('Executor');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 2);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 3);

        browser.page.workflowsPage().sortByHeader('Executor');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 2);

        browser.page.workflowsPage().sortByHeader('Status');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 2);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 1);

        browser.page.workflowsPage().sortByHeader('Status');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 3);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 4);

        browser.page.workflowsPage().sortByHeader('Active');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 2);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 3);

        browser.page.workflowsPage().sortByHeader('Active');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 4);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 2);

        browser.page.workflowsPage().sortByHeader('Workflow');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 3);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 4);
    },

    'Step 6: Validate status filtering': function(browser) {
        browser.page.workflowsPage().selectWorkflowStatusFilter('Never Run');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(1);
        browser.page.workflowsPage().validateWorkflowVisible(neverRunWorkflow, 1);

        browser.page.workflowsPage().selectWorkflowStatusFilter('Success');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(1);
        browser.page.workflowsPage().validateWorkflowVisible(successWorkflow, 1);

        browser.page.workflowsPage().selectWorkflowStatusFilter('Failure');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateWorkflowTableRowCount(1);
        browser.page.workflowsPage().validateWorkflowVisible(workflowA, 1);
    },

    'Step 7: Open Workflow A Page': function(browser) {
        browser.page.workflowsPage().openWorkflowPage(workflowA);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 8: Verify Run Button Status': function(browser) {
        browser.page.workflowsPage().verifyRunButton(null);
    },

    'Step 9: Validate initial executions table state': function(browser) {
        var tableXpath = browser.page.workflowsPage().elements.executionsTableXpath.selector;
        browser.useXpath()
            .assert.visible(tableXpath)
            .assert.visible(tableXpath + '//thead')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Status")]')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Executor")]')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Execution ID")]')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Start Time")]')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Running Time")]')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Details")]')
            .assert.visible(tableXpath + '//thead//th[contains(text(), "Logs")]')
        browser.page.workflowsPage().validateExecutionTableRowCount(1);
    },

    'Step 10: Validate executions table status filter': function(browser) {
        browser.page.workflowsPage().selectExecutionStatusFilter('Success');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().useCss()
            .assert.not.elementPresent('@executionsTable');

        browser.page.workflowsPage().selectExecutionStatusFilter('Started');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().useCss()
            .assert.not.elementPresent('@executionsTable');

        browser.page.workflowsPage().selectExecutionStatusFilter('Failure');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateExecutionTableRowCount(1);
    },

    'Step 11: validate executions appear properly from commit tab': function(browser) {
        var tablePath = browser.page.workflowsPage().elements.executionsTable.selector;
        browser.useXpath()
            .click('//app-workflows//mat-tab-group//mat-tab-header//div[contains(text(), "Commits")]');
        browser.globals.wait_for_no_spinners(browser);
        browser.useXpath()
        browser.click('//app-workflows//mat-tab-group//mat-tab-header//div[contains(text(), "Executions")]')
        browser.globals.wait_for_no_spinners(browser);
        browser.page.workflowsPage().validateExecutionTableRowCount(1);
    },

    'Step 12: Expand Actions on Workflow Execution': function(browser) {
        var tablePath = browser.page.workflowsPage().elements.executionsTable.selector;
        browser.useCss()
            .assert.elementPresent(tablePath + ' tbody tr td:nth-child(6) button')
            .click(tablePath + ' tbody tr td:nth-child(6) button');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible(tablePath + ' app-action-executions-table table')
            .expect.elements('app-action-executions-table table tbody tr').count.to.equal(4);
    },

    'Step 13: Open Workflow Log view': function(browser) {
        var tablePath = browser.page.workflowsPage().elements.executionsTable.selector;
        browser.useCss()
            .assert.elementPresent(tablePath + ' tbody tr td:nth-child(7) button')
            .click(tablePath + ' tbody tr td:nth-child(7) button')
            .waitForElementVisible('app-logs-preview');
        browser.globals.wait_for_no_spinners(browser);
    }
}
