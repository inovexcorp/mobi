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
describe('Relationships Block directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('relationshipsBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        scope.relationshipList = [];
        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        element = $compile(angular.element('<relationships-block relationship-list="relationshipList"></relationships-block>'))(scope);
        scope.$digest();
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('relationshipsBlock');
        });
        it('relationshipList is two way bound', function() {
            controller.relationshipList = [{}];
            scope.$digest();
            expect(scope.relationshipList).toEqual([{}]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('relationships-block')).toBe(true);
            expect(element.hasClass('axiom-block')).toBe(true);
        });
        it('based on annotation button', function() {
            expect(element.querySelectorAll('.fa-plus').length).toBe(1);
        });
        it('depending on how many annotations there are', function() {
            expect(element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.find('property-values').length).toBe(0);
        });
        it('depending on whether an annotation is being deleted', function() {
            expect(element.find('remove-property-overlay').length).toBe(0);

            element.controller('relationshipsBlock').showRemoveOverlay = true;
            scope.$digest();
            expect(element.find('remove-property-overlay').length).toBe(1);
        });
        it('depending on whether a relationship is being shown', function() {
            expect(element.find('relationship-overlay').length).toBe(0);

            ontologyStateSvc.showRelationshipOverlay = true;
            scope.$digest();
            expect(element.find('relationship-overlay').length).toBe(1);
        });
        it('based on whether something is selected', function() {
            expect(element.querySelectorAll('block-header a').length).toBe(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.querySelectorAll('block-header a').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('relationshipsBlock');
        });
        it('should set the correct manager values when opening the Remove Annotation Overlay', function() {
            controller.openRemoveOverlay('key', 1);
            expect(controller.key).toBe('key');
            expect(controller.index).toBe(1);
            expect(controller.showRemoveOverlay).toBe(true);
        });
    });
    it('should set the correct state when the add relationship link is clicked', function() {
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(true);
    });
});