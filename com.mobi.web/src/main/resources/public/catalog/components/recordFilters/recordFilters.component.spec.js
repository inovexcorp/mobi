/*-
 * #%L
 * com.mobi.web
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
import {
    mockCatalogManager,
    mockCatalogState,
    mockUtil,
    mockPrefixes,
    injectSplitIRIFilter
} from '../../../../../../test/js/Shared';

describe('Record Filters component', function() {
    var $compile, scope, $q, catalogManagerSvc, catalogStateSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('catalog');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();
        mockPrefixes();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _catalogStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            prefixes = _prefixes_;
        });

        this.keywordObject = function(keyword, count){
            return {'catalog:keyword' : keyword, 'count': count}
        };
        this.catalogId = 'catalogId';
        this.totalSize = 10;
        this.headers = {'x-total-count': this.totalSize};
        this.records = [this.keywordObject('keyword1', 6)];

        catalogManagerSvc.recordTypes = ['test1', 'test2'];
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        catalogManagerSvc.getKeywords.and.returnValue($q.when({
            data: this.records,
            headers: jasmine.createSpy('headers').and.returnValue(this.headers)
        }));

        scope.catalogId = 'localCatalog';
        scope.recordType = 'test1';
        scope.keywordFilterList = ['keyword1'];
        scope.changeFilter = jasmine.createSpy('changeFilter');
        this.element = $compile(angular.element('<record-filters catalog-id="catalogId" record-type="recordType" keyword-filter-list="keywordFilterList" change-filter="changeFilter(recordType, keywordFilterList)"></record-filters>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordFilters');
        this.recordTypeFilter = this.controller.filters[0];
        this.keywordsFilter = this.controller.filters[1];
        this.keywordsFilter.rawFilterItems = [this.keywordObject('keywords1', 5)];
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('variables are one way bound', function() {
            this.controller.recordType = '';
            this.controller.catalogId = '';
            this.controller.keywordFilterList = []
            scope.$digest();
            expect(scope.recordType).toEqual('test1');
            expect(scope.catalogId).toEqual('localCatalog');
            expect(scope.keywordFilterList).toEqual(['keyword1']);
        });
        it('changeFilter is called in the parent scope', function() {
            this.controller.changeFilter({recordType: 'test', keywordFilterList: ['keyword2']});
            scope.$digest();
            expect(scope.changeFilter).toHaveBeenCalledWith('test', ['keyword2']);
        });
    });
    describe('initializes correctly', function() {
        it('with recordTypeFilter', function() {
            var expectedFilterItems = [
                {value: 'test1', checked: true},
                {value: 'test2', checked: false}
            ];
            expect(this.recordTypeFilter.title).toEqual('Record Type');
            expect(this.recordTypeFilter.filterItems).toEqual(expectedFilterItems);
        });
        it('with keywordsFilter', function() {
            var expectedFilterItems = [
                {value: this.keywordObject('keyword1', 6), checked: true}
            ];
            expect(this.keywordsFilter.title).toEqual('Keywords');
            expect(this.keywordsFilter.filterItems).toEqual(expectedFilterItems);
        });
    });
    describe('filter methods', function() {
        beforeEach(function() {
            this.firstRecordFilterItem = {value: 'test1', checked: true};
            this.secondRecordFilterItem = {value: 'test2', checked: true};
            this.recordTypeFilter.filterItems = [this.firstRecordFilterItem, this.secondRecordFilterItem];

            this.firstFilterItem = {value: this.keywordObject('keyword1', 6), checked: true};
            this.secondFilterItem = {value: this.keywordObject('keyword2', 7), checked: true};
            this.keywordsFilter.filterItems = [this.firstFilterItem, this.secondFilterItem];
        });
        describe('recordTypeFilter should filter records', function() {
            it('if the filter has been checked', function() {
                this.recordTypeFilter.filter(this.firstRecordFilterItem);
                expect(this.secondRecordFilterItem.checked).toEqual(false);
                expect(scope.changeFilter).toHaveBeenCalledWith(this.firstRecordFilterItem.value, ['keyword1']);
            });
            it('if the filter has been unchecked', function() {
                this.firstRecordFilterItem.checked = false;
                this.controller.recordType = this.firstRecordFilterItem.value;
                this.recordTypeFilter.filter(this.firstRecordFilterItem);
                expect(scope.changeFilter).toHaveBeenCalledWith('', ['keyword1']);
            });
        });
        describe('recordTypeFilter filter text method', function() {
            it('text is correct', function() {
                expect(this.recordTypeFilter.getItemText(this.firstRecordFilterItem)).toEqual("test1");
            });
        });
        describe('keywordsFilter should filter records', function() {
            it('if the filter has been checked', function() {
                this.keywordsFilter.filter(this.firstFilter);
                expect(this.secondFilterItem.checked).toEqual(true);
                expect(scope.changeFilter).toHaveBeenCalledWith('test1', [ 'keyword1', 'keyword2' ]);
            });
            it('if the filter has been unchecked', function() {
                this.firstFilterItem.checked = false;
                this.controller.keywordFilterList = [];
                this.keywordsFilter.filter(this.firstFilter);
                expect(scope.changeFilter).toHaveBeenCalledWith('test1', [ 'keyword2' ]);
            });
        });
        describe('keywordsFilter filter text method', function() {
            it('text is correct', function() {
                 expect(this.keywordsFilter.getItemText(this.firstFilterItem)).toEqual("keyword1 (6)");
            });
        });
    });
    describe('contains the correct html', function() {
        var getHtmlResults;
        beforeEach(function() {
            getHtmlResults = function(scope){
                return Array.prototype.map.call(scope.element.querySelectorAll("div.record-filters .filter-container"), node => {
                    return [
                        node.querySelectorAll('h5.record-filter-header span.ng-binding')[0].innerText,
                        Array.prototype.map.call(node.querySelectorAll('div.filter-options div.filter-option div.custom-control label.custom-control-label'), node => node.innerText).join(','),
                        node.querySelectorAll('search-bar').length,
                        node.querySelectorAll('a span').length
                    ]
            })};
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-FILTERS');
            var expectedHtmlResults = [[ 'Record Type', 'test1,test2', 0, 0 ], [ 'Keywords', 'keyword1 (6)', 1, 1 ]];
            expect(getHtmlResults(this)).toEqual(expectedHtmlResults);
        });
    });
});