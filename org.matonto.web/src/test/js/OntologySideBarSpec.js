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
describe('Ontology Side Bar directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc,
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('ontologySideBar');
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-side-bar></ontology-side-bar>'))(scope);
            scope.$digest();
        });
        it('for an ontology-side-bar', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-SIDE-BAR');
        });
        it('based on left-nav', function() {
            var leftNav = element.querySelectorAll('LEFT-NAV');
            expect(leftNav.length).toBe(1);
        });
        it('based on left-nav-items', function() {
            var leftNavItems = element.querySelectorAll('LEFT-NAV-ITEM');
            expect(leftNavItems.length).toBe(10);
        });
        it('based on .separators', function() {
            var separators = element.querySelectorAll('.separator');
            expect(separators.length).toBe(3);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-side-bar></ontology-side-bar>'))(scope);
            scope.$digest();
            controller = element.controller('ontologySideBar');
        });
        it('disableSave should call the appropriate manager functions', function() {
            controller.disableSave();
            expect(ontologyManagerSvc.getChangedListForOntology).not.toHaveBeenCalled();
            stateManagerSvc.ontology.matonto.isValid = true;
            controller.disableSave();
            expect(ontologyManagerSvc.getChangedListForOntology).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id);
        });
    });
});