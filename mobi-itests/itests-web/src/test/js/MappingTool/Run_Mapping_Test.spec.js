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
var skosOnt = path.resolve(__dirname + '/../../resources/rdf_files/skos.rdf');
var OntoCSV = path.resolve(__dirname + '/../../resources/ontology_csv\'s/uhtc-compounds.csv');

module.exports = {
    '@tags': ['mapping-tool', 'mapping-tool-dataset', 'datasets', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
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
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 4: Navigate to datasets tab' : function(browser) {
        browser.globals.switchToPage(browser, 'datasets', 'datasets-page');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 5: Create a new Dataset' : function(browser) {
        browser.page.datasetPage().createDataset('UHTC ontology data', 'A dataset consisting of information recorded on various earthly materials', ['uhtc-ontology']);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 6: Validate dataset Appearance' : function(browser) {
        browser
            .waitForElementVisible('datasets-list')
            .waitForElementVisible('div.dataset-info')
            .useXpath()
            .assert.visible('//div[contains(@class, "dataset-info")]//div//h3[text()[contains(.,"UHTC ontology data")]]')
            .useCss();
    },

    'Step 7: Navigate to Mapping page' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'mapper', 'mapping-select-page');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 8: Create new mapping' : function(browser) {
        browser.page.mapperPage().createMapping('UHTC material Mapping', 'A mapping of materials listed in the UHTC csv file to the UHTC ontology');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Attach csv to mapping' : function(browser) {
        browser.page.mapperPage().selectDataFile(OntoCSV);
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 10: Click on uploaded ontology' : function(browser) {
        browser.page.mapperPage().selectOntology('uhtc');
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 11: Add class to mapping' : function(browser) {
        browser.page.mapperPage().addClassMapping('Material');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 12: Verify Class Mapping has been selected' : function(browser) {
        browser.page.mapperPage()
            .assert.valueEquals('@classMappingSelectInput', 'UHTC Material');
    },

    'Step 13: Choose new IRI template' : function(browser) {
        browser.page.mapperPage().setIRITemplateLocalName('Material');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 14: Add Property Mappings and verify addition' : function(browser) {
        var properties = [
            { property: 'Chemical Formula', column: 'Material'},
            { property: 'Density', column: 'Density' },
            { property: 'Melting Point', column: 'Melting Point C'},
            { property: 'Title', column: 'Title' },
            { property: 'Description', column: 'Description' },
            { property: 'No Domain', column: 'Source' },
            { property: 'Union Domain', column: 'Source' }
        ];

        for (var i = 0 ; i < properties.length; i++) {
            browser.page.mapperPage().addPropertyMapping(properties[i].property, properties[1].column);
            browser.globals.wait_for_no_spinners(browser);
            browser.page.mapperPage().assertPropertyMappingVisible(properties[i].property);
        }
    },

    'Step 15: Verify Edit Property modal auto selects correct property' : function(browser){
        browser.useCss()
            .click('xpath', '//mat-list[contains(@class, "prop-list")]//h4[text()="Chemical Formula"]//parent::div/following-sibling::div[contains(@class, "prop-actions")]//button[contains(@class, "menu-button")]')
            .waitForElementVisible('div.mat-menu-content button.mat-menu-item.edit')
            .click('div.mat-menu-content button.mat-menu-item.edit') // TODO: Keeps getting click intercepted by cdk-overlay-pane
            .waitForElementVisible('prop-mapping-overlay')
            .waitForElementVisible('prop-mapping-overlay prop-select')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//h1[contains(@class, "mat-dialog-title")][text()="Edit Property"]'})
            .assert.valueEquals('form.mat-dialog-content prop-select input', 'Chemical Formula')
            .click('div.mat-dialog-actions button:not([color="primary"])');
    },

    'Step 16: Add Crystal Structure Mapping' : function(browser){
        browser.globals.wait_for_no_spinners(browser);
        browser.page.mapperPage().addPropertyMapping('Crystal Structure');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 17: Verify Crystal Class addition' : function(browser) {
        browser.page.mapperPage().assertPropertyMappingVisible('Crystal');
    },

    'Step 18: Switch to crystal structure class' : function(browser) {
        browser.page.mapperPage().switchClassMapping('Crystal Structure');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 19: Add crystal structure name property' : function(browser) {
        browser.page.mapperPage().addPropertyMapping('Crystal Structure', 'Crystal');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 20: Verify visibility of crystal structure name property' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .assert.visible('//class-mapping-details//mat-list-item//h4[text()[contains(., "Crystal")]]')
            .useCss();
    },

    'Step 21: Save Mapping and Upload to Dataset' : function(browser) {
        browser.page.mapperPage().uploadToDataset('UHTC');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 22: Verify user is back on main mapping page' : function(browser) {
        browser
            .assert.visible('mapping-select-page');
    },

    'Step 23: Explore dataset mapping' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.switchToPage(browser, 'discover', 'discover-page');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .click('dataset-select mat-form-field')
            .waitForElementVisible('dataset-select mat-form-field')
            .useXpath()
            .waitForElementVisible('//span[text()[contains(.,"UHTC")]]')
            .click('//span[text()[contains(.,"UHTC")]]')
            .useCss();
    },

    'Step 24: Check for Material and Crystal structure cards' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .assert.visible('//mat-card//mat-card-title//span[text()[contains(., "Crystal Structure")]]')
            .assert.visible('//mat-card//mat-card-title//span[text()[contains(., "UHTC Material")]]');
    },
    // Adding entity search test below
    // since this test doesn't have a page object
    'Step 25: Perform a new entity search for the mapping': function (browser) {
        browser.globals.switchToPage(browser, 'entity-search', 'app-entity-search-page');
        browser.waitForElementVisible('app-entity-search-page');
        browser.page.entitySearchPage().clearEntitySearchBar();
        browser.page.entitySearchPage().toggleFilterItem('Record Type', 'Mapping Record');
        browser.page.entitySearchPage().applySearchText('Density');
        browser.useCss()
            .waitForElementVisible('app-entity-search-page app-search-results-list mat-card-title');
    },

    'Step 26: Open Mapping from entity search result' : function(browser) {
        browser.globals.wait_for_no_spinners(browser);
        browser.page.entitySearchPage().openRecordItem('Density', 'UHTC material Mapping');
        browser.globals.wait_for_no_spinners(browser);
        browser.assert.not.elementPresent('app-entity-search-page app-search-results-list');
        browser
            .waitForElementVisible('mapping-select-page .mapping-info') 
            .assert.textContains('mapping-select-page .mapping-info h3', 'UHTC material Mapping');
    }
}
