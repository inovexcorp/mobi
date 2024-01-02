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

var ontologyEditorPage = require('./zOntologyEditorPage').ontologyEditorPage;
var mergeRequestPage = require('./zMergeRequestsPage').mergeRequestsPage;
var administrationPage = require('./zAdministrationPage').administrationPage;

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
    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup' : function(browser) {
        browser.url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home');
        administrationPage.login(browser, adminUsername, adminPassword);
    },

    'Step 2: Ensure that user is on Ontology editor page' : function(browser) {
        browser.click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]');
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('button.upload-button');
        ontologyEditorPage.isActive(browser);
    },

    'Step 3: Open new Ontology Overlay' : function(browser) {
        ontologyEditorPage.openNewOntologyOverlay(browser);
    },

    'Step 4: Edit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.editNewOntologyOverlay(browser, ontology01.title, ontology01.description);
    },

    'Step 5: Submit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.submitNewOntologyOverlay(browser);
    },

    'Step 6: Verify new ontology properties' : function(browser) {
        ontologyEditorPage.verifyProjectTab(browser, ontology01.title, ontology01.description, 'MyTitle2')
    },

    'Step 7: Edit IRI for ontology' : function(browser) { 
        ontologyEditorPage.editIri(browser, 'myOntology2');
    },

    'Step 8: Open Commit overlay' : function(browser) {
        ontologyEditorPage.openCommitOverlay(browser);
    },

    'Step 9: Edit Commit message and Submit' : function(browser) { 
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'Changed IRI');
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        ontologyEditorPage.isActive(browser, 'ontology-tab');
    },

    'Step 10: Open Ontology Editor Page Ontology List Page' : function(browser) { 
        ontologyEditorPage.openOntologyListPage(browser);
    },

    'Step 11: On The Ontology List Page, search for ontology' : function(browser) { 
        ontologyEditorPage.searchOntology(browser, 'myTitle');
    },

    'Step 12: Ensure IRI changes are successful on the Ontology List Page' : function(browser) {
        browser
            .useXpath()
            .waitForElementPresent('//ontology-editor-page//open-ontology-tab')
            .click('//ontology-editor-page//open-ontology-tab//small[text()[contains(.,"https://mobi.com/ontologies/myOntology2")]]');
        // wait for loading to finish
        browser.globals.wait_for_no_spinners(browser);
        ontologyEditorPage.onProjectTab(browser);
    }, 

    'Step 13: Create a new branches' : function(browser) {
        ontologyEditorPage.openNewBranchOverlay(browser);
        ontologyEditorPage.editNewBranchOverlayAndSubmit(browser, 'newBranchTitle2', 'newBranchDescription');
    },

    'Step 14: Verify that branch was switched to the new branch' : function(browser) {
        ontologyEditorPage.verifyBranchSelection(browser, 'newBranchTitle2');
    }, 

    'Step 15: Switch to new branch' : function(browser) {
        ontologyEditorPage.switchToBranch(browser, 'newBranchTitle2');
    },

    'Step 16: Verify no uncommitted changes are shown': function(browser) {
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

    'Step 17: Verify submit cannot be clicked': function(browser) {
        browser
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .useXpath()
            .waitForElementVisible('//circle-button-stack//button[@mattooltip="Merge Branches"]')
            .click('//circle-button-stack//button[@mattooltip="Merge Branches"]')
            .useCss()
            .waitForElementVisible('.merge-message')
            .assert.textContains('.merge-message', 'newBranchTitle2')
            .useXpath()
            .click('//branch-select')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('//mat-option//span[text()[contains(.,"MASTER")]]')
            .waitForElementVisible('//branch-select//input')
            .getValue("//branch-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "MASTER");
            })
            .useCss()
            .assert.not.enabled(".merge-block .btn-container button.mat-primary") // intermitted issue
            .click('ontology-sidebar span.close-icon');
    },

    'Step 18: Verify again in merge requests tab': function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Merge Requests')]]")
            .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
            .click("//button//span[text()[contains(.,'New Request')]]")
            .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .waitForElementVisible('//button//span[text()="Next"]')
            .click('//button//span[text()="Next"]')
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating')
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[1]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[1]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
            .click('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useXpath()
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[2]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[2]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('//mat-option//span[text()[contains(.,"MASTER")]]')
        browser.globals.wait_for_no_spinners(browser)
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

    'Step 19: Open Ontology Editor Page Ontology List Page' : function(browser) {
            browser.globals.wait_for_no_spinners(browser)
            browser
                .useCss()
                .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]');
            browser.globals.wait_for_no_spinners(browser);
            ontologyEditorPage.isActive(browser);
            browser.waitForElementVisible('button.upload-button');
        },

    'Step 20: On The Ontology List Page, search for ontology' : function(browser) {
        ontologyEditorPage.searchOntology(browser, 'myTitle');
    },

    'Step 21: Open the ontology' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .useXpath()
            .click('//open-ontology-tab//small[text()[contains(.,"myOntology2")]]');
        browser.globals.wait_for_no_spinners(browser); // wait for loading to finish
        
        ontologyEditorPage.onProjectTab(browser);
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "newBranchTitle2");
            })
    },

    'Step 22: Create new Classes': function(browser) {
        ontologyEditorPage.createNewOwlClass(browser, 'firstClass', 'firstClassDescription');
        for (var i = 2; i <= 20; i++) {
            ontologyEditorPage.createNewOwlClass(browser, 'class' + i + 'Title', 'class' + i + 'Description');
        }
    },

    'Step 23: Verify class was created': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
    },

    'Step 24: Verify changes are shown': function(browser) {
        browser
            .useXpath() // Must use Xpath when checking does an element with a certain value exist among other like elements
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Changes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Changes")]]')
            .useCss()
            .waitForElementVisible('saved-changes-tab mat-expansion-panel mat-panel-title[title*="firstClass"]')
            .assert.textContains('saved-changes-tab mat-expansion-panel mat-panel-title[title*="firstClass"]', 'firstClass') // Verify Title
            .assert.textContains('saved-changes-tab mat-expansion-panel mat-panel-Description[title*="FirstClass"]', 'FirstClass') // Verify IRI
            .click('saved-changes-tab mat-expansion-panel mat-panel-title[title*="firstClass"]')
            .waitForElementVisible('saved-changes-tab commit-compiled-resource')
            .assert.textContains('saved-changes-tab commit-compiled-resource p.type-label', "Type(s)")
            .assert.textContains('saved-changes-tab commit-compiled-resource p.type-label ~ div.type div.px-4', 'owl:Class')
            .useXpath()
            .assert.textContains('//saved-changes-tab//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]', "Description")
            .assert.textContains('//saved-changes-tab//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClassDescription')
            .assert.textContains('//saved-changes-tab//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]', "Title")
            .assert.textContains('//saved-changes-tab//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClass')
    },

    'Step 25: Commit Changes': function(browser) {
        ontologyEditorPage.openCommitOverlay(browser);
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'commit123');
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        ontologyEditorPage.isActive(browser, 'ontology-tab');
    },

    'Step 26: Verify no changes are shown': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Changes")]]')
            .useCss()
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'You don\'t have any uncommitted changes.')
            .assert.not.elementPresent('saved-changes-tab .expansion-panel')
    },

    'Step 27: Create a merge request': function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Merge Requests')]]")
            .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
            .click("//button//span[text()[contains(.,'New Request')]]")
            .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .waitForElementVisible('//button//span[text()="Next"]')
            .click('//button//span[text()="Next"]')
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');
        browser
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[1]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[1]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
            .click('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[2]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[2]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('//mat-option//span[text()[contains(.,"MASTER")]]')
            .assert.enabled('//button//span[contains(text(), "Next")]/parent::button')
            .click('//button//span[contains(text(), "Next")]/parent::button');
        browser
            .useCss()
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating')
            .useXpath()
            .waitForElementVisible('//button//span[text()="Submit"]')
        //stale element reference: stale element not found
        browser 
            .click('//button//span[text()="Submit"]')
            .useCss()
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
    },

    'Step 28: Accept the merge request': function(browser) {
        mergeRequestPage.selectRequest(browser, 'newBranchTitle2');
        mergeRequestPage.acceptRequest(browser);
    },

    'Step 29: Create branch used for branch removal Merge Request': function(browser) {
        browser
            .useCss()
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]');
        browser.globals.wait_for_no_spinners(browser);
        ontologyEditorPage.isActive(browser);
        // ontology-editor is on changes tab at this point
        ontologyEditorPage.openNewBranchOverlay(browser);
        ontologyEditorPage.editNewBranchOverlayAndSubmit(browser, 'newBranchTitle3Removal', 'newBranchDescriptionBranchRemoval');
        ontologyEditorPage.verifyBranchSelection(browser, 'newBranchTitle3Removal');
    },

    'Step 30: Add commits to branch': function (browser) {
        for (var i = 2; i <= 30; i++) {
            ontologyEditorPage.createNewOwlClass(browser, 'classRemoval' + i + 'Title', 'classRemoval' + i + 'Description');
            ontologyEditorPage.openCommitOverlay(browser);
            ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'commit123Removal' + i);
        }
        browser
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
        ontologyEditorPage.isActive(browser, 'ontology-tab');
    },
    'Step 31: Create a merge request': function(browser) {
        browser
            .useXpath()
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Merge Requests')]]")
            .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]");
        mergeRequestPage.verifyRecordFilters(browser);
        mergeRequestPage.verifyMergeRequestList(browser);
        mergeRequestPage.verifyMergePageSort(browser);

        // Start New Request, select the ontology record, and click Next
        browser
            .useXpath()
            .click("//button//span[text()[contains(.,'New Request')]]")
            .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .waitForElementVisible('//button//span[text()="Next"]')
            .click('//button//span[text()="Next"]')
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating');
        // Select the source and target branches and click Next
        browser
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[1]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[1]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"newBranchTitle3Removal")]]')
            .click('//mat-option//span[text()[contains(.,"newBranchTitle3Removal")]]')
            .waitForElementVisible('(//div[contains(@class, "mat-form-field-infix")])[2]/input')
            .click('(//div[contains(@class, "mat-form-field-infix")])[2]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('//mat-option//span[text()[contains(.,"MASTER")]]')
            .assert.enabled('//button//span[contains(text(), "Next")]/parent::button')
            .click('//button//span[contains(text(), "Next")]/parent::button')
        // Select checkbox to remove branch after acceptance and add admin as assignee
        browser
            .waitForElementVisible('//merge-requests-page//create-request//mat-checkbox//span[contains(text(), "Remove")]')
            .click('//merge-requests-page//create-request//mat-checkbox//span[contains(text(), "Remove")]')
            .waitForElementVisible('//merge-requests-page//create-request//div[contains(@class, "assignee-input")]//div[contains(@class, "mat-form-field-infix")]//input')
            .click('//merge-requests-page//create-request//div[contains(@class, "assignee-input")]//div[contains(@class, "mat-form-field-infix")]//input')
            .waitForElementVisible('//mat-option//span[text()[contains(., "' + adminUsername + '")]]')
            .click('//mat-option//span[text()[contains(., "' + adminUsername + '")]]')
        browser
            .useCss()
            .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating')
            .useXpath()
            .waitForElementVisible('//button//span[text()="Submit"]')
        //stale element reference: stale element not found
        browser
            .click('//button//span[text()="Submit"]')
            .useCss()
            .waitForElementVisible('div.toast-success')
            .waitForElementNotPresent('div.toast-success');
    },

    'Step 32: Ensure the request status filter works': function(browser) {
        // Confirm the status filter is present
        var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };
        var statusFilterXPathSelector = mergeRequestPage.createFilterXPathSelector('Request Status');
        browser.assert.elementPresent({ selector: statusFilterXPathSelector, locateStrategy: 'xpath' });

        // Verify the correct amount of options is available
        var radioButtonSelector = '//div[contains(@class, "filter-option")]//mat-radio-group//mat-radio-button';
        var statusFilterElementSelector = statusFilterXPathSelector +  radioButtonSelector;
        browser.assert.elementsCount({ selector: statusFilterElementSelector, locateStrategy: 'xpath' }, 3)

        // Select the closed status filter
        var closedRadioLabelSelector = '//span[contains(@class, "mat-radio-label")][text()[contains(., "Closed")]]';
        var openRadioLabelSelector = '//span[contains(@class, "mat-radio-label")][text()[contains(., "Open")]]';
        var closedStatusFilterXPathSelector = statusFilterElementSelector + closedRadioLabelSelector;
        browser.assert.elementPresent({ selector: closedStatusFilterXPathSelector, locateStrategy: 'xpath' });
        browser.click('xpath', closedStatusFilterXPathSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .expect.element('div.merge-request-list info-message p').text.to.contain('No requests found');

        // Unselect the admin creator filter
        browser.click('xpath', statusFilterElementSelector + openRadioLabelSelector, clickFunc);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 33: Filter the merge request list by creator': function(browser) {
        // Confirm the Creator filter is present
        var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };
        var creatorFilterXPathSelector = mergeRequestPage.createFilterXPathSelector('Creators');
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
        var adminCreatorFilterXPathSelector = mergeRequestPage.createFilterXPathSelector('Creators', adminUsername + ' (2)');
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

    'Step 34: Filter the merge request list by assignee': function(browser) {
      // Confirm the Creator filter is present
      var clickFunc = function(result) { this.assert.strictEqual(result.status, 0) };
      var assigneeFilterXPathSelector = mergeRequestPage.createFilterXPathSelector('Assignees');
      browser.assert.elementPresent({ selector: assigneeFilterXPathSelector, locateStrategy: 'xpath' });
      // Submit a search of the creator filter
      var assigneeSearchXPathSelector = assigneeFilterXPathSelector + '//input';
      browser.assert.elementPresent({ selector: assigneeSearchXPathSelector, locateStrategy: 'xpath' });
      browser
          .useXpath()
          .sendKeys(assigneeSearchXPathSelector, ['ad', browser.Keys.ENTER])
          .useCss()
          .waitForElementNotPresent('#spinner-full');

      // Select the admin creator filter
      var adminAssigneeFilterXPathSelector = mergeRequestPage.createFilterXPathSelector('Assignee', adminUsername + ' (1)');
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

    'Step 35: Search the merge request list': function(browser) {
        // Test no requests are shown
        mergeRequestPage.searchList(browser, 'NONE');
        browser.waitForElementVisible('div.merge-request-list info-message');
        browser.expect.element('div.merge-request-list info-message p').text.to.contain('No requests found');

        // Test searching with some results
        mergeRequestPage.searchList(browser, 'rem');
        browser.assert.textContains('div.request-contents .details h3', 'newBranchTitle3Removal')
    },

    'Step 36: Accept the merge request': function(browser) {
        mergeRequestPage.selectRequest(browser, 'newBranchTitle3Removal');
        mergeRequestPage.acceptRequest(browser);
    }
}
