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
describe('Sort Options directive', function() {
    var $compile,
        scope,
        catalogManagerSvc,
        catalogStateSvc;

    beforeEach(function() {
        module('templates');
        module('sortOptions');
        mockCatalogManager();
        mockCatalogState();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _catalogStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
        });

        catalogStateSvc.getCurrentCatalog.and.returnValue(catalogStateSvc.catalogs.local);
        catalogManagerSvc.sortOptions = [{label: 'test'}];
        scope.listKey = '';
        scope.changeSort = jasmine.createSpy('changeSort');
        this.element = $compile(angular.element('<sort-options list-key="listKey" change-sort="changeSort()"></sort-options>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('listKey should be one way bound', function() {
            this.isolatedScope.listKey = 'test';
            scope.$digest();
            expect(scope.listKey).toBe('');
        });
        it('changeSort should be called in parent scope when invoked', function() {
            this.isolatedScope.changeSort();
            expect(scope.changeSort).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('sort-options')).toBe(true);
        });
        it('with a select', function() {
            expect(this.element.find('select').length).toBe(1);
        });
        it('depending on how many sort options there are', function() {
            var labels = _.map(catalogManagerSvc.sortOptions, 'label');
            var options = this.element.find('option');
            expect(options.length).toBe(labels.length + 1);
            for (var i = 0; i < options.length; i++) {
                var option = angular.element(options[i]);
                if (option.val() !== '?') {
                    expect(labels).toContain(option.text());
                }
            }
        });
        it('depending on whether a sort option has been selected for the identified list', function() {
            scope.listKey = 'records';
            catalogStateSvc.catalogs.local.records.sortOption = catalogManagerSvc.sortOptions[0];
            scope.$digest();
            expect(angular.element(this.element.querySelectorAll('option[selected]')).text()).toBe(catalogManagerSvc.sortOptions[0].label);
        });
    });
});