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
import { formatDate } from '@angular/common';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { get, isArray, isEqual, unionWith, forEach, has, find, forOwn, replace, set, some, remove, isString } from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { v4 } from 'uuid';

import { REGEX } from '../../constants';
import { DCTERMS, RDF, XSD } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { CommitChange } from '../models/commitChange.interface';
import { ErrorResponse } from '../models/errorResponse.interface';
import { JSONLDId } from '../models/JSONLDId.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { JSONLDValue } from '../models/JSONLDValue.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { BeautifyPipe } from '../pipes/beautify.pipe';
import { SplitIRIPipe } from '../pipes/splitIRI.pipe';

/**
 * @class shared.UtilService
 *
 * `utilService` is a service that provides various utility methods for use across Mobi.
 */
@Injectable()
export class UtilService {
    constructor(private toastr: ToastrService, private beautify: BeautifyPipe, private splitIRI: SplitIRIPipe, 
        private spinnerSrv: ProgressSpinnerService) {}

    /**
     * Checks if the provided entity is blank node. Returns a boolean.
     *
     * @param {JSONLDObject} entity The entity you want to check.
     * @returns {boolean} Returns true if it is a blank node entity, otherwise returns false.
     */
     isBlankNode(entity: JSONLDObject): boolean {
        return this.isBlankNodeId(get(entity, '@id', ''));
    }
    /**
     * Checks if the provided entity id is a blank node id. Returns a boolean.
     *
     * @param {string} id The id to check.
     * @return {boolean} Returns true if the id is a blank node id, otherwise returns false.
     */
    isBlankNodeId(id: string): boolean {
        return isString(id) && (id.includes('/.well-known/genid/') || id.includes('_:genid') || id.includes('_:b'));
    }
    /**
     * Gets the "beautified" IRI representation for the iri passed. Returns the modified IRI.
     *
     * @param {string} iri The IRI string that you want to beautify.
     * @returns {string} The beautified IRI string.
     */
    getBeautifulIRI(iri: string): string {
        const splitEnd = this.splitIRI.transform(iri).end;
        if (splitEnd) {
            return splitEnd.match(REGEX.UUID) ? splitEnd : this.beautify.transform(splitEnd);
        }
        return iri;
    }
    /**
     * Gets the first value of the specified property from the passed entity. Returns an empty
     * string if not found.
     *
     * @param {JSONLDObject} entity The entity to retrieve the property value from
     * @param {string} propertyIRI The IRI of a property
     * @return {string} The first value of the property if found; empty string otherwise
     */
    getPropertyValue(entity: JSONLDObject, propertyIRI: string): string {
        return get(entity, `['${propertyIRI}'][0]['@value']`, '');
    }
    /**
     * Sets the first or appends to the existing value of the specified property of the passed entity to the
     * passed value.
     *
     * @param {JSONLDObject} entity The entity to set the property value of
     * @param {string} propertyIRI The IRI of a property
     * @param {string} value The new value for the property
     */
    setPropertyValue(entity: JSONLDObject, propertyIRI: string, value): void {
        this._setValue(entity, propertyIRI, {'@value': value});
    }
    /**
     * Tests whether or not the passed entity contains the passed value for the passed property.
     *
     * @param {JSONLDObject} entity The entity to look for the property value in
     * @param {string} propertyIRI The IRI of a property
     * @param {string} value The value to search for
     * @return {boolean} True if the entity has the property value; false otherwise
     */
    hasPropertyValue(entity: JSONLDObject, propertyIRI: string, value): boolean {
        return this._hasValue(entity, propertyIRI, {'@value': value});
    }
    /**
     * Remove the passed value of the passed property from the passed entity.
     *
     * @param {JSONLDObject} entity The entity to remove the property value from
     * @param {string} propertyIRI The IRI of a property
     * @param {string} value The value to remove
     */
    removePropertyValue(entity: JSONLDObject, propertyIRI: string, value): void {
        this._removeValue(entity, propertyIRI, {'@value': value});
    }
    /**
     * Remove the passed valueToRemove value of the property from the passed entity and replace with
     * the provided valueToAdd value.
     *
     * @param {JSONLDObject} entity The entity to remove the property id value from
     * @param {string} propertyIRI The IRI of a property
     * @param {string} valueToRemove The value to remove
     * @param {string} valueToAdd The value to Add
     */
    replacePropertyValue(entity: JSONLDObject, propertyIRI: string, valueToRemove: string, valueToAdd: string): void {
        this.removePropertyValue(entity, propertyIRI, valueToRemove);
        this.setPropertyValue(entity, propertyIRI, valueToAdd);
    }
    /**
     * Gets the first id value of the specified property from the passed entity. Returns an empty
     * string if not found.
     *
     * @param {JSONLDObject} entity The entity to retrieve the property id value from
     * @param {string} propertyIRI The IRI of a property
     * @return {string} The first id value of the property if found; empty string otherwise
     */
    getPropertyId(entity: JSONLDObject, propertyIRI: string): string {
        return get(entity, `['${propertyIRI}'][0]['@id']`, '');
    }
    /**
     * Sets the first or appends to the existing id of the specified property of the passed entity to the passed
     * id.
     *
     * @param {JSONLDObject} entity The entity to set the property value of
     * @param {string} propertyIRI The IRI of a property
     * @param {string} id The new id value for the property
     */
    setPropertyId(entity: JSONLDObject, propertyIRI: string, id): void {
        this._setValue(entity, propertyIRI, {'@id': id});
    }
    /**
     * Tests whether or not the passed entity contains the passed id value for the passed property.
     *
     * @param {JSONLDObject} entity The entity to look for the property id value in
     * @param {string} propertyIRI The IRI of a property
     * @param {string} id The id value to search for
     * @return {boolean} True if the entity has the property id value; false otherwise
     */
    hasPropertyId(entity: JSONLDObject, propertyIRI: string, id: string): boolean {
        return this._hasValue(entity, propertyIRI, {'@id': id});
    }
    /**
     * Remove the passed id value of the passed property from the passed entity.
     *
     * @param {JSONLDObject} entity The entity to remove the property id value from
     * @param {string} propertyIRI The IRI of a property
     * @param {string} id The id value to remove
     */
    removePropertyId(entity: JSONLDObject, propertyIRI: string, id: string): void {
        this._removeValue(entity, propertyIRI, {'@id': id});
    }
    /**
     * Remove the passed idToRemove value of the passed property from the passed entity and replace with
     * the provided idToAdd value.
     *
     * @param {JSONLDObject} entity The entity to remove the property id value from
     * @param {string} propertyIRI The IRI of a property
     * @param {string} idToRemove The id value to remove
     * @param {string} idToAdd The id value to Add
     */
    replacePropertyId(entity: JSONLDObject, propertyIRI: string, idToRemove, idToAdd): void {
        this.removePropertyId(entity, propertyIRI, idToRemove);
        this.setPropertyId(entity, propertyIRI, idToAdd);
    }
    /**
     * Gets the first value of the specified dcterms property from the passed entity. Returns an empty
     * string if not found.
     *
     * @param {JSONLDObject} entity The entity to retrieve the property value from
     * @param {string} property The local name of a dcterms property IRI
     * @return {string} The first value of the dcterms property if found; empty string otherwise
     */
    getDctermsValue(entity: JSONLDObject, property: string): string {
        return this.getPropertyValue(entity, DCTERMS + property);
    }
    /**
     * Remove the passed value of the specified dcterms property from the passed entity.
     *
     * @param {JSONLDObject} entity The entity to remove the property value from
     * @param {string} property The local name of a dcterms property IRI
     * @param {string} value The value to remove
     */
    removeDctermsValue(entity: JSONLDObject, property: string, value: string): void {
        this.removePropertyValue(entity, DCTERMS + property, value);
    }
    /**
     * Sets the first value or appends to the values of the specified dcterms property of the passed entity
     * with the passed value.
     *
     * @param {JSONLDObject} entity The entity to set the property value of
     * @param {string} property The local name of a dcterms property IRI
     * @param {string} value The new value for the property
     */
    setDctermsValue(entity: JSONLDObject, property: string, value: string): void {
        this.setPropertyValue(entity, DCTERMS + property, value);
    }
    /**
     * Removes the first value of the specified dcterms property and appends the provided value to the specified
     * dcterms property of the passed entity
     *
     * @param {JSONLDObject} entity The entity to update the property value of
     * @param {string} property The local name of a dcterms property IRI
     * @param {string} value The new value for the property
     */
    updateDctermsValue(entity: JSONLDObject, property: string, value: string): void {
        const valueToRemove = this.getPropertyValue(entity, DCTERMS + property);
        this.replacePropertyValue(entity, DCTERMS + property, valueToRemove, value);
    }
    /**
     * Merges two arrays together using the Lodash isEqual function and returns the merged
     * array.
     *
     * @param {*[]} objValue An array to be merged into
     * @param {*[]} srcValue An array
     * @return {*[]} The result of merging the two arrays using Lodash's isEqual
     */
    mergingArrays(objValue: any[], srcValue: any[]): any[] {
        if (isArray(objValue)) {
            return unionWith(objValue, srcValue, isEqual);
        }
    }
    /**
     * Gets the first id value of the specified dcterms property from the passed entity. Returns an
     * empty string if not found.
     *
     * @param {JSONLDObject} entity The entity to retrieve the property id value from
     * @param {string} property The local name of a dcterms property IRI
     * @return {string} The first id value of the dcterms property if found; empty string otherwise
     */
    getDctermsId(entity: JSONLDObject, property: string): string {
        return get(entity, `['${DCTERMS + property}'][0]['@id']`, '');
    }
    /**
     * Creates an error toast with the passed error text that will disappear after 3 seconds
     *
     * @param {string} text The text for the body of the error toast
     */
    createErrorToast(text: string, config = {timeOut: 3000}): void {
        this.toastr.error(text, 'Error', config);
    }
    /**
     * Creates a success toast with the passed success text that will disappear after 3 seconds
     *
     * @param {string} text The text for the body of the success toast
     */
    createSuccessToast(text: string, config = {timeOut: 3000}): void {
        this.toastr.success(text, 'Success', config);
    }
    /**
     * Creates a warning toast with the passed success text that will disappear after 3 seconds
     *
     * @param {string} text The text for the body of the warning toast
     * @param {Object} config The configuration for the toast. Defaults to a timeout of 3 seconds
     */
    createWarningToast(text: string, config = {timeOut: 3000}): void {
        this.toastr.warning(text, 'Warning', config);
    }
    /**
     * Close open toastr
     */
    clearToast(): void {
        this.toastr.clear();
    }
    /**
     * Gets the namespace of an IRI string.
     *
     * @param {string} iri An IRI string.
     * @return {string} The namespace of the IRI
     */
    getIRINamespace(iri: string): string {
        const split = this.splitIRI.transform(iri);
        return split.begin + split.then;
    }
    /**
     * Gets the namespace of an IRI string.
     *
     * @param {string} iri An IRI string
     * @return {string} The namespace of the IRI
     */
    getIRILocalName(iri: string): string {
        return this.splitIRI.transform(iri).end;
    }
    /**
     * Creates an initial JSON-LD object with the passed id and starting property IRI with initial value
     * object.
     *
     * @param {string} id An IRI for the new object
     * @param {string} property A property IRI
     * @param {JSONLDId|JSONLDValue} valueObj A value object in JSON-LD. Must contain either a `@value` or a `@id` key
     * @return {JSONLDObject} A JSON-LD object with an id and property with a starting value
     */
    createJson(id: string, property: string, valueObj: JSONLDId|JSONLDValue): JSONLDObject {
        return {
            '@id': id,
            [property]: [valueObj]
        };
    }
    /**
     * Creates a new Date string in the specified format from the passed date string. Used when converting
     * date strings from the backend into other date strings.
     *
     * @param {string} dateStr A string containing date information
     * @param {string} format A string representing a format for the new date string (See MDN spec for Date)
     * @return {string} A newly formatted date string from the original date string
     */
    getDate(dateStr: string, format: string): string {
        return dateStr ? formatDate(new Date(dateStr), format, 'en-US') : '(No Date Specified)';
    }
    /**
     * Retrieves a shortened id for from an IRI for a commit.
     *
     * @param {string} id The IRI of a commit
     * @return {string} A shortened id from the commit IRI
     */
    condenseCommitId(id: string): string {
        return this.splitIRI.transform(id).end.substring(0, 10);
    }
    /**
     * Converts a common paginated configuration object into a $http query parameter object with
     * common query parameters for pagination. These query parameters are: sort, ascending, limit,
     * and offset.
     *
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
     * @return {Object} An object with converted query parameters if present in original configuration.
     */
    paginatedConfigToParams(paginatedConfig: PaginatedConfig): any {
        const params: {sort?: string, ascending?: boolean, limit?: number, offset?: number} = {};
        if (has(paginatedConfig, 'sortOption.field') && paginatedConfig.sortOption.field) {
            params.sort = paginatedConfig.sortOption.field;
        }
        if (has(paginatedConfig, 'sortOption.asc')) {
            params.ascending = paginatedConfig.sortOption.asc;
        }
        if (has(paginatedConfig, 'limit')) {
            params.limit = paginatedConfig.limit;
            if (has(paginatedConfig, 'offset')) {
                params.offset = paginatedConfig.offset;
            } else if (has(paginatedConfig, 'pageIndex') && !has(paginatedConfig, 'offset')) {
                params.offset = paginatedConfig.pageIndex * paginatedConfig.limit;
            }
        }
        return params;
    }
    /**
     * Returns a rejected promise with the status text of the passed HTTP response object if present,
     * otherwise uses the passed default message.
     *
     * @param {HttpErrorResponse} error A HTTP response object
     * @param {string} defaultMessage The optional default error text for the rejection
     * @return {Promise} A Promise that rejects with an error message
     */
    rejectError(error: HttpErrorResponse, defaultMessage = ''): Promise<any> {
        return Promise.reject(get(error, 'status') === -1 ? '' : this.getErrorMessage(error, defaultMessage));
    }
    /**
     * Retrieves an error message from a HTTP response if available, otherwise uses the passed default
     * message.
     *
     * @param {HttpErrorResponse} error A response from a HTTP calls
     * @param {string='Something went wrong. Please try again later.'} defaultMessage The optional message
     * to use if the response doesn't have an error message
     * @return {string} An error message for the passed HTTP response
     */
    getErrorMessage(error: HttpErrorResponse, defaultMessage = 'Something went wrong. Please try again later.'): string {
        const statusText = get(error, 'statusText');
        return statusText === 'Unknown Error' ? defaultMessage : get(error, 'statusText') || defaultMessage;
    }
    /**
     * Returns a rejected promise with the status text of the passed HTTP response object if present,
     * otherwise uses the passed default message.
     *
     * @param {HttpErrorResponse} error A HTTP response object
     * @param {string} defaultMessage The optional default error text for the rejection
     * @return {Promise} A Promise that rejects with an error message
     */
    rejectErrorObject(error: HttpErrorResponse, defaultMessage = ''): Promise<any> {
        return Promise.reject(get(error, 'status') === -1 ? {'errorMessage': '', 'errorDetails': []} : this.getErrorDataObject(error, defaultMessage));
    }
    /**
     * Retrieves an error message from a HTTP response if available, otherwise uses the passed default
     * message.
     *
     * @param {Object} error A response from a HTTP calls
     * @param {string='Something went wrong. Please try again later.'} defaultMessage The optional message
     * to use if the response doesn't have an error message
     * @return {string} An error message for the passed HTTP response
     */
    getErrorDataObject(error: HttpErrorResponse, defaultMessage = 'Something went wrong. Please try again later.'): ErrorResponse {
        const statusText = get(error, 'statusText');
        return {
            'errorMessage': get(error, 'error.errorMessage') || (statusText === 'Unknown Error' ? '': statusText) || defaultMessage,
            'errorDetails': get(error, 'error.errorDetails') || []
        };
    }
    /**
     * Creates an instance of {@link HttpParams} based on the provided object. Each key will become a query param and
     * the values will be converted to compatible strings. If the value is an array, individual elements will be added
     * as separate param values.
     * 
     * @param params An object to convert to an instance of HttpParams
     * @returns An HttpParams instance with params for each key
     */
     createHttpParams(params: any): HttpParams {
        let httpParams: HttpParams = new HttpParams();
        Object.keys(params).forEach(param => {
            if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
                if (Array.isArray(params[param])) {
                    params[param].forEach(el => {
                        httpParams = httpParams.append(param, this.convertToString(el));
                    });
                } else {
                    httpParams = httpParams.append(param, this.convertToString(params[param]));
                }
            }
        });
        return httpParams;
    }
    /**
     * 
     * @param error 
     * @returns 
     */
    handleError(error: HttpErrorResponse): Observable<any> {
        if (error.status === 0) {
            return throwError('');
        } else {
            return throwError(error.statusText || 'Something went wrong. Please try again later.');
        }
    }
    /**
     * 
     * @param error 
     * @returns 
     */
    handleErrorObject(error: HttpErrorResponse): Observable<ErrorResponse> {
        if (error.status === 0) {
            return throwError({'errorMessage': '', 'errorDetails': []});
        } else {
            return throwError(this.getErrorDataObject(error));
        }
    }
    /**
     * Tracks the provided observable with the {@link shared.ProgressSpinnerService} based on the value of the provided
     * `isTracked` boolean which indicates whether the observable is being tracked otherwise.
     * 
     * @param {Observable} request The observable to track
     * @param {boolean} tracked Whether the observable is being tracked otherwise
     * @returns The Observable tracked or plain
     */
    trackedRequest<T>(request: Observable<T>, tracked: boolean): Observable<T> {
        if (tracked) {
            return request;
        } else {
            return this.spinnerSrv.track(request);
        }
    }
    /**
     * Gets the list of individual statements from the provided array which have a subject matching the provided
     * id.
     *
     * @param {string} id The id which should match the subject of the statements you are looking for.
     * @param {JSONLDObject[]} array The array of JSON-LD statements that you are iterating through.
     * @return {CommitChange[]} An array of Objects, {p: string, o: string} which are the predicate and object for
     * statements which have the provided id as a subject.
     */
    getChangesById(id: string, array: JSONLDObject[]): CommitChange[] {
        const results = [];
        const entity = Object.assign({}, find(array, {'@id': id}));
        forOwn(entity, (value, key) => {
            if (key !== '@id') {
                let actualKey = key;
                if (key === '@type') {
                    actualKey = RDF + 'type';
                }
                if (isArray(value)) {
                    value.forEach(item => results.push({p: actualKey, o: item}));
                } else {
                    results.push({p: actualKey, o: value});
                }
            }
        });
        return results;
    }
    /**
     * Transforms an object containing addition or deletion information into an array of subject, predicate, object triples.
     *
     * @param {JSONLDObject} additionOrDeletion An object containing the addition or deletion.
     * @return {CommitChange[]} An array of Objects, {p: string, o: string} which are the predicate and object for
     * statements which have the provided id as a subject.
     */
    getPredicatesAndObjects(additionOrDeletion: JSONLDObject): CommitChange[] {
        const results = [];
        forOwn(additionOrDeletion, (value, key) => {
            if (key !== '@id') {
                let actualKey = key;
                if (key === '@type') {
                    actualKey = RDF + 'type';
                }
                if (isArray(value)) {
                    forEach(value, item => results.push({p: actualKey, o: item}));
                } else {
                    results.push({p: actualKey, o: value});
                }
            }
        });
        return results;
    }
    /**
     * Transforms an array of additions or deletions into an array of object IRIs.
     *
     * @param {JSONLDObject[]} additionsOrDeletionsArr An array of additions or deletions
     * @return {string[]} An array of the IRIs in the objects of the addition or deletion statements
     */
    getObjIrisFromDifference(additionsOrDeletionsArr: JSONLDObject[]): string[] {
        const objIris = [];
        additionsOrDeletionsArr.forEach(change => {
            forOwn(change, (value) => {
                if (isArray(value)) {
                    value.forEach(item => {
                        if (has(item, '@id')) {
                            objIris.push(item['@id']);
                        }
                    });
                }
            });
        });
        return objIris;
    }
    /**
     * Gets the localname for the provided partialStatement Object, {p: predicateIRI}.
     *
     * @param {CommitChange} partialStatement The partial statement that should contain, at minimum, a `p` property
     * with a value of the predicate IRI whose localname you want.
     * @return {string} The localname for the predicate provided in the partialStatement.
     */
    getPredicateLocalName(partialStatement: CommitChange): string {
        return this.splitIRI.transform(get(partialStatement, 'p', '')).end;
    }
    /**
     * Sorts the partialStatementArray by the localname of the partialStatement Object, {p: predicateIRI}.
     *
     * @param {CommitChange[]} partialStatementArray An array of partial statements that should contain, at minimum, a `p` property
     * with a value of the predicate IRI whose localname you want.
     * @return {CommitChange[]} The partial statement array sorted by localname for the predicate provided in the partialStatement.
     */
    getPredicateLocalNameOrdered(partialStatementArray: CommitChange[]): CommitChange[] {
        return partialStatementArray
            .slice(0)
            .sort((a, b) => {
                const aLocal = this.getPredicateLocalName(a);
                const bLocal = this.getPredicateLocalName(b);

                if (aLocal < bLocal) {
                    return -1;
                } else if (aLocal > bLocal) {
                    return 1;
                } else {
                    return 0;
                }
        });
    }
    /**
     * Generates a blank node IRI using a random V4 UUID.
     *
     * @return {string} A blank node IRI that should be unique.
     */
    getIdForBlankNode(): string {
        return '_:mobi-bnode-' + v4();
    }
    /**
     * Generates a skolemized IRI using a random V4 UUID.
     *
     * @return {string} A skolemized IRI that should be unique.
     */
    getSkolemizedIRI(): string {
        return 'http://mobi.com/.well-known/genid/' + v4();
    }
    /**
     * Gets the input type associated with the property in the properties list provided.
     *
     * @param {string} typeIRI The IRI of the type
     * @returns {string} A string identifying the input type that should be used for the provided property.
     */
    getInputType(typeIRI: string): string {
        switch (replace(typeIRI, XSD, '')) {
            case 'dateTime':
            case 'dateTimeStamp':
                return 'datetime-local';
            case 'byte':
            case 'decimal':
            case 'double':
            case 'float':
            case 'int':
            case 'integer':
            case 'long':
            case 'short':
                return 'number';
            default:
                return 'text';
        }
    }
    /**
     * Gets the pattern type associated with the property in the properties list provided.
     *
     * @param {string} typeIRI The IRI of the type
     * @returns {RegEx} A Regular Expression identifying the acceptable values for the provided property.
     */
    getPattern(typeIRI: string): RegExp {
        switch (replace(typeIRI, XSD, '')) {
            case 'dateTime':
            case 'dateTimeStamp':
                return REGEX.DATETIME;
            case 'decimal':
            case 'double':
            case 'float':
                return REGEX.DECIMAL;
            case 'byte':
            case 'int':
            case 'long':
            case 'short':
            case 'integer':
                return REGEX.INTEGER;
            default:
                return REGEX.ANYTHING;
        }
    }

    private convertToString(param: any): string {
        return typeof param === 'string' ? param : '' + param;
    }
    private _setValue(entity: JSONLDObject, propertyIRI: string, valueObj: JSONLDId|JSONLDValue): void {
        if (has(entity, `['${propertyIRI}']`)) {
            entity[propertyIRI].push(valueObj);
        } else {
            set(entity, `['${propertyIRI}'][0]`, valueObj);
        }
    }
    private _hasValue(entity: JSONLDObject, propertyIRI: string, valueObj: JSONLDId|JSONLDValue): boolean {
        return some(get(entity, `['${propertyIRI}']`, []), valueObj);
    }
    private _removeValue(entity: JSONLDObject, propertyIRI: string, valueObj: JSONLDId|JSONLDValue): void {
        if (has(entity, `['${propertyIRI}']`)) {
            remove(entity[propertyIRI], obj => isEqual(obj, valueObj));
            if (entity[propertyIRI].length === 0) {
                delete entity[propertyIRI];
            }
        }
    }
}
