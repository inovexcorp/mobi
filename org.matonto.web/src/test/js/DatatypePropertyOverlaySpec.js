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
describe('Datatype Property Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        responseObj;

    beforeEach(function() {
        module('templates');
        module('datatypePropertyOverlay');
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();
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

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<datatype-property-overlay></datatype-property-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('datatype-property-overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('depending on whether the property is being edited', function() {
            var tests = [
                {
                    value: true,
                    header: 'Edit Individual Data Property',
                    button: 'Edit'
                },
                {
                    value: false,
                    header: 'Add Individual Data Property',
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
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        })
        it('with an object select', function() {
            expect(element.find('object-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<datatype-property-overlay></datatype-property-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('datatypePropertyOverlay');
        });
        describe('should add a data property', function() {
            beforeEach(function() {
                this.value = 'value';
                ontologyStateSvc.selected = {};
                responseObj.getItemIri.and.returnValue('prop');
            });
            it('with a type', function() {
                var type = {'@id': 'type'};
                controller.addProperty({}, this.value, type);
                expect(ontologyStateSvc.selected.prop).toBeDefined();
                expect(ontologyStateSvc.selected.prop).toContain({'@value': this.value, '@type': type['@id']});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
            });
            it('without a type', function() {
                controller.addProperty({}, this.value);
                expect(ontologyStateSvc.selected.prop).toBeDefined();
                expect(ontologyStateSvc.selected.prop).toContain({'@value': this.value});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
            });
        });
        describe('should edit a data property', function() {
            beforeEach(function() {
                this.value = 'value';
                ontologyStateSvc.selected = {prop: [{}]};
                responseObj.getItemIri.and.returnValue('prop');
                ontologyStateSvc.propertyIndex = 0;
            });
            it('if the type has changed', function() {
                var type = {'@id': 'type'};
                controller.editProperty({}, this.value, type);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value, '@type': type['@id']});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));

                controller.editProperty({}, this.value);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
            });
            it('if the type has not changed', function() {
                controller.editProperty({}, this.value);
                expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    jasmine.any(Object));
            });
        });
    });
});