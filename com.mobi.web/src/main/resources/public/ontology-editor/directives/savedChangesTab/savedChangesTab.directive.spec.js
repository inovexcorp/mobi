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
describe('Saved Changes Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, utilSvc, catalogManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('savedChangesTab');
        mockOntologyState();
        mockUtil();
        mockCatalogManager();
        mockOntologyManager()
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _catalogManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
        });

        ontologyStateSvc.listItem.inProgressCommit = {additions: [], deletions: []};
        this.element = $compile(angular.element('<saved-changes-tab></saved-changes-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('savedChangesTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        utilSvc = null;
        catalogManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('saved-changes-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a .has-changes', function() {
            expect(this.element.querySelectorAll('.has-changes').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.has-changes').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with .btn', function() {
            expect(this.element.querySelectorAll('.btn-container .btn').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.btn-container .btn').length).toBe(1);
        });
        it('with .list-group', function() {
            expect(this.element.querySelectorAll('.list-group').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
            scope.$apply();
            expect(this.element.querySelectorAll('.list-group').length).toBe(1);
        });
        it('with statement-display dependent on how many additions/deletions there are', function() {
            expect(this.element.find('statement-display').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id', 'value': ['stuff']}];
            ontologyStateSvc.listItem.upToDate = false;
            utilSvc.getChangesById.and.returnValue([{}]);
            scope.$apply();
            expect(this.element.find('statement-display').length).toBe(2);
        });
        it('depending on whether the list item is up to date', function() {
            expect(this.element.querySelectorAll('.no-changes info-message').length).toBe(1);
            expect(this.element.querySelectorAll('.changes .text-center error-display').length).toBe(0);

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.no-changes info-message').length).toBe(0);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toBe(1);

            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-info error-display').length).toBe(1);

            ontologyStateSvc.listItem.upToDate = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-info error-display').length).toBe(0);
        });
        it('depending on whether the branch is a user branch', function() {
            expect(this.element.querySelectorAll('.no-changes info-message').length).toBe(1);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toBe(0);

            ontologyStateSvc.listItem.userBranch = true;
            ontologyStateSvc.listItem.createdFromExists = true;
            scope.$digest();

            expect(this.element.querySelectorAll('.no-changes info-message').length).toBe(0);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toBe(1);

            ontologyStateSvc.listItem.createdFromExists = true;
            scope.$digest();

            expect(this.element.querySelectorAll('.no-changes info-message').length).toBe(0);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toBe(1);
        });
        it('depending on whether the list item is committable', function() {
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('button.btn-danger')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            ontologyStateSvc.isCommittable.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.commitId = 'commitId';
            this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        });
        it('should go to a specific entity', function() {
            var event = {
                stopPropagation: jasmine.createSpy('stopPropagation')
            };
            this.controller.go(event, 'A');
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('A');
        });
        describe('should update the selected ontology', function() {
            beforeEach(function() {
                catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({commit: {'@id': this.commitId}}));
            });
            it('unless an error occurs', function() {
                ontologyStateSvc.updateOntology.and.returnValue($q.reject('Error message'));
                this.controller.update();
                scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(String));
                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, this.commitId);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                ontologyStateSvc.updateOntology.and.returnValue($q.when());
                this.controller.update();
                scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(String));
                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, this.commitId);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('removeChanges calls the correct manager methods and sets the correct variables', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
                ontologyStateSvc.listItem.inProgressCommit.deletions = [{'@id': 'id'}];
            });
            describe('when deleteInProgressCommit resolves', function() {
                beforeEach(function() {
                    catalogManagerSvc.deleteInProgressCommit.and.returnValue($q.when());
                });
                it('and updateOntology resolves', function() {
                    ontologyStateSvc.updateOntology.and.returnValue($q.when());
                    this.controller.removeChanges();
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate);
                    expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                    expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                });
                it('and updateOntology rejects', function() {
                    ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                    this.controller.removeChanges();
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate);
                    expect(this.controller.error).toEqual('error');
                });
            });
            it('when deleteInProgressCommit rejects', function() {
                catalogManagerSvc.deleteInProgressCommit.and.returnValue($q.reject('error'));
                this.controller.removeChanges();
                scope.$digest();
                expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                expect(this.controller.error).toBe('error');
            });
        });
        it('orderByIRI should call the correct method', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(this.controller.orderByIRI({id: 'id'})).toBe('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('id');
        });

        describe('restoreBranchWithUserBranch calls the correct method', function() {
            beforeEach(function() {
                this.recordId = 'recordId';

                this.newBranchId = 'newBranchId';
                this.userBranchId = 'userBranchId';
                this.otherUserBranchId = 'otherUserBranchId';
                this.createdFromId = 'createdFromId';

                this.branchTitle = 'branchA';
                this.branchDescription = 'branchDescription';

                this.newBranch = {
                    '@id': this.newBranchId,
                    [prefixes.catalog + 'head']: [{'@id': this.commitId}],
                    [prefixes.dcterms + 'title']: [{'@value': this.branchTitle}],
                    [prefixes.dcterms + 'description']: [{'@value': this.branchDescription}]
                };

                this.userBranch = {
                    '@id': this.userBranchId,
                    '@type': [prefixes.catalog + 'UserBranch'],
                    [prefixes.catalog + 'head']: [{'@id': this.commitId}],
                    [prefixes.catalog + 'createdFrom']: [{'@id': this.createdFromId}],
                    [prefixes.dcterms + 'title']: [{'@value': this.branchTitle}],
                    [prefixes.dcterms + 'description']: [{'@value': this.branchDescription}]
                };

                this.otherUserBranch = {
                    '@id': this.otherUserBranchId,
                    '@type': [prefixes.catalog + 'UserBranch'],
                    [prefixes.catalog + 'head']: [{'@id': this.commitId}],
                    [prefixes.catalog + 'createdFrom']: [{'@id': this.createdFromId}],
                    [prefixes.dcterms + 'title']: [{'@value': this.branchTitle}],
                    [prefixes.dcterms + 'description']: [{'@value': this.branchDescription}]
                };

                ontologyStateSvc.listItem.ontologyRecord.branchId = this.userBranchId;
                ontologyStateSvc.listItem.ontologyRecord.recordId = this.recordId;
                ontologyStateSvc.listItem.ontologyRecord.commitId = this.commitId;
                ontologyStateSvc.listItem.branches.push(this.userBranch);
                ontologyStateSvc.listItem.branches.push(this.otherUserBranch);

                this.branchConfig = {
                    title: this.branchTitle,
                    description: this.branchDescription
                };

                utilSvc.getPropertyId.and.callFake((branch, prop) => {
                    if (prop === prefixes.catalog + 'createdFrom') {
                        return this.createdFromId;
                    } else if (prop === prefixes.catalog + 'head') {
                       return this.commitId;
                   }
                });

                utilSvc.getDctermsValue.and.callFake((branch, prop) => {
                    if (prop === 'title') {
                        return this.branchTitle;
                    } else if (prop === 'description') {
                        return this.branchDescription;
                    }
                });
            });
            describe('when createRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.createRecordBranch.and.returnValue($q.when(this.newBranchId));
                });
                describe('and when getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.newBranch));
                    });
                    describe('and when updateOntologyState is resolved', function() {
                        beforeEach(function() {
                            ontologyStateSvc.updateOntologyState.and.returnValue($q.when());
                            catalogManagerSvc.isUserBranch.and.callFake(branchToCheck => branchToCheck['@id'] === this.otherUserBranchId);
                        });
                        describe('and when deleteOntologyBranch is resolved', function() {
                            beforeEach(() => {
                                ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.when());
                            });
                            it('and when deleteOntologyBranchState is resolved', function() {
                                ontologyStateSvc.deleteOntologyBranchState.and.returnValue($q.when());
                                ontologyStateSvc.listItem.ontologyRecord.branchId = this.newBranchId;
                                _.remove(ontologyStateSvc.listItem.branches, branch => branch['@id'] === this.userBranchId);
                                this.controller.restoreBranchWithUserBranch();
                                scope.$apply();
                                expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                                expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: this.commitId, branchId: this.newBranchId});
                                expect(ontologyStateSvc.deleteOntologyBranchState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.newBranchId);
                                expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.newBranchId);
                                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.otherUserBranchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.otherUserBranch);
                            });
                            it('and when deleteOntologyBranchState is rejected', function() {
                                ontologyStateSvc.deleteOntologyBranchState.and.returnValue($q.reject('error'));
                                this.controller.restoreBranchWithUserBranch();
                                scope.$apply();
                                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                            });
                        });
                        it('and when deleteOntologyBranch is rejected', function() {
                            ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject('error'));
                            this.controller.restoreBranchWithUserBranch();
                            scope.$apply();
                            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                        });
                    });
                    it('and when updateOntologyState is rejected', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject('error'));
                        this.controller.restoreBranchWithUserBranch();
                        scope.$apply();
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: this.commitId, branchId: this.newBranchId});
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
                it('and when getRecordBranch is rejected', function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('error'));
                    this.controller.restoreBranchWithUserBranch();
                    scope.$apply();
                    expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId, ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('when createRecordBranch is rejected', function() {
                catalogManagerSvc.createRecordBranch.and.returnValue($q.reject(this.error));
                this.controller.restoreBranchWithUserBranch();
                scope.$apply();
                expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                expect(this.controller.error).toBe(this.error);
            });
        });
        describe('mergeUserBranch calls the correct methods', function() {
            beforeEach(function() {
                this.source = {'@id': 'source'};
                this.target = {'@id': 'target'};
                ontologyStateSvc.listItem.branches = [this.source, this.target];
                utilSvc.getPropertyId.and.returnValue(this.target['@id']);
            });
            describe('when checkConflicts is resolved', function() {
                it('and when merge is resolved', function() {
                    this.controller.mergeUserBranch();
                    scope.$apply();
                    expect(ontologyStateSvc.listItem.merge.target).toEqual(this.target);
                    expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(true);
                    expect(ontologyStateSvc.listItem.merge.active).toEqual(false);
                    expect(ontologyStateSvc.checkConflicts).toHaveBeenCalled();
                    expect(ontologyStateSvc.merge).toHaveBeenCalled();
                    expect(ontologyStateSvc.cancelMerge).toHaveBeenCalled();
                    expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('and when merge is rejected', function() {
                    ontologyStateSvc.merge.and.returnValue($q.reject('Error'));
                    this.controller.mergeUserBranch();
                    scope.$apply();
                    expect(ontologyStateSvc.listItem.merge.target).toEqual(this.target);
                    expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(true);
                    expect(ontologyStateSvc.listItem.merge.active).toEqual(false);
                    expect(ontologyStateSvc.checkConflicts).toHaveBeenCalled();
                    expect(ontologyStateSvc.merge).toHaveBeenCalled();
                    expect(ontologyStateSvc.cancelMerge).toHaveBeenCalled();
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalled();
                });
            });
            it('when checkConflicts is rejected', function() {
                ontologyStateSvc.checkConflicts.and.returnValue($q.reject('Error'));
                this.controller.mergeUserBranch();
                scope.$apply();
                expect(ontologyStateSvc.listItem.merge.target).toEqual(this.target);
                expect(ontologyStateSvc.listItem.merge.checkbox).toEqual(true);
                expect(ontologyStateSvc.listItem.merge.active).toEqual(true);
                expect(ontologyStateSvc.checkConflicts).toHaveBeenCalled();
                expect(ontologyStateSvc.merge).not.toHaveBeenCalled();
                expect(ontologyStateSvc.cancelMerge).not.toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    it('should call update when the link is clicked', function() {
        ontologyStateSvc.listItem.upToDate = false;
        scope.$digest();
        spyOn(this.controller, 'update');
        var link = angular.element(this.element.querySelectorAll('.no-changes error-display a')[0]);
        link.triggerHandler('click');
        expect(this.controller.update).toHaveBeenCalled();
    });
    it('should call mergeUserBranch when the link is clicked', function() {
        ontologyStateSvc.listItem.userBranch = true;
        ontologyStateSvc.listItem.createdFromExists = true;
        scope.$digest();
        spyOn(this.controller, 'mergeUserBranch');
        var link = angular.element(this.element.querySelectorAll('.no-changes error-display a')[0]);
        link.triggerHandler('click');
        expect(this.controller.mergeUserBranch).toHaveBeenCalled();
    });
    it('should call restoreBranchWithUserBranch when the link is clicked', function() {
        ontologyStateSvc.listItem.userBranch = true;
        ontologyStateSvc.listItem.createdFromExists = false;
        scope.$digest();
        spyOn(this.controller, 'restoreBranchWithUserBranch');
        var link = angular.element(this.element.querySelectorAll('.no-changes error-display a')[0]);
        link.triggerHandler('click');
        expect(this.controller.restoreBranchWithUserBranch).toHaveBeenCalled();
    });
});