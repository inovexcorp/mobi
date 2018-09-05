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
describe('Class Hierarchy Block directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('classHierarchyBlock');
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<class-hierarchy-block></class-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classHierarchyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontologyUtilsManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('class-hierarchy-block')).toBe(true);
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
        it('with a hierarchy-tree', function() {
            expect(this.element.find('hierarchy-tree').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a button to delete a class', function() {
            var button = this.element.querySelectorAll('block-footer button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete Class');
        });
        it('based on whether something is selected', function() {
            var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmaiton modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), ontologyUtilsManagerSvc.deleteClass);
        });
        it('should open the createClassOverlay', function() {
            this.controller.showCreateClassOverlay();
            expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createClassOverlay');
        });
    });
    it('should call showCreateClassOverlay when the create class link is clicked', function() {
        spyOn(this.controller, 'showCreateClassOverlay');
        var link = angular.element(this.element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showCreateClassOverlay).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmation when the delete class button is clicked', function() {
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});