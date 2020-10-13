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
var validURL = 'https://avm.inovexcorp.com/ontologies/10/2019';
var invalidURL = 'https://avm.inovexcorp.com/ontolo<gies/10/2019';
var validEndsWith = 'CurrencyUnitOntology';
var invalidEndsWidth = 'test`-local-`imports-1';
var input_iriBegin = '//input[@id="iriBegin"]';
var input_iriEnds = '//input[@id="iriEnd"]';

var Onto1 = process.cwd()+ '/src/test/resources/ontologies/CurrencyUnitOntology.ttl'

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
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"CurrencyUnitOntology.ttl")]]')
            // check snackbar
            .assert.visible('//div[contains(@class, "snackbar-body")]//div[contains(@class, "item-details")]//h3[text()[contains(.,"CurrencyUnitOntology.ttl")]]')
            .useCss()
    },

    'Step 8: Click on Ontology called “CurrencyUnitOntology.ttl' : function (browser) {
        browser
            .click('xpath', '//div[contains(@class, "list-group")]//div//div[text()[contains(.,"CurrencyUnitOntology.ttl")]]')
    },

    'Step 9: Open edit IRI Modal' : function (browser) {
            browser
            .useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-penci")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a')
            .waitForElementVisible('//edit-iri-overlay')
            .waitForElementVisible(input_iriBegin)
            .waitForElementVisible(input_iriEnds)
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, invalidURL)
            .waitForElementVisible('//edit-iri-overlay//ng-message')
            .assert.visible('//edit-iri-overlay//ng-message[text()[contains(.,"Value is not a valid namespace.")]]')
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, validURL)
            .assert.elementNotPresent('//edit-iri-overlay//ng-message')
            .clearValue(input_iriEnds)
            .setValue(input_iriEnds, invalidEndsWidth)
            .waitForElementVisible('//edit-iri-overlay//ng-message')
            .assert.visible('//edit-iri-overlay//ng-message[text()[contains(.,"There is an invalid character.")]]')
            .clearValue(input_iriEnds)
            .setValue(input_iriEnds, validEndsWith)
            .assert.elementNotPresent('//edit-iri-overlay//ng-message')

    }
}
