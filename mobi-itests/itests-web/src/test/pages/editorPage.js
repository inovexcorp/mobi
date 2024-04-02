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

const ontologyListPageCss = 'ontology-editor-page open-ontology-tab';

const ontologyPageCommands = {
    isActive: function (option) {
        if (option === 'ontology-tab') {
            return this.waitForElementPresent('ontology-editor-page ontology-tab');
        } else {
            return this.waitForElementPresent('ontology-editor-page');
        }
    },

    openNewOntologyOverlay: function() {
        const newOntologyButtonXpath = '//span[text()="New Ontology"]/parent::button';
        return this.useCss()
            .waitForElementPresent(ontologyListPageCss)
            .useXpath()
            .waitForElementVisible(newOntologyButtonXpath)
            .click(newOntologyButtonXpath)
            .useCss()
            .waitForElementVisible('new-ontology-overlay');
    },

    editNewOntologyOverlay: function(title, description, language, keywords) {
        return this.useCss()
            .waitForElementVisible('new-ontology-overlay')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
            .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', title)
            .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', description);
    },

    submitNewOntologyOverlay: function() {
        return this.useXpath()
            .waitForElementVisible('//new-ontology-overlay')
            .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
            .useCss()
            .waitForElementNotPresent('new-ontology-overlay') // intermittent not found backend issue
            .waitForElementPresent('ontology-editor-page ontology-tab');
    },

    openOntologyListPage: function() {
        return this.click('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button')
            .waitForElementNotPresent('#spinner-full')
            .waitForElementPresent(ontologyListPageCss)
    },

    searchOntology: function(searchText) {
        return this.useCss()
            .waitForElementPresent(ontologyListPageCss)
            .clearValue('open-ontology-tab search-bar input')
            .setValue('open-ontology-tab search-bar input', searchText)
            .sendKeys('open-ontology-tab search-bar input', this.api.Keys.ENTER);
    },

    openOntology: function(ontologyTitle) {
        return this.useXpath()
            .waitForElementVisible('//ontology-editor-page//open-ontology-tab//div//h3//span[text()[contains(.,"' + ontologyTitle + '")]]')
            .click('//ontology-editor-page//open-ontology-tab//div//h3//span[text()[contains(.,"' + ontologyTitle + '")]]')
    }
}

const ontologySidebarCommands = {
    verifyBranchSelection: function(title) {
        return this.useXpath()
            .waitForElementPresent('//ontology-sidebar//open-ontology-select')
            .getValue("//ontology-sidebar//open-ontology-select//input", function (result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, title);
            });
    },

    switchToBranch: function(title) {
        return this.useCss()
            .click('open-ontology-select .mat-form-field-infix') // open open-ontology-select dropdown
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "' + title + '")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "' + title + '")]');
    },

    deleteBranch: function(title) {
        return this.useCss()
            .click('open-ontology-select .mat-form-field-infix') // open open-ontology-select dropdown
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "' + title + '")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "' + title + '")]//following-sibling::span//a[contains(@class, "fa-trash-o")]')
            .useCss()
            .waitForElementVisible('mat-dialog-container confirm-modal button.mat-primary')
            .click('mat-dialog-container confirm-modal button.mat-primary')
    }
}

const ontologyStackCommands = {
    openCommitOverlay: function() {
        return this.useCss()
            .waitForElementVisible('ontology-tab')
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay');
    },

    editCommitOverlayAndSubmit: function(comment) {
        return this.useCss()
            .waitForElementVisible('commit-overlay')
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', comment)
            .useXpath()
            .click('//commit-overlay//span[text()="Submit"]');
    },

    openNewBranchOverlay: function() {
        return this.useCss()
            .waitForElementVisible('ontology-tab')
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
            .waitForElementVisible('ontology-button-stack circle-button-stack button i.fa-code-fork')
            .click('ontology-button-stack circle-button-stack button.btn-warning i.fa-code-fork')
            .waitForElementVisible('create-branch-overlay h1.mat-dialog-title')
            .assert.textContains('create-branch-overlay h1.mat-dialog-title', 'Create New Branch');
    },

    editNewBranchOverlayAndSubmit: function(title, description) {
        return this.useXpath()
            .waitForElementVisible('//create-branch-overlay//input[@data-placeholder="Title"]')
            .waitForElementVisible('//create-branch-overlay//textarea[@data-placeholder="Description"]')
            .setValue('//create-branch-overlay//input[@data-placeholder="Title"]', title)
            .setValue('//create-branch-overlay//textarea[@data-placeholder="Description"]', description)
            .click('//create-branch-overlay//span[text()="Submit"]');
    },

    createNewOwlClass: function(title, description) {
        return this.useCss()
            .click('ontology-button-stack circle-button-stack')
            .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
            .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
            .click('create-entity-modal .create-class')
            .waitForElementNotPresent('create-entity-modal .create-class')
            .waitForElementVisible('create-class-overlay h1.mat-dialog-title')
            .assert.textContains('create-class-overlay h1.mat-dialog-title', 'Create New OWL Class')
            .useXpath()
            .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
            .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', title)
            .setValue('//mat-label[text()[contains(.,"Description")]]//ancestor::mat-form-field//textarea', description)
            .click('//create-class-overlay//span[text()="Submit"]');
    },
}

const projectTabCommands = {
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
}

module.exports = {
    elements: {
        page: ontologyListPageCss
    },
    commands: [ontologyPageCommands, ontologySidebarCommands, ontologyStackCommands, projectTabCommands],
}

