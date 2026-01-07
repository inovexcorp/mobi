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
var path = require('path');
var OntoSample = path.resolve(__dirname + '/../../resources/rdf_files/uhtc-ontology.ttl');
var OntoCSV = path.resolve(__dirname + '/../../resources/ontology_csv\'s/uhtc-compounds.csv');
var cdkOverlay = '//div[contains(@class, "cdk-overlay-container")]';
var datatypeContainer = '//prop-mapping-overlay//div[contains(@class, "datatype-select-container")]';

module.exports = {
  '@tags': ['mapping-tool', 'mapping-tool-edit', 'sanity'],

  'Step 1: Initial Setup' : function(browser) {
    browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
    browser.page.ontologyEditorPage().uploadOntology(OntoSample);
    browser.globals.wait_for_no_spinners(browser);
    browser.globals.dismiss_toast(browser);
  },

  'Step 2: Navigate to Mapping page' : function(browser) {
    browser.globals.wait_for_no_spinners(browser);
    browser.globals.switchToPage(browser, 'mapper', 'mapping-select-page');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 3: Create new mapping' : function(browser) {
    browser.page.mapperPage().createMapping('UHTC material Mapping', 'A mapping of materials listed in the UHTC csv file to the UHTC ontology');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 4: Attach csv to mapping' : function(browser) {
    browser.page.mapperPage().selectDataFile(OntoCSV);
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 5: Click on uploaded ontology' : function(browser) {
    browser.page.mapperPage().selectOntology('uhtc');
    browser.globals.wait_for_no_spinners(browser)
  },

  'Step 6: Add class to mapping' : function(browser) {
    browser.page.mapperPage().addClassMapping('Material');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 7: Verify Class Mapping has been selected' : function(browser) {
    browser.page.mapperPage()
      .assert.valueEquals('@classMappingSelectInput', 'UHTC Material');
  },

  'Step 8: Choose new IRI template' : function(browser) {
    browser.page.mapperPage().setIRITemplateLocalName('Material');
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 9: Add Property Mappings and verify addition' : function(browser) {
    browser.page.mapperPage().addPropertyMapping('Density', 'Density');
    browser.globals.wait_for_no_spinners(browser);
    browser.page.mapperPage().assertPropertyMappingVisible('Density');
  },

  'Step 10: Edit property to have datatype override' : function(browser) {
    browser
      .useCss()
      .click('edit-mapping-tab class-mapping-details mat-list-item mat-icon')
      .useXpath()
      .click(cdkOverlay + '//button[text()[contains(., "Edit")]]')
      .waitForElementVisible('css selector', 'prop-mapping-overlay form column-select')
      .click(datatypeContainer + '//span[text()[contains(., "Override Datatype")]]')
      .waitForElementVisible(datatypeContainer + '//mat-form-field//input')
      .click(datatypeContainer + '//mat-form-field//input')
      .clearValue(datatypeContainer + '//mat-form-field//input')
      .sendKeys(datatypeContainer + '//mat-form-field//input', 'String')
      .click(cdkOverlay + '//mat-option//span[text()=" String "]')
      .click(cdkOverlay + '//button//span[text()[contains(., "Submit")]]')
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 11: Save changes and reopen mapping' : function(browser) {
    var saveButton = '//edit-mapping-tab//div[contains(@class, "button-container")]//mat-button-toggle//span[text()="Save"]';
    var editButton = cdkOverlay + '//button[text()[contains(., "Edit")]]'

    browser
      .useXpath()
      .waitForElementVisible(saveButton)
      .click(saveButton)
    browser.globals.wait_for_no_spinners(browser);
    browser
      .click('mapper-page mapping-select-page button mat-icon')
      .useXpath()
      .waitForElementVisible(editButton)
      .click(editButton)
    browser.globals.wait_for_no_spinners(browser);
    browser.page.mapperPage().selectDataFile(OntoCSV);
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 12: Verify re-opened appearance' : function(browser) {
    browser
      .waitForElementVisible('edit-mapping-tab class-mapping-select')
      .click('edit-mapping-tab class-mapping-select')
      .useXpath()
      .click(cdkOverlay + '//mat-option//span[text()="UHTC Material"]')
    browser.page.mapperPage().assert.valueEquals('@classMappingSelectInput', 'UHTC Material');
    browser.page.mapperPage().assertPropertyMappingVisible('Density');
    browser
      .useXpath()
      .assert.visible('//class-mapping-details//mat-list-item//span[text()="Datatype: "]/ancestor::div[text()="String"]');
  },

  'Step 13: Remove Overridden datatype' : function(browser) {
    browser
      .useCss()
      .click('edit-mapping-tab class-mapping-details mat-list-item mat-icon')
      .useXpath()
      .click(cdkOverlay + '//button[text()[contains(., "Edit")]]')
      .waitForElementVisible('css selector', 'prop-mapping-overlay form column-select')
      .click(datatypeContainer + '//span[text()[contains(., "Remove Datatype Override")]]')
      .click(cdkOverlay + '//button//span[text()[contains(., "Submit")]]')
  },

  'Step 14: Verify removed datatype in list' : function(browser) {
    browser.page.mapperPage().assert.valueEquals('@classMappingSelectInput', 'UHTC Material');
    browser.page.mapperPage().assertPropertyMappingVisible('Density');
    browser
      .useXpath()
      .assert.visible('//class-mapping-details//mat-list-item//span[text()="Datatype: "]/ancestor::div[text()="Double"]');
  },

  'Step 15: Save changes and reopen mapping' : function(browser) {
    var saveButton = '//edit-mapping-tab//div[contains(@class, "button-container")]//mat-button-toggle//span[text()="Save"]';
    var editButton = cdkOverlay + '//button[text()[contains(., "Edit")]]'

    browser
      .useXpath()
      .waitForElementVisible(saveButton)
      .click(saveButton)
    browser.globals.wait_for_no_spinners(browser);
    browser
      .click('mapper-page mapping-select-page button mat-icon')
      .useXpath()
      .waitForElementVisible(editButton)
      .click(editButton)
    browser.globals.wait_for_no_spinners(browser);
    browser.page.mapperPage().selectDataFile(OntoCSV);
    browser.globals.wait_for_no_spinners(browser);
  },

  'Step 16: Verify datatype is still correct in list' : function(browser) {
    browser
      .waitForElementVisible('edit-mapping-tab class-mapping-select')
      .click('edit-mapping-tab class-mapping-select')
      .useXpath()
      .click(cdkOverlay + '//mat-option//span[text()="UHTC Material"]')
    browser.page.mapperPage().assert.valueEquals('@classMappingSelectInput', 'UHTC Material');
    browser.page.mapperPage().assertPropertyMappingVisible('Density');
    browser
      .useXpath()
      .assert.visible('//class-mapping-details//mat-list-item//span[text()="Datatype: "]/ancestor::div[text()="Double"]');
  },
}
