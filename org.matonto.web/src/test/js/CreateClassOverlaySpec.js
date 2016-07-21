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
        ontologyManagerSvc;

    mockPrefixes();
    injectRegexConstant();
    injectCamelCaseFilter();

    beforeEach(function() {
        module('templates');
        module('createClassOverlay');
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
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
            controller = element.controller('createClassOverlay');
        });
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.name = 'Name';
                controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.iri).toEqual(controller.prefix + controller.name);
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
        it('create calls the correct manager function', function() {
            controller.create('class-iri', 'label', 'description');
            expect(ontologyManagerSvc.createClass).toHaveBeenCalledWith(stateManagerSvc.ontology, 'class-iri', 'label', 'description');
        });
    });
});
