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
        ontologyStateSvc,
        deferred,
        prefixes;

    beforeEach(function() {
        module('templates');
        module('createPropertyOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        injectSplitIRIFilter();
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
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
        it('create calls the correct manager functions', function() {
            ontologyManagerSvc.getListItemById.and.returnValue({
                subObjectProperties: [],
                objectPropertyHierarchy: [],
                subDataProperties: [],
                dataPropertyHierarchy: []
            });
            controller.property = {'@id': 'property-iri'}
            controller.property[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
            controller.property[prefixes.rdfs + 'range'] = [];
            controller.property[prefixes.rdfs + 'domain'] = [];
            controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
            controller.create();
            expect(_.get(controller.property, 'matonto.originalIRI')).toEqual(controller.property['@id']);
            expect(ontologyManagerSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontology,
                controller.property);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(controller.property);
            expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId);
            expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId,
                controller.property);
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.property['@id']);
            expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
        });
    });
});
