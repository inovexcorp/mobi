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
describe('Property Value Overlay component', function() {
    var $compile, scope, discoverStateSvc, prefixes, exploreUtilsSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('propertyValueOverlay');
        mockDiscoverState();
        mockPrefixes();
        mockUtil();
        mockExploreUtils();
        mockModal();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _prefixes_, _exploreUtilsService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            prefixes = _prefixes_;
            exploreUtilsSvc = _exploreUtilsService_;
            modalSvc = _modalService_;
        });

        /*scope.text = 'text';
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
        }];*/
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        scope.resolve = {
            text: 'text',
            index: 0,
            iri: 'prop1',
            properties: [{
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
            }]
        };
        this.value = {
            '@id': 'http://mobi.com/id'
        };
        this.instance = {
            '@id': 'id',
            '@type': ['type'],
            [scope.resolve.iri]: [this.value],
            prop2: [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        };
        discoverStateSvc.getInstance.and.returnValue(this.instance);
        this.reificationProp = 'property1';
        this.reification = {
            '@id': '_:b0',
            '@type': [prefixes.rdf + 'Statement'],
            [this.reificationProp]: [{'@value': 'value'}]
        };
        this.element = $compile(angular.element('<property-value-overlay close="close($value)" dismiss="dismiss()" resolve="resolve"></property-value-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertyValueOverlay');
        this.controller.reification = this.reification;
        this.controller.changed = [this.reificationProp];
        scope.$apply();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        prefixes = null;
        exploreUtilsSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    it('should initialize with the correct values', function() {
        expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, this.instance['@id'], scope.resolve.iri, this.value);
    });
    describe('controller bound variables', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        it('resolve is one way bound', function() {
            this.controller.resolve = {};
            scope.$digest();
            expect(scope.resolve).toEqual({text: 'text', index: 0, iri: 'prop1', properties: jasmine.any(Object)});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PROPERTY-VALUE-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['h3', 'p'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('if property is ommitted', function() {
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);

            spyOn(this.controller, 'notOmmitted').and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.form-group').length).toEqual(0);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toEqual(1);
        });
        it('if the reification property has been changed', function() {
            var label = this.element.find('custom-label');
            expect(label.hasClass('changed')).toEqual(true);

            spyOn(this.controller, 'isChanged').and.returnValue(false);
            scope.$digest();
            expect(label.hasClass('changed')).toEqual(false);
        });
        it('if the reification property has a boolean range', function() {
            expect(this.element.querySelectorAll('.boolean-property').length).toEqual(1);

            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.boolean-property').length).toEqual(0);
        });
        it('if the reification property is a data property', function() {
            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.data-property').length).toEqual(1);

            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.data-property').length).toEqual(0);
        });
        it('if the reification property is an object property', function() {
            expect(this.element.querySelectorAll('.object-property').length).toEqual(1);

            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.object-property').length).toEqual(0);
        });
        it('with a .btn-container.clearfix', function() {
            expect(this.element.querySelectorAll('.btn-container.clearfix').length).toEqual(1);
        });
        it('with a .btn.btn-link', function() {
            expect(this.element.querySelectorAll('.btn.btn-link').length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        it('showReifiedPropertyOverlay should open the newInstancePropertyOverlay', function() {
            this.controller.showReifiedPropertyOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('newInstancePropertyOverlay', {properties: scope.resolve.properties, instance: this.controller.reification}, this.controller.addToChanged);
        });
        it('notOmmitted should return the proper value depending on what is provided', function() {
            ['@id', '@type', prefixes.rdf + 'subject', prefixes.rdf + 'predicate', prefixes.rdf + 'object'].forEach(iri => {
                expect(this.controller.notOmmitted(iri)).toEqual(false);
            });
            expect(this.controller.notOmmitted('other')).toEqual(true);
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
                expect(scope.close).toHaveBeenCalledWith(scope.resolve.iri);
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
                expect(scope.close).toHaveBeenCalledWith(scope.resolve.iri);
            });
        });
        describe('addToChanged adds the provided iri to the changed array', function() {
            it('when it is new', function() {
                this.controller.addToChanged('new');
                expect(this.controller.changed).toEqual([this.reificationProp, 'new']);
            });
            it('when it is not new', function() {
                this.controller.addToChanged(this.reificationProp);
                expect(this.controller.changed).toEqual([this.reificationProp]);
            });
        });
        it('isChanged should return the proper value', function() {
            expect(this.controller.isChanged(this.reificationProp)).toEqual(true);
            expect(this.controller.isChanged('new')).toEqual(false);
        });
        it('cancel dismisses the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});