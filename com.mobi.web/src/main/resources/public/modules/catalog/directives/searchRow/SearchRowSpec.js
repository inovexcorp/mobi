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
describe('Search Row directive', function() {
    var $compile,
        scope,
        utilSvc,
        catalogManagerSvc,
        catalogStateSvc,
        $q,
        controller;

    beforeEach(function() {
        module('templates');
        module('searchRow');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _utilService_, _catalogManagerService_, _catalogStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            $q = _$q_;
        });

        catalogStateSvc.getCurrentCatalog.and.returnValue(catalogStateSvc.catalogs.local);
        this.element = $compile(angular.element('<search-row></search-row>'))(scope);
        scope.$digest();
    });

    describe('should initialize', function() {
        beforeEach(function() {
            controller = this.element.controller('searchRow');
        });
        it('the current catalog record type filter', function() {
            expect(controller.recordType).toBe(catalogStateSvc.catalogs.local.records.recordType);
        });
        it('the current catalog search text', function() {
            expect(controller.searchText).toBe(catalogStateSvc.catalogs.local.records.searchText);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = this.element.controller('searchRow');
        });
        describe('should search for records', function() {
            beforeEach(function() {
                catalogStateSvc.catalogs.local.openedPath = [{}, {}];
                controller.searchText = 'text';
                controller.recordType = 'type';
                this.expectedPaginationConfig = {
                    pageIndex: 0,
                    limit: catalogStateSvc.catalogs.local.records.limit,
                    sortOption: catalogStateSvc.catalogs.local.records.sortOption,
                    recordType: controller.recordType,
                    searchText: controller.searchText,
                };
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                controller.search();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                expect(catalogStateSvc.currentPage).toBe(0);
                expect(catalogStateSvc.catalogs.local.records.recordType).not.toBe(controller.recordType);
                expect(catalogStateSvc.catalogs.local.records.searchText).not.toBe(controller.searchText);
                expect(catalogStateSvc.setPagination).not.toHaveBeenCalled();
                expect(catalogStateSvc.catalogs.local.openedPath.length).toBe(2);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
            it('succesfully', function() {
                controller.search();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                expect(catalogStateSvc.currentPage).toBe(0);
                expect(catalogStateSvc.catalogs.local.records.recordType).toBe(controller.recordType);
                expect(catalogStateSvc.catalogs.local.records.searchText).toBe(controller.searchText);
                expect(catalogStateSvc.setPagination).toHaveBeenCalled();
                expect(catalogStateSvc.catalogs.local.openedPath.length).toBe(1);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('search-row')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-8').length).toBe(1);
            expect(this.element.querySelectorAll('form.form-horizontal').length).toBe(1);
            expect(this.element.querySelectorAll('form .col-xs-2').length).toBe(1);
            expect(this.element.querySelectorAll('form .col-xs-10').length).toBe(1);
        });
        it('with a select', function() {
            expect(this.element.find('select').length).toBe(1);
        });
        it('with a text input', function() {
            expect(this.element.find('input').length).toBe(1);
        });
        it('with a search button', function() {
            expect(this.element.find('button').length).toBe(1);
        });
        it('depending on how many record types there are', function() {
            catalogManagerSvc.recordTypes = ['type0', 'type1'];
            scope.$digest();
            var options = this.element.querySelectorAll('select option');
            expect(options.length).toBe(catalogManagerSvc.recordTypes.length + 1);
        });
    });
    it('should call search when the button is clicked', function() {
        controller = this.element.controller('searchRow');
        spyOn(controller, 'search');

        var button = this.element.find('button');
        button.triggerHandler('click');
        expect(controller.search).toHaveBeenCalled();
    });
});