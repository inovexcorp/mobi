/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Annotation Overlay directive', function() {
    var $compile, scope, ontologyStateSvc, propertyManagerSvc, ontoUtils, prefixes, util;

    beforeEach(function() {
        module('templates');
        module('annotationOverlay');
        mockOntologyState();
        mockPropertyManager();
        mockUtil();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _ontologyUtilsManagerService_, _prefixes_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            util = _utilService_;
        });

        scope.dismiss = jasmine.createSpy('dismiss');
        scope.close = jasmine.createSpy('close');
        this.element = $compile(angular.element('<annotation-overlay close="close()" dismiss="dismiss()"></annotation-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('annotationOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        propertyManagerSvc = null;
        ontoUtils = null;
        prefixes = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('ANNOTATION-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toEqual(1);
        });
        it('has correct heading based on variable', function() {
            [
                {
                    value: true,
                    result: 'Edit Annotation'
                },
                {
                    value: false,
                    result: 'Add Annotation'
                }
            ].forEach(function(test) {
                ontologyStateSvc.editingAnnotation = test.value;
                scope.$digest();

                var header = this.element.find('h3');
                expect(header.length).toBe(1);
                expect(header[0].innerHTML).toBe(test.result);
            }, this);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        it('disableProp should test whether an annotation is owl:deprecated and whether it has been set already', function() {
            expect(this.controller.disableProp('test')).toBe(false);
            expect(this.controller.disableProp(prefixes.owl + 'deprecated')).toBe(false);

            ontologyStateSvc.listItem.selected[prefixes.owl + 'deprecated'] = [];
            expect(this.controller.disableProp(prefixes.owl + 'deprecated')).toBe(true);
        });
        describe('selectProp should set the correct state if it is', function() {
            it('owl:deprecated', function() {
                ontologyStateSvc.annotationSelect = prefixes.owl + 'deprecated';
                this.controller.selectProp();
                expect(ontologyStateSvc.annotationType).toEqual(prefixes.xsd + 'boolean');
                expect(ontologyStateSvc.annotationLanguage).toEqual('');
            });
            it('not owl:deprecated', function() {
                this.controller.selectProp();
                expect(ontologyStateSvc.annotationType).toBeUndefined();
                expect(ontologyStateSvc.annotationLanguage).toEqual('en');
            });
        });
        describe('should determine if Submit should be disabled if the annotation is being', function() {
            beforeEach(function() {
                this.controller.annotationForm.$invalid = false;
                ontologyStateSvc.annotationValue = 'test';
                ontologyStateSvc.annotationSelect = {};
            });
            describe('added and', function() {
                it('the form is invalid', function() {
                    this.controller.annotationForm.$invalid = true;
                    expect(this.controller.isDisabled()).toEqual(true);
                });
                it('the value is not set', function() {
                    ontologyStateSvc.annotationValue = '';
                    expect(this.controller.isDisabled()).toEqual(true);
                });
                it('the annotation is not set', function() {
                    ontologyStateSvc.annotationSelect = undefined;
                    expect(this.controller.isDisabled()).toEqual(true);
                });
                it('everything is valid and set', function() {
                    expect(this.controller.isDisabled()).toEqual(false);
                });
            });
            describe('edited and', function() {
                beforeEach(function() {
                    ontologyStateSvc.editingAnnotation = true;
                });
                it('the form is invalid', function() {
                    this.controller.annotationForm.$invalid = true;
                    expect(this.controller.isDisabled()).toEqual(true);
                });
                it('the value is not set', function() {
                    ontologyStateSvc.annotationValue = '';
                    expect(this.controller.isDisabled()).toEqual(true);
                });
                it('everything is valid and set', function() {
                    expect(this.controller.isDisabled()).toEqual(false);
                });
            });
        });
        describe('should submit the modal if the annotation is being', function() {
            beforeEach(function() {
                spyOn(this.controller, 'addAnnotation');
                spyOn(this.controller, 'editAnnotation');
            });
            it('added', function() {
                this.controller.submit();
                expect(this.controller.addAnnotation).toHaveBeenCalled();
                expect(this.controller.editAnnotation).not.toHaveBeenCalled();
            });
            it('edited', function() {
                ontologyStateSvc.editingAnnotation = true;
                this.controller.submit();
                expect(this.controller.addAnnotation).not.toHaveBeenCalled();
                expect(this.controller.editAnnotation).toHaveBeenCalled();
            });
        });
        describe('addAnnotation should call the appropriate manager functions if', function() {
            it('the value was added successfully', function() {
                propertyManagerSvc.addValue.and.returnValue(true);
                this.controller.addAnnotation();
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.annotationSelect, ontologyStateSvc.annotationValue, ontologyStateSvc.annotationType, ontologyStateSvc.annotationLanguage);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            it('the value was not added successfully', function() {
                this.controller.addAnnotation();
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.annotationSelect, ontologyStateSvc.annotationValue, ontologyStateSvc.annotationType, ontologyStateSvc.annotationLanguage);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(util.createWarningToast).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
        });
        describe('editAnnotation should call the appropriate manager functions', function() {
            it('if the value was edited successfully', function() {
                propertyManagerSvc.editValue.and.returnValue(true);
                this.controller.editAnnotation();
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.annotationSelect, ontologyStateSvc.annotationIndex, ontologyStateSvc.annotationValue, ontologyStateSvc.annotationType, ontologyStateSvc.annotationLanguage);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            it('if the value was not edited successfully', function() {
                this.controller.editAnnotation();
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.annotationSelect, ontologyStateSvc.annotationIndex, ontologyStateSvc.annotationValue, ontologyStateSvc.annotationType, ontologyStateSvc.annotationLanguage);
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(util.createWarningToast).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('cancel calls dismiss', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(this.controller, 'submit');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.submit).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
