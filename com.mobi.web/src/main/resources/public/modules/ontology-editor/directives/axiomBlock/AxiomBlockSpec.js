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
describe('Axiom Block directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc;

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

        this.element = $compile(angular.element('<axiom-block></axiom-block>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('axiom-block')).toBe(true);
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
        it('based on whether something is selected', function() {
            expect(this.element.querySelectorAll('block-header a').length).toBe(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('block-header a').length).toBe(0);
        });
        it('based on whether a class is selected', function() {
            ontologyManagerSvc.isClass.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('class-axioms').length).toBe(1);

            ontologyManagerSvc.isClass.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('class-axioms').length).toBe(0);
        });
        it('based on whether an object property is selected', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('object-property-axioms').length).toBe(1);

            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('object-property-axioms').length).toBe(0);
        });
        it('based on whether a datatype property is selected', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('datatype-property-axioms').length).toBe(1);

            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('datatype-property-axioms').length).toBe(0);
        });
    });
    it('should set the correct state when the add axiom link is clicked', function() {
        var link = angular.element(this.element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showAxiomOverlay).toBe(true);
    });
});