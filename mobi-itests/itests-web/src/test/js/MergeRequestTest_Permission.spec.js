
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
var ontologyEditorPage = require('./zOntologyEditorPage').ontologyEditorPage;
var mergeRequestPage = require('./zMergeRequestsPage').mergeRequestsPage;
var administrationPage = require('./zAdministrationPage').administrationPage;
var catalogPage = require('./zCatalogPage').catalogPage;

var adminUser = {
    'username': 'admin', 
    'password': 'admin',
};

// User to create Ontology/MR with
var user01 = { 
    'username': 'mrUser001', 
    'password': 'password',
    'firstName': 'mrUser001', 
    'lastName': 'mrLastName001', 
    'email': 'mrUser001@gmail.com', 
    'role': 'admin' 
};

// User with no permissions
var user02 = {  
    'username': 'mrUser002', 
    'password': 'password',
    'firstName': 'mrUser002', 
    'lastName': 'mrLastName002', 
    'email': 'mrUser002@gmail.com', 
    'role': 'admin' 
};

var ontologyMrPermission_title = 'ontMrTestPermission';
var ontologyMrPermission_desc = 'ontMrTestPermissionMyDescription';
var ontologyMrPermission_staticIri = 'OntMrTestPermission';
var branchTitle = 'mrBranchPermission';
var masterBranchTitle = 'MASTER';

/**
 * Functional Test for Merge Request Module
 * 
 * Functions Tested:
 * If a user is the creator of an MR
 * - When viewing an individual MR, the Delete button is clickable
 * - When viewing an individual MR, the edit button on the MR metadata on hover is clickable
 * 
 * If a user has the manage permission of the VersionedRDFRecord associated with a MR
 * - When viewing an individual MR, the Delete button is clickable
 * - When viewing an individual MR, the edit button on the MR metadata on hover is clickable
 * 
 * If a user is not the creator of an MR or a manager of the associated VersionedRDFRecord of an MR
 * - When viewing an individual MR, the Delete button is disabled with a tooltip explaining why on hover
 * - When viewing an individual MR, the edit button is not shown on hover of the MR metadata
 */
module.exports = {
    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup' : function(browser) {
        browser.url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home');
        administrationPage.login(browser, adminUser.username, adminUser.password);
    },

    'Step 2: The user clicks on the Administration sidebar link' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
    },

    'Step 3: A new user mrUser001 is created' : function(browser) {
        administrationPage.createUser(browser, user01);
    },

    'Step 4: The new user is displayed in users list' : function(browser) {
        browser
            .useXpath()
            .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
                "[contains(., '" + user01.firstName + "')]]", "new user is displayed")
    },

    'Step 3: A new user mrUser002 is created' : function(browser) {
        administrationPage.createUser(browser, user02);
    },

    'Step 4: mrUser002 is displayed in users list' : function(browser) {
        browser
            .useXpath()
            .assert.visible("//div[@class= 'users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
                "[contains(., '" + user02.firstName + "')]]", "new user is displayed")
    },


    'Step 5: The user clicks logout' : function(browser) {
        browser
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
    },

    'Step 6: Test logins as the newly created user' : function(browser) {
        administrationPage.login(browser, user01.username, user01.password);
    },

    'Step 7: Ensure that user is on Ontology editor page' : function(browser) {
        browser.click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]');
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('button.upload-button');
        ontologyEditorPage.isActive(browser);
    },

    'Step 8: Open new Ontology Overlay' : function(browser) {
        ontologyEditorPage.openNewOntologyOverlay(browser);
    },

    'Step 9: Edit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.editNewOntologyOverlay(browser, ontologyMrPermission_title, ontologyMrPermission_desc);
    },

    'Step 10: Submit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.submitNewOntologyOverlay(browser);
    },

    'Step 11: Verify new ontology properties' : function(browser) {
        ontologyEditorPage.verifyProjectTab(browser, ontologyMrPermission_title, ontologyMrPermission_desc, ontologyMrPermission_staticIri)
    },

    'Step 12: Create a new branches' : function(browser) {
        ontologyEditorPage.openNewBranchOverlay(browser);
        ontologyEditorPage.editNewBranchOverlayAndSubmit(browser, branchTitle, 'newBranchDescription');
    },

    'Step 13: Verify that branch was switched to the new branch' : function(browser) {
        ontologyEditorPage.verifyBranchSelection(browser, branchTitle);
    }, 

    'Step 14: Switch to new branch' : function(browser) {
        ontologyEditorPage.switchToBranch(browser, branchTitle);
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
        ontologyEditorPage.onProjectTab(browser);
    },

    'Step 16: Create new Classes': function(browser) {
        ontologyEditorPage.createNewOwlClass(browser, 'firstClass', 'firstClassDescription');
        for (var i = 2; i <= 10; i++) {
            ontologyEditorPage.createNewOwlClass(browser, 'class' + i + 'Title', 'class' + i + 'Description');
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
        ontologyEditorPage.openCommitOverlay(browser);
    },

    'Step 19: Edit Commit message and Submit' : function(browser) { 
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'Changed IRI');
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        ontologyEditorPage.isActive(browser, 'ontology-tab');
    },

    'Step 20: Navigate to Merge Request Page' : function (browser) {
        mergeRequestPage.goToPage(browser);
    },

    'Step 21: Navigate to New Merge Request page' : function (browser) {
        browser
            .useXpath()
            .waitForElementVisible("//merge-requests-page//button//span[text()[contains(.,'New Request')]]")
            .click("//merge-requests-page//button//span[text()[contains(.,'New Request')]]");
        browser.useCss()
            .waitForElementVisible('merge-requests-page create-request');
    },

    'Step 22: Validate a merge request': function(browser) {
        mergeRequestPage.assertMatCardTitles(browser, [ontologyMrPermission_title]);
    },

    'Step 23: Create a merge request': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"'+ontologyMrPermission_title+'")]')
            .click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"'+ontologyMrPermission_title+'")]')
            .waitForElementVisible('//button//span[text()="Next"]')
            .click('//button//span[text()="Next"]')
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');

    },

    'Step 24: Create a merge request - modify branches': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[1]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[1]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"' + branchTitle + '")]]')
            .click('//mat-option//span[text()[contains(.,"' + branchTitle + '")]]')
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[2]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[2]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"' + masterBranchTitle + '")]]')
            .click('//mat-option//span[text()[contains(.,"' + masterBranchTitle + '")]]')
            .assert.enabled('//button//span[contains(text(), "Next")]/parent::button')
            .click('//button//span[contains(text(), "Next")]/parent::button');
        browser
            .useCss()
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');
    },

    'Step 25: Create a merge request - submit MR': function(browser) {
        //stale element reference: stale element not found
        browser 
            .useXpath()
            .waitForElementVisible('//button//span[text()="Submit"]')
            .click('//button//span[text()="Submit"]')
            .useCss()
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
    },

    'Step 26: Validate Permissions': function(browser) {
        mergeRequestPage.selectRequest(browser, branchTitle);

        browser.useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null)
    },

    'Step 27: The user clicks logout' : function(browser) {
        browser
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
    },

    'Step 28: Test logins as the newly created user' : function(browser) {
        administrationPage.login(browser, user02.username, user02.password);
    },

    'Step 29: Navigate to Merge Request Page' : function (browser) {
        mergeRequestPage.goToPage(browser);
    },

    'Step 30: Validate Permissions': function(browser) {
        mergeRequestPage.selectRequest(browser, branchTitle);
    
        browser
            .useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//button//span[contains(text(), "Delete")]/parent::button', 'disabled', 'true');
    },

    'Step 31: The user clicks logout' : function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]');
    },

    'Step 32: Test logins as the admin' : function(browser) {
        administrationPage.login(browser, adminUser.username, adminUser.password);
    },

    'Step 33: Navigate to Merge Request Page' : function (browser) {
        mergeRequestPage.goToPage(browser);
    },

    'Step 34: Validate Permissions (admin everything rule)': function(browser) {
        mergeRequestPage.selectRequest(browser, branchTitle);
    
        browser
            .useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
    },

   'Step 35: Give user002 manage permission for ontology': function(browser) {
        browser.useCss();
        browser.globals.switchToPage(browser, 'catalog', this.recordsViewCssSelector);
        catalogPage.verifyRecordList(browser);
        catalogPage.searchRecords(browser, { searchText : ontologyMrPermission_title, order: 'Title (asc)'});
        catalogPage.openRecordItem(browser, ontologyMrPermission_title);

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

   'Step 36: The user clicks logout' : function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]');
    },

    'Step 37: Test logins as the newly created user' : function(browser) {
        administrationPage.login(browser, user02.username, user02.password);
    },

    'Step 38: Navigate to Merge Request Page' : function (browser) {
        mergeRequestPage.goToPage(browser);
    },

    'Step 39: Validate Permissions': function(browser) {
        mergeRequestPage.selectRequest(browser, branchTitle);

        browser.useXpath()
            .waitForElementVisible('//button//span[contains(text(), "Delete")]/parent::button')
            .assert.attributeEquals('//button//span[contains(text(), "Delete")]/parent::button', 'disabled', null);
    }


}
