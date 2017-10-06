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
        it('with a .path', function() {
            expect(element.querySelectorAll('.path').length).toBe(1);
        });
        it('with .path spans', function() {
            expect(element.querySelectorAll('.path span').length).toBe(0);
            scope.$apply();
            expect(element.querySelectorAll('.path span').length).toBe(1);
        });
        it('with a property-selector', function() {
            expect(element.find('property-selector').length).toBe(1);
        });
        it('with a filter-selector', function() {
            expect(element.find('filter-selector').length).toBe(0);
            controller.showFilter = true;
            scope.$apply();
            expect(element.find('filter-selector').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .btn-primary', function() {
            expect(element.querySelectorAll('.btn-primary').length).toBe(0);
            controller.path = [{}];
            scope.$apply();
            expect(element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a .btn-default', function() {
            expect(element.querySelectorAll('.btn-default').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('submittable should return the correct value when filterType is', function() {
            it('Boolean', function() {
                controller.filterType = 'Boolean';
                controller.boolean = undefined;
                expect(controller.submittable()).toBe(false);
                controller.boolean = true;
                expect(controller.submittable()).toBe(true);
                controller.boolean = false;
                expect(controller.submittable()).toBe(true);
            });
            it('Contains', function() {
                controller.filterType = 'Contains';
                expect(controller.submittable()).toBe(false);
                controller.value = 'value';
                expect(controller.submittable()).toBe(true);
            });
            it('Exact', function() {
                controller.filterType = 'Exact';
                expect(controller.submittable()).toBe(false);
                controller.value = 'value';
                expect(controller.submittable()).toBe(true);
            });
            it('Existence', function() {
                controller.filterType = 'Existence';
                expect(controller.submittable()).toBe(true);
            });
            it('Range', function() {
                controller.filterType = 'Range';
                expect(controller.submittable()).toBe(false);
                controller.begin = 'begin';
                expect(controller.submittable()).toBeFalsy();
                controller.end = 'end';
                expect(controller.submittable()).toBe(true);
            });
            it('Regex', function() {
                controller.filterType = 'Regex';
                expect(controller.submittable()).toBe(false);
                controller.regex = '/[a-zA-Z]/';
                expect(controller.submittable()).toBe(true);
            });
            it('undefined', function() {
                controller.filterType = undefined;
                expect(controller.submittable()).toBeFalsy();
                controller.path = [{}];
                controller.showFilter = false;
                expect(controller.submittable()).toBeTruthy();
            });
            it('something else', function() {
                controller.filterType = 'Other';
                expect(controller.submittable()).toBe(false);
            });
        });
        describe('submit should adjust the correct lists when filterType is', function() {
            var config = {};
            beforeEach(function() {
                utilSvc.getBeautifulIRI.and.returnValue('range');
                ontologyManagerSvc.getEntityName.and.returnValue('name');
                controller.value = 'value';
                controller.path = [{property: {'@id': 'id'}, range: 'range'}, {property: {'@id': 'id2'}, range: 'range2'}];
                config = {
                    path: [{predicate: 'id', range: 'range'}, {predicate: 'id2', range: 'range2'}],
                    title: 'name > name'
                };
            });
            it('Boolean', function() {
                controller.filterType = 'Boolean';
                controller.boolean = false;
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    boolean: false,
                    display: 'Is false',
                    type: 'Boolean'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Contains', function() {
                controller.filterType = 'Contains';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'Contains "value"',
                    type: 'Contains',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Exact', function() {
                controller.filterType = 'Exact';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'Exactly matches "value"',
                    type: 'Exact',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Existence', function() {
                controller.filterType = 'Existence';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'Existence',
                    type: 'Existence'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Greater than', function() {
                controller.filterType = 'Greater than';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'value > value',
                    type: 'Greater than',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Greater than or equal to', function() {
                controller.filterType = 'Greater than or equal to';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'value >= value',
                    type: 'Greater than or equal to',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Less than', function() {
                controller.filterType = 'Less than';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'value < value',
                    type: 'Less than',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Less than or equal to', function() {
                controller.filterType = 'Less than or equal to';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'value <= value',
                    type: 'Less than or equal to',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Range', function() {
                controller.begin = 'begin';
                controller.end = 'end';
                controller.filterType = 'Range';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    begin: 'begin',
                    display: 'begin <= value <= end',
                    end: 'end',
                    type: 'Range'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Regex', function() {
                controller.filterType = 'Regex';
                controller.regex = '/[a-zA-Z]/';
                controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(config, {
                    display: 'Matches /[a-zA-Z]/',
                    type: 'Regex',
                    regex: '/[a-zA-Z]/'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
        });
        describe('propertySelected should set the variables correctly when isObjectProperty returns', function() {
            beforeEach(function() {
                controller.property = {'@id': 'id'};
            });
            it('true', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                controller.range = 'range';
                controller.propertySelected();
                expect(controller.path).toEqual([{property: {'@id': 'id'}, range: 'range'}]);
                expect(controller.keys).toEqual(['range']);
                expect(controller.property).toBeUndefined();
                expect(controller.range).toBeUndefined();
            });
            it('false', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                controller.showFilter = false;
                controller.propertySelected();
                expect(controller.showFilter).toBe(true);
            });
        });
    });
});
