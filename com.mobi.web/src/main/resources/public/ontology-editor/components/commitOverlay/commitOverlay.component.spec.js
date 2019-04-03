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
describe('Commit Overlay component', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockOntologyState();
        mockCatalogManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.commitId = 'commitId';
        this.branchId = 'branchId';
        this.branch = {'@id': this.branchId};

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<commit-overlay close="close()" dismiss="dismiss()"></commit-overlay>'))(scope);
        scope.$digest();
        ontologyStateSvc.listItem.upToDate = true;
        this.controller = this.element.controller('commitOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('COMMIT-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('depending on whether there is a error message', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();
            
            this.controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        describe('commit should call the correct manager functions', function() {
            describe('when upToDate is true', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.upToDate = true;
                });
                describe('when createBranchCommit is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.createBranchCommit.and.returnValue($q.when(this.commitId));
                    });
                    it('and when updateOntologyState is resolved', function() {
                        ontologyStateSvc.listItem.inProgressCommit.additions = ['test'];
                        ontologyStateSvc.listItem.inProgressCommit.deletions = ['test'];
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.when(''));
                        this.controller.commit();
                        scope.$digest();
                        expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                            ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId,
                            this.controller.comment);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId,
                            commitId: this.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                        expect(ontologyStateSvc.listItem.ontologyRecord.commitId).toEqual(this.commitId);
                        expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('and when updateOntologyState is rejected', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject('error'));
                        this.controller.commit();
                        scope.$digest();
                        expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                            ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId,
                            this.controller.comment);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: this.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                        expect(this.controller.error).toEqual('error');
                    });
                });
                it('when createBranchCommit is rejected', function() {
                    catalogManagerSvc.createBranchCommit.and.returnValue($q.reject('error'));
                    this.controller.commit();
                    scope.$digest();
                    expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.branchId,
                        ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.controller.comment);
                    expect(ontologyStateSvc.updateOntologyState).not.toHaveBeenCalled();
                    expect(this.controller.error).toEqual('error');
                });
            });
            describe('when upToDate is false', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.upToDate = false;
                });
                describe('when createRecordUserBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.createRecordUserBranch.and.returnValue($q.when(this.branchId));
                    });
                    describe('when getRecordBranch is resolved', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                        });
                        describe('when createBranchCommit is resolved', function() {
                            beforeEach(function() {
                                catalogManagerSvc.createBranchCommit.and.returnValue($q.when(this.commitId));
                            });
                            it('and when updateOntologyState is resolved', function() {
                                ontologyStateSvc.listItem.inProgressCommit.additions = ['test'];
                                ontologyStateSvc.listItem.inProgressCommit.deletions = ['test'];
                                oldBranchId = ontologyStateSvc.listItem.ontologyRecord.branchId;
                                oldCommitId = ontologyStateSvc.listItem.ontologyRecord.commitId;
                                ontologyStateSvc.updateOntologyState.and.returnValue($q.when(''));
                                this.controller.commit();
                                scope.$digest();
                                expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object), oldCommitId,
                                    oldBranchId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, this.catalogId);
                                expect(ontologyStateSvc.listItem.branches.length).toBe(1);
                                expect(ontologyStateSvc.listItem.branches[0]).toEqual(this.branch);
                                expect(ontologyStateSvc.listItem.ontologyRecord.branchId).toEqual(this.branchId);
                                expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                                    ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId,
                                    this.controller.comment);
                                expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: this.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                                expect(ontologyStateSvc.listItem.ontologyRecord.commitId).toEqual(this.commitId);
                                expect(ontologyStateSvc.listItem.userBranch).toEqual(true);
                                expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                                expect(scope.close).toHaveBeenCalled();
                            });
                            it('and when updateOntologyState is rejected', function() {
                                ontologyStateSvc.updateOntologyState.and.returnValue($q.reject('error'));
                                oldBranchId = ontologyStateSvc.listItem.ontologyRecord.branchId;
                                oldCommitId = ontologyStateSvc.listItem.ontologyRecord.commitId;
                                this.controller.commit();
                                scope.$digest();
                                expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object), oldCommitId,
                                    oldBranchId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, ontologyStateSvc
                                    .listItem.ontologyRecord.recordId, this.catalogId);
                                expect(ontologyStateSvc.listItem.branches.length).toBe(1);
                                expect(ontologyStateSvc.listItem.branches[0]).toEqual(this.branch);
                                expect(ontologyStateSvc.listItem.ontologyRecord.branchId).toEqual(this.branchId);
                                expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(
                                    ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId,
                                    this.controller.comment);
                                expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: this.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                                expect(this.controller.error).toEqual('error');
                            });
                        });
                        it('when createBranchCommit is rejected', function() {
                            oldBranchId = ontologyStateSvc.listItem.ontologyRecord.branchId;
                            oldCommitId = ontologyStateSvc.listItem.ontologyRecord.commitId;
                            catalogManagerSvc.createBranchCommit.and.returnValue($q.reject('error'));
                            this.controller.commit();
                            scope.$digest();
                            expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                                .listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object), oldCommitId,
                                oldBranchId);
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, ontologyStateSvc
                                .listItem.ontologyRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.listItem.branches.length).toBe(1);
                            expect(ontologyStateSvc.listItem.branches[0]).toEqual(this.branch);
                            expect(ontologyStateSvc.listItem.ontologyRecord.branchId).toEqual(this.branchId);
                            expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.branchId,
                                ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.controller.comment);
                            expect(ontologyStateSvc.updateOntologyState).not.toHaveBeenCalled();
                            expect(this.controller.error).toEqual('error');
                        });
                    });
                    it('when getRecordBranch is rejected', function() {
                        catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('error'));
                        this.controller.commit();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                            .listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object), ontologyStateSvc.listItem.ontologyRecord.commitId,
                            ontologyStateSvc.listItem.ontologyRecord.branchId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, ontologyStateSvc
                            .listItem.ontologyRecord.recordId, this.catalogId);
                        expect(this.controller.error).toEqual('error');
                    });
                });
                it('when createRecordUserBranch is rejected', function() {
                    catalogManagerSvc.createRecordUserBranch.and.returnValue($q.reject('error'));
                    this.controller.commit();
                    scope.$digest();
                    expect(catalogManagerSvc.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateSvc
                        .listItem.ontologyRecord.recordId, this.catalogId, jasmine.any(Object), ontologyStateSvc.listItem.ontologyRecord.commitId,
                        ontologyStateSvc.listItem.ontologyRecord.branchId);
                    expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                    expect(this.controller.error).toEqual('error');
                });
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call commit when the submit button is clicked', function() {
        spyOn(this.controller, 'commit');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.commit).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});