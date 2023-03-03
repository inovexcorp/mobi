/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
var newUser = { 'username': 'newUserB', 'password': 'testB',
    'firstName': 'firstTesterA', 'lastName': 'lastTesterA', 'email': 'testA@gmail.com' };
var shapes_graph = process.cwd()+ '/src/test/resources/rdf_files/semops_shapes.ttl'

module.exports = {
    '@tags': ['ontology-editor', 'sanity'],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Navigate to the Shapes Graph Editor': function(browser) {
        browser.click('xpath', '//div//ul//a[@class="nav-link"][@href="#/shapes-graph-editor"]');
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('shapes-graph-editor-page');
    },

    'Step 3: Create a new shapes graph': function (browser) {
        browser.globals.create_shapes_graph(browser, 'Sem Ops Graph', shapes_graph)
    },

    'Step 4: Verify shapes graph presentation': function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementVisible('shapes-graph-details')
            .waitForElementVisible('shapes-graph-properties-block')
            .waitForElementVisible('div.yate')
            // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
            .assert.value('shapes-graph-editor-page editor-record-select input', 'Sem Ops Graph')
            .assert.value('shapes-graph-editor-page editor-branch-select input', 'MASTER')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(3)
    },

    'Step 5: Create a new branch': function (browser) {
        browser.globals.create_shapes_graph_branch(browser, 'Sem Ops Branch');
    },

    'Step 6: Verify switching of branches': function (browser) {
        browser
            .waitForElementVisible('shapes-graph-details')
            .waitForElementVisible('shapes-graph-properties-block')
            .waitForElementVisible('div.yate')
            .assert.value('shapes-graph-editor-page editor-record-select input', 'Sem Ops Graph')
            .assert.value('shapes-graph-editor-page editor-branch-select input', 'Sem Ops Branch')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(3)
    },


    'Step 7: The admin user clicks on the Administration sidebar link' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
    },

    'Step 8: A new user is created' : function(browser) {
        browser.globals.add_new_user(browser, newUser)
    },

    'Step 9: The admin user clicks on the permissions tab' : function(browser) {
        browser
            .click('//mat-tab-group//div[contains(@class,"mat-tab-labels")]//div[contains(@class,"mat-tab-label-content")][text()[contains(., "Permissions")]]')
    },

    'Step 10: The admin user toggles off Create Shapes Graph permission' : function(browser) {
        browser
            .waitForElementVisible('//h4[contains(text(), "Create Shapes Graph Record")]/following-sibling::mat-slide-toggle')
            .click('//h4[contains(text(), "Create Shapes Graph Record")]/following-sibling::mat-slide-toggle')
            .useCss()
            .waitForElementVisible('.save-container')
            .click('.save-container');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 11: The admin user clicks logout' : function(browser) {
        browser.globals.logout(browser)
    },

    'Step 12: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, newUser.username, newUser.password)
    },

    'Step 13: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 14: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.containsText('a.current-user-box div.user-title', newUser.firstName)
    },

    'Step 15: Navigate to shapes graph editor' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//a[starts-with(@href, '#/shapes-graph-editor')][1]")
            .click("//a[starts-with(@href, '#/shapes-graph-editor')][1]")
    },

    'Step 16: Assert Create Shapes graph button is disabled' : function(browser) {
        browser
            .useCss()
            .click('shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .waitForElementVisible('mat-option button.create-record')
            .pause(2000)
            .useXpath()
            .assert.not.enabled('//span[@class="mat-option-text"]/span/button[contains(@class,"create-record")]')
    },

    'Step 17: Assert Delete Shapes graph button is disabled' : function(browser) {
        browser
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/shapes-graph-editor"]'); // click off dropdown
            browser.globals.wait_for_no_spinners(browser);
        browser
            .waitForElementVisible('shapes-graph-editor-page editor-record-select')
            .click('shapes-graph-editor-page editor-record-select')
        browser
            .useXpath()
            .pause(1000)
            .waitForElementVisible('//mat-optgroup/label[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "Sem Ops Graph")]]/following::button[contains(@class,"delete-record")][@disabled]')
            .click('//div//ul//a[@class="nav-link"][@href="#/shapes-graph-editor"]'); // click off dropdown
        browser.globals.wait_for_no_spinners(browser);
        browser
            .useCss()
            .waitForElementVisible('shapes-graph-editor-page');
    },

    'Step 18: Open Shapes Graph' : function(browser) {
        browser.globals.open_shapes_graph(browser, 'Sem Ops Graph');
    },

    'Step 19: Verify the correct buttons are disabled' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible(browser.globals.create_shapes_graph_branch_button.css)
            .assert.enabled(browser.globals.create_shapes_graph_branch_button.css)
            .assert.not.enabled(browser.globals.merge_shapes_graph_button.css)
            .assert.enabled(browser.globals.create_shapes_graph_tag_button.css)
            .assert.enabled(browser.globals.download_shapes_graph_button.css)
            .assert.not.enabled(browser.globals.upload_changes_shapes_graph_button.css)
    },

    'Step 20: The user clicks logout' : function(browser) {
        browser.globals.logout(browser)
    },

    'Step 21: The admin user logs in' : function(browser) {
        browser.globals.login(browser, 'admin', 'admin')
    },

    'Step 22: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 23: The admin user navigates to the catalog page' : function(browser) {
        browser.click('sidebar div ul a[class=nav-link][href="#/catalog"]');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 24: The admin user removes modify permission for the shapes graph record' : function (browser) {
        browser
            .useCss()
            .waitForElementNotPresent('#spinner-full')
            .setValue('catalog-page records-view .d-flex .search-form input','Sem Ops Graph')
            .sendKeys('catalog-page records-view .d-flex .search-form input', browser.Keys.ENTER)
            .waitForElementNotPresent('#spinner-full')
            .click('xpath', '//catalog-page//record-card//mat-card-title//span[text()[contains(., "Sem Ops Graph")]]//ancestor::mat-card')
            .waitForElementVisible('catalog-page record-view div.record-body')
            .expect.element('catalog-page record-view div.record-body h2.record-title div.inline-edit').text.to.contain('Sem Ops Graph');
        browser.assert.elementPresent('catalog-page record-view div.record-sidebar manage-record-button button');
        browser
            .assert.elementPresent('catalog-page record-view div.record-sidebar manage-record-button button')
            .click('catalog-page record-view div.record-sidebar manage-record-button button')
            .useXpath()
            .waitForElementVisible('//user-access-controls//*[h4="Modify Record"]//mat-slide-toggle')
            .click('//user-access-controls//*[h4="Modify Record"]//mat-slide-toggle')
            .useCss()
            .click('div.save-container');
        browser.globals.wait_for_no_spinners(browser);
    },

    'Step 25: The admin user clicks logout' : function(browser) {
        browser.globals.logout(browser)
    },

    'Step 26: Test logins as the newly created user' : function(browser) {
        browser.globals.login(browser, newUser.username, newUser.password)
    },

    'Step 27: Wait for visibility of home elements' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible('.home-page')
    },

    'Step 28: New User name is displayed in sidebar on left' : function(browser) {
        browser
            .useCss()
            .assert.visible('a.current-user-box div.user-title')
            .assert.containsText('a.current-user-box div.user-title', newUser.firstName)
    },

    'Step 29: Navigate to shapes graph editor' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible("//a[starts-with(@href, '#/shapes-graph-editor')][1]")
            .click("//a[starts-with(@href, '#/shapes-graph-editor')][1]")
    },

    'Step 30: Open Shapes Graph' : function(browser) {
        browser.globals.open_shapes_graph(browser, 'Sem Ops Graph');
    },

    'Step 31: Verify the correct buttons are disabled' : function(browser) {
        browser
            .useCss()
            .waitForElementVisible(browser.globals.create_shapes_graph_branch_button.css)
            .assert.not.enabled(browser.globals.create_shapes_graph_branch_button.css)
            .assert.not.enabled(browser.globals.merge_shapes_graph_button.css)
            .assert.not.enabled(browser.globals.create_shapes_graph_tag_button.css)
            .assert.enabled(browser.globals.download_shapes_graph_button.css)
            .assert.not.enabled(browser.globals.upload_changes_shapes_graph_button.css)
    }
}
