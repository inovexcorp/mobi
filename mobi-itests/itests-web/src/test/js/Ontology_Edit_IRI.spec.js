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
var adminUsername = 'admin'
var adminPassword = 'admin'
var validURL = 'https://avm.inovexcorp.com/ontologies/10/2019';
var invalidURL = 'https://avm.inovexcorp.com/ontolo<gies/10/2019';
var validEndsWith = 'CurrencyUnitOntology';
var invalidEndsWidth = 'test`-local-`imports-1';
var input_iriBegin = '//input[@id="iriBegin"]';
var input_iriEnds = '//input[@id="iriEnd"]';

var Onto1 = process.cwd()+ '/src/test/resources/rdf_files/CurrencyUnitOntology.ttl'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1)
    },

    'Step 3: Open on Ontology called “CurrencyUnitOntology.ttl' : function (browser) {
        browser.globals.open_ontology(browser, Onto1)
    },

    'Step 4: Open edit IRI Modal' : function (browser) {
            browser
            .useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-penci")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a')
            .waitForElementVisible('//edit-iri-overlay-ajs')
            .waitForElementVisible(input_iriBegin)
            .waitForElementVisible(input_iriEnds)
            .waitForElementNotPresent('//div[contains(@class, "ng-animate")]')
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, invalidURL)
            .waitForElementVisible('//edit-iri-overlay-ajs//ng-message')
            .assert.visible('//edit-iri-overlay-ajs//ng-message[text()[contains(.,"Value is not a valid namespace.")]]')
            .clearValue(input_iriBegin)
            .setValue(input_iriBegin, validURL)
            .assert.not.elementPresent('//edit-iri-overlay-ajs//ng-message')
            .clearValue(input_iriEnds)
            .setValue(input_iriEnds, invalidEndsWidth)
            .waitForElementVisible('//edit-iri-overlay-ajs//ng-message')
            .assert.visible('//edit-iri-overlay-ajs//ng-message[text()[contains(.,"There is an invalid character.")]]')
            .clearValue(input_iriEnds)
            .setValue(input_iriEnds, validEndsWith)
            .assert.not.elementPresent('//edit-iri-overlay-ajs//ng-message')
    }
}
