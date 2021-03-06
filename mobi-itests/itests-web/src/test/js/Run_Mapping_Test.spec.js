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
var OntoSample = process.cwd()+ '/src/test/resources/ontologies/uhtc-ontology.ttl'
var OntoCSV= process.cwd()+ '/src/test/resources/ontology_csv\'s/uhtc-compounds.csv'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, OntoSample)
    },

    'Step 3: Navigate to datasets tab' : function (browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/datasets"]')
    },

    'Step 4: Create a new Dataset' : function (browser) {
        browser
            .waitForElementNotPresent('div.spinner')
            .click('div.datasets-tabset button.btn-primary')
            .waitForElementVisible('new-dataset-overlay')
            .setValue('div.form-group input[name=title]', 'UHTC ontology data')
            .setValue('div.form-group textarea.form-control', 'A dataset consisting of information recorded on various earthly materials')
            .click('xpath', '//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"uhtc-ontology.ttl")]]//ancestor::md-list-item//md-checkbox')
            .waitForElementNotPresent('div.spinner')
            .click('div.modal-footer button.btn-primary')
    },

    'Step 5: Validate dataset Appearance' : function (browser) {
        browser
            .useXpath()
            .assert.visible('//div[contains(@class, "dataset-info")]//h3[text()[contains(.,"UHTC ontology data")]]')
            .useCss()
    },

    'Step 6: Navigate to Mapping page' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/mapper"]')
    },

    'Step 7: Create new mapping' : function (browser) {
        browser
            .click('block-header button.btn')
            .setValue('div.form-group input[name=title]', "UHTC material Mapping")
            .setValue('div.form-group.text-area textarea.form-control', "A mapping of materials listed in the UHTC csv file to the UHTC ontology")
            .click('div.modal-footer button.btn-primary')
    },

    'Step 8: Attach csv to mapping' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('div.file-input button.btn-light')
            .setValue('input.hide[type=file]', OntoCSV)
            .waitForElementNotPresent('div.spinner')
            .click('div.block-footer button.continue-btn')
    },

    'Step 9: Click on uploaded ontology' : function (browser) {
        browser
            .waitForElementNotPresent('div.spinner')
            .waitForElementVisible('mapping-config-overlay')
            .waitForElementNotPresent('div.spinner')
            .setValue('mapping-config-overlay search-bar input', 'uhtc')
            .keys(browser.Keys.ENTER)
            .useXpath()
            .waitForElementVisible('//md-list-item//h4//span[text()[contains(.,"uhtc")]]')
            .click('//md-list-item//h4//span[text()[contains(.,"uhtc")]]')
            .useCss()
            .waitForElementNotPresent('div.spinner')
            .click('button.btn-primary')
    },

    'Step 10: Add class to mapping' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .waitForElementVisible('form.edit-mapping-form')
            .waitForElementNotPresent('span.ui-select-choices-row-inner.uis-transclude-append')
            .click('div.class-mappings button.btn-link')
            .click('div.ui-select-match  span.btn')
            .click('div[title="http://matonto.org/ontologies/uhtc#Material"]')
            .click('button.btn-primary')
    },

    'Step 11: Verify Mapping has been selected' : function (browser) {
        browser
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "ui-select-match")]//span[text()[contains(., "UHTC Material")]]'})
    },

    'Step 12: Choose new IRI template' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('label.control-label button.btn.btn-link')
            .setValue('div.modal-body select#endsWith', 'Material')
            .click('div.modal-footer button.btn-primary')
    },

    'Step 13: Add Property Mappings and verify addition' : function (browser) {
        var properties = ["Chemical Formula", "Density", "Melting Point", "Title", "Description"]

        for (var i = 0 ; i < properties.length; i++)
        {
                browser.waitForElementNotPresent('div.modal.fade')
                browser.click('div.properties-field-name button.btn.btn-link')
                browser.click('div.ui-select-match span.ui-select-toggle')
                browser.click('xpath', '//ul[contains(@class, "ui-select-choices")]//div[contains(@class, "ui-select-choices-row")]//span[text()[contains(., "' + properties[i] + '")]]')
                browser.click('div.column-select')

                switch (properties[i]){
                case "Chemical Formula":
                    browser.click('xpath', '//span[contains(@class, "ui-select-choices-row-inner")]//div[text()[contains(., "Source")]]')
                    break;
                case "Melting Point":
                    browser.click('xpath', '//span[contains(@class, "ui-select-choices-row-inner")]//div[text()[contains(., "Melting point (ÎçC)")]]')
                    break;

                    default:
                        browser.click('xpath', '//span[contains(@class, "ui-select-choices-row-inner")]//div[text()[contains(., "' + properties[i] + '")]]')
                        break;
                }
                browser.click('div.modal-footer button.btn-primary')
                browser.waitForElementNotPresent('div.modal.fade')
                browser.useXpath()
                browser.assert.visible('//div[contains(@class, "list-group-item")]//h4[text()[contains(., "' + properties[i] + '")]]')
                browser.useCss()
        }
    },

    'Step 14: Verify Edit Property modal auto selects correct property' : function (browser){
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('xpath', '//div[contains(@class, "prop-list")]//h4[text()="Chemical Formula"]/preceding-sibling::div[contains(@class, "prop-actions")]/a[contains(@class, "edit-prop")]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "modal-header")]/h3[text()="Edit Property"]'})
            .useXpath()
            .assert.containsText('//prop-mapping-overlay//prop-select//span[contains(@class, "ui-select-match-text")]', 'Chemical Formula')
            .useCss()
            .getAttribute('.prop-select .ui-select-container', 'disabled', function(result) {this.assert.equal(result.value, 'true');})
            .click('xpath', '//div[contains(@class, "modal-footer")]/button[text()="Cancel"]')
    },

    'Step 15: Add Crystal Mapping' : function (browser){
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('div.properties-field-name button.btn.btn-link')
            .click('div.ui-select-match span.ui-select-toggle')
            .click('xpath', '//ul[contains(@class, "ui-select-choices")]//div[contains(@class, "ui-select-choices-row")]//span[text()[contains(., "Crystal Structure")]]')
            .click('div.range-class-select-container')
            .click('xpath', '//ul[contains(@class, "ui-select-choices")]//span[text()[contains(., "New Crystal Structure")]]')
            .click('div.modal-footer button.btn-primary')
    },

    'Step 16: Verify Crystal Class addition' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group-item")]//h4[text()[contains(., "Crystal")]]')
            .useCss()
    },

    'Step 17: Switch to crystal structure class' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('div.ui-select-match span.form-control')
            .click('xpath', '//span[@class="ui-select-choices-row-inner"]//span[text()[contains(., "Crystal Structure")]]')
    },

    'Step 18: Add crystal structure name property' : function (browser) {
        browser
            .click('div.properties-field-name button.btn.btn-link')
            .click('div.ui-select-match span.ui-select-toggle')
            .click('xpath', '//ul[contains(@class, "ui-select-choices")]//div[contains(@class, "ui-select-choices-row")]//span[text()[contains(., "Crystal Structure Name")]]')
            .click('div.column-select')
            .click('xpath', '//span[contains(@class, "ui-select-choices-row-inner")]//div[text()[contains(., "Crystal")]]')
            .click('div.modal-footer button.btn-primary')
    },

    'Step 19: Verify visibility of crystal structure name property' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .useXpath()
            .assert.visible('//div[contains(@class, "list-group-item")]//h4[text()[contains(., "Crystal")]]')
            .useCss()
    },

    'Step 20: Save Mapping' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('button.btn.dropdown-toggle')
    },

    'Step 21: Upload mapping to dataset' : function (browser) {
        browser
            .click('button.run-dataset')
            .click('div.ui-select-container')
            .click('xpath' ,'//ul[contains(@class, "ui-select-choices")]//div[text()[contains(., "UHTC")]]')
            .expect.element('run-mapping-dataset-overlay div.modal-footer button.btn-primary').to.not.have.attribute('disabled', 'Testing if submit does not contain disabled attribute');
            browser.click('div.modal-footer button.btn-primary')
    },

    'Step 22: Verify user is back on main mapping page' : function (browser) {
        browser
            .assert.visible('p.lead')
    },

    'Step 23: Explore dataset mapping' : function (browser) {
        browser
            .waitForElementNotPresent('div.modal.fade')
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/discover"]')
            .click('div.ui-select-match')
            .click('xpath' ,'//ul[contains(@class, "ui-select-choices")]//div[text()[contains(., "UHTC")]]')
    },

    'Step 24: Check for Material and Crystal structure cards' : function (browser) {
        browser
            .useXpath()
            .assert.visible('//md-card//md-card-title//span[text()[contains(., "Crystal Structure")]]')
            .assert.visible('//md-card//md-card-title//span[text()[contains(., "UHTC Material")]]')
    }
}