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

describe('Individual Editor directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc,
        ontologyManagerSvc,
        responseObj,
        prefixes,
        showPropertiesFilter;

    beforeEach(function() {
        module('templates');
        module('individualEditor');
        injectShowPropertiesFilter();
        mockPrefixes();
        mockOntologyManager();
        mockStateManager();
        mockResponseObj();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_, _prefixes_, _responseObj_,
            _showPropertiesFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
            responseObj = _responseObj_;
            showPropertiesFilter = _showPropertiesFilter_;
        });

        element = $compile(angular.element('<individual-editor></individual-editor>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('individual-editor')).toBe(true);
        });
        it('with a tab button container', function() {
            var tabContainer = element.find('tab-button-container');
            expect(tabContainer.length).toBe(1);
        });
        describe('for editor tab', function() {
            describe('basic', function() {
                beforeEach(function() {
                    stateManagerSvc.state = {editorTab: 'basic'};
                    scope.$digest();
                });
                it('with the correct tab', function() {
                    expect(element.querySelectorAll('.tab').length).toBe(1);
                });
                it('with a static iri', function() {
                    expect(element.find('static-iri').length).toBe(1);
                });
                it('with a string select', function() {
                    expect(element.find('static-iri').length).toBe(1);
                });
            });
            describe('properties', function() {
                beforeEach(function() {
                    stateManagerSvc.state = {editorTab: 'properties'};
                    scope.$digest();
                });
                it('with the correct tab', function() {
                    expect(element.querySelectorAll('.tab').length).toBe(1);
                });
                it('with data and object properties', function() {
                    expect(element.querySelectorAll('.data-properties').length).toBe(1);
                    expect(element.querySelectorAll('.object-properties').length).toBe(1);
                });
                it('with button containers', function() {
                    expect(element.querySelectorAll('.btn-container').length).toBe(2);
                });
                it('with the correct number of data property values', function() {
                    showPropertiesFilter.and.returnValue(['prop']);
                    scope.$digest();
                    expect(element.querySelectorAll('.data-properties property-values').length).toBe(1);
                });
                it('with the correct number of object property values', function() {
                    showPropertiesFilter.and.returnValue(['prop']);
                    scope.$digest();
                    expect(element.querySelectorAll('.object-properties property-values').length).toBe(1);
                });
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('individualEditor');
        });
        it('should set the appropriate state variables for opening the add data property overlay', function() {
            controller.openAddDataPropOverlay();
            expect(stateManagerSvc.editingProperty).toBe(false);
            expect(stateManagerSvc.propertySelect).toBe(undefined);
            expect(stateManagerSvc.propertyValue).toBe('');
            expect(stateManagerSvc.propertyType).toBe(undefined);
            expect(stateManagerSvc.propertyIndex).toBe(0);
            expect(stateManagerSvc.showDataPropertyOverlay).toBe(true);
        });
        it('should set the appropriate state variables for editing a data property', function() {
            stateManagerSvc.selected = {'prop': [{'@value': 'value', '@type': 'type'}]};
            responseObj.getItemIri.and.callFake(function(obj) {
                if (obj.type === 'prop') {
                    return 'prop'
                } else {
                    return 'type';
                }
            });
            stateManagerSvc.state= {dataPropertyRange: [{}]};
            controller.editDataProp({type: 'prop'}, 0);
            expect(stateManagerSvc.editingProperty).toBe(true);
            expect(stateManagerSvc.propertySelect).toEqual({type: 'prop'});
            expect(stateManagerSvc.propertyValue).toBe('value');
            expect(stateManagerSvc.propertyType).toEqual({});
            expect(stateManagerSvc.propertyIndex).toBe(0);
            expect(stateManagerSvc.showDataPropertyOverlay).toBe(true);
        });
        it('should set the appropriate state variables for opening the add object property overlay', function() {
            controller.openAddObjectPropOverlay();
            expect(stateManagerSvc.editingProperty).toBe(false);
            expect(stateManagerSvc.propertySelect).toBe(undefined);
            expect(stateManagerSvc.propertyValue).toBe(undefined);
            expect(stateManagerSvc.propertyIndex).toBe(0);
            expect(stateManagerSvc.showObjectPropertyOverlay).toBe(true);
        });
        it('should set the appropriate state variables for editing an object property', function() {
            stateManagerSvc.selected = {'prop': [{'@id': 'id'}]};
            responseObj.getItemIri.and.returnValue('prop');
            controller.editObjectProp({}, 0);
            expect(stateManagerSvc.editingProperty).toBe(true);
            expect(stateManagerSvc.propertySelect).toEqual({});
            expect(stateManagerSvc.propertyValue).toEqual('id');
            expect(stateManagerSvc.propertyIndex).toBe(0);
            expect(stateManagerSvc.showObjectPropertyOverlay).toBe(true);
        });
        it('should set the appropriate state variables for opening the remove individual property overlay', function() {
            controller.showRemovePropertyOverlay('key', 0);
            expect(stateManagerSvc.key).toBe('key');
            expect(stateManagerSvc.index).toBe(0);
            expect(stateManagerSvc.showRemoveIndividualPropertyOverlay).toBe(true);
        });
    });
    it('should open the addDataPropertyOverlay when the add data property button is clicked', function() {
        controller = element.controller('individualEditor');
        stateManagerSvc.state = {editorTab: 'properties'};
        scope.$digest();
        spyOn(controller, 'openAddDataPropOverlay');

        var button = angular.element(element.querySelectorAll('.data-properties .btn-container a')[0]);
        button.triggerHandler('click');
        expect(controller.openAddDataPropOverlay).toHaveBeenCalled();
    });
    it('should open the addObjectPropertyOverlay when the add object property button is clicked', function() {
        controller = element.controller('individualEditor');
        stateManagerSvc.state = {editorTab: 'properties'};
        scope.$digest();
        spyOn(controller, 'openAddObjectPropOverlay');

        var button = angular.element(element.querySelectorAll('.object-properties .btn-container a')[0]);
        button.triggerHandler('click');
        expect(controller.openAddObjectPropOverlay).toHaveBeenCalled();
    });
});
