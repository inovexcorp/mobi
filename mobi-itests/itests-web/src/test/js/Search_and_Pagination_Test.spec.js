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

/*jshint esnext: true */
var adminUsername = 'admin'
var adminPassword = 'admin'

var ontologies = [
    process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-1.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-2.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/test-local-imports-3.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/active-entity-filter-1.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/active-entity-filter-2.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/active-entity-filter-3.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/uhtc-ontology.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/pagination-ontology-1.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/pagination-ontology-2.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/pagination-ontology-3.ttl',
    process.cwd()+ '/src/test/resources/rdf_files/pagination-ontology-4.ttl'
]

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup': function (browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies': function (browser) {
        browser.globals.upload_ontologies(browser, ...ontologies)
    },

    'Step 3: Validate Pagination With No text': function (browser) {
        browser
            .useXpath()
            .click('//div[contains(@class, "upload-snackbar")]//div//button[text()[contains(.,"close")]]')
            .waitForElementNotVisible('//div[contains(@class, "upload-snackbar")]')
            .click('//div[contains(@class, "paging")]//li[3]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"pagination-ontology-4.ttl")]]')
    },

    'Step 4: Go Back to Previous Page': function (browser) {
        browser
            .click('xpath', '//div[contains(@class, "paging")]//li[1]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//open-ontology-tab//div[contains(@class, "ontologies")]//div//div[contains(@class, "list-group-item")][10]')
    },

    'Step 5: Validate Pagination With Unconfirmed Search Text': function (browser) {
        browser
            .click('xpath', '//search-bar')
            .keys('test')
            .pause(1000)
            .click('xpath', '//div[contains(@class, "paging")]//li[3]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "ontologies")]')
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"pagination-ontology-4.ttl")]]')
    },

    'Step 6: Validate Search Function': function (browser) {
        browser
            .click('//div[contains(@class, "paging")]//li[1]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', 'test')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "test-local-imports-1")]')
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "test-local-imports-2")]')
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "test-local-imports-3")]')
    }
}
