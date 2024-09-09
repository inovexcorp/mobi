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
import { Injectable } from '@angular/core';
import { find, get, isEmpty, some } from 'lodash';
import { map, switchMap, tap } from 'rxjs/operators';
import { Observable, of, merge as rxjsMerge, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import { CatalogManagerService } from './catalogManager.service';
import { RecordSelectFiltered } from '../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { Difference } from '../models/difference.class';
import { RdfUpload } from '../models/rdfUpload.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { CatalogDetails, VersionedRdfState } from './versionedRdfState.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { BRANCHID, COMMITID, SHAPESGRAPHSTATE, TAGID, GRAPHEDITOR, CATALOG, SHAPESGRAPHEDITOR } from '../../prefixes';
import { StateManagerService } from './stateManager.service';
import { PolicyManagerService } from './policyManager.service';
import { ToastService } from './toast.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { getBeautifulIRI, getDctermsValue, getPropertyId } from '../utility';
import { XACMLRequest } from '../models/XACMLRequest.interface';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { EventPayload, EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';

/**
 * @class shared.ShapesGraphStateService
 *
 * A service which contains various variables to hold the state of the Shapes Graph editor
 */
@Injectable()
export class ShapesGraphStateService extends VersionedRdfState<ShapesGraphListItem> {

  type = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;

  constructor(protected sm: StateManagerService,
              protected cm: CatalogManagerService,
              protected mrm: MergeRequestManagerService,
              protected toast: ToastService,
              protected pep: PolicyEnforcementService,
              private pm: PolicyManagerService,
              private sgm: ShapesGraphManagerService) {
    super(SHAPESGRAPHSTATE,
      BRANCHID,
      TAGID,
      COMMITID,
      GRAPHEDITOR
    );
    // Watch for Merge Request and Catalog actions
    rxjsMerge(
      mrm.mergeRequestAction$,
      cm.catalogManagerAction$
    ).pipe(
      switchMap((event: EventWithPayload) => {
        const eventType = event?.eventType;
        const payload = event?.payload;
        if (eventType && payload){
          const ob = this._handleEventWithPayload(eventType, payload);
          if (!ob) {
            return of(false);
          }
          return ob;
        } else {
          toast.createErrorToast('Event type and payload is required');
          return of(false);
        }
      })
    ).subscribe();
  }
  // Updates state based on Event type. Handles branch removals and accept merge requests.
  _handleEventWithPayload(eventType: string, payload: EventPayload): Observable<null> {
    if (eventType === EventTypeConstants.EVENT_BRANCH_REMOVAL) {
      return this._handleEventBranchRemoval(payload);
    } else if (eventType === EventTypeConstants.EVENT_MERGE_REQUEST_ACCEPTED) {
      return this._handleEventMergeRequestAcceptance(payload);
    } else {
      console.warn('Event type is not valid');
      return of(null);
    }
  }
  // Updates state if a branch was removed
  _handleEventBranchRemoval(payload: EventPayload): Observable<null> {
    const recordId = get(payload, 'recordId');
    const branchId = get(payload, 'branchId');
    if (recordId && branchId) {
      const recordExistInList = some(this.list, {versionedRdfRecord: {recordId: recordId}});
      if (recordExistInList) {
        return this.deleteBranchState(recordId, branchId);
      } else {
        return of(null);
      }
    } else {
      console.warn('EVENT_BRANCH_REMOVAL is missing recordIri or branchId');
      return of(null);
    }
  }
  // Updates state if a merge request has been accepted
  _handleEventMergeRequestAcceptance(payload: EventPayload): Observable<null> {
    const recordId = get(payload, 'recordId');
    const targetBranchId = get(payload, 'targetBranchId');
    if (recordId && targetBranchId) {
      const recordExistInList = some(this.list, {versionedRdfRecord: {recordId: recordId}});
      if (recordExistInList) {
        if (!isEmpty(this.listItem)) {
          if (get(this.listItem, 'versionedRdfRecord.branchId') === targetBranchId) {
            this.listItem.upToDate = false;
            if (this.listItem.merge.active) {
              this.toast.createWarningToast('You have a merge in progress in the Shape Graph Editor that '
                + 'is out of date. Please reopen the merge form.', { timeOut: 5000 });
            }
          }
          if (this.listItem.merge.active && get(this.listItem.merge.target, '@id') === targetBranchId) {
            this.toast.createWarningToast('You have a merge in progress in the Shape Graph Editor that is '
              + 'out of date. Please reopen the merge form to avoid conflicts.', { timeOut: 5000 });
          }
        }
        return of(null);
      } else {
        return of(null);
      }
    } else {
        console.warn('EVENT_MERGE_REQUEST_ACCEPTED is missing recordIri or targetBranchId');
        return of(null);
    }
  }
  /**
   * Runs initialization logic for the service.
   */
  initialize(): void {
    this.catalogId = get(this.cm.localCatalog, '@id', '');
  }

  // Abstract Methods
  /**
   * Returns the namespace to be used for new ShapesGraphRecords
   */
  getDefaultNamespace(): Observable<string> {
    return of('http://mobi.solutions/ontologies/shapes-graph/');
  }
  /**
   * Returns the display name of an entity within the currently selected ShapesGraphRecord. Currently just returns the
   * beautiful IRI.
   */
  getEntityName(entityId: string): string {
    return getBeautifulIRI(entityId);
  }
  /**
   * Returns the Shapes Graph IRI of the data associated with a ShapesGraphRecord. If no JSON-LD Object of the Record
   * is provided, will pull the identifier IRI from the currently selected listItem.
   */
  getIdentifierIRI(record?: JSONLDObject): string {
    return record ? getPropertyId(record, `${SHAPESGRAPHEDITOR}shapesGraphIRI`) : this.listItem.shapesGraphId;
  }
  /**
   * Opens the ShapesGraphRecord identified by the provided details in the Shapes Editor.
   */
  open(record: RecordSelectFiltered): Observable<null> {
    const existingListItem = this.list.find(listItem => listItem.versionedRdfRecord.recordId === record.recordId);
    if (existingListItem) {
      this.listItem = existingListItem;
      return of(null);
    }
    return this.getCatalogDetails(record.recordId).pipe(
      switchMap((response: CatalogDetails) => {
        const listItem = new ShapesGraphListItem();
        listItem.versionedRdfRecord = {
          title: record.title,
          recordId: response.recordId,
          branchId: response.branchId,
          commitId: response.commitId,
          tagId: response.tagId
        };
        listItem.inProgressCommit.additions = response.inProgressCommit.additions;
        listItem.inProgressCommit.deletions = response.inProgressCommit.deletions;
        listItem.changesPageOpen = false;
        listItem.upToDate = response.upToDate;

        this.listItem = listItem;
        this.list.push(listItem);
        return this.updateShapesGraphMetadata(response.recordId, response.branchId, response.commitId);
      })
    );
  }
  /**
   * Creates a new ShapesGraphRecord given the provided details, but will not open it immediately in the Shapes Editor.
   */
  create(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse> {
    if (rdfUpload.jsonld || rdfUpload.file) {
      return this.sgm.createShapesGraphRecord(rdfUpload, true);
    } else {
      return throwError('Creation requires a file or JSON-LD');
    }
  }
  /**
   * Creates a new ShapesGraphRecord given the provided details and will open it immediately on the MASTER branch in
   * the Shapes Editor.
   */
  createAndOpen(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse> {
    if (rdfUpload.jsonld || rdfUpload.file) {
      return this.sgm.createShapesGraphRecord(rdfUpload).pipe(
        switchMap((response: VersionedRdfUploadResponse) => {
          const listItem = new ShapesGraphListItem();
          listItem.shapesGraphId = response.shapesGraphId;
          listItem.masterBranchIri = response.branchId;
          listItem.versionedRdfRecord = {
            title: response.title,
            recordId: response.recordId,
            branchId: response.branchId,
            commitId: response.commitId
          };
          listItem.currentVersionTitle = 'MASTER';
          return this.sgm.getShapesGraphMetadata(listItem.versionedRdfRecord.recordId,
            listItem.versionedRdfRecord.branchId,
            listItem.versionedRdfRecord.commitId,
            listItem.shapesGraphId
          ).pipe(
            switchMap((arr: string | JSONLDObject[]) => {
              listItem.metadata = find((arr as JSONLDObject[]), {'@id': listItem.shapesGraphId});
              return this.sgm.getShapesGraphContent(listItem.versionedRdfRecord.recordId,
                listItem.versionedRdfRecord.branchId,
                listItem.versionedRdfRecord.commitId
              );
            }),
            switchMap((content: string | JSONLDObject[]) => {
              listItem.content = content as string;
              const stateBase: VersionedRdfStateBase = {
                recordId: response.recordId,
                commitId: response.commitId,
                branchId: response.branchId
              };
              return this.createState(stateBase);
            }),
            tap(() => {
              listItem.userCanModify = true;
              listItem.userCanModifyMaster = true;
              this.listItem = listItem;
              this.list.push(this.listItem);
            })
          );
        }),
        map(() => ({
          recordId: this.listItem.versionedRdfRecord.recordId,
          branchId: this.listItem.versionedRdfRecord.branchId,
          commitId: this.listItem.versionedRdfRecord.commitId,
          title: this.listItem.versionedRdfRecord.title,
          shapesGraphId: this.listItem.shapesGraphId,
        }))
      );
    } else {
      return throwError('Creation requires a file or JSON-LD');
    }
  }
  /**
   * Deletes the ShapesGraphRecord identified by the record IRI starting with its state then the record itself.
   */
  delete(recordId: string): Observable<void> {
    return this.deleteState(recordId).pipe(
      switchMap(() => this.cm.deleteRecord(recordId, this.catalogId))
    );
  }
  /**
   * Downloads a specific ShapesGraphRecord's data. Calls the Shapes Graph endpoint.
   */
  download(rdfDownload: RdfDownload): void {
    this.sgm.downloadShapesGraph(rdfDownload);
  }
  /**
   * Removes the user's In Progress Commit for the currently selected ShapesGraphRecord. Calls the Catalog endpoint,
   * then clears the frontend cached In Progress Commit and updates the Shapes Graph data back to the currently checked
   * out version.
   */
  removeChanges(): Observable<null> {
    return this.cm.deleteInProgressCommit(this.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(
      switchMap(() => {
        this.clearInProgressCommit();
        return this.updateShapesGraphMetadata(this.listItem.versionedRdfRecord.recordId,
          this.listItem.versionedRdfRecord.branchId,
          this.listItem.versionedRdfRecord.commitId
        );
      }));
  }
  /**
   * Handles uploading changes to the ShapesGraphRecord identified by the provided details. Calls the Shapes Graph
   * endpoint, then fetches the In Progress Commit, updates the frontend cached In Progress Commit, and updates the
   * Shapes Graph data to the updated data.
   */
  uploadChanges(rdfUpdate: RdfUpdate): Observable<null> {
    return this.sgm.uploadChanges(rdfUpdate).pipe(
      switchMap((response) => {
        if (response.status === 204) {
          return throwError('No changes');
        }
        return this.cm.getInProgressCommit(rdfUpdate.recordId, this.catalogId);
      }),
      switchMap((inProgressCommit: Difference) => {
        const listItem = this.getListItemByRecordId(rdfUpdate.recordId);
        listItem.inProgressCommit = inProgressCommit;
        return this.updateShapesGraphMetadata(rdfUpdate.recordId, rdfUpdate.branchId, rdfUpdate.commitId);
      })
    );
  }
  /**
   * Updates the ShapesGraphRecord associated with the provided record IRI when the checked out version changes.
   * Recreates the listItem with the provided version details, the original record title, removes the In Progress
   * Commit from the listItem if specified, swaps the item out in place in the list, then updates the Shapes Graph
   * data to the version's data.
   */
  changeVersion(recordId: string, branchId: string, commitId: string, tagId: string, versionTitle: string,
    upToDate: boolean, clearInProgressCommit = false, changesPageOpen = false): Observable<null> {
    const state: VersionedRdfStateBase = {
      recordId,
      branchId,
      commitId,
      tagId
    };
    return this.updateState(state).pipe(
      switchMap(() => {
        const oldListItem = this.getListItemByRecordId(recordId);
        if (oldListItem) {
          const title = oldListItem.versionedRdfRecord.title;
          const item = new ShapesGraphListItem();
          item.versionedRdfRecord = {
            recordId,
            branchId,
            commitId,
            tagId,
            title
          };
          item.currentVersionTitle = versionTitle ? versionTitle : oldListItem.currentVersionTitle;
          if (oldListItem.inProgressCommit && !clearInProgressCommit) {
            item.inProgressCommit = oldListItem.inProgressCommit;
          }
          if (clearInProgressCommit) {
            item.inProgressCommit = new Difference();
          }
          item.changesPageOpen = changesPageOpen;
          item.upToDate = upToDate;
          const idx = this.list.indexOf(oldListItem);
          this.list[idx] = item;
          this.listItem = item;
          return this.updateShapesGraphMetadata(item.versionedRdfRecord.recordId,
            item.versionedRdfRecord.branchId,
            item.versionedRdfRecord.commitId
          );
        }
        return of(null);
      })
    );
  }
  /**
   * Performs a merge of the selected source/current branch of the currently selected ShapesGraphRecord into the
   * selected target branch with any chosen resolutions. Updates the Shapes Graph data to the new merge commit's data.
   * Handles deleting the source branch if the checkbox was marked. Will not open the changes page.
   */
  merge(): Observable<null> {
    const sourceId = this.listItem.versionedRdfRecord.branchId;
    const shouldDelete = this.listItem.merge.checkbox;
    return this.cm.mergeBranches(sourceId, this.listItem.merge.target['@id'],
      this.listItem.versionedRdfRecord.recordId,
      this.catalogId,
      this.listItem.merge.resolutions,
      this.listItem.merge.conflicts
    ).pipe(
      switchMap(commit =>
        // changeVersion called before branch deletion in order to avoid a race condition with the branch deletion event handler
        this.changeVersion(this.listItem.versionedRdfRecord.recordId,
          this.listItem.merge.target['@id'],
          commit,
          undefined,
          getDctermsValue(this.listItem.merge.target, 'title'), true, false, false)
      ),
      switchMap(() => {
        if (shouldDelete) {
          return this.cm.deleteRecordBranch(this.listItem.versionedRdfRecord.recordId, sourceId, this.catalogId);
        } else {
          return of(null);
        }
      })
    );
  }

  // Custom methods
  /**
   * Updates the shapes graph metadata for the given recordId, branchId, commitId combination. Retrieves the
   * shapesGraphId as well. Should be used in cases where the shapesGraphId may have been changed in the backend.
   * Applies the inProgressCommit when retrieving data.
   *
   * @param {string} recordId the IRI of the record to retrieve metadata for.
   * @param {string} branchId the IRI of the branch to retrieve metadata for.
   * @param {string} commitId the IRI of the commit to retrieve metadata for.
   * @returns {Observable} An Observable that resolves if the metadata update was successful; otherwise fails with either an
   *    error string or a {@link RESTError} object.
   */
  updateShapesGraphMetadata(recordId: string, branchId: string, commitId: string): Observable<null> {
    const listItem = this.getListItemByRecordId(recordId);
    return this.sgm.getShapesGraphIRI(recordId, branchId, commitId).pipe(
      switchMap((shapesGraphId: string) => {
        listItem.shapesGraphId = shapesGraphId;
        return this.sgm.getShapesGraphMetadata(listItem.versionedRdfRecord.recordId,
          listItem.versionedRdfRecord.branchId,
          listItem.versionedRdfRecord.commitId,
          listItem.shapesGraphId
        );
      }),
      switchMap((arr: string | JSONLDObject[]) => {
        listItem.metadata = find((arr as JSONLDObject[]), {'@id': listItem.shapesGraphId});
        return this.sgm.getShapesGraphContent(listItem.versionedRdfRecord.recordId,
          listItem.versionedRdfRecord.branchId,
          listItem.versionedRdfRecord.commitId
        );
      }),
      switchMap((content: string | JSONLDObject[]) => {
        listItem.content = content as string;
        return this.cm.getRecordBranches(recordId, this.catalogId);
      }),
      switchMap((branches: HttpResponse<JSONLDObject[]>) => {
        const masterBranch = branches.body.find(branch => getDctermsValue(branch, 'title') === 'MASTER');
        listItem.masterBranchIri = masterBranch ? masterBranch['@id'] : '';
        const modifyRequest: XACMLRequest = {
          resourceId: listItem.versionedRdfRecord.recordId,
          actionId: this.pm.actionModify
        };
        return this.pep.evaluateRequest(modifyRequest);
      }),
      switchMap((decision: string) => {
        const modifyMasterRequest: XACMLRequest = {
          resourceId: listItem.versionedRdfRecord.recordId,
          actionId: this.pm.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: listItem.masterBranchIri }
        };
        listItem.userCanModify = decision === this.pep.permit;
        return this.pep.evaluateRequest(modifyMasterRequest);
      }),
      switchMap((decision: string) => {
        listItem.userCanModifyMaster = decision === this.pep.permit;
        return of(null);
      })
    );
  }
}
