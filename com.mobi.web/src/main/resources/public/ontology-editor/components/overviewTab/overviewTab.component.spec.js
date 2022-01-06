/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import {
    mockComponent,
    mockOntologyState,
    mockOntologyManager,
    mockOntologyUtilsManager,
    mockModal
} from '../../../../../../test/js/Shared';

describe('Overview Tab component', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'selectedDetails');
        mockComponent('ontology-editor', 'axiomBlock');
        mockComponent('ontology-editor', 'annotationBlock');
        mockComponent('ontology-editor', 'associationBlock');
        mockComponent('ontology-editor', 'characteristicsRow');
        mockComponent('ontology-editor', 'usagesBlock');
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

        this.element = $compile(angular.element('<overview-tab></overview-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('overviewTab');
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

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('OVERVIEW-TAB');
            expect(this.element.querySelectorAll('.overview-tab.row').length).toEqual(1);
        });
        ['association-block', 'selected-details', 'annotation-block', 'axiom-block', 'characteristics-row', 'usages-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with a button to delete an entity if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = this.element.querySelectorAll('.selected-header button.btn-danger');
            expect(button.length).toEqual(1);
            expect(angular.element(button[0]).text()).toContain('Delete');
        });
        it('with no button to delete an entity if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-header button.btn-danger').length).toEqual(0);
        });
        it('with a button to see the entity history', function() {
            var button = this.element.querySelectorAll('.selected-header button.btn-primary');
            expect(button.length).toEqual(1);
            expect(angular.element(button[0]).text()).toEqual('See History');
        });
        it('based on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-entity div').length).toBeGreaterThan(0);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-entity div').length).toEqual(0);
        });
        it('depending on whether the selected entity is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var historyButton = angular.element(this.element.querySelectorAll('.selected-header button.btn-primary')[0]);
            var deleteButton = angular.element(this.element.querySelectorAll('.selected-header button.btn-danger')[0]);
            expect(historyButton.attr('disabled')).toBeFalsy();
            expect(deleteButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.isSelectedImported.and.returnValue(true);
            scope.$digest();
            expect(historyButton.attr('disabled')).toBeTruthy();
            expect(deleteButton.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.deleteEntity);
        });
        it('should show a class history', function() {
            this.controller.seeHistory();
            expect(ontologyStateSvc.listItem.seeHistory).toEqual(true);
        });
        describe('should delete an entity', function() {
            it('if it is a class', function() {
                ontologyManagerSvc.isClass.and.returnValue(true);
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteClass).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
            });
            it('if it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteClass).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
            });
            it('if it is a datatype property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteClass).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).toHaveBeenCalled();
            });
        });
    });
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(this.controller, 'seeHistory');
        var button = angular.element(this.element.querySelectorAll('.selected-header button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.seeHistory).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('.selected-header button.btn-danger')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});
