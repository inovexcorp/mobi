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

var adminUsername = 'admin'
var adminPassword = 'admin'

module.exports = {
    '@tags': ['ontology-editor', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Ensure that user is on Ontology editor page' : function(browser) {
        browser
            .useCss()
            .waitForElementPresent('ontology-editor-page')
    },

    'Step 3: Create New Ontology': function(browser) {
        browser.page.ontologyEditorPage().createOntology('Query Test Ontology', 'Query Test Description');
        browser.globals.wait_for_no_spinners(browser);
        browser.page.ontologyEditorPage().onProjectTab();
    },

    'Step 4: Click search tab dropdown': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(., "Search")]]')
            .click('xpath', '//mat-tab-header//div[text()[contains(., "Search")]]//mat-icon')
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//find-view'
            })
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//button[text()[contains(., "Find")]]'
            })
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//button[text()[contains(., "Query")]]'
            })
            .click('xpath', '//button[text()[contains(., "Query")]]')
            .waitForElementVisible({
                locateStrategy: 'xpath',
                selector: '//query-view'
            })
            .assert.visible('//query-view//div[@class="yasgui"]//div[@class="yasqe"]');
    },

    'Step 5: Verify results': function(browser) {
        browser
            .waitForElementVisible('//button//span[text()[contains(., "Submit")]]')
            .click('xpath', '//button//span[text()[contains(., "Submit")]]')
            .useCss()
            .waitForElementVisible('query-view div.yasr')
            .assert.visible('query-view div.yasr div.yasr_header')
            .assert.visible('query-view div.yasr div.yasr_header ul.yasr_btnGroup')
            .assert.visible('query-view div.yasr div.yasr_header div.yasr_response_chip')
            .assert.visible('query-view div.yasr div.yasr_header div.yasr_plugin_control')
            .assert.visible('query-view div.yasr table')
            .assert.visible('query-view div.yasr table thead')
            .assert.visible('query-view div.yasr table tbody')
            .assert.visible('query-view div.yasr div.dataTables_wrapper')
            .assert.visible('query-view div.yasr div.dataTables_wrapper div.dataTables_paginate')
            .expect.element('query-view div.yasr table tbody > tr:nth-child(3)').to.be.present; // expect.elements was not working consistently
    },

    'Step 6: Create a new Class': function(browser) {
        browser.page.ontologyEditorPage().createNewOwlClass('class A');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 7: Verify InProgressCommit results': function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//button//span[text()[contains(., "Submit")]]')
            .click('xpath', '//button//span[text()[contains(., "Submit")]]')
            .useCss()
            .waitForElementVisible('query-view div.yasr')
            .assert.visible('query-view div.yasr div.yasr_header')
            .assert.visible('query-view div.yasr div.yasr_header ul.yasr_btnGroup')
            .assert.visible('query-view div.yasr div.yasr_header div.yasr_response_chip')
            .assert.visible('query-view div.yasr div.yasr_header div.yasr_plugin_control')
            .assert.visible('query-view div.yasr table')
            .assert.visible('query-view div.yasr table thead')
            .assert.visible('query-view div.yasr table tbody')
            .assert.visible('query-view div.yasr div.dataTables_wrapper')
            .assert.visible('query-view div.yasr div.dataTables_wrapper div.dataTables_paginate')
            .expect.element('query-view div.yasr table tbody > tr:nth-child(5)').to.be.present; // expect.elements was not working consistently
    },

    'Step 8: Commit Changes': function(browser) {
        browser.page.ontologyEditorPage().commit('commit123');
        browser.globals.wait_for_no_spinners(browser);
        browser.globals.dismiss_toast(browser);
    },

    'Step 9: Verify commit results': function(browser) {
        browser
            .useXpath()
            .click('xpath', '//button//span[text()[contains(., "Submit")]]')
            .waitForElementVisible('//query-view//div[contains(@class, "yasr")]')
            .useCss()
            .waitForElementVisible('query-view div.yasr')
            .assert.visible('query-view div.yasr div.yasr_header')
            .assert.visible('query-view div.yasr div.yasr_header ul.yasr_btnGroup')
            .assert.visible('query-view div.yasr div.yasr_header div.yasr_response_chip')
            .assert.visible('query-view div.yasr div.yasr_header div.yasr_plugin_control')
            .assert.visible('query-view div.yasr table')
            .assert.visible('query-view div.yasr table thead')
            .assert.visible('query-view div.yasr table tbody')
            .assert.visible('query-view div.yasr div.dataTables_wrapper')
            .assert.visible('query-view div.yasr div.dataTables_wrapper div.dataTables_paginate')
            .expect.element('query-view div.yasr table tbody > tr:nth-child(5)').to.be.present; // expect.elements was not working consistently
    }
}
