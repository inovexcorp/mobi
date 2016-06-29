/*-
 * #%L
 * org.matonto.web
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
describe('Filter List directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('filterList');
        mockCatalogManager();

        inject(function(_catalogManagerService_) {
            catalogManagerSvc = _catalogManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            scope.catalogManagerService = catalogManagerSvc;
            this.element = $compile(angular.element('<filter-list></filter-list>'))(scope);
            scope.$digest();
        });
        it('should test whether an option should be hidden', function() {
            var controller = this.element.controller('filterList');
            var result = controller.isHidden('Resources', {applied: false});
            expect(result).toBe(false);

            scope.catalogManagerService.filters.Resources = [{applied: true}, {applied: false}];
            scope.$digest();
            result = controller.isHidden('Resources', {applied: false});
            expect(result).toBe(true);
        });
        it('should apply a filter', function() {
            scope.catalogManagerService.filters.Resources = [{applied: true}, {applied: false}];
            scope.$digest();
            var controller = this.element.controller('filterList');
            var option = scope.catalogManagerService.filters.Resources[1];
            controller.applyFilter('Resources', option);
            expect(option.applied).toBe(true);
            _.forEach(scope.catalogManagerService.filters.Resources, function(opt) {
                if (!_.isEqual(opt, option)) {
                    expect(opt.applied).toBe(false);
                }
            });
            expect(scope.catalogManagerService.getResources).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.catalogManagerService = catalogManagerSvc;
            this.element = $compile(angular.element('<filter-list></filter-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('filters')).toBe(true);
        });
        it('with the correct number of filters', function() {
            scope.catalogManagerService.filters.Resources = [{applied: true}, {applied: false}];
            scope.$digest();
            var controller = this.element.controller('filterList');
            var filters = this.element.querySelectorAll('.filter');
            expect(filters.length).toBe(_.keys(scope.catalogManagerService.filters).length);
            for (var i = 0; i < filters.length; i++) {
                var key = _.keys(scope.catalogManagerService.filters)[i];
                expect(filters[i].querySelectorAll('.filter-header').length).toBe(1);
                expect(filters[i].querySelectorAll('.filter-options').length).toBe(1);
                expect(filters[i].querySelectorAll('li').length).toBe(scope.catalogManagerService.filters[key].length);
            }
        });
        it('with the correct classes depending on whether an option is applied', function() {
            scope.catalogManagerService.filters.Resources = [{applied: true}, {applied: false}];
            scope.$digest();
            var filters = this.element.querySelectorAll('.filter');
            for (var i = 0; i < filters.length; i++) {
                var key = _.keys(scope.catalogManagerService.filters)[i];
                var options = filters[i].querySelectorAll('.filter-options li');
                for (var j = 0; j < options.length; j++) {
                    var el = angular.element(options[j]);
                    var i = angular.element(el.find('i')[0]);
                    if (scope.catalogManagerService.filters[key][j].applied) {
                        expect(el.hasClass('applied')).toBe(true);
                        expect(el.hasClass('not-applied')).toBe(false);
                        expect(i.hasClass('fa-times-circle')).toBe(true);
                        expect(i.hasClass('fa-plus-circle')).toBe(false);
                    } else {
                        expect(el.hasClass('applied')).toBe(false);
                        expect(el.hasClass('not-applied')).toBe(true);
                        expect(i.hasClass('fa-times-circle')).toBe(false);
                        expect(i.hasClass('fa-plus-circle')).toBe(true);
                    }
                }
            }
        });
        it('with a triangle if an option is applied', function() {
            scope.catalogManagerService.filters.Resources = [{applied: true}, {applied: false}];
            scope.$digest();
            var filters = this.element.querySelectorAll('.filter');
            for (var i = 0; i < filters.length; i++) {
                var key = _.keys(scope.catalogManagerService.filters)[i];
                var options = filters[i].querySelectorAll('.filter-options li');
                for (var j = 0; j < options.length; j++) {
                    var el = angular.element(options[j]);
                    if (scope.catalogManagerService.filters[key][j].applied) {
                        expect(el.querySelectorAll('.triangle-right').length).toBe(1);
                    } else {
                        expect(el.querySelectorAll('.triangle-right').length).toBe(0);
                    }
                }
            }
        });
    });
    it('should call applyFilter when a filter option is clicked', function() {
        scope.catalogManagerService = catalogManagerSvc;
        scope.catalogManagerService.filters.Resources = [{applied: true}];
        var element = $compile(angular.element('<filter-list></filter-list>'))(scope);
        scope.$digest();
        var controller = element.controller('filterList');
        spyOn(controller, 'applyFilter');

        var option = element.querySelectorAll('.filter .filter-options li a')[0];
        angular.element(option).triggerHandler('click');

        expect(controller.applyFilter).toHaveBeenCalled();
    });
});