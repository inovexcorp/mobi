
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

var adminUser = {
    'username': 'admin', 
    'password': 'admin',
};

// User to create Ontology/MR with
var user01 = {
    'username': 'mrUser001OpenClose', 
    'password': 'password',
    'firstName': 'mrUser001OpenClose', 
    'lastName': 'mrLastName001OpenClose', 
    'email': 'mrUser001OpenClose@gmail.com', 
    'role': 'admin' 
};

// User with no permissions
var user02 = {
    'username': 'mrUser002OpenClose', 
    'password': 'password',
    'firstName': 'mrUser002OpenClose', 
    'lastName': 'mrLastName002OpenClose', 
    'email': 'mrUser002OpenClose@gmail.com', 
    'role': 'admin' 
};

var ontologyMrPermission_title = 'ontMrTestOpenClose';
var ontologyMrPermission_desc = 'ontMrTestOpenCloseMyDescription';
var ontologyMrPermission_staticIri = 'OntMrTestOpenClose';
var branchTitle = 'mrBranchOpenClose';
var masterBranchTitle = 'MASTER';

/**
 * Functional Test for Merge Request Module
 * 
 * Functions Tested:
 * Open MRs are displayed with a Close button
 * - Close button is disabled if the user is not the creator of the MR or a user with manage permissions on the MR’s associated VersionedRDFRecord
 * - When the button is clicked, a confirmation modal should be displayed before the close action is taken
 * When viewing an individual MR, if it is closed…
 * - The status indicator in the top right says “Closed”
 * - The title of the originally selected branches are displayed
 * - The comment history is displayed
 * - The changes and commits are displayed only if the sourceCommit and targetCommit are set
 * - Only the Delete button is shown (as well as the button to go back)
 */

// TODO Change Functional test to meet above ACS
module.exports = {

    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUser.username, adminUser.password)
    },

    // Create 2 users, one user to create Ontology/MR and one user to test permissions
    'Step 2: The user clicks on the Administration sidebar link' : function(browser) {
        browser.globals.switchToPage(browser, 'user-management')
    },

    'Step 3: A new user mrUser001 is created' : function(browser) {
        browser.page.administrationPage().createUser(user01);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 4: The new user is displayed in users list' : function(browser) {
        browser.page.administrationPage().validateUserList(user01.firstName);
    },

    'Step 3: A new user mrUser002 is created' : function(browser) {
        browser.page.administrationPage().createUser(user02);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 4: mrUser002 is displayed in users list' : function(browser) {
        browser.page.administrationPage().validateUserList(user02.firstName);
    },

    'Step 5: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    // Login as user, create Ontology/MR
    'Step 6: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, user01.username, user01.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 7: Ensure that user is on Ontology editor page' : function(browser) {
        browser.globals.switchToPage(browser, 'ontology-editor', 'button.upload-button');
        browser.page.editorPage().isActive();
    },

    'Step 8: Open new Ontology Overlay' : function(browser) {
        browser.page.editorPage().openNewOntologyOverlay();
    },

    'Step 9: Edit New Ontology Overlay' : function(browser) {
        browser.page.editorPage().editNewOntologyOverlay(ontologyMrPermission_title, ontologyMrPermission_desc);
    },

    'Step 10: Submit New Ontology Overlay' : function(browser) {
        browser.page.editorPage().submitNewOntologyOverlay();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().onProjectTab();
    },

    'Step 11: Verify new ontology properties' : function(browser) {
        browser.page.editorPage().onProjectTab();
        browser.page.editorPage().verifyProjectTab(ontologyMrPermission_title, ontologyMrPermission_desc, ontologyMrPermission_staticIri)
    },

    'Step 12: Create a new branch' : function(browser) {
        browser.page.editorPage().openNewBranchOverlay();
        browser.page.editorPage().editNewBranchOverlayAndSubmit(branchTitle, 'newBranchDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .waitForElementNotPresent('create-branch-overlay')
            .waitForElementNotPresent('create-branch-overlay h1.mat-dialog-title');
    },

    'Step 13: Verify that branch was switched to the new branch' : function(browser) {
        browser.page.editorPage().verifyBranchSelection(branchTitle);
    }, 

    'Step 14: Switch to new branch' : function(browser) {
        browser.page.editorPage().switchToBranch(branchTitle);
    },

    'Step 15: Verify no uncommitted changes are shown': function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Changes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Changes")]]')
            .useCss()
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'You don\'t have any uncommitted changes.')
            .assert.not.elementPresent('saved-changes-tab .expansion-panel');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Project")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Project")]]');
        browser.page.editorPage().onProjectTab();
    },

    'Step 16: Create new Classes': function(browser) {
        browser.page.editorPage().createNewOwlClass('firstClass', 'firstClassDescription');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .waitForElementNotPresent('create-class-overlay')
            .waitForElementNotPresent('create-class-overlay h1.mat-dialog-title');
        for (var i = 2; i <= 10; i++) {
            browser.page.editorPage().createNewOwlClass('class' + i + 'Title', 'class' + i + 'Description');
            browser.globals.wait_for_no_spinners(browser);
            browser
                .useCss()
                .waitForElementNotPresent('create-class-overlay')
                .waitForElementNotPresent('create-class-overlay h1.mat-dialog-title');
        }
    },

    'Step 17: Verify class was created': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
    },

    'Step 18: Open Commit overlay' : function(browser) {
        browser.page.editorPage().openCommitOverlay();
    },

    'Step 19: Edit Commit message and Submit' : function(browser) {
        browser.page.editorPage().editCommitOverlayAndSubmit('Changed IRI');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .waitForElementNotPresent('commit-overlay')
            .waitForElementNotPresent('commit-overlay h1.mat-dialog-title'); // intermittent issue caused by backend
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        browser.page.editorPage().isActive('ontology-tab');
    },

    // Create MR
    'Step 20: Navigate to Merge Request Page' : function (browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'merge-requests-page button');
    },

    'Step 21: Create New Merge request' : function (browser) {
        browser.page.mergeRequestPage().createNewRequest();
    },

    'Step 22: Validate New Merge Request Page mat cards': function(browser) {
        browser.page.mergeRequestPage().assertMatCardTitle(ontologyMrPermission_title);
    },

    'Step 23: Create a merge request': function(browser) {
        browser.click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"' + ontologyMrPermission_title + '")]');
        browser.page.mergeRequestPage().createRequestNext();
    },

    'Step 24: Create a merge request - modify branches': function(browser) {
        browser.page.mergeRequestPage().createRequestSourceBranchSelect(branchTitle);
        browser.page.mergeRequestPage().createRequestTargetBranchSelect(masterBranchTitle);
        browser.page.mergeRequestPage().createRequestNext();
    },

    'Step 25: Create a merge request - submit MR': function(browser) {
        browser.page.mergeRequestPage().createRequestSubmit();
        browser.globals.wait_for_no_spinners(browser);

    },

    'Step 26: MergeRequestView - Validate Permissions - MR should be open and no button disabled': function(browser) {
        browser.page.mergeRequestPage().selectRequest(branchTitle);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Open');
        browser.page.mergeRequestPage().verifyMergeRequestButtons();
    },

    'Step 27: MergeRequestView - Close MR': function(browser) {
        browser.page.mergeRequestPage().closeMergeRequest();
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 27: Validated Closed MR': function(browser) {
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Close');
        browser.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button', 'disabled', null)
            .waitForElementNotPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .waitForElementNotPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
    },

    'Step 28: Go back to merge-requests-page': function(browser) {
        browser.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button', 'disabled', null)
            .click('//merge-requests-page//merge-request-view//button//span[contains(text(), "Back")]/parent::button');
    },

    // Create another MR keep open
    'Step 29: Navigate to New Merge Request page to create new MR' : function (browser) {
        browser.page.mergeRequestPage().createNewRequest();
    },

    'Step 30: Validate New Merge Request Page mat cards': function(browser) {
        browser.page.mergeRequestPage().assertMatCardTitle(ontologyMrPermission_title);
    },

    'Step 31: Create a merge request': function(browser) {
        browser.click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"'+ontologyMrPermission_title+'")]')
        browser.page.mergeRequestPage().createRequestNext();
    },

    'Step 32: Create a merge request - modify branches': function(browser) {
        browser.page.mergeRequestPage().createRequestSourceBranchSelect(branchTitle);
        browser.page.mergeRequestPage().createRequestTargetBranchSelect(masterBranchTitle);
        browser.page.mergeRequestPage().createRequestNext();
    },

    'Step 33: Create a merge request - submit MR': function(browser) {
        browser.page.mergeRequestPage().createRequestSubmit();
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 34: MergeRequestView - Validate Permissions - MR should be open and no button disabled': function(browser) {
        browser.page.mergeRequestPage().selectRequest(branchTitle);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Open');

        browser.useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button', 'disabled', null)
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button', 'disabled', null)
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
    },

    // Logout and log in with user that has less permissions
    'Step 35: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    'Step 36: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, user02.username, user02.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 37: Navigate to Merge Request Page' : function (browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'merge-requests-page button');
    },

    'Step 38: Validate Permissions as user with less permission': function(browser) {
        browser.page.mergeRequestPage().selectRequest(branchTitle);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Open');
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button', 'disabled', 'true');
        browser
            .useXpath()
            .waitForElementPresent('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button', 'disabled', 'true');
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', 'true');
    },

    'Step 39: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    // Admin everything permission check
    'Step 40: Test logins as the admin' : function(browser) {
        browser.globals.login(browser, adminUser.username, adminUser.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 41: Navigate to Merge Request Page' : function (browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'merge-requests-page button');
    },

    'Step 42: Validate Permissions (admin everything rule)': function(browser) {
        browser.page.mergeRequestPage().selectRequest(branchTitle);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Open');
        
        browser
            .useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
    },

   'Step 43: Give user002 manage permission for ontology': function(browser) {
        browser.useCss();
        browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view');
        browser.page.catalogPage().verifyRecordList();
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText(ontologyMrPermission_title);
        browser.page.catalogPage().applyOrderFilter('Title (asc)');
        browser.page.catalogPage().finishSearch();
        browser.page.catalogPage().openRecordItem(ontologyMrPermission_title);

        browser
            .useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Manage")]/parent::button')
            .click('//button//span[contains(text(), "Manage")]/parent::button');
        browser
            .useXpath()
            .waitForElementVisible('//div//h4[contains(text(), "Manage Record")]/parent::div//mat-slide-toggle')
            .click('//div//h4[contains(text(), "Manage Record")]/parent::div//mat-slide-toggle');
        browser
            .useXpath()
            .waitForElementVisible('//div[@class="save-container"]//button')
            .click('//div[@class="save-container"]//button');
        browser
            .useCss()
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');
   },

   'Step 44: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    // login as user with less permission to check that user has permission to accept
    'Step 45: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, user02.username, user02.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 46: Navigate to Merge Request Page' : function (browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'merge-requests-page button');
    },

    'Step 47: Validate Permissions': function(browser) {
        browser.page.mergeRequestPage().selectRequest(branchTitle);
        browser.globals.wait_for_no_spinners(browser);
        
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
        
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button', 'disabled', null);
        // User does not have permission to merge into master
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button', 'disabled', 'true');   
    },

    // Verify Modify Master Branch Permission by having admin change permissions
    'Step 48: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    'Step 49: Test logins as the admin' : function(browser) {
        browser.globals.login(browser, adminUser.username, adminUser.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 50: Give user002 manage permission for ontology': function(browser) {
        browser.useCss();
        browser.globals.switchToPage(browser, 'catalog', this.recordsViewCssSelector);
        browser.page.catalogPage().verifyRecordList();
        browser.page.catalogPage().clearCatalogSearchBar();
        browser.page.catalogPage().applySearchText(ontologyMrPermission_title);
        browser.page.catalogPage().applyOrderFilter('Title (asc)');
        browser.page.catalogPage().finishSearch();
        browser.page.catalogPage().openRecordItem(ontologyMrPermission_title);

        browser
            .useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Manage")]/parent::button')
            .click('//button//span[contains(text(), "Manage")]/parent::button');
        browser
            .useXpath()
            .waitForElementVisible('//div//h4[contains(text(), "Modify Master Branch")]/parent::div//mat-slide-toggle')
            .click('//div//h4[contains(text(), "Modify Master Branch")]/parent::div//mat-slide-toggle');
        browser
            .useXpath()
            .waitForElementVisible('//div[@class="save-container"]//button')
            .click('//div[@class="save-container"]//button');
        browser
            .useCss()
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');
   },

    'Step 51: The user clicks logout' : function(browser) {
        browser.globals.logout(browser);
    },

    // login as user with less permission to check that user has permission to accept
    'Step 52: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, user02.username, user02.password);
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss()
            .waitForElementVisible('.home-page');
    },

    'Step 53: Navigate to Merge Request Page' : function (browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'merge-requests-page button');
    },

    'Step 54: Validate Permissions': function(browser) {
        browser.page.mergeRequestPage().selectRequest(branchTitle);
        browser.globals.wait_for_no_spinners(browser);
        
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
        
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Close")]/parent::button', 'disabled', null);
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Accept")]/parent::button', 'disabled', null);
    }

}
