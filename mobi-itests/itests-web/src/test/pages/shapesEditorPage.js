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
    return this.api.page.editorPage().createBranch(parentEl, branch_title);
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

  commit: function(message) {
    return this.api.page.editorPage().commit(parentEl, message);
  },

  toggleChangesPage: function(open = true) {
    return this.api.page.editorPage().toggleChangesPage(parentEl, open);
  },

  //TODO placeholder until we consolidate two different spots for editing IRI
  editIri: function(newIriEnd) {
    return this.api.page.editorPage().editIri(parentEl, newIriEnd);
  },
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

const nodeShapesTabCommands = {
  switchToNodeShapesTab: function() {
    return this
      .useXpath()
      .waitForElementVisible('//app-shapes-tabs-holder//mat-tab-group//div[text()[contains(., "Node Shapes")]]')
      .click('//app-shapes-tabs-holder//mat-tab-group//div[text()[contains(., "Node Shapes")]]')
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
  }
};

module.exports = {
  elements: {
    propertyValues: propertyValues,
    nodeShapesList: nodeShapesList,
    nodeShapesSearchBar: nodeShapesSearchBar,
    nodeShapesDisplay: nodeShapesDisplay
  },
  commands: [shapesEditorCommands, projectTabCommands, nodeShapesTabCommands]
}
