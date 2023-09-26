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
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { forkJoin, throwError, from, Observable, of, Subject, noop, merge as rxjsMerge } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
    assign,
    concat,
    difference,
    filter,
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

import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { CatalogManagerService } from './catalogManager.service';
import { VersionedRdfState } from './versionedRdfState.service';
import { CATALOG, DCTERMS, ONTOLOGYSTATE, OWL, RDF, RDFS, SKOS, XSD, ONTOLOGYEDITOR } from '../../prefixes';
import { OntologyManagerService } from './ontologyManager.service';
import { OntologyListItem } from '../models/ontologyListItem.class';
import { OntologyRecordConfig } from '../models/ontologyRecordConfig.interface';
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
import { RESTError } from '../models/RESTError.interface';
import { OntologyUploadItem } from '../models/ontologyUploadItem.interface';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { ToastService } from './toast.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { PolicyManagerService } from './policyManager.service';
import { ManchesterConverterService } from './manchesterConverter.service';
import { PropertyManagerService } from './propertyManager.service';
import { UpdateRefsService } from './updateRefs.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { YasguiQuery } from '../models/yasguiQuery.class';
import { getBeautifulIRI, getIRINamespace, getPropertyId, isBlankNodeId, mergingArrays } from '../utility';
import { SPARQLSelectBinding } from '../models/sparqlSelectResults.interface';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { EventPayload, EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';

/**
 * @class shared.OntologyStateService
 * 
 * A service which contains various variables to hold the state of the Ontology Editor page and utility functions to
 * update those variables.
 */
@Injectable()
export class OntologyStateService extends VersionedRdfState<OntologyListItem> {
    catalogId = '';
    type = ONTOLOGYEDITOR + 'OntologyRecord';
  
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

    constructor(protected snackBar: MatSnackBar, 
        protected sm: StateManagerService, 
        protected cm: CatalogManagerService,
        protected mrm: MergeRequestManagerService,
        protected spinnerSvc: ProgressSpinnerService, 
        protected om: OntologyManagerService,
        protected toast: ToastService, 
        protected updateRefs: UpdateRefsService, 
        protected pm: PropertyManagerService, 
        protected mc: ManchesterConverterService, 
        protected pe: PolicyEnforcementService, 
        protected polm: PolicyManagerService) {
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
                        if (ob) return ob;
                        return of(false);
                    } else {
                        toast.createErrorToast('Event type and payload is required');
                        return of(false);
                    }
                })
            ).subscribe();
    }
    _handleEventWithPayload(eventType: string, payload: EventPayload): Observable<any>{
        if (eventType === EventTypeConstants.EVENT_BRANCH_REMOVAL) {
            return this._handleEventBranchRemoval(payload);
        } else if (eventType === EventTypeConstants.EVENT_MERGE_REQUEST_ACCEPTED) {
            return this._handleEventMergeRequestAcceptance(payload);
        } else {
            console.warn('Event type is not valid');
            return of(false);
        }
    }
    _handleEventBranchRemoval(payload: EventPayload): Observable<any> {
        const recordId = get(payload, 'recordId');
        const branchId = get(payload, 'branchId'); 
        if (recordId && branchId) {
            const recordExistInList = some(this.list, {versionedRdfRecord: {recordId: recordId}});
            if (recordExistInList) {
                return this.removeBranch(recordId, branchId).pipe(
                    switchMap(() => this.deleteBranchState(recordId, branchId))
                );
            } else {
                return of(false);
            }
        } else {
            console.warn('EVENT_BRANCH_REMOVAL is missing recordIri or branchId');
            return of(false);
        }
    }
    _handleEventMergeRequestAcceptance(payload: EventPayload): Observable<any> {
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
                return of(false);
            } else {
                return of(false);
            }
        } else {
            console.warn('EVENT_MERGE_REQUEST_ACCEPTED is missing recordIri or targetBranchId');
            return of(false);
        }
    }

    // Only the service has access to the subject
    private _ontologyRecordActionSubject = new Subject<OntologyRecordActionI>();
    ontologyRecordAction$ = this._ontologyRecordActionSubject.asObservable();

    /**
     * `uploadFiles` holds an array of File objects for uploading ontologies. It is utilized in the
     * {@link ontology-editor.OpenOntologyTabComponent} and {@link ontology-editor.UploadOntologyOverlayComponent}.
     * @type {File[]}
     */
    uploadFiles: File[] = [];
    /**
     * `uploadList` holds an array of upload objects which contain properties about the uploaded files.
     * @type {OntologyUploadItem[]}
     */
    uploadList: OntologyUploadItem[] = [];
    /**
     * `uploadFiles` holds the number of pending uploads.
     * @type {number}
     */
    uploadPending = 0;

    /**
     * Initializes the `catalogId` variable.
     */
    initialize(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }

    getId(): Observable<string> {
        return of(this.listItem?.ontologyId || '');
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
     * Adds the error message to the list item with the identified id.
     *
     * @param {string} id The id of the upload item.
     * @param {RESTError} error The error message for the upload item.
     */
    addErrorToUploadItem(id: string, errorObject: RESTError): void {
        set(find(this.uploadList, {id}), 'error', errorObject);
    }

    /**
     * Resets all state variables.
     */
    reset(): void {
        this.list = [];
        this.listItem = undefined;
        this.uploadList = [];
    }
    /**
     * Uploads the provided JSON-LD as a new ontology and creates a new list item for the new ontology along with
     * setting up the new state.
     *
     * @param {JSONLDObject[]} ontologyJson The JSON-LD object representing the ontology definition.
     * @param {string} title The title for the OntologyRecord.
     * @param {string} description The description for the OntologyRecord.
     * @param {string[]} keywords The array of keywords for the OntologyRecord.
     * @returns {Observable} An Observable indicating the success of the creation
     */
    createOntology(ontologyJson: JSONLDObject[], title: string, description: string, keywords: string[]): Observable<null> {
        let listItem: OntologyListItem;
        const recordConfig: OntologyRecordConfig = {
            title,
            description,
            keywords,
            jsonld: ontologyJson
        };
        return this.om.uploadOntology(recordConfig)
            .pipe(
                switchMap((data: {ontologyId: string, recordId: string, branchId: string, commitId: string}) => {
                    listItem = this._setupListItem(data.recordId, data.branchId, data.commitId, new Difference(), true, title);
                    listItem.ontologyId = data.ontologyId;
                    listItem.editorTabStates.project.entityIRI = data.ontologyId;
                    return this.cm.getRecordBranch(data.branchId, data.recordId, this.catalogId);
                }),
                switchMap((branch: JSONLDObject) => {
                    listItem.branches = [branch];
                    listItem.masterBranchIri = listItem.versionedRdfRecord.branchId;
                    listItem.userCanModify = true;
                    listItem.userCanModifyMaster = true;
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
            );
    }
    /**
     * Uploads the provided file as an ontology and uses it as a basis for updating the existing ontology .
     *
     * @param {File} file The updated ontology file.
     * @param {string} recordId the ontology record ID.
     * @param {string} branchId the ontology branch ID.
     * @param {string} commitId the ontology commit ID.
     * @returns {Observable} An observable indicating the success of the process
     */
    uploadChanges(file: File, recordId: string, branchId: string, commitId: string): Observable<null> {
        return this.om.uploadChangesFile(file, recordId, branchId, commitId)
            .pipe(
                switchMap((response: HttpResponse<string>) => this.cm.getInProgressCommit(recordId, this.catalogId)),
                catchError((response: HttpErrorResponse): Observable<string> => {
                    if (typeof response === 'string'){
                        return throwError({'errorMessage': response, 'errorDetails': []});
                    } else if (typeof response === 'object' && 'errorMessage' in response){
                        return throwError(response);
                    } else if (response.status === 404) {
                        return throwError({'errorMessage': 'No changes were found in the uploaded file.', 'errorDetails': []});
                    } else {
                        return throwError({'errorMessage': 'Something went wrong. Please try again later.', 'errorDetails': []});
                    }
                }),
                switchMap((commit: Difference) => {
                    const listItem = this.getListItemByRecordId(recordId);
                    listItem.inProgressCommit = commit;
                    if (this.listItem?.versionedRdfRecord.recordId === recordId) {
                        this.listItem = cloneDeep(listItem); // Needed to trigger component input watchers
                        const idx = findIndex(this.list, item => item.versionedRdfRecord.recordId === this.listItem.versionedRdfRecord.recordId);
                        this.list[idx] = this.listItem;
                    }
                    return this.updateOntology(recordId, branchId, commitId, listItem.upToDate, commit);
                })
            );
    }
    /**
     * Used to update an ontology that is already open within the Ontology Editor. It will replace the existing
     * listItem with a new listItem consisting of the data associated with the record ID, branch ID, and commit
     * ID provided. Returns an Observable.
     *
     * @param {string} recordId The record ID associated with the requested ontology.
     * @param {string} branchId The branch ID associated with the requested ontology.
     * @param {string} commitId The commit ID associated with the requested ontology.
     * @param {boolean} [upToDate=true] The flag indicating whether the ontology is upToDate or not.
     * @param {Difference} inProgressCommit The Object containing the saved changes to apply.
     * @param {boolean} [clearCache=false] Boolean indicating whether or not you should clear the cache.
     * @returns {Observable} An Observable indicating the success or failure of the update.
     */
    updateOntology(recordId: string, branchId: string, commitId: string, upToDate = true, 
        inProgressCommit = new Difference(), clearCache = false): Observable<null> {
        let listItem: OntologyListItem;
        const oldListItem: OntologyListItem = this.getListItemByRecordId(recordId);

        return this.createOntologyListItem(recordId, branchId, commitId, inProgressCommit, upToDate, oldListItem.versionedRdfRecord.title, clearCache)
            .pipe(
                switchMap(response => {
                    listItem = response;
                    listItem.editorTabStates = oldListItem.editorTabStates;
                    if (listItem.ontologyId !== oldListItem.ontologyId) {
                        this.resetStateTabs(listItem);
                    } else {
                        listItem.selected = oldListItem.selected;
                        listItem.selectedBlankNodes = oldListItem.selectedBlankNodes;
                        listItem.blankNodes = oldListItem.blankNodes;
                    }
                    return this.updateState({recordId, commitId, branchId});
                }),
                map(() => {
                    const tabIndex = oldListItem.tabIndex;
                    const prevActiveKey = this.getActiveKey();
                    assign(oldListItem, listItem);
                    if (!listItem.isVocabulary && (prevActiveKey === 'concepts' || prevActiveKey === 'schemes')) {
                        oldListItem.tabIndex = 0;
                    } else {
                     oldListItem.tabIndex = tabIndex;
                    }
                    return null;
                })
            );
    }
    /**
     * Used to update an ontology that is already open within the Ontology Editor to the specified commit. It
     * will replace the existing listItem with a new listItem consisting of the data associated with the record
     * ID, commit ID, and optional tag ID provided. Returns an Observable.
     *
     * @param {string} recordId The record ID associated with the requested ontology.
     * @param {string} commitId The commit ID associated with the requested ontology.
     * @param {string} [tagId=''] A tag ID associated with the requested ontology.
     * @returns {Observable} An Observable indicating the success or failure of the update.
     */
    updateOntologyWithCommit(recordId: string, commitId: string, tagId = ''): Observable<null> {
        let listItem: OntologyListItem;
        const oldListItem: OntologyListItem = this.getListItemByRecordId(recordId);

        return this.createOntologyListItem(recordId, '', commitId, new Difference(), true, oldListItem.versionedRdfRecord.title, false)
            .pipe(
                switchMap(response => {
                    listItem = response;
                    listItem.editorTabStates = oldListItem.editorTabStates;
                    if (listItem.ontologyId !== oldListItem.ontologyId) {
                        this.resetStateTabs(listItem);
                    } else {
                        listItem.selected = oldListItem.selected;
                        listItem.selectedBlankNodes = oldListItem.selectedBlankNodes;
                        listItem.blankNodes = oldListItem.blankNodes;
                    }
                    return tagId ? this.updateState({recordId, commitId, tagId}) : this.updateState({recordId, commitId});
                }),
                map(() => {
                    const tabIndex = oldListItem.tabIndex;
                    const prevActiveKey = this.getActiveKey();
                    assign(oldListItem, listItem);
                    if (!listItem.isVocabulary && (prevActiveKey === 'concepts' || prevActiveKey === 'schemes')) {
                        oldListItem.tabIndex = 0;
                    } else {
                        oldListItem.tabIndex = tabIndex;
                    }
                    return null;
                })
            );
    }
    /**
     * Adds an OntologyListItem for the ontology identified by the provided ids to the `list`.
     * 
     * @param {string} recordId The Record IRI for the ontology
     * @param {string} branchId The Branch IRI of the intended version of the ontology
     * @param {string} commitId The Commit IRI of the intended version of the ontology
     * @param {Difference} inProgressCommit The Difference to save as the inProgressCommit of the ontology
     * @param {string} title The title of the ontology
     * @param {boolean} [upToDate=true] Whether the ontology is up to date in the frontend state
     * @returns {Observable<OntologyListItem>} An Observable with the newly created `listItem` for the ontology
     */
    addOntologyToList(recordId: string, branchId: string, commitId: string, inProgressCommit: Difference, title: string, upToDate = true): Observable<OntologyListItem> {
        return this.createOntologyListItem(recordId, branchId, commitId, inProgressCommit, upToDate, title, false)
            .pipe(map(listItem => {
                this.list.push(listItem);
                return listItem;
            }));
    }
    /**
     * Creates an OntologyListItem given the provided input parameters. Fetches the "ontology stuff", branches, and
     * versions of the identified ontology and setups all the various state variables on the listItem. Does not add to
     * the `list` in this method.
     * 
     * @param {string} recordId The Record IRI for the ontology
     * @param {string} branchId The Branch IRI of the intended version of the ontology
     * @param {string} commitId The Commit IRI of the intended version of the ontology
     * @param {Difference} inProgressCommit The Difference to save as the InProgressCommit of the ontology
     * @param {boolean} [upToDate=true] Whether the ontology should be considered as up to date in the frontend state.
     * Defaults to true
     * @param {string} title The title of the ontology
     * @param {boolean} clearCache Whether to clear the ontology cache when fetching the "ontology stuff"
     * @returns {Observable<OntologyListItem>} An Observable with the newly created `listItem` for the ontology
     */
    createOntologyListItem(recordId: string, branchId: string, commitId: string, inProgressCommit: Difference, upToDate = true, title: string, clearCache: boolean): Observable<OntologyListItem> {
        const modifyRequest: any = {
            resourceId: recordId,
            actionId: this.polm.actionModify
        };
        const listItem: OntologyListItem = this._setupListItem(recordId, branchId, commitId, inProgressCommit, upToDate, title);
        return forkJoin([
            this.om.getOntologyStuff(recordId, branchId, commitId, clearCache),
            this.cm.getRecordBranches(recordId, this.catalogId),
            this.cm.getRecordVersions(recordId, this.catalogId)
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
                listItem.branches = response[1].body;
                const branch = find(listItem.branches, { '@id': listItem.versionedRdfRecord.branchId });
                listItem.userBranch = this.cm.isUserBranch(branch);
                if (listItem.userBranch) {
                    listItem.createdFromExists = some(listItem.branches, {'@id': getPropertyId(branch, `${CATALOG}createdFrom`)});
                }
                listItem.masterBranchIri = find(listItem.branches, {[`${DCTERMS}title`]: [{'@value': 'MASTER'}]})['@id'];
                listItem.tags = filter(response[2].body, version => includes(get(version, '@type'), `${CATALOG}Tag`));
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
    /**
     * Gets the unique list of parents that should be displayed in the individuals hierarchy for the provided `listItem`
     * 
     * @param {OntologyListItem} listItem THe listItem to investigate
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
     * 
     * @param listItem 
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
     * Flattens the provided hierarchy information into an array that represents the hierarchical structure to be
     * used with a virtual scrolling solution.
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
    private _compareEntityName(s1: string, s2: string, listItem: OntologyListItem) {
        return lowerCase(this.getEntityNameByListItem(s1, listItem)).localeCompare(lowerCase(this.getEntityNameByListItem(s2, listItem)));
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
     * Creates an array which represents the hierarchical structure of the relationship between classes
     * and properties of the ontology represented by the provided `listItem` to be used with a virtual
     * scrolling solution.
     *
     * @param {OntologyListItem} listItem The listItem representing the ontology to create the structure for
     * @returns {(HierarchyNode|ParentNode)[]} An array which contains the class-property relationships.
     */
    createFlatEverythingTree(listItem: OntologyListItem = this.listItem): (HierarchyNode|ParentNode)[] {
        const result = [];
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
                    const sortedIndividuals: string[] = sortBy(get(classesWithIndividuals, node.entityIRI), entityIRI => lowerCase(this.getEntityNameByListItem(entityIRI, listItem)));
                    sortedIndividuals.forEach(entityIRI => {
                        this._addNodeToFlatHierarchy(entityIRI, result, node.indent + 1, node.path, {}, listItem, this.joinPath(node.path));
                    });
                }
            });
        }
        return result;
    }
    /**
     * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
     * Mobi repository. Adds the new entity to the index.
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
     * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the Mobi
     * repository along with any referenced blank nodes. Removes the entityIRI and any reference blank nodes
     * from the index.
     *
     * @param {string} entityIRI The IRI of the entity to remove.
     * @param {OntologyListItem} [listItem=listItem] The listItem linked to the ontology you want to remove the entity from.
     */
    removeEntity(entityIRI: string, listItem: OntologyListItem = this.listItem): void {
        pull(listItem.iriList, entityIRI);
        unset(listItem.entityInfo, entityIRI);
    }
    /**
     * Gets entity with the provided IRI from the ontology linked to the provided recordId in the Mobi
     * repository. Returns the entity Object.
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
     * Gets entity with the provided IRI from the ontology in the provided `listItem` using
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
     * Gets entity with the provided IRI from the ontology in the provided `listItem` using
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
     * Gets the entity's name using the provided entityIRI and listItem to find the entity's label in the index.
     * If that entityIRI is not in the index, retrieves the beautiful IRI of the entity IRI.
     *
     * @param {string} entityIRI The entity you want the name of.
     * @param {OntologyListItem} [listItem=this.listItem] The listItem to retrieve the entity's name from
     * @returns {string} The beautified IRI string.
     */
    getEntityNameByListItem(entityIRI: string, listItem: OntologyListItem = this.listItem): string {
        if (listItem.entityInfo[entityIRI]) {
            return listItem.entityInfo[entityIRI].label || getBeautifulIRI(entityIRI);
        }
        return getBeautifulIRI(entityIRI);
    }
    /**
     * Saves all changes to the ontology with the specified record id by updating the in progress commit.
     *
     * @param {string} recordId The record ID of the requested ontology.
     * @param {Difference} differenceObj The object containing statements that represent changes made.
     * @returns {Observable<null>} An Observable with the ontology ID.
     */
    saveChanges(recordId: string, differenceObj: Difference): Observable<void> {
        return this.cm.updateInProgressCommit(recordId, this.catalogId, differenceObj);
    }
    /**
     * 
     * @param recordId 
     * @param json 
     */
    addToAdditions(recordId: string, json: JSONLDObject): void {
        this._addToInProgress(recordId, json, 'additions');
    }
    /**
     * 
     * @param recordId 
     * @param json 
     */
    addToDeletions(recordId: string, json: JSONLDObject): void {
        this._addToInProgress(recordId, json, 'deletions');
    }
    /**
     * Used to open an ontology from the Mobi repository. It calls
     * {@link shared.OntologyStateService#getCatalogDetails} to get the specified ontology catalog information from the
     * Mobi repository. Returns an Observable.
     *
     * @param {string} recordId The record ID of the requested ontology.
     * @param {string} recordTitle The title of the requested ontology.
     * @returns {Observable} An observable that resolves if the action was successful and rejects if not.
     */
    openOntology(recordId: string, recordTitle: string): Observable<null> {
        let listItem;
        return this.getCatalogDetails(recordId)
            .pipe(
                switchMap((response: {recordId: string, branchId: string, commitId: string, upToDate: boolean, inProgressCommit: Difference}) => 
                    this.addOntologyToList(recordId, response.branchId, response.commitId, response.inProgressCommit, recordTitle, response.upToDate)),
                switchMap(response => {
                    listItem = response;
                    return this.setSelected(this.getActiveEntityIRI(listItem), false, listItem);
                }),
                map(() => {
                    this.listItem = listItem;
                    return null;
                })
            );
    }
    /**
     * Used to close an ontology from the Mobi application. It removes the ontology list item from the
     * {@link shared.OntologyStateService#list}.
     *
     * @param {string} recordId The record ID of the requested ontology.
     */
    closeOntology(recordId: string): void {
        if (get(this.listItem, 'versionedRdfRecord.recordId') === recordId) {
            this.listItem = undefined;
        }
        remove(this.list, { versionedRdfRecord: { recordId }});
        this.emitOntologyAction({ action: OntologyAction.ONTOLOGY_CLOSE, recordId });
    }
    /**
     * Removes the specified branch from the `listItem` for the specified record. Meant to be called after the
     * Branch has already been deleted. Also updates the `tags` list on the `listItem` to account for any tags
     * that were removed as a result of the branch removal.
     *
     * @param {string} recordId The IRI of the Record whose Branch was deleted
     * @param {string} branchId The IRI of the Branch that was deleted
     */
    removeBranch(recordId: string, branchId: string): Observable<null> {
        const listItem = this.getListItemByRecordId(recordId);
        remove(listItem.branches, {'@id': branchId});
        return this.cm.getRecordVersions(recordId, this.catalogId)
            .pipe(
                map((response: HttpResponse<JSONLDObject[]>) => {
                    listItem.tags = filter(response.body, version => includes(get(version, '@type'), `${CATALOG}Tag`));
                    return null;
                })
            );
    }
    /**
     * 
     * @returns 
     */
    afterSave(listItem: OntologyListItem = this.listItem, cloneListItem = true): Observable<unknown> {
        return this.cm.getInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId)
            .pipe(
                switchMap((inProgressCommit: Difference) => {
                    listItem.inProgressCommit = inProgressCommit;
                    listItem.additions = [];
                    listItem.deletions = [];
                    return isEqual(inProgressCommit, new Difference()) ? this.cm.deleteInProgressCommit(listItem.versionedRdfRecord.recordId, this.catalogId) : of(null);
                }),
                switchMap(() => {
                    forOwn(listItem.editorTabStates, value => {
                        unset(value, 'usages');
                    });

                    // Needed to trigger component input watchers
                    if (this.listItem.versionedRdfRecord.recordId === listItem.versionedRdfRecord.recordId && cloneListItem) {
                        this.listItem = cloneDeep(listItem); 
                        const idx = findIndex(this.list, item => item.versionedRdfRecord.recordId === this.listItem.versionedRdfRecord.recordId);
                        this.list[idx] = this.listItem;
                    }

                    if (isEmpty(this.getStateByRecordId(listItem.versionedRdfRecord.recordId))) {
                        return this.createState({recordId: listItem.versionedRdfRecord.recordId, commitId: listItem.versionedRdfRecord.commitId, branchId: listItem.versionedRdfRecord.branchId});
                    } else {
                        return this.updateState({recordId: listItem.versionedRdfRecord.recordId, commitId: listItem.versionedRdfRecord.commitId, branchId: listItem.versionedRdfRecord.branchId});
                    }
                })
            );
    }
    /**
     * Clears the the InProgressCommit on the current `listItem`
     */
    clearInProgressCommit(): void {
        this.listItem.inProgressCommit = new Difference();
        // Needed to trigger component input watchers
        this.listItem = cloneDeep(this.listItem); 
        const idx = findIndex(this.list, item => item.versionedRdfRecord.recordId === this.listItem.versionedRdfRecord.recordId);
        this.list[idx] = this.listItem;
    }
    /**
     * Sets the opened the status
     * @param recordId 
     * @param isOpened 
     */
    setNoDomainsOpened(recordId: string, isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'noDomainsOpened'), isOpened);
    }
    /**
     * 
     * @param recordId 
     * @returns 
     */
    getNoDomainsOpened(recordId: string, key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'noDomainsOpened'), false);
    }
    /**
     * 
     * @param recordId 
     * @param isOpened 
     */
    setDataPropertiesOpened(recordId: string, isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'dataPropertiesOpened'), isOpened);
    }
    /**
     * 
     * @param recordId 
     * @returns 
     */
    getDataPropertiesOpened(recordId: string, key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'dataPropertiesOpened'), false);
    }
    /**
     * 
     * @param recordId 
     * @param isOpened 
     */
    setObjectPropertiesOpened(recordId: string, isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'objectPropertiesOpened'), isOpened);
    }
    /**
     * 
     * @param recordId 
     * @returns 
     */
    getObjectPropertiesOpened(recordId: string, key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'objectPropertiesOpened'), false);
    }
    /**
     * 
     * @param recordId 
     * @param isOpened 
     */
    setAnnotationPropertiesOpened(recordId: string, isOpened: boolean, key: number = undefined): void {
        set(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'annotationPropertiesOpened'), isOpened);
    }
    /**
     * 
     * @param recordId 
     * @returns 
     */
    getAnnotationPropertiesOpened(recordId: string, key: number = undefined): boolean {
        return get(this.listItem.editorTabStates, this._getOpenPath(key, recordId, 'annotationPropertiesOpened'), false);
    }
    // TODO: Keep an eye on this
    /**
     * onEdit Method
     * @param iriBegin 
     * @param iriThen 
     * @param iriEnd 
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
        return this.om.getEntityUsages(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId, oldEntity['@id'], 'construct')
            .pipe(
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
     * 
     * @param iriBegin 
     * @param iriThen 
     */
    setCommonIriParts(iriBegin: string, iriThen: string): void {
        set(this.listItem, 'iriBegin', iriBegin);
        set(this.listItem, 'iriThen', iriThen);
    }
    /**
     * Sets the `selected`, `selectedBlankNodes`, and `blankNodes` properties on the provided `listItem` based on the
     * response from {@link shared.OntologyManagerService#getEntityAndBlankNodes}. Returns an Observable indicating
     * the success of the action. If the provided `entityIRI` or `listItem` are not valid, returns an Observable that
     * resolves. Sets the entity usages if the provided `getUsages` parameter is true. Also accepts an optional
     * ElementRef to attach a spinner to in the call to fetch the entity.
     *
     * @param {string} entityIRI The IRI of the entity to retrieve
     * @param {boolean} [getUsages=true] Whether to set the usages of the entity after fetching
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @param {ElementRef} element An optional element to attach a spinner to when fetching the entity
     * @return {Observable} An Observable indicating the success of the action
     */
    setSelected(entityIRI: string, getUsages = true, listItem: OntologyListItem = this.listItem, element?: ElementRef, key?): Observable<null> {
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
        return this.om.getEntityAndBlankNodes(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, entityIRI, undefined, undefined, undefined, !!element)
            .pipe(
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
                    if (key) {
                        if (getUsages && !has(this.getActivePage(this.listItem, key), 'usages') && listItem.selected) {
                            this.setEntityUsages(entityIRI);
                        }
                    } else {
                        if (getUsages && !has(this.getActivePage(), 'usages') && listItem.selected) {
                            this.setEntityUsages(entityIRI);
                        }
                    }
                    return null;
                })
            );
    }
    /**
     * Fetches and sets the usages of the entity identified by the provided IRI onto the provided list item for the tab
     * with the provided index. Defaults to the currently selected list item and defaults to the active tab. If the tab
     * has a usages container element, will start and stop a targeted spinner. If the entity usages fetch fails, sets 
     * the tab usages to an empty array.
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
     * Resets the state of each of the tabs in the provided `listItem`. If the active tab is the project tab, sets the
     * selected entity back to the Ontology object. If the active tab is not the project tab, unsets the selected entity
     * and its blank nodes.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     */
    resetStateTabs(listItem: OntologyListItem = this.listItem): void {
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
        } else {
            this.setSelected(listItem.editorTabStates.project.entityIRI, false, listItem, listItem.editorTabStates.project.element).subscribe(noop, error => this.toast.createErrorToast(error));
        }
        listItem.seeHistory = false;
    }
    /**
     * 
     * @param listItem 
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
     * Get Active Key
     * @param {OntologyListItem} listItem The listItem to get the active key for. Otherwise uses the currently selected
     * @param {number} [tabIndex=undefined] An optional tab index to get the key for. Otherwise uses the active page of
     * the listItem
     * @returns 
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
            case OntologyListItem.SAVED_CHANGES_TAB:
                return 'savedChanges';
            case OntologyListItem.COMMITS_TAB:
                return 'commits';
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
     * selected item
     * @param {number} [tabIndex=undefined] The optional index of the page to retrieve. Otherwise uses the active one 
     * @returns 
     */
    getActivePage(listItem: OntologyListItem = this.listItem, tabIndex: number = undefined): any {
        return tabIndex !== undefined ? listItem.editorTabStates[this.getActiveKey(listItem, tabIndex)] : listItem.editorTabStates[this.getActiveKey(listItem)];
    }
    /**
     * Retrieves the IRI of the activity entity on a specific page of the provided {@link OntologyListItem}.
     * 
     * @param {OntologyListItem} listItem The optional listItem to get the active entity of. Otherwise uses the currently
     * selected item
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
     * @returns {Observable<null>} An Observable that resolves if the action was successful; rejects otherwise
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
     * Tests whether the provided `listItem` can be committed based on whether the InProgressCommit has any data saved.
     * 
     * @param {OntologyListItem} listItem The OntologyListItem to test
     * @returns {boolean} True if there are changes saved in the InProgressCommit on the provided `listItem`; false
     * otherwise
     */
    isCommittable(listItem: OntologyListItem): boolean {
        return !!get(listItem, 'inProgressCommit.additions', []).length || !!get(listItem, 'inProgressCommit.deletions', []).length;
    }
    /**
     * Updates the `isSaved` variable on the current `listItem` depending on whether it is committable or not.
     */
    updateIsSaved(listItem: OntologyListItem = this.listItem): void {
        listItem.isSaved = this.isCommittable(listItem);
    }
    /**
     * addEntityToHierarchy 
     * @param hierarchyInfo 
     * @param entityIRI 
     * @param parentIRI 
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
     * Delete Entity From ParentInHierarchy 
     * @param hierarchyInfo 
     * @param entityIRI 
     * @param parentIRI 
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
     * Delete Entity From Hierarchy
     * @param hierarchyInfo 
     * @param entityIRI 
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
     * Get Paths To
     * @param hierarchyInfo 
     * @param entityIRI 
     * @returns 
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
     * tab in the current `listItem`.
     * 
     * @param {HierarchyNode} node The HierarchyNode of interest
     * @param {string} tab The name of the tab to test the hierarchy within
     * @returns True if all parent of the node are open in the tab's hierarchy; false otherwise
     */
    isDirectParentOpen(node: HierarchyNode, tab: string): boolean {
        return this.listItem.editorTabStates[tab].open[this.joinPath(node.path.slice(0, node.path.length - 1))];
    }

    /**
     * Tests whether all the parent nodes of the provided HierarchyNode are open within the hierarchy of the provided
     * tab in the current `listItem`.
     * 
     * @param {HierarchyNode} node The HierarchyNode of interest
     * @param {string} tab The name of the tab to test the hierarchy within
     * @returns True if all parent of the node are open in the tab's hierarchy; false otherwise
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
     * @returns A single string with the joined path
     */
    joinPath(path: string[]): string {
        return join(path, '.');
    }
    /**
     * Updates the current `listItem` to view the entity identified by the provided IRI. Updates the selected tab in the
     * editor and all required variables in order to view the details of the entity.
     * 
     * @param {string} iri The IRI of the entity to open the editor at
     */
    goTo(iri: string): void {
        if (get(this.listItem, 'ontologyId') === iri) {
            this._commonGoTo(OntologyListItem.PROJECT_TAB, iri);
        } else if (this._isInIris('classes', iri)) {
            this._commonGoTo(OntologyListItem.CLASSES_TAB, iri, this.listItem.classes.flat);
            this.listItem.editorTabStates.classes.index = this._getScrollIndex(iri, this.listItem.classes.flat, OntologyListItem.CLASSES_TAB);
        } else if (this._isInIris('dataProperties', iri)) {
            this._commonGoTo(OntologyListItem.PROPERTIES_TAB, iri, this.listItem.dataProperties.flat);
            this.setDataPropertiesOpened(this.listItem.versionedRdfRecord.recordId, true, OntologyListItem.PROPERTIES_TAB);
            // Index is incremented by 1 to account for Data Property folder
            this.listItem.editorTabStates.properties.index = this._getScrollIndex(iri, this.listItem.dataProperties.flat, OntologyListItem.PROPERTIES_TAB,  true, iri => this.getDataPropertiesOpened(iri)) + 1;
        } else if (this._isInIris('objectProperties', iri)) {
            this._commonGoTo(OntologyListItem.PROPERTIES_TAB, iri, this.listItem.objectProperties.flat);
            this.setObjectPropertiesOpened(this.listItem.versionedRdfRecord.recordId, true, OntologyListItem.PROPERTIES_TAB);

            let index = 0;
            // If Data Properties are present, count the number of shown properties and increment by 1 for the Data Property folder
            if (this.listItem.dataProperties.flat.length > 0) {
                index += this._getScrollIndex(iri, this.listItem.dataProperties.flat, OntologyListItem.PROPERTIES_TAB, true, iri => this.getDataPropertiesOpened(iri)) + 1;
            }
            // Index is incremented by 1 to account for Object Property folder
            this.listItem.editorTabStates.properties.index = index + this._getScrollIndex(iri, this.listItem.objectProperties.flat, OntologyListItem.PROPERTIES_TAB, true, iri => this.getObjectPropertiesOpened(iri)) + 1;
        } else if (this._isInIris('annotations', iri)) {
            this._commonGoTo(OntologyListItem.PROPERTIES_TAB, iri, this.listItem.annotations.flat);
            this.setAnnotationPropertiesOpened(this.listItem.versionedRdfRecord.recordId, true, OntologyListItem.PROPERTIES_TAB);

            let index = 0;
            // If Data Properties are present, count the number of shown properties and increment by 1 for the Data Property folder
            if (this.listItem.dataProperties.flat.length > 0) {
                index += this._getScrollIndex(iri, this.listItem.dataProperties.flat, OntologyListItem.PROPERTIES_TAB, true, iri => this.getDataPropertiesOpened(iri, OntologyListItem.PROPERTIES_TAB)) + 1;
            }
            // If Object Properties are present, count the number of shown properties and increment by 1 for the Object Property folder
            if (this.listItem.objectProperties.flat.length > 0) {
                index += this._getScrollIndex(iri, this.listItem.objectProperties.flat, OntologyListItem.PROPERTIES_TAB, true, iri => this.getObjectPropertiesOpened(iri, OntologyListItem.PROPERTIES_TAB)) + 1;
            }
            // Index is incremented by 1 to account for Annotation Property folder
            this.listItem.editorTabStates.properties.index = index + this._getScrollIndex(iri, this.listItem.annotations.flat, OntologyListItem.PROPERTIES_TAB, true, iri => this.getAnnotationPropertiesOpened(iri, OntologyListItem.PROPERTIES_TAB)) + 1;
        } else if (this._isInIris('concepts', iri)) {
            this._commonGoTo(OntologyListItem.CONCEPTS_TAB, iri, this.listItem.concepts.flat);
            this.listItem.editorTabStates.concepts.index = this._getScrollIndex(iri, this.listItem.concepts.flat, OntologyListItem.CONCEPTS_TAB);
        } else if (this._isInIris('conceptSchemes', iri)) {
            this._commonGoTo(OntologyListItem.CONCEPTS_SCHEMES_TAB, iri, this.listItem.conceptSchemes.flat);
            this.listItem.editorTabStates.schemes.index = this._getScrollIndex(iri, this.listItem.conceptSchemes.flat, OntologyListItem.CONCEPTS_SCHEMES_TAB);
        } else if (this._isInIris('individuals', iri)) {
            this._commonGoTo(OntologyListItem.INDIVIDUALS_TAB, iri, this.listItem.individuals.flat);
            this.listItem.editorTabStates.individuals.index = this._getScrollIndex(iri, this.listItem.individuals.flat, OntologyListItem.INDIVIDUALS_TAB);
        }
    }
    /**
     * Opens the hierarchy represented by the provided list of nodes at the entity identified byt he provided IRI.
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
     * Generates the default prefix to be used for all new entities in the current `listItem`. Uses the ontology IRI as
     * a basis unless overridden. If the prefix is found to be a blank node, tries the first IRI it can find within the
     * ontology. If an IRI isn't found, creates a blank node prefix.
     * 
     * @returns {string} The prefix for new IRIs created within the current `listItem`
     */
    getDefaultPrefix(): string {
        let prefixIri = replace(this.listItem.iriBegin || this.listItem.ontologyId, '#', '/') + (this.listItem.iriThen || '#');
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
     * Determines whether the provided OntologyListItem has the InProgressCommit set and whether it has any contents.
     * 
     * @param {OntologyListItem} listItem The OntologyListItem to inspect
     * @returns {boolean} True if there is an InProgressCommit with contents; false otherwise
     */
    hasInProgressCommit(listItem: OntologyListItem = this.listItem): boolean {
        return listItem.inProgressCommit !== undefined
                && ((listItem.inProgressCommit.additions !== undefined && listItem.inProgressCommit.additions.length > 0)
                || (listItem.inProgressCommit.deletions !== undefined && listItem.inProgressCommit.deletions.length > 0));
    }
    /**
     * Adds the provided class IRI to the provided `listItem`. Updates the isVocabulary variable if the added class is
     * skos:Concept or skos:ConceptScheme. Also optionally takes the ID of the ontology that contains the class
     * definition if not the current ontology.
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
     * Removes the provided class IRI from the provided `listItem`. Updates the isVocabulary variable if the class IRI
     * is skos:Concept or skos:ConceptScheme and the other doesn't exist (this should only happen if the SKOS constructs
     * happen to be redefined in the ontology).
     * 
     * @param {OntologyListItem} listItem The OntologyListItem to update
     * @param {string} iri The class IRI to remove
     */
    removeFromClassIRIs(listItem: OntologyListItem, iri: string): void {
        const conceptCheck = iri === `${SKOS}Concept` && !this._existenceCheck(listItem.classes.iris, `${SKOS}ConceptScheme`);
        const schemeCheck = iri === `${SKOS}ConceptScheme` && !this._existenceCheck(listItem.classes.iris, `${SKOS}Concept`);
        if (conceptCheck || schemeCheck) {
            listItem.isVocabulary = false;
        }
        delete listItem.classes.iris[iri];
    }
    /**
     * Implements the `merge` method from the `VersionedRdfState` abstract class. Performs a merge of the source/current
     * branch into the selected target with any chosen resolutions and performs the appropriate clean up activities.
     * 
     * @returns {Observable<null>} An Observable that indicates the success of the operation
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
                switchMap(() => this.updateOntology(this.listItem.versionedRdfRecord.recordId, this.listItem.merge.target['@id'], commitId))
            );
    }
    /**
     * Determines whether the current `listItem` can be edited. Depends on whether a branch is selected, the master
     * branch is selected, and the ontology's policy.
     * 
     * @returns {boolean} True if the current `listItem` can be edited; false otherwise
     */
    canModify(): boolean {
        if (!this.listItem.versionedRdfRecord.branchId) {
            return false;
        }
        if (this.listItem.masterBranchIri === this.listItem.versionedRdfRecord.branchId) {
            return this.listItem.userCanModifyMaster;
        } else {
            return this.listItem.userCanModify;
        }
    }
    /**
     * Retrieves the entityInfo for the provided IRI from the provided `listItem`.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {EntityNamesItem} The entityInfo for the provided IRI
     */
    getFromListItem(iri: string, listItem: OntologyListItem = this.listItem): EntityNamesItem {
        return get(listItem, `entityInfo[${iri}]`, {});
    }
    /**
     * Determines whether the provided IRI exists in the entityInfo for the provided `listItem`. Returns a boolean.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {boolean} True if the IRI exists in the entityInfo object; false otherwise
     */
    existsInListItem(iri: string, listItem: OntologyListItem = this.listItem): boolean {
        return iri in get(listItem, 'entityInfo', {});
    }
    /**
     * Determines whether the provided IRI is imported or not. Defaults to true.
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
     * Determines whether the provided IRI is deprecated or not. Defaults to false.
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
     * Modify annotation state, it is being used to ensure deprecated is correct
     *
     * @param {string} iri The IRI to search for
     * @param {annotationIri} annotation iri
     * @param {annotationValue} annotation value
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     */
    annotationModified(iri: string, annotationIri: string, annotationValue: string, listItem: OntologyListItem = this.listItem): void {
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
     * Determines whether the selected IRI is imported or not. Defaults to true.
     *
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     * @returns {boolean} True if the selected IRI is imported; false otherwise
     */
    isSelectedImported(listItem: OntologyListItem = this.listItem): boolean {
        const iri = get(listItem.selected, '@id', '');
        return iri ? this.isImported(iri, listItem) : false;
    }
    /**
     * Method to collapse all of the nodes in hierarchy flat list under following tabs: 'classes', 'dataProperties',
     * 'objectProperties', 'annotations', 'concepts', 'conceptSchemes', 'dataProperties', 'individuals', 'flatEverythingTree'
     * The mapper function checks to see if the hierarchy node is open, if it is open, then it will close node.
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
     * Method to recalculate the 'joinedPath' field on each of the nodes of the flatlists. If the recalculated 
     * value differs from the previous value, the editorTabStates on the listItem are adjusted accordingly for
     * that joinedPath.
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
     * Method to alter tree hierarchy flat lists give a mapper function under following tabs: 'classes', 'dataProperties',
     * 'objectProperties', 'annotations', 'concepts', 'conceptSchemes', 'dataProperties', 'individuals', 'flatEverythingTree'
     *
     * @param {Function} mapper function - use to alter the node state
     * @param {OntologyListItem} [listItem=listItem] The listItem to execute these actions against
     */
    alterTreeHierarchy(mapperFunction: (node: HierarchyNode) => HierarchyNode, listItem: OntologyListItem = this.listItem): void {
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
     * Updates property maps on the current listItem based on the provided deleted class IRI
     *
     * @param {string} ClassIRI The iri of the entity to be deleted
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
     * Deletes traces of a removed property from the classToChild map and noDomainProperties array
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
     * adds property iri to the correct map; either noDomainProperties or classToChildProperties
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
     * Updates map appropriately if domains are added to a property
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
     * Handles the removal of the provided class IRI as a domain of the provided property JSON-LD by updating `classToChildProperties` and `noDomainProperties`
     *
     * @param {JSONLDObject} property The full JSON-LD of a Property entity
     * @param {string} classIri The iri of the class the property is being removed from
     */
    removePropertyFromClass(property: JSONLDObject, classIri: string): void {
        this._removePropertyClassRelationships(property['@id'], classIri);
        this._checkForPropertyDomains(property);
    }

    /**
     * Emit ontology events or actions
     * @param { OntologyRecordActionI } - The action Object
     */
    emitOntologyAction(action: OntologyRecordActionI): void {
        this._ontologyRecordActionSubject.next(action);
    }
    /**
     * Determines whether the provided array of IRI strings contains a derived skos:Concept or skos:Concept.
     *
     * @param {string[]} arr An array of IRI strings
     * @return {boolean} True if the array contains a derived skos:Concept or skos:Concept
     */
    containsDerivedConcept(arr: string[]): boolean {
        return !!intersection(arr, concat(this.listItem.derivedConcepts, [`${SKOS}Concept`])).length;
    }
    /**
     * Determines whether the provided array of IRI objects contains a derived skos:semanticRelation or skos:semanticRelation.
     *
     * @param {string[]} arr An array of IRI objects
     * @return {boolean} True if the array contains a dervied skos:semanticRelation or skos:semanticRelation
     */
    containsDerivedSemanticRelation(arr: string[]): boolean {
        return !!intersection(arr, concat(this.listItem.derivedSemanticRelations, [`${SKOS}semanticRelation`])).length;
    }
    /**
     * Determines whether the provided array of IRI objects contains a derived skos:ConceptScheme or skos:ConceptScheme.
     *
     * @param {string[]} arr An array of IRI objects
     * @return {boolean} True if the array contains a dervied skos:ConceptScheme or skos:ConceptScheme
     */
    containsDerivedConceptScheme(arr: string[]): boolean {
        return !!intersection(arr, concat(this.listItem.derivedConceptSchemes, [`${SKOS}ConceptScheme`])).length;
    }
    /**
     * Updates the appropriate vocabulary hierarchies when a relationship is added to a skos:Concept or
     * skos:ConceptScheme and the entity is not already in the appropriate location.
     *
     * @param {string} relationshipIRI The IRI of the property added to the selected entity
     * @param {(JSONLDId | JSONLDValue)[]} values The JSON-LD of the values of the property that were added
     */
    updateVocabularyHierarchies(relationshipIRI: string, values: (JSONLDId | JSONLDValue)[]): void {
        if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.broaderRelations, a => this.containsDerivedConcept(a))) {
            this._commonAddToVocabHierarchy(relationshipIRI, values, this.listItem.selected['@id'], undefined, OntologyStateService.broaderRelations, OntologyStateService.narrowerRelations, 'concepts', a => this.containsDerivedConcept(a));
        } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.narrowerRelations, a => this.containsDerivedConcept(a))) {
            this._commonAddToVocabHierarchy(relationshipIRI, values, undefined, this.listItem.selected['@id'], OntologyStateService.narrowerRelations, OntologyStateService.broaderRelations, 'concepts', a => this.containsDerivedConcept(a));
        } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.conceptToScheme, a => this.containsDerivedConcept(a))) {
            this._commonAddToVocabHierarchy(relationshipIRI, values, this.listItem.selected['@id'], undefined, OntologyStateService.conceptToScheme, OntologyStateService.schemeToConcept, 'conceptSchemes', a => this.containsDerivedConceptScheme(a));
        } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.schemeToConcept, a => this.containsDerivedConceptScheme(a))) {
            this._commonAddToVocabHierarchy(relationshipIRI, values, undefined, this.listItem.selected['@id'], OntologyStateService.schemeToConcept, OntologyStateService.conceptToScheme, 'conceptSchemes', a => this.containsDerivedConcept(a));
        }
    }
    /**
     * Updates the appropriate vocabulary hierarchies when a relationship is removed from a skos:Concept or
     * skos:ConceptScheme and the entity is not already in the appropriate location.
     *
     * @param {string} relationshipIRI The IRI of the property removed from the selected entity
     * @param {JSONLDId | JSONLDValue} axiomObject The JSON-LD of the value that was removed
     */
    removeFromVocabularyHierarchies(relationshipIRI: string, axiomObject: JSONLDId | JSONLDValue): void {
        this.getEntityNoBlankNodes(axiomObject['@id'], this.listItem)
            .subscribe(targetEntity => {
                if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.broaderRelations, a => this.containsDerivedConcept(a)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.broaderRelations, OntologyStateService.narrowerRelations, relationshipIRI, a => this.containsDerivedConcept(a))) {
                    this._deleteFromConceptHierarchy(this.listItem.selected['@id'], targetEntity['@id']);
                } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.narrowerRelations, a => this.containsDerivedConcept(a)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.narrowerRelations, OntologyStateService.broaderRelations, relationshipIRI, a => this.containsDerivedConcept(a))) {
                    this._deleteFromConceptHierarchy(targetEntity['@id'], this.listItem.selected['@id']);
                } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.conceptToScheme, a => this.containsDerivedConcept(a)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.conceptToScheme, OntologyStateService.schemeToConcept, relationshipIRI, a => this.containsDerivedConceptScheme(a))) {
                    this._deleteFromSchemeHierarchy(this.listItem.selected['@id'], targetEntity['@id']);
                } else if (this._isVocabPropAndEntity(relationshipIRI, OntologyStateService.schemeToConcept, a => this.containsDerivedConceptScheme(a)) 
                    && this._shouldUpdateVocabHierarchy(targetEntity, OntologyStateService.schemeToConcept, OntologyStateService.conceptToScheme, relationshipIRI, a => this.containsDerivedConcept(a))) {
                    this._deleteFromSchemeHierarchy(targetEntity['@id'], this.listItem.selected['@id']);
                }
            }, error => {
                console.error(error);
            });
    }
    /**
     * Adds the provided Concept JSON-LD to the current `listItem`. Only updates state variables, does not hit the backend.
     * 
     * @param {JSONLDObject} concept The JSON-LD object of a Concept
     */
    addConcept(concept: JSONLDObject): void {
        this.listItem.concepts.iris[concept['@id']] = this.listItem.ontologyId;
        this.listItem.concepts.flat = this.flattenHierarchy(this.listItem.concepts);
    }
    /**
     * Adds the provided Concept Scheme JSON-LD to the current `listItem`. Only updates state variables, does not hit the 
     * backend.
     * 
     * @param {JSONLDObject} scheme The JSON-LD object of a Concept Scheme
     */
    addConceptScheme(scheme: JSONLDObject): void {
        this.listItem.conceptSchemes.iris[scheme['@id']] = this.listItem.ontologyId;
        this.listItem.conceptSchemes.flat = this.flattenHierarchy(this.listItem.conceptSchemes);
    }
    /**
     * Adds the provided JSON-LD of an Individual to the current `listItem`. Only updates state variables, does not hit 
     * the backend.
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
     * Deletes the entity identified by the provided IRI along with all references from the current `listItem`. Updates 
     * the InProgressCommit as well.
     * 
     * @param {string} entityIRI The IRI of the entity to delete
     * @param {boolean} updateEverythingTree Whether to update the everything tree after deletion
     * @returns {Observable} An Observable indicating the success of the deletion
     */
    commonDelete(entityIRI: string, updateEverythingTree = false): Observable<unknown> {
        return this.om.getEntityUsages(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId, entityIRI, 'construct')
            .pipe(
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
     * Deletes the currently selected Class from the current `listItem`. Updates the InProgressCommit as well.
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
     * Deletes the currently selected Object Property from the current `listItem`. Updates the InProgressCommit as well.
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
     * Deletes the currently selected Datatype Property from the current `listItem`. Updates the InProgressCommit as well.
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
     * Deletes the currently selected Annotation Property from the current `listItem`. Updates the InProgressCommit as 
     * well.
     */
    deleteAnnotationProperty(): void {
        const entityIRI = this.getActiveEntityIRI();
        delete get(this.listItem, 'annotations.iris')[entityIRI];
        this.deleteEntityFromHierarchy(this.listItem.annotations, entityIRI);
        this.listItem.annotations.flat = this.flattenHierarchy(this.listItem.annotations);
        this.commonDelete(entityIRI).subscribe();
    }
    /**
     * Deletes the currently selected Individual from the current `listItem`. Updates the InProgressCommit as well.
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
     * Deletes the currently selected Concept from the current `listItem`. Updates the InProgressCommit as well.
     */
    deleteConcept(): void {
        const entityIRI = this.getActiveEntityIRI();
        this._removeConcept(entityIRI);
        this._removeIndividual(entityIRI);
        this.commonDelete(entityIRI).subscribe();
    }
    /**
     * Deletes the currently selected Concept Scheme from the current `listItem`. Updates the InProgressCommit as well.
     */
    deleteConceptScheme(): void {
        const entityIRI = this.getActiveEntityIRI();
        this._removeConceptScheme(entityIRI);
        this._removeIndividual(entityIRI);
        this.commonDelete(entityIRI).subscribe();
    }
    /**
     * Retrieves the Manchester Syntax value for the provided blank node id if it exists in the blankNodes map of the
     * current `listItem`. If the value is not a blank node id, returns undefined. If the Manchester Syntax string is 
     * not set, returns the blank node id back.
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
     * Id must be present in the indices of the current `listItem` and not be a blank node id.
     *
     * @param {string} id An id from the current ontology
     * @returns {boolean} True if the id exists as an entity and not a blank node; false otherwise
     */
    isLinkable(id: string): boolean {
        return !!this.existsInListItem(id, this.listItem) && !isBlankNodeId(id);
    }
    /**
     * Adds a language specification on the dct:title, dct:description, and skos:prefLabel properties on the
     * provided JSON-LD object.
     * 
     * @param {JSONLDObject} entity A JSON-LD Object
     * @param {string} language The language tag to add
     */
    addLanguageToNewEntity(entity: JSONLDObject, language: string): void {
        if (language) {
            forEach([`${DCTERMS}title`, `${DCTERMS}description`, `${SKOS}prefLabel`], item => {
                if (get(entity, `['${item}'][0]`)) {
                    set(entity[item][0], '@language', language);
                }
            });
        }
    }
    /**
     * Saves the additions and deletions on the current `listItem` to the current user's InProgressCommit
     * 
     * @returns {Observable<null>} An Observable indicating the success of the save
     */
    saveCurrentChanges(listItem: OntologyListItem = this.listItem, cloneListItem = true): Observable<unknown> {
        const difference = new Difference();
        difference.additions = listItem.additions;
        difference.deletions = listItem.deletions;
        return this.saveChanges(listItem.versionedRdfRecord.recordId, difference).pipe(
            switchMap(() => this.afterSave(listItem, cloneListItem)),
            // catchError(error => of(error)),
            tap(() => {
                const entityIRI = this.getActiveEntityIRI(listItem);
                const activeKey = this.getActiveKey(listItem);
                if (activeKey !== 'project' && activeKey !== 'individuals' && entityIRI) {
                    this.setEntityUsages(entityIRI, listItem);
                }
                this.updateIsSaved(listItem);
                // this.listItem.isSaved = this.isCommittable(this.listItem);
            }, errorMessage => {
                this.toast.createErrorToast(errorMessage);
                this.listItem.isSaved = false;
            }));
            
    }
    /**
     * Calculates the new label for the current selected entity in the current `listItem` and updates all references to
     * the entity throughout the hierarchies.
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
     * Checks whether an IRI exists in the current `listItem` and it not the current selected entity
     * 
     * @param {string} iri The entity IRI to check
     * @returns {boolean} True if the entity exists in the `listItem` but is not selected
     */
    checkIri(iri: string): boolean {
        return includes(this.listItem.iriList, iri) && iri !== get(this.listItem.selected, '@id');
    }
    /**
     * Creates a form validator that will test whether an IRI already exists in the current {@link OntologyListItem}. If
     * it does, marks the control as invalid with the `iri` error key.
     * 
     * @returns {ValidatorFn} A Validator that marks as invalid if the IRI exists in the ontology
     */
    getDuplicateValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            return this.checkIri(control.value) ? { iri: true } : null;
        };
    }
    /**
     * Sets the super classes of the provided class iri to the provided set of class IRIs on the current `listItem`
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
     * Updates the flattened individual hierarchy based on the provided list of IRIs identifying classes that have been 
     * updated.
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
     * Sets the super properties of the provided property iri to the provided set of properties IRIs on the current 
     * `listItem` based on the type key provided ("dataProperties" or "objectProperties")
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
    getSelectList(list: string[], searchText: string, getName = this.getEntityNameByListItem): string[] {
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
    getGroupedSelectList(list: string[], searchText: string, getName = this.getEntityNameByListItem): {namespace: string, options: {item: string, name: string}[]}[] {
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
     * deletion of the specified property value on the selected entity of the current `listItem`
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
     * Creates a display of the specified property value on the selected entity on the current `listItem` 
     * based on whether it is a data property value, object property value, or blank node.
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
     * Removes the specified property value on the selected entity on the current `listItem`, updating the
     * InProgressCommit, everything hierarchy, and property hierarchy.
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
    openSnackbar(iri: string): void {
        const snackbar = this.snackBar.open(`${this.getEntityNameByListItem(iri)} successfully created`, 'Open', { duration: 5500 });
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
    private _getScrollIndex(iri: string, flatHierarchy: HierarchyNode[], key: number = undefined, property = false, checkPropertyOpened: (a: string) => boolean = () => false): number {
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
                } else if (property && this.areParentsOpen(node, this.getActiveKey(this.listItem, key)) && checkPropertyOpened(this.listItem.versionedRdfRecord.recordId)) {
                    scrollIndex++;
                }
            } else {
                if (!property && ((node.indent > 0 && this.areParentsOpen(node, this.getActiveKey())) || node.indent === 0)) {
                    scrollIndex++;
                } else if (property && this.areParentsOpen(node, this.getActiveKey()) && checkPropertyOpened(this.listItem.versionedRdfRecord.recordId)) {
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
    private _setupListItem(recordId: string, branchId: string, commitId: string, inProgressCommit: Difference, upToDate: boolean, title: string): OntologyListItem {
        const listItem = new OntologyListItem();
        listItem.versionedRdfRecord.title = title;
        listItem.versionedRdfRecord.recordId = recordId;
        listItem.versionedRdfRecord.branchId = branchId;
        listItem.versionedRdfRecord.commitId = commitId;
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
