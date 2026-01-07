/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

const editMappingTabSelector = 'edit-mapping-tab';
const classMappingSelectSelector = `${editMappingTabSelector} class-mapping-select`;
const classMappingSelectInputSelector = `${classMappingSelectSelector} input`;
const editorFormSelector = `${editMappingTabSelector} .editor-form`;

const mapperCommands = {
  createMapping: function(title, description) {
    return this.useCss()
      .waitForElementVisible('mapping-select-page')
      .click('button.new-button')
      .waitForElementVisible('create-mapping-overlay')
      .waitForElementVisible('create-mapping-overlay input[name="title"]')
      .setValue('form.mat-dialog-content input[name=title]', title)
      .setValue('form.mat-dialog-content textarea', description)
      .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
      .click('div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('class-mapping-overlay')
      .waitForElementNotPresent('div.modal.fade');
  },

  selectDataFile: function(file) {
    this.useCss()
      .waitForElementVisible('file-upload-page')
      .waitForElementVisible('div.file-input button')
      .click('div.file-input button')
      .uploadFile('input[type=file]', file)
      .api.globals.wait_for_no_spinners(this);
    return this.useCss()
      .waitForElementVisible('button.continue-btn:enabled')
      .click('button.continue-btn');
  },

  selectOntology: function(text) {
    this.useCss()
      .waitForElementVisible('mapping-config-overlay')
      .waitForElementVisible('div.mat-dialog-content input[data-placeholder="Search..."]')
      .setValue('div.mat-dialog-content input[data-placeholder="Search..."]', text)
      .sendKeys('div.mat-dialog-content input[data-placeholder="Search..."]', browser.Keys.ENTER)
      .waitForElementNotVisible('#spinner-local')
      .waitForElementVisible({locateStrategy: 'xpath', selector: `//mat-list-option//h4[text()[contains(.,"${text}")]]`})
      .click('xpath', `//mat-list-option//h4[text()[contains(.,"${text}")]]`)
      .waitForElementNotVisible('#spinner-local')
      .api.globals.wait_for_no_spinners(browser);
    return this.useCss()
      .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
      .click('div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('mapping-config-overlay');
  },

  addClassMapping: function(className) {
    return this.useCss()
      .waitForElementVisible(editorFormSelector)
      .waitForElementVisible('div.class-mappings button.add-class-mapping-button')
      .click('div.class-mappings button.add-class-mapping-button')
      .waitForElementVisible('class-mapping-overlay')
      .waitForElementVisible('class-mapping-overlay class-select') // Should be opened by default
      .pause(2000) // Wait for REST call to finish
      .click('xpath', `//div//mat-option//span[contains(text(), "${className}")]`)
      .useXpath()
      .waitForElementVisible('//button/span[text() [contains(., "Submit")]]')
      .click('//button/span[text() [contains(., "Submit")]]')
      .useCss()
      .waitForElementNotPresent('class-mapping-overlay');
  },

  setIRITemplateLocalName: function(columnName) {
    this.useCss()
      .waitForElementVisible(editorFormSelector)
      .waitForElementVisible('.iri-template .field-label button.mat-primary')
      .click('.iri-template .field-label button.mat-primary')
      .waitForElementVisible('iri-template-overlay')
      .waitForElementVisible('iri-template-overlay mat-form-field.template-ends-with mat-select')
      .click('form.mat-dialog-content mat-form-field.template-ends-with mat-select')
      .waitForElementVisible('div.mat-select-panel')
      .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
      .click('xpath',`//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "${columnName}")]]`)
      .api.globals.wait_for_no_spinners(browser);
    return this.useCss()
        .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
        .click('div.mat-dialog-actions button.mat-primary')
        .waitForElementNotPresent('iri-template-overlay');
  },

  addPropertyMapping: function(propertyName, columnName) {
    this.useCss()
      .waitForElementVisible(editorFormSelector)
      .waitForElementVisible('div.properties-field-name button.add-prop-mapping-button')
      .click('div.properties-field-name button.add-prop-mapping-button')
      .waitForElementVisible('prop-mapping-overlay')
      .waitForElementVisible('prop-mapping-overlay prop-select') // Should be opened by default
      .setValue('prop-mapping-overlay prop-select input', propertyName)
      .pause(2000) // Wait for REST call to finish
      .click('xpath', `//div//mat-option//span[contains(text(), "${propertyName}")]`)
      .waitForElementNotVisible('#spinner-local')
    if (columnName) {
      this.useCss()
        .click('form.mat-dialog-content column-select mat-select')
        .waitForElementVisible('div.mat-select-panel')
        .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
        .click('xpath', `//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "${columnName}")]]`)
        .waitForElementNotVisible('#spinner-local');
    } else {
      this.useCss()
        .click('form.mat-dialog-content mat-form-field.range-class-select-container mat-select')
        .waitForElementVisible('div.mat-select-panel')
        .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
        .click('xpath', '//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "New")]]')
        .waitForElementNotVisible('#spinner-local');
      }
    return this.useCss()
        .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
        .click('div.mat-dialog-actions button.mat-primary')
        .waitForElementNotPresent('prop-mapping-overlay');
  },

  assertPropertyMappingVisible: function(propertyName) {
    return this.useCss()
      .waitForElementVisible(editorFormSelector)
      .useXpath()
      .assert.visible(`//class-mapping-details//mat-list-item//h4[text()[contains(., "${propertyName}")]]`);
  },

  switchClassMapping: function(className) {
    return this.useCss()
      .waitForElementVisible(editorFormSelector)
      .waitForElementVisible(classMappingSelectSelector)
      .click(classMappingSelectSelector)
      .clearValue(classMappingSelectInputSelector)
      .setValue(classMappingSelectInputSelector, 'crystal')
      .useXpath()
      .waitForElementVisible(`//mat-option//span[contains(text(), "${className}")]`)
      .click('xpath', `//div//mat-option//span[contains(text(), "${className}")]`);
  },

  commitToOntology: function(ontologyName, asUpdates) {
    this.useCss()
        .waitForElementVisible('edit-mapping-tab .button-container .drop-down-button')
        .click('edit-mapping-tab .button-container .drop-down-button')
        .waitForElementVisible('div.mat-menu-content button.mat-menu-item.run-ontology')
        .click('div.mat-menu-content button.mat-menu-item.run-ontology')
        .waitForElementVisible('run-mapping-ontology-overlay')
        .waitForElementVisible('run-mapping-ontology-overlay .ontology-select')
        .click('xpath', `//div//mat-option//span[contains(text(), "${ontologyName}")]`);
    if (asUpdates) {
      this.click('xpath', '//run-mapping-ontology-overlay//mat-radio-group/mat-radio-button[2]//span[contains(text(), "Commit as updates")]');
    }
    return this.useCss()
        .waitForElementVisible('xpath', '//button/span[text() [contains(., "Submit")]]')
        .click('xpath', '//button/span[text() [contains(., "Submit")]]')
        .waitForElementNotPresent('run-mapping-ontology-overlay');
  },
  
  uploadToDataset: function(datasetName) {
    this.useCss()
      .waitForElementVisible('edit-mapping-tab .button-container .drop-down-button')
      .click('edit-mapping-tab .button-container .drop-down-button')
      .waitForElementVisible('div.mat-menu-content button.mat-menu-item.run-dataset')
      .click('div.mat-menu-content button.mat-menu-item.run-dataset')
      .waitForElementVisible('run-mapping-dataset-overlay')
      .waitForElementVisible('run-mapping-dataset-overlay input[aria-label="Dataset"]')
      .click('form.mat-dialog-content mat-form-field')
      .click('xpath', `//div//mat-option//span[contains(text(), "${datasetName}")]`)
      .expect.element('run-mapping-dataset-overlay div.mat-dialog-actions button.mat-primary').to.not.have.attribute('disabled', 'Testing if submit does not contain disabled attribute');
  return this.useCss()
      .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled')
      .click('div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('run-mapping-dataset-overlay');
  }
}

module.exports = {
  elements: {
    classMappingSelect: classMappingSelectSelector,
    classMappingSelectInput: classMappingSelectInputSelector
  },
  commands: [mapperCommands]
}
