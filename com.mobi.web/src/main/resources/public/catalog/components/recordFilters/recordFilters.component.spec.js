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

describe('Record Filters component', function() {
    var $compile, scope, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogManager();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
        });

        catalogManagerSvc.recordTypes = ['test1', 'test2'];

        scope.recordType = 'test1';
        scope.changeFilter = jasmine.createSpy('changeFilter');
        this.element = $compile(angular.element('<record-filters record-type="recordType" change-filter="changeFilter(recordType)"></record-filters>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordFilters');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('recordType is one way bound', function() {
            this.controller.recordType = '';
            scope.$digest();
            expect(scope.recordType).toEqual('test1');
        });
        it('changeFilter is called in the parent scope', function() {
            this.controller.changeFilter({recordType: 'test'});
            scope.$digest();
            expect(scope.changeFilter).toHaveBeenCalledWith('test');
        });
    });
    describe('initializes correctly', function() {
        it('with record types', function() {
            expect(this.controller.recordTypes).toEqual([{value: 'test1', checked: true}, {value: 'test2', checked: false}]);
        });
    });
    describe('controller methods', function() {
        describe('should filter records', function() {
            beforeEach(function() {
                this.firstFilter = {value: 'test1', checked: true};
                this.secondFilter = {value: 'test2', checked: true};
                this.controller.recordTypes = [this.firstFilter, this.secondFilter];
            });
            it('if the filter has been checked', function() {
                this.controller.filter(this.firstFilter);
                expect(this.secondFilter.checked).toEqual(false);
                expect(scope.changeFilter).toHaveBeenCalledWith(this.firstFilter.value);
            });
            it('if the filter has been unchecked', function() {
                this.firstFilter.checked = false;
                this.controller.recordType = this.firstFilter.value;
                this.controller.filter(this.firstFilter);
                expect(scope.changeFilter).toHaveBeenCalledWith('');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-FILTERS');
            expect(this.element.querySelectorAll('.record-filters').length).toEqual(1);
            expect(this.element.querySelectorAll('.filter-container').length).toEqual(1);
            expect(this.element.querySelectorAll('.record-filter-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.filter-options').length).toEqual(1);
        });
        it('depending on the number of sort options', function() {
            expect(this.element.querySelectorAll('.filter-option').length).toBe(catalogManagerSvc.recordTypes.length);
        });
    });
});