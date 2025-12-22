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

const usersTabCommands = {
  createUser: function(user) {
    return this.useXpath()
      .waitForElementVisible("//button/span[text() [contains(., 'Create User')]]")
      .click("//button/span[text() [contains(., 'Create User')]]")
      .waitForElementVisible("//h1[text() [contains(., 'Create User')]]")
      .useCss()
      .waitForElementVisible("create-user-overlay input[name=unmaskPassword]")
      .click('create-user-overlay input[name=username]')
      .setValue('create-user-overlay input[name=username]', user.username)
      .click('create-user-overlay input[name=unmaskPassword]')
      .setValue('create-user-overlay input[name=unmaskPassword]', user.password)
      .click('create-user-overlay input[name=firstName]')
      .setValue('create-user-overlay input[name=firstName]', user.firstName)
      .click('create-user-overlay input[name=lastName]')
      .setValue('create-user-overlay input[name=lastName]', user.lastName)
      .click('create-user-overlay input[name=email]')
      .setValue('create-user-overlay input[name=email]', user.email)
      .click('label.mat-slide-toggle-label')
      .useXpath()
      .click("//button/span[text() [contains(., 'Submit')]]")
      .waitForElementNotPresent('create-user-overlay')
      .assert.not.elementPresent("//button/span[text()[contains(., 'Submit')]]");
  },
  validateUserList:function(username) {
    return this.useXpath()
      .assert.visible("//div[@class='users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
      "[contains(., '" + username + "')]]", "new user is displayed");
  }
}

const permissionsTabCommands = {
  openPermissionsTab: function() {
    return this.useXpath()
      .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Permissions")]]')
      .click('//mat-tab-header//div[text()[contains(.,"Permissions")]]')
      .waitForElementVisible('//permissions-page');
  },
  toggleEveryonePermission: function(permissionName) {
    return this.openPermissionsTab()
      .waitForElementVisible(`//h4[contains(text(), "${permissionName}")]/following-sibling::mat-slide-toggle`)
      .click(`//h4[contains(text(), "${permissionName}")]/following-sibling::mat-slide-toggle`)
      .useCss()
      .waitForElementVisible('.save-container')
      .click('.save-container');
  },
  toggleWorkflowCreatePermission: function() {
    return this.openPermissionsTab()
      .click('//permissions-page//user-access-controls//h4[text()[contains(.,"Create Workflow Record")]]/following-sibling::mat-slide-toggle')
      .useCss()
      .click('permissions-page .save-button');
  },
}

const logsTabCommands = {
  openLogsTab: function() {
    return this.useXpath()
      .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Logs")]]')
      .click('//mat-tab-header//div[text()[contains(.,"Logs")]]')
      .waitForElementVisible('//app-log-viewer-page');
  },

  selectLogFile: function(fileName) {
    this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .metadata-card .file-trigger')
      .click('app-log-viewer-page .metadata-card .file-trigger')
      .waitForElementVisible('.mat-menu-content')
      .useXpath()
      .click(`//div[contains(@class,"mat-menu-content")]//button[contains(@class,"file-option")][text()[contains(., "${fileName}")]]`)
      .useCss()
      .waitForElementNotPresent('.mat-menu-content')
      .api.globals.wait_for_no_spinners(this);
    return this.verifySelectedLogFile(fileName, '');
  },

  verifySelectedLogFile: function(fileName, unit) {
    return this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .selected-file-card') // Ensures the selection has loaded
      .waitForElementVisible('app-log-viewer-page .metadata-card .file-trigger .metadata-value')
      .assert.textContains('app-log-viewer-page .metadata-card .file-trigger .metadata-value', fileName)
      .assert.textContains('app-log-viewer-page .metadata-card .file-size .metadata-value', unit);
  },

  verifyLogTailLoaded: function() {
    return this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container mat-button-toggle.mat-button-toggle-checked#mat-button-toggle-1')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .status-text .paused-indicator')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .log-output');
  },

  verifyLogPaginatedLoaded: function() {
    return this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container mat-button-toggle.mat-button-toggle-checked#mat-button-toggle-2')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .log-output')
      .waitForElementVisible('app-log-viewer-page .selected-file-card mat-paginator');
  },

  verifyLogSearchLoaded: function() {
    return this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container')
      .waitForElementNotPresent('app-log-viewer-page .selected-file-card .button-toggle-container mat-button-toggle.mat-button-toggle-checked')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .status-text')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .search-results-list');
  },

  switchToLogPaginatedView: function() {
    this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container')
      .waitForElementVisible('app-log-viewer-page .selected-file-card .button-toggle-container mat-button-toggle#mat-button-toggle-2')
      .click('app-log-viewer-page .selected-file-card .button-toggle-container mat-button-toggle#mat-button-toggle-2')
      .api.globals.wait_for_no_spinners(this);
    return this.verifyLogPaginatedLoaded();
  },

  submitLogSearch: function(searchTerm) {
    this.useCss()
      .waitForElementVisible('app-log-viewer-page')
      .waitForElementVisible('app-log-viewer-page .selected-file-card search-bar input')
      .setValue('app-log-viewer-page .selected-file-card search-bar input', searchTerm)
      .sendKeys('app-log-viewer-page .selected-file-card search-bar input', browser.Keys.ENTER)
      .api.globals.wait_for_no_spinners(this);
    return this.verifyLogSearchLoaded();
  }
}

module.exports = {
  elements: {},
  commands: [usersTabCommands, permissionsTabCommands, logsTabCommands]
}
