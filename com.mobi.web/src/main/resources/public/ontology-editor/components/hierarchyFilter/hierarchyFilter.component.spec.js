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
describe('Hierarchy Filter component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('shared');
        angular.mock.module('ontology-editor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.filters = [];
        scope.updateFilters = jasmine.createSpy('updateFilters');
        scope.submitEvent = jasmine.createSpy('submitEvent');
        this.element = $compile(angular.element('<hierarchy-filter filters="filters" update-filters="updateFilters(value)" submit-event="submitEvent()"></hierarchy-filter>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('hierarchyFilter');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('filters should be one way bound', function() {
            this.controller.filters = ['test'];
            scope.$digest();
            expect(scope.filters).toEqual([]);
        });
        it('updateFilters should be called in parent scope', function() {
            this.controller.updateFilters({value: ['Test']});
            expect(scope.updateFilters).toHaveBeenCalledWith(['Test']);
        });
        it('submitEvent should be called in parent scope', function() {
            this.controller.submitEvent();
            expect(scope.submitEvent).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('HIERARCHY-FILTER');
            expect(this.element.querySelectorAll('.hierarchy-filter').length).toEqual(1);
        });
        it('with an a', function() {
            expect(this.element.find('a').length).toEqual(1);
        });
        it('with a ul', function() {
            expect(this.element.querySelectorAll('ul').length).toEqual(1);
        });
    });
    fdescribe('controller methods', function() {
        it('should update flag with checked value in this and parent scopes on apply', function() {
            this.controller.filters = [{checked: true, flag: false}];
            this.controller.apply();

            expect(this.controller.filters).toEqual([{checked: true, flag: true}]);
            expect(scope.updateFilters).toHaveBeenCalledWith([{checked: true, flag: true}]);
        });
        it('should set numFilters to number of flagged filters on apply', function() {
            this.controller.numFilters = 0;
            this.controller.filters = [{checked: true, flag: false}];
            this.controller.apply();

            expect(this.controller.numFilters).toEqual(1);
        });
        it('should perform a filter on apply', function() {
            this.controller.numFilters = 0;
            this.controller.filters = [{checked: true, flag: false}];
            this.controller.apply();

            expect(scope.submitEvent).toHaveBeenCalled();
        });
        it('should set dropdown to closed on apply', function() {
            this.controller.dropdownOpen = true;
            this.controller.filters = [{checked: true, flag: false}];
            this.controller.apply();
            expect(this.controller.dropdownOpen).toEqual(false);
        });
        it('should reset checked values with flagged values when dropdown is closed', function() {
            this.controller.filters = [{checked: true, flag: false}];
            this.controller.dropdownToggled(false);
            expect(this.controller.filters).toEqual([{checked: false, flag: false}]);
        });
        it('should not change checked values when dropdown is opened', function() {
            this.controller.filters = [{checked: true, flag: false}];
            this.controller.dropdownToggled(true);
            expect(this.controller.filters).toEqual([{checked: true, flag: false}]);
        });
    });
});