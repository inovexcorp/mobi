/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { 
    mockComponent,
    mockOntologyState,
    mockOntologyUtilsManager,
    mockPropertyManager,
    mockModal,
    injectShowPropertiesFilter
 } from '../../../../../../test/js/Shared';

describe('Annotation Block component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, propertyManagerSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'propertyValues');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockPropertyManager();
        mockModal();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _propertyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<annotation-block selected="dvm.os.listItem.selected"></annotation-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('annotationBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        propertyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    it('initializes with the correct data', function() {
        ontologyStateSvc.listItem.annotations.iris = {'annotation1': '', 'default2': '', 'owl2': ''};
        propertyManagerSvc.defaultAnnotations = ['default1', 'default2'];
        propertyManagerSvc.owlAnnotations = ['owl1', 'owl2'];
        this.controller.$onInit();
        expect(this.controller.annotations).toEqual(['annotation1', 'default2', 'owl2', 'default1', 'owl1']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ANNOTATION-BLOCK');
            expect(this.element.querySelectorAll('.annotation-block').length).toEqual(1);
            expect(this.element.querySelectorAll('.section-header').length).toEqual(1);
        });
        it('depending on how many annotations there are', function() {
            expect(this.controller.annotationsFiltered).toEqual(['prop1', 'prop2']);
            console.log(this.element);
            expect(this.element.find('property-values').length).toEqual(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toEqual(0);
        });
        it('depending on whether the selected entity is imported', function() {
            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
        it('depending on whether something is selected when the user can modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('a.fa-plus').length).toEqual(0);
        });
        it('if the user cannot modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
        });
        it('should set the correct manager values when opening the Add Annotation Overlay', function() {
            this.controller.openAddOverlay();
            expect(ontologyStateSvc.editingAnnotation).toEqual(false);
            expect(ontologyStateSvc.annotationSelect).toBeUndefined();
            expect(ontologyStateSvc.annotationValue).toEqual('');
            expect(ontologyStateSvc.annotationType).toBeUndefined();
            expect(ontologyStateSvc.annotationIndex).toEqual(0);
            expect(ontologyStateSvc.annotationLanguage).toEqual('en');
            expect(modalSvc.openModal).toHaveBeenCalledWith('annotationOverlay', jasmine.any(Object), jasmine.any(Function));
        });
        it('should set the correct manager values when opening the Remove Annotation Overlay', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        it('should set the correct manager values when editing an annotation', function() {
            var annotationIRI = 'prop1';
            ontologyStateSvc.listItem.selected = {
                'prop1': [{'@value': 'value', '@type': 'type', '@language': 'language'}]
            };
            this.controller.editClicked(annotationIRI, 0);
            expect(ontologyStateSvc.editingAnnotation).toEqual(true);
            expect(ontologyStateSvc.annotationSelect).toEqual(annotationIRI);
            expect(ontologyStateSvc.annotationValue).toEqual('value');
            expect(ontologyStateSvc.annotationIndex).toEqual(0);
            expect(ontologyStateSvc.annotationType).toEqual('type');
            expect(ontologyStateSvc.annotationLanguage).toEqual('language');
            expect(modalSvc.openModal).toHaveBeenCalledWith('annotationOverlay', jasmine.any(Object), jasmine.any(Function));
        });
    });
});