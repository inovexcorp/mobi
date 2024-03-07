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
var adminUsername = 'admin'
var adminPassword = 'admin'
var pages = ["Catalog", "Ontology Editor", "Merge Requests", "Mapping Tool", "Datasets", "Discover"]

module.exports = {
    '@tags': ['sanity'],

    'Step 1: login as admin' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
        browser.globals.wait_for_no_spinners(browser);
        browser.click('xpath', '//div//ul//a[@class="nav-link"][@href="#/home"]');
        browser.globals.wait_for_no_spinners(browser);
        browser.waitForElementVisible('.home-page')
    },

    'Step 2: check for visibility of home elements' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Search the Catalog")]]')
            .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Open an Ontology")]]')
            .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Read the Documentation")]]')
            .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Explore Data")]]')
            .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Query Data")]]')
            .waitForElementVisible('//*[contains(@class, "quick-action-grid")]//span[text()[contains(.,"Ingest Data")]]')
            .waitForElementVisible('//mat-tab-group//div[contains(@class,"mat-tab-labels")]//div[contains(@class,"mat-tab-label-content")][text()[contains(., "Recent Activity")]]')
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
                            browser.waitForElementVisible("//div[contains(@class,'mat-form-field')]/input");
                            break;
                        case "Ontology Editor":
                            browser.waitForElementVisible('//div[contains(@class, "ontology-sidebar")]//span[text()[contains(.,"Ontologies")]]/parent::button');
                            browser
                                .useCss()
                                .waitForElementVisible("open-ontology-tab search-bar input");
                            browser
                                .useXpath()
                                .waitForElementVisible("//span[text()[contains(.,'New Ontology')]]/parent::button")
                                .waitForElementVisible("//span[text()[contains(.,'Upload Ontology')]]/parent::button");
                            break;
                        case "Merge Requests":
                            browser.waitForElementVisible("//button/span[text()[contains(.,'New Request')]]");
                            break;
                        case "Mapping Tool":
                            browser.waitForElementVisible("//button/span[text()[contains(.,'New Mapping')]]");
                            // browser.waitForElementVisible("//i[@class='fa fa-search']/following-sibling::input");
                            break;
                        case "Datasets":
                            browser.waitForElementVisible("//button/span[text()[contains(.,'New Dataset')]]");
                            break;
                        case "Discover":
                            browser.waitForElementVisible('//*[contains(@class, "mat-tab-labels")]//div[contains(@class,"mat-tab-label-content")][text()[contains(.,"Explore")]]');
                            browser.waitForElementVisible('//*[contains(@class, "mat-tab-labels")]//div[contains(@class,"mat-tab-label-content")][text()[contains(.,"Query")]]');
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
            .waitForElementVisible("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Administration')]]")
    },

    'Step 4: The user clicks logout' : function(browser) {
        browser
            .click("//li/a[@class='nav-link']/span[text()[contains(.,'Logout')]]")
    }
}
