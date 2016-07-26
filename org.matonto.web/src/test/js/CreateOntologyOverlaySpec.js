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
describe('Create Ontology Overlay directive', function() {
    var $compile,
        scope,
        element,
        ontologyManagerSvc,
        deferred,
        stateManagerSvc;

    beforeEach(function() {
        module('templates');
        module('createOntologyOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        mockOntologyManager();
        mockStateManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
            deferred = _$q_.defer();
        });
    });

    beforeEach(function() {
        element = $compile(angular.element('<create-ontology-overlay></create-ontology-overlay>'))(scope);
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
            controller = element.controller('createOntologyOverlay');
        });
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.name = 'Name';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                var date = new Date();
                var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/';
                controller.nameChanged();
                expect(controller.iri).toEqual(prefix + controller.name);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.iri = 'iri';
                controller.nameChanged();
                expect(controller.iri).toEqual('iri');
            });
        });
        describe('create', function() {
            beforeEach(function() {
                ontologyManagerSvc.createOntology.and.returnValue(deferred.promise);
                controller.iri = 'ontology-iri';
                controller.name = 'label';
                controller.description = 'description';
                controller.create();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.createOntology).toHaveBeenCalledWith('ontology-iri', 'label', 'description');
            });
            it('when resolved, sets the correct variables', function() {
                deferred.resolve({});
                scope.$apply();
                expect(controller.error).toBe('');
                expect(stateManagerSvc.showCreateOntologyOverlay).toBe(false);
                expect(stateManagerSvc.setStateToNew).toHaveBeenCalledWith(stateManagerSvc.state, ontologyManagerSvc.getList(), 'ontology');
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toBe('error');
            });
        });
    });
});
