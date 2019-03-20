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
describe('Property Selector component', function() {
    var $compile, scope, utilSvc, ontologyManagerSvc, discoverStateSvc, searchSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('search');
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

        ontologyManagerSvc.getEntityName.and.callFake(function(entity) {
            return entity['@id'];
        });
        discoverStateSvc.search.properties = {key: [{}]};

        scope.keys = ['key'];
        scope.updateKeys = jasmine.createSpy('updateKeys');
        scope.property = {'@id': 'id'};
        scope.updateProperty = jasmine.createSpy('updateProperty');
        scope.range = 'range';
        scope.updateRange = jasmine.createSpy('updateRange');
        scope.rangeChangeEvent = jasmine.createSpy('rangeChangeEvent');
        this.element = $compile(angular.element('<property-selector keys="keys" update-keys="updateKeys(value)" property="property" update-property="updateProperty(value)" range="range" update-range="updateRange(value)" range-change-event="rangeChangeEvent()"></property-selector>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertySelector');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        ontologyManagerSvc = null;
        discoverStateSvc = null;
        searchSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('keys should be one way bound', function() {
            var copy = angular.copy(this.controller.keys);
            this.controller.keys = ['new-key'];
            scope.$apply();
            expect(scope.keys).toEqual(copy);
        });
        it('updateKeys should be called in the parent scope', function() {
            this.controller.updateKeys({value: ['key1', 'key2']});
            expect(scope.updateKeys).toHaveBeenCalledWith(['key1', 'key2']);
        });
        it('property should be two way bound', function() {
            var copy = angular.copy(this.controller.property);
            this.controller.property = {'@id': 'new-id'};
            scope.$apply();
            expect(scope.property).toEqual(copy);
        });
        it('updateProperty should be called in the parent scope', function() {
            this.controller.updateProperty({value: {'@id': 'newId'}});
            expect(scope.updateProperty).toHaveBeenCalledWith({'@id': 'newId'});
        });
        it('range should be two way bound', function() {
            var copy = angular.copy(this.controller.range);
            this.controller.range = 'new-range';
            scope.$apply();
            expect(scope.range).toEqual(copy);
        });
        it('updateRange should be called in the parent scope', function() {
            this.controller.updateRange({value: 'Test'});
            expect(scope.updateRange).toHaveBeenCalledWith('Test');
        });
        it('rangeChangeEvent should be called in the parent scope', function() {
            this.controller.rangeChangeEvent();
            expect(scope.rangeChangeEvent).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('PROPERTY-SELECTOR');
        });
        describe('with no controller.property', function() {
            beforeEach(function() {
                this.controller.property = undefined;
                this.controller.propertySearch = 'id';
                discoverStateSvc.search.properties = {
                    key: [{'@id': 'id'}]
                };
                discoverStateSvc.search.noDomains = [{'@id': 'id'}];
                scope.$apply();
            });
            it('with a .form-group', function() {
                expect(this.element.querySelectorAll('.form-group').length).toBe(1);
            });
            it('with a custom-label', function() {
                expect(this.element.find('custom-label').length).toBe(1);
            });
            it('with a md-select', function() {
                expect(this.element.find('md-select').length).toBe(1);
            });
            it('with a md-select-header', function() {
                expect(this.element.find('md-select-header').length).toBe(1);
            });
            it('with a input', function() {
                expect(this.element.find('input').length).toBe(1);
            });
            it('with md-optgroups', function() {
                expect(this.element.find('md-optgroup').length).toBe(2);
            });
            it('with md-options', function() {
                expect(this.element.find('md-optgroup').length).toBe(2);
            });
        });
        describe('with a controller.property and one controller.ranges', function() {
            it('with a .form-group', function() {
                this.controller.ranges = ['range'];
                scope.$apply();
                expect(this.element.querySelectorAll('.form-group').length).toBe(0);
            });
        });
        describe('with a controller.property and two controller.ranges', function() {
            beforeEach(function() {
                this.controller.ranges = ['range', 'range2'];
                scope.$apply();
            });
            it('with a .form-group', function() {
                expect(this.element.querySelectorAll('.form-group').length).toBe(1);
            });
            it('with a custom-label', function() {
                expect(this.element.find('custom-label').length).toBe(1);
            });
            it('with a md-select', function() {
                expect(this.element.find('md-select').length).toBe(1);
            });
            it('with a md-select-header', function() {
                expect(this.element.find('md-select-header').length).toBe(1);
            });
            it('with a input', function() {
                expect(this.element.find('input').length).toBe(1);
            });
            it('with md-options', function() {
                expect(this.element.find('md-option').length).toBe(2);
            });
        });
    });
    describe('controller methods', function() {
        it('getSelectedPropertyText should return the correct value', function() {
            ontologyManagerSvc.getEntityName.and.returnValue('name');
            expect(this.controller.getSelectedPropertyText()).toEqual('name');
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'id'});

            this.controller.property = undefined;
            expect(this.controller.getSelectedPropertyText()).toEqual('');
        });
        it('getSelectedRangeText should return the correct value', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(this.controller.getSelectedRangeText()).toEqual('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('range');

            this.controller.range = undefined;
            expect(this.controller.getSelectedRangeText()).toEqual('');
        });
        it('orderRange should call the correct function', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(this.controller.orderRange({'@id': 'id'})).toBe('iri');
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
                expect(this.controller.shouldDisplayOptGroup('type')).toBe(true);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('type');
            });
            it('nothing left after filter', function() {
                this.controller.propertySearch = 'word';
                expect(this.controller.shouldDisplayOptGroup('type')).toBe(false);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('type');
            });
        });
        describe('propertyChanged should set variables correctly when ranges is equal to', function() {
            it('one', function() {
                this.controller.propertyChanged();
                expect(this.controller.ranges).toEqual([{'@id': prefixes.xsd + 'string'}]);
                expect(this.controller.range).toEqual(prefixes.xsd + 'string');
                expect(scope.updateProperty).toHaveBeenCalledWith(this.controller.property);
            });
            it('more than one', function() {
                this.controller.property[prefixes.rdfs + 'range'] = [{'@id': 'range1'}, {'@id': 'range2'}];
                this.controller.range = undefined;
                this.controller.propertyChanged();
                expect(this.controller.ranges).toEqual([{'@id': 'range1'}, {'@id': 'range2'}]);
                expect(this.controller.range).toBeUndefined();
                expect(scope.updateProperty).toHaveBeenCalledWith(this.controller.property);
            });
        });
        describe('showNoDomains should return the proper value for showing no domains group when', function() {
            it('noDomains is empty', function() {
                discoverStateSvc.search.noDomains = [];
                expect(this.controller.showNoDomains()).toBeFalsy();
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            });
            it('nothing left after filter', function() {
                discoverStateSvc.search.noDomains = [{'@id': 'domain'}];
                this.controller.propertySearch = 'word';
                expect(this.controller.showNoDomains()).toBeFalsy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'domain'});
            });
            it('something left after filter', function() {
                discoverStateSvc.search.noDomains = [{'@id': 'domain'}];
                this.controller.propertySearch = 'domain';
                expect(this.controller.showNoDomains()).toBeTruthy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'domain'});
            });
            it('propertySearch is empty', function() {
                discoverStateSvc.search.noDomains = [{'@id': 'domain'}];
                expect(this.controller.showNoDomains()).toBeTruthy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'domain'});
            });
        });
        describe('checkEntityText should', function() {
            beforeEach(function() {
                this.controller.propertySearch = 'te';
            });
            it('true when it includes propertySearch text', function() {
                expect(this.controller.checkEntityText({'@id': 'text'})).toBe(true);
            });
            it('false when it does not include propertySearch text', function() {
                expect(this.controller.checkEntityText({'@id': 'other'})).toBe(false);
            });
        });
        it('rangeChange should call the correct methods', function() {
            this.controller.rangeChange();
            expect(scope.updateRange).toHaveBeenCalledWith(this.controller.range);
            expect(scope.rangeChangeEvent).toHaveBeenCalled();
        })
    });
});
