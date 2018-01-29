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
describe('Annotation Block directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('annotationBlock');
        mockOntologyState();
        mockOntologyUtilsManager();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<annotation-block></annotation-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('annotationBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('annotation-block')).toBe(true);
        });
        it('based on annotation button', function() {
            var icon = this.element.querySelectorAll('.fa-plus');
            expect(icon.length).toBe(1);
        });
        it('depending on how many annotations there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('depending on whether an annotation is being deleted', function() {
            this.controller.showRemoveOverlay = true;
            scope.$digest();
            expect(this.element.find('remove-property-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should set the correct manager values when opening the Add Annotation Overlay', function() {
            this.controller.openAddOverlay();
            expect(ontologyStateSvc.editingAnnotation).toBe(false);
            expect(ontologyStateSvc.annotationSelect).toBeUndefined();
            expect(ontologyStateSvc.annotationValue).toBe('');
            expect(ontologyStateSvc.annotationType).toBeUndefined();
            expect(ontologyStateSvc.annotationIndex).toBe(0);
            expect(ontologyStateSvc.annotationLanguage).toBe('en');
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(true);
        });
        it('should set the correct manager values when opening the Remove Annotation Overlay', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(this.controller.key).toBe('key');
            expect(this.controller.index).toBe(1);
            expect(this.controller.showRemoveOverlay).toBe(true);
        });
        it('should set the correct manager values when editing an annotation', function() {
            var annotationIRI = 'prop1';
            ontologyStateSvc.listItem.selected = {
                'prop1': [{'@value': 'value', '@type': 'type', '@language': 'language'}]
            };
            this.controller.editClicked(annotationIRI, 0);
            expect(ontologyStateSvc.editingAnnotation).toBe(true);
            expect(ontologyStateSvc.annotationSelect).toEqual(annotationIRI);
            expect(ontologyStateSvc.annotationValue).toBe('value');
            expect(ontologyStateSvc.annotationIndex).toBe(0);
            expect(ontologyStateSvc.annotationType).toBe('type');
            expect(ontologyStateSvc.annotationLanguage).toBe('language');
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(true);
        });
    });
});