/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
var username = "admin"

module.exports = {
  '@tags': ['mobi', 'login', 'sanity'],

  'Step 1: login as admin' : function(browser) {
    browser
      .url('https://localhost:8443/mobi/index.html#/home')
      .useXpath()
      .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
      .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
      .setValue('//div[@class="form-group"]//input[@id="username"]', '' + username + '')
      .setValue('//div[@class="form-group"]//input[@id="password"]', 'admin')
      .click('//button[@type="submit"]')
  },

  'Step 2: check for visibility of home elements' : function(browser) {
    browser
      .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Search the Catalog")]]')
      .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Open an Ontology")]]')
      .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Read the Documentation")]]')
      .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Explore Data")]]')
      .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Query Data")]]')
      .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Ingest Data")]]')
      .waitForElementVisible('//a[@class="nav-link active"][text()[contains(.,"Recent Activity")]]')
  },

  'Step 3: check for administration nav item' : function(browser) {
    browser
      .assert.visible('//*[@ui-sref="root.user-management"]/span[text()[contains(.,"Administration")]]')
      .click('//*[@ui-sref="root.user-management"]/span[text()[contains(.,"Administration")]]')
  },

  'Step 4: check for and compare nav username text' : function(browser) {
    browser
      .assert.visible('//a[@class="current-user-box p-2 my-2 text-truncate"]')
      .getText('//a[@class="current-user-box p-2 my-2 text-truncate"]', function(result) {browser.assert.ok(result.value == username)})
  },

  'Step 5: logout' : function(browser){
    browser
      .click('//i[@class= "fa fa-sign-out fa-fw"]/following-sibling::span[text()[contains(.,"Logout")]]')
  },

  'Step 6: login as all caps admin' : function(browser) {
    browser
      .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
      .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
      .setValue('//div[@class="form-group"]//input[@id="username"]', '' + username.toUpperCase() + '')
      .setValue('//div[@class="form-group"]//input[@id="password"]', 'admin')
      .click('//button[@type="submit"]')
  },

  'Step 7: check for administration nav item' : function(browser) {
    browser
      .assert.visible('//*[@ui-sref="root.user-management"]/span[text()[contains(.,"Administration")]]')
      .getText('//a[@class="current-user-box p-2 my-2 text-truncate"]', function(result) {browser.assert.ok(result.value == username)})
  },

  'Step 8: check for and compare nav username text' : function(browser) {
    browser
      .assert.visible('//a[@class="current-user-box p-2 my-2 text-truncate"]')
      .click('//a[@class="current-user-box p-2 my-2 text-truncate"]')
  },

  'Step 9: logout' : function(browser){
    browser
      .click('//i[@class= "fa fa-sign-out fa-fw"]/following-sibling::span[text()[contains(.,"Logout")]]')
  },

};
