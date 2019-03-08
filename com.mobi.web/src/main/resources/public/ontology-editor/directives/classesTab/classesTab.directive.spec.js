/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
        ['class-hierarchy-block', 'selected-details', 'annotation-block', 'axiom-block', 'usages-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with a button to delete a class if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = this.element.querySelectorAll('.selected-header button.btn-danger');
            expect(button.length).toEqual(1);
            expect(angular.element(button[0]).text()).toEqual('Delete');
        });
        it('with no button to delete a class if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-header button.btn-danger').length).toEqual(0);
        });
        it('with a button to see the class history', function() {
            var button = this.element.querySelectorAll('.selected-header button.btn-primary');
            expect(button.length).toEqual(1);
            expect(angular.element(button[0]).text()).toEqual('See History');
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
            var historyButton = angular.element(this.element.querySelectorAll('.selected-header button.btn-primary')[0]);
            var deleteButton = angular.element(this.element.querySelectorAll('.selected-header button.btn-danger')[0]);
            expect(historyButton.attr('disabled')).toBeFalsy();
            expect(deleteButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(historyButton.attr('disabled')).toBeTruthy();
            expect(deleteButton.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), ontologyUtilsManagerSvc.deleteClass);
        });
        it('should show a class history', function() {
            this.controller.seeHistory();
            expect(ontologyStateSvc.listItem.seeHistory).toEqual(true);
        });
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('.selected-header button.btn-danger')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(this.controller, 'seeHistory');
        var button = angular.element(this.element.querySelectorAll('.selected-header button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.seeHistory).toHaveBeenCalled();
    });
});