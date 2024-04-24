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
const workflowControls = 'app-workflow-controls';
const createWorkflowButton = `${workflowControls} button.workflow-create`;
const deleteWorkflowButton = `${workflowControls} button.workflow-delete`;
const runWorkflowButton = `${workflowControls} button.workflow-run`;
const downloadWorkflowButton = `${workflowControls} button.workflow-download`;
const workflowSearchText = 'app-workflows app-workflow-records .workflow-top-bar .workflow-filters app-workflow-table-filter .field-search-text input';
const workflowStatusFilter = 'app-workflows app-workflow-records .workflow-top-bar .workflow-filters app-workflow-table-filter .field-status';
const workflowTimeRangeFilter = 'app-workflows app-workflow-records .workflow-top-bar .workflow-filters app-workflow-table-filter .field-time-range';
const workflowsTable = 'app-workflow-records div.workflow-list table';
const workflowsTableXpath = '//app-workflow-records//div[contains(@class, "workflow-list")]//table';
const workflowsTableNext = 'app-workflow-records button.mat-paginator-navigation-next';
const workflowsTablePrevious = 'app-workflow-records button.mat-paginator-navigation-previous';
const executionsTable = 'app-workflow-record div.execution-history-table table';
const executionsTableXpath = '//app-workflow-record//div[contains(@class, "execution-history-table")]//table';
const executionStatusFilter = 'app-workflows app-workflow-record div.execution-history-table app-workflow-table-filter .field-status';

const workflowsCommands = {
    createWorkflow: function(title) {
        return this.useCss()
            .click(createWorkflowButton)
            .waitForElementVisible('app-workflow-creation-modal')
            .waitForElementVisible('app-workflow-creation-modal mat-form-field input[name="title"]')
            .waitForElementVisible('app-workflow-creation-modal div.mat-dialog-actions button.mat-primary')
            .setValue('app-workflow-creation-modal mat-form-field input[name=title]', title)
            .click('app-workflow-creation-modal div.mat-dialog-actions button.mat-primary')
            .waitForElementNotPresent('app-workflow-creation-modal div.mat-dialog-actions button:not(.mat-primary)')
            .click('app-workflow-record button span.fa-chevron-left');
    },
    selectWorkflowStatusFilter: function(status) {
        return this.useCss()
            .waitForElementVisible(workflowStatusFilter)
            .click(workflowStatusFilter)
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('div.mat-select-panel mat-option')
            .click('xpath', `//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "${status}")]]`);
    },
    sortByHeader: function(headerName) {
        return this.useCss()
            .waitForElementVisible(workflowsTable)
            .waitForElementPresent('xpath', `${workflowsTableXpath}//thead//tr//th//div[text()[contains(.,"${headerName}")]]`)
            .click('xpath', `${workflowsTableXpath}//thead//tr//th//div[text()[contains(.,"${headerName}")]]`);
    },
    downloadWorkflow: function() {
        return this.useCss()
            .click(downloadWorkflowButton)
            .waitForElementVisible('app-workflow-download-modal')
            .waitForElementVisible('app-workflow-download-modal div.mat-dialog-actions button.mat-primary')
            .click('app-workflow-download-modal div.mat-dialog-actions button.mat-primary')
            .waitForElementNotPresent('app-download-creation-modal div.mat-dialog-actions button:not(.mat-primary)');
    },
    deleteWorkflow: function() {
        return this.useCss()
            .click(deleteWorkflowButton)
            .waitForElementVisible('confirm-modal')
            .waitForElementVisible('confirm-modal div.mat-dialog-actions button.mat-primary')
            .click('confirm-modal div.mat-dialog-actions button.mat-primary')
            .waitForElementNotPresent('confirm-modal div.mat-dialog-actions button:not(.mat-primary)');
    },
    openWorkflowPage: function(workflowTitle) {
        return this.useXpath()
            .waitForElementVisible(workflowsTableXpath)
            .waitForElementVisible(`${workflowsTableXpath}//td//span[text()[contains(.,"${workflowTitle}")]]//following-sibling::button`)
            .click(`${workflowsTableXpath}//td//span[text()[contains(.,"${workflowTitle}")]]//following-sibling::button`)
            .waitForElementVisible('//app-workflow-record')
            .waitForElementVisible(`//app-workflow-record//h2[text()[contains(.,"${workflowTitle}")]]`);
    },
    validateWorkflowTableRowCount: function(numRows) {
      return this.useCss()
            .waitForElementVisible(workflowsTable)
            .expect.elements(`${workflowsTable} tbody tr`).count.to.equal(numRows);
    },
    validateWorkflowVisible: function(workflowTitle, index) {
        return this.useCss()
            .assert.textEquals(`${workflowsTable} tr:nth-child(${index}) td:nth-child(2) div > span`, workflowTitle);
    },
    searchWorkflows: function(searchText) {
        return this.useCss()
            .waitForElementVisible(workflowsTable)
            .waitForElementVisible(workflowSearchText)
            .setValue(workflowSearchText, searchText)
            .sendKeys(workflowSearchText, browser.Keys.ENTER);
    }
}

const individualWorkflowCommands = {
    validateExecutionTableRowCount: function(numRows) {
        return this.useCss()
            .waitForElementVisible(executionsTable)
            .expect.elements(`${executionsTable} tbody tr.activity-row`).count.to.equal(numRows);
    },
    selectExecutionStatusFilter: function(status) {
        return this.useCss()
            .waitForElementVisible(executionStatusFilter)
            .click(executionStatusFilter)
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('div.mat-select-panel mat-option')
            .click('xpath', `//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "${status}")]]`);
    }
}

module.exports = {
    elements: {
        workflowControls: workflowControls,
        workflowSearchText: workflowSearchText,
        workflowStatusFilter: workflowStatusFilter,
        workflowTimeRangeFilter: workflowTimeRangeFilter,
        createWorkflowButton: createWorkflowButton,
        deleteWorkflowButton: deleteWorkflowButton,
        runWorkflowButton: runWorkflowButton,
        downloadWorkflowButton: downloadWorkflowButton,
        workflowsTable: workflowsTable,
        workflowsTableXpath: workflowsTableXpath,
        workflowsTableNext: workflowsTableNext,
        workflowsTablePrevious: workflowsTablePrevious,
        executionsTable: executionsTable,
        executionsTableXpath: executionsTableXpath,
        executionStatusFilter: executionStatusFilter
    },
    commands: [workflowsCommands, individualWorkflowCommands]
}
