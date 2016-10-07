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
describe('Annotation Block directive', function() {
    var $compile,
        scope,
        element,
        ontologyStateSvc,
        ontologyManagerSvc,
        controller;


    beforeEach(function() {
        module('templates');
        module('annotationBlock');
        injectBeautifyFilter();
        injectSplitIRIFilter();
        injectShowPropertiesFilter();
        mockOntologyState();
        mockOntologyManager();
        mockResponseObj();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            ontologyStateSvc.selected = {
                'prop1': [{'@id': 'value1'}],
                'prop2': [{'@value': 'value2'}]
            };
            ontologyManagerSvc.getAnnotationIRIs.and.returnValue(['prop1', 'prop2']);
            element = $compile(angular.element('<annotation-block></annotation-block>'))(scope);
            scope.$digest();
        });
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on annotation button', function() {
            var icon = element.querySelectorAll('.fa-plus');
            expect(icon.length).toBe(1);
        });
        it('based on listed annotations', function() {
            var annotations = element.find('property-values');
            expect(annotations.length).toBe(2);
            ontologyStateSvc.selected = undefined;
            scope.$digest();
            annotations = element.find('property-values');
            expect(annotations.length).toBe(0);
        });
        it('based on remove-property-overlay', function() {
            element.controller('annotationBlock').showRemoveOverlay = true;
            scope.$digest();
            var overlay = element.find('remove-property-overlay');
            expect(overlay.length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<annotation-block></annotation-block>'))(scope);
            scope.$digest();
            controller = element.controller('annotationBlock');
        });
        it('openAddOverlay sets the correct manager values', function() {
            controller.openAddOverlay();
            expect(ontologyStateSvc.editingAnnotation).toBe(false);
            expect(ontologyStateSvc.annotationSelect).toEqual(undefined);
            expect(ontologyStateSvc.annotationValue).toBe('');
            expect(ontologyStateSvc.annotationIndex).toBe(0);
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(true);
        });
        it('openRemoveOverlay sets the correct manager values', function() {
            controller.openRemoveOverlay('key', 1);
            expect(controller.key).toBe('key');
            expect(controller.index).toBe(1);
            expect(controller.showRemoveOverlay).toBe(true);
        });
        it('editClicked sets the correct manager values', function() {
            var annotationIRI = 'prop1';
            ontologyStateSvc.selected = {
                'prop1': [{'@value': 'value', '@type': 'type'}]
            };
            ontologyStateSvc.listItem.dataPropertyRange = ['type'];
            controller.editClicked(annotationIRI, 0);
            expect(ontologyStateSvc.editingAnnotation).toBe(true);
            expect(ontologyStateSvc.annotationSelect).toEqual(annotationIRI);
            expect(ontologyStateSvc.annotationValue).toBe(ontologyStateSvc.selected[annotationIRI][0]['@value']);
            expect(ontologyStateSvc.annotationIndex).toBe(0);
            expect(ontologyStateSvc.annotationType).toBe(ontologyStateSvc.selected[annotationIRI][0]['@type']);
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(true);
        });
    });
});