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

module.exports = {
    '@tags': ['mobi', 'ontology-editor', 'sanity'],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:8443/mobi/index.html#/home')
            .waitForElementVisible('#username')
            .waitForElementVisible('#password')
            .setValue('#username', 'admin')
            .setValue('#password', 'admin')
            .click('button[type=submit]')
    },

    'Step 2: Create a new Ontology' : function(browser) {
        browser
            .waitForElementVisible('a[href="#/ontology-editor"]')
            .click('a[href="#/ontology-editor"]')
            .useXpath()
            .waitForElementVisible('//button[text()="New Ontology"]')
            .click('//button[text()="New Ontology"]')
            .useCss()
            .waitForElementVisible('new-ontology-overlay text-input[display-text="\'Title\'"] input')
            .setValue('new-ontology-overlay text-input[display-text="\'Title\'"] input', 'myTitle')
            .waitForElementVisible('new-ontology-overlay text-area[display-text="\'Description\'"] textarea')
            .setValue('new-ontology-overlay text-area[display-text="\'Description\'"] textarea', 'myDescription')
            .useXpath()
            .click('//new-ontology-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay .modal-header h3')
    },

    'Step 3: A new ontology is created' : function(browser) {
        browser
            .waitForElementVisible('.imports-block')
            .useXpath()
            .waitForElementVisible('//ontology-properties-block//value-display//span[text()[contains(.,"myTitle")]]')
            .waitForElementVisible('//ontology-properties-block//value-display//span[text()[contains(.,"myDescription")]]')
            .waitForElementVisible('//static-iri//span[text()[contains(.,"MyTitle")]]')
            .waitForElementVisible('//material-tabset//a[@class="nav-link active"]//span[text()[contains(.,"Project")]]')
            .useCss()       
    },

    'Step 4: Create a new branch' : function(browser) {
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

    'Step 5: Verify a new branch was created' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//open-ontology-select//span[text()[contains(.,"newBranchTitle")]]')
            .useCss()
    },

    'Step 6: Create a new Class': function(browser) {
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
            .waitForElementVisible('//create-class-overlay//span[text()="Name"]/parent::label/parent::custom-label/following-sibling::input', 'firstClass')
            .setValue('//create-class-overlay//span[text()="Name"]/parent::label/parent::custom-label/following-sibling::input', 'firstClass') // This is necessary because the input box is not a child of the label
            .useCss()
            .setValue('create-class-overlay text-area[display-text="\'Description\'"] textarea', 'firstClassDescription') 
            .useXpath()
            .click('//create-class-overlay//button[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-class-overlay .modal-header h3', 5000)
    },

    'Step 7: Verify class was created': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//a[@class="nav-link"]//span[text()[contains(.,"Classes")]]')
            .click('//a[@class="nav-link"]//span[text()[contains(.,"Classes")]]//parent::a')
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Classes")]]')
            .waitForElementVisible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
    },

    'Step 8: Verify changes are shown': function(browser) {
        browser
            .useXpath() // Must use Xpath when checking does an element with a certain value exist among other like elements
            .waitForElementVisible('//a[@class="nav-link"]//span[text()[contains(.,"Changes")]]')
            .click('//a[@class="nav-link"]//span[text()[contains(.,"Changes")]]//parent::a')
            .waitForElementVisible('//a[@class="nav-link active"]//span[text()[contains(.,"Changes")]]')
            .useCss()
            .waitForElementVisible('saved-changes-tab .expansion-panel p[title*="FirstClass"]')
            .assert.containsText('saved-changes-tab .expansion-panel p[title*="FirstClass"]', 'First Class') // Verify Title
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

    'Step 9: Commit Changes': function(browser) {
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

    'Step 10: Verify no changes are shown': function(browser) {
        browser
            .assert.containsText('.nav-link.active span', 'Changes')
            .waitForElementVisible('info-message span')
            .assert.containsText('info-message span', 'You don\'t have any uncommitted changes.')
            .assert.elementNotPresent('saved-changes-tab .expansion-panel')
    },

    'Step 11: Verify Commit': function(browser) {
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

    'Step 11: Verify Master Branch only has initial commit': function(browser) {
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

    'Step 12: Switch back to the other branch': function(browser) {
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
    
    'Step 13: Perform a merge': function(browser) {
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
            .assert.containsText('merge-block commit-changes-display p[title*="FirstClass"] ~ small', 'MyTitle#FirstClass')
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

    'Step 14: Validate Merged Commits': function(browser) {
        browser
            .useXpath()
            .useCss()
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
