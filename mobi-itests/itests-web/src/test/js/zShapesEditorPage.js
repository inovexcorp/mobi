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
var ShapesEditorPage = function() {
    this.create_shapes_graph_branch_button = {
        css: 'shapes-graph-editor-page editor-top-bar button.create-branch'
    };
    this.merge_shapes_graph_button = {
        css: 'shapes-graph-editor-page editor-top-bar button.merge-branch'
    };
    this.create_shapes_graph_tag_button ={
        css: 'shapes-graph-editor-page editor-top-bar button.create-tag'
    };
    this.download_shapes_graph_button = {
        css: 'shapes-graph-editor-page editor-top-bar button.download-record'
    };
    this.upload_changes_shapes_graph_button = {
        css: 'shapes-graph-editor-page editor-top-bar button.upload-changes'
    };
};

ShapesEditorPage.prototype.goToPage = function (browser) {
    browser.click('xpath', '//div//ul//a[@class="nav-link"][@href="#/shapes-graph-editor"]');
    browser.globals.wait_for_no_spinners(browser);
    browser.waitForElementVisible('shapes-graph-editor-page');
};

ShapesEditorPage.prototype.createShapesGraph = function (browser, title, shapes_file) {
        browser
            .useCss()
            .waitForElementVisible('shapes-graph-editor-page editor-record-select')
            .click('shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .waitForElementVisible('mat-option')
            .click('mat-option button.create-record')
            .waitForElementVisible('new-shapes-graph-record-modal')
            .waitForElementVisible('new-shapes-graph-record-modal file-input')
            .waitForElementVisible('new-shapes-graph-record-modal button.mat-raised-button')
            .useXpath()
            .sendKeys('//new-shapes-graph-record-modal//mat-form-field[1]//input', title)
            .uploadFile('//new-shapes-graph-record-modal//file-input//input', shapes_file)
            .useCss()
            .click('new-shapes-graph-record-modal button.mat-primary');
};

ShapesEditorPage.prototype.openShapesGraph = function (browser, title) {
    browser
        .useCss()
        .waitForElementVisible('shapes-graph-editor-page editor-record-select')
        .click('shapes-graph-editor-page editor-record-select')
        .useXpath()
        .pause(1000)
        .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option')
        .click('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option');
    browser.globals.wait_for_no_spinners(browser);
    browser
        .useCss()
        .waitForElementVisible('shapes-graph-details')
        .waitForElementVisible('shapes-graph-properties-block')
        .waitForElementVisible('div.yate')
        // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
};

ShapesEditorPage.prototype.createBranch = function (browser, branch_title) {
    browser
          .useCss()
          .waitForElementVisible('shapes-graph-editor-page')
          .waitForElementVisible('shapes-graph-editor-page editor-top-bar')
          .click(this.create_shapes_graph_branch_button.css)
          .waitForElementVisible('create-branch-modal')
          .waitForElementVisible('create-branch-modal mat-form-field input')
          .waitForElementVisible('create-branch-modal button.mat-primary')
          .sendKeys('xpath','//create-branch-modal//mat-form-field[1]//input', branch_title)
          .click('create-branch-modal button.mat-primary');
    browser.globals.wait_for_no_spinners(browser);
};

ShapesEditorPage.prototype.deleteShapesGraph = function (browser, title) {
    browser
        .useCss()
        .waitForElementVisible('shapes-graph-editor-page')
        .useXpath()
        .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
        .waitForElementVisible('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
        .click('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
        .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
        .click('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]/following-sibling::button')
        .waitForElementVisible('css selector', 'confirm-modal .mat-dialog-actions button.mat-primary')
        .click('css selector', 'confirm-modal .mat-dialog-actions button.mat-primary')
        .waitForElementVisible('xpath', '//div[@id="toast-container"]')
        // .waitForElementNotPresent('xpath', '//div[@id="toast-container"]')
        .pause(1000)
        .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
        .assert.not.elementPresent('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]')
        .useCss();
};

ShapesEditorPage.prototype.uploadFile = function (browser, file) {
    browser
        .useCss()
        .waitForElementVisible('shapes-graph-editor-page')
        .waitForElementVisible('shapes-graph-editor-page editor-top-bar')
        .click(this.upload_changes_shapes_graph_button.css)
        .waitForElementVisible('upload-record-modal')
        .waitForElementVisible('upload-record-modal file-input')
        .waitForElementVisible('upload-record-modal button.mat-primary')
        .uploadFile('upload-record-modal file-input input', file)
        .click('upload-record-modal button.mat-primary');
    browser.globals.wait_for_no_spinners(browser);
};

module.exports = { shapesEditorPage: new ShapesEditorPage() };
