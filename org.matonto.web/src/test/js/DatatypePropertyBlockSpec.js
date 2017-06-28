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
describe('Datatype Property Block directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('datatypePropertyBlock');
        injectBeautifyFilter();
        injectSplitIRIFilter();
        injectShowPropertiesFilter();
        mockOntologyState();
        mockResponseObj();
        mockPrefixes();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        element = $compile(angular.element('<datatype-property-block></datatype-property-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('datatype-property-block')).toBe(true);
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
        it('depending on whether a datatype property is being deleted', function() {
            element.controller('datatypePropertyBlock').showRemoveOverlay = true;
            scope.$digest();
            expect(element.find('remove-property-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('datatypePropertyBlock');
        });
        it('should set the correct manager values when opening the Add Data Property Overlay', function() {
            controller.openAddDataPropOverlay();
            expect(ontologyStateSvc.editingProperty).toBe(false);
            expect(ontologyStateSvc.propertySelect).toBeUndefined();
            expect(ontologyStateSvc.propertyValue).toBe('');
            expect(ontologyStateSvc.propertyType).toBeUndefined();
            expect(ontologyStateSvc.propertyIndex).toBe(0);
            expect(ontologyStateSvc.propertyLanguage).toBe('en');
            expect(ontologyStateSvc.showDataPropertyOverlay).toBe(true);
        });
        it('should set the correct manager values when opening the Remove Data Property Overlay', function() {
            controller.showRemovePropertyOverlay('key', 1);
            expect(controller.key).toBe('key');
            expect(controller.index).toBe(1);
            expect(controller.showRemoveOverlay).toBe(true);
        });
        describe('should set the correct manager values when editing a data property', function() {
            it('when @language is present', function() {
                var propertyIRI = 'prop1';
                ontologyStateSvc.listItem.selected = {
                    'prop1': [{'@value': 'value', '@language': 'lang'}]
                };
                ontologyStateSvc.listItem.dataPropertyRange = ['type'];
                controller.editDataProp(propertyIRI, 0);
                expect(ontologyStateSvc.editingProperty).toBe(true);
                expect(ontologyStateSvc.propertySelect).toEqual(propertyIRI);
                expect(ontologyStateSvc.propertyValue).toBe('value');
                expect(ontologyStateSvc.propertyIndex).toBe(0);
                expect(ontologyStateSvc.propertyType).toEqual({'@id': prefixes.rdf + 'langString'});
                expect(ontologyStateSvc.propertyLanguage).toBe('lang');
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(true);
            });
            it('when @language is missing', function() {
                var propertyIRI = 'prop1';
                ontologyStateSvc.listItem.selected = {
                    'prop1': [{'@value': 'value', '@type': 'type'}]
                };
                ontologyStateSvc.listItem.dataPropertyRange = ['type'];
                controller.editDataProp(propertyIRI, 0);
                expect(ontologyStateSvc.editingProperty).toBe(true);
                expect(ontologyStateSvc.propertySelect).toEqual(propertyIRI);
                expect(ontologyStateSvc.propertyValue).toBe('value');
                expect(ontologyStateSvc.propertyIndex).toBe(0);
                expect(ontologyStateSvc.propertyType).toEqual({'@id': 'type'});
                expect(ontologyStateSvc.propertyLanguage).toBeUndefined();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(true);
            });
        });
    });
    it('should call openAddDataPropOverlay when the link is clicked', function() {
        controller = element.controller('datatypePropertyBlock');
        spyOn(controller, 'openAddDataPropOverlay');
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(controller.openAddDataPropOverlay).toHaveBeenCalled();
    });
});