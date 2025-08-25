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
const parentEl = 'shapes-graph-editor-page';
const nodeShapesTab = 'app-node-shapes-tab';
const nodeShapesListEl = `${nodeShapesTab} app-node-shapes-list`;
const nodeShapesDisplay = `${nodeShapesTab} app-node-shapes-display`;

const propertyValues = `${parentEl} property-values`;
const nodeItemSelectorXpath = `//${parentEl}//${nodeShapesTab}//app-node-shapes-list//cdk-virtual-scroll-viewport//app-node-shapes-item`;
const nodeShapesSearchBar = `${nodeShapesListEl} search-bar`;
const nodeShapesList = `${nodeShapesListEl} cdk-virtual-scroll-viewport`;
// Shacl Target Selectors
const parentShaclTarget = 'app-node-shapes-display app-shacl-target';
const shaclTargetEditButton = `${parentShaclTarget} button:has(i.fa-pencil)`;
const shaclTargetSaveButton = `${parentShaclTarget} button.save-button`;
const shaclTargetForm = `${parentShaclTarget} form.shacl-target-form`;
const targetRadioGroup = `${shaclTargetForm} mat-radio-group.target-type-select`;
const targetRadioButtonLabel = `${targetRadioGroup} mat-radio-button.mat-radio-checked .mat-radio-label-content`;
const targetValueInput = `${shaclTargetForm} .target-input input`;
const targetValueLabel = `${shaclTargetForm} mat-form-field:has(input) mat-label`;

const addPropertyShapeButton = `${nodeShapesDisplay} app-property-shapes-display .section-header a.fa`;
const addPropertyShapeModal = 'app-add-property-shape-modal';
const addPropertyShapeModalSubmit = `${addPropertyShapeModal} .mat-dialog-actions button.mat-primary`;
const pathConfigurationContainer = `${addPropertyShapeModal} .path-configuration`;
const pathConfigurationContainerXpath = `//${addPropertyShapeModal}//div[contains(@class, "path-configuration")]`;
const constraintSelect = `${addPropertyShapeModal} .constraint-content mat-select`;
const propertyShapeNameInput = `${addPropertyShapeModal} mat-form-field input[formControlName="name"]`;
const propertyShapeMessageInput = `${addPropertyShapeModal} mat-form-field input[formControlName="message"]`;
const addPathNodeModal = 'app-add-path-node-modal';

function getPropertyShapeSelector(idOrIdx) {
  if (typeof idOrIdx === 'number') {
    return `//app-node-shapes-tab//app-node-shapes-display//app-property-shapes-display//mat-card[${idOrIdx}]`
  } else {
    return `//app-node-shapes-tab//app-node-shapes-display//app-property-shapes-display//mat-card//mat-card-title//h5[text()[contains(., "${idOrIdx}")]]`;
  }
}

const shapesEditorCommands = {
  openRecordSelect: function() {
    return this.api.page.editorPage().openRecordSelect(parentEl);
  },

  createShapesGraph: function(title, description) {
    return this.api.page.editorPage().createRecord(parentEl, title, description);
  },

  uploadShapesGraph: function(shapes_file) {
    return this.api.page.editorPage().uploadRecord(parentEl, shapes_file);
  },

  searchForShapesGraph: function(title) {
    return this.api.page.editorPage().searchForRecord(parentEl, title);
  },

  openShapesGraph: function(title) {
    return this.api.page.editorPage().openRecord(parentEl, title);
  },

  closeShapesGraph: function(title) {
    return this.api.page.editorPage().closeRecord(parentEl, title);
  },

  openUploadRecordLog: function() {
    return this.api.page.editorPage().openUploadRecordLog(parentEl);
  },

  createBranch: function(branch_title, branch_description) {
    return this.api.page.editorPage().createBranch(parentEl, branch_title, branch_description);
  },

  createTag: function(tag_title) {
    return this.api.page.editorPage().createTag(parentEl, tag_title);
  },

  openBranchSelect: function() {
    return this.api.page.editorPage().openBranchSelect(parentEl);
  },

  switchBranch: function(branch_title) {
    return this.api.page.editorPage().switchBranch(parentEl, branch_title);
  },

  deleteBranchOrTag: function(title, isBranch = true) {
    return this.api.page.editorPage().deleteBranchOrTag(parentEl, title, isBranch);
  },

  deleteShapesGraph: function(title) {
    return this.api.page.editorPage().deleteRecord(parentEl, title);
  },

  uploadChanges: function(file) {
    return this.api.page.editorPage().uploadChanges(parentEl, file);
  },

  commit: function(message, error_message = '') {
    return this.api.page.editorPage().commit(parentEl, message, error_message);
  },

  toggleChangesPage: function(open = true) {
    return this.api.page.editorPage().toggleChangesPage(parentEl, open);
  },

  editIri: function(newIriEnd, iriBegin = '') {
    return this.api.page.editorPage().editIri(parentEl, newIriEnd, iriBegin);
  },

  verifyStaticIriValue: function(iriBegin, iriEnd) {
    return this.api.page.editorPage().verifyStaticIriValue(parentEl, iriBegin, iriEnd);
  },

  verifyUncommittedChanges: function(shouldBeVisible) {
    return this.api.page.editorPage().verifyUncommittedChanges(parentEl, shouldBeVisible);
  },

  verifyChangePageCommitNum: function(number) {
    return this.api.page.editorPage().verifyChangePageCommitNum(parentEl, number);
  }
};

const projectTabCommands = {
  verifyShapesEditorPage: function(shapes_graph_title, branchTitle) {
    return this.api
      .waitForElementVisible('selected-details')
      .waitForElementVisible('properties-block')
      .waitForElementVisible('div.yate')
      .page.editorPage()
      .assert.valueEquals('@editorRecordSelectInput', shapes_graph_title)
      .assert.valueEquals('@editorBranchSelectInput', branchTitle);
  },
};

/**
 * Commands specific to interacting with the Node Shapes Tab within the Shapes Graph Editor.
 */
const nodeShapesTabCommands = {
  switchToNodeShapesTab: function() {
    return this
      .useXpath()
      .waitForElementVisible('//app-shapes-tabs-holder//mat-tab-group//div[text()[contains(., "Node Shapes")]]')
      .click('//app-shapes-tabs-holder//mat-tab-group//div[text()[contains(., "Node Shapes")]]')
      .waitForElementVisible('//app-node-shapes-tab')
      .api.globals.wait_for_no_spinners(this);
  },

  verifyNodeShapesTab: function() {
    return this.useCss()
      .assert.visible(nodeShapesList)
      .assert.visible(nodeShapesSearchBar);
  },

  verifyNodeShapesNum: function(num) {
    return this.useCss()
      .assert.elementsCount(`${nodeShapesList} app-node-shapes-item`, num);
  },

  searchNodeShapes: function(searchText) {
    this.verifyNodeShapesTab();
    return this.useCss()
      .click(nodeShapesSearchBar)
      .setValue(`${nodeShapesSearchBar} input`, searchText)
      .sendKeys(`${nodeShapesSearchBar} input`, browser.Keys.ENTER)
      .api.globals.wait_for_no_spinners(this);
  },

  verifyNodeShapeListItem: function(nodeShape) {
    return this.api
      .useXpath()
      .assert.visible(`${nodeItemSelectorXpath}//h4[text()[contains(.,'${nodeShape.title}')]]`)
      .assert.visible(`${nodeItemSelectorXpath}//small[text()[contains(.,'${nodeShape.iri}')]]`)
      .assert.visible(`${nodeItemSelectorXpath}//small[text()[contains(.,'${nodeShape.target}')]]`)
      .assert.visible(`${nodeItemSelectorXpath}//small[text()[contains(.,'${nodeShape.type}')]]`)
      .assert.visible(`${nodeItemSelectorXpath}//small[text()[contains(.,'${nodeShape.imported}')]]`)
  },

  selectNodeShape: function(nodeShapeTitle) {
    this.useXpath()
      .waitForElementVisible(`${nodeItemSelectorXpath}//h4[text()[contains(.,'${nodeShapeTitle}')]]`)
      .click(`${nodeItemSelectorXpath}//h4[text()[contains(.,'${nodeShapeTitle}')]]`)
      .api.globals.wait_for_no_spinners(this);
    return this.useXpath()
      .waitForElementVisible(`//app-node-shapes-display//div[contains(@class, "selected-heading")]//span[text()[contains(.,"${nodeShapeTitle}")]]`);
  },

  verifyPropertyShapesNum: function(num) {
    return this.useCss()
      .waitForElementVisible(`${nodeShapesDisplay} app-property-shapes-display`)
      .assert.elementsCount(`${nodeShapesDisplay} app-property-shapes-display .property-shape`, num);
  },

  verifyPropertyShapeDisplay: function(idOrIdx, pathString, numConstraints) {
    const selector = getPropertyShapeSelector(idOrIdx);
    return this.useCss()
      .waitForElementVisible(`${nodeShapesDisplay} app-property-shapes-display`)
      .useXpath()
      .waitForElementVisible(selector)
      .assert.textContains(`${selector}//ancestor::mat-card//div[contains(@class, "path-display")]`, pathString)
      .assert.elementsCount(`${selector}//ancestor::mat-card//div[contains(@class, "constraint")]`, numConstraints);
  },

  removePropertyShape: function(idOrIdx) {
    const selector = getPropertyShapeSelector(idOrIdx);
    return this.useCss()
      .waitForElementVisible(`${nodeShapesDisplay} app-property-shapes-display`)
      .useXpath()
      .waitForElementVisible(selector)
      .waitForElementVisible(`${selector}//ancestor::mat-card-actions//button[contains(@class, "mat-warn")]`)
      .click(`${selector}//ancestor::mat-card-actions//button[contains(@class, "mat-warn")]`)
      .useCss()
      .waitForElementVisible('confirm-modal')
      .waitForElementVisible('confirm-modal button.mat-primary')
      .click('confirm-modal button.mat-primary')
      .useCss()
      .api.globals.wait_for_no_spinners(this);
  }
};

/**
 * Commands specific to the AddPropertyShapeModalComponent
 */
const addPropertyShapeCommands = {
  openAddPropertyShapeModal: function() {
    return this.useCss()
      .waitForElementVisible(`${nodeShapesDisplay} app-property-shapes-display`)
      .waitForElementVisible(addPropertyShapeButton)
      .click(addPropertyShapeButton)
      .waitForElementVisible(addPropertyShapeModal)
      .api.globals.wait_for_no_spinners(this);
  },

  verifyPathConfiguration: function(num) {
    return this.useCss()
      .waitForElementVisible(pathConfigurationContainer)
      .assert.elementsCount(`${pathConfigurationContainer} mat-card`, num);
  },

  clickPathButton: function(propName, onBottom=true) {
    const hoverZoneClass = onBottom ? 'card-bottom-hover-zone' : 'card-right-hover-zone';
    const hoverZoneSelector = `${pathConfigurationContainerXpath}//mat-card//mat-card-subtitle[text()[contains(., "${propName}")]]` 
      + `//following-sibling::app-add-path-node-hover-button//div[contains(@class, "${hoverZoneClass}")]`;
    return this.useCss()
      .waitForElementVisible(pathConfigurationContainer)
      .useXpath()
      .waitForElementVisible(`${pathConfigurationContainerXpath}//mat-card//mat-card-subtitle[text()[contains(., "${propName}")]]`)
      .moveToElement(hoverZoneSelector, 0, 0)
      .waitForElementVisible(`${hoverZoneSelector}//button`)
      .click(`${hoverZoneSelector}//button`)
      .useCss()
      .waitForElementVisible(addPathNodeModal)
      .api.globals.wait_for_no_spinners(this);
  },

  submitAddPathNodeModal: function(propName, inverse=false, cardinalityOption='None') {
    this.useCss()
      .waitForElementVisible(addPathNodeModal)
      .waitForElementVisible(`${addPathNodeModal} app-shacl-single-suggestion-input[formcontrolname="property"] mat-form-field input`)
      .setValue(`${addPathNodeModal} app-shacl-single-suggestion-input[formcontrolname="property"] mat-form-field input`, propName)
      .useXpath()
      .waitForElementVisible(`//mat-optgroup//mat-option//span[text()[contains(.,"${propName}")]]`)
      .click(`//mat-optgroup//mat-option//span[text()[contains(.,"${propName}")]]`);

    if (inverse) {
      this.useCss()
        .waitForElementVisible(`${addPathNodeModal} mat-checkbox span`)
        .click(`${addPathNodeModal} mat-checkbox span`)
    }
    if (cardinalityOption != 'None') {
      this.useCss()
        .waitForElementVisible(`${addPathNodeModal} mat-button-toggle-group`)
        .useXpath()
        .waitForElementVisible(`//${addPathNodeModal}//mat-button-toggle-group//button//span[text()[contains(.,"${cardinalityOption}")]]`)
        .click(`//${addPathNodeModal}//mat-button-toggle-group//button//span[text()[contains(.,"${cardinalityOption}")]]`)
    }
    return this.useCss()
      .waitForElementVisible(`${addPathNodeModal} div.mat-dialog-actions button.mat-primary`)
      .click(`${addPathNodeModal} div.mat-dialog-actions button.mat-primary`)
      .waitForElementNotPresent(`${addPathNodeModal} div.mat-dialog-actions button.mat-primary`)
  },

  toggleConstraint: function(constraintName) {
    return this.useCss()
      .waitForElementVisible(constraintSelect)
      .click(constraintSelect)
      .useXpath()
      .waitForElementVisible(`//mat-option//span[text()[contains(., "${constraintName}")]]`)
      .click(`//mat-option//span[text()[contains(., "${constraintName}")]]`)
      .click('//body') // Click body to close the select options
      .waitForElementNotPresent(`//mat-option//span[text()[contains(., "${constraintName}")]]`)
  },

  submitAddPropertyShapeModal: function() {
    return this.useCss()
      .waitForElementVisible(addPropertyShapeModal)
      .waitForElementVisible(addPropertyShapeModalSubmit)
      .click(addPropertyShapeModalSubmit)
      .waitForElementNotPresent(addPropertyShapeModalSubmit)
      .api.globals.wait_for_no_spinners(this);
  }
};

/**
 * Commands specific to <app-shacl-target>
 */
const shaclTargetCommands = {
  /**
    * Verifies the details displayed in the SHACL Target section for a selected Node Shape.
    * @param {string} expectedTargetTypeLabel - The expected label of the selected target type. 'Target Class', 'Target Node'. etc
    * @param {string} expectedInputLabelText - The expected text displayed in the mat-label for the target value input field.
    * @param {string} expectedTargetValue - The expected value displayed in the target input field.
    * @param {boolean} expectedToBeDisabled - True if the form fields are expected to be disabled (non-editable); false otherwise.
    * @returns {object} The Nightwatch.js API object for chaining.
    */
  verifyTargetSectionForNodeShape: function(expectedTargetTypeLabel, expectedInputLabelText, expectedTargetValue, expectedToBeDisabled) {
    this.useCss()
      .waitForElementVisible('@shaclTargetForm', 'Expected SHACL Target form to be visible')
      .assert.visible('@targetRadioGroup', 'Expected Target radio group to be visible');
    this.useCss()
      .waitForElementVisible('@targetRadioButtonLabel', 'Expected a checked radio button label to be visible')
      .assert.textEquals('@targetRadioButtonLabel', expectedTargetTypeLabel);
    this.useCss()
      .waitForElementVisible('@targetValueLabel', 'Expected Target Value input label to be visible')
      .assert.textEquals('@targetValueLabel', expectedInputLabelText);
    this.useCss()
      .waitForElementVisible('@targetValueInput', 'Expected Target Value input field to be visible')
      .assert.attributeContains('@targetValueInput', 'value', expectedTargetValue);
    if (expectedToBeDisabled) {
      this.assert.attributeContains('@targetValueInput', 'disabled', 'true');
    } else {
      this.assert.attributeContains('@targetValueInput', 'disabled', 'false');
    }
    // PlaceHolder: Verify the 'Edit' button if applicable
    // browser.assert.elementPresent('.shacl-target .edit-button', 'Expected Edit button to be present');
    // browser.assert.visible('.shacl-target .edit-button', 'Expected Edit button to be visible');
    return this.api;
  }
  // TODO add editing commands
};

module.exports = {
  elements: {
    propertyValues: propertyValues,
    nodeShapesList: nodeShapesList,
    nodeShapesSearchBar: nodeShapesSearchBar,
    nodeShapesDisplay: nodeShapesDisplay,
    // Property Shapes
    addPropertyShapeButton: addPropertyShapeButton,
    addPropertyShapeModal: addPropertyShapeModal,
    addPropertyShapeModalSubmit: addPropertyShapeModalSubmit,
    constraintSelect: constraintSelect,
    propertyShapeNameInput: propertyShapeNameInput,
    propertyShapeMessageInput: propertyShapeMessageInput,
    // Shacl Target Selectors
    shaclTargetForm: shaclTargetForm,
    shaclTargetEditButton: shaclTargetEditButton,
    shaclTargetSaveButton: shaclTargetSaveButton,
    targetRadioGroup: targetRadioGroup,
    targetRadioButtonLabel: targetRadioButtonLabel,
    targetValueLabel: targetValueLabel,
    targetValueInput: targetValueInput
  },
  commands: [
    shapesEditorCommands,
    projectTabCommands,
    nodeShapesTabCommands,
    addPropertyShapeCommands,
    shaclTargetCommands
  ]
}
