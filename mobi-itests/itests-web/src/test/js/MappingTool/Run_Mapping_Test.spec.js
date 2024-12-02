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
var path = require('path');
var adminUsername = 'admin'
var adminPassword = 'admin'
var OntoSample = path.resolve(__dirname + '/../../resources/rdf_files/uhtc-ontology.ttl');
var skosOnt = path.resolve(__dirname + '/../../resources/rdf_files/skos.rdf');
var OntoCSV = path.resolve(__dirname + '/../../resources/ontology_csv\'s/uhtc-compounds.csv');

module.exports = {
    '@tags': ['mapping-tool', 'datasets', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        [OntoSample, skosOnt].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 3: Link ontologies' : function(browser) {
        browser.page.ontologyEditorPage().openOntology('uhtc-ontology');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().addServerImport('skos');
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 4: Navigate to datasets tab' : function(browser) {
        browser.globals.switchToPage(browser, 'datasets', 'datasets-page');
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 5: Create a new Dataset' : function(browser) {
        browser.page.datasetPage().createDataset('UHTC ontology data', 'A dataset consisting of information recorded on various earthly materials', ['uhtc-ontology']);
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 6: Validate dataset Appearance' : function(browser) {
        browser
            .waitForElementPresent('datasets-list')
            .waitForElementPresent('div.dataset-info')
            .useXpath()
            .assert.visible('//div[contains(@class, "dataset-info")]//div//h3[text()[contains(.,"UHTC ontology data")]]')
            .useCss()
    },

    'Step 7: Navigate to Mapping page' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.switchToPage(browser, 'mapper', 'mapper-page')
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 8: Create new mapping' : function(browser) {
        browser
            .click('button.new-button')
            .waitForElementVisible('create-mapping-overlay')
            .waitForElementVisible('create-mapping-overlay input[name="title"]')
            .setValue('form.mat-dialog-content input[name=title]', "UHTC material Mapping")
            .setValue('form.mat-dialog-content textarea', "A mapping of materials listed in the UHTC csv file to the UHTC ontology")
            .click('div.mat-dialog-actions button.mat-primary')
    },

    'Step 9: Attach csv to mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('div.file-input button')
            .uploadFile('input[type=file]', OntoCSV)
            .waitForElementNotPresent('#spinner-full')
            .click('button.continue-btn')
    },

    'Step 10: Click on uploaded ontology' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementNotPresent('#spinner-full')
            .waitForElementVisible('mapping-config-overlay')
            .waitForElementNotPresent('#spinner-full')
            .setValue('div.mat-dialog-content input[data-placeholder="Search..."]', 'uhtc')
            .keys(browser.Keys.ENTER)
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//mat-list-option//h4[text()[contains(.,"uhtc")]]'})
            .click('xpath', '//mat-list-option//h4[text()[contains(.,"uhtc")]]')
            .waitForElementNotPresent('#spinner-full')
            .waitForElementVisible('div.mat-dialog-actions button.mat-primary:enabled', 15000, 'Element %s is disabled after %d ms')
            .click('div.mat-dialog-actions button.mat-primary')

    },

    'Step 11: Add class to mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementVisible('edit-mapping-tab .editor-form')
            .click('div.class-mappings button.add-class-mapping-button')
            .waitForElementVisible('class-mapping-overlay')
            .waitForElementVisible('class-mapping-overlay class-select')
            .click('form.mat-dialog-content class-select')
            .click('xpath', '//div//mat-option//span[contains(text(), "Material")]')
            .useXpath()
            .click("//button/span[text() [contains(., 'Submit')]]")
            .waitForElementNotPresent('class-mapping-overlay')
            .useCss()
    },

    'Step 12: Verify Mapping has been selected' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .assert.valueEquals('edit-mapping-tab class-mapping-select input', 'UHTC Material')
    },

    'Step 13: Choose new IRI template' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('.iri-template .field-label button.mat-primary')
            .waitForElementVisible('iri-template-overlay')
            .waitForElementVisible('iri-template-overlay mat-form-field.template-ends-with mat-select')
            .click('form.mat-dialog-content mat-form-field.template-ends-with mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Material")]]')
            .waitForElementNotPresent('#spinner-full')
            .click('div.mat-dialog-actions button.mat-primary')
    },

    'Step 14: Add Property Mappings and verify addition' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        var properties = ["Chemical Formula", "Density", "Melting Point", "Title", "Description", "No Domain", "Union Domain"]

        for (var i = 0 ; i < properties.length; i++)
        {
                browser.globals.wait_for_no_spinners(browser)
                browser.click('div.properties-field-name button.add-prop-mapping-button')
                browser.waitForElementVisible('prop-mapping-overlay')
                browser.waitForElementVisible('prop-mapping-overlay prop-select')
                browser.click('form.mat-dialog-content prop-select')
                browser.click('xpath', '//div//mat-option//span[contains(text(), "' + properties[i] + '")]')
                browser.click('form.mat-dialog-content column-select mat-select')
                browser.waitForElementVisible('div.mat-select-panel')
                browser.waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')

                switch (properties[i]) {
                    case "Chemical Formula":
                        browser.click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Source")]]')
                        break;
                    case "Melting Point":
                        browser.click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Melting point") and contains(., "C")]]')
                        break;
                    case "No Domain":
                        browser.click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Source")]]')
                        break;
                    case "Union Domain":
                        browser.click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Source")]]')
                        break;
                    default:
                        browser.click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "' + properties[i] + '")]]')
                        break;
                }
                browser.waitForElementNotPresent('#spinner-full');
                browser.click('div.mat-dialog-actions button.mat-primary');
                browser.globals.wait_for_no_spinners(browser);
                browser.useXpath();
                browser.assert.visible('//class-mapping-details//mat-list-item//h4[text()[contains(., "' + properties[i] + '")]]');
                browser.useCss()
        }
    },

    'Step 15: Verify Edit Property modal auto selects correct property' : function(browser){
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('xpath', '//mat-list[contains(@class, "prop-list")]//h4[text()="Chemical Formula"]//parent::div/following-sibling::div[contains(@class, "prop-actions")]//button[contains(@class, "menu-button")]')
            .waitForElementVisible('div.mat-menu-content button.mat-menu-item.edit')
            .click('div.mat-menu-content button.mat-menu-item.edit')
            .waitForElementVisible('prop-mapping-overlay')
            .waitForElementVisible('prop-mapping-overlay prop-select')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//h1[contains(@class, "mat-dialog-title")][text()="Edit Property"]'})
            .assert.valueEquals('form.mat-dialog-content prop-select input', 'Chemical Formula')
            .click('div.mat-dialog-actions button:not([color="primary"])')
    },

    'Step 16: Add Crystal Structure Mapping' : function(browser){
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('div.properties-field-name button.add-prop-mapping-button')
            .waitForElementVisible('prop-mapping-overlay')
            .waitForElementVisible('prop-mapping-overlay prop-select')
            .click('form.mat-dialog-content prop-select')
            .click('xpath', '//div//mat-option//span[contains(text(), "Crystal Structure")]')
            .click('form.mat-dialog-content mat-form-field.range-class-select-container mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "New Crystal Structure")]]')
            .waitForElementNotPresent('#spinner-full')
            .click('div.mat-dialog-actions button.mat-primary')
    },

    'Step 17: Verify Crystal Class addition' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useXpath()
            .assert.visible('//class-mapping-details//mat-list-item//h4[text()[contains(., "Crystal")]]')
            .useCss()
    },

    'Step 18: Switch to crystal structure class' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('edit-mapping-tab class-mapping-select')
            .clearValue('edit-mapping-tab class-mapping-select input')
            .setValue('edit-mapping-tab class-mapping-select input', 'crystal')
            .useXpath()
            .waitForElementVisible('//mat-option//span[contains(text(), "Crystal Structure")]')
            .click('xpath', '//div//mat-option//span[contains(text(), "Crystal Structure")]')
            .useCss()
    },

    'Step 19: Add crystal structure name property' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('div.properties-field-name button.add-prop-mapping-button')
            .waitForElementVisible('prop-mapping-overlay')
            .waitForElementVisible('prop-mapping-overlay prop-select')
            .click('form.mat-dialog-content prop-select')
            .click('xpath', '//div//mat-option//span[contains(text(), "Crystal Structure")]')
            .click('form.mat-dialog-content column-select mat-select')
            .waitForElementVisible('div.mat-select-panel')
            .waitForElementVisible('xpath','//div[contains(@class, "mat-select-panel")]//mat-option')
            .click('xpath','//div[contains(@class, "mat-select-panel")]//mat-option//span[contains(@class,"mat-option-text")][text()[contains(., "Crystal")]]')
            .waitForElementNotPresent('#spinner-full')
            .click('div.mat-dialog-actions button.mat-primary')
    },

    'Step 20: Verify visibility of crystal structure name property' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useXpath()
            .assert.visible('//class-mapping-details//mat-list-item//h4[text()[contains(., "Crystal")]]')
            .useCss()
    },

    'Step 21: Save Mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('edit-mapping-tab .button-container .drop-down-button')
    },

    'Step 22: Upload mapping to dataset' : function(browser) {
        browser
            .waitForElementVisible('div.mat-menu-content button.mat-menu-item.run-dataset')
            .click('div.mat-menu-content button.mat-menu-item.run-dataset')
            .waitForElementVisible('run-mapping-dataset-overlay')
            .waitForElementVisible('run-mapping-dataset-overlay input[aria-label="Dataset"]')
            .click('form.mat-dialog-content mat-form-field')
            .click('xpath', '//div//mat-option//span[contains(text(), "UHTC")]')
            .expect.element('run-mapping-dataset-overlay div.mat-dialog-actions button.mat-primary').to.not.have.attribute('disabled', 'Testing if submit does not contain disabled attribute');
        browser.click('div.mat-dialog-actions button.mat-primary')
    },

    'Step 23: Verify user is back on main mapping page' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .assert.visible('mapping-select-page')
    },

    'Step 24: Explore dataset mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.switchToPage(browser, 'discover', 'discover-page');
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('dataset-select mat-form-field')
            .waitForElementVisible('dataset-select mat-form-field')
            .useXpath()
            .waitForElementVisible('//span[text()[contains(.,"UHTC")]]')
            .click('//span[text()[contains(.,"UHTC")]]')
            .useCss()
    },

    'Step 25: Check for Material and Crystal structure cards' : function(browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useXpath()
            .assert.visible('//mat-card//mat-card-title//span[text()[contains(., "Crystal Structure")]]')
            .assert.visible('//mat-card//mat-card-title//span[text()[contains(., "UHTC Material")]]')
    },
    // Adding entity search test below
    // since this test doesn't have a page object
    'Step 26: Perform a new entity search for the mapping': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.waitForElementVisible('app-entity-search-page')
            .page.entitySearchPage().clearEntitySearchBar();
        browser.page.entitySearchPage().applySearchText('Density');
        browser.useCss()
            .waitForElementVisible('app-entity-search-page app-search-results-list mat-card-title')
    },
    'Step 27: Open Mapping from entity search result' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().openRecordItem('Density', 'UHTC material Mapping');
        browser.globals.wait_for_no_spinners(browser);
        browser.assert.not.elementPresent('app-entity-search-page app-search-results-list open-record-button button');
        browser.waitForElementVisible('mapping-select-page .mapping-info')
            .assert.textContains('mapping-select-page .mapping-info h3', 'UHTC material Mapping');
    }
}
