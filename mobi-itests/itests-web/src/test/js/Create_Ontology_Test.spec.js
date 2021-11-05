/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
            .waitForElementVisible('edit-iri-overlay')
            .setValue('edit-iri-overlay div.form-group.ends-container input', 'myOntology')
            .click('xpath', '//edit-iri-overlay//button[text()="Submit"]')
            .waitForElementNotPresent('.spinner')
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
            .assert.containsText('commit-overlay .modal-header h3', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'Changed IRI')
            .useXpath()
            .click('//commit-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('.spinner')
            .waitForElementNotPresent('commit-overlay')
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },

    'Step 8: Open Ontology Editor Page Ontology List Page' : function(browser) { 
        browser
            .useCss()  
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .click('ontology-sidebar button.btn.btn-primary')
            .waitForElementNotPresent('.spinner')
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
    },

    'Step 9: On The Ontology List Page, search for ontology' : function(browser) { 
        browser
            .useCss() 
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .click('ontology-editor-page open-ontology-tab search-bar')
            .keys('myTitle')
            .keys(browser.Keys.ENTER)
            .waitForElementNotPresent('.spinner')
            .waitForElementVisible('ontology-editor-page open-ontology-tab')
    },

    'Step 10: Ensure IRI changes are successful' : function(browser) {
        browser
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .useXpath()
            .assert.containsText('//open-ontology-tab//small', 'MyTitlemyOntology')
            .click('//open-ontology-tab//small[text()[contains(.,"MyTitlemyOntology")]]')
        // wait for loading to finish
        browser
            .useCss()
            .waitForElementNotPresent('.spinner')
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
    },

    'Step 11: Create a new branch' : function(browser) {
        browser
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-code-fork')
            .click('circle-button-stack .fa-code-fork')
            .waitForElementVisible('create-branch-overlay .modal-title')
            .assert.containsText('create-branch-overlay .modal-title', 'Create New Branch')
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
            .assert.containsText('create-entity-modal .modal-header h3', 'Create Entity')
            .click('create-entity-modal .create-class')
            .waitForElementNotPresent('create-entity-modal .create-class')
            .waitForElementVisible('create-class-overlay .modal-header h3')
            .assert.containsText('create-class-overlay .modal-header h3', 'Create New OWL Class')
            .useXpath()
            .waitForElementVisible('//create-class-overlay//parent::label[text()="Name"]/parent::custom-label/following-sibling::input')
            .setValue('//create-class-overlay//parent::label[text()="Name"]/parent::custom-label/following-sibling::input', 'firstClass')
            .useCss()
            .setValue('create-class-overlay text-area[display-text="\'Description\'"] textarea', 'firstClassDescription') 
            .useXpath()
            .click('//create-class-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-class-overlay .modal-header h3', 5000)
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
            .assert.containsText('saved-changes-tab .expansion-panel p[title*="FirstClass"]', 'firstClass') // Verify Title
            .assert.containsText('saved-changes-tab .expansion-panel p[title*="FirstClass"] ~ small a', 'FirstClass') // Verify IRI
            .assert.hidden('saved-changes-tab .additions')
            .click('saved-changes-tab .expansion-panel p[title*="FirstClass"]')
            .waitForElementVisible('saved-changes-tab .additions')
            .assert.containsText('saved-changes-tab .additions', 'Added Statements')
            .assert.containsText('saved-changes-tab .additions .statement-display div[title*="terms/description"]', "description")
            .assert.containsText('saved-changes-tab .additions .statement-display div[title*="terms/description"] ~ div[title=firstClassDescription]', 'firstClassDescription')
            .assert.containsText('saved-changes-tab .additions .statement-display div[title*="terms/title"]', "title")
            .assert.containsText('saved-changes-tab .additions .statement-display div[title*="terms/title"] ~ div[title=firstClass]', 'firstClass')
            .assert.containsText('saved-changes-tab .additions .statement-display div[title*="ns#type"]', "type")
            .assert.containsText('saved-changes-tab .additions .statement-display div[title*="ns#type"] ~ div[title*="owl#Class"]', 'owl#Class')
    },

    'Step 16: Commit Changes': function(browser) {
        browser
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-git')
            .click('circle-button-stack .fa-git')
            .waitForElementVisible('commit-overlay .modal-header h3')
            .assert.containsText('commit-overlay .modal-header h3', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'commit123')
            .useXpath()
            .click('//commit-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay .modal-header h3', 5000)
    },

    'Step 17: Verify no changes are shown': function(browser) {
        browser
            .assert.containsText('.nav-link.active span', 'Changes')
            .waitForElementVisible('info-message p')
            .assert.containsText('info-message p', 'You don\'t have any uncommitted changes.')
            .assert.not.elementPresent('saved-changes-tab .expansion-panel')
    },

    'Step 18: Verify Commit': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//a[@class="nav-link"]//span[text()[contains(.,"Commits")]]')
            .click('//a[@class="nav-link"]//span[text()[contains(.,"Commits")]]//parent::a')
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.containsText('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.containsText('commit-history-table .commit-message[title="commit123"] span', 'commit123')
    },

    'Step 19: Verify Master Branch only has initial commit': function(browser) {
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
            .assert.containsText('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
    },

    'Step 20: Switch back to the other branch': function(browser) {
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
    
    'Step 21: Perform a merge': function(browser) {
        browser
            .moveToElement('circle-button-stack .base-btn.fa-plus', 0, 0)
            .waitForElementVisible('circle-button-stack .fa-random')
            .click('circle-button-stack .fa-random')
            .waitForElementVisible('.merge-message')
            .assert.containsText('.merge-message', 'newBranchTitle')
            .click('branch-select div[placeholder="Select a Branch"] span.btn')
            .useXpath()
            .waitForElementVisible('//merge-block//branch-select//span[text()[contains(.,"MASTER")]]')
            .click('//merge-block//branch-select//span[text()[contains(.,"MASTER")]]')
            .useCss()
            .waitForElementVisible('div[placeholder="Select a Branch"] > span > span > span')
            .assert.containsText('div[placeholder="Select a Branch"] > span > span > span', 'Branch: MASTER')
            .waitForElementVisible('merge-block commit-changes-display p[title*="FirstClass"]')
            .assert.containsText('merge-block commit-changes-display p[title*="FirstClass"]', 'firstClass')
            .waitForElementVisible('merge-block commit-changes-display p[title*="FirstClass"] ~ small')
            .assert.containsText('merge-block commit-changes-display p[title*="FirstClass"] ~ small', 'MyTitlemyOntology#FirstClass')
            .assert.containsText('merge-block .additions h5', 'Added Statements')
            .assert.containsText('merge-block .additions .statement-display div[title*="terms/description"]', "description")
            .assert.containsText('merge-block .additions .statement-display div[title*="terms/description"] ~ div[title=firstClassDescription]', 'firstClassDescription')
            .assert.containsText('merge-block .additions .statement-display div[title*="terms/title"]', "title")
            .assert.containsText('merge-block .additions .statement-display div[title*="terms/title"] ~ div[title=firstClass]', 'firstClass')
            .assert.containsText('merge-block .additions .statement-display div[title*="ns#type"]', "type")
            .assert.containsText('merge-block .additions .statement-display div[title*="ns#type"] ~ div[title*="owl#Class"]', 'owl#Class')
            .useXpath()
            .click('//button[text()="Submit"]')
            .useCss()
    },

    'Step 22: Validate Merged Commits': function(browser) {
        browser
            .waitForElementNotPresent('.spinner')
            .useXpath()
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.containsText('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.containsText('commit-history-table .commit-message[title="commit123"] span', 'commit123')
            .waitForElementVisible('commit-history-table .commit-message[title="Merge of newBranchTitle into MASTER"]')
            .assert.containsText('commit-history-table .commit-message[title="Merge of newBranchTitle into MASTER"] span', 'Merge of newBranchTitle into MASTER')
    }
}
