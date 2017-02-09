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
describe('Create Annotation Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        propertyManagerSvc,
        deferred,
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('createAnnotationOverlay');
        injectRegexConstant();
        mockPropertyManager();
        mockOntologyState();
        mockOntologyManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _propertyManagerService_, _ontologyStateService_,
            _ontologyManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            propertyManagerSvc = _propertyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            deferred = _$q_.defer();
            ontologyManagerSvc = _ontologyManagerService_;
        });

        element = $compile(angular.element('<create-annotation-overlay></create-annotation-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-annotation-overlay')).toBe(true);
        });
        it('with a .content', function() {
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .error-msg', function() {
            expect(element.querySelectorAll('.error-msg').length).toBe(1);
        });
        it('with buttons to create and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the iri pattern is incorrect', function() {
            var formGroup = angular.element(element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);

            controller = element.controller('createAnnotationOverlay');
            controller.form = {
                iri: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);

            controller = element.controller('createAnnotationOverlay');
            controller.error = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('createAnnotationOverlay');
        });
        describe('create', function() {
            beforeEach(function() {
                propertyManagerSvc.create.and.returnValue(deferred.promise);
                controller.iri = 'iri';
                controller.create();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.getAnnotationIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontology);
                expect(propertyManagerSvc.create).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId,
                    ontologyManagerSvc.getAnnotationIRIs(ontologyStateSvc.listItem.ontology), controller.iri);
            });
            it('when resolved, sets the correct variables', function() {
                deferred.resolve({'@id': 'id'});
                scope.$apply();
                expect(ontologyManagerSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontology,
                    {'@id': 'id', matonto: {originalIRI: 'id'}});
                expect(ontologyStateSvc.showCreateAnnotationOverlay).toBe(false);
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toBe('error');
            });
        });
    });
    it('should call create when the button is clicked', function() {
        controller = element.controller('createAnnotationOverlay');
        spyOn(controller, 'create');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateAnnotationOverlay).toBe(false);
    });
});