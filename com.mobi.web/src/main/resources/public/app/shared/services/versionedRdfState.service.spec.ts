/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { cloneDeep, includes, set } from 'lodash';
import { MockProvider } from 'ng-mocks';
import { of, throwError, Observable } from 'rxjs';

import { CATALOG, DCTERMS } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { CommitDifference } from '../models/commitDifference.interface';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { mockStateManager } from '../../../test/ts/Shared';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { RecordSelectFiltered } from '../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { State } from '../models/state.interface';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { VersionedRdfListItem } from '../models/versionedRdfListItem.class';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { VersionedRdfState } from './versionedRdfState.service';
import { JSONLDId } from '../models/JSONLDId.interface';
import { JSONLDValue } from '../models/JSONLDValue.interface';

class VersionedRdfStateImpl extends VersionedRdfState<VersionedRdfListItemImpl> {
  static testPrefix = 'urn:state#';
  static appName = 'test-application'
  constructor() {
    super(VersionedRdfStateImpl.testPrefix,
      `${VersionedRdfStateImpl.testPrefix}branch-id/`,
      `${VersionedRdfStateImpl.testPrefix}tag-id/`,
      `${VersionedRdfStateImpl.testPrefix}commit-id/`,
      VersionedRdfStateImpl.appName
    );
  }
  initialize(): void {
      this.catalogId = 'catalog';
  }
  getId(): Observable<string> {
      return of('');
  }
  changeVersion(recordId: string, branchId: string, commitId: string, tagId: string, versionTitle: string, upToDate: boolean, clearInProgressCommit: boolean, changesPageOpen: boolean): Observable<null> {
    return of(null);
  }
  open(record: RecordSelectFiltered): Observable<null> {
    return of(null);
  }
  delete(recordId: string): Observable<void> {
    return of(null);
  }
  getIdentifierIRI(record?: JSONLDObject): string {
    return '';
  }
  download(rdfDownload: RdfDownload): void {}
  uploadChanges(rdfUpdate: RdfUpdate): Observable<null> {
    return of(null);
  }
  removeChanges(): Observable<null> {
    return of(null);
  }
  create(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse> {
    return throwError('Method not implemented.');
  }
  createAndOpen(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse> {
    return throwError('Method not implemented.');
  }
  getDefaultNamespace(): Observable<string> {
    return of('');
  }
  getEntityName(entityId: string): string {
    return '';
  }
  merge(): Observable<null> {
    return of(null);
  }
  getRemovePropOverlayMessage(key: string, index: number): string {
    return '';
  }
  getPropValueDisplay(key: string, index: number): string {
    return '';
  }
  removeProperty(key: string, index: number): Observable<JSONLDId|JSONLDValue>{
    return throwError('Method not implemented.');
  }
  updateLabel() {
  }
  isLinkable(id: string): boolean {
    throw new Error('Method not implemented.');
  }
  goTo(iri: string): void {
    throw new Error('Method not implemented.');
  }
  isSelectedImported(listItem?: VersionedRdfListItem): boolean {
    return false;
  }
  isImported(iri: string, listItem?: VersionedRdfListItem): boolean {
    throw new Error('Method not implemented.');
  }
  checkIri(iri: string): boolean {
    return false
  }
  onIriEdit(iriBegin: string, iriThen: string, iriEnd: string): Observable<void> {
    return of(null)
  }
  getImportedSource(): string {
      return '';
  }
  public setServices(stateManager: StateManagerService, catalogManager: CatalogManagerService, toast: ToastService) {
    this.sm = stateManager;
    this.cm = catalogManager;
    this.toast = toast;
  }
}

class VersionedRdfListItemImpl extends VersionedRdfListItem {

}

class stateManagerService {

}

describe('Versioned RDF State service', function() {
  let service: VersionedRdfStateImpl;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let stateManagerStub;
  let toastStub: jasmine.SpyObj<ToastService>;
  const error = 'Error message';
  const recordId = 'recordId';
  const branchId = 'branchId';
  const commitId = 'http://test.com#1234567890';
  const tagId = 'tagId';
  const stateId = 'state-id';
  const catalogId = 'catalog';

  const branch: JSONLDObject = {
    '@id': branchId,
    '@type': [`${CATALOG}branch`],
    [`${CATALOG}head`]: [{'@id': commitId}],
    [`${DCTERMS}title`]: [{'@value': 'MASTER'}]
  };
  const tag: JSONLDObject = {
    '@id': tagId,
    '@type': [`${VersionedRdfStateImpl.testPrefix}Version`, `${VersionedRdfStateImpl.testPrefix}Tag`]
  };
  const commit: JSONLDObject = {
    '@id': commitId,
    '@type': [`${CATALOG}Commit`]
  };
  const inProgressCommit: Difference = new Difference([{'@id': 'test'}], [{'@id': 'test'}]);
  
  let recordState: JSONLDObject;
  let versionedRdfStateModel: JSONLDObject[];
  let versionedRdfState: State;
  let commitStateModel: JSONLDObject;
  let tagStateModel: JSONLDObject;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        VersionedRdfStateImpl,
        MockProvider(CatalogManagerService),
        { provide: stateManagerService, useClass: mockStateManager },
        MockProvider(ToastService)
      ]
    }).compileComponents();

    service = TestBed.inject(VersionedRdfStateImpl);
    service.listItem = new VersionedRdfListItemImpl();
    service.initialize();

    stateManagerStub = TestBed.inject(stateManagerService);
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    service.setServices(stateManagerStub, catalogManagerStub, toastStub);
    service.initialize();

    recordState = {
      '@id': stateId,
      '@type': [`${VersionedRdfStateImpl.testPrefix}StateRecord`],
      [`${VersionedRdfStateImpl.testPrefix}record`]: [{'@id': recordId}]
    };
    versionedRdfStateModel = [recordState];
    versionedRdfState = {id: stateId, model: versionedRdfStateModel};
  });

  afterEach(function() {
    service = null;
    catalogManagerStub = null;
    stateManagerStub = null;
    toastStub = null;

    recordState = null;
    versionedRdfStateModel = null;
    versionedRdfState = null;
    commitStateModel = null;
    tagStateModel = null;
  });

  describe('validateCurrentStateExists checks the current state of the record and returns an Observable that', function() {
    const state = {
      '@id': 'state-id',
      [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}]
    };
    beforeEach(function() {
      spyOn(service, 'getCurrentStateByRecordId').and.returnValue(state);
    });
    describe('resolves if', () => {
      it('the current state is for a branch', fakeAsync(function() {
        spyOn(service, 'isStateBranch').and.returnValue(true);
        service.validateCurrentStateExists(recordId).subscribe(() => {
          expect(true).toBeTrue();
        }, () => fail('Observable should have succeeded'));
        tick();
        expect(service.getCurrentStateByRecordId).toHaveBeenCalledWith(recordId);
        expect(service.isStateBranch).toHaveBeenCalledWith(state);
        expect(catalogManagerStub.getCommit).not.toHaveBeenCalled();
      }));
      it('the current state if not for a branch and the commit still exists', fakeAsync(function() {
        spyOn(service, 'isStateBranch').and.returnValue(false);
        catalogManagerStub.getCommit.and.returnValue(of(commit));
        service.validateCurrentStateExists(recordId).subscribe(() => {
          expect(true).toBeTrue();
        }, () => fail('Observable should have succeeded'));
        tick();
        expect(service.getCurrentStateByRecordId).toHaveBeenCalledWith(recordId);
        expect(service.isStateBranch).toHaveBeenCalledWith(state);
        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
      }));
    });
    it('fails if the current state is not for a branch and the commit no longer exists', fakeAsync(function() {
      spyOn(service, 'isStateBranch').and.returnValue(false);
      catalogManagerStub.getCommit.and.returnValue(throwError('Error'));
      service.validateCurrentStateExists(recordId).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Error');
      });
      tick();
      expect(service.getCurrentStateByRecordId).toHaveBeenCalledWith(recordId);
      expect(service.isStateBranch).toHaveBeenCalledWith(state);
      expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
    }));
  });
  it('close removes the listItem associated with the provided record IRI from the opened list', function() {
    service.listItem.versionedRdfRecord.recordId = recordId;
    service.list = [service.listItem];
    service.close(recordId);
    expect(service.list.length).toEqual(0);
  });
  describe('isCommittable checks if the current record is committable', function() {
    it('when no shapes graph is open', function() {
      service.listItem.versionedRdfRecord.recordId = '';
      expect(service.isCommittable()).toEqual(false);
    });
    it('when a shapes graph is open with no changes', function() {
      service.listItem.versionedRdfRecord.recordId = recordId;
      expect(service.isCommittable()).toEqual(false);
    });
    it('when a shapes graph is open with changes', function() {
      service.listItem.versionedRdfRecord.recordId = recordId;
      service.listItem.inProgressCommit = new Difference();
      service.listItem.inProgressCommit.additions = [{'@id': 'testId'}];
      expect(service.isCommittable()).toEqual(true);
    });
  });
  describe('canModify determines whether the current user can modify the record', function() {
    it('if a commit is checked out', function() {
      service.listItem.versionedRdfRecord.branchId = '';
      expect(service.canModify()).toEqual(false);
    });
    it('if the master branch is checked out', function() {
      service.listItem.userCanModifyMaster = true;
      service.listItem.versionedRdfRecord.branchId = 'branch';
      service.listItem.masterBranchIri = 'branch';
      expect(service.canModify()).toEqual(true);
    });
    it('if another branch is checked out', function() {
      service.listItem.userCanModify = true;
      service.listItem.versionedRdfRecord.branchId = 'branch';
      service.listItem.masterBranchIri = 'master';
      expect(service.canModify()).toEqual(true);
    });
  });
  it('clearInProgressCommit clears the in progress commit on the current listItem', function() {
    service.listItem.inProgressCommit = new Difference();
    service.listItem.inProgressCommit.additions = [{'@id': 'testId'}];
    service.clearInProgressCommit();
    expect(service.listItem.inProgressCommit).toEqual(new Difference());
  });
  describe('createState calls the correct method with the correct state', function() {
    it('if it is for a branch', function() {
      service.createState({recordId, commitId, branchId});
      expect(stateManagerStub.createState).toHaveBeenCalledWith([
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateRecord`],
          [`${VersionedRdfStateImpl.testPrefix}record`]: [{'@id': recordId}],
          [`${VersionedRdfStateImpl.testPrefix}branchStates`]: [{'@id': jasmine.any(String)}],
          [`${VersionedRdfStateImpl.testPrefix}currentState`]: [{'@id': jasmine.any(String)}]
        },
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`, `${VersionedRdfStateImpl.testPrefix}StateBranch`],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}],
          [`${VersionedRdfStateImpl.testPrefix}branch`]: [{'@id': branchId}],
        }
      ], VersionedRdfStateImpl.appName);
    });
    it('if it is for a tag', function() {
      service.createState({recordId, commitId, tagId});
      expect(stateManagerStub.createState).toHaveBeenCalledWith([
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateRecord`],
          [`${VersionedRdfStateImpl.testPrefix}record`]: [{'@id': recordId}],
          [`${VersionedRdfStateImpl.testPrefix}currentState`]: [{'@id': jasmine.any(String)}]
        },
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`, `${VersionedRdfStateImpl.testPrefix}StateTag`],
          [`${VersionedRdfStateImpl.testPrefix}tag`]: [{'@id': tagId}],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}],
        }
      ], VersionedRdfStateImpl.appName);
    });
    it('if it is for a commit', function() {
      service.createState({recordId, commitId});
      expect(stateManagerStub.createState).toHaveBeenCalledWith([
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateRecord`],
          [`${VersionedRdfStateImpl.testPrefix}record`]: [{'@id': recordId}],
          [`${VersionedRdfStateImpl.testPrefix}currentState`]: [{'@id': jasmine.any(String)}]
        },
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}],
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
      commitStateModel = {'@id': 'commitStateModel', '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`]};
      recordState[`${VersionedRdfStateImpl.testPrefix}currentState`] = [{'@id': 'commitStateModel'}];
      versionedRdfStateModel.push(commitStateModel);
      service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
      expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, {
        asymmetricMatch: actual => !includes(actual, commitStateModel)
      });
    });
    it('if a tag was current before', function() {
      tagStateModel = {'@id': 'tagStateModel', '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`, `${VersionedRdfStateImpl.testPrefix}StateTag`]};
      recordState[`${VersionedRdfStateImpl.testPrefix}currentState`] = [{'@id': 'tagStateModel'}];
      versionedRdfStateModel.push(tagStateModel);
      service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
      expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, {
        asymmetricMatch: actual => !includes(actual, tagStateModel)
      });
    });
    it('if just the commit is provided', function() {
      service.updateState({recordId: recordId, commitId: commitId});
      expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
        set(recordState, `['${VersionedRdfStateImpl.testPrefix}currentState']`, [{'@id': jasmine.any(String)}]),
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}],
        }
      ]);
    });
    it('if a tag is in the update', function() {
      service.updateState({recordId: recordId, commitId: commitId, tagId: tagId});
      expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
        set(recordState, `['${VersionedRdfStateImpl.testPrefix}currentState']`, [{'@id': jasmine.any(String)}]),
        {
          '@id': jasmine.any(String),
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`, `${VersionedRdfStateImpl.testPrefix}StateTag`],
          [`${VersionedRdfStateImpl.testPrefix}tag`]: [{'@id': tagId}],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}],
        }
      ]);
    });
    describe('if a branch is in the update', function() {
      it('and the branch was opened before', function() {
        recordState[`${VersionedRdfStateImpl.testPrefix}branchStates`] = [{'@id': 'branchState'}];
        recordState[`${VersionedRdfStateImpl.testPrefix}currentState`] = [{'@id': 'branchState'}];
        versionedRdfStateModel.push({
          '@id': 'branchState',
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateBranch`, `${VersionedRdfStateImpl.testPrefix}StateCommit`],
          [`${VersionedRdfStateImpl.testPrefix}branch`]: [{'@id': branchId}],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}],
        });
        service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
        expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
          recordState,
          {
            '@id': 'branchState',
            '@type': [`${VersionedRdfStateImpl.testPrefix}StateBranch`, `${VersionedRdfStateImpl.testPrefix}StateCommit`],
            [`${VersionedRdfStateImpl.testPrefix}branch`]: [{'@id': branchId}],
            [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': 'newCommit'}],
          }
        ]);
      });
      it('and the branch had not been opened before', function() {
        service.updateState({recordId: recordId, commitId: 'newCommit', branchId: branchId});
        expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, [
          set(set(recordState, `['${VersionedRdfStateImpl.testPrefix}branchStates']`, [{'@id': jasmine.any(String)}]), `['${VersionedRdfStateImpl.testPrefix}currentState']`, [{'@id': jasmine.any(String)}]),
          {
            '@id': jasmine.any(String),
            '@type': [`${VersionedRdfStateImpl.testPrefix}StateCommit`, `${VersionedRdfStateImpl.testPrefix}StateBranch`],
            [`${VersionedRdfStateImpl.testPrefix}branch`]: [{'@id': branchId}],
            [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': 'newCommit'}]
          }
        ]);
      });
    });
  });
  it('deleteBranchState calls the correct method', function() {
    const tempState = cloneDeep(versionedRdfStateModel);
    recordState[`${VersionedRdfStateImpl.testPrefix}branchStates`] = [{'@id': 'branchState'}];
    versionedRdfStateModel.push({'@id': 'branchState', [`${VersionedRdfStateImpl.testPrefix}branch`]: [{'@id': branchId}]} as JSONLDObject);
    spyOn(service, 'getStateByRecordId').and.returnValue({
      id: stateId,
      model: versionedRdfStateModel
    });
    service.deleteBranchState(recordId, branchId);
    expect(stateManagerStub.updateState).toHaveBeenCalledWith(stateId, tempState);
  });
  describe('deleteState calls the correct method', function() {
    it('when state exists', function() {
      spyOn(service, 'getStateByRecordId').and.returnValue({
        id: stateId,
        model: versionedRdfStateModel
      });
      service.deleteState(recordId);
      expect(stateManagerStub.deleteState).toHaveBeenCalledWith(stateId);
    });
  it('when state does not exist', async function() {
      spyOn(service, 'getStateByRecordId').and.returnValue(undefined);
      await service.deleteState(recordId)
        .subscribe(() => {}, () => {
          fail('Observable should have succeeded');
        });
      service.deleteState(recordId);
      expect(stateManagerStub.deleteState).not.toHaveBeenCalled();
    });    
  });
  it('getCurrentStateIdByRecordId calls the correct methods', function() {
    const baseState: State = {'id': 'state-id', model: [{'@id': 'id', '@type': []}]};
    spyOn(service, 'getStateByRecordId').and.returnValue(baseState);
    spyOn(service, 'getCurrentStateId').and.returnValue('id');
    expect(service.getCurrentStateIdByRecordId('record')).toEqual('id');
    expect(service.getStateByRecordId).toHaveBeenCalledWith('record');
    expect(service.getCurrentStateId).toHaveBeenCalledWith(baseState);
  });
  it('getCurrentStateByRecordId calls the correct methods', function() {
    const baseState: State = {'id': 'state-id', model: [{'@id': 'id', '@type': []}]};
    spyOn(service, 'getStateByRecordId').and.returnValue(baseState);
    spyOn(service, 'getCurrentStateId').and.returnValue('id');
    expect(service.getCurrentStateByRecordId('record')).toEqual(baseState.model[0]);
    expect(service.getStateByRecordId).toHaveBeenCalledWith('record');
    expect(service.getCurrentStateId).toHaveBeenCalledWith(baseState);
  });
  it('getCurrentStateId gets the IRI of the current state object', function() {
    const recordState: JSONLDObject = {
      '@id': 'id',
      '@type': [`${VersionedRdfStateImpl.testPrefix}StateRecord`],
      [`${VersionedRdfStateImpl.testPrefix}currentState`]: [{'@id': 'current-state'}]
    };
    const baseState: State = {'id': 'state-id', model: [recordState]};
    expect(service.getCurrentStateId(baseState)).toEqual('current-state');
  });
  it('getCurrentState calls the correct methods', function() {
    const baseState: State = {'id': 'state-id', model: [{'@id': 'id', '@type': []}]};
    spyOn(service, 'getCurrentStateId').and.returnValue('id');
    expect(service.getCurrentState(baseState)).toEqual(baseState.model[0]);
  });
  it('getCommitIdOfBranchState retrieves the IRI of the commit attached to a specific branch state', function() {
    const branchState: JSONLDObject = {
      '@id': 'branch-id',
      '@type': [],
      [`${VersionedRdfStateImpl.testPrefix}branch`]: [{'@id': branchId}],
      [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}]
    };
    const baseState: State = {'id': 'state-id', model: [branchState]};
    expect(service.getCommitIdOfBranchState(baseState, branchId)).toEqual(commitId);
    expect(service.getCommitIdOfBranchState(baseState, 'blah')).toEqual('');
  });
  it('isStateTag determines if an object is a StateTag', function() {
    const obj: JSONLDObject = {
      '@id': 'id',
      '@type': []
    };
    expect(service.isStateTag(obj)).toEqual(false);
    obj['@type'] = ['Test'];
    expect(service.isStateTag(obj)).toEqual(false);
    obj['@type'].push(`${VersionedRdfStateImpl.testPrefix}StateTag`);
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
    obj['@type'].push(`${VersionedRdfStateImpl.testPrefix}StateBranch`);
    expect(service.isStateBranch(obj)).toEqual(true);
  });
  describe('getCatalogDetails calls the correct methods', function() {
    beforeEach(function() {
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
          '@type': [`${VersionedRdfStateImpl.testPrefix}StateRecord`],
          [`${VersionedRdfStateImpl.testPrefix}record`]: [{'@id': recordId}],
          [`${VersionedRdfStateImpl.testPrefix}currentState`]: [{'@id': 'state-id'}],
        };
        commitStateModel = {
          '@id': 'state-id',
          '@type': [],
          [`${VersionedRdfStateImpl.testPrefix}commit`]: [{'@id': commitId}]
        };
        versionedRdfStateModel = [
          recordState,
          commitStateModel
        ];
        versionedRdfState = {id: stateId, model: versionedRdfStateModel};
        spyOn(service, 'getStateByRecordId').and.returnValue(versionedRdfState);
        this.deleteStateSpy = spyOn(service, 'deleteState');
      });
      describe('and a branch was last checked out', function() {
        beforeEach(function() {
          recordState[`${VersionedRdfStateImpl.testPrefix}branchStates`] = [{'@id': 'state-id'}];
          commitStateModel[`${VersionedRdfStateImpl.testPrefix}branch`] = [{'@id': branchId}];
        });
        describe('and getRecordBranch is resolved', function() {
          beforeEach(function() {
            catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
          });
          describe('and getInProgressCommit is resolved', function() {
            beforeEach(function() {
              catalogManagerStub.getInProgressCommit.and.returnValue(of(inProgressCommit));
            });
            it('and getCommit is resolved', async function() {
              catalogManagerStub.getCommit.and.returnValue(of({'@id': commitId, '@type': []}));
              await service.getCatalogDetails(recordId)
                .subscribe(response => {
                  expect(response).toEqual(this.expected);
                }, () => {
                  fail('Observable should have succeeded');
                });
              
              expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
              expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
              expect(this.deleteStateSpy).not.toHaveBeenCalled();
              expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
            });
            describe('and getCommit is rejected', function() {
              beforeEach(function() {
                catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
              });
              describe('and deleteState is resolved', function() {
                beforeEach(function() {
                  this.deleteStateSpy.and.returnValue(of(null));
                });
                it('and getLatestMaster is resolved', async function() {
                  this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                  await service.getCatalogDetails(recordId)
                    .subscribe(response => {
                      expect(response).toEqual(this.expected2);
                    }, () => {
                      fail('Observable should have succeeded');
                    });
                  expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                });
                it('and getLatestMaster is rejected', async function() {
                  this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
                  }, response => {
                    expect(response).toEqual(this.error);
                  });
                  expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                });
              });
              it('and deleteState is rejected', async function() {
                this.deleteStateSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
                }, response => {
                  expect(response).toEqual(this.error);
                });
                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
              });
            });
          });
          describe('and getInProgressCommit is rejected', function() {
            describe('with a 404', function() {
              beforeEach(function() {
                catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 404}));
              });
              it('and getCommit is resolved', async function() {
                catalogManagerStub.getCommit.and.returnValue(of(commit));
                await service.getCatalogDetails(recordId)
                  .subscribe(response => {
                    expect(response).toEqual(this.expected2);
                  }, () => {
                    fail('Observable should have succeeded');
                  });
                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                expect(this.deleteStateSpy).not.toHaveBeenCalled();
                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
              });
              describe('and getCommit is rejected', function() {
                beforeEach(function() {
                  catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
                });
                describe('and deleteState is resolved', function() {
                  beforeEach(function() {
                    this.deleteStateSpy.and.returnValue(of(null));
                  });
                  it('and getLatestMaster is resolved', async function() {
                    this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                    await service.getCatalogDetails(recordId)
                      .subscribe(response => {
                        expect(response).toEqual(this.expected2);
                      }, () => {
                        fail('Observable should have succeeded');
                      });
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                  });
                  it('and getLatestMaster is rejected', async function() {
                    this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                    await service.getCatalogDetails(recordId).subscribe(() => {
                      fail('Observable should have errored');
                    }, response => {
                      expect(response).toEqual(this.error);
                    });
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                  });
                });
                it('and deleteState is rejected', async function() {
                  this.deleteStateSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
                  }, response => {
                    expect(response).toEqual(this.error);
                  });
                  expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                });
              });
            });
            describe('without a 404', function() {
              beforeEach(function() {
                catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 400}));
              });
              describe('and deleteState is resolved', function() {
                beforeEach(function() {
                  this.deleteStateSpy.and.returnValue(of(null));
                });
                it('and getLatestMaster is resolved', async function() {
                  this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                  await service.getCatalogDetails(recordId)
                    .subscribe(response => {
                      expect(response).toEqual(this.expected2);
                    }, () => {
                      fail('Observable should have succeeded');
                    });
                  expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                });
                it('and getLatestMaster is rejected', async function() {
                  this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
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
                this.deleteStateSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
            catalogManagerStub.getRecordBranch.and.returnValue(throwError(this.error));
          });
          describe('and deleteState is resolved', function() {
            beforeEach(function() {
              this.deleteStateSpy.and.returnValue(of(null));
            });
            it('and getLatestMaster is resolved', async function() {
              this.getLatestMasterSpy.and.returnValue(of(this.expected2));
              await service.getCatalogDetails(recordId)
                .subscribe(response => {
                  expect(response).toEqual(this.expected2);
                }, () => {
                  fail('Observable should have succeeded');
                });
              expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
              expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
              expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
              expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
            });
            it('and getLatestMaster is rejected', async function() {
              this.getLatestMasterSpy.and.returnValue(throwError(this.error));
              await service.getCatalogDetails(recordId).subscribe(() => {
                fail('Observable should have errored');
              }, response => {
                expect(response).toEqual(this.error);
              });
              expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
              expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
              expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
              expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
              expect(toastStub.createWarningToast).toHaveBeenCalledWith(`Branch ${branchId} does not exist. Opening HEAD of MASTER.`, {timeOut: 5000});
              expect(toastStub.createWarningToast).not.toHaveBeenCalledWith(`Commit ${commitId} does not exist. Opening HEAD of MASTER.`, {timeOut: 5000});
            });
          });
          it('and deleteState is rejected', async function() {
            this.deleteStateSpy.and.returnValue(throwError(this.error));
            await service.getCatalogDetails(recordId).subscribe(() => {
              fail('Observable should have errored');
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
          commitStateModel[`${VersionedRdfStateImpl.testPrefix}tag`] = [{'@id': tagId}];
          this.expected.branchId = '';
          this.expected2.branchId = '';
          this.expected.tagId = tagId;
          this.expected2.tagId = tagId;
        });
        describe('and getRecordVersion is resolved', function() {
          beforeEach(function() {
            catalogManagerStub.getRecordVersion.and.returnValue(of(tag));
          });
          describe('and getInProgressCommit is resolved', function() {
            beforeEach(function() {
              catalogManagerStub.getInProgressCommit.and.returnValue(of(inProgressCommit));
            });
            it('and getCommit is resolved', async function() {
              catalogManagerStub.getCommit.and.returnValue(of(commit));
              await service.getCatalogDetails(recordId)
                .subscribe(response => {
                  expect(response).toEqual(this.expected);
                }, () => {
                  fail('Observable should have succeeded');
                });
              expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
              expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
              expect(this.deleteStateSpy).not.toHaveBeenCalled();
              expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
            });
            describe('and getCommit is rejected', function() {
              beforeEach(function() {
                catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
              });
              describe('and deleteState is resolved', function() {
                beforeEach(function() {
                  this.deleteStateSpy.and.returnValue(of(null));
                });
                it('and getLatestMaster is resolved', async function() {
                  this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                  await service.getCatalogDetails(recordId)
                    .subscribe(response => {
                      expect(response).toEqual(this.expected2);
                    }, () => {
                      fail('Observable should have succeeded');
                    });
                  expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                });
                it('and getLatestMaster is rejected', async function() {
                  this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
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
                this.deleteStateSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
                catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 404}));
              });
              it('and getCommit is resolved', async function() {
                catalogManagerStub.getCommit.and.returnValue(of(commit));
                await service.getCatalogDetails(recordId)
                  .subscribe(response => {
                    expect(response).toEqual(this.expected2);
                  }, () => {
                    fail('Observable should have succeeded');
                  });
                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                expect(this.deleteStateSpy).not.toHaveBeenCalled();
                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
              });
              describe('and getCommit is rejected', function() {
                beforeEach(function() {
                  catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
                });
                describe('and deleteState is resolved', function() {
                  beforeEach(function() {
                    this.deleteStateSpy.and.returnValue(of(null));
                  });
                  it('and getLatestMaster is resolved', async function() {
                    this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                    await service.getCatalogDetails(recordId)
                      .subscribe(response => {
                        expect(response).toEqual(this.expected2);
                      }, () => {
                        fail('Observable should have succeeded');
                      });
                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                  });
                  it('and getLatestMaster is rejected', async function() {
                    this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                    await service.getCatalogDetails(recordId).subscribe(() => {
                      fail('Observable should have errored');
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
                  this.deleteStateSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
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
                catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 400}));
              });
              describe('and deleteState is resolved', function() {
                beforeEach(function() {
                  this.deleteStateSpy.and.returnValue(of(null));
                });
                it('and getLatestMaster is resolved', async function() {
                  this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                  await service.getCatalogDetails(recordId)
                    .subscribe(response => {
                      expect(response).toEqual(this.expected2);
                    }, () => {
                      fail('Observable should have succeeded');
                    });
                  expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                });
                it('and getLatestMaster is rejected', async function() {
                  this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
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
                this.deleteStateSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
            catalogManagerStub.getRecordVersion.and.returnValue(throwError(this.error));
          });
          describe('and updateState is resolved', function() {
            beforeEach(function() {
              spyOn(service, 'updateState').and.returnValue(of(null));
            });
            describe('and getInProgressCommit is resolved', function() {
              beforeEach(function() {
                catalogManagerStub.getInProgressCommit.and.returnValue(of(inProgressCommit));
              });
              it('and getCommit is resolved', async function() {
                catalogManagerStub.getCommit.and.returnValue(of(commit));
                await service.getCatalogDetails(recordId)
                  .subscribe(response => {
                    expect(response).toEqual(this.expected);
                  }, () => {
                    fail('Observable should have succeeded');
                  });
                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                expect(this.deleteStateSpy).not.toHaveBeenCalled();
                expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                expect(toastStub.createWarningToast).toHaveBeenCalledWith(`Tag ${tagId} does not exist. Opening commit 1234567890`, {timeOut: 5000});
                expect(toastStub.createWarningToast).not.toHaveBeenCalledWith(`Commit ${commitId} does not exist. Opening HEAD of MASTER.`, {timeOut: 5000});
              });
              describe('and getCommit is rejected', function() {
                beforeEach(function() {
                  catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
                });
                describe('and deleteState is resolved', function() {
                  beforeEach(function() {
                    this.deleteStateSpy.and.returnValue(of(null));
                  });
                  it('and getLatestMaster is resolved', async function() {
                    this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                    await service.getCatalogDetails(recordId)
                      .subscribe(response => {
                        expect(response).toEqual(this.expected2);
                      }, () => {
                        fail('Observable should have succeeded');
                      });
                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                    expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                  });
                  it('and getLatestMaster is rejected', async function() {
                    this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                    await service.getCatalogDetails(recordId).subscribe(() => {
                      fail('Observable should have errored');
                    }, response => {
                      expect(response).toEqual(this.error);
                    });
                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                    expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                  });
                });
                it('and deleteState is rejected', async function() {
                  this.deleteStateSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
                  }, response => {
                    expect(response).toEqual(this.error);
                  });
                  expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                  expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Commit 1234567890 does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                });
              });
            });
            describe('and getInProgressCommit is rejected', function() {
              describe('with a 404', function() {
                beforeEach(function() {
                  catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 404}));
                });
                it('and getCommit is resolved', async function() {
                  catalogManagerStub.getCommit.and.returnValue(of(commit));
                  await service.getCatalogDetails(recordId)
                    .subscribe(response => {
                      expect(response).toEqual(this.expected2);
                    }, () => {
                      fail('Observable should have succeeded');
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
                    catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
                  });
                  describe('and deleteState is resolved', function() {
                    beforeEach(function() {
                        this.deleteStateSpy.and.returnValue(of(null));
                    });
                    it('and getLatestMaster is resolved', async function() {
                      this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                      await service.getCatalogDetails(recordId)
                        .subscribe(response => {
                          expect(response).toEqual(this.expected2);
                        }, () => {
                          fail('Observable should have succeeded');
                        });
                      expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                      expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                      expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                      expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                      expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                      expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                    });
                    it('and getLatestMaster is rejected', async function() {
                      this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                      await service.getCatalogDetails(recordId).subscribe(() => {
                        fail('Observable should have errored');
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
                    this.deleteStateSpy.and.returnValue(throwError(this.error));
                    await service.getCatalogDetails(recordId).subscribe(() => {
                      fail('Observable should have errored');
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
                  catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 400}));
                });
                describe('and deleteState is resolved', function() {
                  beforeEach(function() {
                    this.deleteStateSpy.and.returnValue(of(null));
                  });
                  it('and getLatestMaster is resolved', async function() {
                    this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                    await service.getCatalogDetails(recordId)
                      .subscribe(response => {
                        expect(response).toEqual(this.expected2);
                      }, () => {
                        fail('Observable should have succeeded');
                      });
                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                    expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                    expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                    expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                    expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                  });
                  it('and getLatestMaster is rejected', async function() {
                    this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                    await service.getCatalogDetails(recordId).subscribe(() => {
                      fail('Observable should have errored');
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
                  this.deleteStateSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
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
              spyOn(service, 'updateState').and.returnValue(throwError(this.error));
            });
            describe('and deleteState is resolved', function() {
              beforeEach(function() {
                this.deleteStateSpy.and.returnValue(of(null));
              });
              it('and getLatestMaster is resolved', async function() {
                this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                await service.getCatalogDetails(recordId)
                  .subscribe(response => {
                    expect(response).toEqual(this.expected2);
                  }, () => {
                    fail('Observable should have succeeded');
                  });
                expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                expect(service.updateState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId});
                expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();

                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
              });
              it('and getLatestMaster is rejected', async function() {
                this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
              this.deleteStateSpy.and.returnValue(throwError(this.error));
              await service.getCatalogDetails(recordId).subscribe(() => {
                fail('Observable should have errored');
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
            catalogManagerStub.getInProgressCommit.and.returnValue(of(inProgressCommit));
          });
          it('and getCommit is resolved', async function() {
            catalogManagerStub.getCommit.and.returnValue(of(commit));
            await service.getCatalogDetails(recordId)
              .subscribe(response => {
                expect(response).toEqual(this.expected);
              }, () => {
                fail('Observable should have succeeded');
              });
            expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
            expect(this.deleteStateSpy).not.toHaveBeenCalled();
            expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
          });
          describe('and getCommit is rejected', function() {
            beforeEach(function() {
              catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
            });
            describe('and deleteState is resolved', function() {
              beforeEach(function() {
                this.deleteStateSpy.and.returnValue(of(null));
              });
              it('and getLatestMaster is resolved', async function() {
                this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                await service.getCatalogDetails(recordId)
                  .subscribe(response => {
                    expect(response).toEqual(this.expected2);
                  }, () => {
                    fail('Observable should have succeeded');
                  });
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
              });
              it('and getLatestMaster is rejected', async function() {
                this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
              this.deleteStateSpy.and.returnValue(throwError(this.error));
              await service.getCatalogDetails(recordId).subscribe(() => {
                fail('Observable should have errored');
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
              catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 404}));
            });
            it('and getCommit is resolved', async function() {
              catalogManagerStub.getCommit.and.returnValue(of(commit));
              await service.getCatalogDetails(recordId)
                .subscribe(response => {
                  expect(response).toEqual(this.expected2);
                }, () => {
                  fail('Observable should have succeeded');
                });
              expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
              expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
              expect(this.deleteStateSpy).not.toHaveBeenCalled();
              expect(this.getLatestMasterSpy).not.toHaveBeenCalled();
            });
            describe('and getCommit is rejected', function() {
              beforeEach(function() {
                catalogManagerStub.getCommit.and.returnValue(throwError(this.error));
              });
              describe('and deleteState is resolved', function() {
                beforeEach(function() {
                  this.deleteStateSpy.and.returnValue(of(null));
                });
                it('and getLatestMaster is resolved', async function() {
                  this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                  await service.getCatalogDetails(recordId)
                    .subscribe(response => {
                      expect(response).toEqual(this.expected2);
                    }, () => {
                      fail('Observable should have succeeded');
                    });
                  expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                  expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                  expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                  expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
                });
                it('and getLatestMaster is rejected', async function() {
                  this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                  await service.getCatalogDetails(recordId).subscribe(() => {
                    fail('Observable should have errored');
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
                this.deleteStateSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
              catalogManagerStub.getInProgressCommit.and.returnValue(throwError({status: 400}));
            });
            describe('and deleteState is resolved', function() {
              beforeEach(function() {
                this.deleteStateSpy.and.returnValue(of(null));
              });
              it('and getLatestMaster is resolved', async function() {
                this.getLatestMasterSpy.and.returnValue(of(this.expected2));
                await service.getCatalogDetails(recordId)
                  .subscribe(response => {
                    expect(response).toEqual(this.expected2);
                  }, () => {
                    fail('Observable should have succeeded');
                  });
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);

                expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
                expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
              });
              it('and getLatestMaster is rejected', async function() {
                this.getLatestMasterSpy.and.returnValue(throwError(this.error));
                await service.getCatalogDetails(recordId).subscribe(() => {
                  fail('Observable should have errored');
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
              this.deleteStateSpy.and.returnValue(throwError(this.error));
              await service.getCatalogDetails(recordId).subscribe(() => {
                fail('Observable should have errored');
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
        this.getLatestMasterSpy.and.returnValue(of(this.expected2));
        await service.getCatalogDetails(recordId)
          .subscribe(response => {
            expect(response).toEqual(this.expected2);
          }, () => {
            fail('Observable should have succeeded');
          });
        expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
        expect(this.getLatestMasterSpy).toHaveBeenCalledWith(recordId);
      });
      it('and getLatestMaster is rejected', async function() {
        this.getLatestMasterSpy.and.returnValue(throwError(this.error));
        await service.getCatalogDetails(recordId)
          .subscribe(() => {
            fail('Observable should have errored');
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
        catalogManagerStub.getRecordMasterBranch.and.returnValue(of(branch));
      });
      it('and createState is resolved', async function() {
        this.createStateSpy.and.returnValue(of(null));
        const expected = {
          recordId: recordId,
          branchId: branchId,
          commitId: commitId,
          upToDate: true,
          inProgressCommit: new Difference(),
        };
        await service.getLatestMaster(recordId)
          .subscribe(response => {
            expect(response).toEqual(expected);
          }, () => {
            fail('Observable should have succeeded');
          });
        expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.createState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId, branchId: branchId});
      });
      it('and createState is rejected', async function() {
        this.createStateSpy.and.returnValue(throwError(this.error));
        await service.getLatestMaster(recordId)
          .subscribe(() => {
            fail('Observable should have errored');
          }, response => {
            expect(response).toEqual(this.error);
          });
        expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.createState).toHaveBeenCalledWith({recordId: recordId, commitId: commitId, branchId: branchId});
      });
    });
    it('if getRecordMasterBranch is rejected', async function() {
      catalogManagerStub.getRecordMasterBranch.and.returnValue(throwError(this.error));
      await service.getLatestMaster(recordId)
        .subscribe(() => {
          fail('Observable should have errored');
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
      const data = new CommitDifference();
      data.additions = [{'@id': 'iri1', '@type': []}];
      data.deletions = [{'@id': 'iri2', '@type': []}];
      data.commit = commit;
      this.headers = {'has-more-results': 'true'};
      catalogManagerStub.getDifference.and.returnValue(of(new HttpResponse<CommitDifference>({body: data, headers: new HttpHeaders(this.headers)})));
      await service.getMergeDifferences('sourceId', 'targetId', 100, 0).subscribe(() => {
        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceId', 'targetId', 100, 0);
        expect(service.listItem.merge.difference.additions).toEqual(data.additions);
        expect(service.listItem.merge.difference.deletions).toEqual(data.deletions);
        expect(service.listItem.merge.difference.hasMoreResults).toBeTruthy();
      }, () => fail('Observable should have resolved'));
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
      catalogManagerStub.getDifference.and.returnValue(throwError('Error'));
      await service.getMergeDifferences('sourceId', 'targetId', 100, 0).subscribe(() => {}, error => {
        expect(error).toEqual('Error');
      });
      expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceId', 'targetId', 100, 0);
    });
  });
  describe('attemptMerge should return correctly if checkConflicts', function() {
    beforeEach(function() {
      this.checkConflictsSpy = spyOn(service, 'checkConflicts').and.returnValue(of(null));
      this.mergeSpy = spyOn(service, 'merge').and.returnValue(of(null));
    });
    describe('resolves and merge', function() {
      it('resolves', async function() {
        await service.attemptMerge()
          .subscribe(() => {}, () => {
            fail('Observable should have succeeded');
          });
        expect(service.checkConflicts).toHaveBeenCalledWith();
        expect(this.mergeSpy).toHaveBeenCalledWith();
      });
      it('rejects', async function() {
        this.mergeSpy.and.returnValue(throwError('Error'));
        await service.attemptMerge()
          .subscribe(() => {
            fail('Observable should have errored');
          }, response => {
            expect(response).toEqual('Error');
          });
        expect(service.checkConflicts).toHaveBeenCalledWith();
        expect(this.mergeSpy).toHaveBeenCalledWith();
      });
    });
    it('rejects', async function() {
        this.checkConflictsSpy.and.returnValue(throwError('Error'));
        await service.attemptMerge()
            .subscribe(() => {
                fail('Observable should have errored');
            }, response => {
                expect(response).toEqual('Error');
            });
        expect(this.checkConflictsSpy).toHaveBeenCalledWith();
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
        catalogManagerStub.getBranchConflicts.and.returnValue(of([]));
        await service.checkConflicts()
          .subscribe(() => {}, () => {
              fail('Observable should have succeeded');
          });
        expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId);
        expect(service.listItem.merge.conflicts).toEqual([]);
      });
      it('conflicts', async function() {
        catalogManagerStub.getBranchConflicts.and.returnValue(of([{
          iri: '',
          left: new Difference(),
          right: new Difference(),
        }]));
        await service.checkConflicts()
          .subscribe(() => {
            fail('Observable should have errored');
          }, response => {
            expect(response).toEqual(new Error('Conflicts found'));
          });
        expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId);
        expect(service.listItem.merge.conflicts[0].resolved).toBeFalse();
      });
    });
    it('rejects', async function() {
      catalogManagerStub.getBranchConflicts.and.returnValue(throwError('Error'));
      await service.checkConflicts()
        .subscribe(() => {
          fail('Observable should have errored');
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
      difference: new Difference(),
      conflicts: [{
        iri: 'iri',
        left: new Difference(),
        right: new Difference(),
        resolved: false
      }],
      resolutions: new Difference(),
      startIndex: 100
    };
    (service.listItem.merge.resolutions.additions as JSONLDObject[]).push({'@id': '', '@type': []});
    (service.listItem.merge.resolutions.deletions as JSONLDObject[]).push({'@id': '', '@type': []});
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
  it('reset should rest the entire service', function() {
    service.list = [service.listItem];
    service.uploadList = [{
      sub: undefined,
      status: undefined,
      title: '',
      id: '',
      error: undefined
    }];
    service.uploadPending = 1;
    service.reset();
    expect(service.list).toEqual([]);
    expect(service.listItem).toBeUndefined();
    expect(service.uploadList).toEqual([]);
    expect(service.uploadPending).toEqual(0);
  });
  describe('saveCurrentChanges should call the proper methods when', function() {
    beforeEach(function() {
      service.listItem = new VersionedRdfListItem();
      service.listItem.additions = [{'@id': 'add'}];
      service.listItem.deletions = [{'@id': 'del'}];
      this.difference = new Difference(service.listItem.additions, service.listItem.deletions);
    });
    describe('updateInProgressCommit resolves', function() {
      beforeEach(function() {
        catalogManagerStub.updateInProgressCommit.and.returnValue(of(null));
      });
      describe('and getInProgressCommit resolves', function() {
        describe('and inProgressCommit is empty', function() {
          beforeEach(function() {
            catalogManagerStub.getInProgressCommit.and.returnValue(of(new Difference()));
          });
          describe('and deleteInProgressCommit resolves', function() {
            beforeEach(function() {
              catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
            });
            describe('and getStateByRecordId is empty', function() {
              beforeEach(function() {
                spyOn(service, 'getStateByRecordId').and.returnValue(undefined);
                spyOn(service, 'updateState');
              });
              it('and createState resolves', fakeAsync(function() {
                spyOn(service, 'createState').and.returnValue(of(null));
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
              }));
              it('and createState rejects', fakeAsync(function() {
                spyOn(service, 'createState').and.returnValue(throwError(error));
                service.saveCurrentChanges()
                  .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
              }));
            });
            describe('and getStateByRecordId is present', function() {
              beforeEach(function() {
                spyOn(service, 'getStateByRecordId').and.returnValue({id: 'id', model: []});
                spyOn(service, 'createState');
              });
              it('and updateState resolves', fakeAsync(function() {
                spyOn(service, 'updateState').and.returnValue(of(null));
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
              }));
              it('and updateState rejects', fakeAsync(function() {
                spyOn(service, 'updateState').and.returnValue(throwError(error));
                service.saveCurrentChanges()
                  .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId });
              }));
            });
          });
          it('and deleteInProgressCommit rejects', fakeAsync(function() {
            spyOn(service, 'getStateByRecordId');
            spyOn(service, 'createState');
            spyOn(service, 'updateState');
            catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(error));
            service.saveCurrentChanges()
              .subscribe(() => fail('Observable should have rejected'), response => {
                expect(response).toEqual(error);
              });
            tick();
            expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
            expect(service.listItem.inProgressCommit).toEqual(new Difference());
            expect(service.listItem.additions).toEqual([]);
            expect(service.listItem.deletions).toEqual([]);
            expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
            expect(service.getStateByRecordId).not.toHaveBeenCalled();
            expect(service.createState).not.toHaveBeenCalled();
            expect(service.updateState).not.toHaveBeenCalled();
          }));
        });
        describe('and inProgressCommit has changes', function() {
          beforeEach(function() {
            catalogManagerStub.getInProgressCommit.and.returnValue(of(this.difference));
          });
          describe('and getStateByRecordId is empty', function() {
            beforeEach(function() {
              spyOn(service, 'getStateByRecordId').and.returnValue(undefined);
              spyOn(service, 'updateState');
            });
            it('and createState resolves', fakeAsync(function() {
              spyOn(service, 'createState').and.returnValue(of(null));
              service.saveCurrentChanges()
                .subscribe(() => {}, () => {
                  fail('Observable should have resolved');
                });
              tick();
              expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
              expect(service.listItem.inProgressCommit).toEqual(this.difference);
              expect(service.listItem.additions).toEqual([]);
              expect(service.listItem.deletions).toEqual([]);
              expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
              expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
              expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
              expect(service.updateState).not.toHaveBeenCalled();
            }));
            it('and createState rejects', fakeAsync(function() {
              spyOn(service, 'createState').and.returnValue(throwError(error));
              service.saveCurrentChanges()
                .subscribe(() => fail('Observable should have rejected'), response => {
                  expect(response).toEqual(error);
                });
              tick();
              expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
              expect(service.listItem.inProgressCommit).toEqual(this.difference);
              expect(service.listItem.additions).toEqual([]);
              expect(service.listItem.deletions).toEqual([]);
              expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
              expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
              expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
              expect(service.updateState).not.toHaveBeenCalled();
            }));
          });
          describe('and getStateByRecordId is present', function() {
            beforeEach(function() {
              spyOn(service, 'getStateByRecordId').and.returnValue({id: 'id', model: []});
              spyOn(service, 'createState');
            });
            it('and updateState resolves', fakeAsync(function() {
              spyOn(service, 'updateState').and.returnValue(of(null));
              service.saveCurrentChanges()
                .subscribe(() => {}, () => {
                  fail('Observable should have resolved');
                });
              tick();
              expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
              expect(service.listItem.inProgressCommit).toEqual(this.difference);
              expect(service.listItem.additions).toEqual([]);
              expect(service.listItem.deletions).toEqual([]);
              expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
              expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
              expect(service.createState).not.toHaveBeenCalled();
              expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
            }));
            it('and updateState rejects', fakeAsync(function() {
              spyOn(service, 'updateState').and.returnValue(throwError(error));
              service.saveCurrentChanges()
                .subscribe(() => fail('Observable should have rejected'), response => {
                  expect(response).toEqual(error);
                });
              tick();
              expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
              expect(service.listItem.inProgressCommit).toEqual(this.difference);
              expect(service.listItem.additions).toEqual([]);
              expect(service.listItem.deletions).toEqual([]);
              expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
              expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
              expect(service.createState).not.toHaveBeenCalled();
              expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
            }));
          });
        });
      });
      it('when getInProgressCommit rejects', fakeAsync(function() {
        spyOn(service, 'getStateByRecordId');
        spyOn(service, 'createState');
        spyOn(service, 'updateState');
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(error));
        service.saveCurrentChanges()
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
        expect(service.getStateByRecordId).not.toHaveBeenCalled();
        expect(service.createState).not.toHaveBeenCalled();
        expect(service.updateState).not.toHaveBeenCalled();
      }));
    });
    it('updateInProgressCommit rejects', fakeAsync(function() {
      spyOn(service, 'getStateByRecordId');
      spyOn(service, 'createState');
      spyOn(service, 'updateState');
      catalogManagerStub.updateInProgressCommit.and.returnValue(throwError(error));
      service.saveCurrentChanges()
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, this.difference);
      expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
      expect(service.getStateByRecordId).not.toHaveBeenCalled();
      expect(service.createState).not.toHaveBeenCalled();
      expect(service.updateState).not.toHaveBeenCalled();
    }));
  });
});
