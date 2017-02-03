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
describe('Ontology Property Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyPropertyOverlay');
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockOntologyState();
        mockResponseObj();
        mockPropertyManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _responseObj_,
            _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        element = $compile(angular.element('<ontology-property-overlay></ontology-property-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('ontologyPropertyOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .ontology-property-overlay', function() {
            expect(element.hasClass('ontology-property-overlay')).toBe(true);
        });
        it('based on form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('based on h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('has correct heading based on variable', function() {
            var tests = [
                {
                    value: true,
                    result: 'Edit Property'
                },
                {
                    value: false,
                    result: 'Add Property'
                }
            ];
            _.forEach(tests, function(test) {
                ontologyStateSvc.editingOntologyProperty = test.value;
                scope.$digest();

                var header = element.find('h6');
                expect(header.length).toBe(1);
                expect(header[0].innerHTML).toBe(test.result);
            });
        });
        describe('when', function() {
            it('isOntologyProperty is true', function() {
                spyOn(controller, 'isOntologyProperty').and.returnValue(true);
                spyOn(controller, 'isAnnotationProperty').and.returnValue(false);
                scope.$digest();
                expect(element.querySelectorAll('.form-group').length).toBe(2);
                expect(element.find('custom-label').length).toBe(2);
                expect(element.find('input').length).toBe(1);
                expect(element.find('p').length).toBe(1);
                expect(element.find('ng-message').length).toBe(2);
            });
            it('isAnnotationProperty is true', function() {
                spyOn(controller, 'isOntologyProperty').and.returnValue(false);
                spyOn(controller, 'isAnnotationProperty').and.returnValue(true);
                scope.$digest();
                expect(element.querySelectorAll('.form-group').length).toBe(1);
                expect(element.find('text-area').length).toBe(1);
            });
        });
        it('based on .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('has correct button based on variable', function() {
            var tests = [
                {
                    value: true,
                    result: 'Edit'
                },
                {
                    value: false,
                    result: 'Add'
                }
            ];
            _.forEach(tests, function(test) {
                ontologyStateSvc.editingOntologyProperty = test.value;
                scope.$digest();

                var buttons = element.querySelectorAll('button.btn-primary');
                expect(buttons.length).toBe(1);
                expect(buttons[0].innerHTML).toBe(test.result);
            });
        });
    });
    describe('controller methods', function() {
        describe('isOntologyProperty should return the proper value', function() {
            it('when ontologyStateService.ontologyProperty is falsy', function() {
                ontologyStateSvc.ontologyProperty = false;
                expect(controller.isOntologyProperty()).toBe(false);
            });
            describe('when ontologyStateService.ontologyProperty is truthy', function() {
                beforeEach(function() {
                    ontologyStateSvc.ontologyProperty = {'@id': 'id'};
                    resObj.getItemIri.and.callFake(_.identity);
                });
                it('and ontologyManagerService.ontologyProperties is empty', function() {
                    ontologyManagerSvc.ontologyProperties = [];
                    expect(controller.isOntologyProperty()).toBe(false);
                });
                it('and ontologyManagerService.ontologyProperties does not contain ontologyProperty', function() {
                    ontologyManagerSvc.ontologyProperties = [{'@id': 'other'}];
                    expect(controller.isOntologyProperty()).toBe(false);
                });

                it('and ontologyManagerService.ontologyProperties does contain ontologyProperty', function() {
                    ontologyManagerSvc.ontologyProperties = [{'@id': 'id'}];
                    expect(controller.isOntologyProperty()).toBe(true);
                });
            });
        });
        describe('isAnnotationProperty should return the proper value', function() {
            it('when ontologyStateService.ontologyProperty is falsy', function() {
                ontologyStateSvc.ontologyProperty = false;
                expect(controller.isAnnotationProperty()).toBe(false);
            });
            describe('when ontologyStateService.ontologyProperty is truthy', function() {
                beforeEach(function() {
                    ontologyStateSvc.ontologyProperty = {'@id': 'id'};
                    resObj.getItemIri.and.callFake(_.identity);
                });
                it('and ontologyManagerService.ontologyProperties is empty', function() {
                    ontologyStateSvc.listItem.annotations = [];
                    expect(controller.isAnnotationProperty()).toBe(false);
                });
                it('and ontologyManagerService.ontologyProperties does not contain ontologyProperty', function() {
                    ontologyStateSvc.listItem.annotations = [{'@id': 'other'}];
                    expect(controller.isAnnotationProperty()).toBe(false);
                });

                it('and ontologyManagerService.ontologyProperties does contain ontologyProperty', function() {
                    ontologyStateSvc.listItem.annotations = [{'@id': 'id'}];
                    expect(controller.isAnnotationProperty()).toBe(true);
                });
            });
        });
        describe('addProperty calls the correct manager functions', function() {
            it('when isOntologyProperty is true', function() {
                spyOn(controller, 'isOntologyProperty').and.returnValue(true);
                controller.addProperty();
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyIRI);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
            });
            it('when isAnnotationProperty is true', function() {
                spyOn(controller, 'isAnnotationProperty').and.returnValue(true);
                controller.addProperty();
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyValue);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
            });
            it('when neither are true', function() {
                controller.addProperty();
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), '');
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
            });
        });
        describe('editProperty calls the correct manager functions', function() {
            it('when isOntologyProperty is true', function() {
                spyOn(controller, 'isOntologyProperty').and.returnValue(true);
                controller.editProperty();
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyIRI,
                    ontologyStateSvc.ontologyPropertyIndex);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
            });
            it('when isAnnotationProperty is true', function() {
                spyOn(controller, 'isAnnotationProperty').and.returnValue(true);
                controller.editProperty();
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyValue,
                    ontologyStateSvc.ontologyPropertyIndex);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
            });
            it('when neither are true', function() {
                controller.editProperty();
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), '',
                    ontologyStateSvc.ontologyPropertyIndex);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
            });
        });
    });
});