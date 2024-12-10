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
        browser.page.ontologyEditorPage().createOntology('myTitle', 'myDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Verify new ontology properties' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
        browser.page.ontologyEditorPage().verifyProjectTab('myTitle', 'myDescription', 'MyTitle')
    },

    'Step 5: Edit IRI for ontology' : function(browser) { 
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().editIri('myOntology');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Commit IRI Change' : function(browser) {
        browser.page.ontologyEditorPage().commit('Changed IRI');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 7: Ensure IRI changes are shown in the record select' : function(browser) {
      browser.page.ontologyEditorPage().searchForOntology('myTitle');
      browser
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()[contains(., "myTitle")]]//p[text()[contains(., "myOntology")]]')
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 8: Create a new branch' : function(browser) {
        browser.page.ontologyEditorPage().createBranch('newBranchTitle', 'newBranchDescription');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Verify a new branch was created' : function(browser) {
        browser
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'myTitle')
            .assert.valueEquals('@editorBranchSelectInput', 'newBranchTitle');
    },

    'Step 10: Create a new Class': function(browser) {
        browser.page.ontologyEditorPage().createNewOwlClass('firstClass', 'firstClassDescription');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 11: Verify class was created': function(browser) {
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .verifyItemVisible('firstClass');
    },

    'Step 12: Verify changes are shown': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser
            .useCss()
            .waitForElementVisible('app-changes-page div.changes-info button.mat-warn')
            // Used selector object because it was determined to use xpath despite the useCss right before...
            .expect.elements({
                locateStrategy: 'css selector',
                selector: 'app-changes-page mat-expansion-panel'
            }).count.to.equal(1);
        browser
            .useCss()
            .waitForElementVisible('app-changes-page mat-expansion-panel mat-panel-title[title*="firstClass"]')
            .assert.textContains('app-changes-page mat-expansion-panel mat-panel-title[title*="firstClass"]', 'firstClass') // Verify Title
            .click('app-changes-page mat-expansion-panel mat-panel-title[title*="firstClass"]')
            .waitForElementVisible('app-changes-page commit-compiled-resource')
            .assert.textContains('app-changes-page commit-compiled-resource p.type-label', "Type(s)")
            .assert.textContains('app-changes-page commit-compiled-resource p.type-label ~ div.type div.px-4', 'owl:Class')
            .useXpath()
            .assert.textContains('//app-changes-page//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]', "Description")
            .assert.textContains('//app-changes-page//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClassDescription')
            .assert.textContains('//app-changes-page//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]', "Title")
            .assert.textContains('//app-changes-page//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClass')
            .useCss();
    },

    'Step 13: Commit Changes': function(browser) {
        browser.page.ontologyEditorPage().commit('commit123');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(3);
        browser.globals.dismiss_toast(browser);
    },

    'Step 14: Verify Commits': function(browser) {
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "commit123")]]')
    },

    'Step 15: Open the Create Data Property Modal': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage(false);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().openCreateOwlDataPropertyModal();
        browser
            .useXpath()
            .waitForElementVisible('//create-data-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Functional Property")]]')
            .click('//create-data-property-overlay//span[text()="Cancel"]')
            .useCss()
            .waitForElementNotPresent('create-data-property-overlay h1.mat-dialog-title')
    },

    'Step 16: Open the Create Object Property Modal': function(browser) {
        browser.page.ontologyEditorPage().openCreateOwlObjectPropertyModal();
        browser
            .useXpath()
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Functional Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Asymmetric Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Symmetric Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Transitive Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Reflexive Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Irreflexive Property")]]')
            .click('//create-object-property-overlay//span[text()="Cancel"]')
            .useCss()
            .waitForElementNotPresent('create-object-property-overlay h1.mat-dialog-title')
    },

    'Step 17: Verify Master Branch only has initial commit': function(browser) {
        browser.page.ontologyEditorPage().switchBranch('MASTER');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'myTitle')
            .assert.valueEquals('@editorBranchSelectInput', 'MASTER');
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementNotPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "commit123")]]')
            .assert.elementPresent( '//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
            .useCss();
    },

    'Step 18: Switch back to the other branch': function(browser) {
        browser.page.ontologyEditorPage().switchBranch('newBranchTitle');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'myTitle')
            .assert.valueEquals('@editorBranchSelectInput', 'newBranchTitle');
    },

    'Step 19: Perform a merge': function(browser) {
        browser.page.editorPage()
            .click('@mergeBranchesButton')
        browser
            .waitForElementVisible('app-merge-page branch-select input')
            .waitForElementVisible('app-merge-page button.mat-primary')
            .click('app-merge-page branch-select')
            .waitForElementVisible('xpath', '//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('xpath', '//div//mat-option//span[contains(text(), "MASTER")]')
        browser
            .useCss()
            .waitForElementVisible('.merge-block commit-changes-display mat-panel-title[title*="firstClass"]')
            .assert.textContains('.merge-block commit-changes-display mat-panel-title[title*="firstClass"]', 'firstClass')
            .waitForElementVisible('.merge-block commit-changes-display mat-panel-title[title*="firstClass"] ~ mat-panel-description small')
            .assert.textContains('.merge-block commit-changes-display mat-panel-title[title*="firstClass"] ~ mat-panel-description small', 'myOntology#FirstClass')
            .click('.merge-block commit-changes-display mat-panel-title[title*="firstClass"]')
            .waitForElementVisible('.merge-block commit-compiled-resource')
            .assert.textContains('.merge-block commit-compiled-resource p.type-label', "Type(s)")
            .assert.textContains('.merge-block commit-compiled-resource p.type-label ~ div.type div.px-4', 'owl:Class')
            .useXpath()
            .assert.textContains('//div[contains(@class, "merge-block")]//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]', "Description")
            .assert.textContains('//div[contains(@class, "merge-block")]//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClassDescription')
            .assert.textContains('//div[contains(@class, "merge-block")]//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]', "Title")
            .assert.textContains('//div[contains(@class, "merge-block")]//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClass')
        browser.useCss()
            .click('app-merge-page button.mat-primary')
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 20: Validate Merged Commits': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage(); // Merging closed the changes page
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('app-changes-page')
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "The initial commit.")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "commit123")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "Merge of newBranchTitle into MASTER")]]')
    }
}
