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
var adminUsername = 'admin';
var adminPassword = 'admin';
var skosOnt = path.resolve(__dirname + '/../../resources/rdf_files/skos.rdf');

module.exports = {
    '@tags': ['ontology-editor', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload SKOS Ontologies' : function(browser) {
        browser.page.ontologyEditorPage().uploadOntology(skosOnt);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 3: Create New Ontology' : function(browser) {
        browser.page.ontologyEditorPage().createOntology('MyGraph', 'Ontology graph');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Edit IRI for ontology' : function(browser) {
        browser.page.ontologyEditorPage().editIri('MyGraphCommit1');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 5: Commit first IRI change' : function(browser) {
        browser.page.ontologyEditorPage().commit('IRI changed 1');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 6: Edit IRI for ontology a second time' : function(browser) {
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().editIri('MyGraphCommit2');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Commit second IRI change' : function(browser) {
        browser.page.ontologyEditorPage().commit('IRI changed 2');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 8: Edit IRI for ontology a third time' : function(browser) {
        browser.page.ontologyEditorPage().onProjectTab();
        browser.page.ontologyEditorPage().editIri('MyGraphCommit3');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 9: Commit third IRI change' : function(browser) {
        browser.page.ontologyEditorPage().commit('IRI changed 3');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 10: add new Import': function(browser) {
        browser.page.ontologyEditorPage().addServerImport('skos');
    },

    'Step 11: Commit Changes': function(browser) {
        browser.page.ontologyEditorPage().commit('Update imports');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
        browser.page.ontologyEditorPage().isActive('ontology-tab');
    },

    'Step 12: View changes and commits': function(browser) {
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser)
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('app-changes-page mat-expansion-panel')
            .assert.textContains('app-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table svg .commit-hash-string').count.to.equal(5)
        browser
            .useXpath()
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "Update imports")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "IRI changed 3")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "IRI changed 2")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "IRI changed 1")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
    },

    'Step 19: Checkout Initial commit ': function(browser) {
        browser
            .useXpath()
            .click('css selector','commit-history-graph svg g g:last-child g g:first-child')
            .waitForElementNotPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "MASTER")]]')
            .useCss()
            .waitForElementVisible('.mat-tab-label-container .mat-tab-label:nth-child(9)')

        browser.getElementRect('css selector', '.mat-tab-label-container .mat-tab-label:nth-child(9)', function(result) {
            browser.getElementRect('css selector', 'mat-ink-bar', function(ink) {
                browser.assert.equal(result.x,  ink.x);
            });
        });
    }
}
