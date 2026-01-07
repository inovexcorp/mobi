/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
// app-shape-button-stack selectors
const buttonStackCreateNodeShape = 'app-shape-button-stack button.create-node-shape-overlay';
// app-create-node-shape-modal selectors
const createNodeShapeModal = 'app-create-node-shape-modal';
const createNodeShapeModalTitle = 'app-create-node-shape-modal h1.mat-dialog-title';
const createNodeShapeModalContent = 'app-create-node-shape-modal div.mat-dialog-content';
const createNodeShapeTitleInput = 'app-create-node-shape-modal input[formcontrolname="title"]';
const createNodeShapeDescriptionInput = 'app-create-node-shape-modal textarea[formcontrolname="description"]';
const createNodeShapeModalActions = 'app-create-node-shape-modal div.mat-dialog-actions';
const createNodeShapeSubmitButton = 'app-create-node-shape-modal button.submit-button';
const createNodeShapeCancelButton = 'app-create-node-shape-modal button.cancel-button';
// Shacl Target Selectors
const parentShaclTarget = 'app-shacl-target';
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
 * 
 * - switchToNodeShapesTab: Navigates to the Node Shapes tab and waits for it to load.
 * - verifyNodeShapesTab: Confirms the main list and search bar are visible.
 * - verifyNodeShapesNum: Asserts the number of node shapes displayed.
 * - searchNodeShapes: Searches for node shapes by text input.
 * - verifyNodeShapeListItem: Verifies a node shape’s title, IRI, target, type, and import status.
 * - selectNodeShape: Selects a node shape from the list and verifies it is displayed.
 * - verifyPropertyShapesNum: Asserts the number of property shapes in the display.
 * - verifyPropertyShapeDisplay: Verifies a property shape’s path and constraint count.
 * - removePropertyShape: Removes a property shape and confirms removal.
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

  verifyPropertyDisplay: function(count, properties) {
    return this.api.page.editorPage().verifyPropertyDisplay(parentEl, count, properties);
  },

  addNewProperty: function(property) {
    return this.api.page.editorPage().addNewProperty(parentEl, property);
  },

  editProperty: function(propertyValue, newValue) {
    return this.api.page.editorPage().editProperty(parentEl, propertyValue, newValue);
  },

  removeProperty: function(propertyValue) {
    return this.api.page.editorPage().removeProperty(parentEl, propertyValue);
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
    const hoverZoneSelector = `${pathConfigurationContainerXpath}//mat-card//mat-card-subtitle[text()[contains(., "${propName}")]]` +
      `//following-sibling::app-add-path-node-hover-button//div[contains(@class, "${hoverZoneClass}")]`;
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
 * 
 * Available Options:
 * - Specific Instance (targetNode)
 * - Types of Instance (targetClass)
 * - Object of (targetObjectOf)
 * - Subject of (targetSubjectOf)
 * - Implicit
 */
const shaclTargetCommands = {
  /**
    * Verifies the details displayed in the SHACL Target section for a selected Node Shape.
    * @param {string} expectedTargetTypeLabel The expected label of the selected target type. 'Target Class', 'Target Node'. etc
    * @param {string} expectedInputLabelText The expected text displayed in the mat-label for the target value input field.
    * @param {string} expectedTargetValue The expected value displayed in the target input field.
    * @param {boolean} expectedToBeDisabled True if the form fields are expected to be disabled (non-editable); false otherwise.
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
  },

  /**
   * Clicks the Edit button in the SHACL Target form.
   * @returns {object} The Nightwatch.js API object for chaining.
   */
  clickEditButton: function() {
    return this.useCss()
      .waitForElementVisible('@shaclTargetEditButton', 'Expected Edit button to be visible')
      .click('@shaclTargetEditButton');
  },

  /**
   * Selects a target type by its label text (e.g., 'Specific Instance', 'Target Class').
   * @param {string} labelText The visible label of the radio button to select.
   * @returns {object} The Nightwatch.js API object for chaining.
   */
  selectTargetType: function(labelText) {
    return this.useXpath()
      .waitForElementVisible(`//mat-radio-button[contains(., "${labelText}")]`, `Expected radio button "${labelText}" to be visible`)
      .click(`//mat-radio-button[contains(., "${labelText}")]`)
      .useCss();
  },

  /**
   * Sets the Target Value input field.
   * @param {string} value The IRI or value to set.
   * @returns {object} The Nightwatch.js API object for chaining.
   */
  setTargetValue: function(value) {
    return this.useCss()
      .waitForElementVisible('@targetValueInput', 'Expected Target Value input to be visible')
      .clearValue('@targetValueInput')
      .setValue('@targetValueInput', value);
  },

  /**
   * Clicks the Save button in the SHACL Target form.
   * @returns {object} The Nightwatch.js API object for chaining.
   */
  clickSaveButton: function() {
    return this.useCss()
      .waitForElementVisible('@shaclTargetSaveButton', 'Expected Save button to be visible')
      .assert.enabled('@shaclTargetSaveButton', 'Expected Save button to be enabled')
      .click('@shaclTargetSaveButton');
  },

  /**
   * Edits the SHACL Target by selecting type and setting value.
   * @param {string} targetTypeLabel Radio button label to select (e.g., 'Specific Instance').
   * @param {string} targetValue The value to set for the target.
   * @param {boolean} isLiveMode Form is in live mode. Live mode does not have edit/save buttons.
   * @returns {object} The Nightwatch.js API object for chaining.
   */
  editShaclTarget: function(targetTypeLabel, targetValue, isLiveMode=false) {
    const allowedLabels = [
      'Specific Instance', // targetNode
      'Types of Instance', // targetClass
      'Object of', // targetObjectOf
      'Subject of', // targetSubjectOf
      'Implicit' // implicit
    ];
    if (!allowedLabels.includes(targetTypeLabel)) {
      this.assert.fail(
        `Invalid targetTypeLabel ${targetTypeLabel}. Must be one of: ${allowedLabels.join(', ')}`
      );
      return this.api;
    }
    let chain = this;
    if (!isLiveMode) {
      chain = chain.clickEditButton();
    }
    chain.selectTargetType(targetTypeLabel);
    if (targetTypeLabel !== 'Implicit') {
      chain = chain.setTargetValue(targetValue);
    }
    if (!isLiveMode) {
      return chain.clickSaveButton();
    } else {
      return chain.pause(200); // time for change detection to work
    }
  }
};

/**
 * Commands specific to <app-create-node-shape-modal>
 * 
 * - openCreateNodeShapeModal: Opens the modal, verifies it is open, and confirms the submit button is initially disabled.
 * - verifyModalIsOpen: Confirms all key modal elements are visible and have correct text.
 * - verifySubmitButtonState: Checks whether the submit button is enabled or disabled.
 * - setTitle: Sets the node shape title in the modal.
 * - setDescription: Sets the node shape description in the modal.
 * - setShaclTarget: Selects a SHACL target type and enters a target value.
 * - clickSubmit: Clicks the submit button, waits for the modal to close, and waits for any spinners to disappear.
 * - clickCancel: Clicks the cancel button and waits for the modal to close.
 * - createNodeShape: Fills in all modal fields and submits the form as a single composite action.
 */
const createNodeShapeModalCommands = {

  openCreateNodeShapeModal: function() {
    return this.useCss()
      .click('@buttonStackCreateNodeShape')
      .verifyModalIsOpen()
      .verifySubmitButtonState(false); // Verify submit is disabled initially as title is required
  },

  verifyModalIsOpen: function() {
    return this.useCss()
      .waitForElementVisible('@createNodeShapeModal')
      .assert.visible('@createNodeShapeModal', 'Create Node Shape modal is visible')
      .waitForElementVisible('@createNodeShapeModalTitle')
      .assert.textContains('@createNodeShapeModalTitle', 'Create Node Shape')
      .waitForElementPresent('@createNodeShapeModalContent')
      .waitForElementPresent('@createNodeShapeModalActions');
  },

  verifySubmitButtonState: function(shouldBeEnabled) {
    const state = shouldBeEnabled ? 'enabled' : 'disabled';
    return this.useCss()
      .waitForElementVisible('@createNodeShapeSubmitButton', `Submit button is visible and should be ${state}`)
      .getAttribute('@createNodeShapeSubmitButton', 'disabled', function(result) {
        if (shouldBeEnabled) {
          this.assert.ok(result.value === null, `Submit button should be enabled.`);
        } else {
          this.assert.ok(result.value !== null, `Submit button should be disabled.`);
        }
      });
  },

  setTitle: function(title) {
    return this.useCss()
      .waitForElementVisible('@createNodeShapeTitleInput')
      .clearValue('@createNodeShapeTitleInput')
      .setValue('@createNodeShapeTitleInput', title);
  },

  setDescription: function(description) {
    return this.useCss()
      .waitForElementVisible('@createNodeShapeDescriptionInput')
      .clearValue('@createNodeShapeDescriptionInput')
      .setValue('@createNodeShapeDescriptionInput', description);
  },

  clickSubmit: function() {
    return this.useCss()
      .waitForElementVisible('@createNodeShapeSubmitButton')
      .verifySubmitButtonState(true)
      .click('@createNodeShapeSubmitButton')
      .waitForElementNotPresent('@createNodeShapeModal') // Wait for modal to close
      .api.globals.wait_for_no_spinners(this);
  },

  clickCancel: function() {
    return this.useCss()
      .waitForElementVisible('@createNodeShapeCancelButton')
      .click('@createNodeShapeCancelButton')
      .waitForElementNotPresent('@createNodeShapeModal'); // Wait for modal to close
  },

  /**
   * A composite command to fill the entire "Create Node Shape" form and submit it.
   * Note: IRI editing
   * @param {object} shapeDetails An object containing node shape details.
   * @param {string} shapeDetails.title The title for the node shape.
   * @param {string} shapeDetails.description The description for the node shape.
   * @param {object} shapeDetails.target The SHACL target details.
   * @param {string} shapeDetails.target.type The target type (e.g., 'Target Class').
   * @param {string} shapeDetails.target.value The target value (e.g., an IRI or literal).
   */
  createNodeShape: function(shapeDetails) {
    this.verifyModalIsOpen()
      .setTitle(shapeDetails.title)
      .setDescription(shapeDetails.description);
    if (shapeDetails.target && shapeDetails.target.type) {
      this.editShaclTarget(shapeDetails.target.type, shapeDetails.target.value, true)
    }
    return this.clickSubmit();
  }
};

module.exports = {
  elements: {
    propertyValues: propertyValues,
    nodeShapesList: nodeShapesList,
    nodeShapesSearchBar: nodeShapesSearchBar,
    nodeShapesDisplay: nodeShapesDisplay,
    // app-shape-button-stack selectors
    buttonStackCreateNodeShape: buttonStackCreateNodeShape,
    // app-create-node-shape-modal selectors
    createNodeShapeModal: createNodeShapeModal,
    createNodeShapeModalTitle: createNodeShapeModalTitle,
    createNodeShapeModalContent: createNodeShapeModalContent,
    createNodeShapeTitleInput: createNodeShapeTitleInput,
    createNodeShapeDescriptionInput: createNodeShapeDescriptionInput,
    createNodeShapeModalActions: createNodeShapeModalActions,
    createNodeShapeSubmitButton: createNodeShapeSubmitButton,
    createNodeShapeCancelButton: createNodeShapeCancelButton,
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
    shaclTargetCommands,
    createNodeShapeModalCommands,
    addPropertyShapeCommands,
    shaclTargetCommands
  ]
}
