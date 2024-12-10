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

    'Step 3: Create New Ontology': function(browser) {
        browser.page.ontologyEditorPage().createOntology('Metadata Test Ontology', 'Metadata Test Description');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 5: Create a new Class': function(browser) {
        browser.page.ontologyEditorPage().createNewOwlClass('class A');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Verify class was created': function(browser) {
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .verifyItemVisible('class A');
    },

    'Step 7: Commit Changes': function(browser) {
        browser.page.ontologyEditorPage().commit('commit123');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 8: Verify Commit': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2);
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "commit123")]]')
    },

    'Step 9: Make Changes to Class': function(browser) {
        var classTitleSelector = '//value-display//div//span[text()[contains(.,"class A")]]'
        var annotationSelector = classTitleSelector + '//ancestor::div[@class[contains(.,"prop-value-container")]]//button[@title="Edit"]'

        browser.page.ontologyEditorPage().toggleChangesPage(false);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .selectItem('class A')
            .useXpath()
            .waitForElementVisible(classTitleSelector)
            .moveToElement(classTitleSelector, 0, 0)
            .waitForElementVisible(annotationSelector)
            .click(annotationSelector)
            .useCss()
            .waitForElementVisible('annotation-overlay textarea')
            .clearValue('annotation-overlay textarea')
            .setValue('annotation-overlay textarea', 'A Edited')
            .click('annotation-overlay div.mat-dialog-actions button.mat-primary')
            .waitForElementNotPresent('annotation-overlay div.mat-dialog-actions button:not(.mat-primary)');
    },

    'Step 10: Verify Changes to Class': function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage()
            .verifyItemVisible('A Edited')
            .verifySelectedEntity('A Edited');
    },

    'Step 11: Commit Changes': function(browser) {
        browser.page.ontologyEditorPage().commit('commit456');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 12: Verify Commit': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(3);
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "The initial commit.")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "commit123")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "commit456")]]')
    },

    'Step 13: Close & Re-open Ontology' : function(browser) {
        browser.page.ontologyEditorPage().closeOntology('Metadata Test Ontology');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().openOntology('Metadata Test Ontology');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 14: Verify Presentation of Class A' : function(browser) {
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .verifyItemNotVisible('class A')
            .selectItem('A Edited')
            .useXpath()
            .assert.visible('//value-display//div//span[text() = "A Edited"]//ancestor::property-values//p[text()[contains(.,"Title")]]')
            .assert.not.elementPresent('//value-display//div//span[text()[contains(.,"Class A")]]//ancestor::property-values//p[text()[contains(.,"Title")]]')
    }
}
