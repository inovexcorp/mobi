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
        ontologyStateSvc,
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
        mockOntologyState();
        mockResponseObj();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _responseObj_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            responseObj = _responseObj_;
        });
    });

    it('initializes with the correct selected value object', function() {
        ontologyStateSvc.listItem = {individuals: [{}]};
        ontologyStateSvc.propertyValue = 'indiv';
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
                ontologyStateSvc.editingProperty = test.value;
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
        describe('should add an object property', function() {
            beforeEach(function() {
                ontologyStateSvc.selected = {};
                this.value = {'@id': 'value'};
            });
            describe('if the property is valid', function() {
                beforeEach(function() {
                    responseObj.getItemIri.and.returnValue('prop');
                });
                it('and the entity has the property', function() {
                    ontologyStateSvc.selected.prop = [{'@id': 'original'}];
                    controller.addProperty({}, this.value);
                    expect(ontologyStateSvc.selected.prop.length).toBe(2);
                    expect(ontologyStateSvc.selected.prop).toContain(this.value);
                    expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                    expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                        jasmine.any(Object));
                });
                it('and the entity does not have the property', function() {
                    controller.addProperty({}, this.value);
                    expect(ontologyStateSvc.selected.prop).toEqual([this.value]);
                    expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                    expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                        jasmine.any(Object));
                });
            });
            it('unless the property is not valid', function() {
                responseObj.getItemIri.and.returnValue('');
                controller.addProperty({}, this.value);
                expect(ontologyStateSvc.selected).toEqual({});
                expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
            });
        });
        describe('should edit an object property', function() {
            beforeEach(function() {
                this.value = {'@id': 'value'};
                this.original = {prop: [{}]};
                ontologyStateSvc.selected = angular.copy(this.original);
                ontologyStateSvc.propertyIndex = 0;
            });
            it('if the property is valid', function() {
                responseObj.getItemIri.and.returnValue('prop');
                controller.editProperty({}, this.value);
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.selected.prop[ontologyStateSvc.propertyIndex]).toEqual(this.value);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
            });
            it('unless the property is not valid', function() {
                responseObj.getItemIri.and.returnValue('');
                controller.editProperty({}, this.value);
                expect(ontologyManagerSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.selected).toEqual(this.original);
                expect(ontologyManagerSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
            });
        });
    });
    it('should call editProperty when the button is clicked', function() {
        element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('objectPropertyOverlay');
        spyOn(controller, 'editProperty');
        ontologyStateSvc.editingProperty = true;
        scope.$digest();

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.editProperty).toHaveBeenCalled();
    });
    it('should call addProperty when the button is clicked', function() {
        element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('objectPropertyOverlay');
        spyOn(controller, 'addProperty');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.addProperty).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
        scope.$digest();
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
    });
});