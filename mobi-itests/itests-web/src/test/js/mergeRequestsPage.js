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
var MergeRequestsPage = function() {
    this.mergeRequestPage = 'merge-requests-page ';
    this.mergeRequestPageList=  this.mergeRequestPage + 'merge-request-list';
    this.mergeRequestPageForm = this.mergeRequestPage  + '.search-container';
    this.mergeRequestSearch =  this.mergeRequestPageForm + ' input';
    this.mergeRequestSort =  this.mergeRequestPageForm + ' mat-select';
    this.mergeRequestFilters = this.mergeRequestPage  + 'merge-request-filter';
    this.mergeRequestPaginator = this.mergeRequestPage + '.merge-request-paginator mat-paginator';
};
// verifyRecordFilters is used to verify filters on the catalog page,
// noKeywords is a boolean value to check if page has available keywords
MergeRequestsPage.prototype.verifyRecordFilters = function(browser) {
    browser.useCss();
    browser.expect.element(this.mergeRequestFilters).to.be.present;
    browser.expect.elements(this.mergeRequestFilters + ' mat-expansion-panel-header mat-panel-title').count.to.equal(2);
};

MergeRequestsPage.prototype.verifyMergeRequestList = function(browser) {
    browser.useCss();
    browser.expect.element(this.mergeRequestPageList).to.be.present;
    browser.expect.element(this.mergeRequestPaginator).to.be.present;
};

MergeRequestsPage.prototype.verifyMergePageSort = function(browser) {
    browser.useCss();
    browser.expect.element(this.mergeRequestPageForm).to.be.present;
    browser.expect.element(this.mergeRequestSort).to.be.present;
    browser.useXpath();
    browser.expect.element('//merge-requests-page//mat-select//span[text()[contains(.,"Issued (desc)")]]').to.be.present;
    browser.useCss();
};

// Used to execute a search on the main merge request landing page
MergeRequestsPage.prototype.searchList = function(browser, searchText) {
    browser
        .useCss()
        .waitForElementVisible(this.mergeRequestSearch)
        .clearValue(this.mergeRequestSearch)
        .sendKeys(this.mergeRequestSearch, [searchText, browser.Keys.ENTER])
        .waitForElementNotPresent('#spinner-full');
    browser.getValue(this.mergeRequestSearch, function(result) {
        this.assert.equal(typeof result, 'object');
        this.assert.equal(result.status, 0);
        this.assert.equal(result.value, searchText);
    });
};

MergeRequestsPage.prototype.createFilterXPathSelector = function(filterTypeHeader, filterOption) {
    var selectors = ['//merge-requests-page',
        '//merge-request-filter//div[contains(@class, "merge-request-filter")]//mat-expansion-panel-header',
        '//mat-panel-title[contains(@class, "mat-expansion-panel-header-title")][text()[contains(.,"' + filterTypeHeader + '")]]//ancestor::mat-expansion-panel',
        '//div[contains(@class, "mat-expansion-panel-content")]'
    ];
    if (filterOption) {
        selectors = selectors.concat([
            '//div[contains(@class, "filter-option")]//mat-checkbox',
            '//span[contains(@class, "mat-checkbox-label")][text()[contains(., "' + filterOption + '")]]',
            '//ancestor::mat-checkbox//label[contains(@class, "mat-checkbox-layout")]'
        ]);
    }
    return selectors.join('');
};

// Selects the merge request with the specified title from the main merge request landing page
MergeRequestsPage.prototype.selectRequest = function(browser, mrTitle) {
    browser
        .useXpath()
        .waitForElementVisible("//button//span[text()[contains(.,'New Request')]]")
        .useCss()
        .assert.textContains('div.request-contents .details h3', mrTitle)
        .click('xpath', '//div[contains(@class, "request-contents")]//h3[text()[contains(.,"' + mrTitle + '")]]')
    browser.globals.wait_for_no_spinners(browser);
};

// Accepts the currently displayed merge request
MergeRequestsPage.prototype.acceptRequest = function(browser) {
    browser
        .useXpath()
        .waitForElementVisible("//button//span[text()[contains(.,'Accept')]]")
        .click("//button//span[text()[contains(.,'Accept')]]")
        .useCss()
        .waitForElementVisible('div.mat-dialog-actions button.mat-primary')
        .click('div.mat-dialog-actions button.mat-primary')
    browser.globals.wait_for_no_spinners(browser);
    browser
        .useCss()
        .waitForElementVisible('div.toast-success')
        .waitForElementNotPresent('div.toast-success')
        .waitForElementVisible('xpath', '//mat-chip[text()[contains(.,"Accepted")]]')
    browser
        .useXpath()
        .waitForElementVisible("//button//span[text()[contains(.,'Back')]]")
        .click("//button//span[text()[contains(.,'Back')]]");
    browser.globals.wait_for_no_spinners(browser);
};

module.exports = { mergeRequestsPage: new MergeRequestsPage() };
