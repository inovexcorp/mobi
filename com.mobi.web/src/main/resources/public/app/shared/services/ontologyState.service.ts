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
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, throwError, from, Observable, of, Subject, merge as rxjsMerge } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
    assign,
    concat,
    difference,
    find,
    findIndex,
    flatten,
    flattenDeep,
    forEach,
    forOwn,
    get,
    groupBy,
    has,
    head,
    identity,
    includes,
    initial,
    intersection,
    isEmpty,
    isEqual,
    isObject,
    join,
    keys,
    lowerCase,
    mapValues,
    merge,
    mergeWith,
    omit,
    pull,
    remove,
    replace,
    set,
    some,
    sortBy,
    tail,
    trim,
    truncate,
    union,
    uniq,
    unset,
    values,
    without,
    cloneDeep
} from 'lodash';
import { switchMap, map, catchError, tap, finalize } from 'rxjs/operators';
import { ElementRef, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { CatalogManagerService } from './catalogManager.service';
import { CatalogDetails, VersionedRdfState } from './versionedRdfState.service';
import { CATALOG, DCTERMS, ONTOLOGYSTATE, OWL, RDF, RDFS, SKOS, XSD, ONTOLOGYEDITOR } from '../../prefixes';
import { OntologyManagerService } from './ontologyManager.service';
import { OntologyListItem } from '../models/ontologyListItem.class';
import { splitIRI } from '../pipes/splitIRI.pipe';
import { Hierarchy } from '../models/hierarchy.interface';
import { VocabularyStuff } from '../models/vocabularyStuff.interface';
import { OntologyStuff } from '../models/ontologyStuff.interface';
import { HierarchyNode } from '../models/hierarchyNode.interface';
import { EntityNamesItem } from '../models/entityNamesItem.interface';
import { OntologyRecordActionI } from './ontologyRecordAction.interface';
import { OntologyAction } from '../models/ontologyAction';
import { JSONLDId } from '../models/JSONLDId.interface';
import { JSONLDValue } from '../models/JSONLDValue.interface';
import { StateManagerService } from './stateManager.service';
import { ParentNode } from '../models/parentNode.interface';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { ToastService } from './toast.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { PolicyManagerService } from './policyManager.service';
import { ManchesterConverterService } from './manchesterConverter.service';
import { PropertyManagerService } from './propertyManager.service';
import { UpdateRefsService } from './updateRefs.service';
import { YasguiQuery } from '../models/yasguiQuery.class';
import { getBeautifulIRI, getDctermsValue, getIRINamespace, getPropertyId, isBlankNodeId, mergingArrays } from '../utility';
import { SPARQLSelectBinding } from '../models/sparqlSelectResults.interface';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { EventPayload, EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';
import { RecordSelectFiltered } from '../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { SettingManagerService } from './settingManager.service';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { XACMLRequest } from '../models/XACMLRequest.interface';

/**
 * @class shared.OntologyStateService
 * 
 * A service which contains various variables to hold the state of the Ontology Editor page and utility functions to
 * update those variables.
 */
@Injectable()
export class OntologyStateService extends VersionedRdfState<OntologyListItem> {
    type = `${ONTOLOGYEDITOR}OntologyRecord`;
  
    private _updateRefsExclude = [
        'element',
        'usagesElement',
        'branches',
        'tags',
        'failedImports',
        'openSnackbar',
        'versionedRdfRecord',
        'merge',
        'selectedCommit'
    ];

    // Static lists of SKOS vocabulary related IRIs
    static broaderRelations = [
        `${SKOS}broaderTransitive`,
        `${SKOS}broader`,
        `${SKOS}broadMatch`
    ];
    static narrowerRelations = [
        `${SKOS}narrowerTransitive`,
        `${SKOS}narrower`,
        `${SKOS}narrowMatch`
    ];
    static conceptToScheme = [
        `${SKOS}inScheme`,
        `${SKOS}topConceptOf`
    ];
    static schemeToConcept = [
        `${SKOS}hasTopConcept`
    ];

    // A subject used to emit OntologyRecord related actions. Only this service has access to the subject, but the 
    // Observable is accessible anywhere
    private _ontologyRecordActionSubject = new Subject<OntologyRecordActionI>();
    ontologyRecordAction$ = this._ontologyRecordActionSubject.asObservable();

    constructor(public snackBar: MatSnackBar, 
        protected sm: StateManagerService, 
        protected cm: CatalogManagerService,
        protected mrm: MergeRequestManagerService,
        protected spinnerSvc: ProgressSpinnerService, 
        protected om: OntologyManagerService,
        public toast: ToastService, 
        protected updateRefs: UpdateRefsService, 
        protected pm: PropertyManagerService, 
        protected mc: ManchesterConverterService, 
        protected pe: PolicyEnforcementService, 
        protected polm: PolicyManagerService,
        protected stm: SettingManagerService) {
            super(ONTOLOGYSTATE,
                'http://mobi.com/states/ontology-editor/branch-id/',
                'http://mobi.com/states/ontology-editor/tag-id/',
                'http://mobi.com/states/ontology-editor/commit-id/',
                'ontology-editor'
            );
            rxjsMerge(
                mrm.mergeRequestAction$,
                cm.catalogManagerAction$
            ).pipe(
                switchMap((event: EventWithPayload) => {
                    const eventType = event?.eventType;
                    const payload = event?.payload;
                    if (eventType && payload){
                        const ob = this._handleEventWithPayload(eventType, payload);
                        if (ob) {
                          return ob;
                        }
                        return of(false);
                    } else {
                        toast.createErrorToast('Event type and payload is required');
                        return of(false);
                    }
                })
            ).subscribe();
    }
    // Updates state based on Event type. Handles branch removals and accept merge requests.
    _handleEventWithPayload(eventType: string, payload: EventPayload): Observable<null>{
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
                            this.toast.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form.', {timeOut: 5000});
                        }
                    }
                    if (this.listItem.merge.active && get(this.listItem.merge.target, '@id') === targetBranchId) {
                        this.toast.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form to avoid conflicts.', {timeOut: 5000});
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
     * Initializes the `catalogId` variable.
     */
    initialize(): void {
      this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    // Abstract Methods
    /**
     * Returns the namespace to be used for new OntologyRecords from the application settings
     */
    getDefaultNamespace(): Observable<string> {
      return this.stm.getDefaultNamespace();
    }
    /**
     * Returns the display name of an entity within the currently selected OntologyRecord. Pulls from the calculated
     * and cached entity names of the ontology.
     */
    getEntityName(entityId: string): string {
      return this._getEntityNameByListItem(entityId);
    }
    /**
     * Returns the Ontology IRI associated with an OntologyRecord. If no JSON-LD Object of the Record is provided, will
     * pull the identifier IRI from the currently selected listItem.
     */
    getIdentifierIRI(record?: JSONLDObject): string {
      return record ? getPropertyId(record, `${ONTOLOGYEDITOR}ontologyIRI`) : this.listItem.ontologyId;
    }
    /**
     * Opens the OntologyRecord identified by the provided details in the Ontology Editor.
     */
    open(record: RecordSelectFiltered): Observable<null> {
      let listItem;
      return this.getCatalogDetails(record.recordId)
        .pipe(
          switchMap((response: CatalogDetails) => this.createOntologyListItem(response.recordId, 
            response.branchId, 
            response.commitId, 
            response.tagId, 
            response.inProgressCommit, 
            response.upToDate, 
            record.title
          )),
          switchMap(response => {
            listItem = response;
            this.list.push(listItem);
            return this.setSelected(this.getActiveEntityIRI(listItem), false, listItem);
          }),
          map(() => {
            this.listItem = listItem;
            return null;
          })
        );
    }
    /**
     * Creates a new OntologyRecord given the provided details, but will not open it immediately in the Ontology Editor.
     */
    create(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse> {
      if (!rdfUpload.jsonld && !rdfUpload.file) {
        return throwError('Creation requires a file or JSON-LD');
      }
      return this.om.uploadOntology(rdfUpload, true);
    }
    /**
     * Creates a new OntologyRecord and opens it in the Ontology Editor. If a file was provided, fetches all appropriate
     * information from the backend when setting up listItem. If JSON-LD provided, assumes it is a new ontology case and
     * manually sets only the data needed to reduce extra logic.
     */
    createAndOpen(rdfUpload: RdfUpload): Observable<VersionedRdfUploadResponse> {
      if (!rdfUpload.jsonld && !rdfUpload.file) {
        return throwError('Creation requires a file or JSON-LD');
      }
      let listItem: OntologyListItem;
      return this.om.uploadOntology(rdfUpload).pipe(
        switchMap((data: {ontologyId: string, recordId: string, branchId: string, commitId: string}) => {
          if (rdfUpload.file) {
            return this.createOntologyListItem(data.recordId, data.branchId, data.commitId, undefined, new Difference(), true, 
              rdfUpload.title);
          }
          const newListItem = this._setupListItem(data.recordId, data.branchId, data.commitId, undefined, new Difference(), true, rdfUpload.title);
          newListItem.ontologyId = data.ontologyId;
          newListItem.editorTabStates.project.entityIRI = data.ontologyId;
          newListItem.masterBranchIri = data.branchId;
          newListItem.userCanModify = true;
          newListItem.userCanModifyMaster = true;
          return of(newListItem);
        }),
        switchMap(newListItem => {
          listItem = newListItem;
          return this.createState({
            recordId: listItem.versionedRdfRecord.recordId,
            commitId: listItem.versionedRdfRecord.commitId,
            branchId: listItem.versionedRdfRecord.branchId
          });
        }),
        switchMap(() => {
          this.list.push(listItem);
          this.listItem = listItem;
          return this.setSelected(this.getActiveEntityIRI(), false, this.listItem);
        }),
        map(() => ({
          recordId: listItem.versionedRdfRecord.recordId,
          branchId: listItem.versionedRdfRecord.branchId,
          commitId: listItem.versionedRdfRecord.commitId,
          ontologyId: listItem.ontologyId,
          title: listItem.versionedRdfRecord.title
        }))
      );
    }
    /**
     * Deletes the OntologyRecord identified by the record IRI starting with its state then the record itself.
     */
    delete(recordId: string): Observable<void> {
      return this.deleteState(recordId).pipe(
        switchMap(() => this.om.deleteOntology(recordId))
      );
    }
    /**
     * Download's a specific OntologyRecord's data. Calls the Ontology endpoint.
     */
    download(rdfDownload: RdfDownload): void {
      this.om.downloadOntology(rdfDownload.recordId, 
        rdfDownload.branchId, 
        rdfDownload.commitId, 
        rdfDownload.rdfFormat, 
        rdfDownload.fileName);
    }
    /**
     * Remove's the user's In Progress Commit for the currently selected OntologyRecord. Calls the Catalog endpoint,
     * then resets the state of the Ontology Editor tabs and calls changeVersion to switch the Ontology data back to the
     * currently checked out version and clear out the frontend cached In Progress Commit.
     */
    removeChanges(): Observable<null> {
      return this.cm.deleteInProgressCommit(this.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(
        switchMap(() => this.resetStateTabs()),
        switchMap(() => this.changeVersion(this.listItem.versionedRdfRecord.recordId, 
          this.listItem.versionedRdfRecord.branchId, 
          this.listItem.versionedRdfRecord.commitId, 
          undefined, 
          this.listItem.currentVersionTitle, 
          this.listItem.upToDate, 
          true, 
          this.listItem.changesPageOpen
        ))
      );
    }
    /**
     * Handles uploading changes to the OntologyRecord identified by the provided details. Calls the Ontology endpoint,
     * then fetches the In Progress Commit, updates the frontend cached In Progress Commit, and calls changeVersion to
     * update the Ontology data to the updated data.
     */
    uploadChanges(rdfUpdate: RdfUpdate): Observable<null> {
      return this.om.uploadChangesFile(rdfUpdate.file, rdfUpdate.recordId, rdfUpdate.branchId, rdfUpdate.commitId)
        .pipe(
          switchMap(() => this.cm.getInProgressCommit(rdfUpdate.recordId, this.catalogId)),
          catchError((response: HttpErrorResponse): Observable<string> => {
            if (typeof response === 'string'){
              return throwError({errorMessage: response, errorDetails: []});
            } else if (typeof response === 'object' && 'errorMessage' in response){
              return throwError(response);
            } else if (response.status === 404) {
              return throwError({errorMessage: 'No changes were found in the uploaded file.', errorDetails: []});
            } else {
              return throwError({errorMessage: 'Something went wrong. Please try again later.', errorDetails: []});
            }
          }),
          switchMap((commit: Difference) => {
            const listItem = this.getListItemByRecordId(rdfUpdate.recordId);
            listItem.inProgressCommit = commit;
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
     * Updates the OntologyRecord associated with the provided record IRI when the checked out version changes. It will 
     * merge a new listItem into the existing listItem with the provided version details, the original record title, 
     * removes the In Progress Commit from the listItem if specified, resets the state of the Ontology Editor tabs if
     * the ontology IRI changed, sets the selected tab to the project tab if the ontology was previously a vocabulary
     * and a vocabulary related tab was selected, and updates the ontology data to the version's data.
     */
    changeVersion(recordId: string, branchId: string, commitId: string, tagId: string, versionTitle: string, 
      upToDate: boolean, clearInProgressCommit: boolean, changesPageOpen: boolean): Observable<null> {
      const state: VersionedRdfStateBase = {
        recordId,
        branchId,
        commitId,
        tagId
      };
      let oldListItem: OntologyListItem;
      let newListItem: OntologyListItem;
      return this.updateState(state).pipe(
        switchMap(() => {
          oldListItem = this.getListItemByRecordId(recordId);
          if (clearInProgressCommit) {
            oldListItem.inProgressCommit = new Difference();
          }
          return this.createOntologyListItem(recordId, branchId, commitId, tagId, oldListItem.inProgressCommit, upToDate, oldListItem.versionedRdfRecord.title);
        }),
        switchMap(createdItem => {
          newListItem = createdItem;
          newListItem.editorTabStates = oldListItem.editorTabStates;
          newListItem.changesPageOpen = changesPageOpen;
          return this.resetStateTabs(newListItem);
        }),
        map(() => {
          if (versionTitle) {
            newListItem.currentVersionTitle = versionTitle;
          }
          const tabIndex = oldListItem.tabIndex;
          const prevActiveKey = this.getActiveKey();
          assign(oldListItem, newListItem);
          if (!newListItem.isVocabulary && (prevActiveKey === 'concepts' || prevActiveKey === 'schemes')) {
              oldListItem.tabIndex = 0;
          } else {
            oldListItem.tabIndex = tabIndex;
          }
          return null;
        })
      );
    }
    /**
     * Adds additional clearing of the state of the Ontology Editor tabs when a merge is attempted.
     */
    attemptMerge(): Observable<null> {
      return super.attemptMerge().pipe(
        switchMap(() => this.resetStateTabs()));
    }
    /**
     * Performs a merge of the source/current branch of the currently selected OntologyRecord into the selected target
     * branch with any chosen resolutions. Updates the Ontology data to the new merge commit's data. Handles deleting
     * the source branch if the checkbox was marked. Will not open the changes page. Resets the state of the Ontology
     * Editor tabs at the end.
     */
    merge(): Observable<null> {
      const sourceId = this.listItem.versionedRdfRecord.branchId;
      const checkbox = this.listItem.merge.checkbox;
      let commitId;
      return this.cm.mergeBranches(sourceId, this.listItem.merge.target['@id'], this.listItem.versionedRdfRecord.recordId, this.catalogId, this.listItem.merge.resolutions)
        .pipe(
          switchMap((commit: string) => {
            commitId = commit;
            if (checkbox) {
                return this.cm.deleteRecordBranch(this.listItem.versionedRdfRecord.recordId, sourceId, this.catalogId);
            } else {
                return of(1);
            }
          }),
          switchMap(() => this.changeVersion(this.listItem.versionedRdfRecord.recordId, 
            this.listItem.merge.target['@id'], 
            commitId, 
            undefined, 
            getDctermsValue(this.listItem.merge.target, 'title'), 
            true, 
            false, 
            false)
          ),
          switchMap(() => this.resetStateTabs())
        );
    }
    /**
     * Adds additional ontology action emit to state creation
     */
    createState(versionedRdfStateBase: VersionedRdfStateBase): Observable<null> {
      return super.createState(versionedRdfStateBase).pipe(finalize(() => {
        this._ontologyRecordActionSubject.next({recordId: versionedRdfStateBase.recordId, action: OntologyAction.UPDATE_STATE});
      }));
    }
    /**
     * Adds additional ontology action emit to state updates
     */
    updateState(versionedRdfStateBase: VersionedRdfStateBase): Observable<null> {
      return super.updateState(versionedRdfStateBase).pipe(finalize(() => {
        this._ontologyRecordActionSubject.next({recordId: versionedRdfStateBase.recordId, action: OntologyAction.UPDATE_STATE});
      }));
    }
    /**
     * Adds additional ontology action emit to ontology close
     * @param recordId 
     */
    close(recordId: string): void {
      super.close(recordId);
      this.emitOntologyAction({ action: OntologyAction.ONTOLOGY_CLOSE, recordId });
    }

    // Custom Methods
    /**
     * Emit ontology events or actions
     * @param { OntologyRecordActionI } action The action Object
     */
    emitOntologyAction(action: OntologyRecordActionI): void {
      this._ontologyRecordActionSubject.next(action);
    }
    /**
     * Creates an {@link OntologyListItem} given the provided input parameters. Fetches the "ontology stuff" and
     * branches of the identified ontology and setups all the various state variables on the listItem. Does not add to
     * the `list` in this method.
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
    createOntologyListItem(recordId: string, branchId: string, commitId: string, tagId: string, inProgressCommit: Difference, upToDate = true, title: string): Observable<OntologyListItem> {
        const modifyRequest: XACMLRequest = {
            resourceId: recordId,
            actionId: this.polm.actionModify
        };
        const listItem: OntologyListItem = this._setupListItem(recordId, branchId, commitId, tagId, inProgressCommit, upToDate, title);
        return forkJoin([
            this.om.getOntologyStuff(recordId, branchId, commitId),
            this.cm.getRecordBranches(recordId, this.catalogId),
        ]).pipe(
            switchMap(response => {
                listItem.ontologyId = response[0].ontologyIRI;
                listItem.editorTabStates.project.entityIRI = response[0].ontologyIRI;    
                forEach(response[0].propertyToRanges, (ranges, propertyIRI) => {
                    listItem.propertyIcons[propertyIRI] = this._getIcon(ranges);
                });
                listItem.noDomainProperties = response[0].noDomainProperties;
                listItem.classToChildProperties = response[0].classToAssociatedProperties;
                listItem.iriList.push(listItem.ontologyId);
                listItem.entityInfo = get(response[0], 'entityNames', {});
                const responseIriList = get(response[0], 'iriList', {});
                listItem.iriList = union(listItem.iriList, flatten(values(responseIriList)));
                get(responseIriList, 'annotationProperties', []).forEach(iri => this._addIri(listItem, 'annotations.iris', iri, listItem.ontologyId));
                get(responseIriList, 'classes', []).forEach(iri => this.addToClassIRIs(listItem, iri));
                get(responseIriList, 'dataProperties', []).forEach(iri => this._addIri(listItem, 'dataProperties.iris', iri, listItem.ontologyId));
                get(responseIriList, 'objectProperties', []).forEach(iri => this._addIri(listItem, 'objectProperties.iris', iri, listItem.ontologyId));
                get(responseIriList, 'namedIndividuals', []).forEach(iri => this._addIri(listItem, 'individuals.iris', iri, listItem.ontologyId));
                get(responseIriList, 'concepts', []).forEach(iri => this._addIri(listItem, 'concepts.iris', iri, listItem.ontologyId));
                get(responseIriList, 'conceptSchemes', []).forEach(iri => this._addIri(listItem, 'conceptSchemes.iris', iri, listItem.ontologyId));
                get(responseIriList, 'deprecatedIris', []).forEach(iri => this.annotationModified(iri, `${OWL}deprecated`, 'true', listItem));
                listItem.derivedConcepts = get(responseIriList, 'derivedConcepts', []);
                listItem.derivedConceptSchemes = get(responseIriList, 'derivedConceptSchemes', []);
                listItem.derivedSemanticRelations = get(responseIriList, 'derivedSemanticRelations', []);
                get(responseIriList, 'datatypes', []).forEach(iri => this._addIri(listItem, 'dataPropertyRange', iri, listItem.ontologyId));
                get(response[0], 'importedOntologies').forEach(importedOntObj => {
                    this._addImportedOntologyToListItem(listItem, importedOntObj);
                });
                forEach(get(response[0], 'importedIRIs'), iriList => {
                    iriList.annotationProperties.forEach(iri => this._addIri(listItem, 'annotations.iris', iri, iriList.id));
                    iriList.classes.forEach(iri => this.addToClassIRIs(listItem, iri, iriList.id));
                    iriList.dataProperties.forEach(iri => this._addIri(listItem, 'dataProperties.iris', iri, iriList.id));
                    iriList.objectProperties.forEach(iri => this._addIri(listItem, 'objectProperties.iris', iri, iriList.id));
                    iriList.namedIndividuals.forEach(iri => this._addIri(listItem, 'individuals.iris', iri, iriList.id));
                    iriList.concepts.forEach(iri => this._addIri(listItem, 'concepts.iris', iri, iriList.id));
                    iriList.conceptSchemes.forEach(iri => this._addIri(listItem, 'conceptSchemes.iris', iri, iriList.id));
                    iriList.datatypes.forEach(iri => this._addIri(listItem, 'dataPropertyRange', iri, iriList.id));
                    listItem.iriList.push(iriList['id']);
                    listItem.iriList = union(listItem.iriList, flatten(values(iriList)));
                });
                this._setHierarchyInfo(listItem.classes, response[0], 'classHierarchy');
                listItem.classes.flat = this.flattenHierarchy(listItem.classes, listItem);
                this._setHierarchyInfo(listItem.dataProperties, response[0], 'dataPropertyHierarchy');
                listItem.dataProperties.flat = this.flattenHierarchy(listItem.dataProperties, listItem);
                this._setHierarchyInfo(listItem.objectProperties, response[0], 'objectPropertyHierarchy');
                listItem.objectProperties.flat = this.flattenHierarchy(listItem.objectProperties, listItem);
                this._setHierarchyInfo(listItem.annotations, response[0], 'annotationHierarchy');
                listItem.annotations.flat = this.flattenHierarchy(listItem.annotations, listItem);
                this._setHierarchyInfo(listItem.concepts, response[0], 'conceptHierarchy');
                listItem.concepts.flat = this.flattenHierarchy(listItem.concepts, listItem);
                this._setHierarchyInfo(listItem.conceptSchemes, response[0], 'conceptSchemeHierarchy');
                listItem.conceptSchemes.flat = this.flattenHierarchy(listItem.conceptSchemes, listItem);
                listItem.classesAndIndividuals = response[0].individuals;
                listItem.classesWithIndividuals = keys(listItem.classesAndIndividuals);
                listItem.individualsParentPath = this.getIndividualsParentPath(listItem);
                listItem.individuals.flat = this.createFlatIndividualTree(listItem);
                listItem.flatEverythingTree = this.createFlatEverythingTree(listItem);
                concat(this.pm.ontologyProperties, keys(listItem.dataProperties.iris), keys(listItem.objectProperties.iris), listItem.derivedSemanticRelations, this.pm.conceptSchemeRelationshipList, this.pm.schemeRelationshipList).forEach(iri => delete listItem.annotations.iris[iri]);
                listItem.failedImports = get(response[0], 'failedImports', []);
                const branch = find(response[1].body, { '@id': listItem.versionedRdfRecord.branchId });
                listItem.userBranch = this.cm.isUserBranch(branch);
                if (listItem.userBranch) {
                    listItem.createdFromExists = some(response[1].body, {'@id': getPropertyId(branch, `${CATALOG}createdFrom`)});
                }
                listItem.masterBranchIri = find(response[1].body, {[`${DCTERMS}title`]: [{'@value': 'MASTER'}]})['@id'];
                return from(this.pe.evaluateRequest(modifyRequest));
            }),
            switchMap(decision => {
                listItem.userCanModify = decision === this.pe.permit;
                modifyRequest.actionAttrs = {[`${CATALOG}branch`]: listItem.masterBranchIri};
                return this.pe.evaluateRequest(modifyRequest);
            }),
            map(decision => {
                listItem.userCanModifyMaster = decision === this.pe.permit;
                return listItem;
            })
        );
    }
    /**
     * Fetches the "vocabulary stuff" of the OntologyRecord represented by the provided {@link OntologyListItem} and
     * sets the appropriate variables.
     * 
     * @param {OntologyListItem} listItem The OntologyRecord to fetch "vocabulary stuff" for
     */
    setVocabularyStuff(listItem: OntologyListItem = this.listItem): void {
        this.om.getVocabularyStuff(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId)
            .subscribe(response => {
                listItem.derivedConcepts = get(response, 'derivedConcepts', []);
                listItem.derivedConceptSchemes = get(response, 'derivedConceptSchemes', []);
                listItem.derivedSemanticRelations = get(response, 'derivedSemanticRelations', []);
                listItem.concepts.iris = {};
                listItem.conceptSchemes.iris = {};
                response.concepts.forEach(iri => this._addIri(listItem, 'concepts.iris', iri, listItem.ontologyId));
                response.conceptSchemes.forEach(iri => this._addIri(listItem, 'conceptSchemes.iris', iri, listItem.ontologyId));
                forEach(get(response, 'importedIRIs'), iriList => {
                    iriList.concepts.forEach(iri => this._addIri(listItem, 'concepts.iris', iri, iriList.id));
                    iriList.conceptSchemes.forEach(iri => this._addIri(listItem, 'conceptSchemes.iris', iri, iriList.id));
                });
                this._setHierarchyInfo(listItem.concepts, response, 'conceptHierarchy');
                listItem.concepts.flat = this.flattenHierarchy(listItem.concepts, listItem);
                this._setHierarchyInfo(listItem.conceptSchemes, response, 'conceptSchemeHierarchy');
                listItem.conceptSchemes.flat = this.flattenHierarchy(listItem.conceptSchemes, listItem);
                unset(listItem.editorTabStates.concepts, 'entityIRI');
                unset(listItem.editorTabStates.concepts, 'usages');
            }, error => this.toast.createErrorToast(error));
    }
    /**
     * Gets the unique list of parents that should be displayed in the individuals hierarchy for the provided
     * {@link OntologyListItem}.
     * 
     * @param {OntologyListItem} listItem The listItem to investigate
     * @returns {string[]} An array of the IRIs of all the classes involved in the parent paths to the individuals
     */
    getIndividualsParentPath(listItem: OntologyListItem): string[] {
        let result = [];
        Object.keys(listItem.classesAndIndividuals).forEach(classIRI => {
            result = result.concat(this._getParents(listItem.classes.childMap, classIRI));
        });
        return uniq(result);
    }
    private _getParents(childMap: {[key: string]: string[]}, classIRI: string): string[] {
        const result = [classIRI];
        if (has(childMap, classIRI)) {
            const toFind = [classIRI];
            while (toFind.length) {
                const temp = toFind.pop();
                childMap[temp].forEach(parent => {
                    result.push(parent);
                    if (has(childMap, parent)) {
                        toFind.push(parent);
                    }
                });
            }
        }
        return result;
    }
    /**
     * Flattens the provided hierarchy information into an array that represents the hierarchical structure to be
     * used with a virtual scrolling solution for the provided {@link OntologyListItem}.
     *
     * @param {Hierarchy} hierarchyInfo An Object with hierarchical information. Expects it to have a `iris` key with
     * an object of iris in the hierarchy, a `parentMap` key with a map of parent IRIs to arrays of children IRIs,
     * and a `childMap` key with a map of child IRIs to arrays of parent IRIs.
     * @param {OntologyListItem} [listItem=this.listItem] The listItem associated with the provided hierarchy.
     * @returns {HierarchyNode[]} An array which represents the provided hierarchy.
     */
    flattenHierarchy(hierarchyInfo: Hierarchy, listItem: OntologyListItem = this.listItem): HierarchyNode[] {
        const topLevel = difference(Object.keys(hierarchyInfo.iris), Object.keys(hierarchyInfo.childMap)).sort((s1, s2) => this._compareEntityName(s1, s2, listItem));
        const sortedParentMap = mapValues(hierarchyInfo.parentMap, arr => arr.sort((s1, s2) => this._compareEntityName(s1, s2, listItem)));
        const result = [];
        forEach(topLevel, iri => {
            this._addNodeToFlatHierarchy(iri, result, 0, [listItem.versionedRdfRecord.recordId], sortedParentMap, listItem, listItem.versionedRdfRecord.recordId);
        });
        return result;
    }
    /**
     * Creates an array which represents the hierarchical structure of the relationship between classes
     * and properties of the ontology represented by the provided {@link OntologyListItem} to be used with a virtual
     * scrolling solution.
     *
     * @param {OntologyListItem} listItem The listItem representing the ontology to create the structure for
     * @returns {(HierarchyNode|ParentNode)[]} An array which contains the class-property relationships.
     */
    createFlatEverythingTree(listItem: OntologyListItem = this.listItem): (HierarchyNode|ParentNode)[] {
        const result: (HierarchyNode|ParentNode)[] = [];
        const classes = Object.keys(listItem.classes.iris).map(entityIRI => ({
            entityIRI,
            entityInfo: listItem.entityInfo[entityIRI]
        }));
        const orderedClasses = sortBy(classes, item => lowerCase(item.entityInfo.label));
        let orderedProperties = [];
        let path = [];

        orderedClasses.forEach(item => {
            const classProps = get(listItem.classToChildProperties, item.entityIRI, []);

            orderedProperties = classProps.sort((s1, s2) => this._compareEntityName(s1, s2, listItem));
            path = [listItem.versionedRdfRecord.recordId, item.entityIRI];
            result.push(merge({}, item, {
                indent: 0,
                hasChildren: !!orderedProperties.length,
                path,
                joinedPath: this.joinPath(path)
            }));
            orderedProperties.forEach(property => {
                result.push({
                    entityIRI: property,
                    indent: 1,
                    hasChildren: false,
                    path: concat(path, property),
                    joinedPath: this.joinPath(concat(path, property)),
                    entityInfo: this._getEntityInfoFromListItem(listItem, property)
                });
            });
        });
        const noDomainProps = listItem.noDomainProperties;

        const orderedNoDomainProperties = noDomainProps.sort((s1, s2) => this._compareEntityName(s1, s2, listItem));
        if (orderedNoDomainProperties.length) {
            result.push({
                title: 'Properties',
                get: this.getNoDomainsOpened.bind(this),
                set: this.setNoDomainsOpened.bind(this)
            });
            orderedNoDomainProperties.forEach(property => {
                result.push({
                    entityIRI: property,
                    indent: 1,
                    hasChildren: false,
                    get: this.getNoDomainsOpened.bind(this),
                    path: [listItem.versionedRdfRecord.recordId, property],
                    joinedPath: this.joinPath([listItem.versionedRdfRecord.recordId, property]),
                    entityInfo: this._getEntityInfoFromListItem(listItem, property)
                });
            });
        }
        return result;
    }
    /**
     * Creates an array which represents the hierarchical structure of the relationship between classes
     * and individuals to be used with a virtual scrolling solution.
     *
     * @param {OntologyListItem} listItem The listItem linked to the ontology you want to add the entity to.
     * @returns {HierarchyNode[]} An array which contains the class-individuals relationships.
     */
    createFlatIndividualTree(listItem: OntologyListItem): HierarchyNode[] {
        const result = [];
        const neededClasses = get(listItem, 'individualsParentPath', []);
        const classesWithIndividuals = get(listItem, 'classesAndIndividuals', {});
        if (neededClasses.length && !isEmpty(classesWithIndividuals)) {
            get(listItem, 'classes.flat', []).forEach(node => {
                if (includes(neededClasses, node.entityIRI)) {
                    result.push(merge({}, node, {isClass: true}));
                    const sortedIndividuals: string[] = sortBy(get(classesWithIndividuals, node.entityIRI), entityIRI => lowerCase(this._getEntityNameByListItem(entityIRI, listItem)));
                    sortedIndividuals.forEach(entityIRI => {
                        this._addNodeToFlatHierarchy(entityIRI, result, node.indent + 1, node.path, {}, listItem, this.joinPath(node.path));
                    });
                }
            });
        }
        return result;
    }
    /**
     * Adds the entity represented by the entityJSON to the provided {@link OntologyListItem}. Adds the new entity to
     * the index.
     *
     * @param {JSONLDObject} entityJSON The JSON-LD representation for the entity you want to add to the ontology.
     * @param {OntologyListItem} [listItem=listItem] The listItem linked to the ontology you want to add the entity to.
     */
    addEntity(entityJSON: JSONLDObject, listItem: OntologyListItem = this.listItem): void {
        listItem.iriList.push(entityJSON['@id']);
        get(listItem, 'entityInfo', {})[entityJSON['@id']] = {
            label: this.om.getEntityName(entityJSON),
            names: this.om.getEntityNames(entityJSON),
            ontologyId: listItem.ontologyId,
            imported: false
        };
    }
    /**
     * Removes the entity with the provided IRI from the provided {@link OntologyListItem} along with any referenced
     * blank nodes. Removes the entityIRI and any reference blank nodes from the index.
     *
     * @param {string} entityIRI The IRI of the entity to remove.
     * @param {OntologyListItem} [listItem=listItem] The listItem linked to the ontology you want to remove the entity from.
     */
    removeEntity(entityIRI: string, listItem: OntologyListItem = this.listItem): void {
        pull(listItem.iriList, entityIRI);
        unset(listItem.entityInfo, entityIRI);
    }
    /**
     * Gets entity with the provided IRI from the provided {@link OntologyListItem}. Returns the entity Object.
     *
     * @param {string} recordId The recordId linked to the ontology you want to check.
     * @param {string} entityIRI The IRI of the entity that you want.
     * @returns {EntityNamesItem} An Object which represents the requested entity.
     */
    getEntityByRecordId(recordId: string, entityIRI: string, listItem?: OntologyListItem): EntityNamesItem {
        if (!isEmpty(listItem)) {
            return this._getEntityInfoFromListItem(listItem, entityIRI);
        }
        return this._getEntityInfoFromListItem(this.getListItemByRecordId(recordId), entityIRI);
    }
    /**
     * Gets entity with the provided IRI from the ontology in the provided {@link OntologyListItem} using
     * {@link shared.OntologyManagerService#getEntityAndBlankNodes}. Returns the resulting Observable with a
     * JSON-LD array with the entity and its blank nodes.
     *
     * @param {string} entityIRI The IRI of the entity that you want
     * @param {OntologyListItem} listItem The `listItem` to perform this action against
     * @returns {Observable<JSONLDObject[]>} An Observable that resolves with a JSON-LD array containing the entity and
     * its blank nodes; rejects otherwise.
     */
    getEntity(entityIRI: string, listItem: OntologyListItem = this.listItem): Observable<JSONLDObject[]> {
        return this.om.getEntityAndBlankNodes(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, entityIRI)
            .pipe(map(arr => {
                const entity = find(arr, {'@id': entityIRI});
                if (this.om.isIndividual(entity)) {
                    this._findValuesMissingDatatypes(entity);
                }
                return arr;
            }));
    }
    /**
     * Gets entity with the provided IRI from the ontology in the provided {@link OntologyListItem} using
     * {@link shared.OntologyManagerService#getEntityAndBlankNodes}. Returns the resulting Observable with a
     * JSON-LD object for the entity.
     *
     * @param {string} entityIRI The IRI of the entity that you want
     * @param {OntologyListItem} listItem The `listItem` to perform this action against
     * @returns {Observable<JSONLDObject>} An Observable that resolves with a JSON-LD object for the entity; rejects
     * otherwise.
     */
    getEntityNoBlankNodes(entityIRI: string, listItem: OntologyListItem = this.listItem): Observable<JSONLDObject> {
        return this.getEntity(entityIRI, listItem).pipe(map(arr => find(arr, {'@id': entityIRI})));
    }
    /**
     * Adds the provided JSON-LD to the additions of the open {@link OntologyListItem} associated with the provided
     * record IRI before it is saved to the user's In Progress Commit.
     * 
     * @param {string} recordId The Record IRI of an open listItem
     * @param {JSONLDObject} json The JSON-LD to add to the additions of a listItem 
     */
    addToAdditions(recordId: string, json: JSONLDObject): void {
        this._addToInProgress(recordId, json, 'additions');
    }
    /**
     * Adds the provided JSON-LD to the deletions of the open {@link OntologyListItem} associated with the provided
     * record IRI before it is saved to the user's In Progress Commit.
     * 
     * @param {string} recordId The Record IRI of an open listItem
     * @param {JSONLDObject} json The JSON-LD to add to the deletions of a listItem 
     */
    addToDeletions(recordId: string, json: JSONLDObject): void {
        this._addToInProgress(recordId, json, 'deletions');
    }
    /**
     * Sets the opened status of the no domains folder of the everything tree on the current {@link OntologyListItem}. 
     * Meant to be
     * used for a {@link HierarchyNode}.
     * 
     * @param {boolean} isOpened Whether the no domains folder should be open
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be undefined, but the generic {@link HierarchyNode} expects the parameter
     */
    setNoDomainsOpened(isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'noDomainsOpened'), 
          isOpened
        );
    }
    /**
     * Retrieves the opened status of the no domains folder of the everything tree in the current
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be undefined, but the generic {@link HierarchyNode} expects the parameter
     * @returns {boolean} Whether the no domains folder should be opened
     */
    getNoDomainsOpened(key: number = undefined): boolean {
      return get(this.listItem.editorTabStates, 
        this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'noDomainsOpened'),
        false
      );
    }
    /**
     * Sets the opened status of the data properties folder of the properties tree on the current
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {boolean} isOpened Whether the data properties folder should be open
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be OntologyListItem.PROPERTIES_TAB, but the generic {@link HierarchyNode}
     *    expects the parameter
     */
    setDataPropertiesOpened(isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'dataPropertiesOpened'), 
          isOpened
        );
    }
    /**
     * Retrieves the opened status of the data properties folder of the properties tree in the current
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be OntologyListItem.PROPERTIES_TAB, but the generic {@link HierarchyNode} expects
     *    the parameter
     * @returns {boolean} Whether the data properties folder should be opened
     */
    getDataPropertiesOpened(key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'dataPropertiesOpened'),
          false
        );
    }
    /**
     * Sets the opened status of the object properties folder of the properties tree on the current
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {boolean} isOpened Whether the object properties folder should be open
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be OntologyListItem.PROPERTIES_TAB, but the generic {@link HierarchyNode}
     *    expects the parameter
     */
    setObjectPropertiesOpened(isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'objectPropertiesOpened'), 
          isOpened
        );
    }
    /**
     * Retrieves the opened status of the object properties folder of the properties tree in the current
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be OntologyListItem.PROPERTIES_TAB, but the generic {@link HierarchyNode} expects
     *    the parameter
     * @returns {boolean} Whether the object properties folder should be opened
     */
    getObjectPropertiesOpened(key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'objectPropertiesOpened'), 
          false
        );
    }
    /**
     * Sets the opened status of the annotations properties folder of the properties tree on the current
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {boolean} isOpened Whether the annotation properties folder should be open
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be OntologyListItem.PROPERTIES_TAB, but the generic {@link HierarchyNode}
     *    expects the parameter
     */
    setAnnotationPropertiesOpened(isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'annotationPropertiesOpened'), 
          isOpened
        );
    }
    /**
     * Retrieves the opened status of the annotations properties folder of the properties tree in the current 
     * {@link OntologyListItem}. Meant to be used for a {@link HierarchyNode}.
     * 
     * @param {number} [key=undefined] An optional specific page state key to use when setting the opened value. In this
     *    case it is expected to always be OntologyListItem.PROPERTIES_TAB, but the generic {@link HierarchyNode} expects
     *    the parameter
     * @returns {boolean} Whether the annotation properties folder should be opened
     */
    getAnnotationPropertiesOpened(key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, 
          this._getOpenPath(key, this.listItem.versionedRdfRecord.recordId, 'annotationPropertiesOpened'), 
          false
        );
    }
    // TODO: Keep an eye on this
    /**
     * Updates the currently selected listItem when the IRI of the selected entity changes to the three IRI parts
     * provided. Updates the selected entity JSON-LD, the active page, the unsaved changes, all joined paths, the 
     * common IRI parts if the selected entity is the ontology object, and all usages.
     * 
     * @param {string} iriBegin The beginning of the new entity IRI
     * @param {string} iriThen The separator between the beginning and the local name of the new entity IRI
     * @param {string} iriEnd The local name of the new entity IRI
     */
    onEdit(iriBegin: string, iriThen: string, iriEnd: string): Observable<unknown> {
        if (!iriBegin) {
            return throwError('OnEdit validation failed for iriBegin');
        }
        if (!iriThen) {
            return throwError('OnEdit validation failed for iriThen');
        }
        if (!iriEnd) {
            return throwError('OnEdit validation failed for iriEnd');
        }
        const newIRI = iriBegin + iriThen + iriEnd;
        const oldEntity = cloneDeep(this.listItem.selected);
        this.getActivePage().entityIRI = newIRI;
        if (some(this.listItem.additions, oldEntity)) {
            remove(this.listItem.additions, oldEntity);
            this.updateRefs.update(this.listItem, this.listItem.selected['@id'], newIRI, this._updateRefsExclude);
            this.recalculateJoinedPaths(this.listItem);
        } else {
            this.updateRefs.update(this.listItem, this.listItem.selected['@id'], newIRI, this._updateRefsExclude);
            this.recalculateJoinedPaths(this.listItem);
            this.addToDeletions(this.listItem.versionedRdfRecord.recordId, oldEntity);
        }
        if (this.getActiveKey() !== 'project') {
            this.setCommonIriParts(iriBegin, iriThen);
        }
        if (!this.listItem.versionedRdfRecord.recordId) {
            return throwError('OnEdit validation failed for recordId');
        }
        this.addToAdditions(this.listItem.versionedRdfRecord.recordId, cloneDeep(this.listItem.selected));
        return this.om.getEntityUsages(this.listItem.versionedRdfRecord.recordId, 
            this.listItem.versionedRdfRecord.branchId, 
            this.listItem.versionedRdfRecord.commitId, 
            oldEntity['@id'], 
            'construct'
        ).pipe(
            map(statements => {
                statements.forEach(statement => this.addToDeletions(this.listItem.versionedRdfRecord.recordId, statement));
                this.updateRefs.update(statements, oldEntity['@id'], newIRI, this._updateRefsExclude);
                statements.forEach(statement => this.addToAdditions(this.listItem.versionedRdfRecord.recordId, statement));
            }),
            catchError(() => {
                this.toast.createErrorToast('Associated entities were not updated due to an internal error.');
                return throwError(null);
            })
        );
    }
    /**
     * Updates the namespace parameters on the currently selected OntologyRecord.
     * 
     * @param {string} iriBegin The beginning part of a namespace
     * @param {string} iriThen The separator between the beginning part of a namespace and the local name
     */
    setCommonIriParts(iriBegin: string, iriThen: string): void {
        set(this.listItem, 'iriBegin', iriBegin);
        set(this.listItem, 'iriThen', iriThen);
    }
    /**
     * Sets the `selected`, `selectedBlankNodes`, and `blankNodes` properties on the provided {@link OntologyListItem} 
     * based on the response from {@link shared.OntologyManagerService#getEntityAndBlankNodes}. Returns an Observable
     * indicating the success of the action. If the provided `entityIRI` or `listItem` are not valid, returns an
     * Observable that resolves. Sets the entity usages if the provided `getUsages` parameter is true. Also accepts an
     * optional ElementRef to attach a spinner to in the call to fetch the entity.
     *
     * @param {string} entityIRI The IRI of the entity to retrieve
     * @param {boolean} [getUsages=true] Whether to set the usages of the entity after fetching
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @param {ElementRef} element An optional element to attach a spinner to when fetching the entity
     * @return {Observable} An Observable indicating the success of the action
     */
    setSelected(entityIRI: string, getUsages = true, listItem: OntologyListItem = this.listItem, 
      element?: ElementRef): Observable<null> {
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
        return this.om.getEntityAndBlankNodes(listItem.versionedRdfRecord.recordId, 
            listItem.versionedRdfRecord.branchId, 
            listItem.versionedRdfRecord.commitId, 
            entityIRI, 
            undefined, 
            undefined, 
            true, 
            !!element
        ).pipe(
            finalize(() => {
                if (element) {
                    this.spinnerSvc.finishLoadingForComponent(element);
                }
            }),
            map(arr => {
                listItem.selected = find(arr, {'@id': entityIRI});
                listItem.selectedBlankNodes = this._getArrWithoutEntity(entityIRI, arr);
                const bnodeIndex = this.getBnodeIndex(listItem.selectedBlankNodes);
                listItem.selectedBlankNodes.forEach(bnode => {
                    listItem.blankNodes[bnode['@id']] = this.mc.jsonldToManchester(bnode['@id'], listItem.selectedBlankNodes, bnodeIndex, true);
                });
                if (this.om.isIndividual(listItem.selected)) {
                    this._findValuesMissingDatatypes(listItem.selected);
                }
                
                if (getUsages && !has(this.getActivePage(), 'usages') && listItem.selected) {
                    this.setEntityUsages(entityIRI);
                }
                return null;
            })
        );
    }
    /**
     * Fetches and sets the usages of the entity identified by the provided IRI onto the provided
     * {@link OntologyListItem} for the tab with the provided index. Defaults to the currently selected list item and
     * defaults to the active tab. If the tab has a usages container element, will start and stop a targeted spinner.
     * If the entity usages fetch fails, sets the tab usages to an empty array.
     * 
     * @param {string} entityIRI The IRI of the entity to fetch usages of
     * @param {OntologyListItem} [listItem=this.listItem] The optional specific list item to set the usages on.
     * Defaults to the currently selected item
     * @param {number} [tabIndex=undefined] The optional specific index of the tab to set the usages on. Defaults to the
     * currently active tab
     */
    setEntityUsages(entityIRI: string, listItem: OntologyListItem = this.listItem, tabIndex: number = undefined): void {
        const page = tabIndex !== undefined ? this.getActivePage(listItem, tabIndex) : this.getActivePage(listItem);
        if (page.usagesContainer) {
            this.spinnerSvc.startLoadingForComponent(page.usagesContainer);
        }
        this.om.getEntityUsages(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, entityIRI, 'select')
            .pipe(finalize(() => {
                if (page.usagesContainer) {
                    this.spinnerSvc.finishLoadingForComponent(page.usagesContainer);
                }
            }))
            .subscribe(
                bindings => listItem.editorTabStates[this.getActiveKey(listItem, tabIndex)].usages = bindings as SPARQLSelectBinding[],
                () => listItem.editorTabStates[this.getActiveKey(listItem, tabIndex)].usages = []
            );
    }
    /**
     * Creates an index for the blank nodes so that the manchester syntax logic will work correctly.
     * 
     * @param {JSONLDObject[]} [selectedBlankNodes=listItem.selectedBlankNodes] The JSON-LD array of blank nodes to index
     * @returns {{[key: string]: {position: number}}} The index of blank nodes
     */
    getBnodeIndex(selectedBlankNodes = this.listItem.selectedBlankNodes): {[key: string]: {position: number}} {
        const bnodeIndex = {};
        selectedBlankNodes.forEach((bnode, idx) => {
            bnodeIndex[bnode['@id']] = {position: idx};
        });
        return bnodeIndex;
    }
    /**
     * Resets the state of each of the tabs in the provided {@link OntologyListItem}. If the active tab is the project
     * tab, sets the selected entity back to the Ontology object. If the active tab is not the project tab, unsets the
     * selected entity and its blank nodes. Returns an Observable that resolves when the process is complete to account
     * for pulling the latest data for the selected entity on the project tab.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {Observable} An Observable that resolves when the process is complete
     */
    resetStateTabs(listItem: OntologyListItem = this.listItem): Observable<null> {
        forOwn(listItem.editorTabStates, (value, key) => {
            if (key === 'search') {
                unset(value, 'entityIRI');
                unset(value, encodeURIComponent(listItem.versionedRdfRecord.recordId));
                value.open = {};
            } else if (key !== 'project' && key !== 'search') {
                unset(value, 'entityIRI');
                unset(value, encodeURIComponent(listItem.versionedRdfRecord.recordId));
                value.open = {};
                value.searchText = '';
            } else {
                value.entityIRI = listItem.ontologyId;
                value.preview = '';
            }
            unset(value, 'usages');
        });
        this.resetSearchTab(listItem);
        if (this.getActiveKey() !== 'project') {
            listItem.selected = undefined;
            listItem.selectedBlankNodes = [];
            listItem.blankNodes = {};
            listItem.seeHistory = false;
            return of(null);
        } else {
            return this.setSelected(listItem.editorTabStates.project.entityIRI, false, listItem, listItem.editorTabStates.project.element)
              .pipe(tap(() => listItem.seeHistory = false));
        }
    }
    /**
     * Resets the state of the search tab of the provided {@link OntologyListItem}.
     * 
     * @param {OntologyListItem} listItem The listItem to reset the search page state of. Defaults to the currently
     *    selected listItem
     */
    resetSearchTab(listItem: OntologyListItem = this.listItem): void {
        listItem.editorTabStates.search.errorMessage = '';
        listItem.editorTabStates.search.highlightText = '';
        listItem.editorTabStates.search.infoMessage = '';
        listItem.editorTabStates.search.warningMessage = '';
        listItem.editorTabStates.search.results = {};
        listItem.editorTabStates.search.searchText = '';
        listItem.editorTabStates.search.selected = {};
        listItem.editorTabStates.search.entityIRI = '';
    }
    /**
     * Gets the key string of the appropriate page state of an {@link OntologyListItem} based on the provided tab index
     * number.
     * 
     * @param {OntologyListItem} listItem The listItem to get the active key for. Otherwise uses the currently selected
     * @param {number} [idx=undefined] An optional tab index to get the key for. Otherwise uses the active page of
     *    the listItem
     * @returns {string} The page state key in the listItem corresponding to the tabIndex
     */
    getActiveKey(listItem: OntologyListItem = this.listItem, idx: number = undefined): string {
        const tabIndex = idx !== undefined ? idx : listItem.tabIndex;
        switch (tabIndex) {
            case OntologyListItem.PROJECT_TAB:
                return 'project';
            case OntologyListItem.OVERVIEW_TAB:
                return 'overview';
            case OntologyListItem.CLASSES_TAB:
                return 'classes';
            case OntologyListItem.PROPERTIES_TAB:
                return 'properties';
            case OntologyListItem.INDIVIDUALS_TAB:
                return 'individuals';
            case OntologyListItem.CONCEPTS_TAB:
                return 'concepts';
            case OntologyListItem.CONCEPTS_SCHEMES_TAB:
                return 'schemes';
            case OntologyListItem.SEARCH_TAB:
                return 'search';
            case OntologyListItem.VISUALIZATION_TAB:
                return 'visualization';
            default:
                return 'project';
        }
    }
    /**
     * Get the page state object of the active page of the provided {@link OntologyListItem}.
     * 
     * @param {OntologyListItem} listItem The optional listItem to get the active page of. Otherwise uses the currently
     *    selected item
     * @param {number} [tabIndex=undefined] The optional index of the page to retrieve. Otherwise uses the active one 
     * @returns {any} The currently selected page state object of the provided listItem
     */
    getActivePage(listItem: OntologyListItem = this.listItem, tabIndex: number = undefined): any {
        return tabIndex !== undefined ? 
          listItem.editorTabStates[this.getActiveKey(listItem, tabIndex)] : 
          listItem.editorTabStates[this.getActiveKey(listItem)];
    }
    /**
     * Retrieves the IRI of the activity entity on a specific page of the provided {@link OntologyListItem}.
     * 
     * @param {OntologyListItem} listItem The optional listItem to get the active entity of. Otherwise uses the currently
     *    selected item
     * @returns {string} The IRI of the active entity
     */
    getActiveEntityIRI(listItem: OntologyListItem = this.listItem): string {
        return get(this.getActivePage(listItem), 'entityIRI');
    }
    /**
     * Selects the entity with the specified IRI in the current `listItem`. Optionally can set the usages of the entity.
     * Returns an Observable indicating the success of the action.
     * 
     * @param {string} entityIRI The IRI of an entity in the current `listItem`
     * @param {boolean} [getUsages=true] Whether to set the usages of the specified entity
     * @param {number} [tabIndex=undefined] Optional tab index to select the item on
     * @returns {Observable} An Observable that resolves if the action was successful; rejects otherwise
     */
    selectItem(entityIRI: string, getUsages = true, tabIndex: number = undefined): Observable<null> {
        const page = tabIndex !== undefined ? this.getActivePage(this.listItem, tabIndex) : this.getActivePage();
        if (entityIRI && entityIRI !== get(page, 'entityIRI')) {
            set(page, 'entityIRI', entityIRI);
            if (getUsages) {
                this.setEntityUsages(entityIRI, this.listItem, tabIndex);
            }
        }
        return this.setSelected(entityIRI, false, this.listItem, page.element);
    }
    /**
     * Unselects the currently selected entity. This includes wiping the usages, stored RDF, and the related blank
     * nodes.
     */
    unSelectItem(): void {
        const activePage = this.getActivePage();
        unset(activePage, 'entityIRI');
        unset(activePage, 'usages');
        this.listItem.selected = undefined;
        this.listItem.selectedBlankNodes = [];
        this.listItem.blankNodes = {};
    }
    /**
     * Tests whether the provided `listItem` has any unsaved changes that should be saved to the InProgressCommit.
     * 
     * @param {OntologyListItem} listItem The OntologyListItem to test
     * @returns {boolean} True if there are unsaved changes on the provided `listItem`
     */
    hasChanges(listItem: OntologyListItem): boolean {
        return !!get(listItem, 'additions', []).length || !!get(listItem, 'deletions', []).length;
    }
    /**
     * Adds the provided entity IRI to the specified parent in the provided Hierarchy. Checks to see if it would
     * introduce a circular parent-child relationship. If so adds to the `circularMap`. Otherwise updates the
     * `parentMap` and `childMap` appropriately. If no parent IRI was provided, nothing gets updated.
     * 
     * @param {Hierarchy} hierarchyInfo The hierarchy to add the entity to
     * @param {string} entityIRI The IRI of the entity being added to the hierarchy
     * @param {string} parentIRI The IRI of the parent of the entity being added to the hierarchy
     */
    addEntityToHierarchy(hierarchyInfo: Hierarchy, entityIRI: string, parentIRI: string): void {
        const result = this._checkChildren(hierarchyInfo, entityIRI, parentIRI);
        if (!result.circular) {
            if (parentIRI && has(hierarchyInfo.iris, parentIRI)) {
                hierarchyInfo.parentMap[parentIRI] = union(get(hierarchyInfo.parentMap, parentIRI), [entityIRI]);
                hierarchyInfo.childMap[entityIRI] = union(get(hierarchyInfo.childMap, entityIRI), [parentIRI]);
            }
        } else {
            const value = {[entityIRI]: result.path};
            hierarchyInfo.circularMap[parentIRI] = assign(value,get(hierarchyInfo.circularMap, parentIRI));
        }
    }
    /**
     * Removes the provided entity IRI from the specified parent in the provided Hierarchy. Handles updating the 
     * `circularMap` especially if removing the specified parent-child relationship removes a circular relationship.
     * Updates the `parentMap` and `childMap` in the hierarchy regardless of circular relationships.
     * 
     * @param {Hierarchy} hierarchyInfo The hierarchy to remove the parent-child relationship from
     * @param {string} entityIRI The IRI of the child in the parent-child relationship
     * @param {string} parentIRI The IRI of the parent in the parent-child relationship
     */
    deleteEntityFromParentInHierarchy(hierarchyInfo: Hierarchy, entityIRI: string, parentIRI: string): void {
        forEach(hierarchyInfo.circularMap, (values, parent) => {
            forEach(values, (path, child) => {
                if (includes(path, entityIRI) && includes(path, parentIRI)) {
                    hierarchyInfo.parentMap[parent] = union(get(hierarchyInfo.parentMap, parent), [child]);
                    hierarchyInfo.childMap[child] = union(get(hierarchyInfo.childMap, child), [parent]);
                    delete hierarchyInfo.circularMap[parent][child];
                    if (get(hierarchyInfo.circularMap, [parent])) {
                        delete hierarchyInfo.circularMap[parent];
                    }
                }
            });
        });

        pull(hierarchyInfo.parentMap[parentIRI], entityIRI);
        if (!get(hierarchyInfo.parentMap, parentIRI, []).length) {
            delete hierarchyInfo.parentMap[parentIRI];
        }
        pull(hierarchyInfo.childMap[entityIRI], parentIRI);
        if (!get(hierarchyInfo.childMap, entityIRI, []).length) {
            delete hierarchyInfo.childMap[entityIRI];
        }
    }
    /**
     * Removes the provided entity IRI entirely from the provided Hierarchy. Clears out the `parentMap` and `childMap`
     * in the hierarchy.
     * 
     * @param {Hierarchy} hierarchyInfo The hierarchy to remove the entity from
     * @param {string} entityIRI The IRI of the entity to remove
     */
    deleteEntityFromHierarchy(hierarchyInfo: Hierarchy, entityIRI: string): void {
        const children = get(hierarchyInfo.parentMap, entityIRI, []);
        delete hierarchyInfo.parentMap[entityIRI];
        forEach(children, child => {
            pull(hierarchyInfo.childMap[child], entityIRI); 
            if (!get(hierarchyInfo.childMap, child, []).length) {
                delete hierarchyInfo.childMap[child];
            }
        });
        const parents = get(hierarchyInfo.childMap, entityIRI, []);
        delete hierarchyInfo.childMap[entityIRI];
        forEach(parents, parent => {
            pull(hierarchyInfo.parentMap[parent], entityIRI);
            if (!get(hierarchyInfo.parentMap, parent, []).length) {
                delete hierarchyInfo.parentMap[parent];
            }
        });
    }
    /**
     * Retrieves an array of string arrays that represent all the paths to reach the provided entity IRI within the
     * provided Hierarchy.
     * 
     * @param {Hierarchy} hierarchyInfo The Hierarchy to search within
     * @param {string} entityIRI The entity IRI to retrieve all paths for
     * @returns {string[][]} All paths to reach the specified entity IRI
     */
    getPathsTo(hierarchyInfo: Hierarchy, entityIRI: string): string[][] {
        const result = [];
        if (has(hierarchyInfo.iris, entityIRI)) {
            if (has(hierarchyInfo.childMap, entityIRI)) {
                const toFind = [[entityIRI]];
                while (toFind.length) {
                    const temp = toFind.pop();
                    hierarchyInfo.childMap[temp[0]].forEach(parent => {
                        const temp2 = [parent].concat(temp);
                        if (has(hierarchyInfo.childMap, parent)) {
                            toFind.push(temp2);
                        } else {
                            result.push(temp2);
                        }
                    });
                }
            } else {
                result.push([entityIRI]);
            }
        }
        return result;
    }
    
    /**
     * Tests whether the direct parent node of the provided HierarchyNode is open within the hierarchy of the provided
     * tab in the currently selected {@link OntologyListItem}.
     * 
     * @param {HierarchyNode} node The HierarchyNode of interest
     * @param {string} tab The name of the tab to test the hierarchy within
     * @returns {boolean} True if all parent of the node are open in the tab's hierarchy; false otherwise
     */
    isDirectParentOpen(node: HierarchyNode, tab: string): boolean {
        return this.listItem.editorTabStates[tab].open[this.joinPath(node.path.slice(0, node.path.length - 1))];
    }

    /**
     * Tests whether all the parent nodes of the provided HierarchyNode are open within the hierarchy of the provided
     * tab in the currently selected {@link OntologyListItem}.
     * 
     * @param {HierarchyNode} node The HierarchyNode of interest
     * @param {string} tab The name of the tab to test the hierarchy within
     * @returns {boolean} True if all parent of the node are open in the tab's hierarchy; false otherwise
     */
    areParentsOpen(node: HierarchyNode, tab: string): boolean {
        // If a this node has been toggled closed at some point by a parent being collapsed, their may be a scenario where it's direct parent is open but it's grandparent is closed. So we must examine every one of the node's ancestors 
        if (tab !== 'classes' || node.toggledClosed) {
            let allOpen = true;
            for (let i = node.path.length - 1; i > 1; i--) {
                const fullPath = this.joinPath(node.path.slice(0, i));
    
                if (!this.listItem.editorTabStates[tab].open[fullPath]) {
                    allOpen = false;
                    break;
                }
            }
            return allOpen;
        } else { // If the node was not toggled closed by a parent being collapsed, we can just check if it's direct parent is open
            return this.isDirectParentOpen(node, tab);
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
     * Updates the currently selected {@link OntologyListItem} to view the entity identified by the provided IRI.
     * Updates the selected tab in the editor and all required variables in order to view the details of the entity.
     * 
     * @param {string} iri The IRI of the entity to open the editor at
     */
    goTo(iri: string): void {
        if (get(this.listItem, 'ontologyId') === iri) {
            this._commonGoTo(OntologyListItem.PROJECT_TAB, iri);
        } else if (this._isInIris('classes', iri)) {
            this._commonGoTo(OntologyListItem.CLASSES_TAB, iri, this.listItem.classes.flat);
            this.listItem.editorTabStates.classes.index = this._getScrollIndex(iri, this.listItem.classes.flat, 
              OntologyListItem.CLASSES_TAB);
        } else if (this._isInIris('dataProperties', iri)) {
            this._commonGoTo(OntologyListItem.PROPERTIES_TAB, iri, this.listItem.dataProperties.flat);
            this.setDataPropertiesOpened(true, OntologyListItem.PROPERTIES_TAB);
            // Index is incremented by 1 to account for Data Property folder
            this.listItem.editorTabStates.properties.index = this._getScrollIndex(iri, this.listItem.dataProperties.flat, 
              OntologyListItem.PROPERTIES_TAB,  true, () => this.getDataPropertiesOpened()) + 1;
        } else if (this._isInIris('objectProperties', iri)) {
            this._commonGoTo(OntologyListItem.PROPERTIES_TAB, iri, this.listItem.objectProperties.flat);
            this.setObjectPropertiesOpened(true, OntologyListItem.PROPERTIES_TAB);

            let index = 0;
            // If Data Properties are present, count number of shown properties and increment by 1 for the Data Property folder
            if (this.listItem.dataProperties.flat.length > 0) {
                index += this._getScrollIndex(iri, this.listItem.dataProperties.flat, OntologyListItem.PROPERTIES_TAB, 
                  true, () => this.getDataPropertiesOpened()) + 1;
            }
            // Index is incremented by 1 to account for Object Property folder
            this.listItem.editorTabStates.properties.index = index + this._getScrollIndex(iri, 
              this.listItem.objectProperties.flat, OntologyListItem.PROPERTIES_TAB, true, 
              () => this.getObjectPropertiesOpened()) + 1;
        } else if (this._isInIris('annotations', iri)) {
            this._commonGoTo(OntologyListItem.PROPERTIES_TAB, iri, this.listItem.annotations.flat);
            this.setAnnotationPropertiesOpened(true, OntologyListItem.PROPERTIES_TAB);

            let index = 0;
            // If Data Properties are present, count number of shown properties and increment by 1 for the Data Property folder
            if (this.listItem.dataProperties.flat.length > 0) {
                index += this._getScrollIndex(iri, this.listItem.dataProperties.flat, OntologyListItem.PROPERTIES_TAB, 
                  true, () => this.getDataPropertiesOpened(OntologyListItem.PROPERTIES_TAB)) + 1;
            }
            // If Object Properties are present, count number of shown properties and increment by 1 for the Object Property folder
            if (this.listItem.objectProperties.flat.length > 0) {
                index += this._getScrollIndex(iri, this.listItem.objectProperties.flat, OntologyListItem.PROPERTIES_TAB, 
                  true, () => this.getObjectPropertiesOpened(OntologyListItem.PROPERTIES_TAB)) + 1;
            }
            // Index is incremented by 1 to account for Annotation Property folder
            this.listItem.editorTabStates.properties.index = index + this._getScrollIndex(iri, 
              this.listItem.annotations.flat, OntologyListItem.PROPERTIES_TAB, true, 
              () => this.getAnnotationPropertiesOpened(OntologyListItem.PROPERTIES_TAB)) + 1;
        } else if (this._isInIris('concepts', iri)) {
            this._commonGoTo(OntologyListItem.CONCEPTS_TAB, iri, this.listItem.concepts.flat);
            this.listItem.editorTabStates.concepts.index = this._getScrollIndex(iri, this.listItem.concepts.flat, 
              OntologyListItem.CONCEPTS_TAB);
        } else if (this._isInIris('conceptSchemes', iri)) {
            this._commonGoTo(OntologyListItem.CONCEPTS_SCHEMES_TAB, iri, this.listItem.conceptSchemes.flat);
            this.listItem.editorTabStates.schemes.index = this._getScrollIndex(iri, this.listItem.conceptSchemes.flat, 
              OntologyListItem.CONCEPTS_SCHEMES_TAB);
        } else if (this._isInIris('individuals', iri)) {
            this._commonGoTo(OntologyListItem.INDIVIDUALS_TAB, iri, this.listItem.individuals.flat);
            this.listItem.editorTabStates.individuals.index = this._getScrollIndex(iri, this.listItem.individuals.flat, 
              OntologyListItem.INDIVIDUALS_TAB);
        }
    }
    /**
     * Opens the hierarchy represented by the provided list of nodes at the entity identified by the provided IRI.
     * 
     * @param {HierarchyNode[]} flatHierarchy The flattened hierarchy to open the entity within
     * @param {number} [tabIndex=undefined] An optional tab index to open the entity on. Otherwise uses the active page
     * @param {string} entityIRI The IRI of the entity to open at
     */
    openAt(flatHierarchy: HierarchyNode[], entityIRI: string, tabIndex: number = undefined): void {
        const path = get(find(flatHierarchy, {entityIRI}), 'path', []);
        if (path.length) {
            let pathString : string = head(path);
            forEach(tail(initial(path)), pathPart => {
                pathString += '.' + pathPart;
                if (tabIndex !== undefined) {
                    this.listItem.editorTabStates[this.getActiveKey(this.listItem, tabIndex)].open[pathString] = true;
                } else {
                    this.listItem.editorTabStates[this.getActiveKey()].open[pathString] = true;
                }
            });
        }
    }
    /**
     * Generates the default prefix to be used for all new entities in the currently selected {@link OntologyListItem}. 
     * Uses the ontology IRI as a basis unless overridden. If the prefix is found to be a blank node, tries the first
     * IRI it can find within the ontology. If an IRI isn't found, creates a blank node prefix.
     * 
     * @returns {string} The prefix for new IRIs created within the current `listItem`
     */
    getDefaultPrefix(): string {
        let prefixIri = replace(this.listItem.iriBegin || this.listItem.ontologyId, '#', '/') 
          + (this.listItem.iriThen || '#');
        if (isBlankNodeId(prefixIri)) {
            const nonBlankNodeId = head(keys(this.listItem.entityInfo));
            if (nonBlankNodeId) {
                const split = splitIRI(nonBlankNodeId);
                prefixIri = split.begin + split.then;
            } else {
                prefixIri = `https://mobi.com/blank-node-namespace/${uuidv4()}#`;
            }
        }
        return prefixIri;
    }
    /**
     * Updates the icon for the property represented by the provided JSON-LD Object.
     * 
     * @param {JSONLDObject} entity The JSON-LD object for a property
     */
    updatePropertyIcon(entity: JSONLDObject): void {
        if (this.om.isProperty(entity)) {
            this._setPropertyIcon(entity);
        }
    }
    /**
     * Adds the provided class IRI to the provided {@link OntologyListItem}. Updates the isVocabulary variable if the
     * added class is skos:Concept or skos:ConceptScheme. Also optionally takes the ID of the ontology that contains the
     * class definition if not the current ontology.
     * 
     * @param {OntologyListItem} listItem The OntologyListItem to update
     * @param {string} iri The class IRI to add
     * @param {string} ontologyId The ID of the ontology that contains the class definition
     */
    addToClassIRIs(listItem: OntologyListItem, iri: string, ontologyId = ''): void {
        if (!this._existenceCheck(listItem.classes.iris, iri)) {
            if (iri === `${SKOS}Concept` || iri === `${SKOS}ConceptScheme`) {
                listItem.isVocabulary = true;
            }
            listItem.classes.iris[iri] = ontologyId || listItem.ontologyId;
            this._addInfo(listItem, iri, ontologyId || listItem.ontologyId);
        }
    }
    /**
     * Removes the provided class IRI from the provided {@link OntologyListItem}. Updates the isVocabulary variable if
     * the class IRI is skos:Concept or skos:ConceptScheme and the other doesn't exist (this should only happen if the
     * SKOS constructs happen to be redefined in the ontology).
     * 
     * @param {OntologyListItem} listItem The OntologyListItem to update
     * @param {string} iri The class IRI to remove
     */
    removeFromClassIRIs(listItem: OntologyListItem, iri: string): void {
        const conceptCheck = iri === `${SKOS}Concept` 
          && !this._existenceCheck(listItem.classes.iris, `${SKOS}ConceptScheme`);
        const schemeCheck = iri === `${SKOS}ConceptScheme` 
          && !this._existenceCheck(listItem.classes.iris, `${SKOS}Concept`);
        if (conceptCheck || schemeCheck) {
            listItem.isVocabulary = false;
        }
        delete listItem.classes.iris[iri];
    }
    /**
     * Retrieves the entityInfo for the provided IRI from the provided `{@link OntologyListItem}.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {EntityNamesItem} The entityInfo for the provided IRI
     */
    getFromListItem(iri: string, listItem: OntologyListItem = this.listItem): EntityNamesItem {
        return get(listItem, `entityInfo[${iri}]`, {});
    }
    /**
     * Determines whether the provided IRI exists in the entityInfo for the provided {@link OntologyListItem}.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {boolean} True if the IRI exists in the entityInfo object; false otherwise
     */
    existsInListItem(iri: string, listItem: OntologyListItem = this.listItem): boolean {
        return iri in get(listItem, 'entityInfo', {});
    }
    /**
     * Determines whether the provided IRI is imported or not in the provided {@link OntologyListItem}. Defaults to 
     * true.
     *
     * @param {string} iri The IRI to search for
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {boolean} True if the IRI is imported; false otherwise
     */
    isImported(iri: string, listItem: OntologyListItem = this.listItem): boolean {
        if (iri === listItem.ontologyId) {
            return false;
        }
        return get(listItem, `entityInfo['${iri}'].imported`, true);
    }
    /**
     * Determines whether the provided IRI is deprecated or not in the provided {@link OntologyListItem}. Defaults to 
     * false.
     *
     * @param {string} iri The IRI to search for
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {boolean} True if the IRI is deprecated; false otherwise
     */
    isIriDeprecated(iri: string, listItem: OntologyListItem = this.listItem): boolean {
        const isDep = has(listItem, `deprecatedIris['${iri}']`);
        return isDep;
    }
    /**
     * Handle when an annotation (identified by its predicate IRI and value) is updated on the entity identified by the
     * provided IRI in the provided {@link OntologyListItem}. Currently only handles if the annotation is owl:deprecated.
     *
     * @param {string} iri The IRI to search for
     * @param {annotationIri} annotation iri
     * @param {annotationValue} annotation value
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     */
    annotationModified(iri: string, annotationIri: string, annotationValue: string, 
      listItem: OntologyListItem = this.listItem): void {
        if (annotationIri === `${OWL}deprecated`) {
            if (annotationValue === 'true') {
                set(listItem, `deprecatedIris['${iri}']`, listItem.ontologyId);
            } else if (annotationValue === 'false' || annotationValue === null) {
                unset(listItem, `deprecatedIris['${iri}']`);
            }
            this.alterTreeHierarchy(identity, listItem);
        }
    }
    /**
     * Determines whether the selected IRI of the provided {@link OntologyListItem} is imported or not. Defaults to true.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {boolean} True if the selected IRI is imported; false otherwise
     */
    isSelectedImported(listItem: OntologyListItem = this.listItem): boolean {
        const iri = get(listItem.selected, '@id', '');
        return iri ? this.isImported(iri, listItem) : false;
    }
    /**
     * Method to collapse all of the nodes in hierarchy flat list under following tabs in the provided
     * {@link OntologyListItem}: 'classes', 'dataProperties', 'objectProperties', 'annotations', 'concepts',
     * 'conceptSchemes', 'dataProperties', 'individuals', 'flatEverythingTree' The mapper function checks to see if the
     * hierarchy node is open, if it is open, then it will close node.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     */
    collapseFlatLists(listItem: OntologyListItem = this.listItem): void {
        this.alterTreeHierarchy(this._closeNodeMapper, listItem);
    }
    private _closeNodeMapper(item: HierarchyNode): HierarchyNode {
        if ('isOpened' in item) {
            item.isOpened = false;
        }
        return item;
    }
    /**
     * Method to recalculate the 'joinedPath' field on each of the nodes of the flat lists in the provided
     * {@link OntologyListItem}. If the recalculated  value differs from the previous value, the editorTabStates on the
     * listItem are adjusted accordingly for that joinedPath.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
    */
    recalculateJoinedPaths(listItem: OntologyListItem = this.listItem): void {
        this.alterTreeHierarchy(a => this._recalculateJoinedPath(a, listItem), listItem);
    }
    private _recalculateJoinedPath(item: HierarchyNode, listItem: OntologyListItem) {
        if ('joinedPath' in item) {
            const newJoinedPath = this.joinPath(item.path);
            if (newJoinedPath !== item.joinedPath) {
                this.updateRefs.update(listItem.editorTabStates, item.joinedPath, newJoinedPath, this._updateRefsExclude);
                item.joinedPath = newJoinedPath;
            }
        }
        return item;
    }
    /**
     * Method to alter tree hierarchy flat lists give a mapper function under following tabs of the provided
     * {@link OntologyListItem}: 'classes', 'dataProperties', 'objectProperties', 'annotations', 'concepts',
     * 'conceptSchemes', 'dataProperties', 'individuals', 'flatEverythingTree'
     *
     * @param {Function} mapper function - use to alter the node state
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     */
    alterTreeHierarchy(mapperFunction: (node: HierarchyNode) => HierarchyNode, 
    listItem: OntologyListItem = this.listItem): void {
        const flatLists = ['classes', 'dataProperties', 'objectProperties', 'annotations',
            'concepts', 'conceptSchemes', 'dataProperties', 'individuals'];

        flatLists.forEach(listKey => {
            if (listKey in listItem && 'flat' in listItem[listKey]) {
                listItem[listKey].flat = listItem[listKey].flat.map(mapperFunction);
            }
        });

        if ('flatEverythingTree' in listItem) {
            listItem['flatEverythingTree'] = listItem['flatEverythingTree'].map(mapperFunction);
        }
    }
    /**
     * Updates property maps on the currently selected {@link OntologyListItem} based on the provided deleted class IRI.
     *
     * @param {string} classIRI The IRI of the entity to be deleted
     */
    handleDeletedClass(classIRI: string): void {
        const classProperties = get(this.listItem.classToChildProperties, classIRI, []);
        delete this.listItem.classToChildProperties[classIRI];
        classProperties.forEach(propertyIRI => {
            let hasDomain = false;
            forEach(this.listItem.classToChildProperties, classArrayItem => {
               if (classArrayItem.includes(propertyIRI)) {
                   hasDomain = true;
                   return false;
               }
            });
            if (!hasDomain){
                this.listItem.noDomainProperties.push(propertyIRI);
            }
        });
    }
    /**
     * Deletes traces of a removed property from the classToChild map and noDomainProperties array of the currently
     * selected {@link OntologyListItem}.
     *
     * @param {JSONLDObject} property The full JSON-LD of a Property entity
     */
    handleDeletedProperty(property: JSONLDObject): void {
        const propDomains = property[`${RDFS}domain`];
        if (propDomains) {
            propDomains.forEach(domainObj => {
                this._removePropertyClassRelationships(property['@id'], domainObj['@id']);
            });
        } else {
            pull(this.listItem.noDomainProperties, property['@id']);
        }
    }
    /**
     * Adds a new property to the correct map in the currently selected {@link OntologyListItem}; either 
     * noDomainProperties or classToChildProperties.
     *
     * @param {JSONLDObject} property The full JSON-LD of a Property entity
     */
    handleNewProperty(property: JSONLDObject): void {
        const domainPath = `${RDFS}domain`;
        if (property[domainPath] === undefined || property[domainPath] === null || !property[domainPath].length) {
            this.listItem.noDomainProperties.push(property['@id']);
        } else {
            property[domainPath].forEach(domain => {
                const classIRI = domain['@id'];
                const path =  this.listItem.classToChildProperties[classIRI];
                if (!path){
                    this.listItem.classToChildProperties[classIRI] = [];
                }
                this.listItem.classToChildProperties[classIRI].push(property['@id']);
            });
        }
    }
    /**
     * Updates maps in the current selected {@link OntologyListItem} appropriately given the provided property IRI and
     * array of class IRIs as domains.
     *
     * @param {string} propertyIRI The iri of the property being altered in the hierarchy
     * @param {string[]} classIris An array of classes that are being added to the property as domains
     */
    addPropertyToClasses(propertyIRI: string, classIris: string[]): void {
        let hasBlankNodeParents = true;
        classIris.forEach(parentclass => {
            if (!isBlankNodeId(parentclass)) {
                if (!this.listItem.classToChildProperties[parentclass]) {
                    this.listItem.classToChildProperties[parentclass] = [];
                }
                this.listItem.classToChildProperties[parentclass].push(propertyIRI);
                hasBlankNodeParents = false;
            }
        });
        if (!hasBlankNodeParents) {
            pull(this.listItem.noDomainProperties, propertyIRI);
        }
    }
    /**
     * Handles the removal of the provided class IRI as a domain of the provided property JSON-LD by updating 
     * `classToChildProperties` and `noDomainProperties` on the currently selected {@link OntologyListItem}.
     *
     * @param {JSONLDObject} property The full JSON-LD of a Property entity
     * @param {string} classIri The iri of the class the property is being removed from
     */
    removePropertyFromClass(property: JSONLDObject, classIri: string): void {
        this._removePropertyClassRelationships(property['@id'], classIri);
        this._checkForPropertyDomains(property);
    }
    /**
     * Determines whether the provided array of IRI strings contains a derived skos:Concept or skos:Concept from the 
     * currently selected {@link OntologyListItem}.
     *
     * @param {string[]} arr An array of IRI strings
     * @return {boolean} True if the array contains a derived skos:Concept or skos:Concept
     */
    containsDerivedConcept(arr: string[]): boolean {
        return !!intersection(arr, concat(this.listItem.derivedConcepts, [`${SKOS}Concept`])).length;
    }
    /**
     * Determines whether the provided array of IRI objects contains a derived skos:semanticRelation or 
     * skos:semanticRelation from the currently selected {@link OntologyListItem}.
     *
     * @param {string[]} arr An array of IRI objects
     * @return {boolean} True if the array contains a dervied skos:semanticRelation or skos:semanticRelation
     */
    containsDerivedSemanticRelation(arr: string[]): boolean {
        return !!intersection(arr, concat(this.listItem.derivedSemanticRelations, [`${SKOS}semanticRelation`])).length;
    }
    /**
     * Determines whether the provided array of IRI objects contains a derived skos:ConceptScheme or skos:ConceptScheme
     * from the currently selected {@link OntologyListItem}.
     *
     * @param {string[]} arr An array of IRI objects
     * @return {boolean} True if the array contains a dervied skos:ConceptScheme or skos:ConceptScheme
     */
    containsDerivedConceptScheme(arr: string[]): boolean {
        return !!intersection(arr, concat(this.listItem.derivedConceptSchemes, [`${SKOS}ConceptScheme`])).length;
    }
    /**
     * Updates the appropriate vocabulary hierarchies in the currently selected {@link OntologyListItem} when a
     * relationship is added to a skos:Concept or skos:ConceptScheme and the entity is not already in the appropriate
     * location.
     *
     * @param {string} relationshipIRI The IRI of the property added to the selected entity
     * @param {(JSONLDId | JSONLDValue)[]} values The JSON-LD of the values of the property that were added
     */
    updateVocabularyHierarchies(relationshipIRI: string, values: (JSONLDId | JSONLDValue)[]): void {
        if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.broaderRelations, 
          this.containsDerivedConcept.bind(this))) {
            this._commonAddToVocabHierarchy(relationshipIRI, 
                values, 
                this.listItem.selected['@id'], 
                undefined, 
                OntologyStateService.broaderRelations, 
                OntologyStateService.narrowerRelations, 
                'concepts', 
                this.containsDerivedConcept.bind(this)
            );
        } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.narrowerRelations, 
          this.containsDerivedConcept.bind(this))) {
            this._commonAddToVocabHierarchy(relationshipIRI, 
                values, 
                undefined, 
                this.listItem.selected['@id'], 
                OntologyStateService.narrowerRelations, 
                OntologyStateService.broaderRelations, 
                'concepts',
                this.containsDerivedConcept.bind(this)
            );
        } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.conceptToScheme, 
          this.containsDerivedConcept.bind(this))) {
            this._commonAddToVocabHierarchy(relationshipIRI, 
                values, 
                this.listItem.selected['@id'], 
                undefined, 
                OntologyStateService.conceptToScheme, 
                OntologyStateService.schemeToConcept, 
                'conceptSchemes', 
                this.containsDerivedConceptScheme.bind(this)
            );
        } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.schemeToConcept, 
          this.containsDerivedConceptScheme.bind(this))) {
            this._commonAddToVocabHierarchy(relationshipIRI, 
                values, 
                undefined, 
                this.listItem.selected['@id'], 
                OntologyStateService.schemeToConcept, 
                OntologyStateService.conceptToScheme, 
                'conceptSchemes', 
                this.containsDerivedConcept.bind(this)
            );
        }
    }
    /**
     * Updates the appropriate vocabulary hierarchies in the currently selected {@link OntologyListItem} when a
     * relationship is removed from a skos:Concept or skos:ConceptScheme and the entity is not already in the 
     * appropriate location.
     *
     * @param {string} relationshipIRI The IRI of the property removed from the selected entity
     * @param {JSONLDId | JSONLDValue} axiomObject The JSON-LD of the value that was removed
     */
    removeFromVocabularyHierarchies(relationshipIRI: string, axiomObject: JSONLDId | JSONLDValue): void {
        this.getEntityNoBlankNodes(axiomObject['@id'], this.listItem)
            .subscribe(targetEntity => {
                if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.broaderRelations, this.containsDerivedConcept.bind(this)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.broaderRelations, OntologyStateService.narrowerRelations, relationshipIRI, this.containsDerivedConcept.bind(this))) {
                    this._deleteFromConceptHierarchy(this.listItem.selected['@id'], targetEntity['@id']);
                } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.narrowerRelations, this.containsDerivedConcept.bind(this)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.narrowerRelations, OntologyStateService.broaderRelations, relationshipIRI, this.containsDerivedConcept.bind(this))) {
                    this._deleteFromConceptHierarchy(targetEntity['@id'], this.listItem.selected['@id']);
                } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.conceptToScheme, this.containsDerivedConcept.bind(this)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.conceptToScheme, OntologyStateService.schemeToConcept, relationshipIRI, this.containsDerivedConceptScheme.bind(this))) {
                    this._deleteFromSchemeHierarchy(this.listItem.selected['@id'], targetEntity['@id']);
                } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.schemeToConcept, this.containsDerivedConceptScheme.bind(this)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.schemeToConcept, OntologyStateService.conceptToScheme, relationshipIRI, this.containsDerivedConcept.bind(this))) {
                    this._deleteFromSchemeHierarchy(targetEntity['@id'], this.listItem.selected['@id']);
                }
            }, error => {
                console.error(error);
            });
    }
    /**
     * Adds the provided Concept JSON-LD to the currently selected {@link OntologyListItem}. Only updates state
     * variables, does not hit the backend.
     * 
     * @param {JSONLDObject} concept The JSON-LD object of a Concept
     */
    addConcept(concept: JSONLDObject): void {
        this.listItem.concepts.iris[concept['@id']] = this.listItem.ontologyId;
        this.listItem.concepts.flat = this.flattenHierarchy(this.listItem.concepts);
    }
    /**
     * Adds the provided Concept Scheme JSON-LD to the currently selected {@link OntologyListItem}. Only updates state 
     * variables, does not hit the backend.
     * 
     * @param {JSONLDObject} scheme The JSON-LD object of a Concept Scheme
     */
    addConceptScheme(scheme: JSONLDObject): void {
        this.listItem.conceptSchemes.iris[scheme['@id']] = this.listItem.ontologyId;
        this.listItem.conceptSchemes.flat = this.flattenHierarchy(this.listItem.conceptSchemes);
    }
    /**
     * Adds the provided JSON-LD of an Individual to the currently selected {@link OntologyListItem}. Only updates state 
     * variables, does not hit the backend.
     * 
     * @param {JSONLDObject} individual The JSON-LD object of an Individual
     */
    addIndividual(individual: JSONLDObject): void {
        // update relevant lists
        get(this.listItem, 'individuals.iris')[individual['@id']] = this.listItem.ontologyId;
        const classesWithIndividuals = get(this.listItem, 'classesWithIndividuals', []);
        const individualsParentPath = get(this.listItem, 'individualsParentPath', []);
        const paths = [];
        const individuals = [];

        individual['@type'].forEach((type) => {
            const indivArr = [];
            const existingInds = get(this.listItem.classesAndIndividuals, type);
            const path = this.getPathsTo(this.listItem.classes, type);

            indivArr.push(individual['@id']);
            this.listItem.classesAndIndividuals[type] = existingInds ? concat(indivArr, existingInds) : indivArr;
            individuals.push(type);
            paths.push(path);
        });

        const uniqueUris =  uniq(flattenDeep(paths));
        set(this.listItem, 'classesWithIndividuals', concat(classesWithIndividuals, individuals));
        set(this.listItem, 'individualsParentPath', concat(individualsParentPath, uniqueUris));
        this.listItem.individuals.flat = this.createFlatIndividualTree(this.listItem);
    }
    /**
     * Deletes the entity identified by the provided IRI along with all references from the currently selected
     * {@link OntologyListItem}. Updates  the InProgressCommit as well.
     * 
     * @param {string} entityIRI The IRI of the entity to delete
     * @param {boolean} updateEverythingTree Whether to update the everything tree after deletion
     * @returns {Observable} An Observable indicating the success of the deletion
     */
    commonDelete(entityIRI: string, updateEverythingTree = false): Observable<unknown> {
        return this.om.getEntityUsages(this.listItem.versionedRdfRecord.recordId, 
            this.listItem.versionedRdfRecord.branchId, 
            this.listItem.versionedRdfRecord.commitId, 
            entityIRI, 
            'construct'
        ).pipe(
            catchError(errorMessage => {
                this.toast.createErrorToast(errorMessage);
                return throwError(errorMessage);
            }),
            switchMap(statements => {
                this.removeEntity(entityIRI);
                this.addToDeletions(this.listItem.versionedRdfRecord.recordId, this.listItem.selected);
                statements.forEach(statement => this.addToDeletions(this.listItem.versionedRdfRecord.recordId, statement));
                this.unSelectItem();
                if (updateEverythingTree) {
                    this.listItem.flatEverythingTree = this.createFlatEverythingTree(this.listItem);
                }
                return this.saveCurrentChanges();
            })
        );
    }
    /**
     * Deletes the currently selected Class from the currently selected {@link OntologyListItem}. Updates the 
     * InProgressCommit as well.
     */
    deleteClass(): void {
        const entityIRI = this.getActiveEntityIRI();
        this.removeFromClassIRIs(this.listItem, entityIRI);
        this.handleDeletedClass(entityIRI);
        pull(this.listItem.classesWithIndividuals, entityIRI);
        this.deleteEntityFromHierarchy(this.listItem.classes, entityIRI);
        this.listItem.classes.flat = this.flattenHierarchy(this.listItem.classes);
        delete this.listItem.classesAndIndividuals[entityIRI];
        this.listItem.classesWithIndividuals = Object.keys(this.listItem.classesAndIndividuals);
        this.listItem.individualsParentPath = this.getIndividualsParentPath(this.listItem);
        this.listItem.individuals.flat = this.createFlatIndividualTree(this.listItem);
        this.commonDelete(entityIRI, true)
            .subscribe(() => {
                this.setVocabularyStuff();
            });
    }
    /**
     * Deletes the currently selected Object Property from the currently selected {@link OntologyListItem}. Updates the 
     * InProgressCommit as well.
     */
    deleteObjectProperty(): void {
        const entityIRI = this.getActiveEntityIRI();
        delete this.listItem.objectProperties.iris[entityIRI];
        delete this.listItem.propertyIcons[entityIRI];
        this.handleDeletedProperty(this.listItem.selected);
        this.deleteEntityFromHierarchy(this.listItem.objectProperties, entityIRI);
        this.listItem.objectProperties.flat = this.flattenHierarchy(this.listItem.objectProperties);
        this.commonDelete(entityIRI, true)
            .subscribe(() => {
                this.setVocabularyStuff();
            });
    }
    /**
     * Deletes the currently selected Datatype Property from the currently selected {@link OntologyListItem}. Updates 
     * the InProgressCommit as well.
     */
    deleteDataTypeProperty(): void {
        const entityIRI = this.getActiveEntityIRI();
        delete this.listItem.dataProperties.iris[entityIRI];
        delete this.listItem.propertyIcons[entityIRI];
        this.handleDeletedProperty(this.listItem.selected);
        this.deleteEntityFromHierarchy(this.listItem.dataProperties, entityIRI);
        this.listItem.dataProperties.flat = this.flattenHierarchy(this.listItem.dataProperties);
        this.commonDelete(entityIRI, true).subscribe();
    }
    /**
     * Deletes the currently selected Annotation Property from the currently selected {@link OntologyListItem}. Updates 
     * the InProgressCommit as well.
     */
    deleteAnnotationProperty(): void {
        const entityIRI = this.getActiveEntityIRI();
        delete get(this.listItem, 'annotations.iris')[entityIRI];
        this.deleteEntityFromHierarchy(this.listItem.annotations, entityIRI);
        this.listItem.annotations.flat = this.flattenHierarchy(this.listItem.annotations);
        this.commonDelete(entityIRI).subscribe();
    }
    /**
     * Deletes the currently selected Individual from the currently selected {@link OntologyListItem}. Updates the 
     * InProgressCommit as well.
     */
    deleteIndividual(): void {
        const entityIRI = this.getActiveEntityIRI();
        this._removeIndividual(entityIRI);
        if (this.containsDerivedConcept(this.listItem.selected['@type'])) {
            this._removeConcept(entityIRI);
        } else if (this.containsDerivedConceptScheme(this.listItem.selected['@type'])) {
            this._removeConceptScheme(entityIRI);
        }
        this.commonDelete(entityIRI).subscribe();
    }
    /**
     * Deletes the currently selected Concept from the currently selected {@link OntologyListItem}. Updates the 
     * InProgressCommit as well.
     */
    deleteConcept(): void {
        const entityIRI = this.getActiveEntityIRI();
        this._removeConcept(entityIRI);
        this._removeIndividual(entityIRI);
        this.commonDelete(entityIRI).subscribe();
    }
    /**
     * Deletes the currently selected Concept Scheme from the currently selected {@link OntologyListItem}. Updates the 
     * InProgressCommit as well.
     */
    deleteConceptScheme(): void {
        const entityIRI = this.getActiveEntityIRI();
        this._removeConceptScheme(entityIRI);
        this._removeIndividual(entityIRI);
        this.commonDelete(entityIRI).subscribe();
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
     * Determines whether the provided id is "linkable", i.e. that a link could be made to take a user to that entity.
     * Id must be present in the indices of the currently selected {@link OntologyListItem} and not be a blank node id.
     *
     * @param {string} id An id from the current ontology
     * @returns {boolean} True if the id exists as an entity and not a blank node; false otherwise
     */
    isLinkable(id: string): boolean {
        return !!this.existsInListItem(id, this.listItem) && !isBlankNodeId(id);
    }
    /**
     * Saves the additions and deletions on the provided {@link OntologyListItem} to the current user's InProgressCommit.
     * 
     * @returns {Observable<null>} An Observable indicating the success of the save
     */
    saveCurrentChanges(listItem: OntologyListItem = this.listItem): Observable<unknown> {
      const difference = new Difference();
      difference.additions = listItem.additions;
      difference.deletions = listItem.deletions;
      return this.cm.updateInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId, difference).pipe(
        switchMap(() => this.cm.getInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId)),
        switchMap((inProgressCommit: Difference) => {
          listItem.inProgressCommit = inProgressCommit;
          listItem.additions = [];
          listItem.deletions = [];
          return isEqual(inProgressCommit, new Difference()) ? 
              this.cm.deleteInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId) : 
              of(null);
        }),
        switchMap(() => {
          forOwn(listItem.editorTabStates, value => {
            unset(value, 'usages');
          });
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
        }),
        tap(() => {
            const entityIRI = this.getActiveEntityIRI(listItem);
            const activeKey = this.getActiveKey(listItem);
            if (activeKey !== 'project' && activeKey !== 'individuals' && entityIRI) {
                this.setEntityUsages(entityIRI, listItem);
            }
        }, errorMessage => {
            this.toast.createErrorToast(errorMessage);
        })
      );
    }
    /**
     * Calculates the new label for the current selected entity in the currently selected {@link OntologyListItem} and 
     * updates all references to the entity throughout the hierarchies.
     */
    updateLabel(): void {
        const newLabel = this.om.getEntityName(this.listItem.selected);
        const iri = this.listItem.selected['@id'];
        if (has(this.listItem.entityInfo, `['${iri}'].label`) && this.listItem.entityInfo[iri].label !== newLabel) {
            this.listItem.entityInfo[iri].label = newLabel;
            this.listItem.entityInfo[iri].names = this.om.getEntityNames(this.listItem.selected);
        }
        if (this.om.isClass(this.listItem.selected)) {
            this.listItem.classes.flat = this.flattenHierarchy(this.listItem.classes);
            this.listItem.flatEverythingTree = this.createFlatEverythingTree(this.listItem);
        } else if (this.om.isDataTypeProperty(this.listItem.selected)) {
            this.listItem.dataProperties.flat = this.flattenHierarchy(this.listItem.dataProperties);
            this.listItem.flatEverythingTree = this.createFlatEverythingTree(this.listItem);
        } else if (this.om.isObjectProperty(this.listItem.selected)) {
            this.listItem.objectProperties.flat = this.flattenHierarchy(this.listItem.objectProperties);
            this.listItem.flatEverythingTree = this.createFlatEverythingTree(this.listItem);
        } else if (this.om.isAnnotation(this.listItem.selected)) {
            this.listItem.annotations.flat = this.flattenHierarchy(this.listItem.annotations);
        } else if (this.om.isConcept(this.listItem.selected, this.listItem.derivedConcepts)) {
            this.listItem.concepts.flat = this.flattenHierarchy(this.listItem.concepts);
        } else if (this.om.isConceptScheme(this.listItem.selected, this.listItem.derivedConceptSchemes)) {
            this.listItem.conceptSchemes.flat = this.flattenHierarchy(this.listItem.conceptSchemes);
        }
    }
    /**
     * Checks whether an IRI exists in the currently selected {@link OntologyListItem} and it not the current selected 
     * entity.
     * 
     * @param {string} iri The entity IRI to check
     * @returns {boolean} True if the entity exists in the `listItem` but is not selected
     */
    checkIri(iri: string): boolean {
        return includes(this.listItem.iriList, iri) && iri !== get(this.listItem.selected, '@id');
    }
    /**
     * Creates a form validator that will test whether an IRI already exists in the currently selected 
     * {@link OntologyListItem}. If it does, marks the control as invalid with the `iri` error key.
     * 
     * @returns {ValidatorFn} A Validator that marks as invalid if the IRI exists in the ontology
     */
    getDuplicateValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            return this.checkIri(control.value) ? { iri: true } : null;
        };
    }
    /**
     * Sets the super classes of the provided class iri to the provided set of class IRIs on the currently selected
     * {@link OntologyListItem}.
     * 
     * @param {string} iri A class IRI
     * @param {string[]} classIRIs A list of super class IRIs
     */
    setSuperClasses(iri: string, classIRIs: string[]): void {
        classIRIs.forEach(classIRI => {
            this.addEntityToHierarchy(this.listItem.classes, iri, classIRI);
        });
        this.listItem.classes.flat = this.flattenHierarchy(this.listItem.classes);
    }
    /**
     * Updates the flattened individual hierarchy in the currently selected {@link OntologyListItem} based on the
     * provided list of IRIs identifying classes that have been updated.
     * 
     * @param {string[]} classIRIs List of updated class IRIs
     */
    updateFlatIndividualsHierarchy(classIRIs: string[]): void {
        const paths = [];
        classIRIs.forEach(classIRI => {
            paths.push(this.getPathsTo(this.listItem.classes, classIRI));
        });
        const flattenedPaths = uniq(flattenDeep(paths));
        if (flattenedPaths.length) {
            this.listItem.individualsParentPath = concat(this.listItem.individualsParentPath, flattenedPaths);
            this.listItem.individuals.flat = this.createFlatIndividualTree(this.listItem);
        }
    }
    /**
     * Sets the super properties of the provided property iri to the provided set of properties IRIs on the currently 
     * selected {@link OntologyListItem} based on the type key provided ("dataProperties" or "objectProperties")
     * 
     * @param {string} iri The property IRI
     * @param {string} propertyIRIs A list of super property IRIs
     * @param {string} key The key in the `listItem` to update ("dataProperties" or "objectProperties")
     */
    setSuperProperties(iri: string, propertyIRIs: string[], key: string): void {
        propertyIRIs.forEach(propertyIRI => {
            this.addEntityToHierarchy(this.listItem[key], iri, propertyIRI);
        });
        this.listItem[key].flat = this.flattenHierarchy(this.listItem[key]);
    }
    /**
     * Returns a limited list of matching IRIs from the provided list based on the provided search text. The 
     * text comparison is performed based on the provided getName function (defaults to the entity name from the current
     * `listItem`). No fuzzy matching is performed. Returns the first 100 values.
     * 
     * @param {string[]} list List of IRIs to search through
     * @param {string} searchText Text to search the list with
     * @param {Function} getName A function that takes an IRI and return the name to search by
     * @returns {string[]} The limited filtered list of IRIs
     */
    getSelectList(list: string[], searchText: string, getName = this.getEntityName): string[] {
        const array = [];
        const mapped = list.map(item => ({
            item,
            name: getName(item)
        }));
        const sorted = sortBy(mapped, item => trim(item.name.toUpperCase()));
        sorted.forEach(item => {
            if (array.length === 100) {
                return;
            } else if (includes(item.name.toUpperCase(), searchText.toUpperCase())) {
                array.push(item.item);
            }
        });
        return array;
    }
    /**
     * Returns a grouped limited list of matching IRIs from the provided list based on the provided search text. The 
     * text comparison is performed based on the provided getName function (defaults to the entity name from the current
     * `listItem`). No fuzzy matching is performed. Returns the first 100 values grouped by namespace.
     * 
     * @param {string[]} list List of IRIs to search through
     * @param {string} searchText Text to search the list with
     * @param {Function} getName A function that takes an IRI and return the name to search by
     * @returns {string[]} The limited filtered list of IRIs with their names grouped by namespace
     */
    getGroupedSelectList(list: string[], searchText: string, getName = this.getEntityName): 
      {namespace: string, options: {item: string, name: string}[]}[] {
        const array: {item: string, name: string}[] = [];
        const mapped = list.map(item => ({
            item,
            name: getName(item)
        }));
        mapped.forEach(item => {
            if (array.length === 100) {
                return;
            } else if (includes(item.name.trim().toUpperCase(), searchText.trim().toUpperCase())) {
                array.push(item);
            }
        });
        const grouped: {[key: string]: {item: string, name: string}[]} = groupBy(array, item => getIRINamespace(item.item));
        return sortBy(Object.keys(grouped).map(namespace => ({
            namespace,
            options: sortBy(grouped[namespace], item => item.name.trim().toUpperCase())
        })), group => group.namespace.toUpperCase());
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
        return `<p>Are you sure you want to remove:<br><strong>${key}</strong></p><p>with value:<br><strong>`
            + `${this.getPropValueDisplay(key, index)}</strong></p><p>from:<br><strong>`
            + `${this.listItem.selected['@id']}</strong>?</p>`;
    }
    /**
     * Creates a display of the specified property value on the selected entity on the currently selected
     * {@link OntologyListItem} based on whether it is a data property value, object property value, or blank node.
     *
     * @param {string} key The IRI of a property on the current entity
     * @param {number} index The index of a specific property value
     * @return {string} A string a display of the property value
     */
    getPropValueDisplay(key: string, index: number): string {
        return get(this.listItem.selected[key], `[${index}]["@value"]`)
            || truncate(this.getBlankNodeValue(get(this.listItem.selected[key], `[${index}]["@id"]`)), {length: 150})
            || get(this.listItem.selected[key], `[${index}]["@id"]`);
    }
    /**
     * Removes the specified property value on the selected entity on the currently selected {@link OntologyListItem}, 
     * updating the InProgressCommit, everything hierarchy, and property hierarchy.
     *
     * @param {string} key The IRI of a property on the current entity
     * @param {number} index The index of a specific property value
     * @return {Observable} An Observable that resolves with the JSON-LD value object that was removed
     */
    removeProperty(key: string, index: number): Observable<JSONLDId|JSONLDValue> {
        const remove = (bnodeId) => {
            const matchingBlankNodeIndex = this.listItem.selectedBlankNodes.findIndex(obj => obj['@id'] === bnodeId);
            if (matchingBlankNodeIndex >= 0) {
                const entity = this.listItem.selectedBlankNodes.splice(matchingBlankNodeIndex, 1)[0];
                this.addToDeletions(this.listItem.versionedRdfRecord.recordId, entity);
                forOwn(omit(entity, ['@id', '@type']), (value, key) => {
                    if (isBlankNodeId(key)) {
                        remove(key);
                    }
                    forEach(value, valueObj => {
                        const id = get(valueObj, '@id');
                        if (isBlankNodeId(id)) {
                            remove(id);
                        }
                    });
                });
            }
        };
        const axiomObject: JSONLDId|JSONLDValue = this.listItem.selected[key][index];
        const json: JSONLDObject = {
            '@id': this.listItem.selected['@id'],
            [key]: [cloneDeep(axiomObject)]
        };
        this.addToDeletions(this.listItem.versionedRdfRecord.recordId, json);
        if (isBlankNodeId(axiomObject['@id'])) {
            remove(axiomObject['@id']);
        }
        this.pm.remove(this.listItem.selected, key, index);

        if (`${RDFS}domain` === key && !isBlankNodeId(axiomObject['@id'])) {
            this.removePropertyFromClass(this.listItem.selected, axiomObject['@id']);
            this.listItem.flatEverythingTree = this.createFlatEverythingTree(this.listItem);
        } else if (`${RDFS}range` === key) {
            this.updatePropertyIcon(this.listItem.selected);
        }
        return this.saveCurrentChanges()
            .pipe(map(() => {
                if (this.om.entityNameProps.includes(key)) {
                    this.updateLabel();
                }
                return axiomObject;
            }));
    }
    /**
     * Opens the new entity snackbar for the provided entity IRI. Retrieves the entity name from the currently selected
     * {@link OntologyListItem}.
     * 
     * @param {string} iri The IRI of the entity to open the snackbar for
     */
    openSnackbar(iri: string): void {
        const snackbar = this.snackBar.open(`${this.getEntityName(iri)} successfully created`, 'Open', { duration: 5500 });
        this.listItem.openSnackbar = snackbar;
        snackbar.onAction().subscribe(() => {
            this.goTo(iri);
            if (this.listItem?.openSnackbar) {
                this.listItem.openSnackbar = undefined;
            }
            
        });
        snackbar.afterDismissed().subscribe(() => {
            if (this.listItem?.openSnackbar) {
                this.listItem.openSnackbar = undefined;
            }
        });
    }

    /* Private helper functions */
    private _addInfo(listItem: OntologyListItem, iri: string, ontologyId: string): void {
      const info = merge((listItem.entityInfo[iri] || {names: undefined, label: ''}), {
        imported: listItem.ontologyId !== ontologyId,
        ontologyId
      });
      if (!info.names) {
        info.names = [];
      }
      if (!info.label) {
        info.label = getBeautifulIRI(iri);
      }
      listItem.entityInfo[iri] = info;
    }
    private _addIri(listItem: OntologyListItem, path: string, iri: string, ontologyId: string = undefined): void {
      const iriObj = get(listItem, path, {});
      if (!has(iriObj, `['${iri}']`)) {
        iriObj[iri] = ontologyId || splitIRI(iri).begin;
      }
      this._addInfo(listItem, iri, ontologyId);
    }
    private _compareEntityName(s1: string, s2: string, listItem: OntologyListItem) {
      return lowerCase(this._getEntityNameByListItem(s1, listItem)).localeCompare(lowerCase(this._getEntityNameByListItem(s2, listItem)));
    }
    private _addNodeToFlatHierarchy(iri: string, result: HierarchyNode[], indent: number, path: string[], parentMap, listItem: OntologyListItem, joinedPath: string) {
      const newPath = path.concat(iri);
      const newJoinedPath = `${joinedPath}.${iri}`;
      const item = {
        entityIRI: iri,
        hasChildren: iri in parentMap,
        indent,
        path: newPath,
        entityInfo: this._getEntityInfoFromListItem(listItem, iri),
        joinedPath: newJoinedPath
      };
      result.push(item);
      get(parentMap, iri, []).forEach(child => {
        this._addNodeToFlatHierarchy(child, result, indent + 1, newPath, parentMap, listItem, newJoinedPath);
      });
    }
    /**
     * Gets the entity's name using the provided entityIRI and listItem to find the entity's label in the index.
     * If that entityIRI is not in the index, retrieves the beautiful IRI of the entity IRI.
     *
     * @param {string} entityIRI The entity you want the name of.
     * @param {OntologyListItem} [listItem=this.listItem] The listItem to retrieve the entity's name from
     * @returns {string} The beautified IRI string.
     */
    private _getEntityNameByListItem(entityIRI: string, listItem: OntologyListItem = this.listItem): string {
      if (listItem.entityInfo[entityIRI]) {
        return listItem.entityInfo[entityIRI].label || getBeautifulIRI(entityIRI);
      }
      return getBeautifulIRI(entityIRI);
    }
    private _removePropertyClassRelationships(propertyIRI, classIRI) {
        if (this.listItem.classToChildProperties[classIRI] && this.listItem.classToChildProperties[classIRI].includes(propertyIRI)) {
            pull(this.listItem.classToChildProperties[classIRI], propertyIRI);
            if (!this.listItem.classToChildProperties[classIRI].length) {
                delete this.listItem.classToChildProperties[classIRI];
            }
        }
    }
    private _checkChildren(hierarchyInfo, childIRI, parentIRI, root = '', path = []) {
        const parentMap = hierarchyInfo.parentMap;
        if (!root) {
            root = childIRI; 
        }
        let result = {
            circular: false,
            path: []
        };

        forEach(parentMap[childIRI], child => {
            if (!result.circular) {
                if (includes(parentMap[root], child)) {
                    path = []; 
                }
                if (path.length === 0) {
                    path.push(childIRI); 
                }
                path.push(child);
                if (child === parentIRI) {
                    result.circular = true;
                } else {
                    result = this._checkChildren(hierarchyInfo, child, parentIRI, root, path);
                }
            }
            result.path = path;
        });

        return result;
    }
    private _checkForPropertyDomains(property: JSONLDObject): void {
        if (!property[`${RDFS}domain`]) {
            this.listItem.noDomainProperties.push(property['@id']);
        }
    }
    private _existenceCheck(iriObj: {[key: string]: string}, iri: string): boolean {
        return has(iriObj, `['${iri}']`);
    }
    private _commonGoTo(tabIndex: number, iri: string, flatHierarchy: HierarchyNode[]  = undefined): void {
        this.selectItem(iri, undefined, tabIndex).subscribe(() => {
            if (flatHierarchy) {
                this.openAt(flatHierarchy, iri, tabIndex);
                this.listItem.tabIndex = tabIndex;
            }
        }, error => this.toast.createErrorToast(error));
    }
    private _getScrollIndex(iri: string, flatHierarchy: HierarchyNode[], key: number = undefined, property = false, checkPropertyOpened: () => boolean = () => false): number {
        let scrollIndex = 0;
        let index = findIndex(flatHierarchy, {entityIRI: iri});
        if (index < 0) {
            index = flatHierarchy.length;
        }
        for (let i = 0; i < index; i++) {
            const node = flatHierarchy[i];
            if (key) {
                if (!property && ((node.indent > 0 && this.areParentsOpen(node, this.getActiveKey(this.listItem, key))) || node.indent === 0)) {
                    scrollIndex++;
                } else if (property && this.areParentsOpen(node, this.getActiveKey(this.listItem, key)) && checkPropertyOpened()) {
                    scrollIndex++;
                }
            } else {
                if (!property && ((node.indent > 0 && this.areParentsOpen(node, this.getActiveKey())) || node.indent === 0)) {
                    scrollIndex++;
                } else if (property && this.areParentsOpen(node, this.getActiveKey()) && checkPropertyOpened()) {
                    scrollIndex++;
                }
            }
        }
        return scrollIndex;
    }
    private _getOpenPath(key = undefined, ...args): string {
        if (key) {
            return `${this.getActiveKey(this.listItem, key)}.${join(args.map(arg => encodeURIComponent(arg)), '.')}`;
        } else {
            return `${this.getActiveKey()}.${join(args.map(arg => encodeURIComponent(arg)), '.')}`;
        }
    }
    private _setupListItem(recordId: string, branchId: string, commitId: string, tagId: string, inProgressCommit: Difference, upToDate: boolean, title: string): OntologyListItem {
        const listItem = new OntologyListItem();
        listItem.versionedRdfRecord.title = title;
        listItem.versionedRdfRecord.recordId = recordId;
        listItem.versionedRdfRecord.branchId = branchId;
        listItem.versionedRdfRecord.commitId = commitId;
        listItem.versionedRdfRecord.tagId = tagId;
        listItem.inProgressCommit = inProgressCommit;
        listItem.upToDate = upToDate;
        listItem.query = new YasguiQuery(recordId, commitId);
        this.pm.defaultDatatypes.forEach(iri => this._addIri(listItem, 'dataPropertyRange', iri));
        return listItem;
    }
    // Not a great method, should come back to and refactor
    private _findValuesMissingDatatypes(object: any): void {
        if (has(object, '@value')) {
            if (!has(object, '@type') && !has(object, '@language')) {
                object['@type'] = `${XSD}string`;
            }
        } else if (isObject(object)) {
            Object.keys(object).forEach(key => {
                this._findValuesMissingDatatypes(object[key]);
            });
        }
    }
    private _setPropertyIcon(entity: JSONLDObject): void {
        const ranges = (entity[`${RDFS}range`] || []).map(obj => obj['@id']);
        this.listItem.propertyIcons[entity['@id']] = this._getIcon(ranges);
    }
    private _getIcon(ranges: string[]): string {
        let icon = 'fa-square-o';
        if (ranges.length) {
            if (ranges.length === 1) {
                const value = ranges[0];
                switch (value) {
                    case `${XSD}string`:
                    case `${RDF}langString`:
                        icon = 'fa-font';
                        break;
                    case `${XSD}decimal`:
                    case `${XSD}double`:
                    case `${XSD}float`:
                    case `${XSD}int`:
                    case `${XSD}integer`:
                    case `${XSD}long`:
                    case `${XSD}nonNegativeInteger`:
                        icon = 'fa-calculator';
                        break;
                    case `${XSD}language`:
                        icon = 'fa-language';
                        break;
                    case `${XSD}anyURI`:
                        icon = 'fa-external-link';
                        break;
                    case `${XSD}date`:
                        icon = 'fa-calendar-o';
                        break;
                    case `${XSD}dateTime`:
                        icon = 'fa-clock-o';
                        break;
                    case `${XSD}boolean`:
                    case `${XSD}byte`:
                        icon = 'fa-signal';
                        break;
                    case `${RDFS}Literal`:
                        icon = 'fa-cube';
                        break;
                    default:
                        icon = 'fa-link';
                        break;
                }
            } else {
                icon = 'fa-cubes';
            }
        }
        return icon;
    }
    private _getEntityInfoFromListItem(listItem: OntologyListItem, entityIRI: string): EntityNamesItem {
        if  (!entityIRI || !listItem) {
            return;
        }
        return get(listItem.entityInfo, entityIRI, undefined);
    }
    private _addToInProgress(recordId: string, json: JSONLDObject, prop: string): void {
        const listItem = this.getListItemByRecordId(recordId);
        const entity = find(listItem[prop], {'@id': json['@id']});
        const filteredJson = cloneDeep(json);
        if (entity) {
            mergeWith(entity, filteredJson, mergingArrays);
        } else  {
            listItem[prop].push(filteredJson);
        }
    }
    private _addImportedOntologyToListItem(listItem: OntologyListItem, importedOntObj: {id: string, ontologyId: string}): void {
        const importedOntologyListItem = {
            id: importedOntObj.id,
            ontologyId: importedOntObj.ontologyId
        };
        listItem.importedOntologyIds.push(importedOntObj.id);
        listItem.importedOntologies.push(importedOntologyListItem);
    }
    private _setHierarchyInfo(obj: Hierarchy, response: VocabularyStuff | OntologyStuff, key: string): void {
        const hierarchyInfo = get(response, key, {parentMap: {}, childMap: {}, circularMap: {}});
        obj.parentMap = hierarchyInfo.parentMap;
        obj.childMap = hierarchyInfo.childMap;
        obj.circularMap = hierarchyInfo.circularMap;
    }
    private _getArrWithoutEntity(iri: string, arr: JSONLDObject[]): JSONLDObject[] {
        if (!arr || !arr.length) {
            return [];
        }
        arr.splice(arr.findIndex(entity => entity['@id'] === iri), 1);
        return arr;
    }
    private _isInIris(property: string, iri: string): boolean {
        return has(get(this.listItem, `${property}.iris`), iri);
    }
    private _containsProperty(entity: JSONLDObject, properties: string[], value: string): boolean {
        return some(properties, property => some(get(entity, property), {'@id': value}));
    }
    private _isVocabPropAndEntity(relationshipIRI: string, relationshipArray: string[], 
        validateSubjectType: (a: string[]) => boolean): boolean {
        return includes(relationshipArray, relationshipIRI) && validateSubjectType(this.listItem.selected['@type']);
    }
    private _shouldUpdateVocabHierarchy(targetEntity: JSONLDObject, targetArray: string[], otherArray: string[], 
        relationshipIRI: string, validateTargetType: (a: string[]) => boolean): boolean {
        return !this._containsProperty(this.listItem.selected, without(targetArray, relationshipIRI), targetEntity['@id'])
            && !this._containsProperty(targetEntity, otherArray, this.listItem.selected['@id'])
            && validateTargetType(targetEntity['@type']);
    }
    private _commonAddToVocabHierarchy(relationshipIRI: string, values: (JSONLDId | JSONLDValue)[], entityIRI: string, 
        parentIRI: string, targetArray: string[], otherArray: string[], key: string, 
        validateTargetType: (a: string[]) => boolean): void {
        forkJoin(values.map(value => this.getEntityNoBlankNodes(value['@id'], this.listItem)))
            .subscribe(entities => {
                let update = false;
                entities.forEach(targetEntity => {
                    if (this._shouldUpdateVocabHierarchy(targetEntity, targetArray, otherArray, relationshipIRI, a => validateTargetType(a))) {
                        this.addEntityToHierarchy(this.listItem[key], entityIRI || targetEntity['@id'], parentIRI || targetEntity['@id']);
                        update = true;
                    }
                });
                if (update) {
                    this.listItem[key].flat = this.flattenHierarchy(this.listItem[key]);
                }
            }, error => {
                console.error(error);
            });
    }
    private _deleteFromConceptHierarchy(entityIRI: string, parentIRI: string): void {
        this.deleteEntityFromParentInHierarchy(this.listItem.concepts, entityIRI, parentIRI);
        this.listItem.concepts.flat = this.flattenHierarchy(this.listItem.concepts);
    }
    private _deleteFromSchemeHierarchy(entityIRI: string, parentIRI: string): void {
        this.deleteEntityFromParentInHierarchy(this.listItem.conceptSchemes, entityIRI, parentIRI);
        if (get(this.listItem, 'editorTabStates.schemes.entityIRI') === entityIRI) {
            unset(this.listItem, 'editorTabStates.schemes.entityIRI');
        }
        this.listItem.conceptSchemes.flat = this.flattenHierarchy(this.listItem.conceptSchemes);
    }
    private _removeConcept(entityIRI: string): void {
        delete get(this.listItem, 'concepts.iris')[entityIRI];
        this.deleteEntityFromHierarchy(this.listItem.concepts, entityIRI);
        this.listItem.concepts.flat = this.flattenHierarchy(this.listItem.concepts);
        this._removeConceptScheme(entityIRI);
    }
    private _removeConceptScheme(entityIRI: string): void {
        delete get(this.listItem, 'conceptSchemes.iris')[entityIRI];
        this.deleteEntityFromHierarchy(this.listItem.conceptSchemes, entityIRI);
        this.listItem.conceptSchemes.flat = this.flattenHierarchy(this.listItem.conceptSchemes);
    }
    private _removeIndividual(entityIRI: string): void {
        delete get(this.listItem, 'individuals.iris')[entityIRI];
        const indivTypes = this.listItem.selected['@type'];
        const indivAndClasses = get(this.listItem, 'classesAndIndividuals', {});

        indivTypes.forEach(type => {
            if (type !== `${OWL}NamedIndividual`) {
                const parentAndIndivs = get(indivAndClasses, `['${type}']`, []);
                if (parentAndIndivs.length) {
                    pull(parentAndIndivs, entityIRI);
                    if (!parentAndIndivs.length) {
                        delete this.listItem.classesAndIndividuals[type];
                    }
                }
            }
        });

        this.listItem.classesWithIndividuals = Object.keys(this.listItem.classesAndIndividuals);
        this.listItem.individualsParentPath = this.getIndividualsParentPath(this.listItem);
        this.listItem.individuals.flat = this.createFlatIndividualTree(this.listItem);
    }
}
