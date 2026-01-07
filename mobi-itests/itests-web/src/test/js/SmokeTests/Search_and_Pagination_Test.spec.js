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

var ontologies = [
    path.resolve(__dirname + '/../../resources/rdf_files/active-entity-filter-1.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/active-entity-filter-2.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/active-entity-filter-3.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/ComplexBlankNodeChainDeletion.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/CurrencyUnitOntology.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/deprecated-entity-filter-1.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/deprecated-entity-filter-2.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/deprecated-entity-filter-3.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/EntityDeletionOntology.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/EventOntology.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/pagination-ontology-1.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/pagination-ontology-2.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/pagination-ontology-3.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/pagination-ontology-4.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-1.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-2.ttl'),
    path.resolve(__dirname + '/../../resources/rdf_files/test-local-imports-3.ttl')
]

// TODO: Decide how useful this is with the new editor
module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword)
    },

    'Step 2: Upload Ontologies': function(browser) {
        ontologies.forEach(function(file) {
            browser.page.ontologyEditorPage().uploadOntology(file);
            browser.globals.wait_for_no_spinners(browser);
            browser.globals.dismiss_toast(browser);
        });
    },

    'Step 3: Validate Results With No Text': function(browser) {
        browser.page.ontologyEditorPage().openRecordSelect();
        browser.useXpath()
            .waitForElementVisible(`//mat-optgroup//mat-option//span[text()[contains(., "active-entity-filter-1")]]`)
            .waitForElementVisible('//mat-optgroup//mat-option//span[text()[contains(., "active-entity-filter-1")]]//p[text()[contains(., "http://mobi.com/ontology/active-entity-filter-1")]]');
    },

    'Step 4: Validate Search Function': function(browser) {
        browser.page.ontologyEditorPage().searchForOntology('test-local-imports');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useXpath()
            .waitForElementVisible(`//mat-optgroup//mat-option//span[text()[contains(., "test-local-imports")]]`)
            .assert.visible(`//mat-optgroup//mat-option//span[text()[contains(., "test-local-imports-1")]]`)
            .assert.visible(`//mat-optgroup//mat-option//span[text()[contains(., "test-local-imports-2")]]`)
            .assert.visible(`//mat-optgroup//mat-option//span[text()[contains(., "test-local-imports-3")]]`);
    }
}
