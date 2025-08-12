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
import { HttpResponse } from '@angular/common/http';

import {
  cloneDeep,
  concat,
  find,
  get,
  has,
  head,
  includes,
  isEmpty,
  isEqual,
  join,
  mergeWith,
  orderBy,
  remove
} from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { v4 } from 'uuid';

import { CATALOG } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { CommitDifference } from '../models/commitDifference.interface';
import {
  condenseCommitId,
  getEntityName,
  getEntityNames,
  getPropertyId,
  isBlankNodeId,
  mergingArrays
} from '../utility';
import { Difference } from '../models/difference.class';
import { ImportedOntology } from '../models/shapesGraphImports.interface';
import { JSONLDId } from '../models/JSONLDId.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { JSONLDValue } from '../models/JSONLDValue.interface';
import { ManchesterConverterService } from './manchesterConverter.service';
import { PrefixationPipe } from '../pipes/prefixation.pipe';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { RecordSelectFiltered } from '../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { State } from '../models/state.interface';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { UploadItem } from '../../versioned-rdf-record-editor/models/upload-item.interface';
import { VersionedRdfListItem } from '../models/versionedRdfListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';

export interface CatalogDetails {
  recordId: string;
  branchId: string;
  commitId: string;
  tagId?: string;
  upToDate: boolean;
  inProgressCommit: Difference;
}

export interface BlankNodeIndex {
  [key: string]: { position: number };
}

/**
 * Service for common VersionedRdfState methods to be used in the ontology-editor or shapes-graph-editor.
 */
export abstract class VersionedRdfState<T extends VersionedRdfListItem> {
  protected sm: StateManagerService;
  protected cm: CatalogManagerService;
  protected toast: ToastService;
  protected prefixation: PrefixationPipe;
  protected mc: ManchesterConverterService;
  /**
   * The namespace of the specific VersionedRDFRecord type's state triples.
   */
  protected stateOntologyNamespace: string;
  /**
   * The namespace for branch states for the specific VersionedRDFRecord type.
   */
  protected branchStateNamespace: string;
  /**
   * The namespace for tag states for the specific VersionedRDFRecord type.
   */
  protected tagStateNamespace: string;
  /**
   * The namespace for commit states for the specific VersionedRDFRecord type.
   */
  protected commitStateNamespace: string;
  /**
   * The IRI of the Application associated with the specific VersionedRDFRecord type. Used for state management.
   */
  protected application: string;
  /**
   * The IRI of the catalog all the VersionedRDFRecords are associated with.
   */
  protected catalogId: string;
  /**
   * A list of reference keys to be excluded from update operations.
   * This array contains the names of properties that should not
   * be considered when performing reference updates in a system or application.
   *
   * @type {string[]}
   */
  protected _updateRefsExclude: string[] = [
    'element',
    'usagesElement',
    'branches',
    'tags',
    'failedImports',
    'openSnackbar',
    'versionedRdfRecord',
    'merge',
    'selectedCommit',
    'nodes'
  ];

  /**
   * The IRI string of the type of VersionedRDFRecord.
   */
  public type: string;
  /**
   * The list of opened VersionedRDFRecords associated with this state service.
   */
  public list: T[];
  /**
   * The currently selected VersionedRDFRecord associated with this state service.
   */
  public listItem: T | undefined;
  /**
   * `uploadList` holds an array of upload objects which contain properties about uploaded files for the specific
   * type of VersionedRDFRecord.
   * @type {UploadItem[]}
   */
  public uploadList: UploadItem[] = [];
  /**
   * `uploadFiles` holds the number of pending uploads.
   * @type {number}
   */
  public uploadPending = 0;

  protected constructor(
    stateOntologyNamespace: string,
    branchStateNamespace: string,
    tagStateNamespace: string,
    commitStateNamespace: string,
    application: string
  ) {
    this.stateOntologyNamespace = stateOntologyNamespace;
    this.branchStateNamespace = branchStateNamespace;
    this.tagStateNamespace = tagStateNamespace;
    this.commitStateNamespace = commitStateNamespace;
    this.application = application;
    this.list = [];
  }

  /**
   * Returns the namespace that should be used for all new entities created within the current Versioned RDF editor.
   *
   * @returns {Observable} An Observable with the string namespace to be used for all new IRIs
   */
  abstract getDefaultNamespace(): Observable<string>;

  /**
   * Gets the name of the entity.
   *
   * @param {string} entity - The JSONLDObject representing the entity.
   * @return {string} - The name of the entity.
   */
  abstract getEntityName(entity: string): string;
  /**
   * Returns the singular IRI that represents the content of an VersionedRDFRecord. If no JSON-LD Object of the Record
   * is provided, will pull the identifier IRI from the currently selected listItem.
   *
   * @param {JSONLDObject} record The optional JSON-LD of a VersionedRDFRecord to pull the identifier IRI from
   * @returns {string} The identifier IRI of a VersionedRDFRecord
   */
  abstract getIdentifierIRI(record?: JSONLDObject): string;
  /**
   * Opens the VersionedRDFRecord identified by the provided details into the current Versioned RDF Editor.
   *
   * @param {RecordSelectFiltered} record The representation of the VersionedRDFRecord that should be opened
   * @returns {Observable} An Observable that succeeds once the VersionedRDFRecord is opened successfully; fails
   *    otherwise
   */
  abstract open(record: RecordSelectFiltered): Observable<null>;
  /**
   * Creates a new VersionedRDFRecord of the appropriate type given the provided details. Will create the
   * VersionedRDFRecord, but will not open it immediately in the current Versioned RDF editor.
   *
   * @param {RdfUpload} rdfUpload The details of the creation operation to be performed
   * @returns {Observable} An Observable with the returned details of the newly created VersionedRDFRecord; fails
   *    otherwise
   */
  abstract create(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse>;
  /**
   * Creates a new VersionedRDFRecord of the appropriate type given the provided details. Will create the
   * VersionedRDFRecord and will open it immediately in the current Versioned RDF editor.
   *
   * @param {RdfUpload} rdfUpload The details of the creation operation to be performed
   * @returns {Observable} An Observable with the returned details of the newly created VersionedRDFRecord; fails
   *    otherwise
   */
  abstract createAndOpen(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse>;
  /**
   * Deletes the VersionedRDFRecord identified by its IRI.
   *
   * @param {string} recordId The IRI of the VersionedRDFRecord that should be deleted
   * @returns {Observable} An Observable that indicates the success of the deletion
   */
  abstract delete(recordId: string): Observable<void>;
  /**
   * Performs a download of the VersionedRDFRecord identified by the provided details.
   *
   * @param {RdfDownload} rdfDownload The details of the download to be performed
   */
  abstract download(rdfDownload: RdfDownload): void;
  /**
   * Removes the In Progress Commit from the currently selected listItem and performs all necessary cleanup afterwards
   * @returns {Observable} An Observable indicating the success of the operation
   */
  abstract removeChanges(): Observable<null>;
  /**
   * Uploads changes to the identified VersionedRDFRecord given the details provided.
   *
   * @param {RdfUpdate} rdfUpdate The details of the upload operation to be performed
   * @returns {Observable} An Observable that succeeds when the upload operation completes; fails otherwise
   */
  abstract uploadChanges(rdfUpdate: RdfUpdate): Observable<null>;
  /**
   * Updates the listItem for the VersionedRDFRecord identified by the provided IRI based on the other provided
   * details. Should take into account all provided parameters and update the listItem accordingly.
   *
   * @param {string} recordId The IRI of the VersionedRDFRecord in question
   * @param {string} branchId The optional IRI of the Branch the listItem should be opened on
   * @param {string} commitId  The optional IRI of the Commit the listItem should be opened on
   * @param {string} tagId The optional IRI of the Tag the listItem should be opened on
   * @param {string} versionTitle The name that should be displayed in the branch select of the Versioned RDF editor
   * @param {boolean} upToDate Whether the listItem is up to date (i.e. on the head commit of the checked out branch)
   * @param {boolean} clearInProgressCommit Whether to clear the In Progress Commit as part of changing the version
   * @param {boolean} changesPageOpen Whether the changes page should be opened during the version change
   * @returns {Observable} An Observable indicating the success of the operation
   */
  abstract changeVersion(
    recordId: string,
    branchId: string,
    commitId: string,
    tagId: string,
    versionTitle: string,
    upToDate: boolean,
    clearInProgressCommit: boolean,
    changesPageOpen: boolean
  ): Observable<null>;
  /**
   * Merges the currently selected VersionedRDFRecord's branches.
   *
   * @returns {Observable} An Observable that resolves if the merge was successful; fails otherwise
   */
  abstract merge(): Observable<null>;

  /**
   * Validates whether what the user is currently viewing in the listItem associated with the provided
   * VersionedRDFRecord IRI still exists. Meant to be called after a Branch or Tag is deleted.
   *
   * @param {string} recordId The IRI of the VersionedRDFRecord to validate
   * @returns {Observable} An Observable that succeeds if the current state still exists; fails otherwise
   */
  validateCurrentStateExists(recordId: string): Observable<void> {
    const currentState = this.getCurrentStateByRecordId(recordId);
    if (!this.isStateBranch(currentState)) {
      return this.cm
        .getCommit(getPropertyId(currentState, `${this.stateOntologyNamespace}commit`))
        .pipe(map(() => {}));
    } else {
      return of(null);
    }
  }
  /**
   * Closes the the open listItem associated with the provided VersionedRDFRecord IRI.
   *
   * @param {string} recordId The IRI of the VersionedRDFRecord that should be closed
   */
  close(recordId: string): void {
    remove(this.list, item => item.versionedRdfRecord.recordId === recordId);
  }
  /**
   * Determines whether the current state of the current listItem is committable, i.e. whether a commit can be made.
   * Takes into account whether there is an In Progress Commit.
   *
   * @returns {boolean} True if a commit can be made; false otherwise
   */
  isCommittable(): boolean {
    const additionsExist = !!this?.listItem?.inProgressCommit?.additions.length;
    const deletionsExist = !!this?.listItem?.inProgressCommit?.deletions.length;
    const recordIdExists = !!this?.listItem?.versionedRdfRecord?.recordId;
    return (additionsExist || deletionsExist) && recordIdExists;
  }
  /**
   * Determines whether the current user can modify the current state of the current listItem. Takes into account
   * whether a branch is checked out and whether it is the MASTER branch.
   *
   * @returns {boolean} True if the current user is allowed to modify the current state; false otherwise
   */
  canModify(): boolean {
    if (this.listItem) {
      if (!this.listItem.versionedRdfRecord.branchId) {
        return false;
      }
      if (this.listItem.masterBranchIri === this.listItem.versionedRdfRecord.branchId) {
        return this.listItem.userCanModifyMaster;
      } else {
        return this.listItem.userCanModify;
      }
    } else {
      return false; // This occurs when auth interceptor clears the state
    }
  }

  /**
   * Determines whether the current user can modify the entity rdf types
   *
   * @returns {boolean} True if the current user is allowed to modify the current entity types ; false otherwise
   */
  abstract canModifyEntityTypes(entity: JSONLDObject): boolean;

  /**
   * Resets the additions and deletions in the in progress commit.
   */
  clearInProgressCommit(): void {
    this.listItem.inProgressCommit = new Difference();
  }
  /**
   * Creates a new state for the application type for the current user.
   *
   * @param {VersionedRdfStateBase} versionedRdfStateBase the state base containing VersionedRDFRecord information.
   * @returns {Observable} An Observable that resolves if the state creation was successful or not.
   */
  createState(versionedRdfStateBase: VersionedRdfStateBase): Observable<null> {
    let stateIri;
    const recordState: JSONLDObject = {
      '@id': this.stateOntologyNamespace + v4(),
      '@type': [`${this.stateOntologyNamespace}StateRecord`],
      [`${this.stateOntologyNamespace}record`]: [{ '@id': versionedRdfStateBase.recordId }]
    };
    const commitStatePartial: Partial<JSONLDObject> = {
      '@type': [`${this.stateOntologyNamespace}StateCommit`],
      [`${this.stateOntologyNamespace}commit`]: [{ '@id': versionedRdfStateBase.commitId }]
    };
    if (versionedRdfStateBase.branchId) {
      stateIri = this.branchStateNamespace + v4();
      recordState[`${this.stateOntologyNamespace}branchStates`] = [{ '@id': stateIri }];
      commitStatePartial['@id'] = stateIri;
      commitStatePartial['@type'].push(`${this.stateOntologyNamespace}StateBranch`);
      commitStatePartial[`${this.stateOntologyNamespace}branch`] = [
        { '@id': versionedRdfStateBase.branchId }
      ];
    } else if (versionedRdfStateBase.tagId) {
      stateIri = this.tagStateNamespace + v4();
      commitStatePartial['@id'] = stateIri;
      commitStatePartial['@type'].push(`${this.stateOntologyNamespace}StateTag`);
      commitStatePartial[`${this.stateOntologyNamespace}tag`] = [
        { '@id': versionedRdfStateBase.tagId }
      ];
    } else {
      stateIri = this.commitStateNamespace + v4();
      commitStatePartial['@id'] = stateIri;
    }
    recordState[`${this.stateOntologyNamespace}currentState`] = [{ '@id': stateIri }];

    const commitState: JSONLDObject = {
      ...commitStatePartial
    } as JSONLDObject;

    return this.sm.createState([recordState, commitState], this.application);
  }
  /**
   * Retrieves the current state for the provided recordId.
   *
   * @param {string} recordId the VersionedRDFRecord whose state should be retrieved.
   * @returns {State} A State object.
   */
  getStateByRecordId(recordId: string): State {
    return find(this.sm.states, {
      model: [
        {
          [`${this.stateOntologyNamespace}record`]: [{ '@id': recordId }]
        }
      ]
    });
  }
  /**
   * Updates the State for the associated VersionedRdfStateBase.recordId with the provided VersionedRdfStateBase.
   *
   * @param {VersionedRdfStateBase} versionedRdfStateBase the new state to update to.
   * @returns {Observable} An Observable that resolves if the state update was successful or not.
   */
  updateState(versionedRdfStateBase: VersionedRdfStateBase): Observable<null> {
    const stateObj: State = cloneDeep(this.getStateByRecordId(versionedRdfStateBase.recordId));
    const stateId: string = stateObj.id;
    const model: JSONLDObject[] = stateObj.model;
    const recordState: JSONLDObject = find(model, {
      '@type': [`${this.stateOntologyNamespace}StateRecord`]
    });
    // let currentStateId: string = get(
    //   recordState,
    //   `['${this.stateOntologyNamespace}currentState'][0]['@id']`
    // );
    let currentStateId: string = getPropertyId(recordState,`${this.stateOntologyNamespace}currentState`);
    const currentState: JSONLDObject = find(model, { '@id': currentStateId });

    if (
      currentState &&
      !includes(get(currentState, '@type', []), `${this.stateOntologyNamespace}StateBranch`)
    ) {
      remove(model, currentState);
    }

    if (versionedRdfStateBase.branchId) {
      const branchState: JSONLDObject = model.find(
        (obj) =>
          getPropertyId(obj, `${this.stateOntologyNamespace}branch`) === versionedRdfStateBase.branchId
      );
      if (branchState) {
        currentStateId = branchState['@id'];
        branchState[`${this.stateOntologyNamespace}commit`] = [
          { '@id': versionedRdfStateBase.commitId }
        ];
      } else {
        currentStateId = this.branchStateNamespace + v4();
        recordState[`${this.stateOntologyNamespace}branchStates`] = concat(
          get(recordState, `['${this.stateOntologyNamespace}branchStates']`, []),
          [{ '@id': currentStateId }]
        );
        model.push({
          '@id': currentStateId,
          '@type': [
            `${this.stateOntologyNamespace}StateCommit`,
            `${this.stateOntologyNamespace}StateBranch`
          ],
          [`${this.stateOntologyNamespace}branch`]: [{ '@id': versionedRdfStateBase.branchId }],
          [`${this.stateOntologyNamespace}commit`]: [{ '@id': versionedRdfStateBase.commitId }]
        });
      }
    } else if (versionedRdfStateBase.tagId) {
      currentStateId = this.tagStateNamespace + v4();
      model.push({
        '@id': currentStateId,
        '@type': [
          `${this.stateOntologyNamespace}StateCommit`,
          `${this.stateOntologyNamespace}StateTag`
        ],
        [`${this.stateOntologyNamespace}tag`]: [{ '@id': versionedRdfStateBase.tagId }],
        [`${this.stateOntologyNamespace}commit`]: [{ '@id': versionedRdfStateBase.commitId }]
      });
    } else {
      currentStateId = this.commitStateNamespace + v4();
      model.push({
        '@id': currentStateId,
        '@type': [`${this.stateOntologyNamespace}StateCommit`],
        [`${this.stateOntologyNamespace}commit`]: [{ '@id': versionedRdfStateBase.commitId }]
      });
    }
    recordState[`${this.stateOntologyNamespace}currentState`] = [{ '@id': currentStateId }];
    return this.sm.updateState(stateId, model);
  }
  /**
   * Deletes the state for the provided branchId.
   *
   * @param {string} recordId the IRI of the VersionedRdfRecord that contains the branch.
   * @param {string} branchId the IRI of the branch state to delete.
   * @returns {Observable} An Observable that resolves if the state deletion and update was successful or not.
   */
  deleteBranchState(recordId: string, branchId: string): Observable<null> {
    const stateObj: State = cloneDeep(this.getStateByRecordId(recordId));
    const record: JSONLDObject = find(stateObj.model, {
      '@type': [`${this.stateOntologyNamespace}StateRecord`]
    });
    const branchState: JSONLDObject = head(
      remove(stateObj.model, { [`${this.stateOntologyNamespace}branch`]: [{ '@id': branchId }] })
    );
    remove(record[`${this.stateOntologyNamespace}branchStates`], {
      '@id': get(branchState, '@id')
    });
    if (!record[`${this.stateOntologyNamespace}branchStates`].length) {
      delete record[`${this.stateOntologyNamespace}branchStates`];
    }
    return this.sm.updateState(stateObj.id, stateObj.model);
  }
  /**
   * Deletes the state for the provided recordId.
   *
   * @param {string} recordId the IRI of the VersionedRdfRecord state to delete.
   * @returns {Observable} An Observable that resolves if the state deletion was successful and rejects if not.
   */
  deleteState(recordId: string): Observable<null> {
    const state = this.getStateByRecordId(recordId);
    if (state === undefined) {
      return of(null);
    }
    return this.sm.deleteState(state.id);
  }
  /**
   * Retrieves the ID of the current State object for the provided recordId.
   *
   * @param {string} recordId the IRI of the VersionedRDFRecord whose state ID to retrieve.
   * @returns {string} the ID of the State object.
   */
  getCurrentStateIdByRecordId(recordId: string): string {
    return this.getCurrentStateId(this.getStateByRecordId(recordId));
  }
  /**
   * Retrieves the current State object for the provided recordId.
   *
   * @param {string} recordId the IRI of the VersionedRDFRecord whose state to retrieve.
   * @returns {JSONLDObject} the State object associated with the recordId.
   */
  getCurrentStateByRecordId(recordId: string): JSONLDObject {
    const state = this.getStateByRecordId(recordId);
    const currentStateId = this.getCurrentStateId(state);
    return find(get(state, 'model', []), { '@id': currentStateId });
  }
  /**
   * Retrieves the ID of the provided State object.
   *
   * @param {string} state the State object to retrieve the ID of.
   * @returns {string} the ID of the State object.
   */
  getCurrentStateId(state: State): string {
    const recordState = find(state.model, {
      '@type': [`${this.stateOntologyNamespace}StateRecord`]
    });
    return getPropertyId(recordState, `${this.stateOntologyNamespace}currentState`);
  }
  /**
   * Retrieves the current JSONLDObject state from the provided State object.
   *
   * @param {State} state the state object.
   * @returns {JSONLDObject} the JSONLDObject of the current state.
   */
  getCurrentState(state: State): JSONLDObject {
    return find(state.model, { '@id': this.getCurrentStateId(state) });
  }
  /**
   * Out of the provided State, retrieves the IRI of the Commit associated with the state for the Branch with the
   * provided IRI.
   *
   * @param {State} state The State containing the branch and commit details desired
   * @param {string} branchId The IRI of the Branch of interest
   * @returns {string} The Commit IRI of the Branch State in question
   */
  getCommitIdOfBranchState(state: State, branchId: string): string {
    return getPropertyId(
      state.model.find(
        (obj) => getPropertyId(obj, `${this.stateOntologyNamespace}branch`) === branchId
      ),
      `${this.stateOntologyNamespace}commit`
    );
  }
  /**
   * Tests whether the provided `listItem` has any unsaved changes that should be saved to the InProgressCommit.
   *
   * @param {VersionedRdfListItem} listItem The OntologyListItem to test
   * @returns {boolean} True if there are unsaved changes on the provided `listItem`
   */
  hasChanges(listItem: VersionedRdfListItem): boolean {
    return !!get(listItem, 'additions', []).length || !!get(listItem, 'deletions', []).length;
  }
  /**
   * Checks if the state is a tag.
   *
   * @param {JSONLDObject} jsonld the JSONLDObject to check for a StateTag.
   * @returns {boolean} Whether the JSONLDObject is a StateTag.
   */
  isStateTag(jsonld: JSONLDObject): boolean {
    return includes(jsonld['@type'], `${this.stateOntologyNamespace}StateTag`);
  }
  /**
   * Checks if the state is a branch.
   *
   * @param {JSONLDObject} jsonld the JSONLDObject to check for a StateBranch.
   * @returns {boolean} Whether the JSONLDObject is a StateBranch.
   */
  isStateBranch(jsonld: JSONLDObject): boolean {
    return includes(jsonld['@type'], `${this.stateOntologyNamespace}StateBranch`);
  }
  /**
   * Retrieves the catalog information for the specific commit of the record that should be opened for the current
   * user. If the user has not opened the ontology yet or the branch/commit they were viewing no longer exists,
   * retrieves the latest state of the ontology.
   *
   * @param {string} recordId the IRI of the VersionedRDFRecord.
   * @returns {Observable} An Observable containing the record id, branch id, commit id, and inProgressCommit.
   */
  getCatalogDetails(recordId: string): Observable<CatalogDetails> {
    const state: State = this.getStateByRecordId(recordId);
    if (!isEmpty(state)) {
      let inProgressCommit = new Difference();
      const currentState: JSONLDObject = this.getCurrentState(state);
      const commitId = getPropertyId(currentState, `${this.stateOntologyNamespace}commit`);
      const tagId = getPropertyId(currentState, `${this.stateOntologyNamespace}tag`);
      const branchId = getPropertyId(currentState, `${this.stateOntologyNamespace}branch`);
      let upToDate = false;
      let ob;
      let branchToastShown = false;
      if (branchId) {
        ob = this.cm.getRecordBranch(branchId, recordId, this.catalogId).pipe(
          catchError((error) => {
            this.toast.createWarningToast(
              `Branch ${branchId} does not exist. Opening HEAD of MASTER.`,
              { timeOut: 5000 }
            );
            branchToastShown = true;
            return throwError(error);
          }),
          switchMap((branch) => {
            upToDate = getPropertyId(branch, `${CATALOG}head`) === commitId;
            return this.cm.getInProgressCommit(recordId, this.catalogId);
          })
        );
      } else if (tagId) {
        upToDate = true;
        ob = this.cm.getRecordVersion(tagId, recordId, this.catalogId).pipe(
          catchError(() => {
            this.toast.createWarningToast(
              `Tag ${tagId} does not exist. Opening commit ${condenseCommitId(commitId)}`,
              { timeOut: 5000 }
            );
            return this.updateState({ recordId, commitId });
          }),
          switchMap(() => this.cm.getInProgressCommit(recordId, this.catalogId))
        );
      } else {
        upToDate = true;
        ob = this.cm.getInProgressCommit(recordId, this.catalogId);
      }

      return ob.pipe(
        catchError((response) => {
          if (get(response, 'status') === 404) {
            return of(inProgressCommit);
          }
          return throwError(response);
        }),
        switchMap((response: Difference) => {
          inProgressCommit = response;
          return this.cm
            .getCommit(commitId)
            .pipe(map(() => ({ recordId, branchId, commitId, tagId, upToDate, inProgressCommit })));
        }),
        catchError(() => {
          if (!branchToastShown) {
            this.toast.createWarningToast(
              `Commit ${condenseCommitId(commitId)} does not exist. Opening HEAD of MASTER.`,
              { timeOut: 5000 }
            );
          }
          return this.deleteState(recordId).pipe(switchMap(() => this.getLatestMaster(recordId)));
        })
      );
    }
    return this.getLatestMaster(recordId);
  }
  /**
   * Retrieves the latest state a VersionedRDFRecord, being the head commit of the master branch, and returns
   * an Observable containing the recordId, branchId, commitId, and inProgressCommit.
   *
   * @param {string} recordId the IRI of the VersionedRDFRecord.
   * @returns {Observable} An Observable containing the record id, branch id, commit id, and inProgressCommit.
   */
  getLatestMaster(recordId: string): Observable<{
    recordId: string;
    branchId: string;
    commitId: string;
    upToDate: boolean;
    inProgressCommit: Difference;
  }> {
    let branchId, commitId: string;
    return this.cm.getRecordMasterBranch(recordId, this.catalogId).pipe(
      switchMap((masterBranch) => {
        branchId = get(masterBranch, '@id', '');
        commitId = getPropertyId(masterBranch, `${CATALOG}head`);
        return this.createState({ recordId, commitId, branchId });
      }),
      map(() => {
        return { recordId, branchId, commitId, upToDate: true, inProgressCommit: new Difference() };
      })
    );
  }
  /**
   * Updates self.listItem.merge with the updated additions and deletions for the provided commit information.
   *
   * @param {string} sourceCommitId The string IRI of the source commit to get the difference.
   * @param {string} targetCommitId The string IRI of the target commit to get the difference.
   * @param {number} limit The limit for the paged difference.
   * @param {number} offset The offset for the paged difference.
   * @returns {Observable} Observable that resolves if the action was successful; rejects otherwise
   */
  getMergeDifferences(
    sourceCommitId: string,
    targetCommitId: string,
    limit: number,
    offset: number
  ): Observable<null> {
    this.listItem.merge.startIndex = offset;
    return this.cm.getDifference(sourceCommitId, targetCommitId, limit, offset).pipe(
      map((response: HttpResponse<CommitDifference>) => {
        if (!this.listItem.merge.difference) {
          this.listItem.merge.difference = new Difference();
        }
        this.listItem.merge.difference.additions = concat(
          this.listItem.merge.difference.additions as JSONLDObject[],
          response.body.additions as JSONLDObject[]
        );
        this.listItem.merge.difference.deletions = concat(
          this.listItem.merge.difference.deletions as JSONLDObject[],
          response.body.deletions as JSONLDObject[]
        );
        const headers = response.headers;
        this.listItem.merge.difference.hasMoreResults = (headers.get('has-more-results') || 'false') === 'true';
        return null;
      })
    );
  }
  /**
   * Attempts the merge, first checking for conflicts.
   *
   * @returns {Observable} Observable that resolves if the merge was successful.
   */
  attemptMerge(): Observable<null> {
    return this.checkConflicts().pipe(switchMap(() => this.merge()));
  }
  /**
   * Checks for merge conflicts.
   *
   * @returns {Observable} Observable that resolves if there are no conflicts.
   */
  checkConflicts(): Observable<null> {
    return this.cm
      .getBranchConflicts(
        this.listItem.versionedRdfRecord.branchId,
        this.listItem.merge.target['@id'],
        this.listItem.versionedRdfRecord.recordId,
        this.catalogId
      )
      .pipe(
        map((conflicts) => {
          if (!isEmpty(conflicts)) {
            conflicts.forEach((conflict) => {
              conflict.resolved = false;
              this.listItem.merge.conflicts.push(conflict);
            });
            throw new Error('Conflicts found');
          }
          return null;
        })
      );
  }
  /**
   * Resets the merge state.
   */
  cancelMerge(): void {
    this.listItem.merge.active = false;
    this.listItem.merge.target = undefined;
    this.listItem.merge.checkbox = false;
    this.listItem.merge.difference = undefined;
    this.listItem.merge.conflicts = [];
    this.listItem.merge.resolutions = new Difference();
    this.listItem.merge.startIndex = 0;
  }
  /**
   * Retrieves the VersionedRdfListItem from the list of open records.
   *
   * @param {string} recordId the IRI of the VersionedRDFRecord.
   */
  getListItemByRecordId(recordId: string): T {
    return this.list.find(item => item.versionedRdfRecord.recordId === recordId);
  }
  /**
   * Resets all state variables.
   */
  reset(): void {
    this.list = [];
    this.listItem = undefined;
    this.uploadList = [];
    this.uploadPending = 0;
  }
  /**
   * Adds the provided JSON-LD to the additions of the open {@link VersionedRdfListItem} associated with the provided
   * record IRI before it is saved to the user's In Progress Commit.
   *
   * @param {string} recordId The Record IRI of an open listItem
   * @param {JSONLDObject} json The JSON-LD to add to the additions of a listItem
   */
  addToAdditions(recordId: string, json: JSONLDObject): void {
    this._addToInProgress(recordId, json, true);
  }
  /**
   * Adds the provided JSON-LD to the deletions of the open {@link VersionedRdfListItem} associated with the provided
   * record IRI before it is saved to the user's In Progress Commit.
   *
   * @param {string} recordId The Record IRI of an open listItem
   * @param {JSONLDObject} json The JSON-LD to add to the deletions of a listItem
   */
  addToDeletions(recordId: string, json: JSONLDObject): void {
    this._addToInProgress(recordId, json, false);
  }
  /**
   * Saves the additions and deletions on the provided {@link VersionedRdfListItem} to the current user's
   * InProgressCommit.
   *
   * @returns {Observable<null>} An Observable indicating the success of the save
   */
  saveCurrentChanges(listItem: T = this.listItem): Observable<null> {
    const difference = new Difference();
    difference.additions = listItem.additions;
    difference.deletions = listItem.deletions;
    return this.cm
      .updateInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId, difference)
      .pipe(
        switchMap(() =>
          this.cm.getInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId)
        ),
        switchMap((inProgressCommit: Difference) => {
          listItem.inProgressCommit = inProgressCommit;
          listItem.additions = [];
          listItem.deletions = [];
          return isEqual(inProgressCommit, new Difference())
            ? this.cm.deleteInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId)
            : of(null);
        }),
        switchMap(() => {
          if (isEmpty(this.getStateByRecordId(listItem.versionedRdfRecord.recordId))) {
            return this.createState({
              recordId: listItem.versionedRdfRecord.recordId,
              commitId: listItem.versionedRdfRecord.commitId,
              branchId: listItem.versionedRdfRecord.branchId
            });
          } else {
            return this.updateState({
              recordId: listItem.versionedRdfRecord.recordId,
              commitId: listItem.versionedRdfRecord.commitId,
              branchId: listItem.versionedRdfRecord.branchId
            });
          }
        })
      );
  }

  /* Private helper functions */
  /**
   * Adds the provided RDF in the form of a {@link JSONLDObject} to either the additions or deletions array of the
   * {@link VersionedRdfListItem} corresponding to the provided record ID.
   *
   * @param {string} recordId The IRI of the Record to receive the additions or deletions
   * @param {JSONLDObject} json The RDF to add to the additions/deletions.
   * @param {boolean} isAdditions Whether the RDF should be added to the additions array. Will be added to the
   *    deletions array otherwise
   */
  private _addToInProgress(recordId: string, json: JSONLDObject, isAdditions: boolean): void {
    const prop = isAdditions ? 'additions' : 'deletions';
    const listItem = this.getListItemByRecordId(recordId);
    const entity = find(listItem[prop], { '@id': json['@id'] });
    const filteredJson = cloneDeep(json);
    if (entity) {
      mergeWith(entity, filteredJson, mergingArrays);
    } else {
      listItem[prop].push(filteredJson);
    }
  }

  /**
   * Joins the provided path to an entity in a hierarchy represented by the array of strings into a single string,
   * joined with `.`.
   *
   * @param {string[]} path The path of entities to join
   * @returns {string} A single string with the joined path
   */
  joinPath(path: string[]): string {
    return join(path, '.');
  }

  /**
   * Adds an imported ontology reference to a given list item.
   *
   * @param {VersionedRdfListItem} listItem - The list item to which the imported ontology should be added.
   * @param {ImportedOntology} importedOntObj - An object containing the `id` and `ontologyId` of the imported ontology.
   */
  addImportedOntologyToListItem(listItem: VersionedRdfListItem, importedOntObj: ImportedOntology): void {
    const importedOntologyListItem: ImportedOntology = {
      id: importedOntObj.id,
      ontologyId: importedOntObj.ontologyId
    };
    listItem.importedOntologyIds.push(importedOntObj.id);
    listItem.importedOntologies.push(importedOntologyListItem);
  }

  /**
   * Retrieves the Manchester Syntax value for the provided blank node id if it exists in the blankNodes map of the
   * currently selected {@link OntologyListItem}. If the value is not a blank node id, returns undefined. If the
   * Manchester Syntax string is  not set, returns the blank node id back.
   *
   * @param {string} id A blank node id
   * @returns {string} The Manchester Syntax string for the provided id if it is a blank node id and exists in the
   * blankNodes map; undefined otherwise
   */
  getBlankNodeValue(id: string): string {
    if (isBlankNodeId(id)) {
      return get(this.listItem.blankNodes, id, id);
    }
    return;
  }

  /**
   * Creates an HTML string of the body of a {@link shared.ConfirmModalComponent} for confirming the
   * deletion of the specified property value on the selected entity of the currently selected {@link OntologyListItem}
   *
   * @param {string} key The IRI of a property on the current entity
   * @param {number} index The index of the specific property value being deleted
   * @return {string} A string with HTML for the body of a `confirmModal`
   */
  getRemovePropOverlayMessage(key: string, index: number): string {
    return (
      `<p>Are you sure you want to remove:<br><strong>${key}</strong></p><p>with value:<br><strong>` +
      `${this.getPropValueDisplay(key, index)}</strong></p><p>from:<br><strong>` +
      `${this.listItem.selected['@id']}</strong> ?</p>`
    );
  }

  /**
   * Creates an index for the blank nodes so that the manchester syntax logic will work correctly.
   *
   * @param {JSONLDObject[]} [selectedBlankNodes=listItem.selectedBlankNodes] The JSON-LD array of blank nodes to index
   * @returns {BlankNodeIndex} The index of blank nodes
   */
  getBnodeIndex(selectedBlankNodes = this.listItem.selectedBlankNodes): BlankNodeIndex {
    const bnodeIndex = {};
    selectedBlankNodes.forEach((bnode, idx) => {
      bnodeIndex[bnode['@id']] = { position: idx };
    });
    return bnodeIndex;
  }

  /**
   * Retrieves the list of `@type` values for the currently selected entity,
   * transforming each type into either Manchester syntax (if it's a blank node)
   * or a prefixed IRI. The resulting list is sorted and joined into a comma-separated string.
   *
   * @param entity The JSON-LD object whose `@type` values should be extracted and formatted.
   * @returns A comma-separated string of sorted, human-readable type representations.
   */
  getTypesLabel(entity: JSONLDObject): string {
    const transformedTypes = get(entity, '@type', []).map((type) => {
      if (isBlankNodeId(type)) {
        return this.mc.jsonldToManchester(
          type,
          this.listItem.selectedBlankNodes,
          this.getBnodeIndex(),
          true
        );
      } else {
        return this.prefixation.transform(type);
      }
    });
    return join(orderBy(transformedTypes), ', ');
  }

  /**
   * Calculates the new label for the current selected entity in the currently selected {@link VersionedRdfListItem}
   */
  updateLabel(): void {
    const newLabel = getEntityName(this.listItem.selected);
    const iri = this.listItem.selected['@id'];
    if (
      has(this.listItem.entityInfo, `['${iri}'].label`) &&
      this.listItem.entityInfo[iri].label !== newLabel
    ) {
      this.listItem.entityInfo[iri].label = newLabel;
      this.listItem.entityInfo[iri].names = getEntityNames(this.listItem.selected);
    }
  }

  /**
   * Creates a display of the specified property value on the selected entity on the currently selected
   * {@link VersionedRdfListItem}
   *
   * @param {string} key The IRI of a property on the current entity
   * @param {number} index The index of a specific property value
   * @return {string} A string a display of the property value
   */
  abstract getPropValueDisplay(key: string, index: number): string;

  /**
   * Removes the specified property value on the selected entity on the currently selected {@link VersionedRdfListItem},
   * updating the InProgressCommit, state.
   *
   * @param {string} key The IRI of a property on the current entity
   * @param {number} index The index of a specific property value
   * @return {Observable} An Observable that resolves with the JSON-LD value object that was removed
   */
  abstract removeProperty(key: string, index: number): Observable<JSONLDId | JSONLDValue>;

  /**
   * Determines whether the provided id is "linkable", i.e. that a link could be made to take a user to that entity.
   *
   * @param {string} id An id from the current versionedRdfState
   * @returns {boolean} True if the id exists as an entity and not a blank node; false otherwise
   */
  abstract isLinkable(id: string): boolean;

  /**
   * Updates the currently selected {@link VersionedRdfListItem} to view the entity identified by the provided IRI.
   *
   * @param {string} iri The IRI of the entity to open the editor at
   */
  abstract goTo(iri: string): void;

  /**
   * Determines whether the selected IRI of the provided {@link VersionedRdfListItem} is imported or not. Defaults to true.
   *
   * @param {VersionedRdfListItem} [listItem=listItem] The listItem to execute these actions against
   * @returns {boolean} True if the selected IRI is imported; false otherwise
   */
  abstract isSelectedImported(listItem?: VersionedRdfListItem): boolean;

  /**
   * Determines whether the provided IRI is imported or not in the provided {@link VersionedRdfListItem}.
   *
   * @param {string} entityIri The IRI to search for
   * @param {VersionedRdfListItem} [listItem=listItem] The listItem to execute these actions against
   * @returns {boolean} True if the IRI is imported; false otherwise
   */
  abstract isImported(entityIri: string, listItem?: VersionedRdfListItem): boolean;

  /**
   * Checks whether an IRI exists in the currently selected {@link VersionedRdfListItem} and it not the current selected
   * entity.
   *
   * @param {string} iri The entity IRI to check
   * @returns {boolean} True if the entity exists in the `listItem` but is not selected
   */
  abstract checkIri(iri: string): boolean;

  /**
   * Handles the editing process for an IRI (Internationalized Resource Identifier) and updates related metadata and
   * references.
   *
   * @param {string} iriBegin - The beginning part of the IRI. Must not be null or empty.
   * @param {string} iriThen - The intermediate part of the IRI. Must not be null or empty.
   * @param {string} iriEnd - The ending part of the IRI. Must not be null or empty.
   * @return {Observable<any>} An Observable that completes when all related metadata and references have been updated successfully.
   * Emits an error in case of validation failures or internal errors.
   */
  abstract onIriEdit(iriBegin: string, iriThen: string, iriEnd: string): Observable<void>;

  /**
   * Returns the source IRI of the selected entity.
   *
   * @returns {string} The IRI of the source import.
   */
  abstract getImportedSource(): string;
}
