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
describe('Classes Tab directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyUtilsManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('classesTab');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<classes-tab></classes-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classesTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyUtilsManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('classes-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a class-hierarchy-block', function() {
            expect(this.element.find('class-hierarchy-block').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with a annotation-block', function() {
            expect(this.element.find('annotation-block').length).toBe(1);
        });
        it('with a axiom-block', function() {
            expect(this.element.find('axiom-block').length).toBe(1);
        });
        it('with a usages-block', function() {
            expect(this.element.find('usages-block').length).toBe(1);
        });
        it('with a button to delete a class if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(2);
            expect(angular.element(button[0]).text()).toContain('See History');
            expect(angular.element(button[1]).text()).toContain('Delete');
        });
        it('with no button to delete a class if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(1);
        });
        it('depending on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-class').length).toEqual(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-class').length).toEqual(0);
        });
        it('depending on whether the selected class is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('button')[1]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), ontologyUtilsManagerSvc.deleteClass);
        });
    });
    it('should call showDeleteConfirmation when the delete class button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('button')[1]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});