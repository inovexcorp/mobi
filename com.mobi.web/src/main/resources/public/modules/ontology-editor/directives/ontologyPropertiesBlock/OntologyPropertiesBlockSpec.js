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
describe('Ontology Properties Block directive', function() {
    var $compile, scope, ontologyStateSvc, propertyManagerSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyPropertiesBlock');
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

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<ontology-properties-block></ontology-properties-block>'))(scope);
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

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-properties-block')).toBe(true);
            expect(this.element.hasClass('annotation-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('depending on how many ontology properties there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('should set the correct manager values when opening the Add Overlay', function() {
            this.controller.openAddOverlay();
            expect(ontologyStateSvc.editingOntologyProperty).toBe(false);
            expect(ontologyStateSvc.ontologyProperty).toBeUndefined();
            expect(ontologyStateSvc.ontologyPropertyValue).toBe('');
            expect(ontologyStateSvc.ontologyPropertyIRI).toBe('');
            expect(ontologyStateSvc.ontologyPropertyType).toBeUndefined();
            expect(ontologyStateSvc.ontologyPropertyLanguage).toBe('');
            expect(modalSvc.openModal).toHaveBeenCalledWith('ontologyPropertyOverlay');
        });
        it('should set the correct manager values when opening the Remove Ontology Property Overlay', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        it('should set the correct manager values when editing an ontology property', function() {
            var propertyIRI = 'prop1';
            ontologyStateSvc.listItem.selected = {
                'prop1': [{'@value': 'value', '@type': 'type', '@id': 'id', '@language': 'lang'}]
            };
            ontologyStateSvc.listItem.dataPropertyRange = ['type'];
            this.controller.editClicked(propertyIRI, 0);
            expect(ontologyStateSvc.editingOntologyProperty).toBe(true);
            expect(ontologyStateSvc.ontologyProperty).toEqual(propertyIRI);
            expect(ontologyStateSvc.ontologyPropertyValue).toBe('value');
            expect(ontologyStateSvc.ontologyPropertyIRI).toBe('id');
            expect(ontologyStateSvc.ontologyPropertyType).toBe('type');
            expect(ontologyStateSvc.ontologyPropertyIndex).toBe(0);
            expect(ontologyStateSvc.ontologyPropertyLanguage).toBe('lang');
            expect(modalSvc.openModal).toHaveBeenCalledWith('ontologyPropertyOverlay');
        });
    });
    it('should call openAddOverlay when the link is clicked', function() {
        spyOn(this.controller, 'openAddOverlay');
        var link = angular.element(this.element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.openAddOverlay).toHaveBeenCalled();
    });
});