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

const path = require('path');
const Onto1 = path.resolve(__dirname + '/../../resources/rdf_files/uhtc-ontology.ttl');
const Onto2 = path.resolve(__dirname + '/../../resources/rdf_files/pizza.owl');
const shapes_graph = path.resolve(__dirname + '/../../resources/rdf_files/UHTC_shapes.ttl');
let currentRecordIRI = '';

async function getRecordIri(browser) {
  await browser.chrome.setPermission('clipboard-read', 'granted');
  await browser.chrome.setPermission('clipboard-write', 'granted');
  return encodeURIComponent(await browser.executeAsyncScript(function(done) {
    navigator.clipboard.readText().then(done).catch(() => done(''));
  }, []));
}

function verifyURLBehavior(browser, url, errorText) {
  browser.url(url)
  browser.globals.wait_for_no_spinners(browser);
  browser.useCss()
    .waitForElementVisible('.toast-error')
    .getText('.toast-error', function(result) { this.assert.equal(result.value, errorText)})
    .waitForElementNotPresent('.toast-error');
  browser.assert.not.elementPresent('ontology-tab');
  browser.assert.not.urlContains(`?id=${currentRecordIRI}-invalid`);
}

async function getRecordIRIFromToast(browser) {
  browser.useCss()
    .waitForElementVisible('.toast-success')
  let toastText = await browser.getText('.toast-success', function(result) { return result.value; });
  if (toastText) {
    currentRecordIRI = encodeURIComponent(toastText.match(/https?:\/\/[^\s]+/)[0]);
  }
}

module.exports = {
  '@tags': ['sanity', 'ontology-editor', 'routing'],

  'Step 1: Initial Setup' : function(browser) {
    browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword)
  },

  'Step 2: Create an Ontology & verify url path' : async function(browser) {
    browser.page.ontologyEditorPage().createOntology('test-ontology');
    await getRecordIRIFromToast(browser);
    browser.assert.urlContains(`?id=${currentRecordIRI}`);
  },

  'Step 3: Upload Ontologies' : async function(browser) {
    [Onto2, Onto1].forEach(function(file) {
      browser.page.ontologyEditorPage().uploadOntology(file);
      browser.globals.wait_for_no_spinners(browser);
    });
    await getRecordIRIFromToast(browser);
  },

  'Step 4: Ensure UHTC ontology is open and URL is correct' : function(browser) {
    browser.page.editorPage()
      .assert.valueEquals('@editorRecordSelectInput', 'uhtc-ontology');
    browser.page.ontologyEditorPage().onProjectTab();
    browser.assert.urlContains(`?id=${currentRecordIRI}`);
  },

  'Step 5: Switch to the Pizza ontology and verify url changes': async function(browser) {
    browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view')
    browser.page.catalogPage().waitForElementPresent('@filterSelector')
    browser.page.catalogPage().copyRecordIRI('pizza')

    currentRecordIRI = await getRecordIri(browser, 'pizza');

    browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
    browser.page.ontologyEditorPage().openOntology('pizza');
    browser.assert.urlContains(`?id=${currentRecordIRI}`);
  },

  'Step 6: Navigate to the Catalog Page and back. Verify url changes': function(browser) {
    browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view')
    browser.page.catalogPage().waitForElementPresent('@filterSelector')
    browser.globals.switchToPage(browser, 'ontology-editor', 'ontology-editor-page');
    browser.page.editorPage()
      .assert.valueEquals('@editorRecordSelectInput', 'pizza');
    browser.page.ontologyEditorPage().onProjectTab();
    browser.assert.urlContains(`?id=${currentRecordIRI}`);
  },

  'Step 7: Enter and invalid record IRI and verify correct behavior': function(browser) {
    const url = `${browser.globals.baseUrl(browser)}/ontology-editor?id=${currentRecordIRI}-invalid`;
    const errorMessage = 'Error\nNot Found';
    verifyURLBehavior(browser, url, errorMessage);
  },

  'Step 8: Upload a shapes graph record': async function(browser) {
    browser.globals.switchToPage(browser, 'shapes-graph-editor', 'shapes-graph-editor-page');
    browser.page.shapesEditorPage().uploadShapesGraph(shapes_graph);
    browser.globals.wait_for_no_spinners(browser);
    browser.globals.dismiss_toast(browser);
    browser.globals.switchToPage(browser, 'catalog', 'catalog-page records-view')
    browser.page.catalogPage().waitForElementPresent('@filterSelector')
    browser.page.catalogPage().copyRecordIRI('UHTC_shapes')
    currentRecordIRI = await getRecordIri(browser, 'pizza');
  },

  'Step 9: Enter IRI of incorrect record type and verify correct behavior': function(browser) {
    const url = `${browser.globals.baseUrl(browser)}/ontology-editor?id=${currentRecordIRI}`;
    const errorMessage = 'Error\nError: Could not open record as it is not an ontology.';
    verifyURLBehavior(browser, url, errorMessage);
  }
}
