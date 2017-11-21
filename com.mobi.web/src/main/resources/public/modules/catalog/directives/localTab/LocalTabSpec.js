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
describe('Local Tab directive', function() {
    var $compile, scope, catalogStateSvc, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('localTab');
        mockCatalogState();
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _catalogStateService_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        this.element = $compile(angular.element('<local-tab></local-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('localTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogStateSvc = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should get the opened entity in the local catalog', function() {
            expect(this.controller.getOpenedEntity()).toBeUndefined();

            catalogStateSvc.catalogs.local.openedPath = [{'@id': '1'}];
            expect(this.controller.getOpenedEntity()).toEqual({'@id': '1'});

            catalogStateSvc.catalogs.local.openedPath = [{'@id': '1'}, {'@id': '2'}];
            expect(this.controller.getOpenedEntity()).toEqual({'@id': '2'});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('local-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a search row', function() {
            expect(this.element.find('search-row').length).toBe(1);
        });
        it('depending on the length of the opened path', function() {
            expect(this.element.find('results-block').length).toBe(0);

            catalogStateSvc.catalogs.local.openedPath = [{}];
            scope.$digest();
            expect(this.element.find('results-block').length).toBe(1);

            catalogStateSvc.catalogs.local.openedPath = [{}, {}];
            scope.$digest();
            expect(this.element.find('results-block').length).toBe(0);
        });
        it('depending on whether the opened entity is a record', function() {
            expect(this.element.find('record-block').length).toBe(0);

            catalogManagerSvc.isRecord.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('record-block').length).toBe(1);
        });
        it('depending on whether the opened entity is a branch', function() {
            expect(this.element.find('branch-block').length).toBe(0);

            catalogManagerSvc.isBranch.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('branch-block').length).toBe(1);
        });
    });
});
