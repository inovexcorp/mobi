/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { MockProvider } from 'ng-mocks';
import { Subject, of, throwError } from 'rxjs';
import { map as rxjsMap, tap } from 'rxjs/operators';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';

import {
    cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { CATALOG, DCTERMS } from '../../prefixes';
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { Difference } from '../models/difference.class';
import { RdfUpload } from '../models/rdfUpload.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { CatalogManagerService } from './catalogManager.service';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { PolicyManagerService } from './policyManager.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { StateManagerService } from './stateManager.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { ToastService } from './toast.service';
import { ShapesGraphStateService } from './shapesGraphState.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';

describe('Shapes Graph State service', function() {
    let service: ShapesGraphStateService;
    let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestManagerServiceStub: jasmine.SpyObj<MergeRequestManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let _catalogManagerActionSubject: Subject<EventWithPayload>;
    let _mergeRequestManagerActionSubject: Subject<EventWithPayload>;

    const catalogId = 'catalog';
    const branch = {
        '@id': 'branch123',
        [`${CATALOG}head`]: [{'@id': 'commit123'}],
        [`${DCTERMS}title`]: [{'@value': 'MASTER'}]
    };
    const branches = [branch];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ShapesGraphStateService,
                MockProvider(CatalogManagerService),
                MockProvider(PolicyManagerService),
                MockProvider(StateManagerService),
                MockProvider(ShapesGraphManagerService),
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
                MockProvider(MergeRequestManagerService),
            ]
        });
        shapesGraphManagerStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
        mergeRequestManagerServiceStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': catalogId, data: branches}]})));
        catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': 'urn:tag'}]})));
        
        _catalogManagerActionSubject = new Subject<EventWithPayload>();
        _mergeRequestManagerActionSubject = new Subject<EventWithPayload>();
        catalogManagerStub.catalogManagerAction$ = _catalogManagerActionSubject.asObservable();
        mergeRequestManagerServiceStub.mergeRequestAction$ = _mergeRequestManagerActionSubject.asObservable();

        service = TestBed.inject(ShapesGraphStateService);
        service.listItem = new ShapesGraphListItem();
        service.initialize();
    });
    
    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        toastStub = null;
        shapesGraphManagerStub = null;
        catalogManagerStub = null;
        policyEnforcementStub = null;
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
            shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(of(this.createResponse));
            this.file = new File([''], 'filename', { type: 'text/html' });
            this.rdfUpload = {
                title: 'Record Name',
                description: 'Some description',
                keywords: ['keyword1', 'keyword2'],
                file: this.file
            } as RdfUpload;

            this.createStateSpy = spyOn(service, 'createState').and.returnValue(of(null));
            shapesGraphManagerStub.getShapesGraphMetadata.and.returnValue(of('theId'));
            shapesGraphManagerStub.getShapesGraphContent.and.returnValue(of('content'));
        });
        describe('and create the record', function() {
            describe('and create the state', function() {
               describe('successfully', function() {
                   it('with a success toast', async function() {
                       await service.uploadShapesGraph(this.rdfUpload)
                          .subscribe(() => {}, () => fail('Observable should have succeeded'));
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
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
                       await service.uploadShapesGraph(this.rdfUpload, false)
                          .subscribe(() => {}, () => fail('Observable should have succeeded'));
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
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
                      this.createStateSpy.and.returnValue(throwError('Error'));
                   });
                   it('with a success toast', async function() {
                       await service.uploadShapesGraph(this.rdfUpload)
                           .subscribe(() => {
                               fail('Observable should have rejected');
                           }, response => {
                               expect(response).toEqual('Error');
                           });
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
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
                           .subscribe(() => {
                               fail('Observable should have rejected');
                           }, response => {
                               expect(response).toEqual('Error');
                           });
                       expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(this.rdfUpload);
                       expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
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
                shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(throwError('Error'));
                await service.uploadShapesGraph(this.rdfUpload)
                    .subscribe(() => {
                        fail('Observable should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
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
            this.catalogDetailsSpy = spyOn(service, 'getCatalogDetails').and.returnValue(of(this.catalogDetailsResponse));
        });
        it('when the item is already opened', async function() {
            const tempItem = new ShapesGraphListItem();
            tempItem.versionedRdfRecord.recordId = this.selectedRecord.recordId;
            service.list.push(tempItem);

            expect(service.listItem).toBeUndefined();
            await service.openShapesGraph(this.selectedRecord)
                .subscribe(() => {}, () => fail('Observable should have succeeded'));

            expect(service.listItem).toEqual(tempItem);
            expect(this.catalogDetailsSpy).not.toHaveBeenCalled();
        });
        describe('when the item is not open and retrieves catalog details', function() {
            it('successfully', async function() {
                shapesGraphManagerStub.getShapesGraphIRI.and.returnValue(of('theId'));
                shapesGraphManagerStub.getShapesGraphMetadata.and.returnValue(of([{'@id': 'theId'}]));
                spyOn(service, 'updateShapesGraphMetadata').and.returnValue(of(null));
                await service.openShapesGraph(this.selectedRecord)
                    .subscribe(() => {}, () => fail('Observable should have succeeded'));
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
                this.catalogDetailsSpy.and.returnValue(throwError('Error'));
                expect(service.listItem).toBeUndefined();
                await service.openShapesGraph(this.selectedRecord)
                    .subscribe(() => {
                        fail('Observable should have rejected');
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
            shapesGraphManagerStub.getShapesGraphIRI.and.returnValue(of('theId'));
            shapesGraphManagerStub.getShapesGraphMetadata.and.returnValue(of([{'@id': 'theId'}]));
            shapesGraphManagerStub.getShapesGraphContent.and.returnValue(of('<urn:testClass> a <http://www.w3.org/2002/07/owl#Class>;'));
            policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
        });
        it('successfully', async function() {
            await service.updateShapesGraphMetadata('recordId', 'branch123', 'commitId')
                .subscribe(() => {}, () => fail('Observable should have succeeded'));
            expect(service.listItem.shapesGraphId).toEqual('theId');
            expect(service.listItem.metadata['@id']).toEqual('theId');
            expect(service.listItem.masterBranchIri).toEqual('');
            expect(service.listItem.userCanModify).toEqual(true);
            expect(service.listItem.userCanModifyMaster).toEqual(true);
            expect(service.list.length).toEqual(1);
            expect(service.list).toContain(service.listItem);
        });
        it('when the user does not have permission to modify', async function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of('Deny'));
            await service.updateShapesGraphMetadata('recordId', 'branch123', 'commitId')
                .subscribe(() => {}, () => fail('Observable should have succeeded'));
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
           this.deleteStateSpy = spyOn(service, 'deleteState').and.returnValue(of(null));
        });
        describe('first deleting the state', function() {
            describe('then deleting the record', function() {
                it('successfully', async function() {
                    shapesGraphManagerStub.deleteShapesGraphRecord.and.returnValue(of(null));
                    await service.deleteShapesGraph('recordId')
                        .subscribe(() => {}, () => fail('Observable should have succeeded'));
                    expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
                    expect(shapesGraphManagerStub.deleteShapesGraphRecord).toHaveBeenCalledWith('recordId');
                });
                it('unless an error occurs', async function() {
                    shapesGraphManagerStub.deleteShapesGraphRecord.and.returnValue(throwError('Error'));
                    await service.deleteShapesGraph('recordId')
                        .subscribe(() => {
                            fail('Observable should have rejected');
                        }, response => {
                            expect(response).toEqual('Error');
                        });
                    expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
                    expect(shapesGraphManagerStub.deleteShapesGraphRecord).toHaveBeenCalledWith('recordId');
                });
            });
            it('unless an error occurs', async function() {
                this.deleteStateSpy.and.returnValue(throwError('Error'));
                await service.deleteShapesGraph('recordId')
                    .subscribe(() => {
                        fail('Observable should have rejected');
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
            this.updateStateSpy = spyOn(service, 'updateState').and.returnValue(of(null));
            this.updateShapesGraphMetadataSpy = spyOn(service, 'updateShapesGraphMetadata').and.callFake(() => {
                service.list.push(service.listItem);
                return of(null);
            });
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
                    await service.changeShapesGraphVersion('recordId', 'branchId', 'commitId', undefined, 'versionTitle', true)
                        .subscribe(() => {}, () => fail('Observable should have succeeded'));
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
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
                    await service.changeShapesGraphVersion('recordId', 'branchId', 'commitId', undefined, 'versionTitle')
                        .subscribe(() => {}, () => fail('Observable should have succeeded'));
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
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
                this.updateStateSpy.and.returnValue(throwError('Error'));
                await service.changeShapesGraphVersion('recordId', 'branchId', 'commitId', undefined, 'versionTitle')
                    .subscribe(() => {
                        fail('Observable should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                expect(this.updateShapesGraphMetadataSpy).not.toHaveBeenCalled();
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
                    await service.changeShapesGraphVersion('recordId', undefined, 'commitId', 'tagId', 'versionTitle', true)
                        .subscribe(() => {}, () => fail('Observable should have succeeded'));
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith('recordId', undefined, 'commitId');
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
                    await service.changeShapesGraphVersion('recordId', undefined, 'commitId', 'tagId', 'versionTitle')
                        .subscribe(() => {}, () => fail('Observable should have succeeded'));
                    expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                    expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith('recordId', undefined, 'commitId');
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
                this.updateStateSpy.and.returnValue(throwError('Error'));
                await service.changeShapesGraphVersion('recordId', undefined, 'commitId', 'tagId', 'versionTitle')
                    .subscribe(() => {
                        fail('Observable should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(this.updateStateSpy).toHaveBeenCalledWith(this.stateBase);
                expect(this.updateShapesGraphMetadataSpy).not.toHaveBeenCalled();
                expect(service.listItem).toBeUndefined();
            });
        });
    });
    describe('should delete shapes graph branch', function() {
        beforeEach(function() {
            this.deleteBranchStateSpy = spyOn(service, 'deleteBranchState').and.returnValue(of(null));
            catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
        });
        describe('first deleting the branch', function() {
            describe('then deleting the branch state', function() {
                it('successfully', async function() {
                    catalogManagerStub.deleteRecordBranch.and.callFake((recordId: string, branchId: string, catalogId: string) => {
                        return of(1).pipe(
                            rxjsMap(() => {}),
                            tap(() => {
                                _catalogManagerActionSubject.next({
                                    eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL, 
                                    payload: {
                                        recordId, 
                                        branchId,
                                        catalogId
                                    }
                                });
                            })
                        )
                    });
                    await service.deleteShapesGraphBranch('recordId', 'branchId')
                        .subscribe(() => {}, () => fail('Observable should have succeeded'));
                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', 'branchId', 'catalog');
                });
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.deleteRecordBranch.and.returnValue(throwError('Error'));
                await service.deleteShapesGraphBranch('recordId', 'branchId')
                    .subscribe(() => {
                        fail('Observable should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', 'branchId', 'catalog');
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
                [`${DCTERMS}title`]: [{'@value': 'branchTitle'}]
            };
            this.changeShapesGraphVersionSpy = spyOn(service, 'changeShapesGraphVersion').and.returnValue(of(null));
            this.deleteShapesGraphBranchSpy = spyOn(service, 'deleteShapesGraphBranch').and.returnValue(of(null));
            catalogManagerStub.mergeBranches.and.returnValue(of('commitId'));
        });
        describe('and delete the branch if the checkbox is', function() {
            describe('checked', function() {
                beforeEach(function() {
                   service.listItem.merge.checkbox = true;
                });
                describe('and should change the shapes graph version to the target branch', function() {
                    it('successfully', async function() {
                        await service.merge()
                            .subscribe(() => {
                                expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                                expect(this.deleteShapesGraphBranchSpy).toHaveBeenCalledWith('recordId', 'sourceBranchId');
                                expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                            }, () => fail('Observable should have succeeded'));
                    });
                    it('unless an error occurs', async function() {
                        this.changeShapesGraphVersionSpy.and.returnValue(throwError('Error'));
                        await service.merge()
                            .subscribe(() => {
                                fail('Observable should have rejected');
                            }, response => {
                                expect(response).toEqual('Error');
                            });
                        expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                        expect(this.deleteShapesGraphBranchSpy).toHaveBeenCalledWith('recordId', 'sourceBranchId');
                        expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                    });
                });
                it('unless an error occurs', async function() {
                    this.deleteShapesGraphBranchSpy.and.returnValue(throwError('Error'));
                    await service.merge()
                        .subscribe(() => {
                            fail('Observable should have errored');
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
                        catalogManagerStub.mergeBranches.and.returnValue(of('commitId'));
                        await service.merge()
                            .subscribe(() => {
                                expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
                                expect(this.deleteShapesGraphBranchSpy).not.toHaveBeenCalled();
                                expect(this.changeShapesGraphVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle');
                            }, () => fail('Observable should have succeeded'));
                    });
                    it('unless an error occurs', async function() {
                        catalogManagerStub.mergeBranches.and.returnValue(of('commitId'));
                        this.changeShapesGraphVersionSpy.and.returnValue(throwError('Error'));
                        await service.merge()
                            .subscribe(() => {
                                fail('Observable should have rejected');
                            }, response => {
                                expect(response).toEqual('Error');
                            });
                        
                    });
                });
            });
        });
        it('unless an error occurs', async function() {
            catalogManagerStub.mergeBranches.and.returnValue(throwError('Error'));
            await service.merge()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference());
            expect(this.deleteShapesGraphBranchSpy).not.toHaveBeenCalled();
            expect(this.changeShapesGraphVersionSpy).not.toHaveBeenCalled();
        });
    });
});
