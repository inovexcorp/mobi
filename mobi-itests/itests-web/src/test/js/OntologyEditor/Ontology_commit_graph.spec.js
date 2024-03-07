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

var ontologyEditorPage = require('../zOntologyEditorPage').ontologyEditorPage;
var mergeRequest = require('../zMergeRequestsPage').mergeRequestsPage;
var skosOnt = process.cwd()+ '/src/test/resources/rdf_files/skos.rdf';

module.exports = {
    '@tags': ['ontology-editor', 'sanity', 'merge-request'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },
    'Step 2: Upload SKOS Ontologies' : function (browser) {
        browser
            .click('button.upload-button')
            .uploadFile('input[type=file]', skosOnt)
            .click('xpath', '//upload-ontology-overlay//span[text() = "Submit"]/parent::button')
            .globals.wait_for_no_spinners(browser);

    },
    'Step 3: Ensure that user is on Ontology editor page' : function(browser) {
        ontologyEditorPage.isActive(browser);
    },
    'Step 4: Open new Ontology Overlay' : function(browser) {
        ontologyEditorPage.openNewOntologyOverlay(browser);
    },

    'Step 5: Edit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.editNewOntologyOverlay(browser, 'MyGraph', 'Ontology graph');
    },

    'Step 6: Submit New Ontology Overlay' : function(browser) {
        ontologyEditorPage.submitNewOntologyOverlay(browser);
    },

    'Step 7: Edit IRI for ontology' : function(browser) {
        ontologyEditorPage.editIri(browser, 'MyGraphCommit1');
    },
    'Step 8: Open Commit overlay' : function(browser) {
        ontologyEditorPage.openCommitOverlay(browser);
    },
    'Step 9: Edit Commit message and Submit' : function(browser) {
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'IRI changed 1');

        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },
    'Step 10: Edit IRI for ontology' : function(browser) {
        ontologyEditorPage.editIri(browser, 'MyGraphCommit2');
    },
    'Step 11: Open Commit overlay' : function(browser) {
        ontologyEditorPage.openCommitOverlay(browser);
    },
    'Step 12: Edit Commit message and Submit' : function(browser) {
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'IRI changed 2');

        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },
    'Step 13: Edit IRI for ontology' : function(browser) {
        ontologyEditorPage.editIri(browser, 'MyGraphCommit3');
    },
    'Step 14: Open Commit overlay' : function(browser) {
        ontologyEditorPage.openCommitOverlay(browser);
    },
    'Step 15: Edit Commit message and Submit' : function(browser) {
        ontologyEditorPage.editCommitOverlayAndSubmit(browser, 'IRI changed 3');

        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page ontology-tab')
    },
    'Step 16: add new Import': function(browser) {
        browser
            .waitForElementVisible('imports-block div.section-header')
            .click('.imports-block a.fa-plus')
            .waitForElementVisible('imports-overlay')
            .useXpath().waitForElementVisible('//imports-overlay//button//span[text()[contains(.,"Submit")]]')
            .pause(1000)
            .click('xpath', '//imports-overlay//div[text()[contains(.,"On Server")]]')
            .useCss().waitForElementNotVisible('div.spinner')
            .click('xpath', '//imports-overlay//h4[text()[contains(.,"skos")]]')
            .useXpath().waitForElementVisible('//imports-overlay//mat-chip-list//mat-chip[text()[contains(.,"skos")]]')
            .click('//button//span[text()[contains(.,"Submit")]]')
            .useCss().waitForElementNotPresent('imports-overlay')
            .waitForElementVisible('.imports-block');
    },
    'Step 17: Commit Changes': function(browser) {
        browser
            .useCss()
            .moveToElement('ontology-button-stack circle-button-stack', 0, 0) // hover over + element
            .waitForElementVisible('ontology-button-stack circle-button-stack button.btn-info')
            .click('ontology-button-stack circle-button-stack button.btn-info')
            .waitForElementVisible('commit-overlay')
            .assert.textContains('commit-overlay h1.mat-dialog-title', 'Commit')
            .setValue('commit-overlay textarea[name=comment]', 'Update imports')
            .useXpath()
            .click('//commit-overlay//button//span[text()="Submit"]')
            .useCss()
            .waitForElementNotPresent('commit-overlay')
            .waitForElementVisible('.imports-block') // ensure that still on correct tab after committing
            .click('xpath', '//div[@id="toast-container"]')
            .waitForElementNotVisible('xpath', '//div[@id="toast-container"]')
    },
    'Step 18: Navigate to commit tab': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//button[contains(@class, "mat-tab-header-pagination-after")]')
            .click('//mat-tab-header//button[contains(@class, "mat-tab-header-pagination-after")]')
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Commits")]]')
            .assert.elementPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "initial commit")]]')
    },
    'Step 19: Checkout Initial commit ': function(browser) {
        browser
            .useXpath()
            .click('css selector','commit-history-graph svg g g:last-child g g:first-child')
            .waitForElementNotPresent('//commit-history-table//commit-history-graph//*[local-name()="svg"]//*[local-name()="text" and @class="commit-subject-string" and text()[contains(., "MASTER")]]')
            .useCss()
            .waitForElementVisible('.mat-tab-label-container .mat-tab-label:nth-child(10)')

        browser.getElementRect('css selector', '.mat-tab-label-container .mat-tab-label:nth-child(10)', function(result) {
            browser.getElementRect('css selector', 'mat-ink-bar', function(ink) {
                browser.assert.equal(result.x,  ink.x);
            });
        });
    }
}
