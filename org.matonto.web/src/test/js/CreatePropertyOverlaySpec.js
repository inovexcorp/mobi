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
describe('Create Property Overlay directive', function() {
    var $compile,
        scope,
        element,
        ontologyManagerSvc,
        stateManagerSvc,
        deferred;

    injectRegexConstant();
    injectCamelCaseFilter();
    beforeEach(function() {
        module('templates');
        module('createPropertyOverlay');
        mockOntologyManager();
        mockStateManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
            deferred = _$q_.defer();
        });
    });

    beforeEach(function() {
        element = $compile(angular.element('<create-property-overlay></create-property-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on overlay class', function() {
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('based on content class', function() {
            var contents = element.querySelectorAll('.content');
            expect(contents.length).toBe(1);
        });
        it('based on form', function() {
            var forms = element.querySelectorAll('form');
            expect(forms.length).toBe(1);
        });
        it('based on btn-container class', function() {
            var containers = element.querySelectorAll('.btn-container');
            expect(containers.length).toBe(1);
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('createPropertyOverlay');
        });
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.name = 'name';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.iri).toEqual(controller.iriBegin + controller.iriThen + controller.name);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.iri = 'iri';
                controller.nameChanged();
                expect(controller.iri).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.iri).toBe('begin' + 'then' + 'end');
        });
        describe('setRange', function() {
            it('changes rangeList to subClasses when type is ObjectProperty', function() {
                controller.type = ['ObjectProperty'];
                stateManagerSvc.ontology = {
                    matonto: {
                        subClasses: ['subClass1']
                    }
                }
                controller.setRange();
                expect(controller.rangeList.indexOf('subClass1') !== -1).toBe(true);
            });
            it('changes rangeList to propertyRange when type is not ObjectProperty', function() {
                controller.type = ['DatatypeProperty'];
                stateManagerSvc.ontology = {
                    matonto: {
                        dataPropertyRange: ['range1']
                    }
                }
                controller.setRange();
                expect(controller.rangeList.indexOf('range1') !== -1).toBe(true);
            });
        });
        describe('create', function() {
            beforeEach(function() {
                ontologyManagerSvc.createProperty.and.returnValue(deferred.promise);
                controller.iri = 'property-iri';
                controller.name = 'label';
                controller.type = 'type';
                controller.range = [];
                controller.domain = [];
                controller.description = 'description';
                controller.create();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.createProperty).toHaveBeenCalledWith(stateManagerSvc.ontology, 'property-iri', 'label', 'type', [], [], 'description')
            });
            it('when resolved, sets the correct variables', function() {
                deferred.resolve(1);
                scope.$apply();
                expect(stateManagerSvc.state.ci).toBe(1);
                expect(controller.error).toBe('');
                expect(stateManagerSvc.showCreatePropertyOverlay).toBe(false);
                expect(stateManagerSvc.setStateToNew).toHaveBeenCalledWith(stateManagerSvc.state, ontologyManagerSvc.getList(), 'property');
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toBe('error');
            });
        });
    });
});
