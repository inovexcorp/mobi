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
describe('Ontology Open Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc,
        ontologyManagerSvc,
        deferred;

    beforeEach(function() {
        module('templates');
        module('ontologyCloseOverlay');
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

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-close-overlay></ontology-close-overlay>'))(scope);
            scope.$digest();
        });
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .content', function() {
            var items = element.querySelectorAll('.content');
            expect(items.length).toBe(1);
        });
        it('based on h6', function() {
            var items = element.querySelectorAll('h6');
            expect(items.length).toBe(1);
        });
        it('based on .main', function() {
            var items = element.querySelectorAll('.main');
            expect(items.length).toBe(1);
        });
        it('based on .btn-container', function() {
            var items = element.querySelectorAll('.btn-container');
            expect(items.length).toBe(1);
        });
        describe('and error-display', function() {
            beforeEach(function() {
                controller = element.controller('ontologyCloseOverlay');
            });
            it('is visible when openError is true', function() {
                controller.error = true;
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(1);
            });
            it('is not visible when openError is false', function() {
                controller.error = false;
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(0);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-close-overlay></ontology-close-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('ontologyCloseOverlay');
        });
        describe('saveThenClose', function() {
            beforeEach(function() {
                ontologyManagerSvc.edit.and.returnValue(deferred.promise);
                controller.saveThenClose();
            });
            it('calls the correct manager functions', function() {
                expect(ontologyManagerSvc.edit).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id, stateManagerSvc.state);
            });
            it('when resolved, calls the correct controller function', function() {
                controller.close = jasmine.createSpy('close');
                deferred.resolve({});
                scope.$apply();
                expect(controller.close).toHaveBeenCalled();
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toBe('error');
            });
        });
        it('close calls the correct manager functions and sets the correct manager variable', function() {
            controller.close();
            expect(ontologyManagerSvc.closeOntology).toHaveBeenCalledWith(stateManagerSvc.state.oi, stateManagerSvc.ontology.matonto.id);
            expect(stateManagerSvc.clearState).toHaveBeenCalledWith(stateManagerSvc.state.oi);
            expect(stateManagerSvc.showCloseOverlay).toBe(false);
        });
    });
});