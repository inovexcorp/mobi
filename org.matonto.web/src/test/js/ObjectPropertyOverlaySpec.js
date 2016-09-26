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
describe('Object Property Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc,
        ontologyManagerSvc,
        responseObj;

    beforeEach(function() {
        module('templates');
        module('objectPropertyOverlay');
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();
        injectRemoveIriFromArrayFilter();
        mockOntologyManager();
        mockStateManager();
        mockResponseObj();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_, _responseObj_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            responseObj = _responseObj_;
        });
    });

    it('initializes with the correct selected value object', function() {
        stateManagerSvc.listItem = {individuals: [{}]};
        stateManagerSvc.propertyValue = 'indiv';
        responseObj.getItemIri.and.returnValue('indiv');
        element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('objectPropertyOverlay');
        expect(controller.valueSelect).toEqual({});
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('object-property-overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('depending on whether the property is being edited', function() {
            var tests = [
                {
                    value: true,
                    header: 'Edit Individual Object Property',
                    button: 'Edit'
                },
                {
                    value: false,
                    header: 'Add Individual Object Property',
                    button: 'Add'
                }
            ];
            _.forEach(tests, function(test) {
                stateManagerSvc.editingProperty = test.value;
                scope.$digest();

                var header = angular.element(element.find('h6')[0]);
                var buttons = element.querySelectorAll('button.btn-primary');
                expect(header.text().trim()).toBe(test.header);
                expect(buttons.length).toBe(1);
                expect(angular.element(buttons[0]).text().trim()).toBe(test.button);
            });
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
        it('with an object select', function() {
            expect(element.find('object-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('objectPropertyOverlay');
        });
        it('should add an object property', function() {
            var value = {'@id': 'value'};
            stateManagerSvc.selected = {};
            responseObj.getItemIri.and.returnValue('prop');
            controller.addProperty({}, value);
            expect(stateManagerSvc.selected.prop).toBeDefined();
            expect(stateManagerSvc.selected.prop).toContain(value);
            expect(stateManagerSvc.showObjectPropertyOverlay).toBe(false);
            expect(stateManagerSvc.getActiveEntityIRI).toHaveBeenCalled();
            expect(stateManagerSvc.setUnsaved).toHaveBeenCalledWith(stateManagerSvc.listItem.ontologyId,
                stateManagerSvc.getActiveEntityIRI(), true);
        });
        it('should edit an object property', function() {
            var value = {'@id': 'value'};
            stateManagerSvc.selected = {prop: [{}]};
            stateManagerSvc.propertyIndex = 0;
            responseObj.getItemIri.and.returnValue('prop');
            controller.editProperty({}, value);
            expect(stateManagerSvc.selected.prop[stateManagerSvc.propertyIndex]).toEqual(value);
            expect(stateManagerSvc.showObjectPropertyOverlay).toBe(false);
            expect(stateManagerSvc.getActiveEntityIRI).toHaveBeenCalled();
            expect(stateManagerSvc.setUnsaved).toHaveBeenCalledWith(stateManagerSvc.listItem.ontologyId,
                stateManagerSvc.getActiveEntityIRI(), true);
        });
        it('should return the namespace is present', function() {
            var result = controller.getItemNamespace({namespace: 'namespace'});
            expect(result).toEqual('namespace');
            result = controller.getItemNamespace({});
            expect(result).toEqual('No namespace');
        });
    });
});