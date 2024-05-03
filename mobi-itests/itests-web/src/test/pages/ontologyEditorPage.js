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

const parentEl = 'ontology-editor-page';
const ontologyListPageCss = 'ontology-editor-page open-ontology-tab';

const ontologyEditorCommands = {
    openRecordSelect: function() {
        return this.api.page.editorPage().openRecordSelect(parentEl);
    },

    createOntology: function(title, description) {
        return this.api.page.editorPage().createRecord(parentEl, title, description);
    },

    uploadOntology: function(file) {
        return this.api.page.editorPage().uploadRecord(parentEl, file);;
    },

    searchForOntology: function(title) {
        return this.api.page.editorPage().searchForRecord(parentEl, title);
    },

    openOntology: function(title) {
        return this.api.page.editorPage().openRecord(parentEl, title);
    },

    closeOntology: function(title) {
        return this.api.page.editorPage().closeRecord(parentEl, title);
    },

    openUploadRecordLog: function() {
        return this.api.page.editorPage().openUploadRecordLog(parentEl);
    },

    createBranch: function(branch_title, branch_description) {
        return this.api.page.editorPage().createBranch(parentEl, branch_title, branch_description);
    },

    createTag: function(tag_title) {
        return this.api.page.editorPage().createTag(parentEl, tag_title);
    },

    openBranchSelect: function() {
        return this.api.page.editorPage().openBranchSelect(parentEl);
    },

    switchBranch: function(branch_title) {
        return this.api.page.editorPage().switchBranch(parentEl, branch_title);
    },

    deleteBranchOrTag: function(title, isBranch = true) {
        return this.api.page.editorPage().deleteBranchOrTag(parentEl, title, isBranch);
    },

    deleteOntology: function(title) {
        return this.api.page.editorPage().deleteRecord(parentEl, title);
    },

    uploadChanges: function(file) {
        return this.api.page.editorPage().uploadChanges(parentEl, file);
    },

    commit: function(message) {
        return this.api.page.editorPage().commit(parentEl, message);
    },

    toggleChangesPage: function(open = true) {
        return this.api.page.editorPage().toggleChangesPage(parentEl, open);
    },

    // TODO: Figure out what to do with this
    isActive: function (option) {
        if (option === 'ontology-tab') {
            return this.waitForElementPresent('ontology-editor-page ontology-tab');
        } else {
            return this.waitForElementPresent('ontology-editor-page');
        }
    },
}

const ontologyStackCommands = {
    openCreateEntityModal: function() {
        return this.useCss()
            .click('ontology-button-stack button.mat-primary')
            .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
            .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity');
    },

    openCreateOwlClassModal: function() {
        return this.openCreateEntityModal()
            .click('create-entity-modal .create-class')
            .waitForElementNotPresent('create-entity-modal .create-class')
            .waitForElementVisible('create-class-overlay h1.mat-dialog-title')
            .assert.textContains('create-class-overlay h1.mat-dialog-title', 'Create New OWL Class')
            .waitForElementVisible('create-class-overlay mat-form-field input[name="name"]');
    },

    createNewOwlClass: function(title, description) {
        this.openCreateOwlClassModal()
            .setValue('create-class-overlay mat-form-field input[name="name"]', title);
        if (description) {
          this.useCss().setValue('create-class-overlay mat-form-field textarea[name="description"]', description);
        }
        return this.useCss()
            .click('create-class-overlay button.mat-primary')
            .waitForElementNotPresent('create-class-overlay button:not(.mat-primary)');
    },

    openCreateOwlDataPropertyModal: function() {
        return this.openCreateEntityModal()
            .click('create-entity-modal .create-data-property')
            .waitForElementNotPresent('create-entity-modal .create-data-property')
            .waitForElementVisible('create-data-property-overlay h1.mat-dialog-title')
            .assert.textContains('create-data-property-overlay h1.mat-dialog-title', 'Create New OWL Data Property')
            .waitForElementVisible('create-data-property-overlay mat-form-field input[name="name"]');
    },

    openCreateOwlObjectPropertyModal: function() {
      return this.openCreateEntityModal()
          .click('create-entity-modal .create-object-property')
          .waitForElementNotPresent('create-entity-modal .create-object-property')
          .waitForElementVisible('create-object-property-overlay h1.mat-dialog-title')
          .assert.textContains('create-object-property-overlay h1.mat-dialog-title', 'Create New OWL Object Property')
          .waitForElementVisible('create-object-property-overlay mat-form-field input[name="name"]');
  },
}

const projectTabCommands = {
    openProjectTab: function() {
        browser
          .useXpath()
          .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Project")]]')
          .click('//mat-tab-header//div[text()[contains(.,"Project")]]');
    },

    onProjectTab: function() {
        return this.useCss()
            .waitForElementVisible('ontology-editor-page')
            .waitForElementVisible('ontology-editor-page ontology-tab')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab')
            .waitForElementVisible('xpath', '//mat-tab-header//div[text()[contains(.,"Project")]]')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab selected-details')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab selected-details static-iri')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab ontology-properties-block')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
            .waitForElementVisible('ontology-editor-page ontology-tab project-tab preview-block');
    },

    verifyProjectTab: function(title, description, iri) {
        return this.useXpath()
            .waitForElementVisible('//project-tab//ontology-properties-block//value-display//span[text()[contains(.,"' + title + '")]]')
            .waitForElementVisible('//project-tab//ontology-properties-block//value-display//span[text()[contains(.,"' + description + '")]]')
            .waitForElementVisible('//project-tab//selected-details//static-iri//span[text()[contains(.,"' + iri + '")]]');
    },

    editIri: function(newIriEnd) {
        return this.useXpath()
            .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
            .waitForElementVisible('//edit-iri-overlay')
            .waitForElementVisible("//edit-iri-overlay//h1[text() [contains(., 'Edit IRI')]]")
            .useCss()
            .pause(1000) // To avoid clashes with autofocusing
            .setValue('edit-iri-overlay input[name=iriEnd]', newIriEnd)
            .useXpath()
            .click("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
            .waitForElementNotPresent('//edit-iri-overlay')
            .assert.not.elementPresent("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
    },

    addServerImport: function(import_title) {
        this.useCss()
            .click('.imports-block a.fa-plus') // clicking this opens imports-overlay
            .waitForElementVisible('imports-overlay')
            .waitForElementVisible('xpath', '//imports-overlay//div[text()[contains(.,"On Server")]]')
            .waitForElementVisible('imports-overlay button.mat-primary')
            .pause(1000) // TODO: Ideally remove this
            .click('xpath', '//imports-overlay//div[text()[contains(.,"On Server")]]')
            .waitForElementNotVisible('div.spinner') // waits for imports to loads up
            .useXpath().waitForElementVisible(`//imports-overlay//h4[text()[contains(.,"${import_title}")]]`)
            .click(`//imports-overlay//h4[text()[contains(.,"${import_title}")]]//parent::div`)
            .waitForElementVisible(`//imports-overlay//mat-chip-list//mat-chip[text()[contains(.,"${import_title}")]]`)
            .useCss()
            .click('imports-overlay button.mat-primary')
            .waitForElementNotPresent('imports-overlay button:not(.mat-primary)');
    }
}

// TODO: Add helper methods for opening different tabs

module.exports = {
    elements: {
        page: ontologyListPageCss
    },
    commands: [ontologyEditorCommands, ontologyStackCommands, projectTabCommands],
}

