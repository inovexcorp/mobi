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
describe('Commit Overlay directive', function() {
    var $compile,
        scope,
        $q,
        catalogManagerSvc,
        stateManagerSvc,
        ontologyStateSvc,
        element,
        controller,
        catalogId;

    var commitId = 'commitId';
    var error = 'error';
    var branchId = 'branchId';
    var branch = {'@id': branchId};

    beforeEach(function() {
        module('templates');
        module('commitOverlay');
        mockOntologyState();
        mockCatalogManager();
        mockStateManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _stateManagerService_,
            _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            stateManagerSvc = _stateManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        element = $compile(angular.element('<commit-overlay></commit-overlay>'))(scope);
        scope.$digest();
        ontologyStateSvc.listItem.ontologyState.upToDate = true;
        controller = element.controller('commitOverlay');
        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('depending on whether there is a error message', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = 'error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether the selected item is up to date', function() {
            expect(element.find('info-message').length).toBe(0);
            ontologyStateSvc.listItem.ontologyState.upToDate = false;
            scope.$digest();
            expect(element.find('info-message').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to submit and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        describe('commit should call the correct manager functions', function() {
            describe('when upToDate is true', function() {
                var branchDeferred;
                beforeEach(function() {
                    branchDeferred = $q.defer();
                    catalogManagerSvc.createBranchCommit.and.returnValue(branchDeferred.promise);
                    ontologyStateSvc.listItem.ontologyState.upToDate = true;
                });
                describe('when createBranchCommit is resolved', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        updateDeferred = $q.defer();
                        branchDeferred.resolve(commitId);
                        stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                    });
                    it('and when updateOntologyState is resolved', function() {
                        ontologyStateSvc.listItem.inProgressCommit.additions = ['test'];
                        ontologyStateSvc.listItem.inProgressCommit.deletions = ['test'];
                        updateDeferred.resolve('');
                        controller.commit();
                        scope.$digest();
                        expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                            ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId,
                            controller.comment);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            ontologyStateSvc.listItem.ontologyRecord.branchId, commitId);
                        expect(ontologyStateSvc.listItem.ontologyRecord.commitId).toEqual(commitId);
                        expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                        expect(ontologyStateSvc.showCommitOverlay).toBe(false);
                    });
                    it('and when updateOntologyState is rejected', function() {
                        updateDeferred.reject(error);
                        controller.commit();
                        scope.$digest();
                        expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                            ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId,
                            controller.comment);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            ontologyStateSvc.listItem.ontologyRecord.branchId, commitId);
                        expect(controller.error).toEqual(error);
                    });
                });
                it('when createBranchCommit is rejected', function() {
                    branchDeferred.reject(error);
                    controller.commit();
                    scope.$digest();
                    expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.branchId,
                        ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId, controller.comment);
                    expect(stateManagerSvc.updateOntologyState).not.toHaveBeenCalled();
                    expect(controller.error).toEqual(error);
                });
            });
            describe('when upToDate is false', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    catalogManagerSvc.createRecordUserBranch.and.returnValue(createDeferred.promise);
                    ontologyStateSvc.listItem.ontologyState.upToDate = false;
                });
                describe('when createRecordUserBranch is resolved', function() {
                    var getDeferred;
                    beforeEach(function() {
                        createDeferred.resolve(branchId);
                        getDeferred = $q.defer();
                        catalogManagerSvc.getRecordBranch.and.returnValue(getDeferred.promise);
                    });
                    describe('when getRecordBranch is resolved', function() {
                        var branchDeferred;
                        beforeEach(function() {
                            getDeferred.resolve(branch);
                            branchDeferred = $q.defer();
                            catalogManagerSvc.createBranchCommit.and.returnValue(branchDeferred.promise);
                        });
                        describe('when createBranchCommit is resolved', function() {
                            var updateDeferred;
                            beforeEach(function() {
                                updateDeferred = $q.defer();
                                branchDeferred.resolve(commitId);
                                stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                            });
                            it('and when updateOntologyState is resolved', function() {
                                ontologyStateSvc.listItem.inProgressCommit.additions = ['test'];
                                ontologyStateSvc.listItem.inProgressCommit.deletions = ['test'];
                                oldBranchId = ontologyStateSvc.listItem.ontologyRecord.branchId;
                                oldCommitId = ontologyStateSvc.listItem.ontologyRecord.commitId;
                                updateDeferred.resolve('');
                                controller.commit();
                                scope.$digest();
                                expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, catalogId, jasmine.any(Object), oldCommitId,
                                    oldBranchId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, catalogId);
                                expect(ontologyStateSvc.listItem.branches.length).toBe(1);
                                expect(ontologyStateSvc.listItem.branches[0]).toEqual(branch);
                                expect(ontologyStateSvc.listItem.ontologyRecord.branchId).toEqual(branchId);
                                expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                                    ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId,
                                    controller.comment);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                                    ontologyStateSvc.listItem.ontologyRecord.branchId, commitId);
                                expect(ontologyStateSvc.listItem.ontologyRecord.commitId).toEqual(commitId);
                                expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                                expect(ontologyStateSvc.showCommitOverlay).toBe(false);
                            });
                            it('and when updateOntologyState is rejected', function() {
                                updateDeferred.reject(error);
                                oldBranchId = ontologyStateSvc.listItem.ontologyRecord.branchId;
                                oldCommitId = ontologyStateSvc.listItem.ontologyRecord.commitId;
                                controller.commit();
                                scope.$digest();
                                expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, catalogId, jasmine.any(Object), oldCommitId,
                                    oldBranchId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, catalogId);
                                expect(ontologyStateSvc.listItem.branches.length).toBe(1);
                                expect(ontologyStateSvc.listItem.branches[0]).toEqual(branch);
                                expect(ontologyStateSvc.listItem.ontologyRecord.branchId).toEqual(branchId);
                                expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                                    ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId,
                                    controller.comment);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                                    ontologyStateSvc.listItem.ontologyRecord.branchId, commitId);
                                expect(controller.error).toEqual(error);
                            });
                        });
                        it('when createBranchCommit is rejected', function() {
                            oldBranchId = ontologyStateSvc.listItem.ontologyRecord.branchId;
                            oldCommitId = ontologyStateSvc.listItem.ontologyRecord.commitId;
                            branchDeferred.reject(error);
                            controller.commit();
                            scope.$digest();
                            expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                                .listItem.ontologyRecord.recordId, catalogId, jasmine.any(Object), oldCommitId,
                                oldBranchId);
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateSvc
                                .listItem.ontologyRecord.recordId, catalogId);
                            expect(ontologyStateSvc.listItem.branches.length).toBe(1);
                            expect(ontologyStateSvc.listItem.branches[0]).toEqual(branch);
                            expect(ontologyStateSvc.listItem.ontologyRecord.branchId).toEqual(branchId);
                            expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.branchId,
                                ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId, controller.comment);
                            expect(stateManagerSvc.updateOntologyState).not.toHaveBeenCalled();
                            expect(controller.error).toEqual(error);
                        });
                    });
                    it('when getRecordBranch is rejected', function() {
                        getDeferred.reject(error);
                        controller.commit();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                            .listItem.ontologyRecord.recordId, catalogId, jasmine.any(Object), ontologyStateSvc.listItem.ontologyRecord.commitId,
                            ontologyStateSvc.listItem.ontologyRecord.branchId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateSvc
                            .listItem.ontologyRecord.recordId, catalogId);
                        expect(controller.error).toEqual(error);
                    });
                });
                it('when createRecordUserBranch is rejected', function() {
                    createDeferred.reject(error);
                    controller.commit();
                    scope.$digest();
                    expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                        .listItem.ontologyRecord.recordId, catalogId, jasmine.any(Object), ontologyStateSvc.listItem.ontologyRecord.commitId,
                        ontologyStateSvc.listItem.ontologyRecord.branchId);
                    expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                    expect(controller.error).toEqual(error);
                });
            });
        });
    });
    it('should call commit when the submit button is clicked', function() {
        spyOn(controller, 'commit');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.commit).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCommitOverlay).toBe(false);
    });
});