/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
    var $compile, scope, utilSvc, ontologyManagerSvc, discoverStateSvc, searchSvc;

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
        this.element = $compile(angular.element('<property-filter-overlay close-overlay="closeOverlay()"></property-filter-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertyFilterOverlay');
        this.controller.range = 'range';
        this.controller.property = {'@id': 'id'};
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        ontologyManagerSvc = null;
        discoverStateSvc = null;
        searchSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('closeOverlay to be called in parent scope', function() {
            this.controller.closeOverlay();
            scope.$apply();
            expect(scope.closeOverlay).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('property-filter-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with a .main', function() {
            expect(this.element.querySelectorAll('.main').length).toBe(1);
        });
        it('with a .path', function() {
            expect(this.element.querySelectorAll('.path').length).toBe(1);
        });
        it('with .path spans', function() {
            expect(this.element.querySelectorAll('.path span').length).toBe(0);
            scope.$apply();
            expect(this.element.querySelectorAll('.path span').length).toBe(1);
        });
        it('with a property-selector', function() {
            expect(this.element.find('property-selector').length).toBe(1);
        });
        it('with a filter-selector', function() {
            expect(this.element.find('filter-selector').length).toBe(0);
            this.controller.showFilter = true;
            scope.$apply();
            expect(this.element.find('filter-selector').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .btn-primary', function() {
            expect(this.element.querySelectorAll('.btn-primary').length).toBe(0);
            this.controller.path = [{}];
            scope.$apply();
            expect(this.element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a regular .btn', function() {
            expect(this.element.querySelectorAll('.btn:not(.btn-primary)').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('submittable should return the correct value when filterType is', function() {
            it('Boolean', function() {
                this.controller.filterType = 'Boolean';
                this.controller.boolean = undefined;
                expect(this.controller.submittable()).toBe(false);
                this.controller.boolean = true;
                expect(this.controller.submittable()).toBe(true);
                this.controller.boolean = false;
                expect(this.controller.submittable()).toBe(true);
            });
            it('Contains', function() {
                this.controller.filterType = 'Contains';
                expect(this.controller.submittable()).toBe(false);
                this.controller.value = 'value';
                expect(this.controller.submittable()).toBe(true);
            });
            it('Exact', function() {
                this.controller.filterType = 'Exact';
                expect(this.controller.submittable()).toBe(false);
                this.controller.value = 'value';
                expect(this.controller.submittable()).toBe(true);
            });
            it('Existence', function() {
                this.controller.filterType = 'Existence';
                expect(this.controller.submittable()).toBe(true);
            });
            it('Range', function() {
                this.controller.filterType = 'Range';
                expect(this.controller.submittable()).toBe(false);
                this.controller.begin = 'begin';
                expect(this.controller.submittable()).toBeFalsy();
                this.controller.end = 'end';
                expect(this.controller.submittable()).toBe(true);
            });
            it('Regex', function() {
                this.controller.filterType = 'Regex';
                expect(this.controller.submittable()).toBe(false);
                this.controller.regex = '/[a-zA-Z]/';
                expect(this.controller.submittable()).toBe(true);
            });
            it('undefined', function() {
                this.controller.filterType = undefined;
                expect(this.controller.submittable()).toBeFalsy();
                this.controller.path = [{}];
                this.controller.showFilter = false;
                expect(this.controller.submittable()).toBeTruthy();
            });
            it('something else', function() {
                this.controller.filterType = 'Other';
                expect(this.controller.submittable()).toBe(false);
            });
        });
        describe('submit should adjust the correct lists when filterType is', function() {
            beforeEach(function() {
                utilSvc.getBeautifulIRI.and.returnValue('range');
                ontologyManagerSvc.getEntityName.and.returnValue('name');
                this.controller.value = 'value';
                this.controller.path = [{property: {'@id': 'id'}, range: 'range'}, {property: {'@id': 'id2'}, range: 'range2'}];
                this.config = {
                    path: [{predicate: 'id', range: 'range'}, {predicate: 'id2', range: 'range2'}],
                    title: 'name > name'
                };
            });
            it('Boolean', function() {
                this.controller.filterType = 'Boolean';
                this.controller.boolean = false;
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    boolean: false,
                    display: 'Is false',
                    type: 'Boolean'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Contains', function() {
                this.controller.filterType = 'Contains';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'Contains "value"',
                    type: 'Contains',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Exact', function() {
                this.controller.filterType = 'Exact';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'Exactly matches "value"',
                    type: 'Exact',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Existence', function() {
                this.controller.filterType = 'Existence';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'Existence',
                    type: 'Existence'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Greater than', function() {
                this.controller.filterType = 'Greater than';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'value > value',
                    type: 'Greater than',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Greater than or equal to', function() {
                this.controller.filterType = 'Greater than or equal to';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'value >= value',
                    type: 'Greater than or equal to',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Less than', function() {
                this.controller.filterType = 'Less than';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'value < value',
                    type: 'Less than',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Less than or equal to', function() {
                this.controller.filterType = 'Less than or equal to';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'value <= value',
                    type: 'Less than or equal to',
                    value: 'value'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Range', function() {
                this.controller.begin = 'begin';
                this.controller.end = 'end';
                this.controller.filterType = 'Range';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    begin: 'begin',
                    display: 'begin <= value <= end',
                    end: 'end',
                    type: 'Range'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('Regex', function() {
                this.controller.filterType = 'Regex';
                this.controller.regex = '/[a-zA-Z]/';
                this.controller.submit();
                expect(discoverStateSvc.search.queryConfig.filters).toContain(_.assign(this.config, {
                    display: 'Matches /[a-zA-Z]/',
                    type: 'Regex',
                    regex: '/[a-zA-Z]/'
                }));
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
        });
        describe('propertySelected should set the variables correctly when isObjectProperty returns', function() {
            beforeEach(function() {
                this.controller.property = {'@id': 'id'};
            });
            it('true', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.controller.range = 'range';
                this.controller.propertySelected();
                expect(this.controller.path).toEqual([{property: {'@id': 'id'}, range: 'range'}]);
                expect(this.controller.keys).toEqual(['range']);
                expect(this.controller.property).toBeUndefined();
                expect(this.controller.range).toBeUndefined();
            });
            it('false', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                this.controller.showFilter = false;
                this.controller.propertySelected();
                expect(this.controller.showFilter).toBe(true);
            });
        });
    });
});
