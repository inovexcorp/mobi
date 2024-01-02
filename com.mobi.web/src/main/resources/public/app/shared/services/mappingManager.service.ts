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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    forEach,
    get,
    includes} from 'lodash';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { CamelCasePipe } from '../pipes/camelCase.pipe';
import { DELIM, MAPPINGS } from '../../prefixes';
import { Mapping } from '../models/mapping.class';
import { RecordConfig } from '../models/recordConfig.interface';
import { createHttpParams, handleError } from '../utility';

/**
 * @class shared:MappingManagerService
 *
 * A service that provides access to the Mobi mapping REST endpoints and utility functions for editing/creating mapping
 * arrays and accessing various aspects of mapping arrays.
 */
@Injectable()
export class MappingManagerService {
    prefix = `${REST_PREFIX}mappings`;

    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService, 
        private camelCase: CamelCasePipe) {}

    // REST calls
    /**
     * Calls the POST /mobirest/mappings endpoint which uploads a mapping to the Mobi
     * repository with a generated IRI. Returns An observable with the IRI of the newly uploaded
     * mapping.
     *
     * @param {RecordConfig} mapping The configuration for a new mapping
     * @returns {Observable<string>} An observable with the IRI of the uploaded mapping
     */
    upload(config: RecordConfig, jsonld: JSONLDObject[]): Observable<string> {
        const fd = new FormData();
        fd.append('title', config.title);
        if (config.description) {
            fd.append('description', config.description);
        }
        forEach(config.keywords, keyword => fd.append('keywords', keyword));
        fd.append('jsonld', JSON.stringify(jsonld));
        return this.spinnerSvc.track(this.http.post(this.prefix, fd, {responseType: 'text'}))
           .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/mappings/{mappingName} endpoint which returns the JSONL-LD
     * of a saved mapping. Returns An observable with "@graph" of the mapping.
     *
     * @param {string} mappingId The IRI for the mapping
     * @returns {Observable<JSONLDObject[]>} An observable with the JSON-LD of the uploaded mapping
     */
    getMapping(mappingId: string): Observable<JSONLDObject[]> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(`${this.prefix}/${encodeURIComponent(mappingId)}`))
           .pipe(catchError(handleError));
    }
    /**
     * Calls the GET /mobirest/mappings/{mappingName} endpoint using the `window.location` function
     * which will start a download of the JSON-LD of a saved mapping.
     *
     * @param {string} mappingId The IRI for the mapping
     * @param {string} format the RDF serialization to retrieve the mapping in
     */
    downloadMapping(mappingId: string, format = 'jsonld'): void {
        const params = createHttpParams({
            format: format || 'jsonld'
        });
        window.open(`${this.prefix}/${encodeURIComponent(mappingId)}?${params.toString()}`);
    }
    /**
     * Calls the DELETE /mobirest/mappings/{mappingName} endpoint which deleted the specified
     * mapping from the Mobi repository. Returns An observable with the success of the deletion.
     *
     * @param {string} mappingId The IRI for the mapping
     * @returns {Observable<string>} An observable resolves if the deletion succeeded; rejects otherwise
     */
    deleteMapping(mappingId: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.prefix}/${encodeURIComponent(mappingId)}`))
           .pipe(catchError(handleError), map(() => {}));
    }

    // Edit mapping methods
    /**
     * Creates a mapping id from the display (local) name of a mapping.
     *
     * @param {string} mappingName The display (local) name of a mapping
     * @returns {string} A mapping id made from the display (local) name of a mapping
     */
    getMappingId(mappingTitle: string): string {
        return MAPPINGS + this.camelCase.transform(mappingTitle, 'class');
    }
    /**
     * Edits the IRI template of a class mapping specified by id in a mapping. Sets the `hasPrefix` and `localName`
     * properties of the class mapping.
     *
     * @param {Mapping} mapping The mapping JSON-LD array
     * @param {string} classMappingId The id of the class mapping whose IRI template will be edited
     * @param {string} prefix The new end of the prefix
     * @param {string} localNamePattern The new local name pattern. Must be in the following format: `${index/UUID}`
     */
    editIriTemplate(mapping: Mapping, classMappingId: string, prefix: string, localNamePattern: string): void {
        // Check if class mapping exists in mapping
        const classMapping = mapping.getClassMapping(classMappingId);
        if (classMapping) {
            classMapping[`${DELIM}hasPrefix`] = [{'@value': prefix}];
            classMapping[`${DELIM}localName`] = [{'@value': localNamePattern}];
        }
    }

    // Public helper methods
    /**
     * Tests whether the passed mapping entity is a class mapping.
     *
     * @param {JSONLDObject} entity A mapping entity
     * @returns {boolean} A boolean indicating whether the entity is a class mapping
     */
    isClassMapping(entity: JSONLDObject): boolean {
        return this._isType(entity, 'ClassMapping');
    }
    /**
     * Tests whether the passed mapping entity is a property mapping.
     *
     * @param {JSONLDObject} entity A mapping entity
     * @returns {boolean} A boolean indicating whether the entity is a property mapping
     */
    isPropertyMapping(entity: JSONLDObject): boolean {
        return this._isType(entity, 'PropertyMapping');
    }
    /**
     * Tests whether the passed mapping entity is an object property mapping.
     *
     * @param {JSONLDObject} entity A mapping entity
     * @returns {boolean} A boolean indicating whether the entity is an object property mapping
     */
    isObjectMapping(entity: JSONLDObject): boolean {
        return this._isType(entity, 'ObjectMapping');
    }
    /**
     * Tests whether the passed mapping entity is a data property mapping.
     *
     * @param {JSONLDObject} entity A mapping entity
     * @returns {boolean} A boolean indicating whether the entity is a data property mapping
     */
    isDataMapping(entity: JSONLDObject): boolean {
        return this._isType(entity, 'DataMapping');
    }
    /**
     * Creates a title for a property mapping using the passed class and property names.
     *
     * @param {string} className The name of the containing class
     * @param {string} propName The name of the property
     * @returns {string} A standardized title for a property mapping
     */
    getPropMappingTitle(className: string, propName: string): string {
        return `${className}: ${propName}`;
    }

    private _isType(entity: JSONLDObject, type: string): boolean {
        return includes(get(entity, '[\'@type\']'), DELIM + type);
    }
}
