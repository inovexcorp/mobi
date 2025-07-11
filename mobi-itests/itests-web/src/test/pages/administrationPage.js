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

const administrationPageCommands = {
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
    openPermissionsTab: function() {
        return this.useXpath()
            .waitForElementVisible('//mat-tab-header//div[text()[contains(.,"Permissions")]]')
            .click('//mat-tab-header//div[text()[contains(.,"Permissions")]]')
            .waitForElementVisible('//permissions-page');
    },
    toggleEveryonePermission: function(permissionName) {
        return this.useXpath()
            .waitForElementVisible('//permissions-page')
            .waitForElementVisible(`//h4[contains(text(), "${permissionName}")]/following-sibling::mat-slide-toggle`)
            .click(`//h4[contains(text(), "${permissionName}")]/following-sibling::mat-slide-toggle`)
            .useCss()
            .waitForElementVisible('.save-container')
            .click('.save-container');
    },
    toggleWorkflowCreatePermission: function() {
        return this.useXpath()
          .click('//mat-tab-header//div[text()[contains(.,"Permissions")]]')
          .waitForElementVisible('//permissions-page')
          .click('//permissions-page//user-access-controls//h4[text()[contains(.,"Create Workflow Record")]]/following-sibling::mat-slide-toggle')
          .useCss()
          .click('permissions-page .save-button');
    },
    validateUserList:function(username) {
        return this.useXpath()
            .assert.visible("//div[@class='users-list tree scroll-without-buttons']//ul//li//a//span[text() " +
            "[contains(., '" + username + "')]]", "new user is displayed");
    }
}

module.exports = {
    elements: {},
    commands: [administrationPageCommands]
}
