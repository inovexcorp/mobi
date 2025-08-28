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

const editorTopBar = 'app-editor-top-bar';
const uploadRecordLogButton = `${editorTopBar} app-upload-record-log button.mat-primary`;
const createBranchButton = `${editorTopBar} button.create-branch`;
const createTagButton = `${editorTopBar} button.create-tag`;
const mergeBranchesButton = `${editorTopBar} button.merge-branch`;
const downloadButton = `${editorTopBar} button.download-record`;
const uploadChangesButton = `${editorTopBar} button.upload-changes`;
const editorRecordSelect = 'app-editor-record-select';
const editorRecordSelectInput = 'app-editor-record-select mat-form-field input';
const editorRecordSelectIcon = 'app-editor-record-select mat-form-field mat-icon';
const editorBranchSelect = 'app-editor-branch-select';
const editorBranchSelectInput = 'app-editor-branch-select mat-form-field input';
const editorBranchSelectIcon = 'app-editor-branch-select mat-form-field mat-icon';
const createRecordButton = '.record-options-select mat-option button.create-record';
const uploadRecordButton = '.record-options-select mat-option button.upload-record';

const editorCommands = {
  openRecordSelect: function(parentEl) {
    return this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorRecordSelect}`)
      .click(`${parentEl} ${editorRecordSelectIcon}`)
      .waitForElementVisible('mat-option');
  },

  createRecord: function(parentEl, title, description) {
    this.openRecordSelect(parentEl)
      .click(createRecordButton)
      .waitForElementVisible('app-new-record-modal')
      .waitForElementVisible('app-new-record-modal mat-form-field input[name="title"]')
      .waitForElementVisible('app-new-record-modal mat-form-field textarea[name="description"]')
      .waitForElementVisible('app-new-record-modal div.mat-dialog-actions button.mat-primary')
      .setValue('app-new-record-modal mat-form-field input[name="title"]', title);
    if (description) {
      this.setValue('app-new-record-modal mat-form-field textarea[name="description"]', description);
    }
    return this
      .click('app-new-record-modal div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('app-new-record-modal div.mat-dialog-actions button:not(.mat-primary)');
  },

  uploadRecord: function(parentEl, file) {
    return this.openRecordSelect(parentEl)
      .click(uploadRecordButton)
      .uploadFile('input[type=file]', file)
      .waitForElementVisible('app-upload-record-modal')
      .waitForElementVisible('app-upload-record-modal div.mat-dialog-actions button.mat-primary')
      .click('app-upload-record-modal div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('app-upload-record-modal div.mat-dialog-actions button:not(.mat-primary)');
  },

  searchForRecord: function(parentEl, title) {
    return this.openRecordSelect(parentEl)
      .sendKeys(`${parentEl} ${editorRecordSelectInput}`, title);
  },

  openRecord: function(parentEl, title) {
    return this.openRecordSelect(parentEl)
      .useXpath()
      .waitForElementVisible(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]/ancestor::mat-option`)
      .click(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]/ancestor::mat-option`)
      .useCss()
      .waitForElementNotPresent('mat-optgroup');
  },

  closeRecord: function(parentEl, title) {
    return this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorRecordSelect}`)
      .click(`${parentEl} ${editorRecordSelectIcon}`)
      .waitForElementVisible('mat-option')
      .useXpath()
      .waitForElementVisible(`//mat-optgroup/span[text()[contains(., "Open")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "${title}")]]/ancestor::mat-option`)
      .waitForElementVisible(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]/following-sibling::button`)
      .click(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]/following-sibling::button`)
      .useCss()
      .waitForElementNotPresent('mat-optgroup');
  },

  openUploadRecordLog: function(parentEl) {
    return this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${uploadRecordLogButton}`)
      .click(`${parentEl} ${uploadRecordLogButton}`)
      .waitForElementVisible('.upload-menu');
  },

  createBranch: function(parentEl, branch_title, branch_description) {
    this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorTopBar}`)
      .click(createBranchButton)
      .waitForElementVisible('app-create-branch-modal')
      .waitForElementVisible('app-create-branch-modal mat-form-field input[name="title"]')
      .waitForElementVisible('app-create-branch-modal mat-form-field textarea[name="description"]')
      .waitForElementVisible('app-create-branch-modal div.mat-dialog-actions button.mat-primary')
      .setValue('app-create-branch-modal mat-form-field input[name="title"]', branch_title);
    if (branch_description) {
      this.setValue('app-create-branch-modal mat-form-field textarea[name="description"]', branch_description);
    }
    return this
      .click('app-create-branch-modal div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('app-create-branch-modal div.mat-dialog-actions button:not(.mat-primary)');
  },

  createTag: function(parentEl, tag_title) {
    return this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorTopBar}`)
      .click(createTagButton)
      .waitForElementVisible('app-create-tag-modal')
      .waitForElementVisible('app-create-tag-modal mat-form-field input[name="title"]')
      .waitForElementVisible('app-create-tag-modal div.mat-dialog-actions button.mat-primary')
      .sendKeys('app-create-tag-modal mat-form-field input[name="title"]', tag_title)
      .click('app-create-tag-modal div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('app-create-tag-modal div.mat-dialog-actions button:not(.mat-primary)');
  },

  openBranchSelect: function(parentEl) {
    return this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorBranchSelect}`)
      .click(`${parentEl} ${editorBranchSelectIcon}`)
      .waitForElementVisible('mat-option')
  },

  switchBranch: function(parentEl, branch_title) {
    return this.openBranchSelect(parentEl)
      .useXpath()
      .waitForElementVisible(`//mat-optgroup//mat-option//span[contains(text(), "${branch_title}")]`)
      .click(`//mat-optgroup//mat-option//span[contains(text(), "${branch_title}")]`)
      .useCss()
      .waitForElementNotPresent('mat-optgroup');
  },

  deleteBranchOrTag: function(parentEl, title, isBranch = true) {
    // TODO: This version ideally would handle switching to MASTER if the user is on the specified branch or tag
    // this.useCss()
    //   .waitForElementVisible(parentEl)
    //   .waitForElementVisible(`${parentEl} app-editor-branch-select`)
    //   .click(`${parentEl} app-editor-branch-select mat-form-field mat-icon`)
    //   .waitForElementVisible('mat-option')
    //   .useXpath()
    //   .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Branches")]]/following::span[@class="mat-option-text"]')
    //   .element(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]/following-sibling::button[contains(@class,"${isBranch ? 'delete-branch' : 'delete-tag'}")]`, function(result) {
    //    // If branch is selected, move to MASTER
    //    if (result.status > -1) {
    //      console.log('====TEST====');
    //      this.useXpath()
    //        .waitForElementVisible('//mat-optgroup//mat-option//span[text()[contains(., "MASTER")]]')
    //        .click('//mat-optgroup//mat-option//span[text()[contains(., "MASTER")]]')
    //        .useCss()
    //        .waitForElementNotPresent('mat-optgroup')
    //        .click('shapes-graph-editor-page app-editor-branch-select mat-form-field mat-icon')
    //        .waitForElementVisible('mat-option')
    //        .useXpath();
    //    }
    //  }.bind(this));
    // return this
    //   .click(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]/following-sibling::button[contains(@class,"${isBranch ? 'delete-branch' : 'delete-tag'}")]`)
    //   .useCss()
    //   .waitForElementVisible('confirm-modal')
    //   .waitForElementVisible('confirm-modal button.mat-primary')
    //   .click('confirm-modal button.mat-primary')
    //   .waitForElementVisible('div#toast-container')
    //   .pause(1000)
    //   .click('shapes-graph-editor-page app-editor-branch-select mat-form-field mat-icon')
    //   .waitForElementVisible('mat-option')
    //   .useXpath()
    //   .assert.not.elementPresent(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]`);
    return this.openBranchSelect(parentEl)
      .useXpath()
      .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Branches")]]/following::span[@class="mat-option-text"]')
      .waitForElementVisible(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]/following-sibling::button[contains(@class,"${isBranch ? 'delete-branch' : 'delete-tag'}")]`)
      .click(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]/following-sibling::button[contains(@class,"${isBranch ? 'delete-branch' : 'delete-tag'}")]`)
      .useCss()
      .waitForElementVisible('confirm-modal')
      .waitForElementVisible('confirm-modal button.mat-primary')
      .click('confirm-modal button.mat-primary')
      .waitForElementVisible('div#toast-container')
      .pause(1000)
      .click(`${parentEl} ${editorBranchSelectIcon}`)
      .waitForElementVisible('mat-option')
      .useXpath()
      .assert.not.elementPresent(`//mat-optgroup//mat-option//span[text()[contains(., "${title}")]]`)
      .useCss()
      .click(editorTopBar); // Closes select
  },

  deleteRecord: function(parentEl, title) {
    // TODO: Pretty sure this is not actually deleting the records and validating
    return this.openRecordSelect(parentEl)
      .useXpath()
      .waitForElementVisible('//mat-optgroup/span[text()[contains(., "Open")]]/following::span[@class="mat-option-text"]')
      .element(`//mat-optgroup/span[text()[contains(., "Open")]]/following::span[@class="mat-option-text"]//span[text()[contains(., "${title}")]]/ancestor::mat-option`, result => {
        // If Record is opened, close it first
        (result.value && result.value.ELEMENT ? this.useXpath() : this.useXpath()
          .waitForElementVisible(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]/following-sibling::button`)
          .click(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]/following-sibling::button`)
          .useCss()
          .waitForElementNotPresent('mat-optgroup')
          .click('shapes-graph-editor-page app-editor-record-select mat-form-field mat-icon')
          .useXpath()
        ).waitForElementVisible(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]/following-sibling::button`)
        .click(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]/following-sibling::button`)
        .useCss()
        .waitForElementVisible('confirm-modal')
        .waitForElementVisible('confirm-modal button.mat-primary')
        .click('confirm-modal button.mat-primary')
        .waitForElementVisible('div#toast-container')
        .pause(1000)
        .click(`${parentEl} ${editorRecordSelectIcon}`)
        .waitForElementVisible('mat-option')
        .useXpath()
        .assert.not.elementPresent(`//mat-optgroup//mat-option//span[contains(text(), "${title}")]`)
      });
  },

  uploadChanges: function(parentEl, file) {
    return this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorTopBar}`)
      .click(uploadChangesButton)
      .waitForElementVisible('app-upload-changes-modal')
      .waitForElementVisible('app-upload-changes-modal file-input')
      .waitForElementVisible('app-upload-changes-modal div.mat-dialog-actions button.mat-primary')
      .uploadFile('app-upload-changes-modal file-input input', file)
      .click('app-upload-changes-modal div.mat-dialog-actions button.mat-primary')
      .waitForElementNotPresent('app-create-branch-modal div.mat-dialog-actions button:not(.mat-primary)');
  },

  commit: function(parentEl, message, error_message = '') {
    this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorTopBar}`)
      // Pause added because otherwise the modal was closing before it could be found for some reason
      .pause(1000)
      .click(`${parentEl} ${editorTopBar} button.commit`)
      .waitForElementVisible('app-commit-modal')
      .waitForElementVisible('app-commit-modal textarea')
      .waitForElementVisible('app-commit-modal div.mat-dialog-actions button.mat-primary')
      .sendKeys('app-commit-modal textarea', message)
    if (error_message) {
      this.useCss()
        .click('app-commit-modal div.mat-dialog-actions button.mat-primary')
        .useXpath()
        .expect.element('//app-commit-modal//error-display//p[text() [contains(., "' + error_message + '")]]').to.be.visible;
      return browser.click('//app-commit-modal//button/span[text() [contains(., "Cancel")]]')
        .useCss()
        .waitForElementNotPresent('app-commit-modal div.mat-dialog-actions button:not(.mat-primary)');
    } else {
      return this.useCss()
        .click('app-commit-modal div.mat-dialog-actions button.mat-primary')
        .waitForElementNotPresent('app-commit-modal div.mat-dialog-actions button:not(.mat-primary)');
    }
  },

  toggleChangesPage: function(parentEl, open = true) {
    this.useCss()
      .waitForElementVisible(parentEl)
      .waitForElementVisible(`${parentEl} ${editorTopBar}`)
      .click('app-editor-top-bar button.changes');
    if (open) {
      return this.waitForElementVisible('app-changes-page');
    } else {
      return this.waitForElementNotPresent('app-changes-page');
    }
  },

  editIri: function(parentEl, newIriEnd, iriBegin = '') {
    this.useCss()
      .waitForElementVisible(parentEl)
      .moveToElement(`${parentEl}`, 0, 0) // The 'Copy Iri' tooltip makes the click on edit button not work
      .pause(200) // let DOM settle
      .useXpath()
      .waitForElementVisible(`//${parentEl}//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]`)
      .click(`//${parentEl}//static-iri//div[contains(@class, "static-ir")]//span//a//i[contains(@class, "fa-pencil")]`)
      .waitForElementVisible('//edit-iri-overlay')
      .waitForElementVisible("//edit-iri-overlay//h1[text() [contains(., 'Edit IRI')]]")
      .useCss()
      .pause(1000) // To avoid clashes with autofocusing
      .setValue('edit-iri-overlay input[name=iriEnd]', newIriEnd)

    if (iriBegin) {
      this.useCss().setValue('edit-iri-overlay input[name=iriBegin]', iriBegin)
    }
    return this.useXpath()
      .click("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
      .waitForElementNotPresent('//edit-iri-overlay')
      .assert.not.elementPresent("//edit-iri-overlay//button/span[text() [contains(., 'Submit')]]")
  },

  verifyStaticIriValue: function(parentEl, iriBegin, iriEnd) {
    this.useCss()
      .waitForElementVisible(parentEl)
    this.api.useXpath()
      .waitForElementVisible(`//${parentEl}//selected-details//static-iri`);
    this.expect.element(`//${parentEl}//selected-details//static-iri//strong//span[text()[contains(., "${iriBegin}")]]`).to.be.visible;
    this.expect.element(`//${parentEl}//selected-details//static-iri//strong//span[text()[contains(., "${iriEnd}")]]`).to.be.visible;
    return this.api
  },

  verifyUncommittedChanges: function(parentEl, shouldBeVisible) {
    this.useCss()
      .waitForElementVisible(parentEl)
    if (shouldBeVisible) {
      this.api.useXpath()
        .expect.element(`//${parentEl}//app-editor-top-bar//mat-chip-list//mat-chip[text()[contains(., "Uncommitted Changes")]]`).to.be.visible;
    } else {
      this.api.useXpath()
        .assert.not.elementPresent(`//${parentEl}//app-editor-top-bar//mat-chip-list//mat-chip[text()[contains(., "Uncommitted Changes")]]`);
    }
    return this;
  },

  verifyChangePageCommitNum: function(parentEl, number) {
    this.useCss()
      .waitForElementVisible(parentEl);
    if (number === 0) {
      return this.useCss()
        .assert.not.elementPresent('app-changes-page mat-expansion-panel')
        .assert.textContains('app-changes-page info-message p', 'No Changes to Display');
    } else {
      return this.useCss()
        .waitForElementVisible('app-changes-page div.changes-info button.mat-warn')
        // For some reason Nightwatch really wanted to see the selector as XPath...
        .expect.elements({
          selector: 'app-changes-page mat-expansion-panel',
          locateStrategy: 'css selector'
        }).count.to.equal(number);
    }
  }
}

module.exports = {
  elements: {
    createBranchButton: createBranchButton,
    createTagButton: createTagButton,
    mergeBranchesButton: mergeBranchesButton,
    downloadButton: downloadButton,
    uploadChangesButton: uploadChangesButton,
    editorRecordSelect: editorRecordSelect,
    editorRecordSelectInput: editorRecordSelectInput,
    editorRecordSelectIcon: editorRecordSelectIcon,
    editorBranchSelect: editorBranchSelect,
    editorBranchSelectInput: editorBranchSelectInput,
    editorBranchSelectIcon: editorBranchSelectIcon,
    createRecordButton: createRecordButton,
    uploadRecordButton: uploadRecordButton
  },
  commands: [editorCommands],
}

