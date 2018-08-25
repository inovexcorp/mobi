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
describe('Saved Changes Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, stateManagerSvc, utilSvc, catalogManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('savedChangesTab');
        mockOntologyState();
        mockUtil();
        mockCatalogManager();
        mockOntologyManager()
        mockStateManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _stateManagerService_, _utilService_, _catalogManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
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
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.find('block-header').length).toBe(1);
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
        it('with .property-values', function() {
            expect(this.element.querySelectorAll('.property-values').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
            scope.$apply();
            expect(this.element.querySelectorAll('.property-values').length).toBe(1);
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
            expect(this.element.querySelectorAll('block-content .text-center info-message').length).toBe(1);
            expect(this.element.querySelectorAll('block-content .text-center error-display').length).toBe(0);

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(this.element.querySelectorAll('block-content .text-center info-message').length).toBe(0);
            expect(this.element.querySelectorAll('block-content .text-center error-display').length).toBe(1);

            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('block-header error-display').length).toBe(1);

            ontologyStateSvc.listItem.upToDate = true;
            scope.$digest();
            expect(this.element.querySelectorAll('block-header error-display').length).toBe(0);
        });
        it('depending on whether the branch is a user branch', function() {
            expect(this.element.querySelectorAll('block-content .text-center info-message').length).toBe(1);
            expect(this.element.querySelectorAll('block-content .text-center error-display').length).toBe(0);

            ontologyStateSvc.listItem.userBranch = true;
            ontologyStateSvc.listItem.createdFromExists = true;
            scope.$digest();

            expect(this.element.querySelectorAll('block-content .text-center info-message').length).toBe(0);
            expect(this.element.querySelectorAll('block-content .text-center error-display').length).toBe(1);

            ontologyStateSvc.listItem.createdFromExists = true;
            scope.$digest();

            expect(this.element.querySelectorAll('block-content .text-center info-message').length).toBe(0);
            expect(this.element.querySelectorAll('block-content .text-center error-display').length).toBe(1);
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
                    this.controller.removeChanges();
                });
                it('and updateOntology resolves', function() {
                    ontologyStateSvc.updateOntology.and.returnValue($q.when());
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate);
                    expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                });
                it('and updateOntology rejects', function() {
                    ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(this.controller.error).toEqual('error');
                });
            });
            it('when deleteInProgressCommit rejects', function() {
                catalogManagerSvc.deleteInProgressCommit.and.returnValue($q.reject('error'));
                this.controller.removeChanges();
                scope.$digest();
                expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
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
                    '@id': this.newBranchId
                };
                _.set(this.newBranch, "['" + prefixes.catalog + "head'][0]['@id']", this.commitId);
                _.set(this.newBranch, "['" + prefixes.dcterms + "title'][0]['@id']", this.branchTitle);
                _.set(this.newBranch, "['" + prefixes.dcterms + "description'][0]['@id']", this.branchDescription);


                this.userBranch = {
                    '@id': this.userBranchId,
                    '@type': [prefixes.catalog + 'UserBranch'],
                }
                _.set(this.userBranch, "['" + prefixes.catalog + "head'][0]['@id']", this.commitId);
                _.set(this.userBranch, "['" + prefixes.catalog + "createdFrom'][0]['@id']", this.createdFromId);
                _.set(this.userBranch, "['" + prefixes.dcterms + "title'][0]['@id']", this.branchTitle);
                _.set(this.userBranch, "['" + prefixes.dcterms + "description'][0]['@id']", this.branchDescription);

                this.otherUserBranch = {
                    '@id': this.otherUserBranchId,
                    '@type': [prefixes.catalog + 'UserBranch'],
                }
                _.set(this.otherUserBranch, "['" + prefixes.catalog + "head'][0]['@id']", this.commitId);
                _.set(this.otherUserBranch, "['" + prefixes.catalog + "createdFrom'][0]['@id']", this.createdFromId);
                _.set(this.otherUserBranch, "['" + prefixes.dcterms + "title'][0]['@id']", this.branchTitle);
                _.set(this.otherUserBranch, "['" + prefixes.dcterms + "description'][0]['@id']", this.branchDescription);

                ontologyStateSvc.listItem.ontologyRecord.branchId = this.userBranchId;
                ontologyStateSvc.listItem.ontologyRecord.recordId = this.recordId;
                ontologyStateSvc.listItem.ontologyRecord.commitId = this.commitId;
                ontologyStateSvc.listItem.branches.push(this.userBranch);
                ontologyStateSvc.listItem.branches.push(this.otherUserBranch);

                this.branchConfig = {
                    title: this.branchTitle,
                    description: this.branchDescription
                };

                utilSvc.getPropertyId.and.callFake(function(branch, prop) {
                    if (prop === prefixes.catalog + 'createdFrom') {
                        return this.createdFromId;
                    } else if (prop === prefixes.catalog + 'head') {
                       return this.commitId;
                   }
                }.bind(this));

                utilSvc.getDctermsValue.and.callFake(function(branch, prop) {
                    if (prop === 'title') {
                        return this.branchTitle;
                    } else if (prop === 'description') {
                        return this.branchDescription;
                    }
                }.bind(this));
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
                            stateManagerSvc.updateOntologyState.and.returnValue($q.when());
                            catalogManagerSvc.isUserBranch.and.callFake(function(branchToCheck) {
                                if (branchToCheck['@id'] === this.otherUserBranchId) {
                                    return true;
                                }
                            }.bind(this));
                        });
                        it('and when deleteOntologyBranch is resolved', function() {
                            ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.when());
                            ontologyStateSvc.listItem.ontologyRecord.branchId = this.newBranchId;
                            _.remove(ontologyStateSvc.listItem.branches, function(branch) {
                                return branch['@id'] === this.userBranchId;
                            });
                            this.controller.restoreBranchWithUserBranch();
                            scope.$digest();
                            expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                                .ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId,
                                ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                                this.newBranchId, this.commitId);
                            expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                                this.newBranchId);
                            expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.otherUserBranchId, ontologyStateSvc.listItem.ontologyRecord.recordId,
                                this.catalogId, this.otherUserBranch);
                        });
                        it('when rejected', function() {
                            ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject('error'));
                            this.controller.restoreBranchWithUserBranch();
                            scope.$apply();
                            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                        });
                    });
                    it('and when updateOntologyState is rejected', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.reject('error'));
                        this.controller.restoreBranchWithUserBranch();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                            .ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId,
                            ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            this.newBranchId, this.commitId);
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
                it('and when getRecordBranch is rejected', function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('error'));
                    this.controller.restoreBranchWithUserBranch();
                    scope.$digest();
                    expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem
                        .ontologyRecord.recordId, this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.newBranchId,
                        ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('when createRecordBranch is rejected', function() {
                catalogManagerSvc.createRecordBranch.and.returnValue($q.reject(this.error));
                this.controller.restoreBranchWithUserBranch();
                scope.$digest();
                expect(catalogManagerSvc.createRecordBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    this.catalogId, this.branchConfig, ontologyStateSvc.listItem.ontologyRecord.commitId);
                expect(this.controller.error).toBe(this.error);
            });
        });
    });
    it('should call update when the link is clicked', function() {
        ontologyStateSvc.listItem.upToDate = false;
        scope.$digest();
        spyOn(this.controller, 'update');
        var link = angular.element(this.element.querySelectorAll('block-content .text-center error-display a')[0]);
        link.triggerHandler('click');
        expect(this.controller.update).toHaveBeenCalled();
    });
});