/*-
 * #%L
 * com.mobi.web
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
    var $compile, scope, ontologyStateSvc, responseObj, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('objectPropertyOverlay');
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();
        injectRemoveIriFromArrayFilter();
        mockOntologyState();
        mockResponseObj();
        mockUtil();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            responseObj = _responseObj_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontologyStateSvc.listItem = {ontologyRecord: {recordId: 'recordId'}, individuals: {iris: [{}]}};
        ontologyStateSvc.propertyValue = 'indiv';
        responseObj.getItemIri.and.returnValue('indiv');
        this.element = $compile(angular.element('<object-property-overlay></object-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('objectPropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        responseObj = null;
        ontoUtils = null;
        this.element.remove();
    });

    it('initializes with the correct selected value object', function() {
        expect(this.controller.valueSelect).toEqual({});
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('object-property-overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('depending on whether the property is being edited', function() {
            [
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
            ].forEach(function(test) {
                ontologyStateSvc.editingProperty = test.value;
                scope.$digest();

                var header = angular.element(this.element.find('h6')[0]);
                var buttons = this.element.querySelectorAll('button.btn-primary');
                expect(header.text().trim()).toBe(test.header);
                expect(buttons.length).toBe(1);
                expect(angular.element(buttons[0]).text().trim()).toBe(test.button);
            }, this);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with an object select', function() {
            expect(this.element.find('object-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('should add an object property', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.selected = {};
                this.value = {'@id': 'value'};
            });
            describe('if the property is valid', function() {
                beforeEach(function() {
                    responseObj.getItemIri.and.returnValue('prop');
                });
                it('and the entity has the property', function() {
                    ontologyStateSvc.listItem.selected.prop = [{'@id': 'original'}];
                    this.controller.addProperty({}, this.value);
                    expect(ontologyStateSvc.listItem.selected.prop.length).toBe(2);
                    expect(ontologyStateSvc.listItem.selected.prop).toContain(this.value);
                    expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                        jasmine.any(Object));
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                });
                it('and the entity does not have the property', function() {
                    this.controller.addProperty({}, this.value);
                    expect(ontologyStateSvc.listItem.selected.prop).toEqual([this.value]);
                    expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                        jasmine.any(Object));
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                });
            });
            it('unless the property is not valid', function() {
                responseObj.getItemIri.and.returnValue('');
                this.controller.addProperty({}, this.value);
                expect(ontologyStateSvc.listItem.selected).toEqual({});
                expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
        describe('should edit an object property', function() {
            beforeEach(function() {
                this.value = {'@id': 'value'};
                this.original = {prop: [{}]};
                ontologyStateSvc.listItem.selected = angular.copy(this.original);
                ontologyStateSvc.propertyIndex = 0;
            });
            it('if the property is valid', function() {
                responseObj.getItemIri.and.returnValue('prop');
                this.controller.editProperty({}, this.value);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.listItem.selected.prop[ontologyStateSvc.propertyIndex]).toEqual(this.value);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    jasmine.any(Object));
                expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('unless the property is not valid', function() {
                responseObj.getItemIri.and.returnValue('');
                this.controller.editProperty({}, this.value);
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.selected).toEqual(this.original);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
        it('getValues should call the correct method', function() {
            ontologyStateSvc.listItem = { objectProperties: { iris: [] } };
            ontoUtils.getSelectList.and.returnValue(['list']);
            this.controller.getValues('text');
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.iris, 'text', ontoUtils.getDropDownText);
            expect(this.controller.values).toEqual(['list']);
        });
    });
    it('should call editProperty when the button is clicked', function() {
        spyOn(this.controller, 'editProperty');
        ontologyStateSvc.editingProperty = true;
        scope.$digest();

        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.editProperty).toHaveBeenCalled();
    });
    it('should call addProperty when the button is clicked', function() {
        spyOn(this.controller, 'addProperty');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addProperty).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(false);
    });
});