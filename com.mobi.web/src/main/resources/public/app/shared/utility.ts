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
import { formatDate } from '@angular/common';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { find, forOwn, get, has, isArray, isEqual, isString, merge, reduce, remove, replace, set, some, unionWith } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { v4 } from 'uuid';

import moment from 'moment/moment';
import * as sha1 from 'js-sha1';

import { JSONLDObject } from './models/JSONLDObject.interface';
import { JSONLDId } from './models/JSONLDId.interface';
import { JSONLDValue } from './models/JSONLDValue.interface';
import { DC, DCTERMS, RDFS, SKOS, XSD } from '../prefixes';
import { PaginatedConfig } from './models/paginatedConfig.interface';
import { RESTError } from './models/RESTError.interface';
import { REGEX } from '../constants';
import { splitIRI } from './pipes/splitIRI.pipe';
import { beautify } from './pipes/beautify.pipe';
import { FormValues } from '../shacl-forms/models/form-values.interface';
import { SHACLFormFieldConfig } from '../shacl-forms/models/shacl-form-field-config';

export const entityNameProps = [
  `${RDFS}label`, 
  `${DCTERMS}title`, 
  `${DC}title`, 
];

// General Utility Methods
/**
 * Merges two arrays together using the Lodash isEqual function and returns the merged
 * array.
 *
 * @param {*[]} objValue An array to be merged into
 * @param {*[]} srcValue An array
 * @return {*[]} The result of merging the two arrays using Lodash's isEqual
 */
export function mergingArrays(objValue: any[], srcValue: any[]): any[] {
  if (isArray(objValue)) {
      return unionWith(objValue, srcValue, isEqual);
  }
}
 /**
 * Creates a new Date string in the specified format from the passed date string. Used when converting
 * date strings from the backend into other date strings.
 *
 * @param {string} dateStr A string containing date information
 * @param {string} format A string representing a format for the new date string (See MDN spec for Date)
 * @return {string} A newly formatted date string from the original date string
 */
export function getDate(dateStr: string, format: string): string {
  return dateStr ? formatDate(new Date(dateStr), format, 'en-US') : '(No Date Specified)';
}

// JSON-LD Utility Methods
/**
 * Creates an initial JSON-LD object with the passed id and starting property IRI with initial value
 * object.
 *
 * @param {string} id An IRI for the new object
 * @param {string} property A property IRI
 * @param {JSONLDId|JSONLDValue} valueObj A value object in JSON-LD. Must contain either a `@value` or a `@id` key
 * @return {JSONLDObject} A JSON-LD object with an id and property with a starting value
 */
export function createJson(id: string, property: string, valueObj: JSONLDId|JSONLDValue): JSONLDObject {
  return {
      '@id': id,
      [property]: [valueObj]
  };
}

/**
 * Gets the first value of the specified property from the passed entity. Returns an empty
 * string if not found.
 *
 * @param {JSONLDObject} entity The entity to retrieve the property value from
 * @param {string} propertyIRI The IRI of a property
 * @return {string} The first value of the property if found; empty string otherwise
 */
export function getPropertyValue(entity: JSONLDObject, propertyIRI: string): string {
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
export function setPropertyValue(entity: JSONLDObject, propertyIRI: string, value: string, datatype?: string): void {
  const valObj: JSONLDValue = {'@value': value};
  if (datatype && datatype !== `${XSD}string`) {
    valObj['@type'] = datatype;
  }
  _setValue(entity, propertyIRI, valObj);
}

/**
 * Tests whether or not the passed entity contains the passed value for the passed property.
 *
 * @param {JSONLDObject} entity The entity to look for the property value in
 * @param {string} propertyIRI The IRI of a property
 * @param {string} value The value to search for
 * @return {boolean} True if the entity has the property value; false otherwise
 */
export function hasPropertyValue(entity: JSONLDObject, propertyIRI: string, value: string): boolean {
  return _hasValue(entity, propertyIRI, {'@value': value});
}

/**
* Remove the passed value of the passed property from the passed entity.
*
* @param {JSONLDObject} entity The entity to remove the property value from
* @param {string} propertyIRI The IRI of a property
* @param {string} value The value to remove
*/
export function removePropertyValue(entity: JSONLDObject, propertyIRI: string, value: string): void {
  _removeValue(entity, propertyIRI, {'@value': value});
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
export function replacePropertyValue(entity: JSONLDObject, propertyIRI: string, valueToRemove: string, valueToAdd: string): void {
  removePropertyValue(entity, propertyIRI, valueToRemove);
  setPropertyValue(entity, propertyIRI, valueToAdd);
}

/**
* Removes the first value of the specified property and appends the provided value to the specified property of the 
* passed entity.
*
* @param {JSONLDObject} entity The entity to update the property value of
* @param {string} property The IRI of a property
* @param {string} value The new value for the property
*/
export function updatePropertyValue(entity: JSONLDObject, propertyIRI: string, value: string): void {
  const valueToRemove = getPropertyValue(entity, propertyIRI);
  replacePropertyValue(entity, propertyIRI, valueToRemove, value);
}

/**
* Gets the first id value of the specified property from the passed entity. Returns an empty
* string if not found.
*
* @param {JSONLDObject} entity The entity to retrieve the property id value from
* @param {string} propertyIRI The IRI of a property
* @return {string} The first id value of the property if found; empty string otherwise
*/
export function getPropertyId(entity: JSONLDObject, propertyIRI: string): string {
  return get(entity, `['${propertyIRI}'][0]['@id']`, '');
}

/**
 * Retrieves all ID values associated with the specified property from the given entity.
 * Returns a set of strings containing these ID values. If no IDs are found, an empty set is returned.
 *
 * @param entity       The JSONLDObject representing the entity to retrieve the property IDs from
 * @param propertyIRI  The IRI of the property
 * @return A Set of strings containing all ID values associated with the property; an empty set if none are found
 */
export function getPropertyIds(entity: JSONLDObject, propertyIRI: string): Set<string> {
  const propertyValues = get(entity, `['${propertyIRI}']`, []) as JSONLDObject[];
  if (typeof propertyValues === 'string') {
      return new Set();
  }
  const ids: Set<string> = new Set();

  propertyValues.forEach(value => {
    const id = get(value, '[\'@id\']', '');
    if (id) {
      ids.add(id);
    }
  });

  return ids;
}

/**
* Sets the first or appends to the existing id of the specified property of the passed entity to the passed
* id.
*
* @param {JSONLDObject} entity The entity to set the property value of
* @param {string} propertyIRI The IRI of a property
* @param {string} id The new id value for the property
*/
export function setPropertyId(entity: JSONLDObject, propertyIRI: string, id: string): void {
  _setValue(entity, propertyIRI, {'@id': id});
}

/**
* Tests whether or not the passed entity contains the passed id value for the passed property.
*
* @param {JSONLDObject} entity The entity to look for the property id value in
* @param {string} propertyIRI The IRI of a property
* @param {string} id The id value to search for
* @return {boolean} True if the entity has the property id value; false otherwise
*/
export function hasPropertyId(entity: JSONLDObject, propertyIRI: string, id: string): boolean {
  return _hasValue(entity, propertyIRI, {'@id': id});
}

/**
* Remove the passed id value of the passed property from the passed entity.
*
* @param {JSONLDObject} entity The entity to remove the property id value from
* @param {string} propertyIRI The IRI of a property
* @param {string} id The id value to remove
*/
export function removePropertyId(entity: JSONLDObject, propertyIRI: string, id: string): void {
  _removeValue(entity, propertyIRI, {'@id': id});
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
export function replacePropertyId(entity: JSONLDObject, propertyIRI: string, idToRemove: string, idToAdd: string): void {
  removePropertyId(entity, propertyIRI, idToRemove);
  setPropertyId(entity, propertyIRI, idToAdd);
}

/**
* Removes the first id value of the specified property and appends the provided id value to the specified property of
* the passed entity.
*
* @param {JSONLDObject} entity The entity to update the property value of
* @param {string} property The IRI of a property
* @param {string} value The new id value for the property
*/
export function updatePropertyId(entity: JSONLDObject, propertyIRI: string, id: string): void {
  const idValueToRemove = getPropertyId(entity, propertyIRI);
  replacePropertyId(entity, propertyIRI, idValueToRemove, id);
}

/**
 * Gets the first value of the specified dcterms property from the passed entity. Returns an empty
 * string if not found.
 *
 * @param {JSONLDObject} entity The entity to retrieve the property value from
 * @param {string} property The local name of a dcterms property IRI
 * @return {string} The first value of the dcterms property if found; empty string otherwise
 */
export function getDctermsValue(entity: JSONLDObject, property: string): string {
  return getPropertyValue(entity, DCTERMS + property);
}

/**
* Remove the passed value of the specified dcterms property from the passed entity.
*
* @param {JSONLDObject} entity The entity to remove the property value from
* @param {string} property The local name of a dcterms property IRI
* @param {string} value The value to remove
*/
export function removeDctermsValue(entity: JSONLDObject, property: string, value: string): void {
  removePropertyValue(entity, DCTERMS + property, value);
}

/**
* Sets the first value or appends to the values of the specified dcterms property of the passed entity
* with the passed value.
*
* @param {JSONLDObject} entity The entity to set the property value of
* @param {string} property The local name of a dcterms property IRI
* @param {string} value The new value for the property
*/
export function setDctermsValue(entity: JSONLDObject, property: string, value: string): void {
  setPropertyValue(entity, DCTERMS + property, value);
}

/**
* Removes the first value of the specified dcterms property and appends the provided value to the specified
* dcterms property of the passed entity
*
* @param {JSONLDObject} entity The entity to update the property value of
* @param {string} property The local name of a dcterms property IRI
* @param {string} value The new value for the property
*/
export function updateDctermsValue(entity: JSONLDObject, property: string, value: string): void {
  const valueToRemove = getPropertyValue(entity, DCTERMS + property);
  replacePropertyValue(entity, DCTERMS + property, valueToRemove, value);
}

/**
 * Gets the first id value of the specified dcterms property from the passed entity. Returns an
 * empty string if not found.
 *
 * @param {JSONLDObject} entity The entity to retrieve the property id value from
 * @param {string} property The local name of a dcterms property IRI
 * @return {string} The first id value of the dcterms property if found; empty string otherwise
 */
export function getDctermsId(entity: JSONLDObject, property: string): string {
  return get(entity, `['${DCTERMS + property}'][0]['@id']`, '');
}

/**
 * Adds a language specification on the dct:title, dct:description, and skos:prefLabel properties on the
 * provided JSON-LD object.
 * 
 * @param {JSONLDObject} entity A JSON-LD Object
 * @param {string} language The language tag to add
 */
export function addLanguageToAnnotations(entity: JSONLDObject, language: string): void {
  if (language) {
      [`${DCTERMS}title`, `${DCTERMS}description`, `${SKOS}prefLabel`].forEach(item => {
          if (get(entity, `['${item}'][0]`)) {
              set(entity[item][0], '@language', language);
          }
      });
  }
}

/**
 * Generates a skolemized IRI using a random V4 UUID.
 *
 * @return {string} A skolemized IRI that should be unique.
 */
export function getSkolemizedIRI(): string {
  return `http://mobi.com/.well-known/genid/${v4()}`;
}

/**
 * Checks if the provided entity id is a blank node id. Returns a boolean.
 *
 * @param {string} id The id to check.
 * @return {boolean} Returns true if the id is a blank node id, otherwise returns false.
 */
export function isBlankNodeId(id: string): boolean {
  return isString(id) && (id.includes('/.well-known/genid/') || id.includes('_:genid') || id.includes('_:b'));
}

/**
 * Checks if the provided entity is blank node. Returns a boolean.
 *
 * @param {JSONLDObject} entity The entity you want to check.
 * @returns {boolean} Returns true if it is a blank node entity, otherwise returns false.
 */
export function isBlankNode(entity: JSONLDObject): boolean {
  return isBlankNodeId(get(entity, '@id', ''));
}

/**
 * Gets the "beautified" IRI representation for the iri passed. Returns the modified IRI.
 *
 * @param {string} iri The IRI string that you want to beautify.
 * @returns {string} The beautified IRI string.
 */
export function getBeautifulIRI(iri: string): string {
  const splitEnd = splitIRI(iri).end;
  if (splitEnd) {
    return splitEnd.match(REGEX.UUID) ? splitEnd : beautify(splitEnd);
  }
  return iri;
}

/**
 * Gets the namespace of an IRI string.
 *
 * @param {string} iri An IRI string.
 * @return {string} The namespace of the IRI
 */
export function getIRINamespace(iri: string): string {
  const split = splitIRI(iri);
  return split.begin + split.then;
}
/**
 * Gets the namespace of an IRI string.
 *
 * @param {string} iri An IRI string
 * @return {string} The namespace of the IRI
 */
export function getIRILocalName(iri: string): string {
  return splitIRI(iri).end;
}

// HTTP Utility Methods
/**
 * Creates an instance of {@link HttpParams} based on the provided object. Each key will become a query param and
 * the values will be converted to compatible strings. If the value is an array, individual elements will be added
 * as separate param values.
 * 
 * @param {Object} params An object to convert to an instance of HttpParams
 * @returns {HttpParams} An HttpParams instance with params for each key
 */
export function createHttpParams(params: { [key: string]: string | number | boolean | string[] | number[] | boolean[] }): HttpParams {
  let httpParams: HttpParams = new HttpParams();
  Object.keys(params).forEach(param => {
    if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
      if (Array.isArray(params[param])) {
        (params[param] as string[] | number[] | boolean[]).forEach(el => {
          httpParams = httpParams.append(param, _convertToString(el));
        });
      } else {
        httpParams = httpParams.append(param, _convertToString((params[param] as string | number | boolean)));
      }
    }
  });
  return httpParams;
}

/**
 * Converts a common paginated configuration object into a HttpParams object with common query parameters for
 * pagination. These query parameters are: sort, ascending, limit, and offset.
 *
 * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
 * @return {HttpParams} An HttpParams instance with converted query parameters if present in original configuration.
 */
export function paginatedConfigToHttpParams(paginatedConfig: PaginatedConfig): HttpParams {
  const params: { [key: string]: string | number | boolean | string[] | number[] | boolean[] } = {};
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
  return createHttpParams(params);
}

/**
 * Creates a standard RESTError object based on data within an HttpErrorResponse. Uses the optionally provided default
 * message if one could not be retrieved from the error Response.
 *
 * @param {HttpErrorResponse} error A response from an HTTP call
 * @param {string} [defaultMessage='Something went wrong. Please try again later.'] The optional message to use if the
 *  response doesn't have an error message
 * @return {RESTError} A RESTError object with the error, error message, and error details from the passed HTTP response
 */
export function getErrorDataObject(error: HttpErrorResponse, 
  defaultMessage = 'Something went wrong. Please try again later.'): RESTError {
  const statusText = get(error, 'statusText');
  let errorObj: RESTError = { error: '', errorMessage: '', errorDetails: [] };
  if (error.error) {
      errorObj = merge(errorObj, (typeof error.error === 'string' ? JSON.parse(error.error) : error.error)) as RESTError;
  }
  if (!errorObj.errorMessage) {
      errorObj.errorMessage = (statusText === 'Unknown Error' ? '' : statusText) || defaultMessage;
  }
  return errorObj;
}

/**
 * Converts a HttpErrorResponse into an error Observable with the status text from the response.
 * 
 * @param {HttpErrorResponse} error An error response returned from an HTTP call
 * @returns {Observable<never>} An Observable that errors with the status text from the HTTP Response
 */
export function handleError(error: HttpErrorResponse): Observable<never> {
  if (error.status === 0) {
    return throwError('');
  } else {
    return throwError(error.statusText && error.statusText !== 'Unknown Error' ? error.statusText 
      : 'Something went wrong. Please try again later.');
  }
}

/**
 * Converts a HttpErrorResponse into an error Observable with a RESTError instance derived from the response.
 * 
 * @param {HttpErrorResponse} error An error response returned from an HTTP call
 * @returns {Observable<RESTError>} An Observable that errors with a RESTError instance derived from the response
 */
export function handleErrorObject(error: HttpErrorResponse): Observable<never> {
  if (error.status === 0) {
    return throwError({error: '', errorMessage: '', errorDetails: []});
  } else {
    return throwError(getErrorDataObject(error));
  }
}

// Mobi Specific Utility Functions
/**
 * Transforms an array of additions or deletions into an array of object IRIs.
 *
 * @param {JSONLDObject[]} additionsOrDeletionsArr An array of additions or deletions
 * @return {string[]} An array of the IRIs in the objects of the addition or deletion statements
 */
export function getObjIrisFromDifference(additionsOrDeletionsArr: JSONLDObject[]): string[] {
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
 * Gets the input type associated with the property in the properties list provided.
 *
 * @param {string} typeIRI The IRI of the type
 * @returns {string} A string identifying the input type that should be used for the provided property.
 */
export function getInputType(typeIRI: string): string {
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
export function getPattern(typeIRI: string): RegExp {
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

/**
 * Retrieves a shortened id for from an IRI for a commit.
 *
 * @param {string} id The IRI of a commit
 * @return {string} A shortened id from the commit IRI
 */
export function condenseCommitId(id: string): string {
  return splitIRI(id).end.substring(0, 10);
}

/**
 * Gets the provided entity's name. This name is either the `rdfs:label`, `dcterms:title`, or `dc:title`.
 * If none of those annotations exist, it returns the beautified `@id`. Prioritizes english language tagged
 * values over the others. Returns a string for the entity name.
 *
 * @param {JSONLDObject} entity The entity you want the name of.
 * @returns {string} The beautified IRI string.
 */
export function getEntityName(entity: JSONLDObject, props = entityNameProps): string {
  let result = reduce(props, (tempResult, prop) => tempResult 
      || _getPrioritizedValue(entity, prop), '');
  if (!result && has(entity, '@id')) {
      result = getBeautifulIRI(entity['@id']);
  }
  return result;
}

/**
 * Converts a Date object to a formatted date string.
 * If the date is not null, it formats it as "h:mm:ssA M/D/Y".
 * If the date is null, it returns '(none)'.
 *
 * @param {Date|null} date - The date to format.
 * @returns {string} The formatted date string or '(none)'.
 */
export function toFormattedDateString(date:Date|null):string {
  return  date ? moment(date).format('h:mm:ssA M/D/Y') : '(none)';
}

/**
* Returns '(none)' if the value is falsy.
* If a function is provided and the value is truthy, it applies the function to the value.
*
* @param {any} value - The value to check.
* @param {Function|null} [func=null] - The function to apply to the value if it's truthy.
* @returns {any|string} The original value, transformed value, or '(none)'.
*/
export function orNone(value, func = null): string {
  return value ? (func ? func(value) : value) : '(none)';
}

/**
* Calculates the running time between two dates in seconds or minutes.
* If either start time or end time is falsy, it returns '(none)'.
* Otherwise, it calculates the duration and returns it in appropriate units.
*
* @param {Date} sTime - The start time.
* @param {Date} eTime - The end time.
* @returns {string} The running time in seconds or minutes, or '(none)'.
*/
export function runningTime (sTime:Date, eTime:Date): string {
  if (!sTime || !eTime) {
      return '(none)';
  }
  const startTime = moment(sTime);
  const endTime = moment(eTime);
  const duration = moment.duration(endTime.diff(startTime));
  const seconds = duration.asSeconds();
  return seconds < 60 ?
      `${seconds} sec` : `${duration.asMinutes()} min`;
}

/**
* Returns the status if it's not equal to 'never_run', otherwise returns a default value.
* If status is truthy and not 'never_run', it returns the status after applying `orNone`.
*
* @param {string} status - The status to check.
* @param {string} [defaultValue='never-run'] - The default value to return if status is 'never_run'.
* @returns {string} The status or the default value.
*/
export function getStatus(status:string, defaultValue='never-run'): string {
  return status !== 'never_run' ? orNone(status) : defaultValue;
}

/**
 * Generates JSON-LD from the provided FormValues. Takes a JSON-LD object representing the node that the form is
 * generating as an argument and the array of SHACLFormFieldConfigs represented in the provided FormValues. This method
 * mutates the instance JSON-LD and returns a JSON-LD array containing the instance first and then any generated
 * associated objects after.
 * 
 * @param {JSONLDObject} instance The JSON-LD object of the instance to populate using the form values
 * @param {SHACLFormFieldConfig} configs The list of field configurations that were used to generate the form
 * @param {FormValues} formValues The normalized collection of form field values from a SHACL form
 * @returns {JSONLDObject[]} The JSON-LD array of the data generated by a SHACL form
 */
export function getShaclGeneratedData(instance: JSONLDObject, configs: SHACLFormFieldConfig[], formValues: FormValues): JSONLDObject[] {
  const genData = [instance];
  configs.forEach(config => {
    const prop = config.property;
    instance[prop] = [];
    if (Array.isArray(formValues[prop])) {
      // Iterate over the property value in the form
      (formValues[prop] as string[] | { [key: string]: string }[]).forEach(val => {
        let valToSet: string;
        // If the property value is a simple string, use it directly
        if (typeof val !== 'object') {
          valToSet = '' + val;
        } else { // If the property value is an object
          const objVal = val as { [key: string]: string };
          // If the field config has sub fields, need to generate an associated object
          if (config.subFields && config.subFields.length) { 
            const assocObject: JSONLDObject = _createAssociatedObject(config, objVal);
            genData.push(assocObject);
            valToSet = assocObject['@id'];
          } else { 
            // If the object has keys that start with the property name, assume all the values of the object are values of the property
            const valKey = Object.keys(objVal).find(key => key.startsWith(prop));
            valToSet = '' + objVal[valKey];
          }
        }
        _setJSONLDPropValue(instance, config, valToSet);
      });
    } else { // Form value is not an array
      let valToSet: string;
      // If the form value is a simple value use it directly
      if (typeof formValues[prop] !== 'object') {
        valToSet = '' + formValues[prop];
      } else { // If the form value is an object, need to generate/update an associated object for the complex setting value
        const assocObject: JSONLDObject = _createAssociatedObject(config, formValues[prop] as { [key: string]: string});
        genData.push(assocObject);
        valToSet = assocObject['@id'];
      }
      _setJSONLDPropValue(instance, config, valToSet);
    }
    // If no values were found for the property, remove it from the settings instance
    if (!instance[prop].length) {
      delete instance[prop];
    }
  });
  return genData;
}

// Private Functions
function _setValue(entity: JSONLDObject, propertyIRI: string, valueObj: JSONLDId|JSONLDValue): void {
  if (has(entity, `['${propertyIRI}']`)) {
    entity[propertyIRI].push(valueObj);
  } else {
    set(entity, `['${propertyIRI}'][0]`, valueObj);
  }
}
function _hasValue(entity: JSONLDObject, propertyIRI: string, valueObj: JSONLDId|JSONLDValue): boolean {
  return some(get(entity, `['${propertyIRI}']`, []), valueObj);
}
function _removeValue(entity: JSONLDObject, propertyIRI: string, valueObj: JSONLDId|JSONLDValue): void {
  if (has(entity, `['${propertyIRI}']`)) {
    remove(entity[propertyIRI], obj => isEqual(obj, valueObj));
    if (entity[propertyIRI].length === 0) {
      delete entity[propertyIRI];
    }
  }
}
function _convertToString(param: string | number | boolean): string {
  return typeof param === 'string' ? param : '' + param;
}
function _getPrioritizedValue(entity, prop) {
  return get(find(get(entity, `['${prop}']`), {'@language': 'en'}), '@value') || getPropertyValue(entity, prop);
}
/**
 * Creates a JSON-LD object representing an associated object for the property represented by the provided
 * SHACLFormFieldConfig. Populates the properties on the associated object using the provided object of property keys
 * to property values. Assumes the sh:NodeShape for the associated object uses implicit class targeting.
 * 
 * @param {SHACLFormFieldConfig} config The form configuration of the property that points to the associated object
 * @param {{ {key: string}: string }} objectValue The values to use to populate the properties on the associated object
 * @returns {JSONLDObject} The JSON-LD object of the generated associated object
 */
function _createAssociatedObject(config: SHACLFormFieldConfig, objectValue: { [key: string]: string }): JSONLDObject {
  // Assumption that all the sub fields are for the same NodeShape (there isn't a situation this isn't true)
  const subNodeShape = config.subFields[0].nodeShape;
  // Assumes type of associated object is IRI of the NodeShape (i.e. implicit class target)
  const className = splitIRI(subNodeShape['@id']).end;
  const assocObject: JSONLDObject = {
    '@id': `http://mobi.solutions/${className}#`,
    '@type': [subNodeShape['@id']]
  };
  config.subFields.forEach(subConfig => {
    _setJSONLDPropValue(assocObject, subConfig, objectValue[subConfig.property]);
  });
  // Deterministically create the local name for the associated object based off the type and properties
  assocObject['@id'] += sha1.sha1(JSON.stringify(assocObject));
  return assocObject;
}
/**
 * Determines whether the provided string looks like an IRI or not.
 * 
 * @param {string} val The value of some field
 * @returns {boolean} True if it looks like an IRI; false otherwise
 */
function _isIRIValue(val: string) {
  return !!val.match(REGEX.IRI);
}
/**
 * Sets the provided value for the provided property on the provided JSON-LD object based off whether it looks like an
 * IRI value or a Literal value. Mutates the provided JSON-LD object.
 * 
 * @param {JSONLDObject} instance The JSON-LD object to set the property value on
 * @param {string} prop The IRI of the property to set
 * @param {string} value The property value to set
 */
function _setJSONLDPropValue(instance: JSONLDObject, config: SHACLFormFieldConfig, value: string): void {
  if (value) {
    if (_isIRIValue(value) && !config.datatype) {
      setPropertyId(instance, config.property, value);
    } else {
      setPropertyValue(instance, config.property, value, config.datatype);
    }
  }
}