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
var adminUsername = 'admin';
var adminPassword = 'admin';
var Onto1 = process.cwd() + '/src/test/resources/rdf_files/test-local-imports-1.ttl';
var Onto1eName = 'test-local-imports-1e.ttl';
var Onto1e = process.cwd() + '/src/test/resources/rdf_files/' + Onto1eName; // has syntax issue
var Onto1sName = 'test-local-imports-1s.ttl';
var Onto1s = process.cwd() + '/src/test/resources/rdf_files/' + Onto1sName; // same as test-local-imports-1
var Onto1TrigName = 'test-local-imports-1s.trig';
var Onto1Trig = process.cwd() + '/src/test/resources/rdf_files/' + Onto1TrigName;
var Onto1TrigZipName = 'test-local-imports-1s.trig.zip';
var Onto1TrigZip = process.cwd() + '/src/test/resources/rdf_files/' + Onto1TrigZipName;
var Onto2 = process.cwd() + '/src/test/resources/rdf_files/test-local-imports-2.ttl';
var Onto3 = process.cwd() + '/src/test/resources/rdf_files/test-local-imports-3.ttl';
var Onto4 = process.cwd() + '/src/test/resources/rdf_files/unresolvableImport.owl'; // OWL Files Processed Differently
var Onto5 = process.cwd() + '/src/test/resources/rdf_files/test-class-empty-label.ttl'; // Class has empty string for label

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        [Onto5, Onto4, Onto3, Onto2, Onto1].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
        });
    },

    'Step 3: Upload Corrupt Ontologies' : function(browser) {
        [Onto1e, Onto1s, Onto1TrigZip, Onto1Trig].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
        });
    },

    'Step 4: Validate Ontology Upload Logs': function(browser) {
        var errorOnts = [Onto1eName, Onto1sName].map(function(name) { return name.replace(/\.[^/.]+$/, "") });
        errorOnts.forEach(function(name) {
            browser.page.ontologyEditorPage().searchForOntology(name);
            browser.globals.wait_for_no_spinners(browser);
            browser.useXpath()
                .assert.not.elementPresent('//mat-optgroup//mat-option//span[text()[contains(., "' + name + '")]]/ancestor::mat-option')
        });
        browser.page.ontologyEditorPage().openUploadRecordLog();
        errorOnts.forEach(function(name) {
            browser.useXpath()
                .assert.visible('//div[contains(@class, "upload-menu")]//div[contains(@class, "item-details")]//h4[text()[contains(., "' + name + '")]]/following-sibling::p[contains(@class, "text-danger")]')
        });
        browser.useCss()
            .click('.cdk-overlay-backdrop') // Close the log menu
            .waitForElementNotPresent('.cdk-overlay-backdrop');
    },

    'Step 5: Ensure "test-local-imports-1" Ontology is open' : function(browser) {
        browser.page.editorPage()
            .assert.valueEquals('@editorRecordSelectInput', 'test-local-imports-1');
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 6: Click classes tab' : function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
    },

    'Step 7: Check for Ontology classes' : function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 0")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]//ancestor::a/i[contains(@class, "fa-plus-square-o")]')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
            .assert.attributeContains('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]//ancestor::tree-item', 'data-path-to', 'test-local-imports-2#Class2.http://mobi.com/ontology/test-local-imports-1#Class1')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3")]]'})
    },

    'Step 8: Search for a class in the classes tab' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(., "Search")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Search")]]')
            .useCss()
            .waitForElementVisible('search-bar input.search-bar-input.ng-valid')
            .click('search-bar input.search-bar-input.ng-valid')
            .setValue('search-bar input.search-bar-input', 'Class 0')
            .sendKeys('search-bar input.search-bar-input', browser.Keys.ENTER)
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//tree-item//span[text()[contains(.,"Class 0")]]'})
            .useXpath()
            .click('//tree-item//span[text()[contains(.,"Class 0")]]')
            .waitForElementVisible('//span[@class[contains(.,"value-display")]]//mark[text()[contains(.,"Class 0")]]')
    },

    'Step 9: Open an Ontology called test-class-empty-label' : function(browser) {
        browser.page.ontologyEditorPage().openOntology('test-class-empty-label');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 12: Click classes tab' : function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
    },

    'Step 13: Check for Ontology classes' : function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
    }
}
