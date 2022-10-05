/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

    'Step 3: Open new Ontology Overlay' : function(browser) {
        var newOntologyButtonXpath = '//span[text()="New Ontology"]/parent::button';
        browser
            .useXpath()
            .waitForElementVisible(newOntologyButtonXpath)
            .click(newOntologyButtonXpath)
    },

    'Step 4: Edit New Ontology Overlay' : function(browser) {
        browser   
            .useCss()        
            .waitForElementVisible('new-ontology-overlay')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', 'myTitle2')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', 'myDescription')
    },

    'Step 5: Submit New Ontology Overlay' : function(browser) {
        browser
            .useCss()        
            .waitForElementVisible('new-ontology-overlay')
            .useXpath()
            .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 6: Verify new ontology properties' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
            .useXpath()
            .waitForElementVisible('//ontology-properties-block//value-display//span[text()[contains(.,"myTitle2")]]')
            .waitForElementVisible('//ontology-properties-block//value-display//span[text()[contains(.,"myDescription")]]')
            .waitForElementVisible('//static-iri//span[text()[contains(.,"MyTitle2")]]')
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Project")]]')
            .useCss()       
    },

    'Step 7: Edit IRI for ontology' : function(browser) { 
        browser
            .useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .setValue('//mat-label[text()[contains(.,"Ends With")]]//ancestor::mat-form-field//input', 'myOntology2')
            .click('xpath', '//edit-iri-overlay//span[text()="Submit"]')
            .waitForElementNotPresent('edit-iri-overlay')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 8: Open Commit overlay' : function(browser) {
        browser
            .useCss()
            .pause(1000)
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay')
    },

    'Step 9: Edit Commit message and Submit' : function(browser) { 
        browser
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'Changed IRI')
            .useXpath()
            .click('//commit-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementNotPresent('commit-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 10: Open Ontology Editor Page Ontology List Page' : function(browser) { 
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button')
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
    },

    'Step 11: On The Ontology List Page, search for ontology' : function(browser) { 
        browser
            .useCss() 
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', 'myTitle')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('ontology-editor-page open-ontology-tab')
    },

    'Step 12: Ensure IRI changes are successful' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .useXpath()
            .click('//open-ontology-tab//small[text()[contains(.,"myOntology2")]]')
        // wait for loading to finish
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
    },

    'Step 13: Create a new branch' : function(browser) {
        browser
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button i.fa-code-fork')
            .click('ontology-button-stack circle-button-stack button i.fa-code-fork')
            .waitForElementVisible('create-branch-overlay h1.mat-dialog-title')
            .assert.textContains('create-branch-overlay h1.mat-dialog-title', 'Create New Branch')
            .useXpath()
            .waitForElementVisible('//create-branch-overlay//input[@placeholder="Title"]')
            .waitForElementVisible('//create-branch-overlay//textarea[@placeholder="Description"]')
            .setValue('//create-branch-overlay//input[@placeholder="Title"]', "newBranchTitle2")
            .setValue('//create-branch-overlay//textarea[@placeholder="Description"]', "newBranchDescription")
            .click('//create-branch-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-branch-overlay h1.mat-dialog-title');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 14: Switch to new branch' : function(browser) {
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "newBranchTitle2");
            })
            .useCss()
            .click('open-ontology-select .mat-form-field-infix')
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "newBranchTitle2")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "newBranchTitle2")]')
            .useCss()
    },

    'Step 15: Verify no changes are shown': function(browser) {
        browser
            .waitForElementVisible('info-message p')
            .assert.not.elementPresent('saved-changes-tab .expansion-panel')
    },

    'Step 16: Verify submit cannot be clicked': function(browser) {
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
            .assert.not.enabled('//button[text()="Submit"]')
            .useCss()
            .click('ontology-sidebar span.close-icon')
    },

    'Step 17: Verify again in merge requests tab': function(browser) {
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
            .waitForElementVisible('(//div[@class=\'mat-form-field-infix\'])[1]/input')
            .click('(//div[@class=\'mat-form-field-infix\'])[1]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
            .click('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
            .waitForElementVisible('(//div[@class=\'mat-form-field-infix\'])[2]/input')
            .click('(//div[@class=\'mat-form-field-infix\'])[2]')
            .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
            .click('//mat-option//span[text()[contains(.,"MASTER")]]')
            .assert.not.enabled('//button//span[contains(text(), "Next")]/parent::button')
            .assert.enabled('//button//span[text()="Back"]')
            .click('//button//span[text()="Back"]')
            .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
            .waitForElementVisible('//button//span[text()="Cancel"]')
            .click('//button//span[text()="Cancel"]')
            .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
    },

    'Step 18: Open Ontology Editor Page Ontology List Page' : function(browser) {
            browser.globals.wait_for_no_spinners(browser)
            browser
                .useCss()
                .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/ontology-editor"]');
            browser.globals.wait_for_no_spinners(browser);
            browser.waitForElementVisible('button.upload-button');
        },

    'Step 19: On The Ontology List Page, search for ontology' : function(browser) {
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', 'myTitle')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('ontology-editor-page open-ontology-tab')
    },

    'Step 20: Open the ontology' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .useXpath()
            .click('//open-ontology-tab//small[text()[contains(.,"myOntology2")]]')
        // wait for loading to finish
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "newBranchTitle2");
            })
    },

    'Step 21: Create a new Class': function(browser) {
            browser
                .useCss()
                .click('ontology-button-stack circle-button-stack')
                .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
                .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
                .click('create-entity-modal .create-class')
                .waitForElementNotPresent('create-entity-modal .create-class')
                .waitForElementVisible('create-class-overlay h1.mat-dialog-title')
                .assert.textContains('create-class-overlay h1.mat-dialog-title', 'Create New OWL Class')
                .useXpath()
                .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
                .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', 'firstClass')
                .setValue('//mat-label[text()[contains(.,"Description")]]//ancestor::mat-form-field//textarea', 'firstClassDescription')
                .click('//create-class-overlay//span[text()="Submit"]')
                .useCss()
                .waitForElementNotPresent('create-class-overlay h1.mat-dialog-title')
        },

        'Step 22: Verify class was created': function(browser) {
            browser
                .useXpath()
                .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
                .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
                .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
        },

        'Step 23: Verify changes are shown': function(browser) {
            browser
                .useXpath() // Must use Xpath when checking does an element with a certain value exist among other like elements
                .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Changes")]]')
                .click('//mat-tab-header//div[text()[contains(.,"Changes")]]')
                .useCss()
                .waitForElementVisible('saved-changes-tab mat-expansion-panel mat-panel-title[title*="firstClass"]')
                .assert.textContains('saved-changes-tab mat-expansion-panel mat-panel-title[title*="firstClass"]', 'firstClass') // Verify Title
                .assert.textContains('saved-changes-tab mat-expansion-panel mat-panel-Description[title*="FirstClass"]', 'FirstClass') // Verify IRI
                .click('saved-changes-tab mat-expansion-panel mat-panel-title[title*="firstClass"]')
                .waitForElementVisible('saved-changes-tab .additions')
                .assert.textContains('saved-changes-tab .additions', 'Added Statements')
                .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/description"]', "description")
                .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/description"] ~ div[title=firstClassDescription]', 'firstClassDescription')
                .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/title"]', "title")
                .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/title"] ~ div[title=firstClass]', 'firstClass')
                .assert.textContains('saved-changes-tab .additions .statement-display div[title*="ns#type"]', "type")
                .assert.textContains('saved-changes-tab .additions .statement-display div[title*="ns#type"] ~ div[title*="owl#Class"]', 'owl#Class')
        },

        'Step 24: Commit Changes': function(browser) {
            browser
                .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
                .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
                .click('ontology-button-stack circle-button-stack button.btn-info')
                .waitForElementVisible('commit-overlay h1.mat-dialog-title')
                .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
                .setValue('commit-overlay textarea[name=comment]', 'commit123')
                .useXpath()
                .click('//commit-overlay//span[text()="Submit"]')
                .useCss()
                .waitForElementNotPresent('commit-overlay h1.mat-dialog-title')
        },

        'Step 25: Verify no changes are shown': function(browser) {
            browser
                .useXpath()
                .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Changes")]]')
                .useCss()
                .waitForElementVisible('info-message p')
                .assert.textContains('info-message p', 'You don\'t have any uncommitted changes.')
                .assert.not.elementPresent('saved-changes-tab .expansion-panel')
        },

        'Step 26: Create a merge request': function(browser) {
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
                .waitForElementVisible('(//div[@class=\'mat-form-field-infix\'])[1]/input')
                .click('(//div[@class=\'mat-form-field-infix\'])[1]')
                .waitForElementVisible('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
                .click('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
                .waitForElementVisible('(//div[@class=\'mat-form-field-infix\'])[2]/input')
                .click('(//div[@class=\'mat-form-field-infix\'])[2]')
                .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
                .click('//mat-option//span[text()[contains(.,"MASTER")]]')
                .assert.enabled('//button//span[contains(text(), "Next")]/parent::button')
                .click('//button//span[contains(text(), "Next")]/parent::button')
                .useCss()
                .waitForElementNotPresent('div.mat-horizontal-stepper-content.ng-animating')
                .useXpath()
                .waitForElementVisible('//button//span[text()="Submit"]')
                .click('//button//span[text()="Submit"]')
                .useCss()
                .waitForElementVisible('div.toast-success')
                .waitForElementNotPresent('div.toast-success')
        },

        'Step 27: Accept the merge request': function(browser) {
            browser
                .useXpath()
                .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
                .useCss()
                .assert.textContains('div.request-contents .details h3', 'newBranchTitle2')
                .click('xpath', '//div[contains(@class, "request-contents")]//h3[text()[contains(.,"newBranchTitle2")]]')
            browser.globals.wait_for_no_spinners(browser);
            browser
                .useXpath()
                .waitForElementVisible("//button//span[text()[contains(.,'Accept')]]")
                .click("//button//span[text()[contains(.,'Accept')]]")
                .useCss()
                .waitForElementVisible('div.mat-dialog-actions button.mat-primary')
                .click('div.mat-dialog-actions button.mat-primary')
            browser.globals.wait_for_no_spinners(browser);
            browser
                .useCss()
                .waitForElementVisible('div.toast-success')
                .waitForElementNotPresent('div.toast-success')
                .waitForElementVisible('xpath', '//mat-chip[text()[contains(.,"Accepted")]]')

        }

}