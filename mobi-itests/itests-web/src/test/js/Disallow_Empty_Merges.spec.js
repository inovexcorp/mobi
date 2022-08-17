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
            .waitForElementVisible('//material-tabset//a[@class="nav-link active"]//span[text()[contains(.,"Project")]]')
            .useCss()       
    },

    'Step 7: Edit IRI for ontology' : function(browser) { 
        browser
            .useCss()  
            .click('static-iri i.fa.fa-pencil')
            .waitForElementVisible('edit-iri-overlay-ajs')
            .setValue('edit-iri-overlay-ajs div.form-group.ends-container input', 'myOntology2')
            .click('xpath', '//edit-iri-overlay-ajs//button[text()="Submit"]')
    },

    'Step 8: Open Commit overlay' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()  
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-git')
            .click('circle-button-stack .fa-git')
    },

    'Step 9: Edit Commit message and Submit' : function(browser) { 
        browser
            .useCss()
            .waitForElementVisible('commit-overlay')
            .assert.textContains('commit-overlay .modal-header h3', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'Changed IRI')
            .useXpath()
            .click('//commit-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 10: Open Ontology Editor Page Ontology List Page' : function(browser) { 
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementPresent('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button')
            .click('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button')
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
    },

    'Step 11: On The Ontology List Page, search for ontology' : function(browser) { 
        browser
            .useCss() 
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .clearValue('open-ontology-tab input.ontology-search')
            .setValue('open-ontology-tab input.ontology-search', 'myTitle')
            .sendKeys('open-ontology-tab input.ontology-search', browser.Keys.ENTER);
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
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-code-fork')
            .click('circle-button-stack .fa-code-fork')
            .waitForElementVisible('create-branch-overlay .modal-title')
            .assert.textContains('create-branch-overlay .modal-title', 'Create New Branch')
            .waitForElementVisible('create-branch-overlay text-input[display-text="\'Title\'"] input')
            .setValue('create-branch-overlay text-input[display-text="\'Title\'"] input', "newBranchTitle2")
            .waitForElementVisible('create-branch-overlay text-area[display-text="\'Description\'"] textarea')
            .setValue('create-branch-overlay text-area[display-text="\'Description\'"] textarea', "newBranchDescription")
            .useXpath()
            .click('//create-branch-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-branch-overlay .modal-title')
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
        .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
        .waitForElementVisible('circle-button-stack .fa-random')
        .click('circle-button-stack .fa-random')
        .waitForElementVisible('.merge-message')
        .assert.textContains('.merge-message', 'newBranchTitle2')
        .useXpath()
        .click('//branch-select//div[@class=\'branch-select\']//div[@class=\'mat-form-field-infix\']')
        .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
        .click('//mat-option//span[text()[contains(.,"MASTER")]]')
        .waitForElementVisible('//branch-select//input')
        .getValue("//branch-select//input", function(result) {
            this.assert.equal(typeof result, "object");
            this.assert.equal(result.status, 0);
            this.assert.equal(result.value, "MASTER");
        })
        .assert.not.enabled('//button[text()="Submit"]')
    },

    'Step 17: Verify again in merge requests tab': function(browser) {
        browser
        .click("//li/a[@class='nav-link']/span[text()[contains(.,'Merge Requests')]]")
        .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
        .click("//button//span[text()[contains(.,'New Request')]]")
        .waitForElementVisible('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
        .click('//create-request//request-record-select//mat-card//mat-card-title[contains(text(),"myTitle2")]')
        .waitForElementVisible('//button//span[text()="Next"]')
        .click('//button//span[text()="Next"]')
        .waitForElementVisible('(//div[@class=\'mat-form-field-infix\'])[1]')
        .click('(//div[@class=\'mat-form-field-infix\'])[1]')
        .waitForElementVisible('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
        .click('//mat-option//span[text()[contains(.,"newBranchTitle2")]]')
        .waitForElementVisible('(//div[@class=\'mat-form-field-infix\'])[2]')
        .click('(//div[@class=\'mat-form-field-infix\'])[2]')
        .waitForElementVisible('//mat-option//span[text()[contains(.,"MASTER")]]')
        .click('//mat-option//span[text()[contains(.,"MASTER")]]')
        .assert.not.enabled('//button//span[contains(text(), "Next")]/parent::button')
    }

}