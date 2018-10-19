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
describe('Record Block directive', function() {
    var $compile, scope, catalogManagerSvc, catalogStateSvc, utilSvc, $q;

    beforeEach(function() {
        module('templates');
        module('recordBlock');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _catalogStateService_, _utilService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        catalogStateSvc.getCurrentCatalog.and.returnValue(catalogStateSvc.catalogs.local);
        this.record = {'@id': 'record'};
        catalogStateSvc.catalogs.local.openedPath = [this.record];
        catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
        catalogManagerSvc.getRecord.and.returnValue($q.when(this.record));
        this.element = $compile(angular.element('<record-block></record-block>'))(scope);
        this.headers = {
            'x-total-count': 2,
        };
        this.response = {
            data: {

            },
            headers: jasmine.createSpy('headers').and.returnValue(this.headers)
        };
        catalogManagerSvc.getRecordBranches.and.returnValue($q.when(this.response));
        scope.$digest();
        this.controller = this.element.controller('recordBlock');
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
        describe('if the record is found', function() {
            it('successfully', function() {
                expect(this.controller.record).toEqual(this.record);
                expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.record['@id'], catalogStateSvc.catalogs.local.catalog['@id']);
            });
            it('if the record is a VersionedRDFRecord', function() {
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalled();
            });
        });
        it('unless the record is not found', function() {
            catalogManagerSvc.getRecord.and.returnValue($q.reject('Error message'));
            this.element = $compile(angular.element('<record-block></record-block>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('recordBlock');
            expect(this.controller.record).toEqual({});
            expect(catalogStateSvc.catalogs.local.openedPath).toEqual([]);
        });
    });
    describe('controller methods', function() {
        describe('should get branches', function() {
            beforeEach(function() {
                catalogManagerSvc.getRecordBranches.calls.reset();
            });
            it('unless the record is not a VersionedRDFRecord', function() {
                catalogManagerSvc.isVersionedRDFRecord.and.returnValue(false);
                scope.$digest();
                expect(catalogManagerSvc.getRecordBranches).not.toHaveBeenCalled();
            });
            describe('if the record is a VersionedRDFRecord', function() {
                beforeEach(function() {
                    catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
                    this.controller.record = this.record;
                    this.expectedPaginationConfig = {
                        pageIndex: 0,
                        limit: catalogStateSvc.catalogs.local.branches.limit,
                        sortOption: undefined
                    };
                });
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordBranches.and.returnValue($q.reject('Error Message'));
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.controller.record['@id'], catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
                it('successfully', function() {
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.controller.record['@id'], catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('record-block')).toBe(true);
            expect(this.element.hasClass('col')).toBe(true);
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
        it('with a catalog-breadcrumb', function() {
            expect(this.element.find('catalog-breadcrumb').length).toBe(1);
        });
        it('with an entity-title h3', function() {
            expect(this.element.querySelectorAll('h3.entity-title').length).toBe(1);
        });
        it('with a record-types', function() {
            expect(this.element.find('record-types').length).toBe(1);
        });
        it('with a entity-dates', function() {
            expect(this.element.find('entity-dates').length).toBe(1);
        });
        it('with a entity-description', function() {
            expect(this.element.find('entity-description').length).toBe(1);
        });
        it('with a record-keywords', function() {
            expect(this.element.find('record-keywords').length).toBe(1);
        });
        it('depending on whether the record is a VersionedRDFRecord', function() {
            expect(this.element.querySelectorAll('.branches-container').length).toBe(1);

            catalogManagerSvc.isVersionedRDFRecord.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.branches-container').length).toBe(0);
            expect(this.element.find('block-footer').length).toBe(0);
        });
        it('depending on how many branches the record has', function() {
            catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
            catalogStateSvc.results = [{}];
            scope.$digest();
            var branches = this.element.querySelectorAll('.branches-list button.branch');
            expect(branches.length).toBe(catalogStateSvc.results.length);
            for (var i = 0; i < branches.length; i++) {
                var branch = angular.element(branches[i]);
                expect(branch.find('entity-dates').length).toBe(1);
                expect(branch.find('entity-description').length).toBe(1);
            }
        });
    });
    it('should load more branches when the load more button is clicked', function() {
        catalogStateSvc.results = [{}];
        spyOn(this.controller, 'loadMore');
        catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
        scope.$digest();

        var button = angular.element(this.element.querySelectorAll('.btn')[0]);
        button.triggerHandler('click');
        expect(this.controller.loadMore).toHaveBeenCalled();
    });
});