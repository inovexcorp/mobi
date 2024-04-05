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

module.exports = {
    '@tags': ['sanity', "workflows"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },
    'Step 2: Navigate to  Workflows page' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href= "#/workflows"]')
            .useXpath()
            .waitForElementVisible('//workflow-records')
    },
    'Step 3: Validate Workflow Search/Filter elements': function (browser) {
        browser
            .useCss()
        browser
            .assert.visible('app-workflows app-workflow-records .workflow-top-bar .workflow-filters app-workflow-table-filter .field-search-text')
            .assert.visible('app-workflows app-workflow-records .workflow-top-bar .workflow-filters app-workflow-table-filter .field-status')
            .assert.visible('app-workflows app-workflow-records .workflow-top-bar .workflow-filters app-workflow-table-filter .field-time-range')
    },
    'Step 4: Validate Pagination': function (browser) {
        browser
            .useCss()
        browser
            .assert.visible('mat-paginator')
            .assert.visible('workflow-records button.mat-paginator-navigation-next:disabled')
            .assert.visible('workflow-records button.mat-paginator-navigation-previous:disabled')
    },
    'Step 5: Validate Table': function (browser) {
        browser.useXpath()
        .assert.visible('//workflow-records//div[contains(@class, "workflow-list")]//table')
        .assert.visible('//workflow-records//div[contains(@class, "workflow-list")]//table//thead')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Workflow")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Active")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Status")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Executor")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Execution ID")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Start Time")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//thead//th//div[contains(@class, "mat-sort-header-content") and contains(text(), "Running Time")]')
        .assert.visible('//app-workflow-records//div[contains(@class, "workflow-list")]//table//tbody')
        browser.useCss().expect.elements('table tbody tr').count.to.equal(15);
    },
    'Step 6: Test that you cannot execute when multiple workflows are selected': function (browser) {
        browser
        .click('xpath', '//*[@id="mat-checkbox-1"]/label/span[1]')
        .click('xpath', '//*[@id="mat-checkbox-2"]/label/span[1]')
        .useXpath()
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/workflow-records/div/div[1]/button', 'disabled', 'true')
    },
    'Step 7: Test that you can execute when a single workflow is selected, it is active, and you have permissions': function (browser) {
        browser
        .click('xpath', '//*[@id="mat-checkbox-2"]/label/span[1]')
        .assert.not.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/workflow-records/div/div[1]/button', 'disabled', 'true')
    },
    'Step 8: Validate user with edit permission can active and deactive workflow': function (browser) {
        browser
        .click('xpath', '//*[@id="mat-slide-toggle-1"]')
        .globals.wait_for_no_spinners(browser)
        .assert.not.attributeEquals('app-workflows/workflow-records/[@id="mat-slide-toggle-1"]', 'disabled', 'false')
    },
    'Step 9: Test that you cannot execute when a single workflow is selected that you do not have permission to run': function (browser) {
        browser
        .click('xpath', '//*[@id="mat-checkbox-1"]/label/span[1]')
        .click('xpath', '//*[@id="mat-checkbox-2"]/label/span[1]')
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/workflow-records/div/div[1]/button', 'disabled', 'true')
    },
    'Step 10: Test that you cannot execute when a single workflow is selected that is not active': function (browser) {
        browser
        .click('xpath', '//*[@id="mat-checkbox-2"]/label/span[1]')
        .click('xpath', '//*[@id="mat-checkbox-3"]/label/span[1]')
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/workflow-records/div/div[1]/button', 'disabled', 'true')
    },
    'Step 11: Test that the button is correctly enabled/disabled for selections': function (browser) {
        browser
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[1]', 'disabled', 'true')
        .click('xpath', '//*[@id="mat-checkbox-3"]/label/span[1]')
        .assert.not.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/workflow-records/div/div[1]/button', 'disabled', 'true')
        .click('xpath', '//*[@id="mat-checkbox-3"]/label/span[1]')
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/workflow-records/div/div[1]/button', 'disabled', 'true')
    },
    'Step 12: Test you can delete workflows': function (browser) {
        browser
        .click('xpath', '//*[@id="mat-checkbox-3"]/label/span[1]')
        .click('xpath', '//*[@id="mat-checkbox-4"]/label/span[1]')
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[1]')
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[1]')
        browser.useCss().expect.elements('table tbody tr').count.to.equal(13);
    },
    'Step 13: Test the download button will enable/disable': function (browser) {
        browser.useXpath()
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[3]', 'disabled', 'true')
        .click('xpath', '//*[@id="mat-checkbox-1"]/label/span[1]')
        .assert.not.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[3]', 'disabled', 'true')
    },
    'Step 14: Test the download button will download selected workflows': function (browser) {
        browser
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[3]')
        .click('xpath', '//*[@id="mat-dialog-2"]/app-workflow-download-modal/div/button[2]')
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[3]', 'disabled', 'true')
    },
    'Step 15: Test the download button will download selected workflow in the individual page': function (browser) {
        browser
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[2]/table/tbody/tr/td[2]/span/button')
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/app-workflow-record/div/div[2]/div[1]/div[2]/app-workflow-controls/button[3]')
        .assert.attributeEquals('/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[1]/div[2]/app-workflow-controls/button[3]', 'disabled', 'true')
    },
    'Step 16: Test the delete button will delete selected workflow in the individual page': function (browser) {
        browser
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/div/div/app-workflow-records/div/div[2]/table/tbody/tr/td[2]/span/button')
        .click('xpath', '/html/body/mobi-app/login-layout/div/div/div/section/app-workflows/div/app-workflow-record/div/div[2]/div[1]/div[2]/app-workflow-controls/button[2]')
        browser.useCss().expect.elements('table tbody tr').count.to.equal(12);
    }
}
