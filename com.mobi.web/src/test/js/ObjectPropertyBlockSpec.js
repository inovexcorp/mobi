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
describe('Object Property Block directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('objectPropertyBlock');
        injectBeautifyFilter();
        injectSplitIRIFilter();
        injectShowPropertiesFilter();
        mockOntologyState();
        mockResponseObj();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        element = $compile(angular.element('<object-property-block></object-property-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('object-property-block')).toBe(true);
            expect(element.hasClass('annotation-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('depending on whether something is selected', function() {
            expect(element.querySelectorAll('block-header a').length).toBe(1);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.querySelectorAll('block-header a').length).toBe(0);
        });
        it('depending on how many datatype properties there are', function() {
            expect(element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.find('property-values').length).toBe(0);
        });
        it('depending on whether an object property is being deleted', function() {
            element.controller('objectPropertyBlock').showRemoveOverlay = true;
            scope.$digest();
            expect(element.find('remove-property-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('objectPropertyBlock');
        });
        it('should set the correct manager values when opening the Add Object Property Overlay', function() {
            controller.openAddObjectPropOverlay();
            expect(ontologyStateSvc.editingProperty).toBe(false);
            expect(ontologyStateSvc.propertySelect).toBeUndefined();
            expect(ontologyStateSvc.propertyValue).toBe('');
            expect(ontologyStateSvc.propertyIndex).toBe(0);
            expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(true);
        });
        it('should set the correct manager values when opening the Remove Object Property Overlay', function() {
            controller.showRemovePropertyOverlay('key', 1);
            expect(controller.key).toBe('key');
            expect(controller.index).toBe(1);
            expect(controller.showRemoveOverlay).toBe(true);
        });
        it('should set the correct manager values when editing an object property', function() {
            var propertyIRI = 'prop1';
            ontologyStateSvc.listItem.selected = {
                'prop1': [{'@id': 'value'}]
            };
            controller.editObjectProp(propertyIRI, 0);
            expect(ontologyStateSvc.editingProperty).toBe(true);
            expect(ontologyStateSvc.propertySelect).toEqual(propertyIRI);
            expect(ontologyStateSvc.propertyValue).toBe(ontologyStateSvc.listItem.selected[propertyIRI][0]['@id']);
            expect(ontologyStateSvc.propertyIndex).toBe(0);
            expect(ontologyStateSvc.showObjectPropertyOverlay).toBe(true);
        });
    });
    it('should call openAddObjectPropOverlay when the link is clicked', function() {
        controller = element.controller('objectPropertyBlock');
        spyOn(controller, 'openAddObjectPropOverlay');
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(controller.openAddObjectPropOverlay).toHaveBeenCalled();
    });
});