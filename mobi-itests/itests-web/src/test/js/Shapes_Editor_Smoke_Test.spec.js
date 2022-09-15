/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
var shapes_graph = process.cwd()+ '/src/test/resources/rdf_files/UHTC_shapes.ttl'
var additional_shapes_graph = process.cwd()+ '/src/test/resources/rdf_files/additional_shapes.ttl'
var shapes_graph_update = process.cwd()+ '/src/test/resources/rdf_files/UHTC_shapes_update.ttl'
var shapes_graph_conflict = process.cwd()+ '/src/test/resources/rdf_files/UHTC_shapes_conflict.ttl'


module.exports = {
    '@tags': ['shapes-editor', 'sanity'],

    'Step 1: Initial Setup': function (browser) {
        browser
            .url('https://localhost:' + browser.globals.globalPort + '/mobi/index.html#/home')
            .waitForElementVisible('input#username')
            .waitForElementVisible('input#password')
            .setValue('input#username', adminUsername)
            .setValue('input#password', adminPassword)
            .click('button[type=submit]')
            .waitForElementVisible('.home-page')
            .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/shapes-graph-editor"]')
        browser.globals.wait_for_no_spinners(browser)
        browser.waitForElementVisible('shapes-graph-editor-page')
    },

    'Step 2: Create a new shapes graph': function (browser) {
        browser.globals.create_shapes_graph(browser, 'UHTC Test Graph', shapes_graph)
    },

    'Step 3: Verify shapes graph presentation': function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementVisible('shapes-graph-details')
            .waitForElementVisible('shapes-graph-properties-block')
            .waitForElementVisible('div.yate')
            // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
            .assert.value('shapes-graph-editor-page editor-record-select input', 'UHTC Test Graph')
            .assert.value('shapes-graph-editor-page editor-branch-select input', 'MASTER')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(3)
    },

    'Step 4: Create a new branch': function (browser) {
        browser
            .click('button.create-branch')
            .waitForElementVisible('create-branch-modal')
            .waitForElementVisible('create-branch-modal mat-form-field input')
            .waitForElementVisible('create-branch-modal button.mat-primary')
            .sendKeys('xpath','//create-branch-modal//mat-form-field[1]//input', "UHTC Test Branch")
            .click('create-branch-modal button.mat-primary')
    },

    'Step 5: Verify switching of branches': function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementVisible('shapes-graph-details')
            .waitForElementVisible('shapes-graph-properties-block')
            .waitForElementVisible('div.yate')
            .assert.value('shapes-graph-editor-page editor-record-select input', 'UHTC Test Graph')
            .assert.value('shapes-graph-editor-page editor-branch-select input', 'UHTC Test Branch')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(3)
    },

    'Step 6: Upload Changes': function (browser) {
        browser
            .click('button.upload-changes')
            .waitForElementVisible('upload-record-modal')
            .waitForElementVisible('upload-record-modal file-input')
            .waitForElementVisible('upload-record-modal button.mat-primary')
            .uploadFile('upload-record-modal file-input input', shapes_graph_update)
            .click('upload-record-modal button.mat-primary')
    },

    'Step 7: verify Uploaded Changes': function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .assert.visible('mat-chip.uncommitted')
            .expect.elements('shapes-graph-editor-page shapes-graph-property-values').count.to.equal(5)
        browser
            .assert.not.elementPresent('div.toast-title')
            .click('editor-top-bar button.changes')
            .waitForElementVisible('shapes-graph-changes-page')
            .waitForElementVisible('xpath','//shapes-graph-changes-page//button//span[contains(text(), "Remove All Changes")]')
            .expect.elements('shapes-graph-changes-page mat-expansion-panel').count.to.equal(4)
    },

    'Step 8: Commit changes and verify commit was made successfully': function (browser) {
        browser
            .click('button.commit')
            .sendKeys('commit-modal textarea', 'The first manual commit message')
            .click('commit-modal button.mat-primary')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .assert.not.elementPresent('mat-chip.uncommitted')
            .assert.not.elementPresent('shapes-graph-changes-page mat-expansion-panel')
            .assert.textContains('shapes-graph-changes-page info-message p', 'No Changes to Display')
            .expect.elements('commit-history-table tbody tr').count.to.equal(2)
        browser
            .useXpath()
            .assert.textContains('//commit-history-table//tbody//tr[1]//td[@class="commit-message"]//span', 'The first manual commit message')
            .useCss()
    },

    'Step 9: Upload merge conflict into master': function (browser) {
        browser
            .click('editor-branch-select mat-form-field mat-icon')
            .pause(1000)
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]')
        browser.globals.wait_for_no_spinners(browser);
        browser
            .pause(1000)
            .click('button.upload-changes')
            .waitForElementVisible('upload-record-modal')
            .waitForElementVisible('upload-record-modal file-input')
            .waitForElementVisible('upload-record-modal button.mat-primary')
            .uploadFile('upload-record-modal file-input input', shapes_graph_conflict)
            .click('upload-record-modal button.mat-primary')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementNotVisible('div.toast-title')
            .pause(1000)
            .click('button.commit')
            .sendKeys('commit-modal textarea', 'A conflict commit on master')
            .click('commit-modal button.mat-primary')
    },

    'Step 10: Merge created branch into master': function (browser) {
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('editor-branch-select mat-form-field mat-icon')
            .pause(1000)
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Branch")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Branch")]')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('editor-top-bar button.merge-branch')
            .waitForElementVisible('shapes-graph-merge-page branch-select')
            .waitForElementVisible('shapes-graph-merge-page button.btn-primary')
            .click('shapes-graph-merge-page branch-select')
            .click('xpath', '//div//mat-option//span[contains(text(), "MASTER")]')
            .assert.visible('commit-difference-tabset')
            .expect.elements('commit-difference-tabset div.mat-tab-label').count.to.equal(2);
        browser
            .click('shapes-graph-merge-page button.btn-primary')
    },

    'Step 11: Resolve conflicts and Verify successful merge': function (browser) {
        browser
            .waitForElementVisible('resolve-conflicts-block')
            .waitForElementVisible('resolve-conflicts-form p small')
            .click('resolve-conflicts-form p small')
        browser.globals.wait_for_no_spinners(browser)
        browser.expect.elements('resolve-conflicts-form div.conflict').count.to.equal(2);
        browser
            .click('xpath', '//resolve-conflicts-form//div[contains(@class,"conflict")]//div[@class="card"][1]')
            .click('resolve-conflicts-block div.btn-container button.btn-primary')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .waitForElementVisible('shapes-graph-details')
            .waitForElementVisible('shapes-graph-properties-block')
            .waitForElementVisible('div.yate')
            .useXpath()
            .assert.textContains('//shapes-graph-property-values//div//p[contains(text(), "Title")]/../..//value-display', 'UHTC Shapes Graph with some changes')
    },

    'Step 12: Delete created branch and verify successful deletion': function (browser) {
        browser
            .useCss()
            .assert.value('shapes-graph-editor-page editor-branch-select input', 'MASTER')
            .click('editor-branch-select mat-form-field i')
            .pause(1000)
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Branch")]/following-sibling::button')
            .click('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Branch")]/following-sibling::button')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary');
        browser.globals.wait_for_no_spinners(browser);
        browser
            .pause(1000)
            .click('editor-branch-select mat-form-field i')
            .pause(1000)
            .useXpath()
            .assert.not.elementPresent('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Branch")]')
    },

    'Step 13: Create tag and verify successful creation': function (browser) {
        browser
            .useCss()
            .click('editor-top-bar button.create-tag')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .sendKeys('xpath', '//create-tag-modal//mat-form-field[1]//input', 'UHTC Test Tag')
            .click('create-tag-modal button.mat-primary')
        browser.globals.wait_for_no_spinners(browser)
        browser.assert.value('shapes-graph-editor-page editor-branch-select input', 'UHTC Test Tag')
    },

    'Step 14: Delete created tag and verify deletion': function (browser) {
        browser
            .click('editor-branch-select mat-form-field mat-icon')
            .pause(1000)
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]')
            .click('//mat-optgroup//mat-option//span[contains(text(), "MASTER")]')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .useCss()
            .click('editor-branch-select mat-form-field mat-icon')
            .pause(3000)
            .useXpath()
            .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Tag")]/following-sibling::button')
            .click('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Tag")]/following-sibling::button')
            .click('css selector', 'confirm-modal div.mat-dialog-actions button.mat-primary')
        browser.globals.wait_for_no_spinners(browser)
        browser
            .click('xpath', '//div[@id="toast-container"]')
            .waitForElementNotVisible('xpath', '//div[@id="toast-container"]')
            .click('editor-branch-select mat-form-field mat-icon')
            .pause(3000)
            .useXpath()
            .assert.not.elementPresent('//mat-optgroup//mat-option//span[contains(text(), "UHTC Test Tag")]')
            .useCss()
    },

    'Step 15: create and open a new record': function (browser) {
        browser.globals.create_shapes_graph(browser, 'Additional Test Graph', additional_shapes_graph)
        browser.globals.wait_for_no_spinners(browser)
    },

    'Step 16: Verify both records are open': function (browser) {
        browser
            .click('shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .useXpath()
            .assert.visible('//mat-optgroup//label[contains(text(), "Open")]/..//span[contains(text(), "UHTC Test Graph")]')
            .assert.visible('//mat-optgroup//label[contains(text(), "Open")]/..//span[contains(text(), "Additional Test Graph")]')
    },

    'Step 17: Delete the Records': function (browser) {
        browser.globals.delete_shapes_graph(browser, 'Additional Test Graph')
        browser.globals.wait_for_no_spinners(browser)
        browser.globals.delete_shapes_graph(browser, 'UHTC Test Graph')
    }
}