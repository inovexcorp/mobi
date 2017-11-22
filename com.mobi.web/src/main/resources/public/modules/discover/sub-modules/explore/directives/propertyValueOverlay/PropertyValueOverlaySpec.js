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
describe('Property Value Overlay directive', function() {
    var $compile, scope, discoverStateSvc, prefixes, exploreUtilsSvc;

    beforeEach(function() {
        module('templates');
        module('propertyValueOverlay');
        mockDiscoverState();
        mockPrefixes();
        mockUtil();
        mockExploreUtils();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _prefixes_, _exploreUtilsService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            prefixes = _prefixes_;
            exploreUtilsSvc = _exploreUtilsService_;
        });

        scope.text = 'text';
        scope.closeOverlay = jasmine.createSpy('closeOverlay');
        scope.index = 0;
        scope.iri = 'prop1';
        scope.onSubmit = jasmine.createSpy('onSubmit');
        scope.properties = [{
            propertyIRI: 'propertyId',
            type: 'Data',
            range: ['string']
        }, {
            propertyIRI: 'propertyId2',
            type: 'Object'
        }, {
            propertyIRI: 'propertyId3',
            type: 'Data',
            range: [prefixes.xsd + 'boolean']
        }];
        discoverStateSvc.getInstance.and.returnValue({
            '@id': 'id',
            '@type': ['type'],
            prop1: [{
                '@id': 'http://mobi.com/id'
            }],
            prop2: [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        });
        this.element = $compile(angular.element('<property-value-overlay text="text" close-overlay="closeOverlay()" index="index" iri="iri" on-submit="onSubmit()" properties="properties"></property-value-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertyValueOverlay');
        this.controller.reification = {
            '@id': '_:b0',
            '@type': [prefixes.rdf + 'Statement'],
            property1: [{'@value': 'value'}]
        };
        this.controller.changed = ['iri'];
        scope.$apply();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        prefixes = null;
        exploreUtilsSvc = null;
        this.element.remove();
    });

    it('should initialize with the correct values', function() {
        expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, 'id', scope.iri, jasmine.any(Object));
    });
    describe('in isolated scope', function() {
        it('text should be one way bound', function() {
            this.element.isolateScope().text = 'new';
            scope.$digest();
            expect(scope.text).toBe('text');
        });
    });
    describe('controller bound variables', function() {
        it('closeOverlay should be called in the parent scope', function() {
            this.controller.closeOverlay();
            expect(scope.closeOverlay).toHaveBeenCalled();
        });
        it('index should be one way bound', function() {
            this.controller.index = 1;
            scope.$digest();
            expect(scope.index).toEqual(0);
        });
        it('iri should be one way bound', function() {
            this.controller.iri = 'other';
            scope.$digest();
            expect(scope.iri).toEqual('prop1');
        });
        it('onSubmit should be called in the parent scope', function() {
            this.controller.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
        it('properties should be one way bound', function() {
            this.controller.iri = [];
            scope.$digest();
            expect(scope.properties).toEqual([{
                propertyIRI: 'propertyId',
                type: 'Data',
                range: ['string']
            }, {
                propertyIRI: 'propertyId2',
                type: 'Object'
            }, {
                propertyIRI: 'propertyId3',
                type: 'Data',
                range: [prefixes.xsd + 'boolean']
            }]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('property-value-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.hasClass('lg')).toBe(true);
        });
        it('with a .content.clearfix', function() {
            expect(this.element.querySelectorAll('.content.clearfix').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with a .main', function() {
            expect(this.element.querySelectorAll('.main').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a .boolean-property', function() {
            expect(this.element.querySelectorAll('.boolean-property').length).toBe(1);

            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.boolean-property').length).toBe(0);
        });
        it('with a .data-property', function() {
            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.data-property').length).toBe(1);

            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.data-property').length).toBe(0);
        });
        it('with a .object-property', function() {
            expect(this.element.querySelectorAll('.object-property').length).toBe(1);

            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.object-property').length).toBe(0);
        });
        it('with a .btn-container.clearfix', function() {
            expect(this.element.querySelectorAll('.btn-container.clearfix').length).toBe(2);
        });
        it('with a .btn.btn-link', function() {
            expect(this.element.querySelectorAll('.btn.btn-link').length).toBe(1);
        });
        it('with a new-instance-property-overlay', function() {
            expect(this.element.find('new-instance-property-overlay').length).toBe(0);

            this.controller.showOverlay = true;
            scope.$digest();

            expect(this.element.find('new-instance-property-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('addNewProperty should set variables correctly', function() {
            spyOn(this.controller, 'addToChanged');
            this.controller.showOverlay = true;
            this.controller.addNewProperty('newProperty');
            expect(_.has(this.controller.reification, 'newProperty')).toBe(true);
            expect(this.controller.addToChanged).toHaveBeenCalledWith('newProperty');
            expect(this.controller.showOverlay).toBe(false);
        });
        it('notOmmitted should return the proper value depending on what is provided', function() {
            ['@id', '@type', prefixes.rdf + 'subject', prefixes.rdf + 'predicate', prefixes.rdf + 'object'].forEach(function(iri) {
                expect(this.controller.notOmmitted(iri)).toBe(false);
            }, this);
            expect(this.controller.notOmmitted('other')).toBe(true);
        });
        describe('submit should call the correct methods when the entity', function() {
            it('contains reification property', function() {
                this.controller.reification = {
                    '@id': '_:b0',
                    key: 'value'
                };
                discoverStateSvc.explore.instance.entity = [{
                    '@id': '_:b0',
                    key: 'value'
                }];
                this.controller.submit();
                expect(discoverStateSvc.explore.instance.entity).toEqual([{
                    '@id': '_:b0',
                    key: 'value'
                }]);
                expect(scope.onSubmit).toHaveBeenCalled();
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
            it('does not contain the reification property', function() {
                this.controller.reification = {
                    '@id': '_:b0',
                    key: 'value'
                };
                discoverStateSvc.explore.instance.entity = [];
                this.controller.submit();
                expect(discoverStateSvc.explore.instance.entity).toEqual([{
                    '@id': '_:b0',
                    key: 'value'
                }]);
                expect(scope.onSubmit).toHaveBeenCalled();
                expect(scope.closeOverlay).toHaveBeenCalled();
            });
        });
        describe('addToChanged adds the provided iri to the changed array', function() {
            it('when it is new', function() {
                this.controller.addToChanged('new');
                expect(this.controller.changed).toEqual(['iri', 'new']);
            });
            it('when it is not new', function() {
                this.controller.addToChanged('iri');
                expect(this.controller.changed).toEqual(['iri']);
            });
        });
        it('isChanged should return the proper value', function() {
            expect(this.controller.isChanged('iri')).toBe(true);
            expect(this.controller.isChanged('new')).toBe(false);
        });
    });
});