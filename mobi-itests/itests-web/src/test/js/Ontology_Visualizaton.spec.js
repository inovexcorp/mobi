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

var Onto1 = process.cwd()+ '/src/test/resources/ontologies/pizza.owl'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1)
    },

    'Step 3: Open on Ontology called “pizza.owl' : function (browser) {
        browser.globals.open_ontology(browser, Onto1)
    },

    'Step 4: Open Ontology Visualization' : function (browser) {
        browser
            .useXpath()
            .waitForElementVisible('//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Visualization")]]')
            .click('//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Visualization")]]')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .waitForElementNotPresent('div.visualization-spinner')
            .waitForElementVisible('.ontology-visualization')
    }
}
