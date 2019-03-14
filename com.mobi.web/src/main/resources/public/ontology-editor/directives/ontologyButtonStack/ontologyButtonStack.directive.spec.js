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
describe('Ontology Button Stack directive', function() {
    var $compile, scope, ontologyStateSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyButtonStack');
        mockOntologyState();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.isCommittable.and.returnValue(false);
        ontologyStateSvc.hasChanges.and.returnValue(false);
        ontologyStateSvc.listItem.userBranch = false;
        ontologyStateSvc.listItem.userCanModify = true;
        ontologyStateSvc.canModify.and.returnValue(true);
        this.element = $compile(angular.element('<ontology-button-stack></ontology-button-stack>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyButtonStack');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-button-stack')).toBe(true);
        });
        it('with a circle-button-stack', function() {
            expect(this.element.find('circle-button-stack').length).toBe(1);
        });
        it('with button.btn-floats', function() {
            expect(this.element.querySelectorAll('button.btn-float').length).toBe(6);
        });
        it('depending on whether the ontology is committable', function() {
            ontologyStateSvc.listItem.ontologyRecord.branchId = 'branch';
            scope.$digest();
            var uploadButton = angular.element(this.element.querySelectorAll('button.upload-circle-button')[0]);
            var tagButton = angular.element(this.element.querySelectorAll('button.btn-dark')[0]);
            var commitButton = angular.element(this.element.querySelectorAll('button.btn-info')[0]);
            var mergeButton = angular.element(this.element.querySelectorAll('button.btn-success')[0]);
            expect(tagButton.attr('disabled')).toBeFalsy();
            expect(uploadButton.attr('disabled')).toBeFalsy();
            expect(commitButton.attr('disabled')).toBeTruthy();
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.isCommittable.and.returnValue(true);
            scope.$digest();
            expect(tagButton.attr('disabled')).toBeTruthy();
            expect(uploadButton.attr('disabled')).toBeTruthy();
            expect(commitButton.attr('disabled')).toBeFalsy();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the ontology has changes', function() {
            var tagButton = angular.element(this.element.querySelectorAll('button.btn-dark')[0]);
            var mergeButton = angular.element(this.element.querySelectorAll('button.btn-success')[0]);
            expect(tagButton.attr('disabled')).toBeFalsy();
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.hasChanges.and.returnValue(true);
            scope.$digest();
            expect(tagButton.attr('disabled')).toBeTruthy();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the branch is a user branch', function() {
            var mergeButton = angular.element(this.element.querySelectorAll('button.btn-success')[0]);
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.userBranch = true;
            scope.$digest();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the branch is out of date', function() {
            var mergeButton = angular.element(this.element.querySelectorAll('button.btn-success')[0]);
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on if the user cannot modify record', function() {
            var tagButton = angular.element(this.element.querySelectorAll('button.btn-dark')[0]);
            var uploadButton = angular.element(this.element.querySelectorAll('button.upload-circle-button')[0]);
            var branchButton = angular.element(this.element.querySelectorAll('button.btn-warning')[0]);
            var commitButton = angular.element(this.element.querySelectorAll('button.btn-info')[0]);
            var createEntityButton = angular.element(this.element.querySelectorAll('button.btn-primary')[0]);
            var mergeButton = angular.element(this.element.querySelectorAll('button.btn-success')[0]);

            ontologyStateSvc.listItem.userCanModify = false;
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(tagButton.attr('disabled')).toBeTruthy();
            expect(uploadButton.attr('disabled')).toBeTruthy();
            expect(branchButton.attr('disabled')).toBeTruthy()
            expect(commitButton.attr('disabled')).toBeTruthy();
            expect(createEntityButton.attr('disabled')).toBeTruthy();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the ontology is open on a branch', function() {
            ontologyStateSvc.isCommittable.and.returnValue(true);
            scope.$digest();
            var commitButton = angular.element(this.element.querySelectorAll('button.btn-info')[0]);
            expect(commitButton.attr('disabled')).toBeTruthy();

            ontologyStateSvc.listItem.ontologyRecord.branchId = 'branch';
            scope.$digest();
            expect(commitButton.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should open the createTagModal', function() {
            this.controller.showCreateTagModal();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createTagModal');
        });
        it('should open the createBranchOverlay', function() {
            this.controller.showCreateBranchOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createBranchOverlay');
        });
        it('should open the commitOverlay', function() {
            this.controller.showCommitOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('commitOverlay');
        });
        it('should open the uploadChangesOverlay', function() {
            this.controller.showUploadChangesOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('uploadChangesOverlay');
        });
        describe('should open the createEntityModal', function() {
            it('if the current page is the project tab', function() {
                ontologyStateSvc.getActiveKey.and.returnValue('project');
                this.controller.showCreateEntityOverlay()
                expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                expect(modalSvc.openModal).toHaveBeenCalledWith('createEntityModal', undefined, undefined, 'sm');
            });
            it('if the current page is not the project tab', function() {
                ontologyStateSvc.getActiveKey.and.returnValue('classes');
                this.controller.showCreateEntityOverlay()
                expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                expect(modalSvc.openModal).toHaveBeenCalledWith('createEntityModal', undefined, undefined, 'sm');
            });
        });
    });
    it('should call showUploadChangesOverlay when the upload changes button is clicked', function() {
        spyOn(this.controller, 'showUploadChangesOverlay');
        var button = angular.element(this.element.querySelectorAll('button.upload-circle-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showUploadChangesOverlay).toHaveBeenCalled();
    });
    it('should call showCreateBranchOverlay when the create branch button is clicked', function() {
        spyOn(this.controller, 'showCreateBranchOverlay');
        var button = angular.element(this.element.querySelectorAll('button.btn-warning')[0]);
        button.triggerHandler('click');
        expect(this.controller.showCreateBranchOverlay).toHaveBeenCalled();
    });
    it('should set the correct state when the merge button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('button.btn-success')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.listItem.merge.active).toEqual(true);
    });
    it('should call showCommitOverlay when the commit button is clicked', function() {
        spyOn(this.controller, 'showCommitOverlay');
        var button = angular.element(this.element.querySelectorAll('button.btn-info')[0]);
        button.triggerHandler('click');
        expect(this.controller.showCommitOverlay).toHaveBeenCalled();
    });
    it('should call showCreateEntityOverlay when the create entity button is clicked', function() {
        spyOn(this.controller, 'showCreateEntityOverlay');
        var button = angular.element(this.element.querySelectorAll('button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.showCreateEntityOverlay).toHaveBeenCalled();
    });
});