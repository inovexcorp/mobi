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
import { get } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import {
    mockShapesGraphManager,
    mockStateManager,
    mockUtil,
    mockPolicyEnforcement,
    mockPolicyManager
} from '../../../../../test/ts/Shared';
import {CATALOG, DCTERMS} from '../../prefixes';
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { Difference } from '../models/difference.class';
import { RdfUpload } from '../models/rdfUpload.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { CatalogManagerService } from './catalogManager.service';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { ShapesGraphStateService } from './shapesGraphState.service';
import { PolicyManagerService } from './policyManager.service';
import { OptionalJSONLD } from '../models/OptionalJSONLD.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { HttpHeaders, HttpResponse } from '@angular/common/http';


describe('Shapes Graph State service', function() {
    let service: ShapesGraphStateService;
    let shapesGraphManagerStub;
    let utilStub;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    const catalogId = 'catalog';
    let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;;
    let policyEnforcementStub;
    let branch;
    let branches;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ShapesGraphStateService,
                MockProvider(CatalogManagerService),
                MockProvider(PolicyManagerService),
                { provide: 'shapesGraphManagerService', useClass: mockShapesGraphManager },
                { provide: 'stateManagerService', useClass: mockStateManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
                { provide: ShapesGraphManagerService, useClass: mockShapesGraphManager },
            ]
        });
    });

    beforeEach(function() {
        
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
        service = TestBed.get(ShapesGraphStateService);
        shapesGraphManagerStub = TestBed.get(ShapesGraphManagerService);
        policyManagerStub = TestBed.get(PolicyManagerService);
        policyEnforcementStub = TestBed.get('policyEnforcementService');
        service.listItem = new ShapesGraphListItem();
        this.catalogId = 'catalog';
        this.branch = {
            '@id': 'branch123',
            [CATALOG + 'head']: [{'@id': 'commit123'}],
            [DCTERMS + 'title']: [{'@value': 'MASTER'}]
        };
        this.branches = [this.branch];
        utilStub = TestBed.get('utilService');
        utilStub.getDctermsValue.and.callFake((obj, prop) => {
            return get(obj, `['${DCTERMS}${prop}'][0]['@value']`, '');
        });
        catalogManagerStub.localCatalog = {'@id': this.catalogId};
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': this.catalogId, data: this.branches}]})));
        service.initialize();
    });

    afterEach(function() {
        service = null;
        utilStub = null;
        shapesGraphManagerStub = null;
        catalogManagerStub = null;
    });

    it('should reset variables', function() {
        service.listItem.versionedRdfRecord.recordId = 'test';
        service.listItem.versionedRdfRecord.title = 'test';
        service.reset();

        expect(service.listItem.versionedRdfRecord.recordId).toEqual('');
        expect(service.listItem.versionedRdfRecord.title).toEqual('');
        expect(service.listItem).toEqual(new ShapesGraphListItem());
    });
    describe('should check if the current shapes graph is committable', function() {
        it('when no shapes graph is open', function() {
            service.listItem.versionedRdfRecord.recordId = '';
            expect(service.isCommittable()).toEqual(false);
        });
        it('when a shapes graph is open with no changes', function() {
            service.listItem.versionedRdfRecord.recordId = 'test';
            expect(service.isCommittable()).toEqual(false);
        });
        it('when a shapes graph is open with changes', function() {
            service.listItem.versionedRdfRecord.recordId = 'test';
            service.listItem.inProgressCommit = new Difference();
            service.listItem.inProgressCommit.additions = [{'@id': 'testId'}];
            expect(service.isCommittable()).toEqual(true);
        });
    });
    it('should clear the in progress commit', function() {
        service.listItem.inProgressCommit = new Difference();
        service.listItem.inProgressCommit.additions = [{'@id': 'testId'}];
        service.clearInProgressCommit();
        expect(service.listItem.inProgressCommit).toEqual(new Difference());
    });
    describe('should upload shapes graph', function() {
        beforeEach(function() {
            this.createResponse = {
                recordId: 'recordId',
                branchId: 'branchId',
                commitId: 'commitId',
                title: 'title',
                shapesGraphId: 'shapesGraphId'
            } as VersionedRdfUploadResponse;
            shapesGraphManagerStub.createShapesGraphRecord.and.resolveTo(this.createResponse);
            this.file = new File([''], 'filename', { type: 'text/html' });
            this.rdfUpload = {
                title: 'Record Name',
                description: 'Some description',
                keywords: ['keyword1', 'keyword2'],
                file: this.file
            } as RdfUpload;

            this.createStateSpy = spyOn(service, 'createState');
        });
        describe('and create the record', function() {
            describe('and create the state', function() {
               describe('successfully', function() {
                   it('with a success toast', async function() {
                       await service.uploadShapesGraph(this.rdfUpload);
                       shapesGraphManagerStub.getShapesGraphMetadata.and.resolveTo('theId');
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                       expect(shapesGraphManagerStub.getShapesGraphMetadata).toHaveBeenCalledWith(this.createResponse.recordId, this.createResponse.branchId, this.createResponse.commitId, this.createResponse.shapesGraphId);
                       expect(this.createStateSpy).toHaveBeenCalledWith({
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId
                       } as VersionedRdfStateBase);

                       expect(service.listItem.shapesGraphId).toEqual(this.createResponse.shapesGraphId);
                       expect(service.listItem.masterBranchIri).toEqual(this.createResponse.branchId);
                       expect(service.listItem.versionedRdfRecord).toEqual({
                           title: this.createResponse.title,
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId,
                       });
                       expect(service.listItem.currentVersionTitle).toEqual('MASTER');
                       expect(service.list.length).toEqual(1);
                       expect(service.list).toContain(service.listItem);
                   });
                   it('without a success toast', async function() {
                       await service.uploadShapesGraph(this.rdfUpload, false);
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                       expect(this.createStateSpy).toHaveBeenCalledWith({
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId
                       } as VersionedRdfStateBase);

                       expect(service.listItem.shapesGraphId).toEqual(this.createResponse.shapesGraphId);
                       expect(service.listItem.masterBranchIri).toEqual(this.createResponse.branchId);
                       expect(service.listItem.versionedRdfRecord).toEqual({
                           title: this.createResponse.title,
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId,
                       });
                       expect(service.listItem.currentVersionTitle).toEqual('MASTER');
                       expect(service.list.length).toEqual(1);
                       expect(service.list).toContain(service.listItem);
                   });
               });
               describe('unless an error occurs', function() {
                   beforeEach(function() {
                      this.createStateSpy.and.rejectWith('Error');
                   });
                   it('with a success toast', async function() {
                       await service.uploadShapesGraph(this.rdfUpload)
                           .then(() => {
                               fail('Promise should have rejected');
                           }, response => {
                               expect(response).toEqual('Error');
                           });
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                       expect(this.createStateSpy).toHaveBeenCalledWith({
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId
                       } as VersionedRdfStateBase);

                       expect(service.listItem.shapesGraphId).toEqual(this.createResponse.shapesGraphId);
                       expect(service.listItem.masterBranchIri).toEqual(this.createResponse.branchId);
                       expect(service.listItem.versionedRdfRecord).toEqual({
                           title: this.createResponse.title,
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId,
                       });
                       expect(service.listItem.currentVersionTitle).toEqual('MASTER');
                       expect(service.list.length).toEqual(1);
                       expect(service.list).toContain(service.listItem);
                   });
                   it('without a success toast', async function() {
                       await service.uploadShapesGraph(this.rdfUpload, false)
                           .then(() => {
                               fail('Promise should have rejected');
                           }, response => {
                               expect(response).toEqual('Error');
                           });
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                       expect(this.createStateSpy).toHaveBeenCalledWith({
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId
                       } as VersionedRdfStateBase);

                       expect(service.listItem.shapesGraphId).toEqual(this.createResponse.shapesGraphId);
                       expect(service.listItem.masterBranchIri).toEqual(this.createResponse.branchId);
                       expect(service.listItem.versionedRdfRecord).toEqual({
                           title: this.createResponse.title,
                           recordId: this.createResponse.recordId,
                           branchId: this.createResponse.branchId,
                           commitId: this.createResponse.commitId
                       });
                       expect(service.listItem.currentVersionTitle).toEqual('MASTER');
                       expect(service.list.length).toEqual(1);
                       expect(service.list).toContain(service.listItem);
                   });
               });
            });
            it('unless an error occurs', async function() {
                shapesGraphManagerStub.createShapesGraphRecord.and.rejectWith('Error');
                await service.uploadShapesGraph(this.rdfUpload,)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(this.createStateSpy).not.toHaveBeenCalled();
            });
       });
    });
    describe('should open shapes graph', function() {
        beforeEach(function() {
            service.listItem = undefined;
            this.selectedRecord = {
                recordId: 'recordId',
               title: 'title'
            } as RecordSelectFiltered;
            this.catalogDetailsResponse = {
                recordId: 'recordId',
                branchId: 'branchId',
                commitId: 'commitId',
                inProgressCommit: new Difference(),
                upToDate: true
            };
            this.catalogDetailsSpy = spyOn(service, 'getCatalogDetails').and.resolveTo(this.catalogDetailsResponse);
        });
        it('when the item is already opened', async function() {
            const tempItem = new ShapesGraphListItem();
            tempItem.versionedRdfRecord.recordId = this.selectedRecord.recordId;
            service.list.push(tempItem);

            expect(service.listItem).toBeUndefined();
            await service.openShapesGraph(this.selectedRecord);
            expect(service.listItem).toEqual(tempItem);
            expect(this.catalogDetailsSpy).not.toHaveBeenCalled();
        });
        describe('when the item is not open and retrieves catalog details', function() {
            it('successfully', async function() {
                shapesGraphManagerStub.getShapesGraphIRI.and.resolveTo('theId');
                shapesGraphManagerStub.getShapesGraphMetadata.and.resolveTo([{'@id': 'theId'}]);
                const updateShapesGraphMetadataSpy = spyOn(service, 'updateShapesGraphMetadata').and.returnValue(Promise.resolve());
                await service.openShapesGraph(this.selectedRecord);
                expect(this.catalogDetailsSpy).toHaveBeenCalledWith(this.selectedRecord.recordId);
                expect(service.listItem.versionedRdfRecord).toEqual({
                    title: this.selectedRecord.title,
                    recordId: this.catalogDetailsResponse.recordId,
                    branchId: this.catalogDetailsResponse.branchId,
                    commitId: this.catalogDetailsResponse.commitId,
                    tagId: undefined
                });

                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem).toBeDefined();
                expect(service.listItem.upToDate).toBeTrue();
            });
            it('unless an error occurs', async function() {
                this.catalogDetailsSpy.and.rejectWith('Error');
                expect(service.listItem).toBeUndefined();
                await service.openShapesGraph(this.selectedRecord)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(service.listItem).toBeUndefined();
                expect(service.list.length).toEqual(0);
            });
        });
    });
    it('should close an open shapes graph', function() {
        const tempItem = new ShapesGraphListItem();
        tempItem.versionedRdfRecord.recordId = 'recordId';
        service.list.push(tempItem);
        expect(service.list.length).toEqual(1);
        expect(service.list).toContain(tempItem);
        service.closeShapesGraph('recordId');
        expect(service.list.length).toEqual(0);
        expect(service.list).not.toContain(tempItem);
    });
    describe('should update shapes graph metadata', function() {
        beforeEach(function() {
            shapesGraphManagerStub.getShapesGraphIRI.and.returnValue(Promise.resolve('theId'));
            shapesGraphManagerStub.getShapesGraphMetadata.and.returnValue(Promise.resolve([{'@id': 'theId'}]));
            shapesGraphManagerStub.getShapesGraphContent.and.returnValue(Promise.resolve('<urn:testClass> a <http://www.w3.org/2002/07/owl#Class>;'));
            policyEnforcementStub.evaluateRequest.and.returnValue(Promise.resolve('Permit'));
        });
        it('successfully', async function() {
            await service.updateShapesGraphMetadata('recordId', 'branch123', 'commitId');
            expect(service.listItem.shapesGraphId).toEqual('theId');
            expect(service.listItem.metadata['@id']).toEqual('theId');
            expect(service.listItem.masterBranchIri).toEqual('');
            expect(service.listItem.userCanModify).toEqual(true);
            expect(service.listItem.userCanModifyMaster).toEqual(true);
            expect(service.list.length).toEqual(1);
            expect(service.list).toContain(service.listItem);
        });
        it('when the user does not have permission to modify', async function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(Promise.resolve('Deny'));
            await service.updateShapesGraphMetadata('recordId', 'branch123', 'commitId');
            expect(service.listItem.shapesGraphId).toEqual('theId');
            expect(service.listItem.metadata['@id']).toEqual('theId');
            expect(service.listItem.masterBranchIri).toEqual('');
            expect(service.listItem.userCanModify).toEqual(false);
            expect(service.listItem.userCanModifyMaster).toEqual(false);
            expect(service.list.length).toEqual(1);
            expect(service.list).toContain(service.listItem);
        });
    });
    describe('should delete shapes graph', function() {
        beforeEach(function() {
           this.deleteStateSpy = spyOn(service, 'deleteState').and.resolveTo();
        });
        describe('first deleting the state', function() {
            describe('then deleting the record', function() {
                it('successfully', async function() {
                    await service.deleteShapesGraph('recordId');
                    expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
                    expect(shapesGraphManagerStub.deleteShapesGraphRecord).toHaveBeenCalledWith('recordId');
                });
                it('unless an error occurs', async function() {
                    shapesGraphManagerStub.deleteShapesGraphRecord.and.rejectWith('Error');
                    await service.deleteShapesGraph('recordId')
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual('Error');
                        });
                    expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
                    expect(shapesGraphManagerStub.deleteShapesGraphRecord).toHaveBeenCalledWith('recordId');
                });
            });
            it('unless an error occurs', async function() {
                this.deleteStateSpy.and.rejectWith('Error');
                await service.deleteShapesGraph('recordId')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
                expect(shapesGraphManagerStub.deleteShapesGraphRecord).not.toHaveBeenCalled();
            });
        });
    });
    describe('should change open shapes graph version', function() {
        beforeEach(function() {
            service.listItem.versionedRdfRecord = {
                recordId: 'recordId',
                branchId: 'branchIdDifferent',
                commitId: 'commitIdDifferent',
                title: 'recordTitle'
            };
            service.listItem.currentVersionTitle = 'currentBranchTitle';
            this.inProgressCommit = new Difference();
            this.inProgressCommit.additions.push({'change': 'change'});
            service.listItem.inProgressCommit = this.inProgressCommit;
            this.updateStateSpy = spyOn(service, 'updateState').and.resolveTo();
        });
        describe('for a branch and update state', function() {
            beforeEach(function() {
                this.stateBase = {
                    recordId: 'recordId',
                    branchId: 'branchId',
                    commitId: 'commitId',
                    tagId: undefined
                };
            });
            describe('successfully', function() {
                it('and inProgressCommit should be reset', async function() {
                    expect(service.list.length).toEqual(0);
                    await service.changeShapesGraphVersion('recordId', 'branchId', 'commitId', undefined, 'versionTitle', true);
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(service.listItem.versionedRdfRecord).toEqual({
                        recordId: 'recordId',
                        branchId: 'branchId',
                        commitId: 'commitId',
                        tagId: undefined,
                        title: 'recordTitle'
                    });
                    expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
                    expect(service.listItem.inProgressCommit).toEqual(new Difference());
                    expect(service.list.length).toEqual(1);
                });
                it('and inProgressCommit should not be reset', async function() {
                    expect(service.list.length).toEqual(0);
                    await service.changeShapesGraphVersion('recordId', 'branchId', 'commitId', undefined, 'versionTitle');
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(service.listItem.versionedRdfRecord).toEqual({
                        recordId: 'recordId',
                        branchId: 'branchId',
                        commitId: 'commitId',
                        tagId: undefined,
                        title: 'recordTitle'
                    });
                    expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
                    expect(service.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                    expect(service.list.length).toEqual(1);
                });
            });
            it('unless an error occurs', async function() {
                service.listItem = undefined;
                this.updateStateSpy.and.rejectWith('Error');
                await service.changeShapesGraphVersion('recordId', 'branchId', 'commitId', undefined, 'versionTitle')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                expect(service.listItem).toBeUndefined();
            });
        });
        describe('for a tag', function() {
            beforeEach(function() {
                this.stateBase = {
                    recordId: 'recordId',
                    branchId: undefined,
                    commitId: 'commitId',
                    tagId: 'tagId'
                };
            });
            describe('successfully', function() {
                it('and inProgressCommit should be reset', async function() {
                    expect(service.list.length).toEqual(0);
                    await service.changeShapesGraphVersion('recordId', undefined, 'commitId', 'tagId', 'versionTitle', true);
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(service.listItem.versionedRdfRecord).toEqual({
                        recordId: 'recordId',
                        branchId: undefined,
                        commitId: 'commitId',
                        tagId: 'tagId',
                        title: 'recordTitle'
                    });
                    expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
                    expect(service.listItem.inProgressCommit).toEqual(new Difference());
                    expect(service.list.length).toEqual(1);
                });
                it('and inProgressCommit should not be reset', async function() {
                    expect(service.list.length).toEqual(0);
                    await service.changeShapesGraphVersion('recordId', undefined, 'commitId', 'tagId', 'versionTitle');
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(service.listItem.versionedRdfRecord).toEqual({
                        recordId: 'recordId',
                        branchId: undefined,
                        commitId: 'commitId',
                        tagId: 'tagId',
                        title: 'recordTitle'
                    });
                    expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
                    expect(service.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                    expect(service.list.length).toEqual(1);
                });
            });
            it('unless an error occurs', async function() {
                service.listItem = undefined;
                this.updateStateSpy.and.rejectWith('Error');
                await service.changeShapesGraphVersion('recordId', undefined, 'commitId', 'tagId', 'versionTitle')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                expect(service.listItem).toBeUndefined();
            });
        });
    });
    describe('should delete shapes graph branch', function() {
        beforeEach(function() {
            this.deleteBranchStateSpy = spyOn(service, 'deleteBranchState').and.resolveTo();
            catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
        });
        describe('first deleting the branch', function() {
            describe('then deleting the branch state', function() {
                it('successfully', async function() {
                    await service.deleteShapesGraphBranch('recordId', 'branchId');
                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('branchId', 'recordId', 'catalog');
                    expect(this.deleteBranchStateSpy).toHaveBeenCalledWith('recordId', 'branchId');
                });
                it('unless an error occurs', async function() {
                    this.deleteBranchStateSpy.and.rejectWith('Error');
                    await service.deleteShapesGraphBranch('recordId', 'branchId')
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual('Error');
                        });
                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('branchId', 'recordId', 'catalog');
                    expect(this.deleteBranchStateSpy).toHaveBeenCalledWith('recordId', 'branchId');
                });
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.deleteRecordBranch.and.returnValue(throwError('Error'));
                await service.deleteShapesGraphBranch('recordId', 'branchId')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('branchId', 'recordId', 'catalog');
            });
        });
    });
    describe('should merge shapes graph branches', function() {
        beforeEach(function() {
            service.listItem.versionedRdfRecord.recordId = 'recordId';
            service.listItem.versionedRdfRecord.branchId = 'sourceBranchId';
            service.listItem.merge.target = {
                '@id': 'targetBranchId',
                '@type': [],
                [DCTERMS + 'title']: [{'@value': 'branchTitle'}]
            };
            this.changeShapesGraphVersionSpy = spyOn(service, 'changeShapesGraphVersion').and.resolveTo();
            this.deleteShapesGraphBranchSpy = spyOn(service, 'deleteShapesGraphBranch').and.resolveTo();
            catalogManagerStub.mergeBranches.and.returnValue(of('commitId'));
        });
        describe('and delete the branch if the checkbox is', function() {
            describe('checked', function() {
                beforeEach(function() {
                   service.listItem.merge.checkbox = true;
                });
                describe('and should change the shapes graph version to the target branch', function() {
                    it('successfully', async function() {
                        await service.merge();
                        expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                        expect(this.deleteShapesGraphBranchSpy).toHaveBeenCalledWith('recordId', 'sourceBranchId');
                        expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                    });
                    it('unless an error occurs', async function() {
                        this.changeShapesGraphVersionSpy.and.rejectWith('Error');
                        await service.merge()
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual('Error');
                            });
                        expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                        expect(this.deleteShapesGraphBranchSpy).toHaveBeenCalledWith('recordId', 'sourceBranchId');
                        expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                    });
                });
                it('unless an error occurs', async function() {
                    this.deleteShapesGraphBranchSpy.and.rejectWith('Error');
                    await service.merge()
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual('Error');
                        });
                    expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                    expect(this.deleteShapesGraphBranchSpy).toHaveBeenCalledWith('recordId', 'sourceBranchId');
                    expect(this.changeShapesGraphVersionSpy).not.toHaveBeenCalled();
                });
            });
            describe('unchecked', function() {
                beforeEach(function() {
                    service.listItem.merge.checkbox = false;
                });
                describe('and should change the shapes graph version to the target branch', function() {
                    it('successfully', async function() {
                        await service.merge();
                        expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                        expect(this.deleteShapesGraphBranchSpy).not.toHaveBeenCalled();
                        expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                    });
                    it('unless an error occurs', async function() {
                        this.changeShapesGraphVersionSpy.and.rejectWith('Error');
                        await service.merge()
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual('Error');
                            });
                        expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                        expect(this.deleteShapesGraphBranchSpy).not.toHaveBeenCalled();
                        expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                    });
                });
            });
        });
        it('unless an error occurs', async function() {
            catalogManagerStub.mergeBranches.and.returnValue(throwError('Error'));
            await service.merge()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
            expect(this.deleteShapesGraphBranchSpy).not.toHaveBeenCalled();
            expect(this.changeShapesGraphVersionSpy).not.toHaveBeenCalled();
        });
    });
});
