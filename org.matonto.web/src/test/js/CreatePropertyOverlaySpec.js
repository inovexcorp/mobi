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
        deferred,
        prefixes;

    beforeEach(function() {
        module('templates');
        module('createPropertyOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockOntologyManager();
        mockStateManager();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
            deferred = _$q_.defer();
            prefixes = _prefixes_;
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
            var forms = element.find('form');
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
                controller.property = {};
                controller.property[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.property['@id']).toEqual(controller.prefix + controller.property[prefixes.dcterms +
                    'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.property['@id'] = 'iri';
                controller.nameChanged();
                expect(controller.property['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.property['@id']).toBe('begin' + 'then' + 'end');
        });
        describe('create', function() {
            beforeEach(function() {
                ontologyManagerSvc.createObjectProperty.and.returnValue(deferred.promise);
                ontologyManagerSvc.createDataTypeProperty.and.returnValue(deferred.promise);
                controller.property = {
                    '@id': 'property-iri'
                }
                controller.property[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
                controller.property[prefixes.rdfs + 'range'] = [];
                controller.property[prefixes.rdfs + 'domain'] = [];
                controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
            });
            describe('calls the correct manager function', function() {
                it('when isObjectProperty is true', function() {
                    controller.property['@type'] = [prefixes.owl + 'ObjectProperty'];
                    ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                    controller.create();
                    expect(ontologyManagerSvc.createObjectProperty).toHaveBeenCalledWith(
                        stateManagerSvc.state.ontologyId, controller.property);
                });
                it('when isObjectProperty is false', function() {
                    controller.property['@type'] = [prefixes.owl + 'DataTypeProperty'];
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    controller.create();
                    expect(ontologyManagerSvc.createDataTypeProperty).toHaveBeenCalledWith(
                        stateManagerSvc.state.ontologyId, controller.property);
                });
            });
            describe('when', function() {
                beforeEach(function() {
                    controller.create();
                });
                it('resolved, sets the correct variables', function() {
                    deferred.resolve({entityIRI: 'entityIRI', ontologyId: 'ontologyId'});
                    scope.$apply();
                    expect(stateManagerSvc.showCreatePropertyOverlay).toBe(false);
                    expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith('ontologyId');
                    expect(stateManagerSvc.selectItem).toHaveBeenCalledWith('property-editor', 'entityIRI',
                        ontologyManagerSvc.getListItemById('ontologyId'));
                });
                it('rejected, sets the correct variable', function() {
                    deferred.reject('error');
                    scope.$apply();
                    expect(controller.error).toBe('error');
                });
            });
        });
    });
});
