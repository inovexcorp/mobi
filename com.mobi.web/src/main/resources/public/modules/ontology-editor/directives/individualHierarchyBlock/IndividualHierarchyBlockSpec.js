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
describe('Individual Hierarchy directive', function() {
    var $compile,
        scope,
        element,
        ontologyStateSvc,
        ontologyUtilsManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('individualHierarchyBlock');
        mockOntologyState();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
        });

        element = $compile(angular.element('<individual-hierarchy-block></individual-hierarchy-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('individual-hierarchy-block')).toBe(true);
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
        it('with a individual-tree', function() {
            expect(element.find('individual-tree').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a button to delete an individual', function() {
            var button = element.querySelectorAll('block-footer button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete Individual');
        });
        it('based on whether a delete should be confirmed', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);

            controller = element.controller('individualHierarchyBlock');
            controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(1);
        });
        it('based on whether something is selected', function() {
            var button = angular.element(element.querySelectorAll('block-footer button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('individualHierarchyBlock');
        });
        it('should delete an individual', function() {
            controller.deleteIndividual();
            expect(ontologyUtilsManagerSvc.deleteIndividual).toHaveBeenCalled();
            expect(controller.showDeleteConfirmation).toBe(false);
        });
    });
    it('should set the correct state when the create individual link is clicked', function() {
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(true);
    });
    it('should set the correct state when the delete class button is clicked', function() {
        controller = element.controller('individualHierarchyBlock');
        var button = angular.element(element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(controller.showDeleteConfirmation).toBe(true);
    });
});