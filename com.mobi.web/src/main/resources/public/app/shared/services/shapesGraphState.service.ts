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
//angular imports
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ElementRef, Injectable } from '@angular/core';
//third party imports
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { cloneDeep, find, get, isEmpty, remove, some, assign, has } from 'lodash';
import { forkJoin, Observable, of, merge as rxjsMerge, throwError } from 'rxjs';
//mobi + local imports
import {
  CATALOG,
  BRANCHID,
  COMMITID,
  GRAPHEDITOR,
  SHAPESGRAPHEDITOR,
  SHAPESGRAPHSTATE,
  TAGID
} from '../../prefixes';
import { CatalogDetails, VersionedRdfState } from './versionedRdfState.service';
import { CatalogManagerService } from './catalogManager.service';
import { Difference } from '../models/difference.class';
import { EntityNames } from '../models/entityNames.interface';
import { EventPayload, EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';
import { getArrWithoutEntity, getBeautifulIRI, getDctermsValue, getPropertyId, isBlankNodeId } from '../utility';
import { JSONLDId } from '../models/JSONLDId.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { JSONLDValue } from '../models/JSONLDValue.interface';
import { ManchesterConverterService } from './manchesterConverter.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { PolicyManagerService } from './policyManager.service';
import { PrefixationPipe } from '../pipes/prefixation.pipe';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { PropertyManagerService } from './propertyManager.service';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { RecordSelectFiltered } from '../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { SettingManagerService } from './settingManager.service';
import { SHAPES_STORE_TYPE } from '../../constants';
import { ShapesGraphImports } from '../models/shapesGraphImports.interface';
import { EntityImportStatus, ShapesGraphListItem, SubjectImportMap } from '../models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { SparqlManagerService } from './sparqlManager.service';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { splitIRI } from '../pipes/splitIRI.pipe';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { UpdateRefsService } from './updateRefs.service';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { XACMLRequest } from '../models/XACMLRequest.interface';

/**
 * @class shared.ShapesGraphStateService
 *
 * A service which contains various variables to hold the state of the Shapes Graph editor
 */
@Injectable()
export class ShapesGraphStateService extends VersionedRdfState<ShapesGraphListItem> {
  type = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;

  private readonly _ENTITY_NAMES_QUERY = `
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX sh: <http://www.w3.org/ns/shacl#>

  SELECT ?iri (GROUP_CONCAT(?nameOption;separator="�") as ?names)
  WHERE {
    {
      SELECT ?iri ?nameOption
      WHERE {
        {
          ?iri a ?type .
          FILTER(ISIRI(?iri))
          BIND(REPLACE(STR(?iri), "^.*?([_\\\\p{L}][-_\\\\p{L}\\\\p{N}]*)$", "$1") as ?nameOption)
          BIND(19 as ?propertyOrder)
        } UNION {
          VALUES (?property ?propertyOrder) { (rdfs:label 2) (dct:title 4) (dc:title 6) (skos:prefLabel 8) (skos:altLabel 10) (skosxl:literalForm 12) (sh:name 18) }
          ?iri a ?type ;
            ?property ?nameOption .
          FILTER(ISIRI(?iri))
          OPTIONAL {
            ?iri ?property ?nameOption .
            FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
            BIND(?propertyOrder - 1 as ?propertyOrder)
          }
        } UNION {
          ?iri a ?type ;
            (skosxl:prefLabel/skosxl:literalForm) ?nameOption .
          FILTER(ISIRI(?iri))
          FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
          BIND(13 as ?propertyOrder)
        } UNION {
          ?iri a ?type ;
            (skosxl:prefLabel/skosxl:literalForm) ?nameOption .
          FILTER(ISIRI(?iri))
          BIND(14 as ?propertyOrder)
        } UNION {
          ?iri a ?type ;
            (skosxl:altLabel/skosxl:literalForm) ?nameOption .
          FILTER(ISIRI(?iri))
          FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
          BIND(15 as ?propertyOrder)
        } UNION {
          ?iri a ?type ;
            (skosxl:altLabel/skosxl:literalForm) ?nameOption .
          FILTER(ISIRI(?iri))
          BIND(16 as ?propertyOrder)
        }
      } ORDER BY ?propertyOrder ?nameOption
    }
  } GROUP BY ?iri`;

  constructor(
    protected cm: CatalogManagerService,
    protected mc: ManchesterConverterService,
    protected mrm: MergeRequestManagerService,
    protected spinnerSvc: ProgressSpinnerService,
    protected pep: PolicyEnforcementService,
    private pm: PolicyManagerService,
    protected propertyManager: PropertyManagerService,
    private sgm: ShapesGraphManagerService,
    protected sm: StateManagerService,
    private sparql: SparqlManagerService,
    protected stm: SettingManagerService,
    protected prefixation: PrefixationPipe,
    protected toast: ToastService,
    protected updateRefs: UpdateRefsService,
  ) {
    super(
      SHAPESGRAPHSTATE,
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
        if (eventType && payload) {
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
  // Updates state based on the Event type. Handles branch removals and accept merge requests.
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
      const recordExistInList = some(this.list, { versionedRdfRecord: { recordId: recordId } });
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
      const recordExistInList = some(this.list, { versionedRdfRecord: { recordId: recordId } });
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
    return this.stm.getDefaultNamespace(`${SHAPESGRAPHEDITOR}ShapesGraphRecord`);
  }
  /**
   * Returns the display name of an entity within the currently selected ShapesGraphRecord. Pulls from the calculated
   * and cached entity names of the shapes graph.
   */
  getEntityName(entityId: string): string {
    if (this.listItem.entityInfo[entityId]) {
      return this.listItem.entityInfo[entityId].label || getBeautifulIRI(entityId);
    }
    return getBeautifulIRI(entityId);
  }
  /**
   * Returns the Shapes Graph IRI of the data associated with a ShapesGraphRecord. If no JSON-LD Object of the Record
   * is provided, will pull the identifier IRI from the currently selected listItem.
   */
  getIdentifierIRI(record?: JSONLDObject): string {
    return record ? getPropertyId(record, `${CATALOG}trackedIdentifier`) : this.listItem.shapesGraphId;
  }
  /**
   * Opens the ShapesGraphRecord identified by the provided details in the Shapes Editor.
   */
  open(record: RecordSelectFiltered): Observable<null> {
    return this.getCatalogDetails(record.recordId).pipe(
      switchMap((response: CatalogDetails) => this.createListItem(response.recordId,
        response.branchId,
        response.commitId,
        response.tagId,
        response.inProgressCommit,
        response.upToDate,
        record.title
      )),
      switchMap(listItem => {
        this.listItem = listItem;
        this.list.push(listItem);
        return of(null);
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
    if (!rdfUpload.jsonld && !rdfUpload.file) {
      return throwError('Creation requires a file or JSON-LD');
    }
    let listItem: ShapesGraphListItem;
    return this.sgm.createShapesGraphRecord(rdfUpload).pipe(
      switchMap((response: VersionedRdfUploadResponse) => {
        if (rdfUpload.file) {
          return this.createListItem(response.recordId, response.branchId, response.commitId,
            undefined, new Difference(), true, rdfUpload.title);
        } else {
          return this.createListItem(response.recordId, response.branchId, response.commitId,
            undefined, new Difference(), true, response.title);
        }
      }),
      switchMap((newListItem: ShapesGraphListItem) => {
        listItem = newListItem;
        const stateBase: VersionedRdfStateBase = {
          recordId: listItem.versionedRdfRecord.recordId,
          commitId: listItem.versionedRdfRecord.commitId,
          branchId: listItem.versionedRdfRecord.branchId
        };
        return this.createState(stateBase);
      }),
      tap(() => {
        this.list.push(listItem);
        this.listItem = listItem;
      }),
      map(() => ({
        recordId: this.listItem.versionedRdfRecord.recordId,
        branchId: this.listItem.versionedRdfRecord.branchId,
        commitId: this.listItem.versionedRdfRecord.commitId,
        title: this.listItem.versionedRdfRecord.title,
        shapesGraphId: this.listItem.shapesGraphId,
      }))
    );
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
        return this.changeVersion(this.listItem.versionedRdfRecord.recordId,
          this.listItem.versionedRdfRecord.branchId,
          this.listItem.versionedRdfRecord.commitId,
          undefined,
          this.listItem.currentVersionTitle,
          this.listItem.upToDate,
          true,
          this.listItem.changesPageOpen
        );
      })
    );
  }
  /**
   * Handles uploading changes to the ShapesGraphRecord identified by the provided details. Calls the Shapes Graph
   * endpoint, then fetches the In Progress Commit, updates the frontend cached In Progress Commit, and updates the
   * Shapes Graph data to the updated data.
   */
  uploadChanges(rdfUpdate: RdfUpdate): Observable<null> {
    return this.sgm.uploadChanges(rdfUpdate).pipe(
      switchMap(() => this.cm.getInProgressCommit(rdfUpdate.recordId, this.catalogId)),
      catchError((response: HttpErrorResponse): Observable<string> => {
        if (typeof response === 'string') {
          return throwError({ errorMessage: response, errorDetails: [] });
        } else if (typeof response === 'object' && 'errorMessage' in response) {
          return throwError(response);
        } else if (response.status === 404 || response.status === 204) {
          return throwError({ errorMessage: 'No changes were found in the uploaded file.', errorDetails: [] });
        } else {
          return throwError({ errorMessage: 'Something went wrong. Please try again later.', errorDetails: [] });
        }
      }),
      switchMap((inProgressCommit: Difference) => {
        const listItem = this.getListItemByRecordId(rdfUpdate.recordId);
        listItem.inProgressCommit = inProgressCommit;
        return this.changeVersion(rdfUpdate.recordId,
          rdfUpdate.branchId,
          rdfUpdate.commitId,
          undefined,
          listItem.currentVersionTitle,
          listItem.upToDate,
          false,
          listItem.changesPageOpen
        );
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
    let oldListItem: ShapesGraphListItem;
    let newListItem: ShapesGraphListItem;
    return this.updateState(state).pipe(
      switchMap(() => {
        oldListItem = this.getListItemByRecordId(recordId);
        if (clearInProgressCommit) {
          oldListItem.inProgressCommit = new Difference();
        }
        return this.createListItem(recordId, branchId, commitId, tagId,
          oldListItem.inProgressCommit, upToDate, oldListItem.versionedRdfRecord.title);
      }),
      map((createdItem) => {
        newListItem = createdItem;
        newListItem.changesPageOpen = changesPageOpen;
        if (versionTitle) {
          newListItem.currentVersionTitle = versionTitle;
        }
        assign(oldListItem, newListItem);
        return null;
      }),
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
          getDctermsValue(this.listItem.merge.target, 'title'),
          true,
          false,
          false)
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
  private _addIri(listItem: ShapesGraphListItem, path: string, iri: string, ontologyId: string = undefined): void {
    const iriObj = get(listItem, path, {});
    if (!has(iriObj, `['${iri}']`)) {
      iriObj[iri] = ontologyId || splitIRI(iri).begin;
    }
  }

  /**
   * Creates an {@link ShapesGraphListItem} given the provided input parameters.
   * 
   * @param {string} recordId The Record IRI for the ontology
   * @param {string} branchId The Branch IRI of the intended version of the ontology
   * @param {string} commitId The Commit IRI of the intended version of the ontology
   * @param {string} tagId The Tag IRI of the intended version of the ontology
   * @param {Difference} inProgressCommit The Difference to save as the InProgressCommit of the ontology
   * @param {boolean} [upToDate=true] Whether the ontology should be considered as up to date in the frontend state.
   * Defaults to true
   * @param {string} title The title of the ontology
   * @returns {Observable} An Observable with the newly created `listItem` for the ontology
   */
  createListItem(recordId: string, branchId: string, commitId: string, tagId: string, inProgressCommit: Difference,
    upToDate = true, title: string): Observable<ShapesGraphListItem> {
    const modifyRequest: XACMLRequest = {
      resourceId: recordId,
      actionId: this.pm.actionModify
    };
    const listItem = new ShapesGraphListItem();
    listItem.versionedRdfRecord = {
      title: title,
      recordId: recordId,
      branchId: branchId,
      commitId: commitId,
      tagId: tagId
    };
    listItem.inProgressCommit = inProgressCommit;
    listItem.upToDate = upToDate;
    this.propertyManager.defaultDatatypes.forEach(iri => this._addIri(listItem, 'dataPropertyRange', iri));

    // Do this request first so that the ontology cache is populated and avoid race conditions with the other requests
    return this.sgm.getShapesGraphIRI(recordId, branchId, commitId)
      .pipe(switchMap(shapesGraphId => {
        listItem.shapesGraphId = shapesGraphId;
        // Submit first round of requests that will feed into the second round
        return forkJoin({
          shapesGraphImports: this.sgm.getShapesGraphImports(
            listItem.versionedRdfRecord.recordId,
            listItem.versionedRdfRecord.branchId,
            listItem.versionedRdfRecord.commitId
          ),
          content: this.sgm.getShapesGraphContent(listItem.versionedRdfRecord.recordId,
            listItem.versionedRdfRecord.branchId,
            listItem.versionedRdfRecord.commitId
          ),
          branches: this.cm.getRecordBranches(recordId, this.catalogId),
          modifyDecision: this.pep.evaluateRequest(modifyRequest),
          entityNames: this.getEntityNames(listItem)
        });
      }),
      switchMap((result: {
          shapesGraphImports: ShapesGraphImports, 
          content: string | JSONLDObject[], 
          branches: HttpResponse<JSONLDObject[]>, 
          modifyDecision: string,
          entityNames: EntityNames}) => {
        // Handle getShapesGraphImports
        get(result.shapesGraphImports, 'importedOntologies').forEach(importedOntObj => {
          this.addImportedOntologyToListItem(listItem, importedOntObj);
        });
        listItem.failedImports = get(result.shapesGraphImports, 'failedImports', []);
        listItem.subjectImportMap = this._getSubjectImportMap(result.shapesGraphImports);
        // Handle getShapesGraphContent
        listItem.content = result.content as string;
        // Handle getRecordBranches
        const masterBranch = result.branches.body.find(branch => getDctermsValue(branch, 'title') === 'MASTER');
        listItem.masterBranchIri = masterBranch ? masterBranch['@id'] : '';
        // Handle modifyRequest decision
        listItem.userCanModify = result.modifyDecision === this.pep.permit;
        // Handle getEntityNames
        listItem.entityInfo = result.entityNames;
        // Submit next round of requests that rely on responses from the first
        return forkJoin({
          modifyMasterDecision: this.pep.evaluateRequest({
            resourceId: listItem.versionedRdfRecord.recordId,
            actionId: this.pm.actionModify,
            actionAttrs: { [`${CATALOG}branch`]: listItem.masterBranchIri }
          }),
          setSelected: this.setSelected(listItem.shapesGraphId, listItem)
        });
      }),
      switchMap((result: { modifyMasterDecision: string}) => {
        // Handle modifyMasterDecision
        listItem.userCanModifyMaster = result.modifyMasterDecision === this.pep.permit;
        // Return final listItem
        return of(listItem);
      })
    );
  }

  private _getSubjectImportMap(shapesGraphImports: ShapesGraphImports): SubjectImportMap {
    const subjectMap: SubjectImportMap = {};
    for (const ontology of shapesGraphImports.importedOntologies) {
      for (const subject of ontology.iris) {
        if (!subjectMap[subject]) {
          subjectMap[subject] = {
            imported: true,
            ontologyIds: [ontology.ontologyId],
          };
        } else {
          const entityImportStatus: EntityImportStatus = subjectMap[subject];
          entityImportStatus.ontologyIds = entityImportStatus.ontologyIds.concat([ontology.ontologyId]);
        }
      }
    }
    for (const subject of shapesGraphImports.nonImportedIris) {
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          imported: false
        };
      } else {
        const entityImportStatus: EntityImportStatus = subjectMap[subject];
        entityImportStatus.alsoLocal = true;
      }
    }
    return subjectMap;
  }

  /**
   * Handles the editing process for an IRI (Internationalized Resource Identifier) and updates related metadata and
   * references.
   *
   * @param {string} iriBegin - The beginning part of the IRI. Must not be null or empty.
   * @param {string} iriThen - The intermediate part of the IRI. Must not be null or empty.
   * @param {string} iriEnd - The ending part of the IRI. Must not be null or empty.
   * @return {Observable<any>} An Observable that completes when all related metadata and references have been updated successfully. Emits an error in case of validation failures or internal errors.
   */
  onIriEdit(iriBegin: string, iriThen: string, iriEnd: string): Observable<void> {
    //checking for IRI structure
    if (!iriBegin) {
      return throwError('onIriEdit validation failed for iriBegin');
    }
    if (!iriThen) {
      return throwError('onIriEdit validation failed for iriThen');
    }
    if (!iriEnd) {
      return throwError('onIriEdit validation failed for iriEnd');
    }
    if (!this.listItem.versionedRdfRecord.recordId) {
      return throwError('onIriEdit validation failed for recordId');
    }
    const newIRI = iriBegin + iriThen + iriEnd;
    const oldEntity = cloneDeep(this.listItem.selected);
    // TODO: Once tabs added make sure this accounts for which tab you are on (either editing shapes graph IRI or node shape IRI)
    if (some(this.listItem.additions, oldEntity)) {
      remove(this.listItem.additions, oldEntity);
      this.updateRefs.update(this.listItem, oldEntity['@id'], newIRI, this._updateRefsExclude);
      //TODO comment back in and implement when we have hierarchical shapes. Only if needed similarly to ontology editor
    } else {
      this.updateRefs.update(this.listItem, oldEntity['@id'], newIRI, this._updateRefsExclude);
      this.addToDeletions(this.listItem.versionedRdfRecord.recordId, oldEntity);
    }
    this.addToAdditions(this.listItem.versionedRdfRecord.recordId, cloneDeep(this.listItem.selected));
    //retrieves all instances where the oldIRI is the predicate or object of a triple and updates them to the newIRI
    return this._retrieveUsages(this.listItem, oldEntity['@id']).pipe(map(response => {
      if (typeof response === 'string') {
        const statements = JSON.parse(response) as JSONLDObject[];
        statements.forEach(statement => this.addToDeletions(this.listItem.versionedRdfRecord.recordId, statement));
        this.updateRefs.update(statements, oldEntity['@id'], newIRI, this._updateRefsExclude);
        statements.forEach(statement => this.addToAdditions(this.listItem.versionedRdfRecord.recordId, statement));
      } else {
        throw new Error('Associated entities were not updated due to an internal error.');
      }
    }));
  }

  private _retrieveUsages(listItem: ShapesGraphListItem, oldIRI: string): Observable<string | SPARQLSelectResults> {
    const usageQuery = `construct {?s ?p ?o}
      where {
          {
              ?s ?p <${oldIRI}> .
              bind(<${oldIRI}> as ?o)
          }
          union
          {
              ?s <${oldIRI}> ?o .
              bind(<${oldIRI}> as ?p)
          }
      } order by ?p ?s ?o`;

    return this.sparql.postQuery(usageQuery, listItem.versionedRdfRecord.recordId, SHAPES_STORE_TYPE,
      listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, false, false, 'jsonld');
  }
  /**
   * Sets the `selected`, `selectedBlankNodes`, and `blankNodes` properties on the provided {@link ShapesGraphListItem}
   * based on the response from {@link shared.ShapesGraphStateService#getShapesGraphEntity}. Returns an Observable
   * indicating the success of the action. If the provided `entityIRI` or `listItem` are not valid, returns an
   * Observable that resolves. Sets the entity usages if the provided `getUsages` parameter is true. Also accepts an
   * optional ElementRef to attach a spinner to in the call to fetch the entity.
   *
   * @param {string} entityIRI The IRI of the entity to retrieve
   * @param {ShapesGraphListItem} [listItem=listItem] The listItem to execute these actions against
   * @param {ElementRef} element An optional element to attach a spinner to when fetching the entity
   * @return {Observable} An Observable indicating the success of the action
   */
  setSelected(entityIRI: string, listItem: ShapesGraphListItem = this.listItem, element?: ElementRef): Observable<null> {
    listItem.selected = undefined;
    if (!entityIRI || !listItem) {
      if (listItem) {
        listItem.selectedBlankNodes = [];
        listItem.blankNodes = {};
      }
      return of(null);
    }
    if (element) {
      this.spinnerSvc.startLoadingForComponent(element);
    }
    return this.sgm.getShapesGraphEntity(listItem.versionedRdfRecord.recordId,
      listItem.versionedRdfRecord.branchId,
      listItem.versionedRdfRecord.commitId,
      entityIRI
    ).pipe(
      finalize(() => {
        if (element) {
          this.spinnerSvc.finishLoadingForComponent(element);
        }
      }),
      map((arr: JSONLDObject[]) => {
        listItem.selected = find(arr, { '@id': entityIRI });
        listItem.selectedBlankNodes = getArrWithoutEntity(entityIRI, arr);
        const bnodeIndex = this.getBnodeIndex(listItem.selectedBlankNodes);
        listItem.selectedBlankNodes.forEach(bnode => {
          listItem.blankNodes[bnode['@id']] = this.mc.jsonldToManchester(bnode['@id'], listItem.selectedBlankNodes, bnodeIndex, true);
        });
        return null;
      })
    );
  }

  /**
   * Creates a display of the specified property value on the selected entity on the currently selected
   * {@link ShapesGraphStateService} based on whether it is a data property value, object property value, or blank node.
   *
   * @param {string} key The IRI of a property on the current entity
   * @param {number} index The index of a specific property value
   * @return {string} A string a display of the property value
   */
  getPropValueDisplay(key: string, index: number): string {
    return get(this.listItem.selected[key], `[${index}]["@value"]`)
      || get(this.listItem.selected[key], `[${index}]["@id"]`);
  }

  /**
   * Removes the specified property value on the selected entity on the currently selected {@link ShapesGraphListItem},
   * updating the InProgressCommit, everything hierarchy, and property hierarchy.
   *
   * @param {string} key The IRI of a property on the current entity
   * @param {number} index The index of a specific property value
   * @return {Observable} An Observable that resolves with the JSON-LD value object that was removed
   */
  removeProperty(key: string, index: number): Observable<JSONLDId | JSONLDValue> {
    const axiomObject: JSONLDId | JSONLDValue = this.listItem.selected[key][index];
    const json: JSONLDObject = {
      '@id': this.listItem.selected['@id'],
      [key]: [cloneDeep(axiomObject)]
    };
    this.addToDeletions(this.listItem.versionedRdfRecord.recordId, json);
    if (isBlankNodeId(axiomObject['@id'])) {
      remove(axiomObject['@id']);
    }
    this.propertyManager.remove(this.listItem.selected, key, index);
    return this.saveCurrentChanges()
      .pipe(map(() => {
        return axiomObject;
      }));
  }

  /**
   * Determines whether the provided id is "linkable", i.e. that a link could be made to take a user to that entity.
   * Id must be present in the indices of the currently selected {@link ShapesGraphListItem} and not be a blank node id.
   *
   * @param {string} id An id from the current ontology
   * @returns {boolean} True if the id exists as an entity and not a blank node; false otherwise
   */
  isLinkable(id: string): boolean {
    return false;
  }

  /**
   * Updates the currently selected {@link ShapesGraphListItem} to view the entity identified by the provided IRI.
   * Updates the selected tab in the editor and all required variables in order to view the details of the entity.
   * 
   * @param {string} iri The IRI of the entity to open the editor at
   */
  goTo(iri: string): void {
    throw new Error('goTo functionality for ShapesGraphListItem not supported.');
  }

  /**
   * Determines whether the selected IRI of the provided {@link ShapesGraphListItem} is imported or not. Defaults to true.
   *
   * @param {ShapesGraphListItem} [listItem=listItem] The listItem to execute these actions against
   * @returns {boolean} True if the selected IRI is imported; false otherwise
   */
  isSelectedImported(listItem: ShapesGraphListItem = this.listItem): boolean {
    const selected = this.listItem.selected;
    if (listItem && selected) {
      const iri = get(selected, '@id', '');
      return iri ? this.isImported(iri, listItem) : false;
    }
    return true; // This occurs when auth interceptor clears the state
  }

  /**
   * Determines whether the provided IRI is marked as imported in the given {@link ShapesGraphListItem}.
   * If no status is found for the IRI, it defaults to `true`.
   *
   * If an `entityPredicate` is provided, the method will look for a specific predicate in the entity's
   * import status and return its `imported` flag.
   *
   * @param {string} iri - The IRI of the entity to check.
   * @param {ShapesGraphListItem} [listItem=this.listItem] - The list item to check against. Defaults to the current list item.
   * @returns {boolean} `true` if the IRI (or predicate) is considered imported; otherwise `false`.
   */
  isImported(iri: string, listItem: ShapesGraphListItem = this.listItem): boolean {
    const entityImportStatus: EntityImportStatus = listItem?.subjectImportMap[iri];
    return !entityImportStatus ? true : entityImportStatus.imported;
  }

  /**
   * Checks whether an IRI exists in the currently selected {@link ShapesGraphListItem} and it not the current selected
   * entity.
   * 
   * @param {string} iri The entity IRI to check
   * @returns {boolean} True if the entity exists in the `listItem` but is not selected
   */
  checkIri(iri: string): boolean {
    const isCurrentIri = iri === get(this.listItem.selected, '@id');
    if (isCurrentIri) {
      return false;
    }
    const iriExists = !!this.listItem?.subjectImportMap[iri]; 
    return iriExists;
  }

  /**
   * Returns the source shape IRI for the currently selected node in the shapes graph.
   *
   * Retrieves `sourceShape` from the `nodeTab` of the current `listItem`.
   * Returns an empty string if not defined.
   *
   * @returns {string} The source shape IRI or an empty string.
   */
  getImportedSource(): string {
    return this.listItem?.nodeTab?.sourceShape || '';
  }

  /**
   * Performs a SPARQL query to retrieve the entity names for all IRIs within the Shapes Graph record as represented by
   * the provided {@link ShapesGraphListItem}. The query retrieves labels and names for each entity IRI and searches
   * across the entire imports closure.
   *
   * @param {ShapesGraphListItem} [listItem=this.listItem] The ShapesGraphListItem representing the Shapes Graph record
   * for which to retrieve the entity names. Defaults to the currently selected listItem.
   * @returns {Observable<EntityNames>} An Observable that emits a {@link EntityNames} mapping each entity IRI to its
   *    label and names.
   */
  getEntityNames(listItem: ShapesGraphListItem = this.listItem): Observable<EntityNames> {
    return this.sparql.postQuery(this._ENTITY_NAMES_QUERY, listItem.versionedRdfRecord.recordId, SHAPES_STORE_TYPE,
        listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, true, true)
      .pipe(map((results: SPARQLSelectResults) => {
        const entityNames: EntityNames = {};
        results.results.bindings.forEach(binding => {
          const iri = binding.iri.value;
          const names = binding.names.value.split('�');
          entityNames[iri] = {
            label: names[0],
            names
          };
        });
        return entityNames;
      }));
  }
}