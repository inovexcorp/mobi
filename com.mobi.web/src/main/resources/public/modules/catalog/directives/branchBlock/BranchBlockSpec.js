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
describe('Branch Block directive', function() {
    var $compile, scope, $q, catalogManagerSvc, catalogStateSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('branchBlock');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();
        mockPrefixes();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _catalogStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        catalogStateSvc.getCurrentCatalog.and.returnValue(catalogStateSvc.catalogs.local);
        this.branch = {'@id': 'branch'};
        catalogStateSvc.catalogs.local.openedPath = [this.branch];
        catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
        this.element = $compile(angular.element('<branch-block></branch-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('branchBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize with the correct entity for the branch', function() {
        it('successfully', function() {
            expect(this.controller.branch).toEqual(this.branch);
            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branch['@id'], jasmine.any(String), catalogStateSvc.catalogs.local.catalog['@id']);
        });
        it('unless an error occurs', function() {
            catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('Error message'));
            this.element = $compile(angular.element('<branch-block></branch-block>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('branchBlock');
            expect(this.controller.branch).toEqual({});
            expect(catalogStateSvc.resetPagination).toHaveBeenCalled();
            expect(catalogStateSvc.catalogs.local.openedPath).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('branch-block')).toBe(true);
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
        it('with a entity-dates', function() {
            expect(this.element.find('entity-dates').length).toBe(1);
        });
        it('with a entity-description', function() {
            expect(this.element.find('entity-description').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a commit-history-table', function() {
            expect(this.element.find('commit-history-table').length).toBe(1);
        });
    });
});