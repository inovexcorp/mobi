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
import { 
    endsWith, 
    get, 
    indexOf, 
    forEach, 
    some, 
    includes, 
    find, 
    isMatch, 
    has, 
    filter, 
    intersection, 
    concat, 
    uniq
} from 'lodash';
import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { from, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';

import { CatalogManagerService } from './catalogManager.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REST_PREFIX } from '../../constants';
import { DC, ONTOLOGYEDITOR, OWL, POLICY, RDFS, SKOS, SKOSXL } from '../../prefixes';
import { VocabularyStuff } from '../models/vocabularyStuff.interface';
import { OntologyStuff } from '../models/ontologyStuff.interface';
import { PropertyToRanges } from '../models/propertyToRanges.interface';
import { IriList } from '../models/iriList.interface';
import { HierarchyResponse } from '../models/hierarchyResponse.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { OntologyDocument } from '../models/ontologyDocument.interface';
import { EntityNames } from '../models/entityNames.interface';
import { RESTError } from '../models/RESTError.interface';
import { GroupQueryResults } from '../models/groupQueryResults.interface';
import { SPARQLSelectBinding, SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { 
    createHttpParams, 
    entityNameProps, 
    getDctermsValue, 
    getEntityName, 
    getErrorDataObject, 
    getPropertyValue, 
    handleError, 
    handleErrorObject, 
    isBlankNode
} from '../utility';
import { OBJ_PROPERTY_VALUES_QUERY } from '../../queries';
import { RdfUpload } from '../models/rdfUpload.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { XACMLRequest } from '../models/XACMLRequest.interface';
import { PolicyEnforcementService } from './policyEnforcement.service';

/**
 * @class shared.OntologyManagerService
 *
 * `ontologyManagerService` is a service that provides access to the Mobi ontology REST
 * endpoints and utility functions for editing/creating ontologies and accessing
 * various entities within the ontology.
 */
@Injectable()
export class OntologyManagerService {
    catalogId = '';
    prefix = `${REST_PREFIX}ontologies`;

    constructor(
        private http: HttpClient, 
        private cm: CatalogManagerService,
        private pep: PolicyEnforcementService,
        private spinnerSrv: ProgressSpinnerService) {}

    /**
     * 'entityNameProps' holds an array of properties used to determine an entity name.
     * @type {string[]}
     */
    entityNameProps = [...entityNameProps,
        `${SKOS}prefLabel`, 
        `${SKOS}altLabel`, 
        `${SKOSXL}literalForm`
    ];

    /**
     * Initializes the `catalogId` variable.
     */
    initialize(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    /**
     * Calls the POST /mobirest/ontologies endpoint which uploads an ontology to the Mobi repository
     * with the file/JSON-LD provided. This creates a new OntologyRecord associated with this ontology. Returns an
     * observable indicating whether the ontology was persisted. Provide either a file or JSON-LD, but not both.
     *
     * @param {RdfUpload} config A configuration object containing metadata for the new Record as well as
     * the actual data itself
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable} An Observable that resolves with the ontology record metadata if successfully persisted or
     * rejects with an error message
     */
    uploadOntology(config: RdfUpload, isTracked = false): Observable<VersionedRdfUploadResponse> {
        const fd = new FormData();
        let prepObservable: Observable<null>;
        if (config.file !== undefined) {
            const titleInfo = this._getFileTitleInfo(config.file.name);
            if (endsWith(titleInfo.title, '.trig') || endsWith(titleInfo.title, '.trig.zip') 
              || endsWith(titleInfo.title, '.trig.gzip')) {
                // prepObservable = throwError('TriG data is not supported for ontology upload.');
                return throwError({errorMessage: 'TriG data is not supported for ontology upload.', errorDetails: []});
            } else if (titleInfo.ext !== 'zip' && config.file.size) {
                prepObservable = this.compressFile(config.file).pipe(map((file: File) => {
                    fd.append('file',file);
                    return null;
                }));
            } else {
                fd.append('file', config.file);
                prepObservable = of(null);
            }
        } else {
            prepObservable = of(null);
        }
        return prepObservable.pipe(
            catchError(error => {
                return throwError({error: '', errorMessage: error, errorDetails: []});
            }),
            switchMap(() => {
                if (config.jsonld !== undefined) {
                    fd.append('json', JSON.stringify(config.jsonld));
                }
                fd.append('title', config.title);
                if (config.description) {
                    fd.append('description', config.description);
                }
                forEach(config.keywords, word => fd.append('keywords', word));
                const request = this.http.post<{ontologyId: string, recordId: string, branchId: string, commitId: string}>(this.prefix, fd);
                return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleErrorObject));
            })
        );
    }
    /**
     * Calls the PUT /mobirest/ontologies/{recordId} endpoint which will return a new in-progress commit
     * object to be applied to the ontology.
     *
     * @param {File} file The updated ontology file.
     * @param {string} recordId the ontology record ID.
     * @param {string} branchId the ontology branch ID.
     * @param {string} commitId the ontology commit ID.
     * @return {Observable} HTTP OK unless there was an error.
     */
    uploadChangesFile(file: File, recordId: string, branchId: string, commitId: string): 
      Observable<HttpResponse<string>> {
        const fd = new FormData();
        fd.append('file', file);
        let headers = new HttpHeaders;
        headers = headers.append('Accept', 'application/json');
        const params = {
            branchId,
            commitId
        };
        return this.spinnerSrv.track(this.http.put(`${this.prefix}/${encodeURIComponent(recordId)}`, fd, {
            observe: 'response',
            headers,
            params: createHttpParams(params)
        })).pipe(
            catchError((error: HttpErrorResponse): Observable<RESTError> => {
                if (error.status === 0) {
                    return throwError({
                        error: '', 
                        errorMessage: 'Something went wrong. Please try again later.', 
                        errorDetails: []
                    });
                } else {
                    return throwError(getErrorDataObject(error));
                }
            }),
            map((response: HttpResponse<string>) => response)
        );
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId} endpoint which retrieves an ontology in the provided
     * RDF format.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {string} [rdfFormat='jsonld'] The RDF format to return the ontology in
     * @param {boolean} [clearCache=false] Boolean indicating whether or not you should clear the cache
     * @param {boolean} [preview=false] Boolean indicating whether or not this ontology is intended to be
     * previewed, not edited
     * @param {boolean} [applyInProgressCommit=true]  Boolean indicating whether or not any in progress commits by user
     * should be applied to the return value
     * @return {Observable} An observable with the ontology at the specified commit in the specified RDF format
     */
    getOntology(recordId: string, branchId: string, commitId: string, rdfFormat = 'jsonld', clearCache = false, 
      preview = false, applyInProgressCommit = true): Observable<JSONLDObject[] | string> {
        const params = {
            branchId,
            commitId,
            rdfFormat,
            clearCache,
            skolemize: !preview,
            applyInProgressCommit
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', rdfFormat === 'jsonld' ? 'application/json' : 'text/plain');
        return this.spinnerSrv.track(this.http.get(`${this.prefix}/${encodeURIComponent(recordId)}`, {
            responseType: 'text',
            observe: 'response',
            headers,
            params: createHttpParams(params)
        })).pipe(
            catchError(handleError),
            map((response: HttpResponse<string>) => {
                const contentType = response.headers.get('Content-Type');
                if (contentType === 'application/json') {
                    return (JSON.parse(response.body)) as JSONLDObject[];
                } else {
                    return response.body;
                }
            })
        );
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId} endpoint using the `window.open` method which will
     * start a download of the ontology starting at the identified Commit.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {string} [rdfFormat='jsonld'] The RDF format to return the ontology in
     * @param {string} [fileName='ontology'] The name given to the downloaded file
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the InProgessCommit
     */
    downloadOntology(recordId: string, branchId: string, commitId: string, rdfFormat = 'jsonld', fileName = 'ontology', 
      applyInProgressCommit = true): void {
        const params = createHttpParams({
            branchId,
            commitId,
            rdfFormat: rdfFormat || 'jsonld',
            fileName: fileName || 'ontology',
            applyInProgressCommit
        });
        const url = `${this.prefix}/${encodeURIComponent(recordId)}?${params.toString()}`;
        const readRequest: XACMLRequest = {
            resourceId: recordId,
            actionId: `${POLICY}Read`
        };
        this.pep.evaluateRequest(readRequest).pipe(
            map(currentPermissions => currentPermissions === this.pep.permit)
        ).subscribe((isPermit) => {
            if (isPermit) {
                window.open(url);
            }
        });
    }
    /**
     * 
     * @param recordId 
     * @param commitId 
     * @returns 
     */
    clearCache(recordId: string, commitId: string): Observable<void> {
      const params = createHttpParams({ commitId });
      return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(recordId)}/cache`, { params }))
        .pipe(catchError(handleError), map(() => {}));
    }
    /**
     * Calls the DELETE /mobirest/ontologies/{recordId}/branches/{branchId} endpoint which deletes the provided
     * branch from the OntologyRecord
     *
     * @param {string} recordId The id of the Record.
     * @param {string} branchId The id of the Branch that should be removed.
     * @return {Observable} HTTP OK unless there was an error.
     */
    deleteOntologyBranch(recordId: string, branchId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}`))
            .pipe(catchError(handleError), map(() => {}));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/vocabulary-stuff endpoint and retrieves a VocabularyStuff object.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<VocabularyStuff>} An Observable with a VocabularyStuff object
     */
    getVocabularyStuff(recordId: string, branchId: string, commitId: string, isTracked = false): 
      Observable<VocabularyStuff> {
        const params = { branchId, commitId };
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/vocabulary-stuff`;
        const request = this.http.get<VocabularyStuff>(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/ontology-stuff endpoint and retrieves an OntologyStuff object 
     * containing keys corresponding to the listItem structure.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} clearCache Whether or not to clear the cache
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<OntologyStuff>} An Observable with an OntologyStuff object containing listItem keys.
     */
    getOntologyStuff(recordId: string, branchId: string, commitId: string, clearCache = false, isTracked = false): 
      Observable<OntologyStuff> {
        const params = { branchId, commitId, clearCache };
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/ontology-stuff`;
        const request = this.http.get<OntologyStuff>(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/property-range endpoint and retrieves a PropertyToRanges object 
     * containing keys corresponding to Ontology Object Properties and ranges.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} [applyInProgressCommit=false] Whether to apply the in progress commit changes.
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<PropertyToRanges>} An Observable containing a PropertyToRanges object.
     */
    getPropertyToRange(recordId: string, branchId: string, commitId: string, applyInProgressCommit = false, 
      isTracked = false): Observable<PropertyToRanges> {
        const params = { branchId, commitId, applyInProgressCommit };
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/property-ranges`;
        const request = this.http.get<PropertyToRanges>(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/iris endpoint and retrieves an IriList object with all the IRIs
     * defined in the ontology for various entity types.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<IriList>} An Observable with an IriList object with all the IRIs defined in the ontology for 
     * various entity types. 
     */
    getIris(recordId: string, branchId: string, commitId: string): Observable<IriList> {
        if (!recordId) {
            return throwError('RecordId is empty');
        }
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<IriList>(`${this.prefix}/${encodeURIComponent(recordId)}/iris`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/imported-iris endpoint and retrieves an array of IriList objects
     * with IRIs for various entity types for each imported ontology of the identified ontology.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes.
     * ontology and values of arrays of IRI strings
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<IriList[]>} An Observable with an array of IriList object containing keys for various entity types for
     * each imported ontology of the identified ontology
     */
    getImportedIris(recordId: string, branchId: string, commitId: string, applyInProgressCommit = true, 
      isTracked = false): Observable<IriList[]> {
        if (!recordId) {
            return throwError('RecordId is empty');
        }
        const params = { branchId, commitId, applyInProgressCommit };
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/imported-iris`;
        const request = this.http.get<IriList[]>(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/class-hierarchies endpoint and retrieves a HierarchyResponse 
     * object corresponding to the class hierarchy.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes.
     * @return {Observable<HierarchyResponse>} An Observable with a HierarchyResponse object corresponding to the class hierarchy
     */
    getClassHierarchies(recordId: string, branchId: string, commitId: string, applyInProgressCommit = true): 
      Observable<HierarchyResponse> {
        const params = { branchId, commitId, applyInProgressCommit };
        return this.spinnerSrv.track(this.http.get<HierarchyResponse>(`${this.prefix}/${encodeURIComponent(recordId)}/class-hierarchies`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/classes endpoint and retrieves an array of the classes
     * within the ontology.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} [applyInProgressCommit=true]  Boolean indicating whether or not any in progress commits by user
     *                                                should be applied to the return value
     * @return {Observable<JSONLDObject[]>} An Observable with an array containing a list of classes
     */
    getOntologyClasses(recordId: string, branchId: string, commitId: string, applyInProgressCommit = true): 
      Observable<JSONLDObject[]> {
        const params = { branchId, commitId, applyInProgressCommit};
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(`${this.prefix}/${encodeURIComponent(recordId)}/classes`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/data-properties endpoint and retrieves an array of data properties
     * within the ontology.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<JSONLDObject[]>} An Observable with an array containing a list of data properties.
     */
    getDataProperties(recordId: string, branchId: string, commitId: string): Observable<JSONLDObject[]> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(`${this.prefix}/${encodeURIComponent(recordId)}/data-properties`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/object-properties endpoint and retrieves an array of object 
     * properties within the ontology.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<JSONLDObject[]>} An Observable with an array containing a list of object properties.
     */
    getObjProperties(recordId: string, branchId: string, commitId: string): Observable<JSONLDObject[]> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(`${this.prefix}/${encodeURIComponent(recordId)}/object-properties`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/classes-with-individuals endpoint and retrieves an object
     * with the hierarchy of classes with individuals in the ontology organized by the subClassOf property and with
     * an index of each IRI and its parent IRIs.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<JSONLDObject>} An Observable with an object containing the hierarchy of classes with
     * individuals and an index of IRIs to parent IRIs
     */
    getClassesWithIndividuals(recordId: string, branchId: string, commitId: string): Observable<JSONLDObject> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<JSONLDObject>(`${this.prefix}/${encodeURIComponent(recordId)}/classes-with-individuals`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/data-property-hierarchies endpoint and retrieves a
     * HierarchyResponse object with the hierarchy of data properties in the ontology organized by the subPropertyOf 
     * property and with an index of each IRI and its parent IRIs.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<HierarchyResponse>} An Observable with a HierarchyResponse object containing the data 
     * property hierarchy and an index of IRIs to parent IRIs
     */
    getDataPropertyHierarchies(recordId: string, branchId: string, commitId: string): Observable<HierarchyResponse> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<HierarchyResponse>(`${this.prefix}/${encodeURIComponent(recordId)}/data-property-hierarchies`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/object-property-hierarchies endpoint and retrieves a Hierarchy 
     * Response object with the hierarchy of object properties in the ontology organized by the subPropertyOf property 
     * and with an index of each IRI and its parent IRIs.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<HierarchyResponse>} An Observable with a HierarchyResponse object containing the object 
     * property hierarchy and an index of IRIs to parent IRIs
     */
    getObjectPropertyHierarchies(recordId: string, branchId: string, commitId: string): Observable<HierarchyResponse> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<HierarchyResponse>(`${this.prefix}/${encodeURIComponent(recordId)}/object-property-hierarchies`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/annotation-property-hierarchies endpoint and retrieves a 
     * HierarchyResponse object with the hierarchy of annotation properties in the ontology organized by the 
     * subPropertyOf property and with an index of each IRI and its parent IRIs.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<HierarchyResponse>} An Observable with a HierarchyResponse object containing the annotation 
     * property hierarchy and an index of IRIs to parent IRIs
     */
    getAnnotationPropertyHierarchies(recordId: string, branchId: string, commitId: string): 
      Observable<HierarchyResponse> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<HierarchyResponse>(`${this.prefix}/${encodeURIComponent(recordId)}/annotation-property-hierarchies`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the POST /mobirest/ontologies/{recordId}/annotations endpoint and creates a new AnnotationProperty
     * in the ontology. If the annotation already exists in the provided list of annotation IRIs, returns a
     * rejected observable.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string[]} annotationIRIs A list of annotation IRI strings
     * @param {string} iri The IRI for the new AnnotationProperty
     * @return {Observable<JSONLDObject>} An Observable with the JSON-LD of the new AnnotationProperty if successful; 
     * otherwise rejects with an error message
     */
    createAnnotation(recordId: string, annotationIRIs: string[], iri: string): Observable<JSONLDObject> {
        const annotationJSON: JSONLDObject = {'@id': iri, '@type': [`${OWL}AnnotationProperty`]};
        if (indexOf(annotationIRIs, iri) === -1) {
            const params = { annotationjson: JSON.stringify(annotationJSON) };
            return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(recordId)}/annotations`, 
              null, {params: createHttpParams(params), observe: 'response'}))
                .pipe(
                    catchError(handleError),
                    map((response: HttpResponse<null>) => {
                        if (response.status === 200) {
                            return annotationJSON;
                        } else {
                            throw new Error(response.statusText || 'Something went wrong. Please try again later.');
                        }
                    })
                );
        } else {
            return throwError('This ontology already has an OWL Annotation declared with that IRI.');
        }
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/concept-hierarchies endpoint and retrieves a HierarchyResponse 
     * object with the hierarchy of concepts in the ontology organized by the broader and narrower properties and with
     * an index of each IRI and its parent IRIs.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<HierarchyResponse>} An Observable with a HierarchyResponse object containing the concept 
     * hierarchy and an index of IRIs to parent IRIs
     */
    getConceptHierarchies(recordId: string, branchId: string, commitId: string): Observable<HierarchyResponse> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<HierarchyResponse>(`${this.prefix}/${encodeURIComponent(recordId)}/concept-hierarchies`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/concept-scheme-hierarchies endpoint and retrieves a 
     * HierarchyResponse object with the hierarchy of concept schemes and concepts in the ontology organized by the 
     * inScheme, hasTopConcept, and topConceptOf properties and with an index of each IRI and its parent IRIs.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @return {Observable<HierarchyResponse>} An Observable with a HierarchyResponse object containing the concept 
     * hierarchy and an index of IRIs to parent IRIs
     */
    getConceptSchemeHierarchies(recordId: string, branchId: string, commitId: string): Observable<HierarchyResponse> {
        const params = { branchId, commitId };
        return this.spinnerSrv.track(this.http.get<HierarchyResponse>(`${this.prefix}/${encodeURIComponent(recordId)}/concept-scheme-hierarchies`, 
          {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/imported-ontologies endpoint which gets the list of
     * all ontologies imported by the ontology with the requested ontology ID.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} branchId The branch ID of the ontology you want to get from the repository.
     * @param {string} commitId The commit ID of the ontology you want to get from the repository.
     * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
     * @param {boolean} [applyInProgressCommit=false] Whether to apply the in-progress commit when getting imported ontologies
     * @returns {Observable<OntologyDocument[]} An Observable containing the list of ontologies that are imported by the requested ontology.
     */
    getImportedOntologies(recordId: string, branchId: string, commitId: string, rdfFormat = 'jsonld', 
      applyInProgressCommit = false): Observable<OntologyDocument[]> {
        const params = { rdfFormat, branchId, commitId, applyInProgressCommit };
        return this.http.get<OntologyDocument[]>(`${this.prefix}/${encodeURIComponent(recordId)}/imported-ontologies`, 
          { observe: 'response', params: createHttpParams(params)})
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<OntologyDocument[]>) => {
                    if (get(response, 'status') === 200) {
                        return response.body;
                    } else if (get(response, 'status') === 204) {
                        return [];
                    } else {
                        throw new Error(response.statusText || 'Something went wrong. Please try again later.');
                    }
                })
        );
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/entity-usages/{entityIRI} endpoint which gets the
     * JSON SPARQL query results for all statements which have the provided entityIRI as an object.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} branchId The branch ID of the ontology you want to get from the repository.
     * @param {string} commitId The commit ID of the ontology you want to get from the repository.
     * @param {string} entityIRI The entity IRI of the entity you want the usages for from the repository.
     * @param {string} queryType The type of query you want to perform (either 'select' or 'construct').
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable} An Observable containing the usages data, either as a JSON-LD array or JSON SPARQL query 
     *    results bindings.
     */
    getEntityUsages(recordId: string, branchId: string, commitId: string, entityIRI: string, queryType = 'select', 
      isTracked = false): Observable<JSONLDObject[] | SPARQLSelectBinding[]> {
        const params = { branchId, commitId, queryType };
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/entity-usages/${encodeURIComponent(entityIRI)}`;
        const request = this.http.get(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked)
            .pipe(
                catchError(handleError),
                map((response: JSONLDObject[] | SPARQLSelectResults) => {
                    if (queryType === 'construct') {
                        return response as JSONLDObject[];
                    } else {
                        return (response as SPARQLSelectResults).results.bindings;
                    }
                })
            );
    }
    /**
     * Calls the POST /mobirest/ontologies/{recordId}/entity-names endpoint and returns an object containing 
     * EntityNames.
     *
     * @param {string} recordId The record ID of the ontology to query.
     * @param {string} branchId The branch ID of the ontology to query.
     * @param {string} commitId The commit ID of the ontology to query.
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes.
     * @param {string[]} [filterResources = []] The list of resources to filter the entity names query by.
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<EntityNames>} An Observable containing EntityNames.
     */
    getOntologyEntityNames(recordId: string, branchId: string, commitId: string, includeImports = true, 
      applyInProgressCommit= true, filterResources = [], isTracked = false): Observable<EntityNames> {
        const params = { branchId, commitId, includeImports, applyInProgressCommit };
        let headers = new HttpHeaders();
        headers = headers.append('Content-Type', 'application/json');
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/entity-names`;
        const data = { filterResources };
        const request = this.http.post<EntityNames>(url, data, {params: createHttpParams(params), headers});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Gets the search results for literals that contain the requested search text.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} branchId The branch ID of the ontology you want to get from the repository.
     * @param {string} commitId The commit ID of the ontology you want to get from the repository.
     * @param {string} searchText The text that you are searching for in the ontology
     *  entity literal values.
     * @param {string} id The id to link this REST call to.
     * @returns {Observable} An Observable containing the SPARQL query results.
     */
    getSearchResults(recordId: string, branchId: string, commitId: string, searchText: string, isTracked = false): 
      Observable<{[key: string]: string[]}> {
        const defaultErrorMessage = 'An error has occurred with your search.';
        const params = { searchText, branchId, commitId };
        return this.spinnerSrv.trackedRequest(this.http.get(`${this.prefix}/${encodeURIComponent(recordId)}/search-results`, 
          {observe: 'response', params: createHttpParams(params)}), isTracked)
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<{[key: string]: string[]}>) => {
                    if (response.status === 200) {
                        return response.body;
                    } else if (response.status === 204) {
                        return {};
                    } else {
                        throw new Error(defaultErrorMessage);
                    }
                })
            );
    }
    /**
     * Get the results of the provided SPARQL query via a GET
     *
     * @param {string} recordId The record ID of the ontology to query.
     * @param {string} branchId The branch ID of the ontology to query.
     * @param {string} commitId The commit ID of the ontology to query.
     * @param {string} query The SPARQL query to run against the ontology.
     * @param {string} format The return format of the query results.
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=false] Whether to apply the in progress commit changes
     * @return {Observable} An Observable containing the SPARQL query results as either a JSON-LD array or a RDF
     *    formatted string for CONSTRUCT queries or {@link SPARQLSelectResults} for SELECT queries
     */
    getQueryResults(recordId: string, branchId: string, commitId: string, query: string, format: string, 
      includeImports = true, applyInProgressCommit = false, isTracked = false): 
      Observable<JSONLDObject[] | SPARQLSelectResults | string> {
        const params = {
            query,
            branchId,
            commitId,
            includeImports,
            applyInProgressCommit
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', this._getMimeType(format));
        return this.spinnerSrv.trackedRequest(this.http.get(`${this.prefix}/${encodeURIComponent(recordId)}/query`, {
            responseType: 'text',
            observe: 'response',
            headers,
            params: createHttpParams(params)
        }), isTracked).pipe(
            catchError(handleError),
            map((response: HttpResponse<string>) => {
                if (response.status === 204) {
                    return undefined;
                }
                const contentType = response.headers.get('Content-Type');
                if (contentType === 'application/json') {
                    return (JSON.parse(response.body)) as SPARQLSelectResults;
                } else if (contentType === 'application/ld+json') {
                    return (JSON.parse(response.body)) as JSONLDObject[];
                } else {
                    return response.body;
                }
            })
        );
    }
    /**
     * Get the results of the provided SPARQL query via a POST
     *
     * @param {string} recordId The record ID of the ontology to query.
     * @param {string} branchId The branch ID of the ontology to query.
     * @param {string} commitId The commit ID of the ontology to query.
     * @param {string} query The SPARQL query to run against the ontology.
     * @param {string} format The return format of the query results.
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=false] Whether to apply the in progress commit changes
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An Observable containing the SPARQL query results
     */
    postQueryResults(recordId: string, branchId: string, commitId: string, query: string, format: string, 
      includeImports = true, applyInProgressCommit = false, isTracked = false): Observable<JSONLDObject[] | SPARQLSelectResults | string> {
        const params = {
            branchId,
            commitId,
            includeImports,
            applyInProgressCommit
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', this._getMimeType(format));
        headers = headers.append('Content-Type', 'application/sparql-query');
        return this.spinnerSrv.trackedRequest(this.http.post(`${this.prefix}/${encodeURIComponent(recordId)}/query`, query, {
            responseType: 'text',
            observe: 'response',
            headers,
            params: createHttpParams(params)
        }), isTracked).pipe(
            catchError(handleError),
            map((response: HttpResponse<string>) => {
                if (response.status === 204) {
                    return undefined;
                }
                const contentType = response.headers.get('Content-Type');
                if (contentType === 'application/json') {
                    return (JSON.parse(response.body)) as SPARQLSelectResults;
                } else if (contentType === 'application/ld+json') {
                  return (JSON.parse(response.body)) as JSONLDObject[];
                } else {
                    return response.body;
                }
            })
        );
    }
    /**
     * Calls the POST /mobirest/ontologies/{recordId}/query endpoint with an Accept Header of application/octet-stream
     * which will start a download of the results of running the provided query in the specified file type with an
     * optional file name.
     *
     * @param {string} query The query to run
     * @param {string} fileType The type of file to download based on file extension
     * @param {string=''} fileName The optional name of the downloaded file
     * @param {string} recordId the Ontology Record ID
     * @param {string} commitId the Commit to run the query against
     * @param {boolean} applyInProgressCommit whether to apply the InProgressCommit to the results
     * @param {boolean} includeImports whether to include the imports closure in the results
     */
    downloadResultsPost(query: string, fileType: string, fileName = '', recordId = '', commitId = '', 
      applyInProgressCommit = true, includeImports = false): Observable<ArrayBuffer> {
        const params: {[key: string]: string | boolean} = {
            fileType,
            fileName,
            commitId,
            applyInProgressCommit,
            includeImports
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', 'application/octet-stream').append('Content-Type', 'application/sparql-query');

        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(recordId)}/query`, query, 
          {headers, params: createHttpParams(params), responseType: 'arraybuffer', observe: 'response'}))
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<ArrayBuffer>) => {
                    const file = new Blob([response.body], {
                        type: response.headers.get('Content-Type')
                    });
                    const fileURL = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = fileURL;
                    a.target = '_blank';
                    const respFilename = this._getFileName(response);
                    a.download = respFilename || fileName || 'untitled';
                    a.click(); //click the link "a"
                    return response.body;
                }));
    }

    private _getFileName(response: HttpResponse<ArrayBuffer>): string {
        try {
            const contentDisposition: string = response.headers.get('content-disposition');
            const matches = /filename=([^;]+)/ig.exec(contentDisposition);
            return ((matches || [''])[1]).trim();
        } catch (e) {
            return '';
        }
    }
    /**
     * Gets a list of imported ontology IRIs that failed to resolve.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} branchId The branch ID of the ontology you want to get from the repository.
     * @param {string} commitId The commit ID of the ontology you want to get from the repository.
     * @return {Observable<string[]>} An Observable containing the list of imported ontology IRIs that failed to 
     * resolve.
     */
    getFailedImports(recordId: string, branchId: string, commitId: string): Observable<string[]> {
        const params = { branchId, commitId };
        return this.http.get<string[]>(`${this.prefix}/${encodeURIComponent(recordId)}/failed-imports`, 
          {params: createHttpParams(params)})
            .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/ontologies/{recordId}/entities/{entityIRI} endpoint which gets the RDF of the entity with
     * the specified IRI along with all its linked blank nodes. Accepts the RDF format to return the RDF in, whether to
     * include imports, and whether to apply the in progress commit.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository
     * @param {string} branchId The branch ID of the ontology you want to get from the repository
     * @param {string} commitId The commit ID of the ontology you want to get from the repository
     * @param {string} entityId The entity IRI of the entity you want to retrieve
     * @param {string} [format='jsonld'] The RDF format to return the results in
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An Observable containing the RDF of the specified entity and its blank nodes
     */
    getEntityAndBlankNodes(recordId: string, branchId: string, commitId: string, entityId: string, format = 'jsonld',
        includeImports = true, applyInProgressCommit = true, isTracked = false): Observable<JSONLDObject[]> {
        const params = { branchId, commitId, format, includeImports, applyInProgressCommit };
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/entities/${encodeURIComponent(entityId)}`;
        const request = this.http.get<JSONLDObject[]>(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Checks if the provided entity is deprecated by looking for the owl:deprecated annotation.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @return {boolean} Returns true if the owl:deprecated value is "true" or "1", otherwise returns false.
     */
    isDeprecated(entity: JSONLDObject): boolean {
        const deprecated = getPropertyValue(entity, `${OWL}deprecated`);
        return deprecated === 'true' || deprecated === '1';
    }
    /**
     * Checks if the provided entity is an owl:Ontology entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:Ontology entity, otherwise returns false.
     */
    isOntology(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${OWL}Ontology`);
    }
    /**
     * Checks if the provided entity is an ontologyEditor:OntologyRecord entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an ontologyEditor:OntologyRecord entity, otherwise returns false.
     */
    isOntologyRecord(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${ONTOLOGYEDITOR}OntologyRecord`);
    }
    /**
     * Checks if the provided ontology contains an ontology entity. Returns a boolean.
     *
     * @param {JSONLDObject[]} ontology The ontology to search through.
     * @returns {boolean} Returns true if it finds an entity with @type owl:Ontology entity, otherwise returns
     * false.
     */
    hasOntologyEntity(ontology: JSONLDObject[]): boolean {
        return some(ontology, entity => this.isOntology(entity));
    }
    /**
     * Gets the ontology entity from the provided ontology. Returns a JSONLDObject.
     *
     * @param {JSONLDObject[]} ontology The ontology to search through.
     * @returns {JSONLDObject} Returns the ontology entity.
     */
    getOntologyEntity(ontology: JSONLDObject[]): JSONLDObject {
        return find(ontology, entity => this.isOntology(entity));
    }
    /**
     * Gets the ontology entity IRI from the provided ontology. Returns a string representing the ontology IRI.
     *
     * @param {JSONLDObject[]} ontology The ontology to search through.
     * @returns {string} Returns the ontology entity IRI.
     */
    getOntologyIRI(ontology: JSONLDObject[]): string {
        const entity = this.getOntologyEntity(ontology);
        return get(entity, '@id', '');
    }
    /**
     * Checks if the provided entity is an rdfs:Datatype. Returns a booelan.
     *
     * @param {JSONLDObject} entity The entity you want to check
     * @return {boolean} Returns true if it is an rdfs:Datatype entity, otherwise returns false.
    */
    isDatatype(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${RDFS}Datatype`);
    }
    /**
     * Checks if the provided entity is an owl:Class entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:Class entity, otherwise returns false.
     */
    isClass(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${OWL}Class`);
    }
    /**
     * Checks if the provided ontologies contain any owl:Class entities. Returns a boolean.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:Class entities in the ontologies, otherwise returns
     * false.
     */
    hasClasses(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont => some(ont, entity => this.isClass(entity) && !isBlankNode(entity)));
    }
    /**
     * Gets the list of all owl:Class entities within the provided ontologies that are not blank nodes. Returns
     * a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:Class entities within the ontologies.
     */
    getClasses(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isClass(entity) && !isBlankNode(entity));
    }

    /**
     * GET /mobirest/ontologies/{recordId}/group-query endpoint to retrieve the first 500 class Entities of
     * the ontology and the corresponding imports closure. Supports a search text to filter on entity labels.
     *
     * @param {string} recordId The identifier of the ontology you want to retrieve classes from
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {string} limit The limit of results that is set within the query
     * @param {string} searchText User given search text to filter classes on
     * @returns {Observable<GroupQueryResults>} An array of the first 100 owl:Class entities within the ontologies that match the search text.
     */
    retrieveClasses(recordId:string, branchId:string, commitId:string, limit:string, searchText = '', 
      isTracked = false): Observable<GroupQueryResults> {
        let query = 'PREFIX dc: <http://purl.org/dc/elements/1.1/>\n' +
            'PREFIX dcterms: <http://purl.org/dc/terms/>\n' +
            'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>\n' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n' +
            'PREFIX owl: <http://www.w3.org/2002/07/owl#>\n' +
            'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
            'SELECT ?id ?label ?description ?deprecated WHERE {\n' +
            '\t?id a owl:Class ;\n' +
            '  \tOptional { ?id rdfs:label | dcterms:title | dc:title | skos:prefLabel | skos:altlabel | skosxl:literalForm ?label. }\n' +
            '    Optional { ?id owl:deprecated ?deprecated. }\n' +
            '    Optional { ?id dcterms:description | dc:description ?description. }\n' +
            '  Filter (!isBlank(?id))\n' +
            '  Filter (contains(lcase(str(?id)), lcase("searchText")) || contains(lcase(str(?label)), lcase("searchText")))\n' +
            '} OrderBy(?label)';

        if (searchText) { 
            query = query.replace(/searchText/g, searchText);
        } else { 
            query = query.replace('  Filter (contains(lcase(str(?id)), lcase("searchText")) || contains(lcase(str(?label)), lcase("searchText")))\n', '');
        }

        const params = { query, branchId, commitId, limit };
        const request = this.http.get(`${this.prefix}/${encodeURIComponent(recordId)}/group-query`, 
          {params: createHttpParams(params), responseType: 'text', observe: 'response'})
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<string>) => {
                    return (JSON.parse(response.body)) as GroupQueryResults;
                    
                })
            );
        return this.spinnerSrv.trackedRequest(request, isTracked);
    }

    /**
     * Gets the list of all owl:Class entity IRIs within the provided ontologies that are not blank nodes.
     * Returns a string[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:Class entity IRI strings within the ontologies.
     */
    getClassIRIs(ontologies: JSONLDObject[][]): string[] {
        return this.getClasses(ontologies).map(clazz => clazz['@id']);
    }
    /**
     * Checks to see if the class within the provided ontologies has any properties associated it via the
     * rdfs:domain axiom. Returns a boolean indicating the existence of those properties.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string} classIRI The class IRI of the class you want to check about.
     * @returns {boolean} Returns true if it does have properties, otherwise returns false.
     */
    hasClassProperties(ontologies: JSONLDObject[][], classIRI: string): boolean {
        return some(ontologies, ont => some(ont, {[`${RDFS}domain`]: [{'@id': classIRI}]}));
    }
    /**
     * Gets the properties associated with the class within the provided ontologies by the rdfs:domain axiom.
     * Returns an array of all the properties associated with the provided class IRI.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string} classIRI The class IRI of the class you want to check about.
     * @returns {JSONLDObject[]} Returns an array of all the properties associated with the provided class IRI.
     */
    getClassProperties(ontologies: JSONLDObject[][], classIRI: string): JSONLDObject[] {
        return this._collectThings(ontologies, entity => isMatch(entity, {[`${RDFS}domain`]: [{'@id': classIRI}]}));
    }
    /**
     * Gets the property IRIs associated with the class within the provided ontologies by the rdfs:domain axiom.
     * Returns an array of all the property IRIs associated with the provided class IRI.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string} classIRI The class IRI of the class you want to check about.
     * @returns {string[]} Returns an array of all the property IRIs associated with the provided class IRI.
     */
    getClassPropertyIRIs(ontologies: JSONLDObject[][], classIRI: string): string[] {
        return this.getClassProperties(ontologies, classIRI).map(prop => prop['@id']);
    }
    /**
     * Checks if the provided entity is an owl:ObjectProperty entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:ObjectProperty entity, otherwise returns false.
     */
    isObjectProperty(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${OWL}ObjectProperty`);
    }
    /**
     * Checks if the provided ontologies contain any owl:ObjectProperty entities. Returns a boolean.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:ObjectProperty entities in the ontologies, otherwise
     * returns false.
     */
    hasObjectProperties(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont => some(ont, entity => this.isObjectProperty(entity) && !isBlankNode(entity)));
    }
    /**
     * Gets the list of all owl:ObjectProperty entities within the provided ontologies that are not blank nodes.
     * Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:ObjectProperty entities within the ontologies.
     */
    getObjectProperties(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isObjectProperty(entity) && !isBlankNode(entity));
    }
    /**
     * Gets the list of all owl:ObjectProperty entity IRIs within the provided ontologies that are not blank
     * nodes. Returns a string[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:ObjectProperty entity IRI strings within the ontologies.
     */
    getObjectPropertyIRIs(ontologies: JSONLDObject[][]): string[] {
        return this.getObjectProperties(ontologies).map(prop => prop['@id']);
    }
    /**
     * Checks if the provided entity is an owl:DatatypeProperty entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:DatatypeProperty entity, otherwise returns false.
     */
    isDataTypeProperty(entity: JSONLDObject): boolean {
        const types = get(entity, '@type', []);
        return includes(types, `${OWL}DatatypeProperty`)
            || includes(types, `${OWL}DataTypeProperty`);
    }
    /**
     * Checks if the provided ontologies contain any owl:DatatypeProperty entities. Returns a boolean.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:DatatypeProperty entities in the ontologies,
     * otherwise returns false.
     */
    hasDataTypeProperties(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont => some(ont, entity => this.isDataTypeProperty(entity)));
    }
    /**
     * Gets the list of all owl:DatatypeProperty entities within the provided ontologies that are not blank
     * nodes. Returns an JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:DatatypeProperty entities within the ontologies.
     */
    getDataTypeProperties(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isDataTypeProperty(entity) && !isBlankNode(entity));
    }
    /**
     * Gets the list of all owl:DatatypeProperty entity IRIs within the provided ontologies that are not blank
     * nodes. Returns an string[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:DatatypeProperty entity IRI strings within the ontologies.
     */
    getDataTypePropertyIRIs(ontologies: JSONLDObject[][]): string[] {
        return this.getDataTypeProperties(ontologies).map(prop => prop['@id']);
    }
    /**
     * Checks if the provided entity is an owl:DatatypeProperty or owl:ObjectProperty entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:DatatypeProperty or owl:ObjectProperty entity, otherwise
     * returns false.
     */
    isProperty(entity: JSONLDObject): boolean {
        return this.isObjectProperty(entity) || this.isDataTypeProperty(entity);
    }
    /**
     * Checks if the provided ontologies have any properties that are not associated with a class by the
     * rdfs:domain axiom. Return a boolean indicating if any such properties exist.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if it contains properties without an rdfs:domain set, otherwise returns
     * false.
     */
    hasNoDomainProperties(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont =>
                    some(ont, entity => this.isProperty(entity) && !has(entity, `${RDFS}domain`)));
    }
    /**
     * Gets the list of properties that are not associated with a class by the rdfs:domain axiom. Returns an
     * array of the properties not associated with a class.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} Returns an array of properties not associated with a class.
     */
    getNoDomainProperties(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isProperty(entity) && !has(entity, `${RDFS}domain`));
    }
    /**
     * Gets the list of property IRIs that are not associated with a class by the rdfs:domain axiom. Returns an
     * array of the property IRIs not associated with a class.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {string[]} Returns an array of property IRIs not associated with a class.
     */
    getNoDomainPropertyIRIs(ontologies: JSONLDObject[][]): string[] {
        return this.getNoDomainProperties(ontologies).map(prop => prop['@id']);
    }
    /**
     * Checks if the provided entity is an owl:AnnotationProperty entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:AnnotationProperty entity, otherwise returns false.
     */
    isAnnotation(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${OWL}AnnotationProperty`);
    }
    /**
     * Checks if the provided ontologies contain any owl:AnnotationProperty entities. Returns a boolean.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:AnnotationProperty entities in the ontologies,
     * otherwise returns false.
     */
    hasAnnotations(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont =>
                    some(ont, entity => this.isAnnotation(entity) && !isBlankNode(entity)));
    }
    /**
     * Gets the list of all owl:AnnotationProperty entities within the provided ontologies. Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:AnnotationProperty entities within the ontologies.
     */
    getAnnotations(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isAnnotation(entity) && !isBlankNode(entity));
    }
    /**
     * Gets the list of all owl:AnnotationProperty entity IRIs within the provided ontologies that are not blank
     * nodes. Returns an string[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:AnnotationProperty entity IRI strings within the ontologies.
     */
    getAnnotationIRIs(ontologies: JSONLDObject[][]): string[] {
        return this.getAnnotations(ontologies).map(prop => prop['@id']);
    }
    /**
     * Checks if the provided entity is an owl:NamedIndividual entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:NamedIndividual entity, otherwise returns false.
     */
    isNamedIndividual(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${OWL}NamedIndividual`);
    }
    /**
     * Checks if the provided entity is an individual (i.e. not a standard owl: type). Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an individual, otherwise returns false.
     */
    isIndividual(entity: JSONLDObject): boolean {
        return intersection(get(entity, '@type', []), [
            `${OWL}Class`,
            `${OWL}DatatypeProperty`,
            `${OWL}ObjectProperty`,
            `${OWL}AnnotationProperty`,
            `${OWL}Datatype`,
            `${OWL}Ontology`
        ]).length === 0;
    }
    /**
     * Checks to see if the ontologies have individuals. Returns a boolean indicating the existence of those
     * individuals.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
     */
    hasIndividuals(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont => some(ont, entity => this.isIndividual(entity)));
    }
    /**
     * Gets the list of all owl:NamedIndividual entities within the provided ontologies. Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:NamedIndividual entities within the ontologies.
     */
    getIndividuals(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isIndividual(entity));
    }
    /**
     * Checks to see if the ontologies have individuals with no other type. Returns a boolean indicating the
     * existence of those individuals.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if it does have individuals with no other type, otherwise returns false.
     */
    hasNoTypeIndividuals(ontologies: JSONLDObject[][]): boolean {
        return some(ontologies, ont =>
                    some(ont, entity => this.isIndividual(entity) && entity['@type'].length === 1));
    }
    /**
     * Gets the list of all owl:NamedIndividual entities within the provided ontologies that have no other type.
     * Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:NamedIndividual entities with no other type within the ontologies.
     */
    getNoTypeIndividuals(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isIndividual(entity) && entity['@type'].length === 1);
    }
    /**
     * Checks to see if the class within the provided ontologies have individuals with that type. Returns a
     * boolean indicating the existence of those individuals.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string} classIRI The class IRI of the class you want to check about.
     * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
     */
    hasClassIndividuals(ontologies: JSONLDObject[][], classIRI: string): boolean {
        return some(this.getIndividuals(ontologies), {'@type': [classIRI]});
    }
    /**
     * Gets the individuals associated with the class within the provided ontologies by the type. Returns an
     * array of all the properties associated with the provided class IRI.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string} classIRI The class IRI of the class you want to check about.
     * @returns {JSONLDObject[]} Returns an array of all the individuals associated with the provided class IRI.
     */
    getClassIndividuals(ontologies: JSONLDObject[][], classIRI: string): JSONLDObject[] {
        return filter(this.getIndividuals(ontologies), {'@type': [classIRI]});
    }
    /**
     * Checks if the provided entity is an owl:Restriction. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:Restriction entity, otherwise returns false.
     */
    isRestriction(entity: JSONLDObject): boolean {
        return includes(get(entity, '@type', []), `${OWL}Restriction`);
    }
    /**
     * Gets the list of all owl:Restriction entities within the provided ontologies. Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:Restriction entities within the ontologies.
     */
    getRestrictions(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isRestriction(entity));
    }
    /**
     * Gets the list of all entities within the provided ontologies that are blank nodes. Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @returns {JSONLDObject[]} An array of all owl:Restriction entities within the ontologies.
     */
    getBlankNodes(ontologies: JSONLDObject[][]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => isBlankNode(entity));
    }
    /**
     * Gets entity with the provided IRI from the provided ontologies in the Mobi repository. Returns the
     * entity Object.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string} entityIRI The IRI of the entity that you want.
     * @returns {Object} An Object which represents the requested entity.
     */
    getEntity(ontologies: JSONLDObject[][], entityIRI: string): JSONLDObject {
        let retValue;
        forEach(ontologies, ont => {
            retValue = find(ont, {'@id': entityIRI});
            if (retValue !== null) {
                return false; //This breaks the loop. It is NOT the entire function's return value!
            }
        });
        return retValue;
    }
    /**
     * Gets the provided entity's name. This name is either the `rdfs:label`, `dcterms:title`, or `dc:title`.
     * If none of those annotations exist, it returns the beautified `@id`. Prioritizes english language tagged
     * values over the others. Returns a string for the entity name.
     *
     * @param {JSONLDObject} entity The entity you want the name of.
     * @returns {string} The beautified IRI string.
     */
    getEntityName(entity: JSONLDObject): string {
        return getEntityName(entity);
    }
    /**
     * Gets the provided entity's names. These names are an array of the '@value' values for the entityNameProps.
     *
     * @param {JSONLDObject} entity The entity you want the names of.
     * @returns {string[]} The names for the entityNameProps.
     */
    getEntityNames(entity: JSONLDObject): string[] {
        let names = [];
        forEach(this.entityNameProps, prop => {
            if (has(entity, prop)) {
                names = concat(names, (get(entity, prop, []).map(val => val['@value'])));
            } 
        });
        return uniq(names);
    }
    /**
     * Gets the provided entity's description. This description is either the `rdfs:comment`,
     * `dcterms:description`, or `dc:description`. If none of those annotations exist, it returns undefined.
     *
     * @param {JSONLDObject} entity The entity you want the description of.
     * @returns {string} The entity's description text.
     */
    getEntityDescription(entity: JSONLDObject): string {
        return getPropertyValue(entity, `${RDFS}comment`)
            || getDctermsValue(entity, 'description')
            || getPropertyValue(entity, `${DC}description`);
    }
    /**
     * Checks if the provided entity is an skos:Concept entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {boolean} Returns true if it is an skos:Concept entity, otherwise returns false.
     */
    isConcept(entity: JSONLDObject, derivedConcepts: string[] = []): boolean {
            return (includes(get(entity, '@type', []), `${SKOS}Concept`)
                || intersection(get(entity, '@type', []), derivedConcepts).length > 0);
    }
    /**
     * Checks if the provided ontologies contain any skos:Concept entities. Returns a boolean.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {boolean} Returns true if there are any skos:Concept entities in the ontologies, otherwise
     * returns false.
     */
    hasConcepts(ontologies: JSONLDObject[][], derivedConcepts: string[]): boolean {
        return some(ontologies, ont =>
                    some(ont, entity => this.isConcept(entity, derivedConcepts) && !isBlankNode(entity)));
    }
    /**
     * Gets the list of all skos:Concept entities within the provided ontologies that are not blank nodes.
     * Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {JSONLDObject[]} An array of all skos:Concept entities within the ontologies.
     */
    getConcepts(ontologies: JSONLDObject[][], derivedConcepts: string[]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isConcept(entity, derivedConcepts) 
            && !isBlankNode(entity));
    }
    /**
     * Gets the list of all skos:Concept entity IRIs within the provided ontologies that are not blank nodes.
     * Returns an string[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {string[]} An array of all skos:Concept entity IRI strings within the ontologies.
     */
    getConceptIRIs(ontologies: JSONLDObject[][], derivedConcepts: string[]): string[] {
        return this.getConcepts(ontologies, derivedConcepts).map(obj => obj['@id']);
    }
    /**
     * Checks if the provided entity is an skos:ConceptScheme entity. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {boolean} Returns true if it is an skos:ConceptScheme entity, otherwise returns false.
     */
    isConceptScheme(entity: JSONLDObject, derivedConceptSchemes: string[] = []): boolean {
            return (includes(get(entity, '@type', []), `${SKOS}ConceptScheme`)
                || intersection(get(entity, '@type', []), derivedConceptSchemes).length > 0);
    }
    /**
     * Checks if the provided ontologies contain any skos:ConceptScheme entities. Returns a boolean.
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {boolean} Returns true if there are any skos:ConceptScheme entities in the ontologies, otherwise
     * returns false.
     */
    hasConceptSchemes(ontologies: JSONLDObject[][], derivedConceptSchemes: string[]): boolean {
        return some(ontologies, ont =>
                    some(ont, entity => this.isConceptScheme(entity, derivedConceptSchemes) && !isBlankNode(entity)));
    }
    /**
     * Gets the list of all skos:ConceptScheme entities within the provided ontologies that are not blank nodes.
     * Returns a JSONLDObject[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {JSONLDObject[]} An array of all skos:ConceptScheme entities within the ontologies.
     */
    getConceptSchemes(ontologies: JSONLDObject[][], derivedConceptSchemes: string[]): JSONLDObject[] {
        return this._collectThings(ontologies, entity => this.isConceptScheme(entity, derivedConceptSchemes) 
            && !isBlankNode(entity));
    }
    /**
     * Gets the list of all skos:ConceptScheme entity IRIs within the provided ontologies that are not blank
     * nodes. Returns a string[].
     *
     * @param {JSONLDObject[][]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {string[]} An array of all skos:ConceptScheme entity IRI strings within the ontology.
     */
    getConceptSchemeIRIs(ontologies: JSONLDObject[][], derivedConceptSchemes: string[]): string[] {
        return this.getConceptSchemes(ontologies, derivedConceptSchemes).map(obj => obj['@id']);
    }
    /**
     * Compressing a file before uploading.
     * 
     * @param {File} file The ontology file.
     * @returns {Observable<File>} compressed file
     */
    compressFile(file: File): Observable<File> {
        const reader = new FileReader();
        const zip: JSZip = new (<any>JSZip).default();
        if (file && file.size) {
            reader.readAsArrayBuffer(file); 
        } else {
            of(file);
        }
        return from(new Promise<File>((resolve, reject) => {
            reader.onload = (evt) => {
                try {
                    zip.file(file.name, evt.target.result);
                    zip.generateAsync({type: 'blob', compression: 'DEFLATE'})
                        .then((content) => {
                            const fl = new File([content], `${file.name}.zip`);
                            resolve(fl);
                        });
                } catch (error) {
                    reject(error);
                }
            };
        }));
    }

    /**
     * Retrieves the possible values of a specified object property for a given record, branch, and property IRI.
     *
     * @param {string} recordId - The IRI of the record.
     * @param {string} branchId - The IRI of the branch.
     * @param {string} propertyIri - The IRI of the object property.
     * @param {boolean} isTracked - Indicates whether to track the request using a spinner service.
     *
     * @returns {Observable<JSONLDObject>} - An observable emitting the JSONLDObject containing the values of the object property.
     */
    getObjectPropertyValues(recordId: string, branchId: string, propertyIri: string,
                            isTracked = false): Observable<SPARQLSelectResults> {
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/query`;
        const valuesQuery = OBJ_PROPERTY_VALUES_QUERY.replace('%PROPIRI%', propertyIri);
        const params = createHttpParams({
            applyInProgressCommit: true,
            branchId: branchId,
            query: valuesQuery
        });

        const request = this.http.get<SPARQLSelectResults>(url, {params});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }

    private _getFileTitleInfo(title) {
        const fileName = title.toLowerCase().split('.');
        return {
            title: title.toLowerCase(),
            name: fileName.slice(0,1)[0],
            ext: fileName.slice(-1)[0]
        };
    }

    private _collectThings(ontologies, filterFunc) {
        const things = [];
        const iris = [];
        forEach(ontologies, ont => {
            forEach(filter(ont, entity => !includes(iris, get(entity, '@id')) && filterFunc(entity)), entity => {
                things.push(entity);
                iris.push(get(entity, '@id'));
            });
        });
        return things;
    }

    private _getMimeType(format: string): string {
        if (format === 'turtle') {
            return 'text/turtle';
        } else if (format === 'jsonld') {
            return 'application/ld+json';
        } else if (format === 'rdf/xml') {
            return 'application/rdf+xml';
        } else if (format === 'application/json') {
            return 'application/json';
        } else {
            console.error(`${format} is not a valid rdf mime type. Changing to application/ld+json.`);
            return 'application/ld+json';
        }
    }
}
