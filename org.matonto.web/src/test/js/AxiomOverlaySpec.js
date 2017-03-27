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
describe('Axiom Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontologyManagerSvc, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('axiomOverlay');
        mockResponseObj();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        scope.axiomList = [];
        scope.onSubmit = jasmine.createSpy('onSubmit');
        element = $compile(angular.element('<axiom-overlay axiom-list="axiomList" on-submit="onSubmit()"></axiom-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('axiomOverlay');
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = element.isolateScope();
        });
        it('axiomList is one way bound', function() {
            this.isolatedScope.axiomList = [{}];
            scope.$digest();
            expect(scope.axiomList).toEqual([]);
        });
        it('onSubmit to be called in parent scope', function() {
            this.isolatedScope.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('axiom-overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(2);
        });
        it('with ui-selects', function() {
            expect(element.find('ui-select').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with buttons to add and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the form is invalid', function() {
            controller = element.controller('axiomOverlay');
            controller.axiom = {};
            controller.values = [{}];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.axiomForm.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether an axiom is selected', function() {
            controller = element.controller('axiomOverlay');
            controller.values = [{}];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.axiom = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether values have been selected', function() {
            controller = element.controller('axiomOverlay');
            controller.axiom = {};
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should call add an axiom', function() {
            beforeEach(function() {
                controller.values = [{}];
                controller.axiom = {};
                resObj.getItemIri.and.callFake(function(obj) {
                    return obj === controller.axiom ? 'axiom' : 'value';
                });
                ontologyStateSvc.showAxiomOverlay = true;
            });
            it('if the selected entity already has the axiom', function() {
                var previousValue = {'@id': 'prev'};
                ontologyStateSvc.selected = {axiom: [previousValue]};
                controller.addAxiom();
                expect(ontologyStateSvc.selected.axiom.length).toBe(controller.values.length + 1);
                expect(ontologyStateSvc.selected.axiom).toContain(previousValue);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();

            });
            it('if the selected entity does not have the axiom', function() {
                controller.addAxiom();
                expect(ontologyStateSvc.selected.axiom.length).toBe(controller.values.length);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
    });
    it('should call the correct methods when the Add button is clicked', function() {
        controller = element.controller('axiomOverlay');
        controller.axiom = {};
        controller.values = [{}];
        spyOn(controller, 'addAxiom');
        scope.$digest();

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.addAxiom).toHaveBeenCalled();
        expect(scope.onSubmit).toHaveBeenCalled();
    });
    it('should set the correct state when the Cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
    });
});