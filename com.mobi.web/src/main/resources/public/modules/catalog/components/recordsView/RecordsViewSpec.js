/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Records View component', function() {
    var $compile, scope, $q, catalogManagerSvc, catalogStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'recordFilters');
        mockComponent('catalog', 'recordSearch');
        mockComponent('catalog', 'sortOptions');
        mockComponent('catalog', 'recordTypes');
        mockComponent('catalog', 'entityPublisher');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _catalogStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
        });

        this.catalogId = 'catalogId';
        this.totalSize = 10;
        this.headers = {'x-total-count': this.totalSize};
        this.records = [{}];
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        catalogManagerSvc.getRecords.and.returnValue($q.when({
            data: this.records,
            headers: jasmine.createSpy('headers').and.returnValue(this.headers)
        }));
        this.element = $compile(angular.element('<records-view></records-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordsView');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('with the list of records', function() {
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, jasmine.any(Object));
            expect(this.controller.records).toEqual(this.records);
            expect(catalogStateSvc.currentRecordPage).toEqual(1);
            expect(catalogStateSvc.totalRecordSize).toEqual(this.totalSize);
        });
    });
    describe('controller methods', function() {
        it('should open a Record', function() {
            this.controller.openRecord(this.record);
            expect(catalogStateSvc.selectedRecord).toEqual(this.record);
        });
        it('should change the sort', function() {
            spyOn(this.controller, 'setRecords');
            this.controller.changeSort({});
            expect(catalogStateSvc.currentRecordPage).toEqual(1);
            expect(this.controller.setRecords).toHaveBeenCalledWith(catalogStateSvc.recordSearchText, catalogStateSvc.recordFilterType, {});
        });
        it('should change the filter', function() {
            spyOn(this.controller, 'setRecords');
            this.controller.changeFilter('test');
            expect(catalogStateSvc.currentRecordPage).toEqual(1);
            expect(this.controller.setRecords).toHaveBeenCalledWith(catalogStateSvc.recordSearchText, 'test', catalogStateSvc.recordSortOption);
        });
        it('should search for records', function() {
            spyOn(this.controller, 'setRecords');
            this.controller.search('test');
            expect(catalogStateSvc.currentRecordPage).toEqual(1);
            expect(this.controller.setRecords).toHaveBeenCalledWith('test', catalogStateSvc.recordFilterType, catalogStateSvc.recordSortOption);
        });
        describe('should set the list of records', function() {
            beforeEach(function() {
                catalogStateSvc.recordFilterType = '';
                catalogStateSvc.recordSearchText = '';
                catalogStateSvc.recordSortOption = undefined;
                catalogStateSvc.totalRecordSize = 0;
                this.controller.records = [];
                this.searchText = 'search';
                this.recordType = 'type';
                this.sortOption = {};
            });
            it('if getRecords resolves', function() {
                this.controller.setRecords(this.searchText, this.recordType, this.sortOption);
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, {
                    pageIndex: catalogStateSvc.currentRecordPage - 1,
                    limit: catalogStateSvc.recordLimit,
                    sortOption: this.sortOption,
                    recordType: this.recordType,
                    searchText: this.searchText
                });
                expect(catalogStateSvc.recordFilterType).toEqual(this.recordType);
                expect(catalogStateSvc.recordSearchText).toEqual(this.searchText);
                expect(catalogStateSvc.recordSortOption).toEqual(this.sortOption);
                expect(catalogStateSvc.totalRecordSize).toEqual(this.totalSize);
                expect(this.controller.records).toEqual(this.records);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless getRecords rejects', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                this.controller.setRecords(this.searchText, this.recordType, this.sortOption);
                scope.$apply();
                expect(catalogStateSvc.recordFilterType).toEqual('');
                expect(catalogStateSvc.recordSearchText).toEqual('');
                expect(catalogStateSvc.recordSortOption).toBeUndefined();
                expect(catalogStateSvc.totalRecordSize).toEqual(0);
                expect(this.controller.records).toEqual([]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORDS-VIEW');
            expect(this.element.querySelectorAll('.records-view.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-10').length).toEqual(1);
        });
        ['block', 'block-header', 'block-content', 'block-footer', 'paging', 'record-filters', 'record-search', 'sort-options'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('depending on how many records match the current query', function() {
            expect(this.element.querySelectorAll('.results-list .record').length).toEqual(this.records.length);
            expect(this.element.querySelectorAll('block-content info-message').length).toEqual(0);

            this.controller.records = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.results-list .record').length).toEqual(0);
            expect(this.element.querySelectorAll('block-content info-message').length).toEqual(1);
        });
        it('with the correct information for each record', function() {
            var record = angular.element(this.element.querySelectorAll('.results-list .record')[0]);
            expect(record.find('record-types').length).toEqual(1);
            expect(record.find('h3').length).toEqual(1);
            expect(record.find('entity-dates').length).toEqual(1);
            expect(record.find('entity-publisher').length).toEqual(1);
            expect(record.find('entity-description').length).toEqual(1);
            expect(record.find('record-keywords').length).toEqual(1);
        });
    });
    it('should call openRecord when a record button is clicked', function() {
        spyOn(this.controller, 'openRecord');
        var button = angular.element(this.element.querySelectorAll('.results-list button.record')[0]);
        button.triggerHandler('click');
        expect(this.controller.openRecord).toHaveBeenCalledWith(this.records[0]);
    });
});