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

 /*jslint browser: true */
/*global window */
/*global console */
/*jshint multistr: true */

var adminUsername = "admin"
var adminPassword = "admin"
var dropDownSelector = '//query-tab//form//dataset-form-group//ul[contains(@class, "ui-select-choices")]//li[contains(@class, "ui-select-choices-group")]//div[contains(@class,"ui-select-choices-row")]';
var Onto1 = process.cwd()+ '/src/test/resources/rdf_files/EventOntology.ttl'

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1)
    },

    'Step 3: Navigate to datasets tab' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href= "#/datasets"]')
    },

    'Step 4: Create a new Dataset' : function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('div.datasets-page button.mat-primary')
            .waitForElementVisible('new-dataset-overlay')
            .waitForElementVisible('new-dataset-overlay input[name="title"]')
            .setValue('div.mat-dialog-content input[name=title]', 'Event ontology data')
            .setValue('div.mat-dialog-content textarea', 'A dataset consisting of information about events')
            .click('xpath', '//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"EventOntology")]]//ancestor::mat-list-option')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('div.mat-dialog-actions button.mat-primary')
    },
    'Step 5: Validate dataset Appearance' : function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementPresent('datasets-list')
            .waitForElementPresent('div.dataset-info')
            .waitForElementPresent('div.dataset-info h3')
            .useXpath()
            .assert.visible('//div[contains(@class, "dataset-info")]//div//h3[text()[contains(.,"Event ontology data")]]')
            .useCss()
    },
    'Step 6: Click Upload data' : function (browser) {
        browser
            .click('.dataset .menu-button.mat-icon-button')
            .waitForElementVisible('.mat-menu-content .upload-data')
            .click('.mat-menu-content .upload-data')
            .useXpath()
            .waitForElementVisible('//upload-data-overlay')
            .waitForElementVisible('//upload-data-overlay//file-input')
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .uploadFile('//upload-data-overlay//file-input//div//input[@type="file"]',Onto1)
            .assert.visible('//file-input//div[@class="file-input mt-2"]//span[text()[contains(.,"EventOntology")]]')
    },
    'Step 7: Submit data' : function (browser) {
        browser
            .useCss()
            .click('div.mat-dialog-actions button.mat-primary')
            .waitForElementVisible('div#toast-container')
            .assert.visible('div#toast-container')
        browser.globals.wait_for_no_spinners(browser)
    },
    'Step 8: Navigate to Discover' : function (browser) {
        browser
            .useXpath()
            .click('//div//ul//a[@class="nav-link"][@href="#/discover"]')
            .waitForElementVisible('//discover-page')
            .assert.visible('//mat-tab-group')
    },
    'Step 9: Navigate to Discover Query tab' : function (browser) {
        browser
            .click('//mat-tab-group//div[contains(@class,"mat-tab-labels")]//div[contains(@class,"mat-tab-label-content")][text()[contains(., "Query")]]')
            .waitForElementVisible('//query-tab')
            .waitForElementVisible('//query-tab//form')
            .assert.visible('//query-tab//form//discover-dataset-select')
            .assert.visible('//query-tab//form//discover-dataset-select//span[text()[contains(., "Clear")]]')
            .assert.visible('//query-tab//form//div[contains(@class, "discover-query")]')
            .assert.not.visible('//query-tab//form//div[contains(@class, "yasr")]')
    },
    'Step 10: Submit default query' : function (browser) {
        browser
            .click('//query-tab//form//discover-dataset-select//mat-form-field')
            .useCss()
            .waitForElementVisible('mat-option .mat-option-text')
            .click('mat-option .mat-option-text')
            .waitForElementNotPresent('mat-option .mat-option-text')
            .useXpath()
            .click('//query-tab//form//button[contains(@class, "mat-primary")]//ancestor::div[@class="btn-container"]')
            .waitForElementVisible('//query-tab//form//div[contains(@class, "yasr")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//ul[contains(@class, "yasr_btnGroup")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_response_chip")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "yasr_header")]//div[contains(@class, "yasr_plugin_control")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//table')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//table//thead')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//table//tbody')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//div[contains(@class, "dataTables_paginate")]')
            .expect.elements('//tbody/tr').count.to.equal(10)
    },
    'Step 11: Submit custom query' : function (browser) {
        browser
            .execute(function updateYasqe() {
                var value = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
                     SELECT * WHERE { \
                       #Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut \
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco \
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in \
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat \
                        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. \
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut \
                         labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco \
                         laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in \
                         voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat \
                         cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. \
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt \
                         ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation \
                         ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in \
                         reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. \
                         Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit \
                         anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do \
                         eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis \
                         nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute \
                         irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla \
                         pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. v Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia \
                         deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing \
                         elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \
                         veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \
                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat \
                         nulla pariatur. \n \
                       ?sub ?pred ?obj . \n \
                     }';
                document.getElementsByClassName('CodeMirror')[0].CodeMirror.setValue(value);
            }, [])
            .useCss()
            .click('query-tab form button.mat-raised-button.mat-primary')
            .useXpath()
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//div[contains(@class, "dataTables_paginate")]')
            .expect.elements('//tbody/tr').count.to.equal(50)
    }
}
