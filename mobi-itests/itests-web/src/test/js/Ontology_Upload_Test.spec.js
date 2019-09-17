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

module.exports = {
    '@tags': ['mobi', 'login', 'sanity'],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:8443/mobi/index.html#/home')
            .useXpath()
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', 'admin')
            .setValue('//div[@class="form-group"]//input[@id="password"]', 'admin')
            .click('//button[@type="submit"]')
    },

    'Step 2: check for visibility of home elements' : function(browser) {
        browser
            .waitForElementVisible('//div[@class="home-page h-100 d-flex flex-column"]')
    },

    'Step 3: navigate to the Ontology Editor page' : function (browser) {
        browser
            .click('//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]')
    },

    'Step 4: click upload ontology' : function (browser) {
        browser
            .waitForElementVisible('//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
            .click('//div[@class="btn-container"]//button[text()[contains(.,"Upload Ontology")]]')
    },

    'Step 5: Upload an Ontology' : function (browser) {
        browser
            .setValue('//input[@type="file"]', [ require('path').resolve( process.cwd()+ '/src/test/resources/ontologies/test-local-imports-1.ttl'), require('path').resolve( process.cwd()+ '/src/test/resources/ontologies/test-local-imports-2.ttl') ])
    }


}
