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
var adminUsername = "admin"
var adminPassword = "admin"

module.exports = {
  '@tags': ['login', 'sanity'],

  'Step 1: Initial Setup' : function(browser) {
    browser.globals.initial_steps(browser, adminUsername, adminPassword)
  },

  'Step 2: Navigate to administration page' : function(browser) {
    browser.globals.switchToPage(browser, 'user-management')
  },

  'Step 3: check for and compare nav username text' : function(browser) {
    browser
      .useCss()
      .assert.visible('a.current-user-box')
      .getText('a.current-user-box', function(result) {browser.assert.ok(result.value == adminUsername)})
  },

  'Step 4: logout' : function(browser){
    browser
      .useXpath()
      .click('//li/a[@class=\'nav-link\']/span[text()[contains(.,\'Logout\')]]')
  },

  'Step 5: login as all caps admin' : function(browser) {
    browser
      .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
      .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
      .setValue('//div[@class="form-group"]//input[@id="username"]', adminUsername.toUpperCase() )
      .setValue('//div[@class="form-group"]//input[@id="password"]', adminPassword)
      .click('//button[@type="submit"]')
  },

  'Step 6: check for administration nav item' : function(browser) {
    browser
      .assert.visible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
  },

  'Step 7: check for and compare nav username text' : function(browser) {
    browser
      .useCss()
      .assert.visible('a.current-user-box')
      .getText('a.current-user-box', function(result) {browser.assert.ok(result.value == adminUsername)})
  },

  'Step 8: The user successfully logs out' : function(browser){
    browser
      .useXpath()
      .click('//li/a[@class=\'nav-link\']/span[text()[contains(.,\'Logout\')]]')
      .assert.visible('//div[@class="form-group"]//input[@id="username"]')
      .assert.visible('//div[@class="form-group"]//input[@id="password"]')
  }
};
