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
import { of, throwError } from 'rxjs';

import {
    mockOntologyState,
    mockUtil,
    mockCatalogManager,
    mockOntologyManager,
    mockPrefixes
} from '../../../../../../test/js/Shared';

describe('Saved Changes Tab component', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, utilSvc, catalogManagerSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
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
        scope.additions = [];
        scope.deletions = [];
        this.element = $compile(angular.element('<saved-changes-tab additions="additions" deletions="deletions"></saved-changes-tab>'))(scope);
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

    describe('controller bound variable', function() {
        it('additions is one way bound', function() {
            this.controller.additions = [{}];
            scope.$digest();
            expect(scope.additions).toEqual([]);
        });
        it('deletions is one way bound', function() {
            this.controller.deletions = [{}];
            scope.$digest();
            expect(scope.deletions).toEqual([]);
        });
    });
    describe('should update the list of changes when additions/deletions change', function() {
        beforeEach(function() {
            utilSvc.getChangesById.and.returnValue([{}]);
            utilSvc.getPredicatesAndObjects.and.returnValue([{}]);
        });
        it('if there are less than 100 changes', function() {
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': '1', 'value': ['stuff']}];
            ontologyStateSvc.listItem.inProgressCommit.deletions = [{'@id': '1', 'value': ['otherstuff']}, {'@id': '2'}];
            this.controller.$onChanges();
            _.forEach(ontologyStateSvc.listItem.inProgressCommit.additions, change => {
                expect(utilSvc.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            _.forEach(ontologyStateSvc.listItem.inProgressCommit.deletions, change => {
                expect(utilSvc.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            expect(this.controller.showList).toEqual([
                {id: '1', additions: [{}], deletions: [{}], disableAll: false},
                {id: '2', additions: [], deletions: [{}], disableAll: false},
            ]);
        });
        it('if there are more than 100 changes', function() {
            var ids = _.range(102);
            ontologyStateSvc.listItem.inProgressCommit.additions = _.map(ids, id => ({'@id': id}));
            this.controller.$onChanges();
            _.forEach(ontologyStateSvc.listItem.inProgressCommit.additions, change => {
                expect(utilSvc.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            expect(this.controller.showList.length).toEqual(100);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SAVED-CHANGES-TAB');
            expect(this.element.querySelectorAll('.saved-changes-tab.row').length).toEqual(1);
        });
        it('with a .has-changes', function() {
            expect(this.element.querySelectorAll('.has-changes').length).toEqual(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.has-changes').length).toEqual(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toEqual(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.btn-container').length).toEqual(1);
        });
        it('with .btn', function() {
            expect(this.element.querySelectorAll('.btn-container .btn').length).toEqual(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.btn-container .btn').length).toEqual(1);
        });
        it('with .list-group', function() {
            expect(this.element.querySelectorAll('.list-group').length).toEqual(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
            this.controller.showList = [{}];
            scope.$apply();
            expect(this.element.querySelectorAll('.list-group').length).toEqual(1);
        });
        it('with statement-display dependent on how many additions/deletions there are', function() {
            expect(this.element.find('statement-display').length).toEqual(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id', 'value': ['stuff']}];
            this.controller.showList = [{additions: [{}]}, {additions: [{}]}];
            scope.$digest();
            // TODO: ng-repeat with Angular component not rendering iterations. When upgraded switch back to 2
            // expect(this.element.find('statement-display').length).toEqual(2);
            expect(this.element.find('statement-display').length).toEqual(0);
            // ontologyStateSvc.listItem.upToDate = false;
            // utilSvc.getPredicatesAndObjects.and.returnValue([{}]);
            // scope.$apply();
            // expect(this.element.find('statement-display').length).toEqual(1);
        });
        it('depending on whether the list item is up to date', function() {
            expect(this.element.querySelectorAll('.no-changes info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.changes .text-center error-display').length).toEqual(0);

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.no-changes info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toEqual(1);

            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-info error-display').length).toEqual(1);

            ontologyStateSvc.listItem.upToDate = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-info error-display').length).toEqual(0);
        });
        it('depending on whether the branch is a user branch', function() {
            expect(this.element.querySelectorAll('.no-changes info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toEqual(0);

            ontologyStateSvc.listItem.userBranch = true;
            ontologyStateSvc.listItem.createdFromExists = true;
            scope.$digest();

            expect(this.element.querySelectorAll('.no-changes info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toEqual(1);

            ontologyStateSvc.listItem.createdFromExists = true;
            scope.$digest();

            expect(this.element.querySelectorAll('.no-changes info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.no-changes error-display').length).toEqual(1);
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
                catalogManagerSvc.getBranchHeadCommit.and.returnValue(of({commit: {'@id': this.commitId}}));
            });
            it('unless an error occurs', function(done) {
                ontologyStateSvc.updateOntology.and.returnValue($q.reject('Error message'));
                this.controller.update().then(() => {
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.branchId, ontologyStateSvc.listItem.versionedRdfRecord.recordId, jasmine.any(String));
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, ontologyStateSvc.listItem.versionedRdfRecord.branchId, this.commitId);
                    expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                    done();
                });
                scope.$apply();
            });
            it('successfully', function(done) {
                ontologyStateSvc.updateOntology.and.returnValue($q.when());
                this.controller.update().then(() => {
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.branchId, ontologyStateSvc.listItem.versionedRdfRecord.recordId, jasmine.any(String));
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, ontologyStateSvc.listItem.versionedRdfRecord.branchId, this.commitId);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    done();
                });
                scope.$apply();
            });
        });
        describe('removeChanges calls the correct manager methods and sets the correct variables', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
                ontologyStateSvc.listItem.inProgressCommit.deletions = [{'@id': 'id'}];
            });
            describe('when deleteInProgressCommit resolves', function() {
                beforeEach(function() {
                    catalogManagerSvc.deleteInProgressCommit.and.returnValue(of());
                });
                it('and updateOntology resolves', function(done) {
                    ontologyStateSvc.updateOntology.and.returnValue($q.when());
                    this.controller.removeChanges().then(() => {
                        expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, ontologyStateSvc.listItem.versionedRdfRecord.branchId, ontologyStateSvc.listItem.versionedRdfRecord.commitId, ontologyStateSvc.listItem.upToDate);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                        expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                        done();
                    });
                    scope.$digest();
                });
                it('and updateOntology rejects', function(done) {
                    ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                    this.controller.removeChanges().then(() => {
                        expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, ontologyStateSvc.listItem.versionedRdfRecord.branchId, ontologyStateSvc.listItem.versionedRdfRecord.commitId, ontologyStateSvc.listItem.upToDate);
                        expect(this.controller.error).toEqual('error');
                        done();
                    });
                    scope.$digest();
                });
            });
            it('when deleteInProgressCommit rejects', function(done) {
                catalogManagerSvc.deleteInProgressCommit.and.returnValue(throwError('error'));
                this.controller.removeChanges().then(() => {
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                    expect(this.controller.error).toEqual('error');
                    done();
                });
                scope.$digest();
            });
        });
        it('orderByEntityName should call the correct method', function() {
            ontologyStateSvc.getEntityNameByListItem.and.returnValue('iri');
            expect(this.controller.orderByEntityName({id: 'id'})).toEqual('iri');
            expect(ontologyStateSvc.getEntityNameByListItem).toHaveBeenCalledWith('id');
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

                ontologyStateSvc.listItem.versionedRdfRecord.branchId = this.userBranchId;
                ontologyStateSvc.listItem.versionedRdfRecord.recordId = this.recordId;
                ontologyStateSvc.listItem.versionedRdfRecord.commitId = this.commitId;
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
                    catalogManagerSvc.createRecordBranch.and.returnValue(of(this.newBranchId));
                });
                describe('and when getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordBranch.and.returnValue(of(this.newBranch));
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
                            it('and when deleteOntologyBranchState is resolved', function(done) {
                                ontologyStateSvc.deleteOntologyBranchState.and.returnValue($q.when());
                                ontologyStateSvc.listItem.versionedRdfRecord.branchId = this.newBranchId;
                                _.remove(ontologyStateSvc.listItem.branches, branch => branch['@id'] === this.userBranchId);
                                this.controller.restoreBranchWithUserBranch().then(() => {
                                    expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.versionedRdfRecord.commitId);
                                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId, ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                                    expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.versionedRdfRecord.recordId, commitId: this.commitId, branchId: this.newBranchId});
                                    expect(ontologyStateSvc.deleteOntologyBranchState).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.newBranchId);
                                    expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.newBranchId);
                                    expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.otherUserBranchId, ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId, this.otherUserBranch);
                                    done();
                                });
                                scope.$apply();
                            });
                            it('and when deleteOntologyBranchState is rejected', function(done) {
                                ontologyStateSvc.deleteOntologyBranchState.and.returnValue($q.reject('error'));
                                this.controller.restoreBranchWithUserBranch().then(() => {
                                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                                    done();
                                });
                                scope.$apply();
                            });
                        });
                        it('and when deleteOntologyBranch is rejected', function(done) {
                            ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject('error'));
                            this.controller.restoreBranchWithUserBranch().then(() => {
                                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                                done();
                            });
                            scope.$apply();
                        });
                    });
                    it('and when updateOntologyState is rejected', function(done) {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject('error'));
                        this.controller.restoreBranchWithUserBranch().then(() => {
                            expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.versionedRdfRecord.commitId);
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId, ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.versionedRdfRecord.recordId, commitId: this.commitId, branchId: this.newBranchId});
                            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                            done();
                        });
                        scope.$apply();
                    });
                });
                it('and when getRecordBranch is rejected', function(done) {
                    catalogManagerSvc.getRecordBranch.and.returnValue(throwError('error'));
                    this.controller.restoreBranchWithUserBranch().then(() => {
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.versionedRdfRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId, ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                        done();
                    });
                    scope.$apply();
                });
            });
            it('when createRecordBranch is rejected', function(done) {
                catalogManagerSvc.createRecordBranch.and.returnValue(throwError(this.error));
                this.controller.restoreBranchWithUserBranch().then(() => {
                    expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.versionedRdfRecord.commitId);
                    expect(this.controller.error).toEqual(this.error);
                    done();
                });
                scope.$apply();
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
