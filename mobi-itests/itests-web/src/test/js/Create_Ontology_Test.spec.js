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

    'Step 3: Edit New Ontology Overlay' : function(browser) {
        browser   
            .useCss()        
            .waitForElementVisible('new-ontology-overlay')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', 'myTitle')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', 'myDescription')
    },

    'Step 4: Submit New Ontology Overlay' : function(browser) {
        browser
            .useCss()        
            .waitForElementVisible('new-ontology-overlay')
            .useXpath()
            .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
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
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Project")]]')
            .useCss()       
    },

    'Step 6: Edit IRI for ontology' : function(browser) { 
        browser
            .useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .setValue('//mat-label[text()[contains(.,"Ends With")]]//ancestor::mat-form-field//input', 'myOntology')
            .click('xpath', '//edit-iri-overlay//span[text()="Submit"]')
            .waitForElementNotPresent('edit-iri-overlay')
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Open Commit overlay' : function(browser) {
        browser
            .useCss()
            .pause(1000)
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay')
    },

    'Step 8: Edit Commit message and Submit' : function(browser) {
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

    'Step 9: Open Ontology Editor Page Ontology List Page' : function(browser) {
        browser
            .click('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button')
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
    },

    'Step 10: On The Ontology List Page, search for ontology' : function(browser) {
        browser
            .useCss() 
            .waitForElementPresent('ontology-editor-page open-ontology-tab')
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', 'myTitle')
            .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('ontology-editor-page open-ontology-tab')
    },

    'Step 11: Ensure IRI changes are successful' : function(browser) {
        browser
            .useXpath()
            .assert.textContains('//open-ontology-tab//small', 'myOntology')
            .click('//open-ontology-tab//small[text()[contains(.,"myOntology")]]')
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
    },

    'Step 12: Create a new branch' : function(browser) {
        browser
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button i.fa-code-fork')
            .click('ontology-button-stack circle-button-stack button i.fa-code-fork')
            .waitForElementVisible('create-branch-overlay h1.mat-dialog-title')
            .assert.textContains('create-branch-overlay h1.mat-dialog-title', 'Create New Branch')
            .useXpath()
            .waitForElementVisible('//create-branch-overlay//input[@placeholder="Title"]')
            .waitForElementVisible('//create-branch-overlay//textarea[@placeholder="Description"]')
            .setValue('//create-branch-overlay//input[@placeholder="Title"]', "newBranchTitle")
            .setValue('//create-branch-overlay//textarea[@placeholder="Description"]', "newBranchDescription")
            .click('//create-branch-overlay//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('create-branch-overlay h1.mat-dialog-title');
            browser.globals.wait_for_no_spinners(browser);
    },

    'Step 13: Verify a new branch was created' : function(browser) {
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "newBranchTitle");
            })
            .useCss()
    },

    'Step 14: Create a new Class': function(browser) {
        browser
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

    'Step 15: Verify class was created': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Classes")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Classes")]]')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .assert.visible('//class-hierarchy-block//tree-item//span[text()[contains(.,"firstClass")]]')
    },

    'Step 16: Verify changes are shown': function(browser) {
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

    'Step 17: Commit Changes': function(browser) {
        browser
            .useCss()
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

    'Step 18: Verify no changes are shown': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Changes")]]')
            .useCss()
            .waitForElementVisible('info-message p')
            .assert.textContains('info-message p', 'You don\'t have any uncommitted changes.')
            .assert.not.elementPresent('saved-changes-tab .expansion-panel')
    },

    'Step 19: Open the Create Data Property Modal': function(browser) {
        browser
            .waitForElementVisible('ontology-button-stack circle-button-stack')
            .click('ontology-button-stack circle-button-stack')
            .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
            .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
            .click('create-entity-modal .create-data-property')
            .waitForElementNotPresent('create-entity-modal .create-data-property')
            .waitForElementVisible('create-data-property-overlay h1.mat-dialog-title')
            .assert.textContains('create-data-property-overlay h1.mat-dialog-title', 'Create New OWL Data Property')
            .useXpath()
            .waitForElementVisible('//create-data-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Functional Property")]]')
            .click('//create-data-property-overlay//span[text()="Cancel"]')
            .useCss()
            .waitForElementNotPresent('create-data-property-overlay h1.mat-dialog-title')
    },

    'Step 20: Open the Create Object Property Modal': function(browser) {
        browser
            .waitForElementVisible('ontology-button-stack circle-button-stack')
            .click('ontology-button-stack circle-button-stack')
            .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
            .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
            .click('create-entity-modal .create-object-property')
            .waitForElementNotPresent('create-entity-modal .create-object-property')
            .waitForElementVisible('create-object-property-overlay h1.mat-dialog-title')
            .assert.textContains('create-object-property-overlay h1.mat-dialog-title', 'Create New OWL Object Property')
            .useXpath()
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Functional Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Asymmetric Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Symmetric Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Transitive Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Reflexive Property")]]')
            .waitForElementVisible('//create-object-property-overlay//span[@class="mat-checkbox-label"][text()[contains(.,"Irreflexive Property")]]')
            .click('//create-object-property-overlay//span[text()="Cancel"]')
            .useCss()
            .waitForElementNotPresent('create-object-property-overlay h1.mat-dialog-title')
    },

    'Step 21: Verify Commit': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="commit123"] span', 'commit123')
    },

    'Step 22: Verify Master Branch only has initial commit': function(browser) {
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "newBranchTitle");
            })
            .useCss()
            .click('open-ontology-select .mat-form-field-infix')
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "MASTER");
            })
            .useCss()
            .waitForElementNotPresent('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
    },

    'Step 23: Switch back to the other branch': function(browser) {
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "MASTER");
            })
            .useCss()
            .click('open-ontology-select .mat-form-field-infix')
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "newBranchTitle")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "newBranchTitle")]');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .getValue("//open-ontology-select//input", function(result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "newBranchTitle");
            })
            .useCss()
    },

    'Step 24: Perform a merge': function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .useXpath().click('//circle-button-stack//button[@mattooltip="Merge Branches"]')
            .useCss().waitForElementVisible('.merge-message')
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
            .waitForElementVisible('merge-block commit-changes-display mat-panel-title[title*="firstClass"]')
            .assert.textContains('merge-block commit-changes-display mat-panel-title[title*="firstClass"]', 'firstClass')
            .waitForElementVisible('merge-block commit-changes-display mat-panel-title[title*="firstClass"] ~ mat-panel-description small')
            .assert.textContains('merge-block commit-changes-display mat-panel-title[title*="firstClass"] ~ mat-panel-description small', 'myOntology#FirstClass')
            .click('merge-block commit-changes-display mat-panel-title[title*="firstClass"]')
            .waitForElementVisible('merge-block commit-compiled-resource')
            .assert.textContains('merge-block commit-compiled-resource p.type-label', "Type(s)")
            .assert.textContains('merge-block commit-compiled-resource p.type-label ~ div.type div.px-4', 'owl:Class')
            .useXpath()
            .assert.textContains('//merge-block//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]', "Description")
            .assert.textContains('//merge-block//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/description")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClassDescription')
            .assert.textContains('//merge-block//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]', "Title")
            .assert.textContains('//merge-block//commit-compiled-resource//p[contains(@title,"http://purl.org/dc/terms/title")]/../..//div[contains(@class, "prop-value-container")]//div[contains(@class, "value-display")]', 'firstClass')
            .click('//button[text()="Submit"]')
    },

    'Step 25: Validate Merged Commits': function(browser) {
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .useCss()
            .waitForElementVisible('commit-history-table .commit-message[title="The initial commit."]')
            .assert.textContains('commit-history-table .commit-message[title="The initial commit."] span', 'The initial commit.')
            .waitForElementVisible('commit-history-table .commit-message[title="commit123"]')
            .assert.textContains('commit-history-table .commit-message[title="commit123"] span', 'commit123')
            .waitForElementVisible('commit-history-table .commit-message[title="Merge of newBranchTitle into MASTER"]')
            .assert.textContains('commit-history-table .commit-message[title="Merge of newBranchTitle into MASTER"] span', 'Merge of newBranchTitle into MASTER')
    }
}
