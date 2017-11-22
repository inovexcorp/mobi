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
describe('Results Block directive', function() {
    var $compile, scope, $q, toastr, catalogManagerSvc, catalogStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('resultsBlock');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();
        mockToastr();

        inject(function(_$compile_, _$rootScope_, _toastr_, _catalogManagerService_, _catalogStateService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            toastr = _toastr_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        catalogStateSvc.getCurrentCatalog.and.returnValue(catalogStateSvc.catalogs.local);
        this.element = $compile(angular.element('<results-block></results-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('resultsBlock');
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
            expect(catalogManagerSvc.getRecords).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should change the sort', function() {
            beforeEach(function() {
                scope.$apply();
                catalogManagerSvc.getRecords.calls.reset();
                catalogStateSvc.setPagination.calls.reset();
                this.expectedPaginationConfig = {
                    pageIndex: 0,
                    limit: catalogStateSvc.catalogs.local.records.limit,
                    sortOption: catalogStateSvc.catalogs.local.records.sortOption,
                    recordType: catalogStateSvc.catalogs.local.records.recordType,
                    searchText: catalogStateSvc.catalogs.local.records.searchText,
                };
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                this.controller.changeSort();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                expect(catalogStateSvc.currentPage).toBe(0);
                expect(catalogStateSvc.setPagination).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
            it('succesfully', function() {
                this.controller.changeSort();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                expect(catalogStateSvc.currentPage).toBe(0);
                expect(catalogStateSvc.setPagination).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('should open a Record', function() {
            beforeEach(function() {
                this.record = {'@id': 'record'};
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecord.and.returnValue($q.reject('Error Message'));
                this.controller.openRecord(this.record);
                scope.$apply();
                expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.record['@id'], catalogStateSvc.catalogs.local['@id']);
                expect(catalogStateSvc.resetPagination).not.toHaveBeenCalled();
                expect(catalogStateSvc.catalogs.local.openedPath).not.toContain(this.record);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
            it('succesfully', function() {
                catalogManagerSvc.getRecord.and.returnValue($q.when(this.record));
                this.controller.openRecord(this.record);
                scope.$apply();
                expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.record['@id'], catalogStateSvc.catalogs.local['@id']);
                expect(catalogStateSvc.resetPagination).toHaveBeenCalled();
                expect(catalogStateSvc.catalogs.local.openedPath).toContain(this.record);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('results-block')).toBe(true);
            expect(this.element.hasClass('col-xs-12')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a catalog-breadcrumb', function() {
            expect(this.element.find('catalog-breadcrumb').length).toBe(1);
        });
        it('with a catalog-pagination', function() {
            expect(this.element.find('catalog-pagination').length).toBe(1);
        });
        it('with a pagination-header', function() {
            expect(this.element.find('pagination-header').length).toBe(1);
        });
        it('depending on how many records the current catalog has', function() {
            catalogStateSvc.results = [{}];
            scope.$digest();
            var branches = this.element.querySelectorAll('.results-list button.record');
            expect(branches.length).toBe(catalogStateSvc.results.length);
            for (var i = 0; i < branches.length; i++) {
                var branch = angular.element(branches[i]);
                expect(branch.find('record-types').length).toBe(1);
                expect(branch.find('entity-dates').length).toBe(1);
                expect(branch.find('entity-description').length).toBe(1);
                expect(branch.find('record-keywords').length).toBe(1);
            }
        });
    });
    it('should call openRecord when a record button is clicked', function() {
        catalogStateSvc.results = [{}];
        spyOn(this.controller, 'openRecord');
        scope.$digest();

        var button = angular.element(this.element.querySelectorAll('.results-list button.record')[0]);
        button.triggerHandler('click');
        expect(this.controller.openRecord).toHaveBeenCalledWith(catalogStateSvc.results[0]);
    });
});