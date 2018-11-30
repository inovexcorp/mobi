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
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, ontologyManagerSvc, utilSvc, prefixes, modalSvc;

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

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.recordId = 'recordId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        this.tagId = 'tagId';

        this.branch = {'@id': this.branchId, '@type': [prefixes.catalog + 'Branch']};
        this.tag = {
            '@id': this.tagId,
            '@type': [prefixes.catalog + 'Tag'],
            [prefixes.catalog + 'commit']: [{'@id': this.commitId}]
        };
        this.currentState = {
            '@id': 'currentState'
        };
        this.recordState = {
            '@type': [prefixes.ontologyState + 'StateRecord'],
            [prefixes.ontologyState + 'currentState']: [{'@id': this.currentState['@id']}]
        };
        this.errorMessage = 'error';

        scope.listItem = {
            ontologyRecord: {
                recordId: this.recordId,
                branchId: this.branchId,
                commitId: this.commitId
            },
            userCanModify: true,
            branches: [this.branch],
            tags: [this.tag]
        };
        scope.state = {model: [this.recordState, this.currentState]};
        utilSvc.getPropertyId.and.callFake((obj, prop) => _.get(obj, "['" + prop + "'][0]['@id']"));
        ontologyStateSvc.isStateBranch.and.callFake(obj => _.includes(_.get(obj, '@type', []), prefixes.ontologyState + 'StateBranch'));
        ontologyStateSvc.isStateTag.and.callFake(obj => _.includes(_.get(obj, '@type', []), prefixes.ontologyState + 'StateTag'));
    });

    beforeEach(function helpers() {
        this.compile = function() {
            this.element = $compile(angular.element('<open-ontology-select list-item="listItem" state="state"></open-ontology-select>'))(scope);
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
            catalogManagerSvc.isTag.and.callFake(obj => _.includes(_.get(obj, '@type'), prefixes.catalog + 'Tag'));
        });
        it('a branch is currently selected', function() {
            this.currentState['@type'] = [prefixes.ontologyState + 'StateBranch'];
            this.currentState[prefixes.ontologyState + 'branch'] = [{'@id': this.branchId}];
            this.compile();
            expect(this.controller.selected).toEqual(this.branch);
            expect(this.controller.selectList).toEqual(_.concat(scope.listItem.branches, scope.listItem.tags));
        });
        it('a commit is currently selected', function() {
            this.currentState['@type'] = [prefixes.ontologyState + 'StateCommit'];
            this.currentState[prefixes.ontologyState + 'commit'] = [{'@id': this.commitId}];
            this.compile();
            expect(this.controller.selected).toEqual(jasmine.objectContaining({'@id': this.commitId, '@type': [prefixes.catalog + 'Commit']}));
            expect(this.controller.selectList).toContain(jasmine.objectContaining({'@id': this.commitId, '@type': [prefixes.catalog + 'Commit']}));
        });
        it('a tag is currently selected', function() {
            this.currentState['@type'] = [prefixes.ontologyState + 'StateTag'];
            this.currentState[prefixes.ontologyState + 'commit'] = [{'@id': this.commitId}];
            this.currentState[prefixes.ontologyState + 'tag'] = [{'@id': this.tagId}];
            this.compile();
            expect(this.controller.selected).toEqual(this.tag);
            expect(this.controller.selectList).toEqual(_.concat(scope.listItem.branches, scope.listItem.tags));
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
            scope.listItem.userCanModify = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.fa-trash-o').length).toBe(1);
            expect(this.element.querySelectorAll('.fa-pencil').length).toBe(1);
        });
        it('depending on whether the the user cannot modify record', function() {
            catalogManagerSvc.isBranch.and.returnValue(true);
            scope.listItem.userCanModify = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.fa-trash-o').length).toBe(0);
            expect(this.element.querySelectorAll('.fa-pencil').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        it('should get the correct group title for an entity', function() {
            catalogManagerSvc.isBranch.and.returnValue(true);
            expect(this.controller.getGroupTitle({})).toEqual('Branches');

            catalogManagerSvc.isBranch.and.returnValue(false);
            catalogManagerSvc.isTag.and.returnValue(true);
            expect(this.controller.getGroupTitle({})).toEqual('Tags');

            catalogManagerSvc.isTag.and.returnValue(false);
            catalogManagerSvc.isCommit.and.returnValue(true);
            expect(this.controller.getGroupTitle({})).toEqual('Commits');

            catalogManagerSvc.isCommit.and.returnValue(false);
            expect(this.controller.getGroupTitle({})).toEqual('(NONE)');
        });
        it('should get the correct type string for an entity', function() {
            catalogManagerSvc.isBranch.and.returnValue(true);
            expect(this.controller.getType({})).toEqual('Branch');

            catalogManagerSvc.isBranch.and.returnValue(false);
            catalogManagerSvc.isTag.and.returnValue(true);
            expect(this.controller.getType({})).toEqual('Tag');

            catalogManagerSvc.isTag.and.returnValue(false);
            catalogManagerSvc.isCommit.and.returnValue(true);
            expect(this.controller.getType({})).toEqual('Commit');

            catalogManagerSvc.isCommit.and.returnValue(false);
            expect(this.controller.getType({})).toEqual('(NONE)');
        });
        describe('changeEntity calls the correct methods', function() {
            beforeEach(function() {
                utilSvc.getPropertyId.and.callFake((entity, propertyIRI) => _.get(entity, "['" + propertyIRI + "'][0]['@id']", ''));
            });
            describe('if the entity is a branch', function() {
                beforeEach(function() {
                    catalogManagerSvc.isBranch.and.returnValue(true);
                });
                describe('when getBranchHeadCommit resolves', function() {
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
                        ontologyStateSvc.getOntologyStateByRecordId.and.returnValue(ontoState);
                    });
                    it('when updateOntology resolves', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.when());
                        this.controller.changeEntity(this.branch);
                        scope.$apply();
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, true);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(scope.listItem);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    });
                    it('when updateOntology rejects', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject(this.errorMessage));
                        this.controller.changeEntity(this.branch);
                        scope.$digest()
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, true);
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    });
                });
                it('when getBranchHeadCommit rejects', function() {
                    expect(this.controller.deleteError).toBe('');
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.reject(this.errorMessage));
                    this.controller.changeEntity(this.branch);
                    scope.$digest();
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                    expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
            });
            describe('if the entity is a tag', function() {
                beforeEach(function() {
                    catalogManagerSvc.isTag.and.returnValue(true);
                });
                describe('when getCommit resolves', function() {
                    beforeEach(function() {
                        var ontoState = {
                            model: [
                                {
                                    '@id': 'state-id'
                                },
                                {
                                    '@id': 'tag-id',
                                    [prefixes.ontologyState + 'tag']: [{'@id': this.tagId}],
                                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}]
                                }
                            ]
                        };
                        catalogManagerSvc.getCommit.and.returnValue($q.when({ commit: { '@id': this.commitId } }));
                        ontologyStateSvc.getOntologyStateByRecordId.and.returnValue(ontoState);
                    });
                    it('when updateOntologyWithCommit resolves', function() {
                        ontologyStateSvc.updateOntologyWithCommit.and.returnValue($q.when());
                        this.controller.changeEntity(this.tag);
                        scope.$apply();
                        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                        expect(ontologyStateSvc.updateOntologyWithCommit).toHaveBeenCalledWith(this.recordId, this.commitId, this.tagId);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(scope.listItem);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    });
                    it('when updateOntologyWithCommit rejects', function() {
                        ontologyStateSvc.updateOntologyWithCommit.and.returnValue($q.reject(this.errorMessage));
                        this.controller.changeEntity(this.tag);
                        scope.$digest()
                        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                        expect(ontologyStateSvc.updateOntologyWithCommit).toHaveBeenCalledWith(this.recordId, this.commitId, this.tagId);
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    });
                });
                it('when getCommit rejects', function() {
                    expect(this.controller.deleteError).toBe('');
                    catalogManagerSvc.getCommit.and.returnValue($q.reject(this.errorMessage));
                    this.controller.changeEntity(this.tag);
                    scope.$digest();
                    expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                    expect(ontologyStateSvc.updateOntologyWithCommit).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
            });
            it('if the entity is a commit', function() {
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
                scope.listItem.branches = [this.branch];
                scope.$digest();
                spyOn(this.controller, 'changeEntity');
            });
            describe('when deleteOntologyBranch is resolved', function() {
                beforeEach(function() {
                    ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.when());
                    this.controller.currentStateId = 'current';
                    this.currentState = {
                        '@id': this.controller.currentStateId,
                        '@type': [prefixes.ontologyState + 'StateCommit'],
                        [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}]
                    };
                    this.controller.state = {model: [this.currentState]};
                    this.controller.listItem.masterBranchIRI = 'master';
                });
                describe('and a commit is checked out', function() {
                    it('and getCommit is resolved', function() {
                        catalogManagerSvc.getCommit.and.returnValue($q.when());
                        this.controller.delete();
                        scope.$apply();
                        expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                        expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                        expect(this.controller.changeEntity).not.toHaveBeenCalled();
                    });
                    it('and getCommit is rejected', function() {
                        catalogManagerSvc.getCommit.and.returnValue($q.reject('Error message'));
                        this.controller.delete();
                        scope.$apply();
                        expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                        expect(utilSvc.createWarningToast).toHaveBeenCalledWith(jasmine.stringMatching('Commit'));
                        expect(this.controller.changeEntity).toHaveBeenCalledWith({'@id': 'master', '@type': [prefixes.catalog + 'Branch']});
                    });
                });
                describe('and a tag is checked out', function() {
                    beforeEach(function() {
                        this.currentState['@type'].push(prefixes.ontologyState + 'StateTag');
                    });
                    it('and getCommit is resolved', function() {
                        catalogManagerSvc.getCommit.and.returnValue($q.when());
                        this.controller.delete();
                        scope.$apply();
                        expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                        expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                        expect(this.controller.changeEntity).not.toHaveBeenCalled();
                    });
                    it('and getCommit is rejected', function() {
                        catalogManagerSvc.getCommit.and.returnValue($q.reject('Error message'));
                        this.controller.delete();
                        scope.$apply();
                        expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
                        expect(utilSvc.createWarningToast).toHaveBeenCalledWith(jasmine.stringMatching('Tag'));
                        expect(this.controller.changeEntity).toHaveBeenCalledWith({'@id': 'master', '@type': [prefixes.catalog + 'Branch']});
                    });
                });
                it('and a branch is checked out', function() {
                    this.currentState['@type'].push(prefixes.ontologyState + 'StateBranch');
                    this.controller.delete();
                    scope.$apply();
                    expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                    expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.getCommit).not.toHaveBeenCalled();
                    expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                    expect(this.controller.changeEntity).not.toHaveBeenCalled();
                });
            });
            it('when deleteOntologyBranch is rejected', function() {
                ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject(this.errorMessage));
                this.controller.delete();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                expect(catalogManagerSvc.getCommit).not.toHaveBeenCalled();
                expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                expect(this.controller.changeEntity).not.toHaveBeenCalled();
            });
        });
    });
});