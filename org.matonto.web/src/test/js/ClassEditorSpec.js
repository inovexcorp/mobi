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

describe('Class Editor directive', function() {
    var $compile,
        scope,
        element,
        stateManagerSvc,
        ontologyManagerSvc,
        controller;

    mockPrefixes();
    injectRemoveIriFromArrayFilter();
    beforeEach(function() {
        module('templates');
        module('classEditor');
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<class-editor></class-editor>'))(scope);
            scope.$digest();
        });
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tab button container', function() {
            var tabContainer = element.querySelectorAll('tab-button-container');
            expect(tabContainer.length).toBe(1);
        });
        describe('based on vm.state.editorTab', function() {
            it('for basic', function() {
                stateManagerSvc.currentState = {editorTab: 'basic'};
                stateManagerSvc.selected = {matonto: {createError: 'error'}};
                scope.$digest();

                var tabs = element.querySelectorAll('.tab');
                expect(tabs.length).toBe(1);

                var errorDisplay = element.querySelectorAll('error-display');
                expect(errorDisplay.length).toBe(1);

                var staticIri = element.querySelectorAll('static-iri');
                expect(staticIri.length).toBe(1);

                var annotationTab = element.querySelectorAll('annotation-tab');
                expect(annotationTab.length).toBe(1);
            });
            it('for axioms', function() {
                stateManagerSvc.currentState = {editorTab: 'axioms'};
                scope.$digest();

                var objectSelects = element.querySelectorAll('object-select');
                expect(objectSelects.length).toBe(2);
            });
        });
        describe('and error-display', function() {
            it('is visible when createError is true', function() {
                stateManagerSvc.currentState = {editorTab: 'basic'};
                stateManagerSvc.selected = {matonto: {createError: true}};
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(1);
            });
            it('is not visible when createError is false', function() {
                stateManagerSvc.currentState = {editorTab: 'basic'};
                stateManagerSvc.selected = {matonto: {createError: false}};
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(0);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<class-editor></class-editor>'))(scope);
            scope.$digest();
            controller = element.controller('classEditor');
        });
        it('onEdit calls the correct manager functions', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(ontologyManagerSvc.editIRI).toHaveBeenCalledWith('begin', 'then', 'end', stateManagerSvc.selected, stateManagerSvc.ontology);
            expect(ontologyManagerSvc.entityChanged).toHaveBeenCalled();
        });
    });
});
