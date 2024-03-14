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
const create_shapes_graph_branch_button = 'shapes-graph-editor-page editor-top-bar button.create-branch';
const upload_changes_shapes_graph_button = 'shapes-graph-editor-page editor-top-bar button.upload-changes';

const shapesEditorCommands = {
    createShapesGraph: function(title, shapes_file) {
        return this.useCss()
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
    },

    openShapesGraph: function(title) {
        return this.useCss()
            .waitForElementVisible('shapes-graph-editor-page editor-record-select')
            .click('shapes-graph-editor-page editor-record-select')
            .useXpath()
            .pause(1000)
            .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option')
            .click('//mat-optgroup/span[text()[contains(., "Unopened")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "' + title + '")]]/ancestor::mat-option');
    },

    createBranch: function(branch_title) {
        return this.useCss()
            .waitForElementVisible('shapes-graph-editor-page')
            .waitForElementVisible('shapes-graph-editor-page editor-top-bar')
            .click(create_shapes_graph_branch_button)
            .waitForElementVisible('create-branch-modal')
            .waitForElementVisible('create-branch-modal mat-form-field input')
            .waitForElementVisible('create-branch-modal button.mat-primary')
            .sendKeys('xpath','//create-branch-modal//mat-form-field[1]//input', branch_title)
            .click('create-branch-modal button.mat-primary');
    },

    deleteShapesGraph: function(title) {
        return this.useCss()
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
            .pause(1000)
            .click('css selector', 'shapes-graph-editor-page editor-record-select  mat-form-field mat-icon')
            .assert.not.elementPresent('//mat-optgroup//mat-option//span[contains(text(), "'+title+'")]')
    },

    upload: function(file) {
        browser
            .useCss()
            .waitForElementVisible('shapes-graph-editor-page')
            .waitForElementVisible('shapes-graph-editor-page editor-top-bar')
            .click(upload_changes_shapes_graph_button)
            .waitForElementVisible('upload-record-modal')
            .waitForElementVisible('upload-record-modal file-input')
            .waitForElementVisible('upload-record-modal button.mat-primary')
            .uploadFile('upload-record-modal file-input input', file)
            .click('upload-record-modal button.mat-primary');
    },
}

module.exports = {
    elements: {
        create_branch_button: create_shapes_graph_branch_button,
        upload_changes_button: upload_changes_shapes_graph_button
    },
    commands: [shapesEditorCommands]
}
