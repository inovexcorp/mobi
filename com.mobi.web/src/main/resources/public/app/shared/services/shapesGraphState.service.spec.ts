/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';

import { MockProvider } from 'ng-mocks';
import { Subject, of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { CatalogDetails } from './versionedRdfState.service';
import { CatalogManagerService } from './catalogManager.service';
import { CATALOG, DCTERMS } from '../../prefixes';
import { Difference } from '../models/difference.class';
import { EventWithPayload } from '../models/eventWithPayload.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { PolicyManagerService } from './policyManager.service';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { RecordSelectFiltered } from '../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphStateService } from './shapesGraphState.service';

describe('Shapes Graph State service', function() {
  let service: ShapesGraphStateService;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let mergeRequestManagerServiceStub: jasmine.SpyObj<MergeRequestManagerService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let _catalogManagerActionSubject: Subject<EventWithPayload>;
  let _mergeRequestManagerActionSubject: Subject<EventWithPayload>;

  const error = 'Error Message';
  const catalogId = 'catalog';
  const file = new File([''], 'filename', { type: 'text/html' });
  const uploadResponse: VersionedRdfUploadResponse = {
    recordId: 'recordId',
    branchId: 'branchId',
    commitId: 'commitId',
    title: 'title',
    shapesGraphId: 'shapesGraphId'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ShapesGraphStateService,
        MockProvider(CatalogManagerService),
        MockProvider(MergeRequestManagerService),
        MockProvider(PolicyEnforcementService),
        MockProvider(PolicyManagerService),
        MockProvider(ShapesGraphManagerService),
        MockProvider(StateManagerService),
        MockProvider(ToastService)
      ]
    });
    shapesGraphManagerStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
    shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(of(uploadResponse));
    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    policyEnforcementStub.permit = 'Permit';
    policyEnforcementStub.deny = 'Deny';
    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));

    mergeRequestManagerServiceStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
    
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
    _catalogManagerActionSubject = null;
    _mergeRequestManagerActionSubject = null;
  });

  it('initialize works properly', function() {
    expect(service['catalogId']).toEqual(catalogId);
  });
  it('getDefaultNamespace provides the default namespace to be used for new shapes graphs', fakeAsync(function() {
    service.getDefaultNamespace().subscribe(value => {
      expect(value).toContain('shapes-graph');
    });
    tick();
  }));
  it('should retrieve the name of an entity for shapes graphs', function() {
    expect(service.getEntityName('http://test.com/TestEntity')).toEqual('Test Entity');
  });
  describe('getIdentifierIRI retrieves the shapes graph IRI of a ShapesGraphRecord', function() {
    it('if provided JSON-LD', function() {
      expect(service.getIdentifierIRI({
        '@id': 'recordId', 
        [`${CATALOG}trackedIdentifier`]: [{ '@id': 'shapesGraphIRI' }]
      })).toEqual('shapesGraphIRI');
    });
    it('from the current listItem', function() {
      service.listItem.shapesGraphId = 'shapesGraphIRI';
      expect(service.getIdentifierIRI()).toEqual('shapesGraphIRI');
    });
  });
  describe('open opens the shapes graph identified by the provided details', function() {
    const catalogDetailsResponse: CatalogDetails = {
      recordId: 'recordId',
      branchId: 'branchId',
      commitId: 'commitId',
      inProgressCommit: new Difference(),
      upToDate: true
    };
    const selectedRecord: RecordSelectFiltered = {
      recordId: 'recordId',
      title: 'title',
      identifierIRI: ''
    };
    beforeEach(function() {
      service.listItem = undefined;
      this.catalogDetailsSpy = spyOn(service, 'getCatalogDetails').and.returnValue(of(catalogDetailsResponse));
    });
    it('when the item is already opened', async function() {
      const tempItem = new ShapesGraphListItem();
      tempItem.versionedRdfRecord.recordId = selectedRecord.recordId;
      service.list.push(tempItem);

      expect(service.listItem).toBeUndefined();
      await service.open(selectedRecord)
        .subscribe(() => {}, () => fail('Observable should have succeeded'));

      expect(service.listItem).toEqual(tempItem);
      expect(this.catalogDetailsSpy).not.toHaveBeenCalled();
    });
    describe('when the item is not open and retrieves catalog details', function() {
      it('successfully', async function() {
        spyOn(service, 'updateShapesGraphMetadata').and.returnValue(of(null));
        await service.open(selectedRecord)
          .subscribe(() => {}, () => fail('Observable should have succeeded'));
        expect(this.catalogDetailsSpy).toHaveBeenCalledWith(selectedRecord.recordId);
        expect(service.listItem.versionedRdfRecord).toEqual({
          title: selectedRecord.title,
          recordId: catalogDetailsResponse.recordId,
          branchId: catalogDetailsResponse.branchId,
          commitId: catalogDetailsResponse.commitId,
          tagId: undefined
        });

        expect(service.listItem.inProgressCommit).toEqual(new Difference());
        expect(service.listItem).toBeDefined();
        expect(service.listItem.changesPageOpen).toBeFalse();
        expect(service.listItem.upToDate).toBeTrue();
        expect(service.list).toContain(service.listItem);
        expect(service.updateShapesGraphMetadata).toHaveBeenCalledWith(catalogDetailsResponse.recordId, catalogDetailsResponse.branchId, catalogDetailsResponse.commitId);
      });
      it('unless an error occurs', async function() {
        this.catalogDetailsSpy.and.returnValue(throwError(error));
        expect(service.listItem).toBeUndefined();
        await service.open(selectedRecord)
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual(error);
          });
        expect(service.listItem).toBeUndefined();
        expect(service.list.length).toEqual(0);
      });
    });
  });
  describe('create makes a new shapes graph record without opening it', function() {
    it('unless no file or JSON-LD was provided', fakeAsync(function() {
      service.create({title: ''}).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).not.toHaveBeenCalled();
    }));
    it('if a file is provided', fakeAsync(function() {
      const uploadDetails: RdfUpload = { title: '', file };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails, true);
    }));
    it('if JSON-LD is provided', fakeAsync(function() {
      const uploadDetails: RdfUpload = { title: '', jsonld: [{ '@id': 'shapesGraph' }] };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails, true);
    }));
  });
  describe('createAndOpen makes a new shapes graph record and opens it', function() {
    const rdfUpload: RdfUpload = {
      title: 'Record Name',
      description: 'Some description',
      keywords: ['keyword1', 'keyword2'],
      file
    };
    beforeEach(function() {
      this.createStateSpy = spyOn(service, 'createState').and.returnValue(of(null));
      shapesGraphManagerStub.getShapesGraphMetadata.and.returnValue(of([{'@id': uploadResponse.shapesGraphId}]));
      shapesGraphManagerStub.getShapesGraphContent.and.returnValue(of('content'));
      service.listItem = undefined;
    });
    it('successfully', async function() {
      await service.createAndOpen(rdfUpload)
        .subscribe(response => {
          expect(response).toEqual({
            recordId: uploadResponse.recordId,
            branchId: uploadResponse.branchId,
            commitId: uploadResponse.commitId,
            title: uploadResponse.title,
            shapesGraphId: uploadResponse.shapesGraphId
          });
        }, () => fail('Observable should have succeeded'));
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(rdfUpload);
      expect(this.createStateSpy).toHaveBeenCalledWith({
          recordId: uploadResponse.recordId,
          branchId: uploadResponse.branchId,
          commitId: uploadResponse.commitId
      } as VersionedRdfStateBase);
      expect(shapesGraphManagerStub.getShapesGraphMetadata).toHaveBeenCalledWith(
        uploadResponse.recordId,
        uploadResponse.branchId,
        uploadResponse.commitId,
        uploadResponse.shapesGraphId
      );
      expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(
        uploadResponse.recordId,
        uploadResponse.branchId,
        uploadResponse.commitId
      );

      expect(service.listItem).toBeDefined();
      expect(service.listItem.metadata).toEqual({'@id': uploadResponse.shapesGraphId});
      expect(service.listItem.content).toEqual('content');
      expect(service.listItem.shapesGraphId).toEqual(uploadResponse.shapesGraphId);
      expect(service.listItem.masterBranchIri).toEqual(uploadResponse.branchId);
      expect(service.listItem.versionedRdfRecord).toEqual({
          title: uploadResponse.title,
          recordId: uploadResponse.recordId,
          branchId: uploadResponse.branchId,
          commitId: uploadResponse.commitId
      });
      expect(service.listItem.userCanModify).toBeTrue();
      expect(service.listItem.userCanModifyMaster).toBeTrue();
      expect(service.listItem.currentVersionTitle).toEqual('MASTER');
      expect(service.list.length).toEqual(1);
      expect(service.list).toContain(service.listItem);
    });
    it('unless an error occurs creating the state', async function() {
      this.createStateSpy.and.returnValue(throwError(error));
      await service.createAndOpen(rdfUpload)
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toEqual(error);
        });
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(rdfUpload);
      expect(this.createStateSpy).toHaveBeenCalledWith({
          recordId: uploadResponse.recordId,
          branchId: uploadResponse.branchId,
          commitId: uploadResponse.commitId
      } as VersionedRdfStateBase);
      expect(shapesGraphManagerStub.getShapesGraphMetadata).toHaveBeenCalledWith(
        uploadResponse.recordId,
        uploadResponse.branchId,
        uploadResponse.commitId,
        uploadResponse.shapesGraphId
      );
      expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(
        uploadResponse.recordId,
        uploadResponse.branchId,
        uploadResponse.commitId
      );

      expect(service.listItem).toBeUndefined();
      expect(service.list).toEqual([]);
    });
    it('unless an error occurs creating the record', async function() {
      shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(throwError(error));
      await service.createAndOpen(rdfUpload)
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual(error);
          });
      expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
      expect(this.createStateSpy).not.toHaveBeenCalled();
    });
  });
  describe('delete deletes a shapes graph', function() {
    beforeEach(function() {
      this.deleteStateSpy = spyOn(service, 'deleteState').and.returnValue(of(null));
    });
    describe('first deleting the state', function() {
      describe('then deleting the record', function() {
        it('successfully', async function() {
          catalogManagerStub.deleteRecord.and.returnValue(of(null));
          await service.delete('recordId')
            .subscribe(() => {}, () => fail('Observable should have succeeded'));
          expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith('recordId', catalogId);
        });
        it('unless an error occurs', async function() {
          catalogManagerStub.deleteRecord.and.returnValue(throwError(error));
          await service.delete('recordId')
            .subscribe(() => {
              fail('Observable should have rejected');
            }, response => {
              expect(response).toEqual(error);
            });
          expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith('recordId', catalogId);
        });
      });
      it('unless an error occurs', async function() {
        this.deleteStateSpy.and.returnValue(throwError(error));
        await service.delete('recordId')
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual(error);
          });
        expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
        expect(catalogManagerStub.deleteRecord).not.toHaveBeenCalled();
      });
    });
  });
  it('download submits a download of a shapes graph record', function() {
    const rdfDownload: RdfDownload = {
      recordId: ''
    };
    service.download(rdfDownload);
    expect(shapesGraphManagerStub.downloadShapesGraph).toHaveBeenCalledWith(rdfDownload);
  });
  describe('removeChanges clears the user\'s changes', function() {
    beforeEach(function() {
      service.listItem.versionedRdfRecord.recordId = 'recordId';
      service.listItem.versionedRdfRecord.branchId = 'branchId';
      service.listItem.versionedRdfRecord.commitId = 'commitId';
      spyOn(service, 'clearInProgressCommit');
    });
    describe('if deleteInProgressCommit succeeds', function() {
      beforeEach(function() {
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
      });
      it('and updateShapesGraphMetadata succeeds', fakeAsync(function() {
        spyOn(service, 'updateShapesGraphMetadata').and.returnValue(of(null));
        service.removeChanges().subscribe(() => {}, () => fail('Observable should have succeeded'));
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith('recordId', catalogId);
        expect(service.clearInProgressCommit).toHaveBeenCalledWith();
        expect(service.updateShapesGraphMetadata).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
      }));
      it('unless updateShapesGraphMetadata fails', fakeAsync(function() {
        spyOn(service, 'updateShapesGraphMetadata').and.returnValue(throwError(error));
        service.removeChanges().subscribe(() => fail('Observable should have failed'), response => {
          expect(response).toEqual(error);
        });
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith('recordId', catalogId);
        expect(service.clearInProgressCommit).toHaveBeenCalledWith();
        expect(service.updateShapesGraphMetadata).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
      }));
    });
    it('unless deleteInProgressCommit fails', fakeAsync(function() {
      spyOn(service, 'updateShapesGraphMetadata');
      catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(error));
      service.removeChanges().subscribe(() => fail('Observable should have failed'), response => {
        expect(response).toEqual(error);
      });
      tick();
      expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith('recordId', catalogId);
      expect(service.clearInProgressCommit).not.toHaveBeenCalled();
      expect(service.updateShapesGraphMetadata).not.toHaveBeenCalled();
    }));
  });
  describe('uploadChanges updates the shapes graph with new data', function() {
    const rdfUpdate: RdfUpdate = {
      recordId: 'recordId',
      branchId: 'branchId',
      commitId: 'commitId'
    };
    beforeEach(function() {
      spyOn(service, 'getListItemByRecordId').and.returnValue(service.listItem);
    });
    describe('if uploadChanges succeeds', function() {
      beforeEach(function() {
        shapesGraphManagerStub.uploadChanges.and.returnValue(of(new HttpResponse()));
      });
      describe('and getInProgressCommit succeeds', function() {
        const difference = new Difference([{'@id': 'add'}], [{'@id': 'diff'}]);
        beforeEach(function() {
          catalogManagerStub.getInProgressCommit.and.returnValue(of(difference));
        });
        it('and updateShapesGraphMetadata succeeds', fakeAsync(function() {
          spyOn(service, 'updateShapesGraphMetadata').and.returnValue(of(null));
          service.uploadChanges(rdfUpdate).subscribe(() => {}, () => fail('Observable should have failed'));
          tick();
          expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
          expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith('recordId', catalogId);
          expect(service.getListItemByRecordId).toHaveBeenCalledWith('recordId');
          expect(service.listItem.inProgressCommit).toEqual(difference);
          expect(service.updateShapesGraphMetadata).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
        }));
        it('unless updateShapesGraphMetadata fails', fakeAsync(function() {
          spyOn(service, 'updateShapesGraphMetadata').and.returnValue(throwError(error));
          service.uploadChanges(rdfUpdate).subscribe(() => fail('Observable should have failed'), response => {
            expect(response).toEqual(error);
          });
          tick();
          expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
          expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith('recordId', catalogId);
          expect(service.getListItemByRecordId).toHaveBeenCalledWith('recordId');
          expect(service.listItem.inProgressCommit).toEqual(difference);
          expect(service.updateShapesGraphMetadata).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
        }));
      });
      it('unless getInProgressCommit fails', fakeAsync(function() {
        spyOn(service, 'updateShapesGraphMetadata');
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(error));
        service.uploadChanges(rdfUpdate).subscribe(() => fail('Observable should have failed'), response => {
          expect(response).toEqual(error);
        });
        tick();
        expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith('recordId', catalogId);
        expect(service.getListItemByRecordId).not.toHaveBeenCalled();
        expect(service.listItem.inProgressCommit).toEqual(new Difference());
        expect(service.updateShapesGraphMetadata).not.toHaveBeenCalled();
      }));
    });
    it('unless uploadChanges returns with 204', fakeAsync(function() {
      spyOn(service, 'updateShapesGraphMetadata');
      shapesGraphManagerStub.uploadChanges.and.returnValue(of(new HttpResponse({ status: 204 })));
      service.uploadChanges(rdfUpdate).subscribe(() => fail('Observable should have failed'), response => {
        expect(response).toEqual('No changes');
      });
      tick();
      expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
      expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
      expect(service.getListItemByRecordId).not.toHaveBeenCalled();
      expect(service.listItem.inProgressCommit).toEqual(new Difference());
      expect(service.updateShapesGraphMetadata).not.toHaveBeenCalled();
    }));
    it('unless uploadChanges fails', fakeAsync(function() {
      spyOn(service, 'updateShapesGraphMetadata');
      shapesGraphManagerStub.uploadChanges.and.returnValue(throwError(error));
      service.uploadChanges(rdfUpdate).subscribe(() => fail('Observable should have failed'), response => {
        expect(response).toEqual(error);
      });
      tick();
      expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
      expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
      expect(service.getListItemByRecordId).not.toHaveBeenCalled();
      expect(service.listItem.inProgressCommit).toEqual(new Difference());
      expect(service.updateShapesGraphMetadata).not.toHaveBeenCalled();
    }));
  });
  describe('changeVersion changes the open shapes graph version', function() {
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
      spyOn(service, 'getListItemByRecordId').and.returnValue(service.listItem);
    });
    describe('for a branch and update state', function() {
      const stateBase: VersionedRdfStateBase = {
        recordId: 'recordId',
        branchId: 'branchId',
        commitId: 'commitId',
        tagId: undefined
      };
      describe('successfully', function() {
        it('and inProgressCommit should be reset', async function() {
          expect(service.list.length).toEqual(0);
          await service.changeVersion(stateBase.recordId, stateBase.branchId, stateBase.commitId, undefined, 'versionTitle', true, true)
            .subscribe(() => {}, () => fail('Observable should have succeeded'));
          expect(this.updateStateSpy).toHaveBeenCalledWith(stateBase);
          expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith(stateBase.recordId, stateBase.branchId, stateBase.commitId);
          expect(service.listItem.versionedRdfRecord).toEqual({
            recordId: stateBase.recordId,
            branchId: stateBase.branchId,
            commitId: stateBase.commitId,
            tagId: undefined,
            title: 'recordTitle'
          });
          expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
          expect(service.listItem.inProgressCommit).toEqual(new Difference());
          expect(service.listItem.upToDate).toBeTrue();
          expect(service.listItem.changesPageOpen).toBeFalse();
          expect(service.list.length).toEqual(1);
        });
        it('and inProgressCommit should not be reset', async function() {
          expect(service.list.length).toEqual(0);
          await service.changeVersion(stateBase.recordId, stateBase.branchId, stateBase.commitId, undefined, 'versionTitle', false, false, true)
            .subscribe(() => {}, () => fail('Observable should have succeeded'));
          expect(this.updateStateSpy).toHaveBeenCalledWith(stateBase);
          expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith(stateBase.recordId, stateBase.branchId, stateBase.commitId);
          expect(service.listItem.versionedRdfRecord).toEqual({
            recordId: stateBase.recordId,
            branchId: stateBase.branchId,
            commitId: stateBase.commitId,
            tagId: undefined,
            title: 'recordTitle'
          });
          expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
          expect(service.listItem.inProgressCommit).toEqual(this.inProgressCommit);
          expect(service.listItem.upToDate).toBeFalse();
          expect(service.listItem.changesPageOpen).toBeTrue();
          expect(service.list.length).toEqual(1);
        });
      });
      it('unless an error occurs', async function() {
        service.listItem = undefined;
        this.updateStateSpy.and.returnValue(throwError('Error'));
        await service.changeVersion(stateBase.recordId, stateBase.branchId, stateBase.commitId, undefined, 'versionTitle', false)
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual('Error');
          });
        expect(this.updateStateSpy).toHaveBeenCalledWith(stateBase);
        expect(this.updateShapesGraphMetadataSpy).not.toHaveBeenCalled();
        expect(service.listItem).toBeUndefined();
      });
    });
    describe('for a tag', function() {
      const stateBase: VersionedRdfStateBase = {
        recordId: 'recordId',
        branchId: undefined,
        commitId: 'commitId',
        tagId: 'tagId'
      };
      describe('successfully', function() {
        it('and inProgressCommit should be reset', async function() {
          expect(service.list.length).toEqual(0);
          await service.changeVersion(stateBase.recordId, undefined, stateBase.commitId, stateBase.tagId, 'versionTitle', true, true)
            .subscribe(() => {}, () => fail('Observable should have succeeded'));
          expect(this.updateStateSpy).toHaveBeenCalledWith(stateBase);
          expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith(stateBase.recordId, undefined, stateBase.commitId);
          expect(service.listItem.versionedRdfRecord).toEqual({
            recordId: stateBase.recordId,
            branchId: undefined,
            commitId: stateBase.commitId,
            tagId: stateBase.tagId,
            title: 'recordTitle'
          });
          expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
          expect(service.listItem.inProgressCommit).toEqual(new Difference());
          expect(service.listItem.upToDate).toBeTrue();
          expect(service.listItem.changesPageOpen).toBeFalse();
          expect(service.list.length).toEqual(1);
        });
        it('and inProgressCommit should not be reset', async function() {
          expect(service.list.length).toEqual(0);
          await service.changeVersion(stateBase.recordId, undefined, stateBase.commitId, stateBase.tagId, 'versionTitle', false, false, true)
            .subscribe(() => {}, () => fail('Observable should have succeeded'));
          expect(this.updateStateSpy).toHaveBeenCalledWith(stateBase);
          expect(this.updateShapesGraphMetadataSpy).toHaveBeenCalledWith(stateBase.recordId, undefined, stateBase.commitId);
          expect(service.listItem.versionedRdfRecord).toEqual({
            recordId: stateBase.recordId,
            branchId: undefined,
            commitId: stateBase.commitId,
            tagId: stateBase.tagId,
            title: 'recordTitle'
          });
          expect(service.listItem.currentVersionTitle).toEqual('versionTitle');
          expect(service.listItem.inProgressCommit).toEqual(this.inProgressCommit);
          expect(service.listItem.upToDate).toBeFalse();
          expect(service.listItem.changesPageOpen).toBeTrue();
          expect(service.list.length).toEqual(1);
        });
      });
      it('unless an error occurs', async function() {
        service.listItem = undefined;
        this.updateStateSpy.and.returnValue(throwError('Error'));
        await service.changeVersion(stateBase.recordId, undefined, stateBase.commitId, stateBase.tagId, 'versionTitle', false)
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual('Error');
          });
        expect(this.updateStateSpy).toHaveBeenCalledWith(stateBase);
        expect(this.updateShapesGraphMetadataSpy).not.toHaveBeenCalled();
        expect(service.listItem).toBeUndefined();
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
      this.changeVersionSpy = spyOn(service, 'changeVersion').and.returnValue(of(null));
      catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
      catalogManagerStub.mergeBranches.and.returnValue(of('commitId'));
    });
    describe('and should change the shapes graph version to the target branch', function()  {
      describe('and handle if the checkbox is', function() {
        it('checked', async function() {
          service.listItem.merge.checkbox = true;
          await service.merge()
            .subscribe(() => {
              expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference(), []);
              expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
              expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', 'sourceBranchId', catalogId);
            }, () => fail('Observable should have succeeded'));
        });
        it('unchecked', async function() {
          service.listItem.merge.checkbox = false;
          await service.merge()
            .subscribe(() => {
              expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference(), []);
              expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
              expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
            }, () => fail('Observable should have succeeded'));
        });
      });
      it('unless an error occurs', async function() {
        this.changeVersionSpy.and.returnValue(throwError('Error'));
        await service.merge()
          .subscribe(() => {
            fail('Observable should have errored');
          }, response => {
            expect(response).toEqual('Error');
            expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference(), []);
            expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
            expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
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
          expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalog', new Difference(), []);
          expect(this.changeVersionSpy).not.toHaveBeenCalled();
          expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
          expect(this.changeVersionSpy).not.toHaveBeenCalled();
        });
    });
  });
  describe('should update shapes graph metadata', function() {
    const masterBranch: JSONLDObject = {
      '@id': 'master',
      [`${DCTERMS}title`]: [{ '@value': 'MASTER' }]
    };
    beforeEach(function() {
      spyOn(service, 'getListItemByRecordId').and.returnValue(service.listItem);
      shapesGraphManagerStub.getShapesGraphIRI.and.returnValue(of('theId'));
      shapesGraphManagerStub.getShapesGraphMetadata.and.returnValue(of([{'@id': 'theId'}]));
      shapesGraphManagerStub.getShapesGraphContent.and.returnValue(of('<urn:testClass> a <http://www.w3.org/2002/07/owl#Class>;'));
      catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({ body: [masterBranch] })));
      policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
    });
    it('successfully', async function() {
      await service.updateShapesGraphMetadata('recordId', 'branch123', 'commitId')
        .subscribe(() => {}, (error) => fail('Observable should have succeeded: ' + error));
      expect(service.listItem.shapesGraphId).toEqual('theId');
      expect(service.listItem.metadata['@id']).toEqual('theId');
      expect(service.listItem.masterBranchIri).toEqual('master');
      expect(service.listItem.userCanModify).toEqual(true);
      expect(service.listItem.userCanModifyMaster).toEqual(true);
    });
    it('when the user does not have permission to modify', async function() {
      policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
      await service.updateShapesGraphMetadata('recordId', 'branch123', 'commitId')
        .subscribe(() => {}, (error) => fail('Observable should have succeeded: ' + error));
      expect(service.listItem.shapesGraphId).toEqual('theId');
      expect(service.listItem.metadata['@id']).toEqual('theId');
      expect(service.listItem.masterBranchIri).toEqual('master');
      expect(service.listItem.userCanModify).toEqual(false);
      expect(service.listItem.userCanModifyMaster).toEqual(false);
    });
  });
});
