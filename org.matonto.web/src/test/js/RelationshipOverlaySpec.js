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
describe('Relationship Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, ontologyManagerSvc, resObj, splitIRIFilter, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('relationshipOverlay');
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();
        mockResponseObj();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRIFilter = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        scope.relationshipList = [];
        element = $compile(angular.element('<relationship-overlay relationship-list="relationshipList"></relationship-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('relationshipOverlay');
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = element.isolateScope();
        });
        it('relationshipList should be one way bound', function() {
            this.isolatedScope.relationshipList = [{}];
            scope.$digest();
            expect(scope.relationshipList).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('relationship-overlay')).toBe(true);
            expect(element.find('form').length).toBe(1);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with custom-labels', function() {
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
        it('depending on whether a relationship is selected', function() {
            controller.values = [{}];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.relationship = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether values are selected', function() {
            controller.relationship = {};
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('relationshipOverlay');
        });
        it('should add a relationship', function() {
            controller.relationship = {};
            controller.values = [{}];
            resObj.getItemIri.and.returnValue('axiom');
            controller.addRelationship();
            expect(resObj.getItemIri).toHaveBeenCalledWith(controller.relationship);
            expect(ontologyStateSvc.listItem.selected.axiom).toEqual(controller.values);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
    });
    it('should call addRelationship when the button is clicked', function() {
        controller = element.controller('relationshipOverlay');
        spyOn(controller, 'addRelationship');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.addRelationship).toHaveBeenCalled();
    });
    it('should set the correct state when the Cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
    });
});