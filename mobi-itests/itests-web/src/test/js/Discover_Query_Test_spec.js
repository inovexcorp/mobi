/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1)
    },

    'Step 3: Navigate to datasets tab' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/datasets"]')
    },

    'Step 4: Create a new Dataset' : function (browser) {
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
    'Step 5: Validate dataset Appearance' : function (browser) {
        browser
            .waitForElementNotPresent('div.spinner')
            .waitForElementPresent('datasets-list')
            .useXpath()
            .waitForElementPresent('//div[contains(@class, "dataset-info")]')
            .assert.visible('//div[contains(@class, "dataset-info")]//h3[text()[contains(.,"Event ontology data")]]')
    },
    'Step 6: Click Upload data' : function (browser) {
        browser
            .click('//div[contains(@class, "list-group")]//action-menu//div[contains(@class, "dropdown")]//button')
            .waitForElementVisible('//div[contains(@class, "list-group")]//action-menu//div[contains(@class, "dropdown")]//div[contains(@class, "dropdown-menu")]//a[contains(@class, "upload-data")]')
            .click('//div[contains(@class, "list-group")]//action-menu//div[contains(@class, "dropdown")]//div[contains(@class, "dropdown-menu")]//a[contains(@class, "upload-data")]')
            .waitForElementVisible('//upload-data-overlay')
            .waitForElementVisible('//upload-data-overlay//file-input')
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .click('//upload-data-overlay//button[text()[contains(.,"Choose File")]]')
            .setValue('//input[@type="file"]', Onto1)
            .assert.visible('//file-input//div[@class="file-input mt-2"]//span[text()[contains(.,"EventOntology.ttl")]]')
    },
    'Step 7: Submit data' : function (browser) {
        browser
            .click('//button[text()[contains(.,"Submit")]]')
            .waitForElementVisible('//div[@id="toast-container"]')
            .assert.visible('//div[@id="toast-container"]')
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .waitForElementNotPresent('//div[contains(@class,"toast")]')
    },
    'Step 8: Navigate to Discover' : function (browser) {
        browser
            .click('//div//ul//a[@class="nav-link"][@href="#/discover"]')
            .waitForElementVisible('//discover-page')
            .assert.visible('//material-tabset')
    },
    'Step 9: Navigate to Discover Query tab' : function (browser) {
        browser
            .click('//material-tabset//ul[contains(@class,"nav-tabs")]//li//a//span[text()[contains(., "Query")]]')
            .waitForElementVisible('//discover-tabset//query-tab')
            .waitForElementVisible('//discover-tabset//query-tab//form')
            .assert.visible('//query-tab//form//dataset-form-group')
            .assert.visible('//query-tab//form//dataset-form-group//a[text()[contains(., "Clear")]]')
            .assert.visible('//query-tab//form//div[contains(@class, "discover-query")]')
            .assert.not.visible('//query-tab//form//div[contains(@class, "yasr")]')
    },
    'Step 10: Submit default query' : function (browser) {
        browser
            .click('//query-tab//form//dataset-form-group//div[contains(@class, "dropdown")]')
            .waitForElementVisible(dropDownSelector)
            .click(dropDownSelector)
            .waitForElementNotPresent(dropDownSelector)
            .click('//query-tab//form//button')
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
            .click('//query-tab//form//button')
            .assert.visible('//query-tab//form//div[contains(@class, "yasr")]//div[contains(@class, "dataTable")]//div[contains(@class, "dataTables_paginate")]')
            .expect.elements('//tbody/tr').count.to.equal(50)
    }
}
