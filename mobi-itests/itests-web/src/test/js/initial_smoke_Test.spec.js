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

var pages = ["Catalog", "Ontology Editor", "Merge Requests", "Mapping Tool", "Datasets", "Discover"]

module.exports = {
    '@tags': ['mobi', 'sanity'],

    'Step 1: login as admin' : function(browser) {
        browser
            .url('https://localhost:8443/mobi/index.html#/home')
            .useXpath()
            .waitForElementVisible('//div[@class="form-group"]//input[@id="username"]')
            .waitForElementVisible('//div[@class="form-group"]//input[@id="password"]')
            .setValue('//div[@class="form-group"]//input[@id="username"]', 'admin')
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

    'Step 2: check sidebar page elements and children elements' : function(browser) {
            for (var i = 0; i < pages.length; i++){
                try {
                    browser.useXpath()
                    browser.waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'" + pages[i] + "')]]")
                    browser.click("//li/a[@class='nav-link']/span[text()[contains(.,'" + pages[i] + "')]]")

                    switch (pages[i]) {
                        case "Home":
                            browser.waitForElementVisible("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Search the Catalog')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Open an Ontology')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Read the Documentation')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Explore Data')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Query Data')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'quick-action-grid')]//span[text()[contains(.,'Ingest Data')]]");
                            browser.waitForElementVisible("//a[@class='nav-link active'][text()[contains(.,'Recent Activity')]]");
                            break;
                        case "Catalog":
                            browser.waitForElementVisible("//div[contains(@class,'input-group')]/input");
                            break;
                        case "Ontology Editor":
                            browser.waitForElementVisible("//div[contains(@class, 'ontology-sidebar')]/div/button[text()[contains(.,'Ontologies')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'search-bar')]//input");
                            browser.waitForElementVisible("//button[text()[contains(.,'New Ontology')]]");
                            browser.waitForElementVisible("//button[text()[contains(.,'Upload Ontology')]]");
                            break;
                        case "Merge Requests":
                            browser.waitForElementVisible("//button[text()[contains(.,'Create Request')]]");
                            break;
                        case "Mapping Tool":
                            browser.waitForElementVisible("//button[text()[contains(.,'Create Mapping')]]");
                            browser.waitForElementVisible("//i[@class='fa fa-search']/following-sibling::input");
                            break;
                        case "Datasets":
                            browser.waitForElementVisible("//button[text()[contains(.,'New Dataset')]]");
                            break;
                        case "Discover":
                            browser.waitForElementVisible("//*[contains(@class, 'material-tabset-headings')]/ul/li/a/span[text()[contains(.,'Explore')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'material-tabset-headings')]/ul/li/a/span[text()[contains(.,'Search')]]");
                            browser.waitForElementVisible("//*[contains(@class, 'material-tabset-headings')]/ul/li/a/span[text()[contains(.,'Query')]]");
                            break;
                        default:
                            break;
                    }
                } catch (TimeoutException) {
                    browser.waitForElementVisible("//li[contains(@class, 'active')]/a[@class='nav-link']/span[text()[contains(.,'" + pages[i] + "')]]")
                }
            }
    },

    'Step 3: The user clicks on the Administration sidebar link' : function(browser) {
        browser
            .waitForElementVisible("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
            .click("//*[@ui-sref='root.user-management']/span[text()[contains(.,'Administration')]]")
    },

    'Step 4: The user clicks logout' : function(browser) {
        browser
            .click("//i[@class= 'fa fa-sign-out fa-fw']/following-sibling::span[text()[contains(.,'Logout')]]")
    }

}
