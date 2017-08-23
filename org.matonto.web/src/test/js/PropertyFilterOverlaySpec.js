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
describe('Property Filter Overlay directive', function() {
    var $compile, scope, element, controller, utilSvc, ontologyManagerSvc, discoverStateSvc, searchSvc;

    beforeEach(function() {
        module('templates');
        module('propertyFilterOverlay');
        mockDiscoverState();
        mockUtil();
        mockSearch();
        mockPrefixes();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _ontologyManagerService_, _discoverStateService_, _searchService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            discoverStateSvc = _discoverStateService_;
            searchSvc = _searchService_;
        });

        scope.closeOverlay = jasmine.createSpy('closeOverlay');
        element = $compile(angular.element('<property-filter-overlay close-overlay="closeOverlay()"></property-filter-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('propertyFilterOverlay');
        controller.range = 'range';
        controller.property = {'@id': 'id'};
    });

    describe('controller bound variable', function() {
        it('closeOverlay to be called in parent scope', function() {
            controller.closeOverlay();
            scope.$apply();
            expect(scope.closeOverlay).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('property-filter-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .main', function() {
            expect(element.querySelectorAll('.main').length).toBe(1);
        });
        it('with a .parts', function() {
            expect(element.querySelectorAll('.parts').length).toBe(1);
        });
        it('with a property-selector', function() {
            expect(element.find('property-selector').length).toBe(1);
        });
        it('with a filter-selector', function() {
            expect(element.find('filter-selector').length).toBe(0);
            scope.$apply();
            expect(element.find('filter-selector').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .btn-primary', function() {
            expect(element.querySelectorAll('.btn-primary').length).toBe(0);
            scope.$apply();
            expect(element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a .btn-default', function() {
            expect(element.querySelectorAll('.btn-default').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('submittable should return the correct value when filterType is', function() {
            it('Contains', function() {
                controller.filterType = 'Contains';
                expect(controller.submittable()).toBeFalsy();
                controller.value = 'value';
                expect(controller.submittable()).toBeTruthy();
            });
            it('Exact', function() {
                controller.filterType = 'Exact';
                expect(controller.submittable()).toBeFalsy();
                controller.value = 'value';
                expect(controller.submittable()).toBeTruthy();
            });
            it('Existence', function() {
                controller.filterType = 'Existence';
                expect(controller.submittable()).toBe(true);
            });
            it('Range', function() {
                controller.filterType = 'Range';
                expect(controller.submittable()).toBeFalsy();
                controller.begin = 'begin';
                expect(controller.submittable()).toBeFalsy();
                controller.end = 'end';
                expect(controller.submittable()).toBeTruthy();
            });
            it('Regex', function() {
                controller.filterType = 'Regex';
                expect(controller.submittable()).toBeFalsy();
                controller.regex = '/[a-zA-Z]/';
                expect(controller.submittable()).toBeTruthy();
            });
            it('something else', function() {
                controller.filterType = 'Other';
                expect(controller.submittable()).toBe(false);
            });
        });
        describe('submit should adjust the correct lists when filterType is', function() {
            beforeEach(function() {
                utilSvc.getBeautifulIRI.and.returnValue('range');
                ontologyManagerSvc.getEntityName.and.returnValue('name');
                controller.value = 'value';
            });
            it('Contains', function() {
                controller.filterType = 'Contains';
                searchSvc.createContainsQuery.and.returnValue({prop: 'contains query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'Contains "value"',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createContainsQuery).toHaveBeenCalledWith('id', 'value');
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'contains query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Exact', function() {
                controller.filterType = 'Exact';
                searchSvc.createExactQuery.and.returnValue({prop: 'exact query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'Exactly matches "value"',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createExactQuery).toHaveBeenCalledWith('id', 'value', 'range');
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'exact query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Existence', function() {
                controller.filterType = 'Existence';
                searchSvc.createExistenceQuery.and.returnValue({prop: 'existence query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'Existence',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createExistenceQuery).toHaveBeenCalledWith('id');
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'existence query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Greater than', function() {
                controller.filterType = 'Greater than';
                searchSvc.createRangeQuery.and.returnValue({prop: 'range query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'value > value',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('id', {greaterThan: 'value'});
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'range query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Greater than or equal to', function() {
                controller.filterType = 'Greater than or equal to';
                searchSvc.createRangeQuery.and.returnValue({prop: 'range query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'value >= value',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('id', {greaterThanOrEqualTo: 'value'});
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'range query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Less than', function() {
                controller.filterType = 'Less than';
                searchSvc.createRangeQuery.and.returnValue({prop: 'range query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'value < value',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('id', {lessThan: 'value'});
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'range query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Less than or equal to', function() {
                controller.filterType = 'Less than or equal to';
                searchSvc.createRangeQuery.and.returnValue({prop: 'range query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'value <= value',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('id', {lessThanOrEqualTo: 'value'});
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'range query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Range', function() {
                controller.begin = 'begin';
                controller.end = 'end';
                controller.filterType = 'Range';
                searchSvc.createRangeQuery.and.returnValue({prop: 'range query'});
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'begin <= value <= end',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createRangeQuery).toHaveBeenCalledWith('id', {lessThanOrEqualTo: 'end', greaterThanOrEqualTo: 'begin'});
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'range query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Regex', function() {
                controller.filterType = 'Regex';
                searchSvc.createRegexQuery.and.returnValue({prop: 'regex query'});
                controller.regex = '/[a-zA-Z]/';
                controller.submit();
                expect(discoverStateSvc.search.filterMeta).toContain({
                    display: 'Matches /[a-zA-Z]/',
                    range: 'range',
                    title: 'name'
                });
                expect(searchSvc.createRegexQuery).toHaveBeenCalledWith('id', '/[a-zA-Z]/');
                expect(discoverStateSvc.search.queryConfig.filters).toContain({prop: 'regex query'});
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
        });
    });
});
