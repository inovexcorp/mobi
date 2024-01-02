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

var OntologyEditorPage = function() {
    this.ontologyListPageCss = 'ontology-editor-page open-ontology-tab';
};

OntologyEditorPage.prototype.isActive = function(browser, option) {
    if (option === 'ontology-tab') {
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page ontology-tab');
    } else {
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page');
    }
};

// ontology-sidebar methods

OntologyEditorPage.prototype.verifyBranchSelection = function(browser, title) {
    browser
        .useXpath()
        .waitForElementPresent('//ontology-sidebar//open-ontology-select')
        .getValue("//ontology-sidebar//open-ontology-select//input", function(result) {
            this.assert.equal(typeof result, "object");
            this.assert.equal(result.status, 0);
            this.assert.equal(result.value, title);
        });
};

OntologyEditorPage.prototype.switchToBranch = function(browser, title) {
    browser
        .useCss()
        .click('open-ontology-select .mat-form-field-infix') // open open-ontology-select dropdown
        .useXpath()
        .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "' + title + '")]')
        .click('//mat-optgroup//mat-option//span[contains(text(), "' + title + '")]');
};

// open-ontology-tab Methods (Ontology List Page)

OntologyEditorPage.prototype.openNewOntologyOverlay = function(browser) {
    var newOntologyButtonXpath = '//span[text()="New Ontology"]/parent::button';
    browser
        .useCss()
        .waitForElementPresent(this.ontologyListPageCss) 
        .useXpath()
        .waitForElementVisible(newOntologyButtonXpath)
        .click(newOntologyButtonXpath)
        .useCss()
        .waitForElementVisible('new-ontology-overlay');
};

OntologyEditorPage.prototype.editNewOntologyOverlay = function(browser, title, description, language, keywords) {
    browser
        .useCss()
        .waitForElementVisible('new-ontology-overlay')
        .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]')
        .waitForElementVisible('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]')
        .setValue('xpath', '//new-ontology-overlay//mat-form-field//input[@name="title"]', title)
        .setValue('xpath', '//new-ontology-overlay//mat-form-field//textarea[@name="description"]', description);
};

OntologyEditorPage.prototype.submitNewOntologyOverlay = function(browser) {
    // NOTE: No Success Toast occurs when submitted, page navigates to the projectTab page
    browser
        .useXpath()
        .waitForElementVisible('//new-ontology-overlay')
        .click('//new-ontology-overlay//span[text()="Submit"]/parent::button')
        .useCss()
        .waitForElementNotPresent('new-ontology-overlay') // intermittent not found backend issue  
        .waitForElementPresent('ontology-editor-page ontology-tab');
    browser.globals.wait_for_no_spinners(browser);
    this.onProjectTab(browser);
};

OntologyEditorPage.prototype.openOntologyListPage = function (browser){
    browser
        .click('xpath', '//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button')
        .waitForElementNotPresent('#spinner-full')
        .waitForElementPresent(this.ontologyListPageCss)
};

OntologyEditorPage.prototype.searchOntology = function (browser, searchText){
    browser
        .useCss()
        .waitForElementPresent(this.ontologyListPageCss)
        .clearValue('open-ontology-tab search-bar input')
        .setValue('open-ontology-tab search-bar input', searchText)
        .sendKeys('open-ontology-tab search-bar input', browser.Keys.ENTER);
    browser.globals.wait_for_no_spinners(browser);
    browser 
        .useCss()
        .waitForElementVisible(this.ontologyListPageCss);
}

// circle-button-stack Methods

OntologyEditorPage.prototype.openCommitOverlay = function(browser) {
    browser
        .useCss()
        .waitForElementVisible('ontology-tab')
        .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
        .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
        .click('ontology-button-stack circle-button-stack button.btn-info')
        .waitForElementVisible('commit-overlay');
};

OntologyEditorPage.prototype.editCommitOverlayAndSubmit = function(browser, comment) {
    browser
        .useCss()
        .waitForElementVisible('commit-overlay')
        .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
        .setValue('commit-overlay textarea[name=comment]', comment)
        .useXpath()
        .click('//commit-overlay//span[text()="Submit"]');
    browser.globals.wait_for_no_spinners(browser);
    browser
        .useCss()
        .waitForElementNotPresent('commit-overlay')
        .waitForElementNotPresent('commit-overlay h1.mat-dialog-title'); // intermittent issue caused by backend
};

OntologyEditorPage.prototype.openNewBranchOverlay = function(browser) {
    browser
        .useCss()
        .waitForElementVisible('ontology-tab')
        .moveToElement('ontology-button-stack circle-button-stack', 0, 0)
        .waitForElementVisible('ontology-button-stack circle-button-stack button i.fa-code-fork')
        .click('ontology-button-stack circle-button-stack button.btn-warning i.fa-code-fork')
        .waitForElementVisible('create-branch-overlay h1.mat-dialog-title')
        .assert.textContains('create-branch-overlay h1.mat-dialog-title', 'Create New Branch');
};

OntologyEditorPage.prototype.editNewBranchOverlayAndSubmit = function(browser, title, description) {
    browser
        .useXpath()
        .waitForElementVisible('//create-branch-overlay//input[@data-placeholder="Title"]')
        .waitForElementVisible('//create-branch-overlay//textarea[@data-placeholder="Description"]')
        .setValue('//create-branch-overlay//input[@data-placeholder="Title"]', title)
        .setValue('//create-branch-overlay//textarea[@data-placeholder="Description"]', description)
        .click('//create-branch-overlay//span[text()="Submit"]');
    browser.globals.wait_for_no_spinners(browser);
    browser
        .useCss()
        .waitForElementNotPresent('create-branch-overlay')
        .waitForElementNotPresent('create-branch-overlay h1.mat-dialog-title');
};

OntologyEditorPage.prototype.createNewOwlClass  = function(browser, title, description) {
    browser
        .useCss()
        .click('ontology-button-stack circle-button-stack')
        .waitForElementVisible('create-entity-modal h1.mat-dialog-title')
        .assert.textContains('create-entity-modal h1.mat-dialog-title', 'Create Entity')
        .click('create-entity-modal .create-class')
        .waitForElementNotPresent('create-entity-modal .create-class');
    browser
        .waitForElementVisible('create-class-overlay h1.mat-dialog-title')
        .assert.textContains('create-class-overlay h1.mat-dialog-title', 'Create New OWL Class')
        .useXpath()
        .waitForElementVisible('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input')
        .setValue('//mat-label[text()[contains(.,"Name")]]//ancestor::mat-form-field//input', title)
        .setValue('//mat-label[text()[contains(.,"Description")]]//ancestor::mat-form-field//textarea', description)
        .click('//create-class-overlay//span[text()="Submit"]');
    browser.globals.wait_for_no_spinners(browser);
    browser
        .useCss()
        .waitForElementNotPresent('create-class-overlay')
        .waitForElementNotPresent('create-class-overlay h1.mat-dialog-title');
};

// Project Tab Methods

OntologyEditorPage.prototype.onProjectTab = function (browser){
    browser
        .useCss()
        .waitForElementVisible('ontology-editor-page')
        .waitForElementVisible('ontology-editor-page ontology-tab')
        .waitForElementVisible('ontology-editor-page ontology-tab project-tab')
        .waitForElementVisible('xpath', '//mat-tab-header//div[text()[contains(.,"Project")]]');
    browser
        .waitForElementVisible('ontology-editor-page ontology-tab project-tab selected-details')
        .waitForElementVisible('ontology-editor-page ontology-tab project-tab selected-details static-iri')
        .waitForElementVisible('ontology-editor-page ontology-tab project-tab ontology-properties-block')
        .waitForElementVisible('ontology-editor-page ontology-tab project-tab imports-block')
        .waitForElementVisible('ontology-editor-page ontology-tab project-tab preview-block');
};

OntologyEditorPage.prototype.verifyProjectTab = function (browser, title, description, iri){
    this.onProjectTab(browser);
    browser
        .useXpath()
        .waitForElementVisible('//project-tab//ontology-properties-block//value-display//span[text()[contains(.,"' + title + '")]]')
        .waitForElementVisible('//project-tab//ontology-properties-block//value-display//span[text()[contains(.,"' + description + '")]]')
        .waitForElementVisible('//project-tab//selected-details//static-iri//span[text()[contains(.,"' + iri + '")]]');
};

OntologyEditorPage.prototype.editIri = function(browser, newIriEnd) {
    this.onProjectTab(browser);
    browser
        .useXpath()
        .waitForElementVisible('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]')
        .click('//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]');
    browser
        .useXpath()
        .waitForElementVisible('//edit-iri-overlay')
        .waitForElementVisible("//edit-iri-overlay//h1[text() [contains(., 'Edit IRI')]]")
        .useCss()
        .pause(1000) // To avoid clashes with autofocusing
        .setValue('edit-iri-overlay input[name=iriEnd]', newIriEnd)
        .useXpath()
        .click("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
        .waitForElementNotPresent('//edit-iri-overlay')
        .assert.not.elementPresent("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
    browser.globals.wait_for_no_spinners(browser);
};

module.exports = { ontologyEditorPage: new OntologyEditorPage() };
