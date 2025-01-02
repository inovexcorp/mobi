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
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/deprecated-entity-filter-1.ttl');
var Onto2 = path.resolve(__dirname + '/../../resources/rdf_files/deprecated-entity-filter-2.ttl');
var Onto3 = path.resolve(__dirname + '/../../resources/rdf_files/deprecated-entity-filter-3.ttl');

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        [Onto1, Onto2, Onto3].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 3: Open deprecated-entity-filter-1 Ontology' : function(browser) {
        browser.page.ontologyEditorPage().openOntology('deprecated-entity-filter-1');
        browser.globals.wait_for_no_spinners(browser);  
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Click classes tab' : function(browser) {
          browser.page.ontologyEditorPage().openClassesTab();
    },

    'Step 5: Check for Ontology classes' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 1a')
            .verifyItemVisible('Class 2a')
            .verifyItemVisible('Class 3a')
            .verifyItemNotVisible('Class 1b');
    },

    'Step 6: Click on a deprecated class' : function(browser) {
        browser.page.ontologyEditorPage().selectItem('Class 3a');
    },

    'Step 7: Apply the Deprecated Filter' : function(browser) {
        browser.useCss()
            .waitForElementVisible('.hierarchy-filter a')
            .click('.hierarchy-filter a')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//class-hierarchy-block//hierarchy-tree//hierarchy-filter'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//mat-checkbox//span[text()[contains(., "Hide deprecated classes")]]'})
            .click('xpath', '//mat-checkbox//span[text()[contains(., "Hide deprecated classes")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//button//span[text()[contains(., "Apply")]]'})
            .click('xpath', '//button//span[text()[contains(., "Apply")]]')
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//span[text()[contains(., "Hide unused imports")]]'})
    },

    'Step 8: Ensure that correct classes are shown' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 1a')
            .verifyItemVisible('Class 1b')
            .verifyItemVisible('Class 1c')
            .verifyItemVisible('Class 2a')
            .verifyItemVisible('Class 2b')
            .verifyItemNotVisible('Class 3a');
    },

    'Step 9: Remove Deprecated Entity Filter' : function(browser) {
       browser.useCss()
           .waitForElementVisible('.hierarchy-filter a')
           .click('.hierarchy-filter a')
           .waitForElementVisible({locateStrategy: 'xpath', selector: '//class-hierarchy-block//hierarchy-tree//hierarchy-filter'})
           .waitForElementVisible({locateStrategy: 'xpath', selector: '//mat-checkbox//span[text()[contains(., "Hide deprecated classes")]]'})
           .click('xpath', '//mat-checkbox//span[text()[contains(., "Hide deprecated classes")]]')
           .waitForElementVisible({locateStrategy: 'xpath', selector: '//button//span[text()[contains(., "Apply")]]'})
           .click('xpath', '//button//span[text()[contains(., "Apply")]]')
           .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//span[text()[contains(., "Hide unused imports")]]'})
    },

   'Step 10: Ensure that correct classes are shown' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 1a')
            .verifyItemVisible('Class 1b')
            .verifyItemVisible('Class 1c')
            .verifyItemVisible('Class 2a')
            .verifyItemVisible('Class 2b')
            .verifyItemVisible('Class 3a');
   },

    'Step 11: Verify that a message is displayed when no entities match the filter criteria' : function(browser) {
        browser.useCss()
            .assert.visible('search-bar input')
            .setValue('search-bar input', 'ddadf')
            .sendKeys('search-bar input', browser.Keys.ENTER)
            .click('.hierarchy-filter a')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//class-hierarchy-block//hierarchy-tree//hierarchy-filter'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//mat-checkbox//span[text()[contains(., "Hide deprecated classes")]]'})
            .click('xpath', '//mat-checkbox//span[text()[contains(., "Hide deprecated classes")]]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//button//span[text()[contains(., "Apply")]]'})
            .click('xpath', '//button//span[text()[contains(., "Apply")]]')
            .assert.not.elementPresent({locateStrategy: 'xpath', selector: '//span[text()[contains(., "Hide unused imports")]]'})
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'No classes match your filter.')
    }
}
