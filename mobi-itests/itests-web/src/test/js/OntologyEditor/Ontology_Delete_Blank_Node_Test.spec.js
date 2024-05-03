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
var adminUsername = 'admin'
var adminPassword = 'admin'
var Onto1 = process.cwd() + '/src/test/resources/rdf_files/ComplexBlankNodeChainDeletion.ttl'

module.exports = {
    '@tags': ['sanity', 'ontology-editor'],

    'Step 1: Initial Setup': function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies': function(browser) {
        browser.page.ontologyEditorPage().uploadOntology(Onto1);
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 3: Click classes tab': function(browser) {
        browser
            .useXpath().waitForElementVisible('//mat-tab-header//div[text()[contains(., "Classes")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Classes")]]')
    },

    'Step 4: Open for Ontology class': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "MainClass")]]'
            })
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "MainClass")]]')
    },

    'Step 5: Delete Axiom for Ontology class': function(browser) {
        browser
            .useCss().waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//div[contains(@class, "class-axioms")]//span[text()[contains(., "SubClass2")]]'
            })
            .click('//div[contains(@class, "class-axioms")]//button')
            .useCss()
            .waitForElementVisible('confirm-modal')
            .waitForElementVisible('confirm-modal button.mat-primary')
            .click('confirm-modal button.mat-primary')
            .waitForElementNotPresent('confirm-modal button:not(.mat-primary)');
        browser.globals.wait_for_no_spinners(browser);
      },

    'Step 6: Click changes tab': function(browser) {
        browser
            .assert.visible('mat-chip.uncommitted')
        browser.page.ontologyEditorPage().toggleChangesPage();
        browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('app-changes-page div.changes-info button.mat-warn')
            .expect.elements('app-changes-page mat-expansion-panel').count.to.equal(5)
    }
}
