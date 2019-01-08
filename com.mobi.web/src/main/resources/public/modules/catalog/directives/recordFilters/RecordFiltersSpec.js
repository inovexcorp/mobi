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

        scope.recordType = '';
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
            this.controller.recordType = 'test';
            scope.$digest();
            expect(scope.recordType).toEqual('');
        });
        it('changeFilter is called in the parent scope', function() {
            this.controller.changeFilter({recordType: 'test'});
            scope.$digest();
            expect(scope.changeFilter).toHaveBeenCalledWith('test');
        });
    });
    describe('controller methods', function() {
        it('should filter records', function() {
            this.controller.recordType = 'test';
            this.controller.filter();
            expect(scope.changeFilter).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-FILTERS');
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        it('depending on the number of sort options', function() {
            expect(this.element.find('option').length).toBe(catalogManagerSvc.recordTypes.length + 1);
        });
    });
});