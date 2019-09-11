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
describe('Ontology Properties Block component', function() {
    var $compile, scope, ontologyStateSvc, propertyManagerSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('ontology-editor', 'propertyValues')
        injectShowPropertiesFilter();
        mockOntologyState();
        mockPropertyManager();
        mockOntologyUtilsManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        scope.ontology = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<ontology-properties-block ontology="ontology"></ontology-properties-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyPropertiesBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        propertyManagerSvc = null;
        ontoUtils = null;
        modalSvc = null;
        this.element.remove();
    });

    it('initializes with the correct data', function() {
        ontologyStateSvc.listItem.annotations.iris = {'annotation1': '', 'ont2': '', 'default2': '', 'owl2': ''};
        propertyManagerSvc.ontologyProperties = ['ont1', 'ont2'];
        propertyManagerSvc.defaultAnnotations = ['default1', 'default2'];
        propertyManagerSvc.owlAnnotations = ['owl1', 'owl2'];
        this.controller.$onChanges();
        expect(this.controller.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', 'annotation1']);
    });
    describe('controller bound variable', function() {
        it('ontology should be one way bound', function() {
            var original = angular.copy(scope.ontology);
            this.controller.ontology = {};
            scope.$digest();
            expect(scope.ontology).toEqual(original);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ONTOLOGY-PROPERTIES-BLOCK');
            expect(this.element.querySelectorAll('.ontology-properties-block').length).toEqual(1);
            expect(this.element.querySelectorAll('.annotation-block').length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toEqual(1);
        });
        it('depending on how many ontology properties there are', function() {
            expect(this.element.find('property-values').length).toEqual(2);
            this.controller.ontology = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toEqual(0);
        });
        it('with a link to add an ontology property when the user can modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);
        });
        it('with no link to add an ontology property when the user cannot modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        it('should set the correct manager values when opening the Add Overlay', function() {
            this.controller.openAddOverlay();
            expect(ontologyStateSvc.editingOntologyProperty).toEqual(false);
            expect(ontologyStateSvc.ontologyProperty).toBeUndefined();
            expect(ontologyStateSvc.ontologyPropertyValue).toEqual('');
            expect(ontologyStateSvc.ontologyPropertyIRI).toEqual('');
            expect(ontologyStateSvc.ontologyPropertyType).toBeUndefined();
            expect(ontologyStateSvc.ontologyPropertyLanguage).toEqual('');
            expect(modalSvc.openModal).toHaveBeenCalledWith('ontologyPropertyOverlay');
        });
        it('should set the correct manager values when opening the Remove Ontology Property Overlay', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        it('should set the correct manager values when editing an ontology property', function() {
            var propertyIRI = 'prop1';
            this.controller.ontology = {
                'prop1': [{'@value': 'value', '@type': 'type', '@id': 'id', '@language': 'lang'}]
            };
            ontologyStateSvc.listItem.dataPropertyRange = ['type'];
            this.controller.editClicked(propertyIRI, 0);
            expect(ontologyStateSvc.editingOntologyProperty).toEqual(true);
            expect(ontologyStateSvc.ontologyProperty).toEqual(propertyIRI);
            expect(ontologyStateSvc.ontologyPropertyValue).toEqual('value');
            expect(ontologyStateSvc.ontologyPropertyIRI).toEqual('id');
            expect(ontologyStateSvc.ontologyPropertyType).toEqual('type');
            expect(ontologyStateSvc.ontologyPropertyIndex).toEqual(0);
            expect(ontologyStateSvc.ontologyPropertyLanguage).toEqual('lang');
            expect(modalSvc.openModal).toHaveBeenCalledWith('ontologyPropertyOverlay');
        });
    });
    it('should call openAddOverlay when the link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'openAddOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.openAddOverlay).toHaveBeenCalled();
    });
});