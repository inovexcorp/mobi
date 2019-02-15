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
describe('Sort Options component', function() {
    var $compile, scope, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
        });

        catalogManagerSvc.sortOptions = [{label: 'test'}];
        scope.sortOption = undefined;
        scope.changeSort = jasmine.createSpy('changeSort');
        this.element = $compile(angular.element('<sort-options sort-option="sortOption" change-sort="changeSort(sortOption)"></sort-options>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('sortOptions');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('sortOption should be one way bound', function() {
            this.controller.sortOption = {};
            scope.$digest();
            expect(scope.sortOption).toEqual(undefined);
        });
        it('changeSort should be called in parent scope when invoked', function() {
            this.controller.changeSort({sortOption: {}});
            expect(scope.changeSort).toHaveBeenCalledWith({});
        });
    });
    describe('controller methods', function() {
        it('should sort records', function() {
            this.controller.sortOption = catalogManagerSvc.sortOptions[0];
            this.controller.sort();
            expect(scope.changeSort).toHaveBeenCalledWith(catalogManagerSvc.sortOptions[0]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SORT-OPTIONS');
            expect(this.element.querySelectorAll('.sort-options').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        it('with a select', function() {
            expect(this.element.find('select').length).toBe(1);
        });
        it('depending on the number of sort options', function() {
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
    });
});