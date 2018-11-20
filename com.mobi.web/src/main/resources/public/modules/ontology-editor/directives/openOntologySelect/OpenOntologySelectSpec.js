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
describe('Open Ontology Select component', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, ontologyManagerSvc, stateManagerSvc, utilSvc, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('openOntologySelect');
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
        this.branch = {'@id': this.branchId, '@type': [prefixes.catalog + 'Branch']};
        this.commitId = 'commitId';
        this.currentState = {
            '@id': 'currentState'
        };
        this.recordState = {
            '@type': [prefixes.ontologyState + 'StateRecord'],
            [prefixes.ontologyState + 'currentState']: [{'@id': this.currentState['@id']}]
        };
        this.state = {model: [this.recordState, this.currentState]};
        this.errorMessage = 'error';

        ontologyStateSvc.listItem.userCanModify = true;
        ontologyStateSvc.listItem.branches = [this.branch];
        stateManagerSvc.getOntologyStateByRecordId.and.returnValue(this.state);
    });

    beforeEach(function helpers() {
        this.compile = function() {
            this.element = $compile(angular.element('<open-ontology-select></open-ontology-select>'))(scope);
            scope.$apply();
            this.controller = this.element.controller('openOntologySelect');
        }
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
        if (this.element) {
            this.element.remove();
        }
    });

    describe('should initialize with the correct variables if', function() {
        beforeEach(function() {
            catalogManagerSvc.isBranch.and.callFake(obj => _.includes(_.get(obj, '@type'), prefixes.catalog + 'Branch'));
            catalogManagerSvc.isCommit.and.callFake(obj => _.includes(_.get(obj, '@type'), prefixes.catalog + 'Commit'));
        });
        it('a branch is currently selected', function() {
            this.currentState['@type'] = [prefixes.ontologyState + 'StateBranch'];
            this.currentState[prefixes.ontologyState + 'branch'] = [{'@id': this.branchId}];
            this.compile();
            expect(this.controller.selected).toEqual(this.branch);
            expect(this.controller.selectList).toEqual(ontologyStateSvc.listItem.branches);
        });
        it('a commit is currently selected', function() {
            this.currentState['@type'] = [prefixes.ontologyState + 'StateCommit'];
            this.currentState[prefixes.ontologyState + 'commit'] = [{'@id': this.commitId}];
            this.compile();
            expect(this.controller.selected).toEqual(jasmine.objectContaining({'@id': this.commitId, '@type': [prefixes.catalog + 'Commit']}));
            expect(this.controller.selectList).toContain(jasmine.objectContaining({'@id': this.commitId, '@type': [prefixes.catalog + 'Commit']}));
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('OPEN-ONTOLOGY-SELECT');
            expect(this.element.querySelectorAll('.open-ontology-select').length).toEqual(1);
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
        it('depending on whether an entity is a branch', function() {
            expect(this.element.querySelectorAll('.entity-display a').length > 0).toEqual(false);

            catalogManagerSvc.isBranch.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.entity-display a').length > 0).toEqual(true);
        });
        it('depending on whether the current branch is a user branch', function() {
            catalogManagerSvc.isBranch.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.fa.fa-exclamation-triangle.fa-fw-red').length).toBe(0);
            catalogManagerSvc.isUserBranch.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.fa.fa-exclamation-triangle.fa-fw-red').length).toBe(1);
        });
        it('depending on whether the user can modify record', function() {
            catalogManagerSvc.isBranch.and.returnValue(true);
            ontologyStateSvc.listItem.userCanModify = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.fa-trash-o').length).toBe(1);
            expect(this.element.querySelectorAll('.fa-pencil').length).toBe(1);
        });
        it('depending on whether the the user cannot modify record', function() {
            catalogManagerSvc.isBranch.and.returnValue(true);
            ontologyStateSvc.listItem.userCanModify = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.fa-trash-o').length).toBe(0);
            expect(this.element.querySelectorAll('.fa-pencil').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('changeEntity calls the correct methods', function() {
            describe('if the entity is a branch', function() {
                beforeEach(function() {
                    catalogManagerSvc.isBranch.and.returnValue(true);
                });
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
                        this.controller.changeEntity(this.branch);
                        scope.$apply();
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId,
                            ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.commitId,
                            this.branchId);
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            this.branchId, this.commitId, true);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                    });
                    it('and updateOntologyState does not resolve', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.reject(this.errorMessage));
                        this.controller.changeEntity(this.branch);
                        scope.$digest()
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    });
                    it('and updateOntology does not resolve', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.when());
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject(this.errorMessage));
                        this.controller.changeEntity(this.branch);
                        scope.$digest()
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    });
                });
                it('when getBranchHeadCommit does not resolve', function() {
                    expect(this.controller.deleteError).toBe('');
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.reject(this.errorMessage));
                    this.controller.changeEntity(this.branch);
                    scope.$digest();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
            });
            it('if the entity is not a branch', function() {
                catalogManagerSvc.isBranch.and.returnValue(false);
                this.controller.changeEntity(this.branch);
                expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled()
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