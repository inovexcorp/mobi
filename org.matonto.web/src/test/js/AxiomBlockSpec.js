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
describe('Axiom Block directive', function() {
    var $compile,
        scope,
        element,
        ontologyStateSvc,
        ontologyManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('axiomBlock');
        mockOntologyState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        element = $compile(angular.element('<axiom-block></axiom-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('axiom-block')).toBe(true);
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
        it('based on whether something is selected', function() {
            expect(element.querySelectorAll('block-header a').length).toBe(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(element.querySelectorAll('block-header a').length).toBe(0);
        });
        it('based on whether a class is selected', function() {
            ontologyManagerSvc.isClass.and.returnValue(true);
            scope.$digest();
            expect(element.find('class-axioms').length).toBe(1);

            ontologyManagerSvc.isClass.and.returnValue(false);
            scope.$digest();
            expect(element.find('class-axioms').length).toBe(0);
        });
        it('based on whether an object property is selected', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(element.find('object-property-axioms').length).toBe(1);

            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            scope.$digest();
            expect(element.find('object-property-axioms').length).toBe(0);
        });
        it('based on whether a datatype property is selected', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            expect(element.find('datatype-property-axioms').length).toBe(1);

            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            scope.$digest();
            expect(element.find('datatype-property-axioms').length).toBe(0);
        });
    });
    it('should set the correct state when the add axiom link is clicked', function() {
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showAxiomOverlay).toBe(true);
    });
});