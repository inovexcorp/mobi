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
describe('Property Selector directive', function() {
    var $compile, scope, element, controller, utilSvc, ontologyManagerSvc, discoverStateSvc, searchSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('propertySelector');
        mockDiscoverState();
        mockUtil();
        mockSearch();
        mockPrefixes();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _ontologyManagerService_, _discoverStateService_, _searchService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            discoverStateSvc = _discoverStateService_;
            searchSvc = _searchService_;
            prefixes = _prefixes_;
        });

        ontologyManagerSvc.getEntityName.and.callFake(_.identity);

        scope.keys = ['key'];
        scope.property = {'@id': 'id'};
        scope.range = 'range';
        element = $compile(angular.element('<property-selector keys="keys" property="property" range="range"></property-selector>'))(scope);
        scope.$digest();
        controller = element.controller('propertySelector');
    });

    describe('controller bound variable', function() {
        it('keys should be two way bound', function() {
            controller.keys = ['new-key'];
            scope.$apply();
            expect(scope.keys).toEqual(['new-key']);
        });
        it('property should be two way bound', function() {
            controller.property = {'@id': 'new-id'};
            scope.$apply();
            expect(scope.property).toEqual({'@id': 'new-id'});
        });
        it('range should be two way bound', function() {
            controller.range = 'new-range';
            scope.$apply();
            expect(scope.range).toEqual('new-range');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('property-selector')).toBe(true);
        });
        describe('with no controller.property', function() {
            beforeEach(function() {
                controller.property = undefined;
                controller.propertySearch = 'id';
                discoverStateSvc.search.properties = {
                    key: [{'@id': 'id'}]
                };
                discoverStateSvc.search.noDomains = [{'@id': 'id'}];
                scope.$apply();
            });
            it('with a .form-group', function() {
                expect(element.querySelectorAll('.form-group').length).toBe(1);
            });
            it('with a custom-label', function() {
                expect(element.find('custom-label').length).toBe(1);
            });
            it('with a md-select', function() {
                expect(element.find('md-select').length).toBe(1);
            });
            it('with a md-select-header', function() {
                expect(element.find('md-select-header').length).toBe(1);
            });
            it('with a input', function() {
                expect(element.find('input').length).toBe(1);
            });
            it('with md-optgroups', function() {
                expect(element.find('md-optgroup').length).toBe(2);
            });
            it('with md-options', function() {
                expect(element.find('md-optgroup').length).toBe(2);
            });
        });
        describe('with a controller.property and one controller.ranges', function() {
            it('with a .form-group', function() {
                controller.ranges = ['range'];
                scope.$apply();
                expect(element.querySelectorAll('.form-group').length).toBe(0);
            });
        });
        describe('with a controller.property and two controller.ranges', function() {
            beforeEach(function() {
                controller.ranges = ['range', 'range2'];
                scope.$apply();
            });
            it('with a .form-group', function() {
                expect(element.querySelectorAll('.form-group').length).toBe(1);
            });
            it('with a custom-label', function() {
                expect(element.find('custom-label').length).toBe(1);
            });
            it('with a md-select', function() {
                expect(element.find('md-select').length).toBe(1);
            });
            it('with a md-select-header', function() {
                expect(element.find('md-select-header').length).toBe(1);
            });
            it('with a input', function() {
                expect(element.find('input').length).toBe(1);
            });
            it('with md-options', function() {
                expect(element.find('md-option').length).toBe(2);
            });
        });
    });
    describe('controller methods', function() {
        it('getSelectedPropertyText should return the correct value', function() {
            ontologyManagerSvc.getEntityName.and.returnValue('name');
            expect(controller.getSelectedPropertyText()).toEqual('name');
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'id'});
            
            controller.property = undefined;
            expect(controller.getSelectedPropertyText()).toEqual('');
        });
        it('getSelectedRangeText should return the correct value', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(controller.getSelectedRangeText()).toEqual('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('range');
            
            controller.range = undefined;
            expect(controller.getSelectedRangeText()).toEqual('');
        });
        it('orderRange should call the correct function', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(controller.orderRange({'@id': 'id'})).toBe('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('id');
        });
        describe('shouldDisplayOptGroup should return the correct value with', function() {
            beforeEach(function() {
                discoverStateSvc.search.properties = {
                    type: ['type'],
                    iri: [''],
                    other: ['']
                };
            });
            it('no queryConfig types', function() {
                expect(controller.shouldDisplayOptGroup('type')).toBe(true);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('type');
            });
            it('queryConfig types', function() {
                discoverStateSvc.search.queryConfig.types = [{classIRI: 'iri'}];
                expect(controller.shouldDisplayOptGroup('iri')).toBe(true);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('');
                expect(controller.shouldDisplayOptGroup('other')).toBe(false);
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalledWith('other');
            });
            it('nothing left after filter', function() {
                controller.propertySearch = 'word';
                expect(controller.shouldDisplayOptGroup('type')).toBe(false);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('type');
            });
        });
        describe('propertyChanged should set variables correctly when ranges is equal to', function() {
            it('one', function() {
                controller.propertyChanged();
                expect(controller.ranges).toEqual([{'@id': prefixes.xsd + 'string'}]);
                expect(controller.range).toEqual(prefixes.xsd + 'string');
            });
            it('more than one', function() {
                controller.property[prefixes.rdfs + 'range'] = [{'@id': 'range1'}, {'@id': 'range2'}];
                controller.range = undefined;
                controller.propertyChanged();
                expect(controller.ranges).toEqual([{'@id': 'range1'}, {'@id': 'range2'}]);
                expect(controller.range).toBeUndefined();
            });
        });
        describe('showNoDomains should return the proper value for showing no domains group when', function() {
            it('noDomains is empty', function() {
                discoverStateSvc.search.noDomains = [];
                expect(controller.showNoDomains()).toBeFalsy();
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            });
            it('nothing left after filter', function() {
                discoverStateSvc.search.noDomains = ['domain'];
                controller.propertySearch = 'word';
                expect(controller.showNoDomains()).toBeFalsy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('domain');
            });
            it('something after filter', function() {
                discoverStateSvc.search.noDomains = ['domain'];
                controller.propertySearch = 'domain';
                expect(controller.showNoDomains()).toBeTruthy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('domain');
            });
            it('propertySearch is empty', function() {
                discoverStateSvc.search.noDomains = ['domain'];
                expect(controller.showNoDomains()).toBeTruthy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('domain');
            });
        });
    });
});
