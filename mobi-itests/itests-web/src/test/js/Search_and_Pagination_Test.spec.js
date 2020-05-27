/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
var Onto1 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/ontologies/test-local-imports-3.ttl'
var ontologies = [
    process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1.ttl',
    process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl',
    process.cwd()+ '/src/test/resources/ontologies/test-local-imports-3.ttl',
    process.cwd()+ '/src/test/resources/ontologies/active-entity-filter-1.ttl',
    process.cwd()+ '/src/test/resources/ontologies/active-entity-filter-2.ttl',
    process.cwd()+ '/src/test/resources/ontologies/active-entity-filter-3.ttl',
    process.cwd()+ '/src/test/resources/ontologies/uhtc-ontology.ttl',
    process.cwd()+ '/src/test/resources/ontologies/pagination-ontology-1.ttl',
    process.cwd()+ '/src/test/resources/ontologies/pagination-ontology-2.ttl',
    process.cwd()+ '/src/test/resources/ontologies/pagination-ontology-3.ttl',
    process.cwd()+ '/src/test/resources/ontologies/pagination-ontology-4.ttl'
]

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: login as admin': function (browser) {
        browser
            .url('https://localhost:' +browser.globals.globalPort+ '/mobi/index.html#/home')
            .waitForElementVisible('input#username')
            .waitForElementVisible('input#password')
            .setValue('input#username', adminUsername)
            .setValue('input#password', adminPassword)
            .click('button[type=submit]')
    },

    'Step 2: check for visibility of home elements': function (browser) {
        browser
            .waitForElementVisible('.home-page')
    },

    'Step 3: navigate to the Ontology Editor page': function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
    },

    'Step 4: Upload and submit all Ontologies': function (browser) {
        for (var count = 0; count < ontologies.length; count++) {
            browser
                .waitForElementNotPresent('div.spinner')
                .waitForElementVisible('div.btn-container button')
                .click('xpath', '//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
                .setValue('input[type=file]', ontologies[count])
                .click('xpath', '//button[text()[contains(.,"Submit")]]')
                .waitForElementNotPresent('upload-ontology-overlay div.modal-header button.close span')
        }
    },

    'Step 5: Validate Correct Number of Ontologies are Uploaded': function (browser) {
        browser
            .waitForElementVisible('div.ontologies')
            .assert.elementNotPresent('div.modal-header')
            .waitForElementVisible('div.ontologies')
            .useXpath()
            .assert.visible('//open-ontology-tab//div[contains(@class, "ontologies")]//div//div[contains(@class, "list-group-item")][10]')
            .assert.elementNotPresent('//paging//ul//li[3]//a[contains(@class, "disabled" )]')
    },

    'Step 6: Validate Pagination With No text': function (browser) {
        browser
            .click('xpath', '//div[contains(@class, "upload-snackbar")]//div//button[text()[contains(.,"close")]]')
            .waitForElementNotVisible('//div[contains(@class, "upload-snackbar")]')
            .click('xpath', '//div[contains(@class, "paging")]//li[3]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"uhtc-ontology.ttl")]]')
    },

    'Step 7: Go Back to Previous Page': function (browser) {
        browser
            .click('xpath', '//div[contains(@class, "paging")]//li[1]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//open-ontology-tab//div[contains(@class, "ontologies")]//div//div[contains(@class, "list-group-item")][10]')
    },

    'Step 8: Validate Pagination With Unconfirmed Search Text': function (browser) {
        browser
            .click('xpath', '//search-bar')
            .keys('test')
            .click('xpath', '//div[contains(@class, "paging")]//li[3]//a')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//div[text()[contains(.,"uhtc-ontology.ttl")]]')
    },

    'Step 9: Validate Search Function': function (browser) {
        browser
            .click('xpath', '//div[contains(@class, "paging")]//li[1]//a')
            .click('xpath', '//search-bar')
            .keys(browser.Keys.ENTER)
            .waitForElementVisible('//div[contains(@class, "ontologies")]')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "test-local-imports-1")]')
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "test-local-imports-2")]')
            .assert.visible('//div[contains(@class, "list-group")]//small[contains(text(), "test-local-imports-3")]')
    }
}