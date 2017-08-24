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
describe('Remove Property Overlay directive', function() {
    var $compile, scope, $q, element, controller, ontologyStateSvc, propertyManagerSvc, ontoUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('removePropertyOverlay');
        mockOntologyState();
        mockPropertyManager();
        mockOntologyUtilsManager();
        mockPrefixes();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _propertyManagerService_, _ontologyUtilsManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
        });

        scope.index = 0;
        scope.key = 'key';
        scope.onSubmit = jasmine.createSpy('onSubmit');
        scope.overlayFlag = true;
        _.set(ontologyStateSvc.listItem.selected, scope.key + '[' + scope.index + ']', 'value');
        element = $compile(angular.element('<remove-property-overlay index="index" key="key" on-submit="onSubmit()" overlay-flag="overlayFlag"></remove-property-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('removePropertyOverlay');
    });

    describe('controller bound variable', function() {
        it('index should be one way bound', function() {
            controller.index = 1;
            scope.$digest();
            expect(scope.index).toEqual(0);
        });
        it('key should be one way bound', function() {
            controller.key = 'newKey';
            scope.$digest();
            expect(scope.key).toEqual('key');
        });
        it('overlayFlag should be two way bound', function() {
            controller.overlayFlag = false;
            scope.$digest();
            expect(scope.overlayFlag).toEqual(false);
        });
        it('onSubmit should be triggered on the scope', function() {
            controller.onSubmit();
            scope.$digest();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('remove-property-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
            expect(element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        _.forEach(['main', 'btn-container', 'btn-primary', 'btn-default'], function(item) {
            it('with a .' + item, function() {
                expect(element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        describe('removeProperty calls the correct methods', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.flatEverythingTree = [];
            });
            it('if the selected key is rdfs:range', function() {
                controller.key = prefixes.rdfs + 'range';
                _.set(ontologyStateSvc.listItem.selected, controller.key + '[0]', 'value');
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                controller.removeProperty();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, controller.key, controller.index);
                expect(controller.overlayFlag).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
                expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([]);
            });
            it('if the selected key is rdfs:domain', function() {
                controller.key = prefixes.rdfs + 'domain';
                _.set(ontologyStateSvc.listItem.selected, controller.key + '[0]', 'value');
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                controller.removeProperty();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, controller.key, controller.index);
                expect(controller.overlayFlag).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
                expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
            });
            it('if the selected key is neither rdfs:domain or rdfs:range', function() {
                _.set(ontologyStateSvc.listItem.selected, 'key[0]', 'value');
                controller.removeProperty();
                expect(scope.onSubmit).toHaveBeenCalled();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, controller.key, controller.index);
                expect(controller.overlayFlag).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
                expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([]);
            });
        });
    });
    it('calls removeProperty when the button is clicked', function() {
        spyOn(controller, 'removeProperty');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.removeProperty).toHaveBeenCalled();
    });
    it('sets the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(controller.overlayFlag).toBe(false);
    });
});