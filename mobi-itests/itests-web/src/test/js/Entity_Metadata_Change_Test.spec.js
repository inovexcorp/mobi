/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

module.exports = {
    '@tags': ['ontology-editor', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Ensure that user is on Ontology editor page' : function(browser) {
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page')
    },

    'Step 3: Open new Ontology Overlay' : function(browser) {
        var newOntologyButtonXpath = '//span[text()="New Ontology"]/parent::button';
        browser
            .useXpath()
            .waitForElementVisible(newOntologyButtonXpath)
            .click(newOntologyButtonXpath)

    },

    'Step 3: Edit New Ontology Overlay' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('new-ontology-overlay')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', 'Metadata Test Ontology')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', 'Metadata Test Description')
    },

    'Step 4: Submit New Ontology Overlay' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('new-ontology-overlay')
            .useXpath()
            .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 5: Create a new Class': function(browser) {
        browser
            .click('ontology-button-stack circle-button-stack')
            .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
            .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
            .click('create-entity-modal .create-class')
            .waitForElementNotPresent('create-entity-modal .create-class')
            .waitForElementVisible('create-class-overlay h1.mat-dialog-title')
            .assert.textContains('create-class-overlay h1.mat-dialog-title', 'Create New OWL Class')
            .useXpath()
            .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
            .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', 'class A')
            .click('//create-class-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-class-overlay  h1.mat-dialog-title')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Verify class was created': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"class A")]]')
    },

    'Step 7: Commit Changes': function(browser) {
        browser
            .useCss()
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay h1.mat-dialog-title')
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'commit123')
            .useXpath()
            .click('//commit-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay h1.mat-dialog-title')
    },

    'Step 8: Verify Commit': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="commit123"] span', 'commit123')
    },

    'Step 9: Make Changes to Class': function(browser) {
        var classTitleSelector = '//value-display//div//span[text()[contains(.,"class A")]]'
        var annotationSelector = classTitleSelector + '//ancestor::div[@class[contains(.,"prop-value-container")]]//button[@title="Edit"]'

        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .waitForElementVisible('//class-hierarchy-block//tree-item//span[text()[contains(.,"class A")]]')
            .click('//class-hierarchy-block//tree-item//span[text()[contains(.,"class A")]]')
            .waitForElementVisible(classTitleSelector)
            .moveToElement(classTitleSelector, 0, 0)
            .waitForElementVisible(annotationSelector)
            .click(annotationSelector)
            .waitForElementVisible('//annotation-overlay//textarea')
            .clearValue('//annotation-overlay//textarea')
            .setValue('//annotation-overlay//textarea', 'A Edited')
            .click('//annotation-overlay//span[text()="Submit"]')
    },

    'Step 10: Verify Changes to Class': function(browser) {
        browser
            .useCss()
            .waitForElementNotPresent('create-class-overlay h1.mat-dialog-title')
            .waitForElementNotPresent('#spinner-full')
            .useXpath()
            .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"A Edited")]]')
            .assert.visible('//value-display//div//span[text()[contains(.,"A Edited")]]')
    },

    'Step 11: Commit Changes': function(browser) {
        browser
            .useCss()
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay h1.mat-dialog-title')
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'commit456')
            .useXpath()
            .click('//commit-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay h1.mat-dialog-title')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 12: Verify Commit': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit456"]')
            .assert.textContains('commit-history-table .commit-message[title="commit456"] span', 'commit456')
    },

    'Step 13: Close & Re-open Ontology' : function(browser) {
        browser
            .useXpath()
            .click('//ontology-sidebar//span[@class[contains(.,"close-icon")]]')
            .useCss()
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', 'Metadata Test Ontology')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('ontology-editor-page open-ontology-tab')
            .setValue('open-ontology-tab search-bar input', 'Metadata')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
            .useXpath()
            .assert.textContains('//open-ontology-tab//small', 'MetadataTestOntology')
            .click('//open-ontology-tab//small[text()[contains(.,"MetadataTestOntology")]]')
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
    },

    'Step 14: Verify Presentation of Class A' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .waitForElementVisible('//class-hierarchy-block//tree-item//span[text()[contains(.,"A Edited")]]')
            .click('//class-hierarchy-block//tree-item//span[text()[contains(.,"A Edited")]]')
            .assert.visible('//value-display//div//span[text() = "A Edited"]//ancestor::property-values//p[text()[contains(.,"Title")]]')
            .assert.not.elementPresent('//value-display//div//span[text()[contains(.,"Class A")]]//ancestor::property-values//p[text()[contains(.,"Title")]]')
    }
}
