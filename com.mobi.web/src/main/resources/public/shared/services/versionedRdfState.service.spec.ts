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

import { TestBed } from '@angular/core/testing';
import { cloneDeep, get, includes, noop, set } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { mockCatalogManager, mockPrefixes, mockStateManager, mockUtil } from '../../../../../test/ts/Shared';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { State } from '../models/state.interface';
import { VersionedRdfListItem } from '../models/versionedRdfListItem.class';
import { VersionedRdfState } from './versionedRdfState.service';

class VersionedRdfStateImpl extends VersionedRdfState {
    static testPrefix = 'urn:state#';
    static appName = 'test-application'
    constructor() {
        super(VersionedRdfStateImpl.testPrefix,
            VersionedRdfStateImpl.testPrefix + 'branch-id/',
            VersionedRdfStateImpl.testPrefix + 'tag-id/',
            VersionedRdfStateImpl.testPrefix + 'commit-id/',
            VersionedRdfStateImpl.appName,
            'catalog'
        );
    }
    getId(): Promise<any> {
        return Promise.resolve();
    }
    protected merge(): Promise<any> {
        return Promise.resolve();
    }

    public setServices(stateManager: any, catalogManager: any, prefixes: any, util: any) {
        this.sm = stateManager;
        this.cm = catalogManager;
        this.prefixes = prefixes;
        this.util = util;
    }
}

describe('Versioned RDF State service', function() {
    let service: VersionedRdfStateImpl;
    let catalogManagerStub;
    let stateManagerStub;
    let prefixStub;
    let utilStub;
    const recordId = 'recordId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const tagId = 'tagId';
    const stateId = 'state-id';
    const catalogId = 'catalog';

    let branch: JSONLDObject;
    let tag: JSONLDObject;
    let version: JSONLDObject;
    let recordState: JSONLDObject;
    let versionedRdfStateModel: JSONLDObject[];
    let versionedRdfState: State;
    let commitStateModel: JSONLDObject;
    let tagStateModel: JSONLDObject;
    let inProgressCommit: Difference;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                VersionedRdfStateImpl,
                { provide: 'stateManagerService', useClass: mockStateManager },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(VersionedRdfStateImpl);
        service.listItem = new VersionedRdfListItem();

        stateManagerStub = TestBed.get('stateManagerService');
        catalogManagerStub = TestBed.get('catalogManagerService');
        prefixStub = TestBed.get('prefixes');
        utilStub = TestBed.get('utilService');
        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@id\']', '');
        });
        service.setServices(stateManagerStub, catalogManagerStub, prefixStub, utilStub);

        branch = {
            '@id': branchId,
            '@type': [prefixStub.catalog + 'branch'],
            [prefixStub.catalog + 'head']: [{'@id': commitId}],
            [prefixStub.dcterms + 'title']: [{'@value': 'MASTER'}]
        };
        tag = {
            '@id': tagId,
            '@type': [VersionedRdfStateImpl.testPrefix + 'Version', VersionedRdfStateImpl.testPrefix + 'Tag']
        };
        version = {
            '@id': 'version',
            '@type': [VersionedRdfStateImpl.testPrefix + 'Version']
        };

        recordState = {
            '@id': stateId,
            '@type': [VersionedRdfStateImpl.testPrefix + 'StateRecord'],
            [VersionedRdfStateImpl.testPrefix + 'record']: [{'@id': recordId}]
        };
        versionedRdfStateModel = [recordState];
        versionedRdfState = {id: stateId, model: versionedRdfStateModel};
        inProgressCommit = {
            additions: [{'test': 'test'}],
            deletions: [{'test': 'test'}],
            hasMoreResults: false
        };
    });

    afterEach(function() {
        service = null;
    });

    describe('createState calls the correct method with the correct state', function() {
        it('if it is for a branch', function() {
            service.createState({recordId, commitId, branchId});
            expect(stateManagerStub.createState).toHaveBeenCalledWith([
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateRecord'],
                    [VersionedRdfStateImpl.testPrefix + 'record']: [{'@id': recordId}],
                    [VersionedRdfStateImpl.testPrefix + 'branchStates']: [{'@id': jasmine.any(String)}],
                    [VersionedRdfStateImpl.testPrefix + 'currentState']: [{'@id': jasmine.any(String)}]
                },
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit', VersionedRdfStateImpl.testPrefix + 'StateBranch'],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}],
                    [VersionedRdfStateImpl.testPrefix + 'branch']: [{'@id': branchId}],
                }
            ], VersionedRdfStateImpl.appName);
        });
        it('if it is for a tag', function() {
            service.createState({recordId, commitId, tagId});
            expect(stateManagerStub.createState).toHaveBeenCalledWith([
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateRecord'],
                    [VersionedRdfStateImpl.testPrefix + 'record']: [{'@id': recordId}],
                    [VersionedRdfStateImpl.testPrefix + 'currentState']: [{'@id': jasmine.any(String)}]
                },
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit', VersionedRdfStateImpl.testPrefix + 'StateTag'],
                    [VersionedRdfStateImpl.testPrefix + 'tag']: [{'@id': tagId}],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}],
                }
            ], VersionedRdfStateImpl.appName);
        });
        it('if it is for a commit', function() {
            service.createState({recordId, commitId});
            expect(stateManagerStub.createState).toHaveBeenCalledWith([
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateRecord'],
                    [VersionedRdfStateImpl.testPrefix + 'record']: [{'@id': recordId}],
                    [VersionedRdfStateImpl.testPrefix + 'currentState']: [{'@id': jasmine.any(String)}]
                },
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit'],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}],
                }
            ], VersionedRdfStateImpl.appName);
        });
    });
    describe('getStateByRecordId', function() {
        it('when state is not present', function() {
            const result = service.getStateByRecordId(recordId);
            expect(result).toEqual(undefined);
        });
        it('when state is present', function() {
            stateManagerStub.states = [{id: stateId, model: versionedRdfStateModel}];
            const result = service.getStateByRecordId(recordId);
            expect(result).toEqual({id: stateId, model: versionedRdfStateModel});
        });
    });
    describe('updateState calls the correct method with the correct state', function() {
        beforeEach(function() {
            spyOn(service, 'getStateByRecordId').and.returnValue({
                id: stateId,
                model: versionedRdfStateModel
            });
        });
        it('if a commit was current before', function() {
            commitStateModel = {'@id': 'commitStateModel', '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit']};
            recordState[VersionedRdfStateImpl.testPrefix + 'currentState'] = [{'@id': 'commitStateModel'}];
            versionedRdfStateModel.push(commitStateModel);
            service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
            expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, {
                asymmetricMatch: actual => !includes(actual, commitStateModel)
            });
        });
        it('if a tag was current before', function() {
            tagStateModel = {'@id': 'tagStateModel', '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit', VersionedRdfStateImpl.testPrefix + 'StateTag']};
            recordState[VersionedRdfStateImpl.testPrefix + 'currentState'] = [{'@id': 'tagStateModel'}];
            versionedRdfStateModel.push(tagStateModel);
            service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
            expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, {
                asymmetricMatch: actual => !includes(actual, tagStateModel)
            });
        });
        it('if just the commit is provided', function() {
            service.updateState({recordId: recordId, commitId: commitId});
            expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
                set(recordState, "['" + VersionedRdfStateImpl.testPrefix + "currentState']", [{'@id': jasmine.any(String)}]),
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit'],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}],
                }
            ]);
        });
        it('if a tag is in the update', function() {
            service.updateState({recordId: recordId, commitId: commitId, tagId: tagId});
            expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
                set(recordState, "['" + VersionedRdfStateImpl.testPrefix + "currentState']", [{'@id': jasmine.any(String)}]),
                {
                    '@id': jasmine.any(String),
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit', VersionedRdfStateImpl.testPrefix + 'StateTag'],
                    [VersionedRdfStateImpl.testPrefix + 'tag']: [{'@id': tagId}],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}],
                }
            ]);
        });
        describe('if a branch is in the update', function() {
            it('and the branch was opened before', function() {
                recordState[VersionedRdfStateImpl.testPrefix + 'branchStates'] = [{'@id': 'branchState'}];
                recordState[VersionedRdfStateImpl.testPrefix + 'currentState'] = [{'@id': 'branchState'}];
                versionedRdfStateModel.push({
                    '@id': 'branchState',
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateBranch', VersionedRdfStateImpl.testPrefix + 'StateCommit'],
                    [VersionedRdfStateImpl.testPrefix + 'branch']: [{'@id': branchId}],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}],
                });
                service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
                expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
                    recordState,
                    {
                        '@id': 'branchState',
                        '@type': [VersionedRdfStateImpl.testPrefix + 'StateBranch', VersionedRdfStateImpl.testPrefix + 'StateCommit'],
                        [VersionedRdfStateImpl.testPrefix + 'branch']: [{'@id': branchId}],
                        [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': 'newCommit'}],
                    }
                ]);
            });
            it('and the branch had not been opened before', function() {
                service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
                expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
                    set(set(recordState, "['" + VersionedRdfStateImpl.testPrefix + "branchStates']", [{'@id': jasmine.any(String)}]), "['" + VersionedRdfStateImpl.testPrefix + "currentState']", [{'@id': jasmine.any(String)}]),
                    {
                        '@id': jasmine.any(String),
                        '@type': [VersionedRdfStateImpl.testPrefix + 'StateCommit', VersionedRdfStateImpl.testPrefix + 'StateBranch'],
                        [VersionedRdfStateImpl.testPrefix + 'branch']: [{'@id': branchId}],
                        [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': 'newCommit'}]
                    }
                ]);
            });
        });
    });
    it('deleteState calls the correct method', function() {
        spyOn(service, 'getStateByRecordId').and.returnValue({
            id: stateId,
            model: versionedRdfStateModel
        });
        service.deleteState(recordId);
        expect(stateManagerStub.deleteState).toHaveBeenCalledWith(stateId);
    });
    it('deleteBranchState calls the correct method', function() {
        const tempState = cloneDeep(versionedRdfStateModel);
        recordState[VersionedRdfStateImpl.testPrefix + 'branchStates'] = [{'@id': 'branchState'}];
        versionedRdfStateModel.push({'@id': 'branchState', [VersionedRdfStateImpl.testPrefix + 'branch']: [{'@id': branchId}]} as JSONLDObject);
        spyOn(service, 'getStateByRecordId').and.returnValue({
            id: stateId,
            model: versionedRdfStateModel
        });
        service.deleteBranchState(recordId, branchId);
        expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, tempState);
    });
    it('getCurrentStateIdByRecordId calls the correct methods', function() {
        const baseState: State = {'id': 'state-id', model: [{'@id': 'id', '@type':[]}]}
        spyOn(service, 'getStateByRecordId').and.returnValue(baseState);
        spyOn(service, 'getCurrentStateId').and.returnValue('id');
        expect(service.getCurrentStateIdByRecordId('record')).toEqual('id');
        expect(service.getStateByRecordId).toHaveBeenCalledWith('record');
        expect(service.getCurrentStateId).toHaveBeenCalledWith(baseState);
    });
    it('getCurrentStateByRecordId calls the correct methods', function() {
        const baseState: State = {'id': 'state-id', model: [{'@id': 'id', '@type':[]}]}
        spyOn(service, 'getStateByRecordId').and.returnValue(baseState);
        spyOn(service, 'getCurrentStateId').and.returnValue('id');
        expect(service.getCurrentStateByRecordId('record')).toEqual(baseState.model[0]);
        expect(service.getStateByRecordId).toHaveBeenCalledWith('record');
        expect(service.getCurrentStateId).toHaveBeenCalledWith(baseState);
    });
    it('getCurrentState calls the correct methods', function() {
        const baseState: State = {'id': 'state-id', model: [{'@id': 'id', '@type':[]}]}
        spyOn(service, 'getCurrentStateId').and.returnValue('id');
        expect(service.getCurrentState(baseState)).toEqual(baseState.model[0]);
    });
    it('isStateTag determines if an object is a StateTag', function() {
        const obj: JSONLDObject = {
            '@id': 'id',
            '@type': []
        };
        expect(service.isStateTag(obj)).toEqual(false);
        obj['@type'] = ['Test'];
        expect(service.isStateTag(obj)).toEqual(false);
        obj['@type'].push(VersionedRdfStateImpl.testPrefix + 'StateTag');
        expect(service.isStateTag(obj)).toEqual(true);
    });
    it('isStateBranch determines if an object is a StateBranch', function() {
        const obj: JSONLDObject = {
            '@id': 'id',
            '@type': []
        };
        expect(service.isStateBranch(obj)).toEqual(false);
        obj['@type'] = ['Test'];
        expect(service.isStateBranch(obj)).toEqual(false);
        obj['@type'].push(VersionedRdfStateImpl.testPrefix + 'StateBranch');
        expect(service.isStateBranch(obj)).toEqual(true);
    });
    describe('getCatalogDetails calls the correct methods', function() {
        beforeEach(function() {
            utilStub.condenseCommitId.and.returnValue(commitId);
            this.expected = {
                recordId: recordId,
                branchId: branchId,
                commitId: commitId,
                tagId: '',
                upToDate: true,
                inProgressCommit: inProgressCommit
            };
            this.expected2 = {
                recordId: recordId,
                branchId: branchId,
                commitId: commitId,
                tagId: '',
                upToDate: true,
                inProgressCommit: new Difference()
            };
            this.error = 'error';
            this.getLatestMasterSpy = spyOn(service, 'getLatestMaster');
        });
        describe('if state exists', function() {
            beforeEach(function() {
                recordState = {
                    '@id': 'id',
                    '@type': [VersionedRdfStateImpl.testPrefix + 'StateRecord'],
                    [VersionedRdfStateImpl.testPrefix + 'record']: [{'@id': recordId}],
                    [VersionedRdfStateImpl.testPrefix + 'currentState']: [{'@id': 'state-id'}],
                };
                commitStateModel = {
                    '@id': 'state-id',
                    '@type': [],
                    [VersionedRdfStateImpl.testPrefix + 'commit']: [{'@id': commitId}]
                };
                versionedRdfStateModel = [
                    recordState,
                    commitStateModel
                ];
                versionedRdfState = {id: stateId, model: versionedRdfStateModel};
                spyOn(service, 'getStateByRecordId').and.returnValue(versionedRdfState);
                this.deleteStateSpy = spyOn(service, 'deleteState');
                utilStub.getPropertyId.and.callFake((entity, propertyIRI) => get(entity, "[" + propertyIRI + "][0]['@id']", ''))
            });
            describe('and a branch was last checked out', function() {
                beforeEach(function() {
                    recordState[VersionedRdfStateImpl.testPrefix + 'branchStates'] = [{'@id': 'state-id'}];
                    commitStateModel[VersionedRdfStateImpl.testPrefix + 'branch'] = [{'@id': branchId}];
                });
                describe('and getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(Promise.resolve(branch));
                    });
                    describe('and getInProgressCommit is resolved', function() {
                        beforeEach(function() {
                            catalogManagerStub.getInProgressCommit.and.returnValue(Promise.resolve(inProgressCommit));
                        });
                        it('and getCommit is resolved', async function() {
                            catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                            await service.getCatalogDetails(recordId)
                                .then(response => {
                                    expect(response).toEqual(this.expected);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                            expect(this.deleteStateSpy).not.toHaveBeenCalled();
                            expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                        });
                        describe('and getCommit is rejected', function() {
                            beforeEach(function() {
                                catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                            });
                            describe('and deleteState is resolved', function() {
                                beforeEach(function() {
                                    this.deleteStateSpy.and.returnValue(Promise.resolve());
                                });
                                it('and getLatestMaster is resolved', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                    await service.getCatalogDetails(recordId)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                });
                                it('and getLatestMaster is rejected', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                });
                            });
                            it('and deleteState is rejected', async function() {
                                this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                            });
                        });
                    });
                    describe('and getInProgressCommit is rejected', function() {
                        describe('with a 404', function() {
                            beforeEach(function() {
                                catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 404}));
                            });
                            it('and getCommit is resolved', async function() {
                                catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                                await service.getCatalogDetails(recordId)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).not.toHaveBeenCalled();
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                            });
                            describe('and getCommit is rejected', function() {
                                beforeEach(function() {
                                    catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                                });
                                describe('and deleteState is resolved', function() {
                                    beforeEach(function() {
                                        this.deleteStateSpy.and.returnValue(Promise.resolve());
                                    });
                                    it('and getLatestMaster is resolved', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                        await service.getCatalogDetails(recordId)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                        expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                    });
                                    it('and getLatestMaster is rejected', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                        await service.getCatalogDetails(recordId).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                        expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                    });
                                });
                                it('and deleteState is rejected', async function() {
                                    this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                });
                            });
                        });
                        describe('without a 404', function() {
                            beforeEach(function() {
                                catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 400}));
                            });
                            describe('and deleteState is resolved', function() {
                                beforeEach(function() {
                                    this.deleteStateSpy.and.returnValue(Promise.resolve());
                                });
                                it('and getLatestMaster is resolved', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                    await service.getCatalogDetails(recordId)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                                it('and getLatestMaster is rejected', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                            });
                            it('and deleteState is rejected', async function() {
                                this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
                describe('and getRecordBranch is rejected', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(Promise.reject(this.error));
                    });
                    describe('and deleteState is resolved', function() {
                        beforeEach(function() {
                            this.deleteStateSpy.and.returnValue(Promise.resolve());
                        });
                        it('and getLatestMaster is resolved', async function() {
                            this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                            await service.getCatalogDetails(recordId)
                                .then(response => {
                                    expect(response).toEqual(this.expected2);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                            expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                            expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                        });
                        it('and getLatestMaster is rejected', async function() {
                            this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                            await service.getCatalogDetails(recordId).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                            expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                            expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            expect(utilStub.createWarningToast).toHaveBeenCalledWith('Branch ' + branchId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                            expect(utilStub.createWarningToast).not.toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                        });
                    });
                    it('and deleteState is rejected', async function() {
                        this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                        await service.getCatalogDetails(recordId).then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.error);
                        });
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    });
                });
            });
            describe('and a tag was last checked out', function() {
                beforeEach(function() {
                    commitStateModel[VersionedRdfStateImpl.testPrefix + 'tag'] = [{'@id': tagId}];
                    this.expected.branchId = '';
                    this.expected2.branchId = '';
                    this.expected.tagId = tagId;
                    this.expected2.tagId = tagId;
                });
                describe('and getRecordVersion is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordVersion.and.returnValue(Promise.resolve(tag));
                    });
                    describe('and getInProgressCommit is resolved', function() {
                        beforeEach(function() {
                            catalogManagerStub.getInProgressCommit.and.returnValue(Promise.resolve(inProgressCommit));
                        });
                        it('and getCommit is resolved', async function() {
                            catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                            await service.getCatalogDetails(recordId)
                                .then(response => {
                                    expect(response).toEqual(this.expected);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                            expect(this.deleteStateSpy).not.toHaveBeenCalled();
                            expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                        });
                        describe('and getCommit is rejected', function() {
                            beforeEach(function() {
                                catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                            });
                            describe('and deleteState is resolved', function() {
                                beforeEach(function() {
                                    this.deleteStateSpy.and.returnValue(Promise.resolve());
                                });
                                it('and getLatestMaster is resolved', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                    await service.getCatalogDetails(recordId)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                                it('and getLatestMaster is rejected', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                            });
                            it('and deleteState is rejected', async function() {
                                this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                            });
                        });
                    });
                    describe('and getInProgressCommit is rejected', function() {
                        describe('with a 404', function() {
                            beforeEach(function() {
                                catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 404}));
                            });
                            it('and getCommit is resolved', async function() {
                                catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                                await service.getCatalogDetails(recordId)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).not.toHaveBeenCalled();
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                            });
                            describe('and getCommit is rejected', function() {
                                beforeEach(function() {
                                    catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                                });
                                describe('and deleteState is resolved', function() {
                                    beforeEach(function() {
                                        this.deleteStateSpy.and.returnValue(Promise.resolve());
                                    });
                                    it('and getLatestMaster is resolved', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                        await service.getCatalogDetails(recordId)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                    });
                                    it('and getLatestMaster is rejected', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                        await service.getCatalogDetails(recordId).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                    });
                                });
                                it('and deleteState is rejected', async function() {
                                    this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                });
                            });
                        });
                        describe('without a 404', function() {
                            beforeEach(function() {
                                catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 400}));
                            });
                            describe('and deleteState is resolved', function() {
                                beforeEach(function() {
                                    this.deleteStateSpy.and.returnValue(Promise.resolve());
                                });
                                it('and getLatestMaster is resolved', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                    await service.getCatalogDetails(recordId)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                                it('and getLatestMaster is rejected', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                            });
                            it('and deleteState is rejected', async function() {
                                this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
                describe('and getRecordVersion is rejected', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordVersion.and.returnValue(Promise.reject(this.error));
                    });
                    describe('and updateState is resolved', function() {
                        beforeEach(function() {
                            spyOn(service, 'updateState').and.returnValue(Promise.resolve());
                        });
                        describe('and getInProgressCommit is resolved', function() {
                            beforeEach(function() {
                                catalogManagerStub.getInProgressCommit.and.returnValue(Promise.resolve(inProgressCommit));
                            });
                            it('and getCommit is resolved', async function() {
                                catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                                await service.getCatalogDetails(recordId)
                                    .then(response => {
                                        expect(response).toEqual(this.expected);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).not.toHaveBeenCalled();
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                expect(utilStub.createWarningToast).toHaveBeenCalledWith('Tag ' + tagId + ' does not exist. Opening commit ' + commitId, {timeout: 5000});
                                expect(utilStub.createWarningToast).not.toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                            });
                            describe('and getCommit is rejected', function() {
                                beforeEach(function() {
                                    catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                                });
                                describe('and deleteState is resolved', function() {
                                    beforeEach(function() {
                                        this.deleteStateSpy.and.returnValue(Promise.resolve());
                                    });
                                    it('and getLatestMaster is resolved', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                        await service.getCatalogDetails(recordId)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                        expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                    });
                                    it('and getLatestMaster is rejected', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                        await service.getCatalogDetails(recordId).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                        expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                    });
                                });
                                it('and deleteState is rejected', async function() {
                                    this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Commit ' + commitId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                                });
                            });
                        });
                        describe('and getInProgressCommit is rejected', function() {
                            describe('with a 404', function() {
                                beforeEach(function() {
                                    catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 404}));
                                });
                                it('and getCommit is resolved', async function() {
                                    catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                                    await service.getCatalogDetails(recordId)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).not.toHaveBeenCalled();
                                    expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                });
                                describe('and getCommit is rejected', function() {
                                    beforeEach(function() {
                                        catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                                    });
                                    describe('and deleteState is resolved', function() {
                                        beforeEach(function() {
                                            this.deleteStateSpy.and.returnValue(Promise.resolve());
                                        });
                                        it('and getLatestMaster is resolved', async function() {
                                            this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                            await service.getCatalogDetails(recordId)
                                                .then(response => {
                                                    expect(response).toEqual(this.expected2);
                                                }, () => {
                                                    fail('Promise should have resolved');
                                                });
                                            expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                            expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                            expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                        });
                                        it('and getLatestMaster is rejected', async function() {
                                            this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                            await service.getCatalogDetails(recordId).then(() => {
                                                fail('Promise should have rejected');
                                            }, response => {
                                                expect(response).toEqual(this.error);
                                            });
                                            expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                            expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                            expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                        });
                                    });
                                    it('and deleteState is rejected', async function() {
                                        this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                        await service.getCatalogDetails(recordId).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                    });
                                });
                            });
                            describe('without a 404', function() {
                                beforeEach(function() {
                                    catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 400}));
                                });
                                describe('and deleteState is resolved', function() {
                                    beforeEach(function() {
                                        this.deleteStateSpy.and.returnValue(Promise.resolve());
                                    });
                                    it('and getLatestMaster is resolved', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                        await service.getCatalogDetails(recordId)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                    });
                                    it('and getLatestMaster is rejected', async function() {
                                        this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                        await service.getCatalogDetails(recordId).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                        expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                                        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                    });
                                });
                                it('and deleteState is rejected', async function() {
                                    this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                    expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                                });
                            });
                        });
                    });
                    describe('and updateState is rejected', function() {
                        beforeEach(function() {
                            spyOn(service, 'updateState').and.returnValue(Promise.reject());
                        });
                        describe('and deleteState is resolved', function() {
                            beforeEach(function() {
                                this.deleteStateSpy.and.returnValue(Promise.resolve());
                            });
                            it('and getLatestMaster is resolved', async function() {
                                this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                await service.getCatalogDetails(recordId)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();

                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            });
                            it('and getLatestMaster is rejected', async function() {
                                this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                                expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                                expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();

                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            });
                        });
                        it('and deleteState is rejected', async function() {
                            this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                            await service.getCatalogDetails(recordId).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                            expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                            expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();

                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                        });
                    });
                });
            });
            describe('and a commit was last checked out', function() {
                beforeEach(function() {
                    this.expected.branchId = '';
                    this.expected2.branchId = '';
                });
                describe('and getInProgressCommit is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.getInProgressCommit.and.returnValue(Promise.resolve(inProgressCommit));
                    });
                    it('and getCommit is resolved', async function() {
                        catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                        await service.getCatalogDetails(recordId)
                            .then(response => {
                                expect(response).toEqual(this.expected);
                            }, () => {
                                fail('Promise should have resolved');
                            });
                        expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(this.deleteStateSpy).not.toHaveBeenCalled();
                        expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                    });
                    describe('and getCommit is rejected', function() {
                        beforeEach(function() {
                            catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                        });
                        describe('and deleteState is resolved', function() {
                            beforeEach(function() {
                                this.deleteStateSpy.and.returnValue(Promise.resolve());
                            });
                            it('and getLatestMaster is resolved', async function() {
                                this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                await service.getCatalogDetails(recordId)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalledWith();
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            });
                            it('and getLatestMaster is rejected', async function() {
                                this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            });
                        });
                        it('and deleteState is rejected', async function() {
                            this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                            await service.getCatalogDetails(recordId).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                            expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                        });
                    });
                });
                describe('and getInProgressCommit is rejected', function() {
                    describe('with a 404', function() {
                        beforeEach(function() {
                            catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 404}));
                        });
                        it('and getCommit is resolved', async function() {
                            catalogManagerStub.getCommit.and.returnValue(Promise.resolve(commitId));
                            await service.getCatalogDetails(recordId)
                                .then(response => {
                                    expect(response).toEqual(this.expected2);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalledWith();
                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                            expect(this.deleteStateSpy).not.toHaveBeenCalled();
                            expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                        });
                        describe('and getCommit is rejected', function() {
                            beforeEach(function() {
                                catalogManagerStub.getCommit.and.returnValue(Promise.reject(this.error));
                            });
                            describe('and deleteState is resolved', function() {
                                beforeEach(function() {
                                    this.deleteStateSpy.and.returnValue(Promise.resolve());
                                });
                                it('and getLatestMaster is resolved', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                    await service.getCatalogDetails(recordId)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                                it('and getLatestMaster is rejected', async function() {
                                    this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                    await service.getCatalogDetails(recordId).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                                });
                            });
                            it('and deleteState is rejected', async function() {
                                this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                            });
                        });
                    });
                    describe('without a 404', function() {
                        beforeEach(function() {
                            catalogManagerStub.getInProgressCommit.and.returnValue(Promise.reject({status: 400}));
                        });
                        describe('and deleteState is resolved', function() {
                            beforeEach(function() {
                                this.deleteStateSpy.and.returnValue(Promise.resolve());
                            });
                            it('and getLatestMaster is resolved', async function() {
                                this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                                await service.getCatalogDetails(recordId)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            });
                            it('and getLatestMaster is rejected', async function() {
                                this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                                await service.getCatalogDetails(recordId).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                            });
                        });
                        it('and deleteState is rejected', async function() {
                            this.deleteStateSpy.and.returnValue(Promise.reject(this.error));
                            await service.getCatalogDetails(recordId).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                            expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                            expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                        });
                    });
                });
            });
        });
        describe('if state does not exist', function() {
            it('and getLatestMaster is resolved', async function() {
                this.getLatestMasterSpy.and.returnValue(Promise.resolve(this.expected2));
                await service.getCatalogDetails(recordId)
                    .then(response => {
                        expect(response).toEqual(this.expected2);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
            });
            it('and getLatestMaster is rejected', async function() {
                this.getLatestMasterSpy.and.returnValue(Promise.reject(this.error));
                await service.getCatalogDetails(recordId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
            });
        });
    });
    describe('getLatestMaster calls the correct methods', function() {
        beforeEach(function() {
            this.createStateSpy = spyOn(service, 'createState');
        });
        describe('if getRecordMasterBranch is resolved', function() {
            beforeEach(function() {
                catalogManagerStub.getRecordMasterBranch.and.returnValue(Promise.resolve(branch));
            });
            it('and createState is resolved', async function() {
                this.createStateSpy.and.returnValue(Promise.resolve());
                const expected = {
                    recordId: recordId,
                    branchId: branchId,
                    commitId: commitId,
                    upToDate: true,
                    inProgressCommit: new Difference(),
                };
                await service.getLatestMaster(recordId)
                    .then(response => {
                        expect(response).toEqual(expected);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                expect(service.createState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId, branchId: branchId});
            });
            it('and createState is rejected', async function() {
                this.createStateSpy.and.returnValue(Promise.reject(this.error));
                await service.getLatestMaster(recordId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                expect(service.createState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId, branchId: branchId});
            });
        });
        it('if getRecordMasterBranch is rejected', async function() {
            catalogManagerStub.getRecordMasterBranch.and.returnValue(Promise.reject(this.error));
            await service.getLatestMaster(recordId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
            expect(service.createState).not.toHaveBeenCalled();
        });
    });
    describe('getMergeDifferences sets fields listItem.merge when getDifference', function() {
        it('resolves', async function() {
            service.listItem.merge = {
                active: false,
                target: undefined,
                checkbox: false,
                difference: undefined,
                conflicts: [],
                resolutions: new Difference(),
                startIndex: 0
            };
            service.listItem.merge.difference = new Difference();
            var data = {
                additions: [{'@id': 'iri1'}],
                deletions: [{'@id': 'iri2'}]
            };
            this.headers = {'has-more-results': 'true'};
            catalogManagerStub.getDifference.and.returnValue(Promise.resolve({data, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
            await service.getMergeDifferences('sourceId', 'targetId', 100, 0);
            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceId', 'targetId', 100, 0);
            expect(service.listItem.merge.difference.additions).toEqual(data.additions);
            expect(service.listItem.merge.difference.deletions).toEqual(data.deletions);
            expect(service.listItem.merge.difference.hasMoreResults).toBeTruthy();
        });
        it('rejects', async function() {
            service.listItem.merge = {
                active: false,
                target: undefined,
                checkbox: false,
                difference: undefined,
                conflicts: [],
                resolutions: new Difference(),
                startIndex: 0
            };
            catalogManagerStub.getDifference.and.returnValue(Promise.reject('Error'));
            await service.getMergeDifferences('sourceId', 'targetId', 100, 0).then(noop, error => {
                expect(error).toEqual('Error');
            });
            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceId', 'targetId', 100, 0);
        });
    });
    describe('attemptMerge should return correctly if checkConflicts', function() {
        beforeEach(function() {
            this.checkConflictsSpy = spyOn(service, 'checkConflicts').and.returnValue(Promise.resolve());
            this.mergeSpy = spyOn<any>(service, 'merge').and.returnValue(Promise.resolve());
        });
        describe('resolves and merge', function() {
            it('resolves', async function() {
                await service.attemptMerge()
                    .then(noop, () => {
                        fail('Promise should have resolved');
                    });
                expect(service.checkConflicts).toHaveBeenCalled();
                expect(this.mergeSpy).toHaveBeenCalled();
            });
            it('rejects', async function() {
                this.mergeSpy.and.returnValue(Promise.reject('Error'));
                await service.attemptMerge()
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(service.checkConflicts).toHaveBeenCalled();
                expect(this.mergeSpy).toHaveBeenCalled();
            });
        });
        it('rejects', async function() {
            this.checkConflictsSpy.and.returnValue(Promise.reject('Error'));
            await service.attemptMerge()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            expect(this.checkConflictsSpy).toHaveBeenCalled();
        });
    });
    describe('checkConflicts correctly returns and set variables correctly if getBranchConflicts', function() {
        beforeEach(function() {
            service.listItem.versionedRdfRecord.recordId = recordId;
            service.listItem.versionedRdfRecord.branchId = branchId;
            service.listItem.merge = {
                active: false,
                target: {'@id': branchId, '@type': []},
                checkbox: false,
                difference: undefined,
                conflicts: [],
                resolutions: new Difference(),
                startIndex: 0
            };
        });
        describe('resolves with', function() {
            it('an empty array', async function() {
                await service.checkConflicts()
                    .then(noop, () => {
                        fail('Promise should have resolved');
                    });
                expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId);
                expect(service.listItem.merge.conflicts).toEqual([]);
            });
            it('conflicts', async function() {
                catalogManagerStub.getBranchConflicts.and.returnValue(Promise.resolve([{}]));
                await service.checkConflicts()
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toBeUndefined();
                    });
                expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId);
                expect(service.listItem.merge.conflicts[0].resolved).toBeFalse();
            });
        });
        it('rejects', async function() {
            catalogManagerStub.getBranchConflicts.and.returnValue(Promise.reject('Error'));
            await service.checkConflicts()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId);
            expect(service.listItem.merge.conflicts).toEqual([]);
        });
    });
    it('cancelMerge should set the appropriate variables to reset a merge', function() {
        service.listItem.merge = {
            active: true,
            target: {'@id': this.branchId, '@type': []},
            checkbox: true,
            difference: {},
            conflicts: [{
                iri: 'iri',
                left: new Difference(),
                right: new Difference(),
                resolved: ''
            }],
            resolutions: new Difference(),
            startIndex: 100
        };
        service.listItem.merge.resolutions.additions.push({});
        service.listItem.merge.resolutions.deletions.push({});
        service.cancelMerge();
        expect(service.listItem.merge).toEqual({
            active: false,
            target: undefined,
            checkbox: false,
            difference: undefined,
            conflicts: [],
            resolutions: new Difference(),
            startIndex: 0
        });
    });
    describe('getListItemByRecordId should return the correct object', function() {
        beforeEach(function() {
            this.item = new VersionedRdfListItem();
            this.item.versionedRdfRecord.recordId = recordId;
            service.list = [this.item];
        });
        it('when the ontologyId is in the list', function() {
            expect(service.getListItemByRecordId(recordId)).toEqual(this.item);
        });
        it('when the ontologyId is not in the list', function() {
            expect(service.getListItemByRecordId('other')).toEqual(undefined);
        });
    });
});
