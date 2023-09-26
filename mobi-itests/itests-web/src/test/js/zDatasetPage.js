/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
var DatasetPage = function() {

};

DatasetPage.prototype.goToPage = function(browser) {
    browser
        .click('xpath', '//div//ul//a[@class="nav-link"][@href="#/datasets"]');
    browser.globals.wait_for_no_spinners(browser);
};

DatasetPage.prototype.createDataset = function(browser, title, description) {
    browser
        .click('div.datasets-page button.mat-primary')
        .waitForElementVisible('new-dataset-overlay')
        .waitForElementVisible('new-dataset-overlay input[name="title"]')
        .setValue('div.mat-dialog-content input[name=title]', title)
        .setValue('div.mat-dialog-content textarea', description);
        // .click('xpath', '//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"uhtc-ontology")]]//ancestor::mat-list-option')
    browser.globals.wait_for_no_spinners(browser)
        browser
        .click('div.mat-dialog-actions button.mat-primary') 
};

module.exports = { datasetPage: new DatasetPage() };
