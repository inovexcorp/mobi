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
    '@tags': ['ontology-editor', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Ensure that user is on Ontology editor page' : function(browser) {
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page')
    },

    'Step 3: Open new Ontology Overlay' : function(browser) {
        var newOntologyButtonXpath = '//span[text()="New Ontology"]/parent::button';
        browser
            .useXpath()
            .waitForElementVisible(newOntologyButtonXpath)
            .click(newOntologyButtonXpath)

    },

    'Step 3: Edit New Ontology Overlay' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('new-ontology-overlay')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', 'Query Test Ontology')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', 'Query Test Description')
    },

    'Step 4: Submit New Ontology Overlay' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('new-ontology-overlay')
            .useXpath()
            .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 5: Click search tab dropdown': function (browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(., "Search")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Search")]]//mat-icon')
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//find-view'
            })
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//button[text()[contains(., "Find")]]'
            })
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//button[text()[contains(., "Query")]]'
            })
            .click('xpath', '//button[text()[contains(., "Query")]]')
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//query-view'
            })
            .assert.visible('//query-view//div[@class="yasgui"]//div[@class="yasqe"]');
    },

    'Step 5: Verify results': function (browser) {
        browser
            .waitForElementVisible('//button//span[text()[contains(., "Submit")]]')
            .click('xpath', '//button//span[text()[contains(., "Submit")]]')
            .waitForElementVisible('//query-view//div[contains(@class, "yasr")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//ul[contains(@class, "yasr_btnGroup")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_response_chip")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_plugin_control")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table//thead')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table//tbody')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//div[contains(@class, "dataTables_paginate")]')
            .expect.elements('//tbody/tr').count.to.equal(3)
    },

    'Step 6: Create a new Class': function(browser) {
        browser
            .useCss()
            .click('ontology-button-stack circle-button-stack')
            .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
            .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
            .click('create-entity-modal .create-class')
            .waitForElementNotPresent('create-entity-modal .create-class')
            .waitForElementVisible('create-class-overlay h1.mat-dialog-title')
            .assert.textContains('create-class-overlay h1.mat-dialog-title', 'Create New OWL Class')
            .useXpath()
            .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
            .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', 'class A')
            .click('//create-class-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-class-overlay  h1.mat-dialog-title')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Verify inProgressCommit results': function (browser) {
        browser
            .useXpath()
            .click('xpath', '//button//span[text()[contains(., "Submit")]]')
            .waitForElementVisible('//query-view//div[contains(@class, "yasr")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//ul[contains(@class, "yasr_btnGroup")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_response_chip")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_plugin_control")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table//thead')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table//tbody')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//div[contains(@class, "dataTables_paginate")]');
        browser.useCss().expect.elements('.odd').count.to.equal(3);
        browser.useCss().expect.elements('.even').count.to.equal(2);
    },

    'Step 8: Commit Changes': function(browser) {
        browser
            .useCss()
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay h1.mat-dialog-title')
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'commit123')
            .useXpath()
            .click('//commit-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay h1.mat-dialog-title');
    },

    'Step 9: Verify commit results': function (browser) {
        browser
            .useXpath()
            .click('xpath', '//div[contains(@class, "ngx-toastr")]')
            .click('xpath', '//button//span[text()[contains(., "Submit")]]')
            .waitForElementVisible('//query-view//div[contains(@class, "yasr")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//ul[contains(@class, "yasr_btnGroup")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_response_chip")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_plugin_control")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table//thead')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//table//tbody')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]')
            .assert.visible('//query-view//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//div[contains(@class, "dataTables_paginate")]');
        browser.useCss().expect.elements('.odd').count.to.equal(3);
        browser.useCss().expect.elements('.even').count.to.equal(2);
    }
}
