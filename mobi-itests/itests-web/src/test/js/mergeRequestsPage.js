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
    this.recordViewCssSelector = this.mergeRequestPage + 'catalog-page record-view';
    this.mergeRequestPagList=  this.mergeRequestPage + 'merge-request-list';
    this.mergeRequestPageForm = this.mergeRequestPage  + '.search-container';
    this.mergeRequestSort =  this.mergeRequestPageForm + ' mat-select';
    this.mergeRequestFilters = this.mergeRequestPage  + 'merge-request-filter';
    this.mergeRequestPaginator = this.mergeRequestPage + '.merge-request-paginator mat-paginator';
};
// verifyRecordFilters is used to verify filters on the catalog page,
// noKeywords is a boolean value to check if page has available keywords
MergeRequestsPage.prototype.verifyRecordFilters = function(browser) {
    var mr = this;
    browser.expect.element(this.mergeRequestFilters).to.be.present;
    browser.expect.elements(this.mergeRequestFilters + ' div.record-filters mat-expansion-panel-header mat-panel-title').count.to.equal(1);
};

MergeRequestsPage.prototype.verifyMergeRequestList = function(browser) {
    browser.expect.element(this.mergeRequestPagList).to.be.present;
    browser.expect.element(this.mergeRequestPaginator).to.be.present;
};

MergeRequestsPage.prototype.verifyMergePageSort = function(browser) {
    browser.expect.element(this.mergeRequestPageForm).to.be.present;
    browser.expect.element(this.mergeRequestSort).to.be.present;
    browser.useXpath();
    browser.expect.element('//merge-requests-page//mat-select//span[text()[contains(.,"Issued (desc)")]]').to.be.present;
    browser.useCss();

};

module.exports = { mergeRequestsPage: new MergeRequestsPage() };
