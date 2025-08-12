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
var ontology01 = {
    title: 'myTitle2', 
    description: 'myDescription'
};

/**
 * Functional Test for Merge Request Module
 * 
 * Functions Tested:
 * - Merging with and without branch removal
 */
module.exports = {
    '@tags': ['ontology-editor', 'sanity', 'merge-requests'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
    },

    'Step 2: Ensure that user is on Ontology editor page' : function(browser) {
        browser.page.ontologyEditorPage().isActive();
    },

    'Step 3: Create New Ontology' : function(browser) {
        browser.page.ontologyEditorPage().createOntology(ontology01.title, ontology01.description);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Verify new ontology properties' : function(browser) {
        browser.page.ontologyEditorPage().verifyProjectTab(ontology01.title, ontology01.description, 'MyTitle2')
    },

    'Step 5: Edit IRI for ontology' : function(browser) {
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().editIri('myOntology2');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Commit IRI change' : function(browser) { 
        browser.page.ontologyEditorPage().commit('Changed IRI');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 7: Ensure IRI changes are shown in the record select' : function(browser) {
        browser.page.ontologyEditorPage().searchForOntology('myTitle');
        browser
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()[contains(., "' + ontology01.title + '")]]//p[text()[contains(., "myOntology2")]]')
        browser.page.ontologyEditorPage().onProjectTab();
    }, 

    'Step 8: Create a new branch' : function(browser) {
        browser.page.ontologyEditorPage().createBranch('newBranchTitle2', 'newBranchDescription');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Verify that branch was switched to the new branch' : function(browser) {
        browser
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', ontology01.title)
            .assert.valueEquals('@editorBranchSelectInput', 'newBranchTitle2');
    }, 

    'Step 10: Verify no uncommitted changes are shown': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser)
        browser.page.ontologyEditorPage().verifyUncommittedChanges(false);
        browser.page.ontologyEditorPage().verifyChangePageCommitNum(0);
        browser.useCss()
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(2)
        browser.page.ontologyEditorPage().toggleChangesPage(false);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 11: Verify merge submit cannot be clicked': function(browser) {
        browser.page.editorPage()
            .click('@mergeBranchesButton');
        browser
            .waitForElementVisible('app-merge-page branch-select input')
            .waitForElementVisible('app-merge-page button.mat-primary')
            .waitForElementVisible('.merge-message')
            .assert.textContains('.merge-message', 'newBranchTitle2')
            .click('app-merge-page branch-select')
            .waitForElementVisible('xpath', '//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('xpath', '//div//mat-option//span[contains(text(), "MASTER")]');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('.merge-block .btn-container button.mat-primary[disabled=true]') // Intermittent failure
            .click('.merge-block .btn-container button:not(.mat-primary)');
    },

    'Step 12: Verify again in merge requests tab': function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'button.new-request-btn');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().createNewRequest();
        browser.page.mergeRequestPage().clickMatCard(ontology01.title);
        browser.page.mergeRequestPage().createRequestNext();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().createRequestSourceBranchSelect('newBranchTitle2');
        browser.page.mergeRequestPage().createRequestTargetBranchSelect('MASTER');
        browser
            .useXpath()
            .assert.not.enabled('//button//span[contains(text(), "Next")]/parent::button')
            .assert.enabled('//button//span[text()="Back"]')
            .click('//button//span[text()="Back"]')
            .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .waitForElementVisible('//button//span[text()="Cancel"]')
            .click('//button//span[text()="Cancel"]')
            .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
    },

    'Step 13: Open Ontology Editor' : function(browser) {
          browser.globals.wait_for_no_spinners(browser)
          browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
          browser.globals.wait_for_no_spinners(browser);
          browser.page.ontologyEditorPage().isActive();
      },

    'Step 14: Ensure the ontology is still open' : function(browser) {
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', ontology01.title)
            .assert.valueEquals('@editorBranchSelectInput', 'newBranchTitle2');
    },

    'Step 15: Create new Classes': function(browser) {
        browser.page.ontologyEditorPage().createNewOwlClass('firstClass', 'firstClassDescription');
        for (var i = 2; i <= 10; i++) {
            browser.page.ontologyEditorPage().createNewOwlClass('class' + i + 'Title', 'class' + i + 'Description');
            browser.globals.wait_for_no_spinners(browser);
        }
    },

    'Step 16: Verify class was created': function(browser) {
        browser.page.ontologyEditorPage()
            .openClassesTab()
            .verifyItemVisible('firstClass');
    },

    'Step 17: Verify changes are shown': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.page.ontologyEditorPage().verifyChangePageCommitNum(10);
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

    'Step 18: Commit changes and verify commit was made successfully': function(browser) {
        browser.page.ontologyEditorPage().commit('commit123');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().verifyUncommittedChanges(false);
        browser.page.ontologyEditorPage().verifyChangePageCommitNum(0);
        browser.useCss()
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(3);
        browser.globals.dismiss_toast(browser);
    },

    'Step 19: Create a merge request': function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'button.new-request-btn');
        browser.globals.wait_for_no_spinners(browser);
        // Start New Request, select the ontology record, and click Next
        browser.page.mergeRequestPage().createNewRequest();
        browser.page.mergeRequestPage().clickMatCard(ontology01.title);
        browser.page.mergeRequestPage().createRequestNext();
        browser.globals.wait_for_no_spinners(browser);
        // Select checkbox to remove branch after acceptance and add admin as assignee
        browser.page.mergeRequestPage().createRequestSourceBranchSelect('newBranchTitle2');
        browser.page.mergeRequestPage().createRequestTargetBranchSelect('MASTER');
        browser.page.mergeRequestPage().createRequestNext();
        browser.globals.wait_for_no_spinners(browser);

        browser.page.mergeRequestPage().createRequestSubmit();
        browser.globals.wait_for_no_spinners(browser);
        
        browser.globals.dismiss_toast(browser);
    },

    'Step 20: Accept the merge request': function(browser) {
        browser.page.mergeRequestPage().selectRequest('newBranchTitle2');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().acceptRequest();
    },

    'Step 21: Create branch used for branch removal Merge Request': function(browser) {
        browser.useCss()
            .globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().createBranch('newBranchTitle3Removal', 'newBranchDescriptionBranchRemoval');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', ontology01.title)
            .assert.valueEquals('@editorBranchSelectInput', 'newBranchTitle3Removal');
    },

    'Step 22: Add commits to branch': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage(false);
        browser.globals.wait_for_no_spinners(browser);
        for (var i = 2; i <= 30; i++) {
            browser.page.ontologyEditorPage().createNewOwlClass('classRemoval' + i + 'Title', 'classRemoval' + i + 'Description');
            browser.globals.wait_for_no_spinners(browser);
            browser.page.ontologyEditorPage().commit('commit123Removal' + i);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        }
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 23: Create a merge request': function(browser) {
        browser.useCss()
            .globals.switchToPage(browser, 'merge-requests', 'button.new-request-btn');
        browser.page.mergeRequestPage().verifyRecordFilters();
        browser.page.mergeRequestPage().verifyMergeRequestList();
        browser.page.mergeRequestPage().verifyMergePageSort();

        // Start New Request, select the ontology record, and click Next
        browser.page.mergeRequestPage().createNewRequest();
        browser.page.mergeRequestPage().clickMatCard(ontology01.title);
        browser.page.mergeRequestPage().createRequestNext();
        browser.globals.wait_for_no_spinners(browser);
        // Select the source and target branches and click Next
        browser.page.mergeRequestPage().createRequestSourceBranchSelect('newBranchTitle3Removal');
        browser.page.mergeRequestPage().createRequestTargetBranchSelect('MASTER');
        browser.page.mergeRequestPage().createRequestNext();
        browser.globals.wait_for_no_spinners(browser);
        // Select checkbox to remove branch after acceptance and add admin as assignee
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//create-request//mat-checkbox//span[contains(text(), "Remove")]')
            .click('//merge-requests-page//create-request//mat-checkbox//span[contains(text(), "Remove")]')
            .waitForElementVisible('//merge-requests-page//create-request//div[contains(@class, "assignee-input")]//div[contains(@class, "mat-form-field-infix")]//input')
            .click('//merge-requests-page//create-request//div[contains(@class, "assignee-input")]//div[contains(@class, "mat-form-field-infix")]//input')
            .waitForElementVisible('//mat-option//span[text()[contains(., "' + browser.globals.adminUsername + '")]]')
            .click('//mat-option//span[text()[contains(., "' + browser.globals.adminUsername + '")]]')
        browser.page.mergeRequestPage().createRequestSubmit();
        browser.globals.dismiss_toast(browser);
    },

    'Step 24: Ensure the request status filter works': function(browser) {
        // Confirm the status filter is present
        browser.page.mergeRequestPage().verifyFilterHeader('Request Status');

        // Verify the correct amount of options is available
        var statusOptions = ['Open', 'Closed', 'Accepted'];
        browser.page.mergeRequestPage().verifyFilterItems('Request Status', statusOptions)

        // Select the closed status filter
        browser.page.mergeRequestPage().changeStatusType('Closed');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().assertNumFilterChips(0);
        browser.useCss()
            .expect.element('div.merge-request-list info-message p').text.to.contain('No requests found');

        // Select the accepted status filter
        var acceptedRequestXPath = '//merge-request-list//div//span[contains(@class, "request-info-title")][text()[contains(., "newBranchTitle2")]]'
        browser.page.mergeRequestPage().changeStatusType('Accepted');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().assertNumFilterChips(0);
        browser.useXpath()
            .assert.elementPresent(acceptedRequestXPath)

        // Select the open status filter
        browser.page.mergeRequestPage().changeStatusType('Open');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().assertNumFilterChips(0);
    },

    'Step 25: Filter the merge request list by creator': function(browser) {
        // Confirm the Creator filter is present
        browser.page.mergeRequestPage().verifyFilterHeader('Creators');

        // Submit a search of the creator filter
        browser.page.mergeRequestPage().searchFilterList('Creators', 'ad');
        browser.globals.wait_for_no_spinners(browser);

        // Select the admin creator filter
        browser.page.mergeRequestPage().toggleFilterItem('Creators', browser.globals.adminUsername + ' (2)');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().assertNumFilterChips(1);
        browser.page.mergeRequestPage().assertFilterChipExists(browser.globals.adminUsername);
        browser.useCss()
            .assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal');

        // Unselect the admin creator filter
        browser.page.mergeRequestPage().toggleFilterItem('Creators', browser.globals.adminUsername + ' (2)');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().assertNumFilterChips(0);
    },

    'Step 26: Filter the merge request list by assignee': function(browser) {
        // Confirm the Creator filter is present
        browser.page.mergeRequestPage().verifyFilterHeader('Assignees');

        // Submit a search of the assignee filter
        browser.page.mergeRequestPage().searchFilterList('Assignees', 'ad');

        // Select the admin creator filter
        browser.page.mergeRequestPage().toggleFilterItem('Assignee', browser.globals.adminUsername + ' (1)');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().assertNumFilterChips(1);
        browser.page.mergeRequestPage().assertFilterChipExists(browser.globals.adminUsername);
        browser.useCss()
            .assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal');

        // Keep admin creator selected for reset test nextUnselect the admin creator filter
    },

    'Step 27: Reset button clears chips': function(browser) {
      // Add another filter for reset test
      browser.page.mergeRequestPage().toggleFilterItem('Creators', browser.globals.adminUsername);
      browser.globals.wait_for_no_spinners(browser);
      browser.page.mergeRequestPage().assertNumFilterChips(2);

      // Reset filters
      browser.page.mergeRequestPage().resetFilters();
      browser.globals.wait_for_no_spinners(browser);
      browser.page.mergeRequestPage().assertNumFilterChips(0);
    },

    'Step 28: Search the merge request list': function(browser) {
        // Test no requests are shown
        browser.page.mergeRequestPage().searchList('NONE');
        browser.waitForElementVisible('div.merge-request-list info-message');
        browser.expect.element('div.merge-request-list info-message p').text.to.contain('No requests found');

        // Test searching with some results
        browser.page.mergeRequestPage().searchList('rem');
        browser.assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal')
    },

    'Step 29: Accept the merge request': function(browser) {
        browser.page.mergeRequestPage().selectRequest('newBranchTitle3Removal');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().acceptRequest();
    }
}
