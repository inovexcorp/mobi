/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
var adminUsername = "admin"
var adminPassword = "admin"
var dropDownSelector = '//query-tab//form//dataset-form-group//ul[contains(@class, "ui-select-choices")]//li[contains(@class, "ui-select-choices-group")]//div[contains(@class,"ui-select-choices-row")]';
var Onto1 = process.cwd()+ '/src/test/resources/ontologies/EventOntology.ttl'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:' +browser.globals.globalPort+ '/mobi/index.html#/home')
            .waitForElementVisible('input#username')
            .waitForElementVisible('input#password')
            .setValue('input#username', adminUsername)
            .setValue('input#password', adminPassword)
            .click('button[type=submit]')
    },

    'Step 2: check for visibility of home elements' : function(browser) {
        browser
            .waitForElementVisible('.home-page')
    },

    'Step 3: navigate to the Ontology Editor page' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
    },

    'Step 4: click upload ontology' : function (browser) {
        browser
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible('div.btn-container button')
            .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
    },

    'Step 5: Upload an Ontology' : function (browser) {
        browser
            .setValue('input[type=file]', Onto1)
    },

    'Step 6: Submit all ontology files' : function (browser) {
        browser
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//button[text()[contains(.,"Submit All")]]')
    },

    'Step 7: Validate Ontology Appearance' : function (browser) {
        browser
            .waitForElementVisible('div.ontologies')
            .assert.elementNotPresent('div.modal-header')
            .waitForElementVisible('div.ontologies')
            .useXpath()
            // check ontology list
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"EventOntology.ttl")]]')
            // check snackbar
            .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h3[text()[contains(.,"EventOntology.ttl")]]')
            .useCss()
    },

    'Step 8: Navigate to datasets tab' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/datasets"]')
    },

    'Step 9: Create a new Dataset' : function (browser) {
        browser
            .waitForElementNotPresent('div.spinner')
            .click('div.datasets-tabset button.btn-primary')
            .waitForElementVisible('new-dataset-overlay')
            .setValue('div.form-group input[name=title]', 'Event ontology data')
            .setValue('div.form-group textarea.form-control', 'A dataset consisting of information about events')
            .click('xpath', '//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"EventOntology.ttl")]]//ancestor::md-list-item//md-checkbox')
            .waitForElementNotPresent('div.spinner')
            .click('div.modal-footer button.btn-primary')
    },
    'Step 10: Validate dataset Appearance' : function (browser) {
        browser
            .useXpath()
            .assert.visible('//div[contains(@class, "dataset-info")]//h3[text()[contains(.,"Event ontology data")]]')
    },
    'Step 11: Click Upload data' : function (browser) {
        browser
            .click('//div[contains(@class, "list-group")]//action-menu//div[contains(@class, "dropdown")]//button')
            .waitForElementVisible('//div[contains(@class, "list-group")]//action-menu//div[contains(@class, "dropdown")]//div[contains(@class, "dropdown-menu")]//a[contains(@class, "dropdown-item")]')
            .click('//div[contains(@class, "list-group")]//action-menu//div[contains(@class, "dropdown")]//div[contains(@class, "dropdown-menu")]//a[contains(@class, "dropdown-item")]')
            .waitForElementVisible('//upload-data-overlay')
            .waitForElementVisible('//upload-data-overlay//file-input')
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .click('//file-input//div[@class="file-input form-group"]//div//button[text()[contains(.,"Choose File")]]')
            .setValue('//input[@type="file"]', Onto1)
            .assert.visible('//file-input//div[@class="file-input form-group"]//div//span[text()[contains(.,"EventOntology.ttl")]]')
    },
    'Step 12: Submit data' : function (browser) {
        browser
            .click('//button[text()[contains(.,"Submit")]]')
            .waitForElementVisible('//div[@id="toast-container"]')
            .assert.visible('//div[@id="toast-container"]')
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .waitForElementNotPresent('//div[contains(@class,"toast")]')
    },
    'Step 13: Navigate to Discover' : function (browser) {
        browser
            .click('//div//ul//a[@class="nav-link"][@href="#/discover"]')
            .waitForElementVisible('//discover-page')
            .assert.visible('//material-tabset')
    },
    'Step 14: Navigate to Discover Query tab' : function (browser) {
        browser
            .click('//material-tabset//ul[contains(@class,"nav-tabs")]//li//a//span[text()[contains(., "Query")]]')
            .waitForElementVisible('//discover-tabset//query-tab')
            .waitForElementVisible('//discover-tabset//query-tab//form')
            .assert.visible('//query-tab//form//dataset-form-group')
            .assert.visible('//query-tab//form//dataset-form-group//a[text()[contains(., "Clear")]]')
            .assert.visible('//query-tab//form//div[contains(@class, "discover-query")]')
            .assert.not.visible('//query-tab//form//div[contains(@class, "yasr")]')
    },
    'Step 15: Submit query' : function (browser) {
        browser
            .click('//query-tab//form//dataset-form-group//div[contains(@class, "dropdown")]')
            .waitForElementVisible(dropDownSelector)
            .click(dropDownSelector)
            .waitForElementNotPresent(dropDownSelector)
            .click('//query-tab//form//button')
            .waitForElementVisible('//query-tab//form//div[contains(@class, "yasr")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_btnGroup")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_response_chip")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_plugin_control")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//table')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//table//thead')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//table//tbody')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//a[contains(@class, "paginate_button")]')
    }
}
