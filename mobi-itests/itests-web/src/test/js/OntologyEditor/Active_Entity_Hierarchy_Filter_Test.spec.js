/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
var path = require('path');
var adminUsername = 'admin'
var adminPassword = 'admin'
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/active-entity-filter-1.ttl');
var Onto2 = path.resolve(__dirname + '/../../resources/rdf_files/active-entity-filter-2.ttl');
var Onto3 = path.resolve(__dirname + '/../../resources/rdf_files/active-entity-filter-3.ttl');

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        [Onto3, Onto2, Onto1].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 3: Ensure active-entity-filter-1 Ontology is open' : function(browser) {
        browser.page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'active-entity-filter-1');
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Click classes tab' : function(browser) {
        browser.page.ontologyEditorPage().openClassesTab();
    },

    'Step 5: Check for Ontology classes' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 0')
            .verifyItemVisible('Class 2')
            .verifyItemVisible('Class 3')
            .verifyItemVisible('Other Class')
            .verifyItemNotVisible('Class 1')
    },

    'Step 6: Click on an imported class' : function(browser) {
        browser.page.ontologyEditorPage().selectItem('Other Class');
    },

    'Step 7: Apply the Active Entity Filter' : function(browser) {
        browser.useCss()
            .waitForElementVisible('.hierarchy-filter a')
            .click('.hierarchy-filter a')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//class-hierarchy-block//hierarchy-tree//hierarchy-filter'})
            .click('xpath', '//span[text()[contains(., "Hide unused imports")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//button//span[text()[contains(., "Apply")]]'})
            .click('xpath', '//button//span[text()[contains(., "Apply")]]')
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//span[text()[contains(., "Hide unused imports")]]'})
    },

    'Step 8: Ensure that imported entities have been filtered out' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemNotVisible('Class 3')
            .verifyItemNotVisible('Other Class')
    },

    'Step 9: Ensure that all active entities are visible' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 1')
            .verifyItemVisible('Class 0')
    },

    'Step 10: Ensure that imported parents of active entities are visible' : function(browser) {
        browser.page.ontologyEditorPage().verifyItemVisible('Class 2');
    },

    'Step 11: Ensure the selected entity view is still visible to the user, even if the entity is filtered out of the active list.': function(browser) {
        browser.page.ontologyEditorPage().verifySelectedEntity('Other Class');
    },

    'Step 12: Remove the Active Entity filter' : function(browser) {
        browser.useCss()
            .waitForElementVisible('.hierarchy-filter a')
            .click('.hierarchy-filter a')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//class-hierarchy-block//hierarchy-tree//hierarchy-filter'})
            .click('xpath', '//span[text()[contains(., "Hide unused imports")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//button//span[text()[contains(., "Apply")]]'})
            .click('xpath', '//button//span[text()[contains(., "Apply")]]')
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//span[text()[contains(., "Hide unused imports")]]'})
    },

    'Step 13: Verify the Active Entity filtered state was applied to the pre-filtered state' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 0')
            .verifyItemVisible('Class 2')
            .verifyItemVisible('Class 3')
            .verifyItemVisible('Other Class')
            .verifyItemVisible('Class 1');
    },

    'Step 14: Verify that a message is displayed when no entities match the filter criteria' : function(browser) {
        browser.useCss()
            .assert.visible('search-bar input')
            .setValue('search-bar input', '3')
            .sendKeys('search-bar input', browser.Keys.ENTER)
            .click('.hierarchy-filter a')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//class-hierarchy-block//hierarchy-tree//hierarchy-filter'})
            .click('xpath', '//span[text()[contains(., "Hide unused imports")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//button//span[text()[contains(., "Apply")]]'})
            .click('xpath', '//button//span[text()[contains(., "Apply")]]')
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//span[text()[contains(., "Hide unused imports")]]'})
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'No classes match your filter.')
    }
}
