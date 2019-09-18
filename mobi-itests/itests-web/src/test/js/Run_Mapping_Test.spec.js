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
var OntoSample = process.cwd()+ '/src/test/resources/ontologies/uhtc-ontology.ttl'
var OntoCSV= process.cwd()+ '/src/test/resources/ontology_csv\'s/uhtc-compounds.csv'


module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:8443/mobi/index.html#/home')
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
            .waitForElementVisible('div.btn-container button')
            .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
    },

    'Step 5: Upload and submit an Ontology' : function (browser) {
        browser
            .setValue('input[type=file]', OntoSample)
            .waitForElementVisible('upload-ontology-overlay')
            .click('xpath', '//button[text()[contains(.,"Submit")]]')
    },

    'Step 6: Validate Ontology Appearance' : function (browser) {
        browser
            .waitForElementVisible('div.ontologies')
            .assert.elementNotPresent('div.modal-header')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//span[text()[contains(.,"uhtc-ontology.ttl")]]')
            .useCss()
    },

    'Step 7: Navigate to datasets tab' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/datasets"]')
    },

    'Step 8: Create a new Dataset' : function (browser) {
        browser
            .click('div.datasets-tabset button.btn-primary')
            .waitForElementVisible('div.form-group')
            .setValue('div.form-group input[name=title]', 'UHTC ontology data')
            .setValue('div.form-group textarea.form-control', 'A dataset consisting of information recorded on various earthly materials')
            .click('xpath', '//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"uhtc-ontology.ttl")]]//ancestor::md-list-item//md-checkbox')
            .click('div.modal-footer button.btn-primary')
    },

    'Step 9: Validate dataset Appearance' : function (browser) {
        browser
            .useXpath()
            .assert.visible('//div[contains(@class, "dataset-info")]//h3[text()[contains(.,"UHTC ontology data")]]')
            .useCss()
    },

    'Step 10: Navigate to Mapping page' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/mapper"]')
    },

    'Step 11: Create new mapping' : function (browser) {
        browser
            .click('block-header button.btn')
            .setValue('div.form-group input[name=title]', "UHTC material Mapping")
            .setValue('div.form-group.text-area textarea.form-control', "A mapping of materials listed in the UHTC csv file to the UHTC ontology")
            .click('div.modal-footer button.btn-primary')
    },

    'Step 12: Attach csv to mapping' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('div.file-input button.btn-light')
            .setValue('input.hide[type=file]', OntoCSV)
    }



}
