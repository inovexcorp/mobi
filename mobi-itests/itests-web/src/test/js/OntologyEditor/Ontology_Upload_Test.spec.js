/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
var adminUsername = 'admin';
var adminPassword = 'admin';
var Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-1.ttl');
var Onto1eName = 'test-local-imports-1e.ttl';
var Onto1e = path.resolve(__dirname + '/../../resources/rdf_files/' + Onto1eName); // has syntax issue
var Onto1sName = 'test-local-imports-1s.ttl';
var Onto1s = path.resolve(__dirname + '/../../resources/rdf_files/' + Onto1sName); // same as test-local-imports-1
var Onto1TrigName = 'test-local-imports-1s.trig';
var Onto1Trig = path.resolve(__dirname + '/../../resources/rdf_files/' + Onto1TrigName);
var Onto1TrigZipName = 'test-local-imports-1s.trig.zip';
var Onto1TrigZip = path.resolve(__dirname + '/../../resources/rdf_files/' + Onto1TrigZipName);
var Onto2 = path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-2.ttl');
var Onto3 = path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-3.ttl');
var Onto4 = path.resolve(__dirname + '/../../resources/rdf_files/unresolvableImport.owl'); // OWL Files Processed Differently
var Onto5 = path.resolve(__dirname + '/../../resources/rdf_files/test-class-empty-label.ttl'); // Class has empty string for label

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        [Onto5, Onto4, Onto3, Onto2, Onto1].forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
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
        browser.page.ontologyEditorPage().openClassesTab();
    },

    'Step 7: Check for Ontology classes' : function(browser) {
        browser.page.ontologyEditorPage()
            .verifyItemVisible('Class 0')
            .verifyItemVisible('Class 2')
            .expandItem('Class 2')
            .verifyItemVisible('Class 1')
            .assert.attributeContains('//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]//ancestor::tree-item', 'data-path-to', 'test-local-imports-2#Class2.http://mobi.com/ontology/test-local-imports-1#Class1')
            .verifyItemVisible('Class 3');
    },

    'Step 8: Search for a class in the classes tab' : function(browser) {
        browser.page.ontologyEditorPage()
            .openSearchTab()
            .executeSearch('Class 0');
        browser.page.ontologyEditorPage()
            .selectSearchResult('Class 0')
    },

    'Step 9: Open an Ontology called test-class-empty-label' : function(browser) {
        browser.page.ontologyEditorPage().openOntology('test-class-empty-label');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 12: Click classes tab' : function(browser) {
        browser.page.ontologyEditorPage().openClassesTab();
    },

    'Step 13: Check for Ontology classes' : function(browser) {
        browser.page.ontologyEditorPage().verifyItemVisible('Class 1');
    }
}
