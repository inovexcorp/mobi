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
const profileTabSelector = '//settings-page//mat-tab-group//profile-tab';
const profileTabFirstName = `${profileTabSelector}//form//mat-form-field//input[@name="firstName"]`;
const profileTabLastName = `${profileTabSelector}//form//mat-form-field//input[@name="lastName"]`;
const profileTabEmail = `${profileTabSelector}//form//mat-form-field//input[@name="email"]`;

const myAccountPageCommands = {
  verifyProfileTab: function(userObject){
    this.useXpath()
    .waitForElementVisible(profileTabFirstName)
    this.assert.valueEquals(profileTabFirstName, userObject.firstName);
    this.assert.valueEquals(profileTabLastName, userObject.lastName);
    return this.assert.valueEquals(profileTabEmail, userObject.email);
  },

  editProfileTab: function(userObject) {
    return this.useXpath()
    .clearValue(profileTabFirstName)
    .setValue(profileTabFirstName, userObject.firstName )
    .clearValue(profileTabLastName)
    .setValue(profileTabLastName, userObject.lastName)
    .clearValue(profileTabEmail)
    .setValue(profileTabEmail, userObject.email )
    .click('//mat-tab-group//profile-tab//form//button[@type="submit"]');
  }
}

module.exports = {
  elements: {},
  commands: [myAccountPageCommands]
}
