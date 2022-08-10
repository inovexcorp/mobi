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
    mockCatalogManager,
    mockUtil,
    mockPrefixes
} from '../../../../../../test/js/Shared';

describe('Ontology Tab component', function() {
    var $compile, scope, $q, ontologyStateSvc, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'seeHistory');
        mockComponent('ontology-editor', 'mergeTab');
        mockComponent('ontology-editor', 'projectTab');
        mockComponent('ontology-editor', 'overviewTab');
        mockComponent('ontology-editor', 'classesTab');
        mockComponent('ontology-editor', 'propertiesTab');
        mockComponent('ontology-editor', 'individualsTab');
        mockComponent('ontology-editor', 'conceptSchemesTab');
        mockComponent('ontology-editor', 'conceptsTab');
        mockComponent('ontology-editor', 'searchTab');
        mockComponent('ontology-editor', 'savedChangesTab');
        mockComponent('ontology-editor', 'commitsTab');
        mockComponent('ontology-editor', 'ontologyButtonStack');
        mockComponent('ontology-editor', 'openEntitySnackbar');
        mockComponent('ontology-editor', 'visualizationTab');
        mockOntologyState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _catalogManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.branchId = 'masterId';
        this.branch = {
            '@id': this.branchId,
            [prefixes.dcterms]: [{
                '@value': 'MASTER'
            }]
        };
        ontologyStateSvc.listItem.branches = [this.branch];
        this.commitId = 'commitId';
        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
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
        this.errorMessage = 'error';

        catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({ commit: { '@id': this.commitId } }));
        ontologyStateSvc.getOntologyStateByRecordId.and.returnValue(ontoState);
        utilSvc.getDctermsValue.and.returnValue('MASTER');
        utilSvc.getPropertyId.and.returnValue(this.commitId);

        this.element = $compile(angular.element('<ontology-tab></ontology-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize calling the correct methods', function() {
        beforeEach(function() {
            ontologyStateSvc.updateOntology.calls.reset();
            ontologyStateSvc.resetStateTabs.calls.reset();
        });
        describe('when the ontology is open on a branch', function() {
            describe('and the branch does not exist', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.versionedRdfRecord.branchId = 'not found';
                });
                describe('and getBranchHeadCommit is resolved', function() {
                    it('and updateOntology is resolved', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.when());
                        this.controller.$onInit();
                        scope.$apply();
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId,ontologyStateSvc.listItem.versionedRdfRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.versionedRdfRecord.recordId,
                            this.branchId, this.commitId, true);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                    });
                    it('and updateOntology does not resolve', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject(this.errorMessage));
                        this.controller.$onInit();
                        scope.$apply();
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    });
                });
                it('and getBranchHeadCommit does not resolve', function() {
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.reject(this.errorMessage));
                    this.controller.$onInit();
                        scope.$apply();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
            });
            it('and the branch exists', function() {
                ontologyStateSvc.listItem.versionedRdfRecord.branchId = this.branchId;
                this.controller.$onInit();
                        scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
            });
        });
        it('when the ontology is not open on a branch', function() {
            this.controller.$onInit();
            scope.$apply();
            expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
            expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
            expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        // beforeEach(function() {
        //     scope.$digest();
        // });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ONTOLOGY-TAB');
            expect(this.element.querySelectorAll('.ontology-tab').length).toEqual(1);
        });
        it('with a material-tabset', function() {
            expect(this.element.find('material-tabset').length).toEqual(1);
        });
        it('with material-tabs', function() {
            expect(this.element.find('material-tab').length).toEqual(11);
        });
        ['material-tabset', 'ontology-button-stack', 'project-tab', 'overview-tab', 'classes-tab', 'properties-tab', 'individuals-tab', 'concepts-tab', 'concept-schemes-tab', 'search-tab', 'saved-changes-tab', 'commits-tab'].forEach(tag => {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toEqual(1);
            });
        });
        it('if branches are being merged', function() {
            expect(this.element.find('merge-tab').length).toEqual(0);

            ontologyStateSvc.listItem.merge.active = true;
            scope.$digest();
            expect(this.element.find('material-tabset').length).toEqual(0);
            expect(this.element.find('ontology-button-stack').length).toEqual(0);
            expect(this.element.find('merge-tab').length).toEqual(1);
        });
        it('if a new entity was created', function() {
            expect(this.element.find('open-entity-snackbar').length).toEqual(0);
            ontologyStateSvc.listItem.goTo.active = true;
            scope.$digest();

            expect(this.element.find('open-entity-snackbar').length).toEqual(1);
        });
    });
});
