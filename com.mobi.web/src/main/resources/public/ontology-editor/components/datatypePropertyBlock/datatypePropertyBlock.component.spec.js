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
    mockPrefixes,
    mockOntologyUtilsManager,
    mockModal,
    injectShowPropertiesFilter
} from '../../../../../../test/js/Shared';

describe('Datatype Property Block component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, prefixes, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'propertyValues');
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        mockModal();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<datatype-property-block selected="dvm.os.listItem.selected"> </datatype-property-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datatypePropertyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        prefixes = null;
        modalSvc = null;
        this.element.remove();
    });

    it('initializes with the correct data', function() {
        ontologyStateSvc.listItem.dataProperties.iris = {'annotation1': '', 'default2': '', 'owl2': ''};
        this.controller.$onInit();
        expect(this.controller.dataProperties).toEqual(['annotation1', 'default2', 'owl2']);
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('DATATYPE-PROPERTY-BLOCK');
            expect(this.element.querySelectorAll('.datatype-property-block').length).toEqual(1);
            expect(this.element.querySelectorAll('.annotation-block').length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toEqual(1);
        });
        it('with a link to add a datatype property if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);
        });
        it('with no link to add a datatype property if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
        it('depending on whether the selected individual is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);

            ontologyStateSvc.isSelectedImported.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
        it('depending on how many datatype properties there are', function() {
            expect(this.controller.dataPropertiesFiltered).toEqual(['prop1', 'prop2']);
            expect(this.element.find('property-values').length).toEqual(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        it('should set the correct manager values when opening the Add Data Property Overlay', function() {
            this.controller.openAddDataPropOverlay();
            expect(ontologyStateSvc.editingProperty).toEqual(false);
            expect(ontologyStateSvc.propertySelect).toBeUndefined();
            expect(ontologyStateSvc.propertyValue).toEqual('');
            expect(ontologyStateSvc.propertyType).toEqual(prefixes.xsd + 'string');
            expect(ontologyStateSvc.propertyIndex).toEqual(0);
            expect(ontologyStateSvc.propertyLanguage).toEqual('en');
            expect(modalSvc.openModal).toHaveBeenCalledWith('datatypePropertyOverlay', jasmine.any(Object), jasmine.any(Function));
        });
        it('should set the correct manager values when opening the Remove Data Property Overlay', function() {
            this.controller.showRemovePropertyOverlay('key', 1);
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        describe('should set the correct manager values when editing a data property', function() {
            beforeEach(function() {
                this.propertyIRI = 'prop1';
                this.value = {'@value': 'value'};
                ontologyStateSvc.listItem.selected = {[this.propertyIRI]: [this.value]};
            });
            it('when @language is present', function() {
                this.value['@language'] = 'lang';
                this.controller.editDataProp(this.propertyIRI, 0);
                expect(ontologyStateSvc.editingProperty).toEqual(true);
                expect(ontologyStateSvc.propertySelect).toEqual(this.propertyIRI);
                expect(ontologyStateSvc.propertyValue).toEqual('value');
                expect(ontologyStateSvc.propertyIndex).toEqual(0);
                expect(ontologyStateSvc.propertyType).toEqual(prefixes.rdf + 'langString');
                expect(ontologyStateSvc.propertyLanguage).toEqual('lang');
                expect(modalSvc.openModal).toHaveBeenCalledWith('datatypePropertyOverlay', jasmine.any(Object), jasmine.any(Function));
            });
            it('when @language is missing', function() {
                this.value['@type'] = 'type';
                this.controller.editDataProp(this.propertyIRI, 0);
                expect(ontologyStateSvc.editingProperty).toEqual(true);
                expect(ontologyStateSvc.propertySelect).toEqual(this.propertyIRI);
                expect(ontologyStateSvc.propertyValue).toEqual('value');
                expect(ontologyStateSvc.propertyIndex).toEqual(0);
                expect(ontologyStateSvc.propertyType).toEqual('type');
                expect(ontologyStateSvc.propertyLanguage).toBeUndefined();
                expect(modalSvc.openModal).toHaveBeenCalledWith('datatypePropertyOverlay', jasmine.any(Object), jasmine.any(Function));
            });
        });
    });
    it('should call openAddDataPropOverlay when the link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'openAddDataPropOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.openAddDataPropOverlay).toHaveBeenCalled();
    });
});