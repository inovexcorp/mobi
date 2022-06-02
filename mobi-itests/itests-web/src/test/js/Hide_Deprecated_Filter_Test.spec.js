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
var Onto1 = process.cwd()+ '/src/test/resources/rdf_files/deprecated-entity-filter-1.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/rdf_files/deprecated-entity-filter-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/rdf_files/deprecated-entity-filter-3.ttl'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1, Onto2, Onto3)
    },

    'Step 3: Open deprecated-entity-filter-1 Ontology' : function (browser) {
        browser.globals.open_ontology(browser, Onto1)
    },

    'Step 4: Click classes tab' : function (browser) {
        browser
            .waitForElementVisible('div.material-tabset li.nav-item')
            .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Classes")]]')
    },

    'Step 5: Check for Ontology classes' : function (browser) {
        browser
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1a")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2a")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3a")]]'})
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1b")]]'})
    },

    'Step 6: Click on a deprecated class' : function (browser) {
        browser
            .useCss()
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3a")]]//parent::a')
            .waitForElementNotPresent('.spinner')
            .waitForElementVisible('selected-details .entity-name')
            .assert.textContains('selected-details .entity-name', 'Class 3a')
    },

    'Step 7: Apply the Deprecated Filter' : function (browser) {
        browser
            .waitForElementVisible('.hierarchy-filter a')
            .click('.hierarchy-filter a')
            .waitForElementVisible('class-hierarchy-block .dropdown-menu checkbox')
            .click('xpath', '//class-hierarchy-block//hierarchy-tree//hierarchy-filter//checkbox//label//span[text()[contains(., "Hide deprecated classes")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]'})
            .click('xpath', '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]')
            .waitForElementNotVisible('class-hierarchy-block .dropdown-menu checkbox')
    },

    'Step 8: Ensure that correct classes are shown' : function(browser) {
        browser
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1a")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1b")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1c")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2a")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2b")]]'})
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3a")]]'})
    },

    'Step 9: Remove Deprecated Entity Filter' : function(browser) {
       browser
            .waitForElementVisible('.hierarchy-filter a')
            .click('.hierarchy-filter a')
            .waitForElementVisible('class-hierarchy-block .dropdown-menu checkbox')
            .click('xpath', '//class-hierarchy-block//hierarchy-tree//hierarchy-filter//checkbox//label//span[text()[contains(., "Hide deprecated classes")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]'})
            .click('xpath', '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]')
            .waitForElementNotVisible('class-hierarchy-block .dropdown-menu checkbox')
    },

   'Step 10: Ensure that correct classes are shown' : function(browser) {
        browser
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1a")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1b")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1c")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2a")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2b")]]'})
            . waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3a")]]'})
   },

    'Step 11: Verify that a message is displayed when no entities match the filter criteria' : function(browser) {
        browser
            .useCss()
            .assert.visible('search-bar input')
            .setValue('search-bar input', 'ddadf')
            .click('.hierarchy-filter a')
            .waitForElementVisible('class-hierarchy-block .dropdown-menu checkbox')
            .click('xpath', '//class-hierarchy-block//hierarchy-tree//hierarchy-filter//checkbox//label//span[text()[contains(., "Hide deprecated classes")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]'})
            .click('xpath', '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]')
            .waitForElementNotVisible('class-hierarchy-block .dropdown-menu checkbox')
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'No classes match your filter.')
    }
}
