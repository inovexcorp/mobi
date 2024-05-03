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
var adminUsername = 'admin';
var adminPassword = 'admin';

var ontology01 = {
    title: 'myTitle2', 
    description: 'myDescription'
};

var createFilterXPathSelector = function(filterTypeHeader, filterOption) {
    var selectors = ['//merge-requests-page',
        '//merge-request-filter//div[contains(@class, "merge-request-filter")]//mat-expansion-panel-header',
        '//mat-panel-title[contains(@class, "mat-expansion-panel-header-title")][text()[contains(.,"' + filterTypeHeader + '")]]//ancestor::mat-expansion-panel',
        '//div[contains(@class, "mat-expansion-panel-content")]'
    ];
    if (filterOption) {
        selectors = selectors.concat([
            '//div[contains(@class, "filter-option")]//mat-checkbox',
            '//span[contains(@class, "mat-checkbox-label")][text()[contains(., "' + filterOption + '")]]',
            '//ancestor::mat-checkbox//label[contains(@class, "mat-checkbox-layout")]'
        ]);
    }
    return selectors.join('');
}

/**
 * Functional Test for Merge Request Module
 * 
 * Functions Tested:
 * - Merging with and without branch removal
 */
module.exports = {
    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
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
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()[contains(., "' + ontology01.title + '")]]//p[text()[contains(., "https://mobi.com/ontologies/myOntology2")]]')
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
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
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
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
            .useCss();
    },

    'Step 17: Verify changes are shown': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser
            .useCss()
            .waitForElementVisible('app-changes-page div.changes-info button.mat-warn')
            .expect.elements('app-changes-page mat-expansion-panel').count.to.equal(10);
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
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
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
        // Select checkbox to remove branch after acceptance and add admin as assignee
        browser.page.mergeRequestPage().createRequestSourceBranchSelect('newBranchTitle2');
        browser.page.mergeRequestPage().createRequestTargetBranchSelect('MASTER');
        browser.page.mergeRequestPage().createRequestNext();

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
        // Select the source and target branches and click Next
        browser.page.mergeRequestPage().createRequestSourceBranchSelect('newBranchTitle3Removal');
        browser.page.mergeRequestPage().createRequestTargetBranchSelect('MASTER');
        browser.page.mergeRequestPage().createRequestNext();
        // Select checkbox to remove branch after acceptance and add admin as assignee
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//create-request//mat-checkbox//span[contains(text(), "Remove")]')
            .click('//merge-requests-page//create-request//mat-checkbox//span[contains(text(), "Remove")]')
            .waitForElementVisible('//merge-requests-page//create-request//div[contains(@class, "assignee-input")]//div[contains(@class, "mat-form-field-infix")]//input')
            .click('//merge-requests-page//create-request//div[contains(@class, "assignee-input")]//div[contains(@class, "mat-form-field-infix")]//input')
            .waitForElementVisible('//mat-option//span[text()[contains(., "' + adminUsername + '")]]')
            .click('//mat-option//span[text()[contains(., "' + adminUsername + '")]]')
        browser.page.mergeRequestPage().createRequestSubmit();
        browser.globals.dismiss_toast(browser);
    },

    'Step 24: Ensure the request status filter works': function(browser) {
        // Confirm the status filter is present
        var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };
        var statusFilterXPathSelector = createFilterXPathSelector('Request Status');
        browser.assert.elementPresent({ selector: statusFilterXPathSelector, locateStrategy: 'xpath' });

        // Verify the correct amount of options is available
        var radioButtonSelector = '//div[contains(@class, "filter-option")]//mat-radio-group//mat-radio-button';
        var statusFilterElementSelector = statusFilterXPathSelector +  radioButtonSelector;
        browser.assert.elementsCount({ selector: statusFilterElementSelector, locateStrategy: 'xpath' }, 3)

        // Select the closed status filter
        var closedRadioLabelSelector = '//span[contains(@class, "mat-radio-label")][text()[contains(., "Closed")]]';
        var openRadioLabelSelector = '//span[contains(@class, "mat-radio-label")][text()[contains(., "Open")]]';
        var acceptedRadioLabelSelector = '//span[contains(@class, "mat-radio-label")][text()[contains(., "Accepted")]]';
        var closedStatusFilterXPathSelector = statusFilterElementSelector + closedRadioLabelSelector;
        browser.assert.elementPresent({ selector: closedStatusFilterXPathSelector, locateStrategy: 'xpath' });
        browser.click('xpath', closedStatusFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .expect.element('div.merge-request-list info-message p').text.to.contain('No requests found');

        //select the accepted status filter
        var acceptedStatusFilterXPathSelector = statusFilterElementSelector + acceptedRadioLabelSelector;
        var acceptedRequestXPath = '//merge-request-list//div//span[contains(@class, "request-info-title")][text()[contains(., "newBranchTitle2")]]'
        browser.assert.elementPresent({ selector: acceptedStatusFilterXPathSelector, locateStrategy: 'xpath' });
        browser.click('xpath', acceptedStatusFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
        browser.useXpath()
            .assert.elementPresent(acceptedRequestXPath)

        // Select the open status filter
        browser.click('xpath', statusFilterElementSelector + openRadioLabelSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 25: Filter the merge request list by creator': function(browser) {
        // Confirm the Creator filter is present
        var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };
        var creatorFilterXPathSelector = createFilterXPathSelector('Creators');
        browser.assert.elementPresent({ selector: creatorFilterXPathSelector, locateStrategy: 'xpath' });
        // Submit a search of the creator filter
        var creatorSearchXPathSelector = creatorFilterXPathSelector + '//input';
        browser.assert.elementPresent({ selector: creatorSearchXPathSelector, locateStrategy: 'xpath' });
        browser
            .useXpath()
            .sendKeys(creatorSearchXPathSelector, ['ad', browser.Keys.ENTER])
            .useCss()
            .waitForElementNotPresent('#spinner-full');

        // Select the admin creator filter
        var adminCreatorFilterXPathSelector = createFilterXPathSelector('Creators', adminUsername + ' (2)');
        browser.assert.elementPresent({ selector: adminCreatorFilterXPathSelector, locateStrategy: 'xpath' });
        browser.click('xpath', adminCreatorFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal');

        // Unselect the admin creator filter
        browser.click('xpath', adminCreatorFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 26: Filter the merge request list by assignee': function(browser) {
        // Confirm the Creator filter is present
        var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };
        var assigneeFilterXPathSelector = createFilterXPathSelector('Assignees');
        browser.assert.elementPresent({ selector: assigneeFilterXPathSelector, locateStrategy: 'xpath' });

        // Submit a search of the assignee filter
        var assigneeSearchXPathSelector = assigneeFilterXPathSelector + '//input';
        browser.assert.elementPresent({ selector: assigneeSearchXPathSelector, locateStrategy: 'xpath' });
        browser
            .useXpath()
            .sendKeys(assigneeSearchXPathSelector, ['ad', browser.Keys.ENTER])
            .useCss()
            .waitForElementNotPresent('#spinner-full');

        // Select the admin creator filter
        var adminAssigneeFilterXPathSelector = createFilterXPathSelector('Assignee', adminUsername + ' (1)');
        browser.assert.elementPresent({ selector: adminAssigneeFilterXPathSelector, locateStrategy: 'xpath' });
        browser.click('xpath', adminAssigneeFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal');

        // Unselect the admin creator filter
        browser.click('xpath', adminAssigneeFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 27: Search the merge request list': function(browser) {
        // Test no requests are shown
        browser.page.mergeRequestPage().searchList('NONE');
        browser.waitForElementVisible('div.merge-request-list info-message');
        browser.expect.element('div.merge-request-list info-message p').text.to.contain('No requests found');

        // Test searching with some results
        browser.page.mergeRequestPage().searchList('rem');
        browser.assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal')
    },

    'Step 28: Accept the merge request': function(browser) {
        browser.page.mergeRequestPage().selectRequest('newBranchTitle3Removal');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().acceptRequest();
    }
}
