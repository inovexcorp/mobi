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
        toastr = null;
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
    });
    // describe('contains the correct html', function() {
    //     it('for wrapping containers', function() {
    //         expect(this.element.hasClass('results-block')).toBe(true);
    //     });
    //     it('with a block', function() {
    //         expect(this.element.find('block').length).toBe(1);
    //     });
    //     it('with a block-header', function() {
    //         expect(this.element.find('block-header').length).toBe(1);
    //     });
    //     it('with a block-content', function() {
    //         expect(this.element.find('block-content').length).toBe(1);
    //     });
    //     it('with a block-footer', function() {
    //         expect(this.element.find('block-footer').length).toBe(1);
    //     });
    //     it('with a catalog-breadcrumb', function() {
    //         expect(this.element.find('catalog-breadcrumb').length).toBe(1);
    //     });
    //     it('with a catalog-pagination', function() {
    //         expect(this.element.find('catalog-pagination').length).toBe(1);
    //     });
    //     it('with a pagination-header', function() {
    //         expect(this.element.find('pagination-header').length).toBe(1);
    //     });
    //     it('depending on how many records the current catalog has', function() {
    //         catalogStateSvc.results = [{}];
    //         scope.$digest();
    //         var branches = this.element.querySelectorAll('.results-list button.record');
    //         expect(branches.length).toBe(catalogStateSvc.results.length);
    //         for (var i = 0; i < branches.length; i++) {
    //             var branch = angular.element(branches[i]);
    //             expect(branch.find('record-types').length).toBe(1);
    //             expect(branch.find('entity-dates').length).toBe(1);
    //             expect(branch.find('entity-description').length).toBe(1);
    //             expect(branch.find('record-keywords').length).toBe(1);
    //         }
    //     });
    // });
    // it('should call openRecord when a record button is clicked', function() {
    //     catalogStateSvc.results = [{}];
    //     spyOn(this.controller, 'openRecord');
    //     scope.$digest();

    //     var button = angular.element(this.element.querySelectorAll('.results-list button.record')[0]);
    //     button.triggerHandler('click');
    //     expect(this.controller.openRecord).toHaveBeenCalledWith(catalogStateSvc.results[0]);
    // });
});