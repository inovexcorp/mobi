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
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontologyManagerSvc, ontoUtils;

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
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _responseObj_, _ontologyManagerService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        element = $compile(angular.element('<ontology-property-overlay></ontology-property-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('ontologyPropertyOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-property-overlay')).toBe(true);
            expect(element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('depending on whether a property is being edited', function() {
            var tests = [
                {
                    value: true,
                    heading: 'Edit Property',
                    button: 'Edit'
                },
                {
                    value: false,
                    heading: 'Add Property',
                    button: 'Add'
                }
            ];
            _.forEach(tests, function(test) {
                ontologyStateSvc.editingOntologyProperty = test.value;
                scope.$digest();

                var header = element.find('h6');
                expect(header.length).toBe(1);
                expect(header[0].innerHTML).toBe(test.heading);
                var buttons = element.querySelectorAll('button.btn-primary');
                expect(buttons.length).toBe(1);
                expect(buttons[0].innerHTML).toBe(test.button);
            });
        });
        it('depending on whether it is an annotation', function() {
            spyOn(controller, 'isAnnotationProperty').and.returnValue(true);
            scope.$digest();
            expect(element.querySelectorAll('.form-group').length).toBe(1);
            expect(element.find('text-area').length).toBe(1);
        });
        it('depending on whether it is an ontology property', function() {
            spyOn(controller, 'isOntologyProperty').and.returnValue(true);
            scope.$digest();
            expect(element.querySelectorAll('.form-group').length).toBe(2);
            expect(element.find('custom-label').length).toBe(2);
            expect(element.find('input').length).toBe(1);
            expect(element.find('p').length).toBe(1);
            expect(element.find('ng-message').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
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
                    resObj.getItemIri.and.callFake(function(obj) {
                        return obj['@id'];
                    });
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
                    resObj.getItemIri.and.callFake(function(obj) {
                        return obj['@id'];
                    });
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
                expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyIRI,
                    null, ontologyStateSvc.ontologyPropertyLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('when isAnnotationProperty is true', function() {
                spyOn(controller, 'isAnnotationProperty').and.returnValue(true);
                controller.addProperty();
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyValue,
                    null, ontologyStateSvc.ontologyPropertyLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('when neither are true', function() {
                controller.addProperty();
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), '',
                    null, ontologyStateSvc.ontologyPropertyLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
        describe('editProperty calls the correct manager functions', function() {
            it('when isOntologyProperty is true', function() {
                spyOn(controller, 'isOntologyProperty').and.returnValue(true);
                controller.editProperty();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyIRI,
                    ontologyStateSvc.ontologyPropertyIndex, null, ontologyStateSvc.ontologyPropertyLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('when isAnnotationProperty is true', function() {
                spyOn(controller, 'isAnnotationProperty').and.returnValue(true);
                controller.editProperty();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), ontologyStateSvc.ontologyPropertyValue,
                    ontologyStateSvc.ontologyPropertyIndex, null, ontologyStateSvc.ontologyPropertyLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('when neither are true', function() {
                controller.editProperty();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.ontologyProperty);
                expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected,
                    resObj.getItemIri(ontologyStateSvc.ontologyProperty), '',
                    ontologyStateSvc.ontologyPropertyIndex, null, ontologyStateSvc.ontologyPropertyLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
    });
    it('should call addProperty with the button is clicked', function() {
        spyOn(controller, 'addProperty');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.addProperty).toHaveBeenCalled();
    });
    it('should call editProperty with the button is clicked', function() {
        ontologyStateSvc.editingOntologyProperty = true;
        scope.$digest();
        spyOn(controller, 'editProperty');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.editProperty).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(false);
    });
});