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
describe('Create Class Overlay directive', function() {
    var $compile,
        scope,
        element,
        ontologyManagerSvc,
        deferred,
        ontologyStateSvc,
        prefixes;


    beforeEach(function() {
        module('templates');
        module('createClassOverlay');
        mockPrefixes();
        injectRegexConstant();
        injectCamelCaseFilter();
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
        element = $compile(angular.element('<create-class-overlay></create-class-overlay>'))(scope);
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
            controller = element.controller('createClassOverlay');
        });
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.clazz = {};
                controller.clazz[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.clazz['@id']).toEqual(controller.prefix + controller.clazz[prefixes.dcterms +
                    'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.clazz['@id'] = 'iri';
                controller.nameChanged();
                expect(controller.clazz['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.clazz['@id']).toBe('begin' + 'then' + 'end');
        });
        it('create calls the correct manager functions', function() {
            ontologyManagerSvc.getListItemById.and.returnValue({subClasses: [], classHierarchy: []});
            controller.clazz = {'@id': 'class-iri'};
            controller.clazz[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
            controller.clazz[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
            controller.create();
            expect(_.get(controller.clazz, 'matonto.originalIRI')).toEqual(controller.clazz['@id']);
            expect(ontologyManagerSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.ontology, controller.clazz);
            expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(ontologyStateSvc.state.ontologyId);
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.clazz['@id']);
            expect(ontologyStateSvc.showCreateClassOverlay).toBe(false);
        });
    });
});
