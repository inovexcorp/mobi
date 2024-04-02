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

var newUser = { 'username': 'test', 'password': 'test',
    'firstName': 'Johnny', 'lastName': 'Test', 'email': 'test@gmail.com', 'role': 'admin' };

module.exports = {
    '@tags': ['merge-requests', 'reopen'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword);
    },

    'Steps 2: Create a New Ontology': function(browser) {
        browser.globals.switchToPage(browser, 'ontology-editor', 'button.upload-button');
        browser.page.editorPage().isActive();
        browser.page.editorPage().openNewOntologyOverlay();
        browser.page.editorPage().editNewOntologyOverlay('Test Ontology', 'test description');
        browser.page.editorPage().submitNewOntologyOverlay();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().onProjectTab();
        browser.page.editorPage().verifyProjectTab('Test Ontology', 'test description', 'TestOntology')
    },

    'Step 3: Create a New Branch' : function(browser) {
        browser.page.editorPage().openNewBranchOverlay();
        browser.page.editorPage().editNewBranchOverlayAndSubmit('Test Branch', 'test Branch Description');
        browser.globals.wait_for_no_spinners(browser);
        browser.useCss().waitForElementNotPresent('create-branch-overlay')
    },

    'Step 4: Verify Branch Creation and Switch': function(browser) {
        browser.page.editorPage().verifyBranchSelection('Test Branch');
    },

    'Step 5: Make an Edit to the Ontology': function(browser) {
        browser.page.editorPage().editIri('ChangedOntologyIri');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().openCommitOverlay();
        browser.page.editorPage().editCommitOverlayAndSubmit('Changed IRI');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .waitForElementNotPresent('commit-overlay')
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        browser.page.editorPage().isActive('ontology-tab');
    },

    'Step 6: Switch to Merge Request Page': function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'button.new-request-btn');
    },

    'Step 7: Create Merge Request': function(browser) {
        browser.page.mergeRequestPage().createNewRequest();
        browser.page.mergeRequestPage().assertMatCardTitle('Test Ontology');
        browser.click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"Test Ontology")]');
        browser.page.mergeRequestPage().createRequestNext();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().createRequestSourceBranchSelect('Test Branch');
        browser.page.mergeRequestPage().createRequestTargetBranchSelect('MASTER');
        browser.page.mergeRequestPage().createRequestNext();
    },

    'Step 8: Submit Merge Request': function(browser) {
        browser.page.mergeRequestPage().createRequestSubmit();
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Verify Merge Request Creation': function(browser) {
        browser.page.mergeRequestPage().selectRequest('Test Branch');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Open');
        browser.page.mergeRequestPage().verifyMergeRequestButtons();
    },

    'Step 10: Close Merge Request': function(browser) {
        browser.page.mergeRequestPage().closeMergeRequest();
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 11: Verify Closed Merge Request': function(browser) {
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Close');
        browser.page.mergeRequestPage().verifyClosedMergeRequestButtons();
    },

    'Step 12: Reopen merge Request': function(browser) {
        browser.page.mergeRequestPage().reopenMergeRequest('Test Branch');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 13: Verify Reopened Merge Request': function(browser) {
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Open');
        browser.page.mergeRequestPage().verifyMergeRequestButtons();
    },

    'Step 14: Re-Close Merge Request': function(browser) {
        browser.page.mergeRequestPage().closeMergeRequest();
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mergeRequestPage().mergeRequestViewCheckStatus('Close');
        browser.page.mergeRequestPage().verifyClosedMergeRequestButtons();
    },

    'Step 15: Create a New user': function(browser) {
        browser.globals.switchToPage(browser, 'user-management')
        browser.page.administrationPage().createUser(newUser);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 16: Logout and Sign-in as New User': function(browser) {
        browser.globals.logout(browser);
        browser.globals.login(browser, 'test', 'test');
    },

    'Step 17: Navigate to Closed Merge Request': function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'button.new-request-btn');
        browser.page.mergeRequestPage().changeStatusType('Closed');
        browser.page.mergeRequestPage().selectRequest('Test Branch');
        browser.page.mergeRequestPage().verifyClosedMergeRequestButtonsNoPermissions();
    },

    'Step 18: Logout and Sign-in as Admin': function(browser) {
        browser.globals.logout(browser);
        browser.globals.login(browser, 'admin', 'admin');
    },

    'Step 19: Open The Ontology': function(browser) {
        browser.globals.switchToPage(browser, 'ontology-editor', 'button.upload-button');
        browser.page.editorPage().isActive();
        browser.page.editorPage().openOntology('Test Ontology');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 20: Delete the target branch': function(browser) {
        browser.page.editorPage().switchToBranch('MASTER');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().deleteBranch('Test Branch');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.editorPage().verifyBranchSelection('MASTER');
    },

    'Step 21: Verify Reopen Permissions': function(browser) {
        browser.globals.switchToPage(browser, 'merge-requests', 'button.new-request-btn');
        browser.page.mergeRequestPage().changeStatusType('Closed');
        browser.page.mergeRequestPage().selectRequest('Test Branch');
        browser
            .useXpath()
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button')
            .waitForElementVisible('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Reopen")]/parent::button', 'disabled', 'true')
            .assert.attributeEquals('//merge-requests-page//merge-request-view//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null)
    }
}
