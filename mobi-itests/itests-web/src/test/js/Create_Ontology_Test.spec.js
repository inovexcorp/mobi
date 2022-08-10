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
        var newOntologyButtonXpath = '//button[text()="New Ontology"]';
        browser
            .useXpath()
            .waitForElementVisible(newOntologyButtonXpath)
            .click(newOntologyButtonXpath)
            
    },

    'Step 3: Edit New Ontology Overlay' : function(browser) {
        browser   
            .useCss()        
            .waitForElementVisible('new-ontology-overlay')
            .waitForElementVisible('new-ontology-overlay text-input[display-text="\'Title\'"] input')
            .waitForElementVisible('new-ontology-overlay text-area[display-text="\'Description\'"] textarea')
            .setValue('new-ontology-overlay text-input[display-text="\'Title\'"] input', 'myTitle')
            .setValue('new-ontology-overlay text-area[display-text="\'Description\'"] textarea', 'myDescription')
    },

    'Step 4: Submit New Ontology Overlay' : function(browser) {
        browser
            .useCss()        
            .waitForElementVisible('new-ontology-overlay')
            .useXpath()
            .click('//new-ontology-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 5: Verify new ontology properties' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
            .useXpath()
            .waitForElementVisible('//ontology-properties-block//value-display//span[text()[contains(.,"myTitle")]]')
            .waitForElementVisible('//ontology-properties-block//value-display//span[text()[contains(.,"myDescription")]]')
            .waitForElementVisible('//static-iri//span[text()[contains(.,"MyTitle")]]')
            .waitForElementVisible('//material-tabset//a[@class="nav-link active"]//span[text()[contains(.,"Project")]]')
            .useCss()       
    },

    'Step 6: Edit IRI for ontology' : function(browser) { 
        browser
            .useCss()  
            .click('static-iri i.fa.fa-pencil')
            .waitForElementVisible('edit-iri-overlay-ajs')
            .setValue('edit-iri-overlay-ajs div.form-group.ends-container input', 'myOntology')
            .click('xpath', '//edit-iri-overlay-ajs//button[text()="Submit"]')
//            .waitForElementNotVisible('.spinner')
    },

    'Step 6: Open Commit overlay' : function(browser) { 
        browser
            .useCss()  
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-git')
            .click('circle-button-stack .fa-git')
            .waitForElementVisible('commit-overlay')
    },

    'Step 7: Edit Commit message and Submit' : function(browser) { 
        browser
            .useCss()  
            .waitForElementVisible('commit-overlay')
            .assert.textContains('commit-overlay .modal-header h3', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'Changed IRI')
            .useXpath()
            .click('//commit-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementNotPresent('commit-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 8: Open Ontology Editor Page Ontology List Page' : function(browser) { 
        browser
            .useCss()  
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .click('ontology-sidebar button.btn.btn-primary')
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
    },

    'Step 9: On The Ontology List Page, search for ontology' : function(browser) { 
        browser
            .useCss() 
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .click('ontology-editor-page open-ontology-tab search-bar')
            .keys('myTitle')
            .keys(browser.Keys.ENTER)
            .waitForElementNotVisible('.spinner')
            .waitForElementVisible('ontology-editor-page open-ontology-tab')
    },

    'Step 10: Ensure IRI changes are successful' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .setValue('open-ontology-tab search-bar input', 'myTitle')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER)
            .useXpath()
            .assert.textContains('//open-ontology-tab//small', 'myOntology')
            .click('//open-ontology-tab//small[text()[contains(.,"myOntology")]]')
        // wait for loading to finish
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
    },

    'Step 11: Create a new branch' : function(browser) {
        browser
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-code-fork')
            .click('circle-button-stack .fa-code-fork')
            .waitForElementVisible('create-branch-overlay .modal-title')
            .assert.textContains('create-branch-overlay .modal-title', 'Create New Branch')
            .waitForElementVisible('create-branch-overlay text-input[display-text="\'Title\'"] input')
            .setValue('create-branch-overlay text-input[display-text="\'Title\'"] input', "newBranchTitle")
            .waitForElementVisible('create-branch-overlay text-area[display-text="\'Description\'"] textarea')
            .setValue('create-branch-overlay text-area[display-text="\'Description\'"] textarea', "newBranchDescription")
            .useXpath()
            .click('//create-branch-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-branch-overlay .modal-title')
    },

    'Step 12: Verify a new branch was created' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//open-ontology-select//span[text()[contains(.,"newBranchTitle")]]')
            .useCss()
    },

    'Step 13: Create a new Class': function(browser) {
        browser
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-code-fork')
            .click('circle-button-stack .hidden-buttons .fa-plus')
            .waitForElementVisible('create-entity-modal .modal-header h3')
            .assert.textContains('create-entity-modal .modal-header h3', 'Create Entity')
            .click('create-entity-modal .create-class')
            .waitForElementNotPresent('create-entity-modal .create-class')
            .waitForElementVisible('create-class-overlay .modal-header h3')
            .assert.textContains('create-class-overlay .modal-header h3', 'Create New OWL Class')
            .useXpath()
            .waitForElementVisible('//create-class-overlay//parent::label[text()="Name"]/parent::custom-label/following-sibling::input')
            .setValue('//create-class-overlay//parent::label[text()="Name"]/parent::custom-label/following-sibling::input', 'firstClass')
            .useCss()
            .setValue('create-class-overlay text-area[display-text="\'Description\'"] textarea', 'firstClassDescription') 
            .useXpath()
            .click('//create-class-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-class-overlay .modal-header h3')
    },

    'Step 14: Verify class was created': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//a[@class="nav-link"]//span[text()[contains(.,"Classes")]]')
            .click('//a[@class="nav-link"]//span[text()[contains(.,"Classes")]]//parent::a')
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Classes")]]')
            .waitForElementVisible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
    },

    'Step 15: Verify changes are shown': function(browser) {
        browser
            .useXpath() // Must use Xpath when checking does an element with a certain value exist among other like elements
            .waitForElementVisible('//a[@class="nav-link"]//span[text()[contains(.,"Changes")]]')
            .click('//a[@class="nav-link"]//span[text()[contains(.,"Changes")]]//parent::a')
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Changes")]]')
            .useCss()
            .waitForElementVisible('saved-changes-tab .expansion-panel p[title*="FirstClass"]')
            .assert.textContains('saved-changes-tab .expansion-panel p[title*="FirstClass"]', 'firstClass') // Verify Title
            .assert.textContains('saved-changes-tab .expansion-panel p[title*="FirstClass"] ~ small a', 'FirstClass') // Verify IRI
            .assert.hidden('saved-changes-tab .additions')
            .click('saved-changes-tab .expansion-panel p[title*="FirstClass"]')
            .waitForElementVisible('saved-changes-tab .additions')
            .assert.textContains('saved-changes-tab .additions', 'Added Statements')
            .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/description"]', "description")
            .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/description"] ~ div[title=firstClassDescription]', 'firstClassDescription')
            .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/title"]', "title")
            .assert.textContains('saved-changes-tab .additions .statement-display div[title*="terms/title"] ~ div[title=firstClass]', 'firstClass')
            .assert.textContains('saved-changes-tab .additions .statement-display div[title*="ns#type"]', "type")
            .assert.textContains('saved-changes-tab .additions .statement-display div[title*="ns#type"] ~ div[title*="owl#Class"]', 'owl#Class')
    },

    'Step 16: Commit Changes': function(browser) {
        browser
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-git')
            .click('circle-button-stack .fa-git')
            .waitForElementVisible('commit-overlay .modal-header h3')
            .assert.textContains('commit-overlay .modal-header h3', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'commit123')
            .useXpath()
            .click('//commit-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay .modal-header h3')
    },

    'Step 17: Verify no changes are shown': function(browser) {
        browser
            .assert.textContains('.nav-link.active span', 'Changes')
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'You don\'t have any uncommitted changes.')
            .assert.not.elementPresent('saved-changes-tab .expansion-panel')
    },

    'Step 18: Open the Create Data Property Modal': function(browser) {
                browser
                    .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
                    .waitForElementVisible('circle-button-stack .fa-code-fork')
                    .click('circle-button-stack .hidden-buttons .fa-plus')
                    .waitForElementVisible('create-entity-modal .modal-header h3')
                    .assert.textContains('create-entity-modal .modal-header h3', 'Create Entity')
                    .click('create-entity-modal .create-data-property')
                    .waitForElementNotPresent('create-entity-modal .create-data-property')
                    .waitForElementVisible('create-data-property-overlay .modal-header h3')
                    .useXpath()
                    .waitForElementVisible('//create-data-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Functional Property")]]')
                    .click('//create-data-property-overlay//button[text()="Cancel"]')
                    .useCss()
                    .waitForElementNotPresent('create-data-property-overlay .modal-header h3')
    },

    'Step 19: Open the Create Object Property Modal': function(browser) {
                browser
                    .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
                    .waitForElementVisible('circle-button-stack .fa-code-fork')
                    .click('circle-button-stack .hidden-buttons .fa-plus')
                    .waitForElementVisible('create-entity-modal .modal-header h3')
                    .assert.textContains('create-entity-modal .modal-header h3', 'Create Entity')
                    .click('create-entity-modal .create-object-property')
                    .waitForElementNotPresent('create-entity-modal .create-object-property')
                    .waitForElementVisible('create-object-property-overlay .modal-header h3')
                    .useXpath()
                    .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Functional Property")]]')
                    .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Asymmetric Property")]]')
                    .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Symmetric Property")]]')
                    .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Transitive Property")]]')
                    .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Reflexive Property")]]')
                    .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Irreflexive Property")]]')
                    .click('//create-object-property-overlay//button[text()="Cancel"]')
                    .useCss()
                    .waitForElementNotPresent('create-object-property-overlay .modal-header h3')
    },

    'Step 20: Verify Commit': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//a[@class="nav-link"]//span[text()[contains(.,"Commits")]]')
            .click('//a[@class="nav-link"]//span[text()[contains(.,"Commits")]]//parent::a')
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="commit123"] span', 'commit123')
    },

    'Step 21: Verify Master Branch only has initial commit': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//open-ontology-select//span[text()[contains(.,"newBranchTitle")]]')
            .useCss()
            .click('open-ontology-select span[role=button]')
            .waitForElementVisible('span[title=MASTER]')
            .click('span[title=MASTER]')
            .useXpath()
            .waitForElementVisible('//open-ontology-select//span[text()[contains(.,"MASTER")]]')
            .assert.visible('//a[@class="nav-link active"]//span[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementNotPresent('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
    },

    'Step 22: Switch back to the other branch': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//open-ontology-select//span[text()[contains(.,"MASTER")]]')
            .useCss()
            .click('open-ontology-select span[role=button]')
            .waitForElementVisible('span[title=newBranchTitle]')
            .click('span[title=newBranchTitle]')
            .useXpath()
            .waitForElementVisible('//open-ontology-select//span[text()[contains(.,"newBranchTitle")]]')
            .useCss()
    },

    'Step 23: Perform a merge': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .hidden-buttons')
            .waitForElementVisible('circle-button-stack .fa-random',15000)
            .click('circle-button-stack .fa-random')
            .waitForElementVisible('.merge-message')
            .assert.textContains('.merge-message', 'newBranchTitle')
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
            .useCss()
            .waitForElementVisible('merge-block commit-changes-display p[title*="FirstClass"]')
            .assert.textContains('merge-block commit-changes-display p[title*="FirstClass"]', 'First Class')
            .waitForElementVisible('merge-block commit-changes-display p[title*="FirstClass"] ~ small')
            .assert.textContains('merge-block commit-changes-display p[title*="FirstClass"] ~ small', 'myOntology#FirstClass')
            .assert.textContains('merge-block .additions h5', 'Added Statements')
            .assert.textContains('merge-block .additions .statement-display div[title*="terms/description"]', "description")
            .assert.textContains('merge-block .additions .statement-display div[title*="terms/description"] ~ div[title=firstClassDescription]', 'firstClassDescription')
            .assert.textContains('merge-block .additions .statement-display div[title*="terms/title"]', "title")
            .assert.textContains('merge-block .additions .statement-display div[title*="terms/title"] ~ div[title=firstClass]', 'firstClass')
            .assert.textContains('merge-block .additions .statement-display div[title*="ns#type"]', "type")
            .assert.textContains('merge-block .additions .statement-display div[title*="ns#type"] ~ div[title*="owl#Class"]', 'owl#Class')
            .useXpath()
            .click('//button[text()="Submit"]')
            .useCss()
    },

    'Step 24: Validate Merged Commits': function(browser) {
        browser
            .waitForElementNotPresent('#spinner-full')
            .useXpath()
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="commit123"] span', 'commit123')
            .waitForElementVisible('commit-history-table .commit-message[title="Merge of newBranchTitle into MASTER"]')
            .assert.textContains('commit-history-table .commit-message[title="Merge of newBranchTitle into MASTER"] span', 'Merge of newBranchTitle into MASTER')
    }
}
