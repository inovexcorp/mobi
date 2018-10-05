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
describe('Ontology Branch Select directive', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, ontologyManagerSvc, stateManagerSvc, utilSvc, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyBranchSelect');
        mockCatalogManager();
        mockOntologyState();
        mockOntologyManager();
        mockUtil();
        mockStateManager();
        mockPrefixes();
        mockModal();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _ontologyStateService_, _ontologyManagerService_, _$q_, _stateManagerService_, _utilService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            $q = _$q_;
            stateManagerSvc = _stateManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.branchId = 'branchId';
        this.branch = {'@id': this.branchId};
        this.commitId = 'commitId';
        ontologyStateSvc.listItem.userCanModify = true;

        scope.bindModel = {};
        this.element = $compile(angular.element('<ontology-branch-select ng-model="bindModel"></ontology-branch-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyBranchSelect');
        this.errorMessage = 'error';
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        stateManagerSvc = null;
        utilSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('ngModel should be two way bound', function() {
            this.controller.bindModel = {id: 'id'};
            scope.$digest();
            expect(scope.bindModel).toEqual({id: 'id'});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-branch-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('depending on whether the current ontology has changes', function() {
            var select = this.element.find('ui-select');
            expect(select.attr('disabled')).toBeTruthy();

            ontologyStateSvc.hasChanges.and.returnValue(false);
            scope.$digest();
            expect(select.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current ontology is committable', function() {
            ontologyStateSvc.hasChanges.and.returnValue(false);
            scope.$digest();
            var select = this.element.find('ui-select');
            expect(select.attr('disabled')).toBeFalsy();

            ontologyStateSvc.isCommittable.and.returnValue(true);
            scope.$digest();
            expect(select.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the current branch is a user branch', function() {
            catalogManagerSvc.isUserBranch.and.returnValue(true);
            expect(this.element.querySelectorAll('.fa.fa-exclamation-triangle.fa-fw-red').length).toBe(0);
            scope.$digest();
            expect(this.element.querySelectorAll('.fa.fa-exclamation-triangle.fa-fw-red').length).toBe(1);
        });
        it('depending on whether the user can modify record', function() {
            ontologyStateSvc.listItem.userCanModify = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.fa-trash-o').length).toBe(1);
            expect(this.element.querySelectorAll('.fa-pencil').length).toBe(1);
        });
        it('depending on whether the the user cannot modify record', function() {
            ontologyStateSvc.listItem.userCanModify = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.fa-trash-o').length).toBe(0);
            expect(this.element.querySelectorAll('.fa-pencil').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        describe('changeBranch calls the correct methods', function() {
            describe('when getBranchHeadCommit is resolved', function() {
                beforeEach(function() {
                    var ontoState = {
                        model: [
                            {
                                '@id': 'state-id'
                            },
                            {
                                '@id': 'branch-id',
                                [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}],
                                [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}]
                            }
                        ]
                    };
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({ commit: { '@id': this.commitId } }));
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue(ontoState);
                    utilSvc.getPropertyId.and.callFake((entity, propertyIRI) => _.get(entity, "['" + propertyIRI + "'][0]['@id']", ''));
                });
                it('when updateOntologyState and updateOntology are resolved', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.when());
                    ontologyStateSvc.updateOntology.and.returnValue($q.when());
                    this.controller.changeBranch(this.branch);
                    scope.$apply();
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId,
                        ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                        this.branchId, this.commitId);
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                        this.branchId, this.commitId, true);
                    expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                });
                it('and updateOntologyState does not resolve', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.reject(this.errorMessage));
                    this.controller.changeBranch(this.branch);
                    scope.$digest()
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
                it('and updateOntology does not resolve', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.when());
                    ontologyStateSvc.updateOntology.and.returnValue($q.reject(this.errorMessage));
                    this.controller.changeBranch(this.branch);
                    scope.$digest()
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
            });
            it('when getBranchHeadCommit does not resolve', function() {
                expect(this.controller.deleteError).toBe('');
                catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.reject(this.errorMessage));
                this.controller.changeBranch(this.branch);
                scope.$digest();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
            });
        });
        describe('openDeleteConfirmation calls the correct methods if the branch is', function() {
            beforeEach(function() {
                this.event = scope.$emit('click');
                spyOn(this.event, 'stopPropagation');
            });
            it('a user branch', function() {
                catalogManagerSvc.isUserBranch.and.returnValue(true);
                this.controller.openDeleteConfirmation(this.event, this.branch);
                expect(this.event.stopPropagation).toHaveBeenCalled();
                expect(this.controller.branch).toEqual(this.branch);
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('diverging changes'), this.controller.delete);
            });
            it('not a user branch', function() {
                this.controller.openDeleteConfirmation(this.event, this.branch);
                expect(this.event.stopPropagation).toHaveBeenCalled();
                expect(this.controller.branch).toEqual(this.branch);
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith({asymmetricMatch: actual => !actual.includes('diverging changes')}, this.controller.delete);
            });
        });
        it('openEditOverlay calls the correct methods', function() {
            var event = scope.$emit('click');
            spyOn(event, 'stopPropagation');
            this.controller.openEditOverlay(event, this.branch);
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('editBranchOverlay', {branch: this.branch}, jasmine.any(Function));
        });
        describe('delete calls the correct methods', function() {
            beforeEach(function() {
                this.controller.branch = this.branch;
                ontologyStateSvc.listItem.branches = [this.branch];
                scope.$digest();
            });
            it('when resolved', function() {
                ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.when());
                this.controller.delete();
                scope.$apply();
                expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.branch['@id']);
            });
            it('when rejected', function() {
                ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject(this.errorMessage));
                this.controller.delete();
                scope.$apply();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
            });
        });
    });
});