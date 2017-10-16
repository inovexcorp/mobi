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
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        resObj;

    beforeEach(function() {
        module('templates');
        module('ontologyPropertiesBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockOntologyManager();
        mockResponseObj();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _responseObj_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            resObj = _responseObj_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        ontologyManagerSvc.getAnnotationIRIs.and.returnValue(['prop1', 'prop2']);
        element = $compile(angular.element('<ontology-properties-block></ontology-properties-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-properties-block')).toBe(true);
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
        it('depending on how many ontology properties there are', function() {
            expect(element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.find('property-values').length).toBe(0);
        });
        it('depending on whether an ontology property is being deleted', function() {
            element.controller('ontologyPropertiesBlock').showRemoveOverlay = true;
            scope.$digest();
            expect(element.find('remove-property-overlay').length).toBe(1);
        });
        it('depending on whether an ontology property is being shown', function() {
            ontologyStateSvc.showOntologyPropertyOverlay = true;
            scope.$digest();
            expect(element.find('ontology-property-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('ontologyPropertiesBlock');
        });
        it('should set the correct manager values when opening the Add Overlay', function() {
            controller.openAddOverlay();
            expect(ontologyStateSvc.editingOntologyProperty).toBe(false);
            expect(ontologyStateSvc.ontologyProperty).toBeUndefined();
            expect(ontologyStateSvc.ontologyPropertyValue).toBe('');
            expect(ontologyStateSvc.ontologyPropertyIRI).toBe('');
            expect(ontologyStateSvc.ontologyPropertyLanguage).toBe('en');
            expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(true);
        });
        it('should set the correct manager values when opening the Remove Ontology Property Overlay', function() {
            controller.openRemoveOverlay('key', 1);
            expect(controller.key).toBe('key');
            expect(controller.index).toBe(1);
            expect(controller.showRemoveOverlay).toBe(true);
        });
        it('should set the correct manager values when editing an ontology property', function() {
            var propertyIRI = 'prop1';
            ontologyStateSvc.listItem.selected = {
                'prop1': [{'@value': 'value', '@type': 'type', '@id': 'id', '@language': 'lang'}]
            };
            ontologyStateSvc.listItem.dataPropertyRange = ['type'];
            controller.editClicked(propertyIRI, 0);
            expect(ontologyStateSvc.editingOntologyProperty).toBe(true);
            expect(ontologyStateSvc.ontologyProperty).toEqual(propertyIRI);
            expect(ontologyStateSvc.ontologyPropertyValue).toBe('value');
            expect(ontologyStateSvc.ontologyPropertyIRI).toBe('id');
            expect(ontologyStateSvc.ontologyPropertyIndex).toBe(0);
            expect(ontologyStateSvc.ontologyPropertyLanguage).toBe('lang');
            expect(ontologyStateSvc.showOntologyPropertyOverlay).toBe(true);
        });
    });
    it('should call openAddOverlay when the link is clicked', function() {
        controller = element.controller('ontologyPropertiesBlock');
        spyOn(controller, 'openAddOverlay');
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(controller.openAddOverlay).toHaveBeenCalled();
    });
});