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
            .click('//div[contains(@class, "upload-snackbar")]//div//button//mat-icon[text()[contains(.,"close")]]')
            .waitForElementNotPresent('//div[contains(@class, "upload-snackbar")]')
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/shapes-graph-editor"]')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .waitForElementVisible('shapes-graph-editor-page')
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('button.upload-button')
            .waitForElementNotPresent('open-ontology-tab button.mat-paginator-navigation-next:disabled')
            .click('open-ontology-tab button.mat-paginator-navigation-next');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .assert.visible('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")][text()[contains(.,"pagination-ontology-4")]]')
            .assert.visible('//div[contains(@class, "ontology-info")]//small[text()[contains(.,"pagination-ontology-4")]]')
    },

    'Step 4: Go Back to Previous Page': function (browser) {
        browser
            .useCss()
            .click('open-ontology-tab button.mat-paginator-navigation-previous');
        browser.globals.wait_for_no_spinners(browser);
        browser.useXpath().expect.elements('//open-ontology-tab//div[contains(@class, "ontology-info")]').count.to.equal(10);
    },

    'Step 5: Validate Pagination With Unconfirmed Search Text': function (browser) {
        browser
            .useCss()
            .setValue('open-ontology-tab search-bar input', 'test')
            .pause(1000)
            .click('open-ontology-tab button.mat-paginator-navigation-next');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .assert.visible('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")][text()[contains(.,"pagination-ontology-4")]]')
            .assert.visible('//div[contains(@class, "ontology-info")]//small[text()[contains(.,"pagination-ontology-4")]]')
    },

    'Step 6: Validate Search Function': function (browser) {
        browser
            .useCss()
            .click('open-ontology-tab button.mat-paginator-navigation-previous');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', 'test-local-imports')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "ontology-info")]//span[contains(@class, "header-title")]//span[text()[contains(.,"test-local-imports")]]')
            .assert.visible('//div[contains(@class, "ontology-info")]//small[text()[contains(.,"test-local-imports-1")]]')
            .assert.visible('//div[contains(@class, "ontology-info")]//small[text()[contains(.,"test-local-imports-2")]]')
            .assert.visible('//div[contains(@class, "ontology-info")]//small[text()[contains(.,"test-local-imports-3")]]')
    }
}
