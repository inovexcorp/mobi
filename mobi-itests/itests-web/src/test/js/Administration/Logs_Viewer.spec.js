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
module.exports = {
  '@tags': ['login', 'administration', 'logs-viewer'],

  'Step 1: Initial Setup' : function(browser) {
      browser.globals.initial_steps(browser, browser.globals.adminUsername, browser.globals.adminPassword);
  },

  'Step 2: The user clicks on the Administration sidebar link' : function(browser) {
      browser.globals.switchToPage(browser, 'user-management');
  },

  'Step 3: The user navigates to Logs Viewer tab' : function(browser) {
      browser.page.administrationPage().openLogsTab();
  },

  'Step 4: The karaf.log file is auto loaded and displayed' : function(browser) {
    browser.page.administrationPage()
      .verifySelectedLogFile('karaf.log', 'KB')
      .verifyLogTailLoaded();
  },

  'Step 5: Switch to paginated view' : function(browser) {
    browser.page.administrationPage()
      .switchToLogPaginatedView();
  },

  'Step 6: The user submits a search' : function(browser) {
    browser.page.administrationPage()
      .submitLogSearch('karaf');
  },

  'Step 7: The user selects the security.log file from the file dropdown and is on the tail view' : function(browser) {
    browser.page.administrationPage()
      .selectLogFile('security.log', 'Bytes')
      .verifyLogTailLoaded();
  }
}
