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
import * as sparqljs from 'sparqljs';
import {
    find,
    includes,
    get,
    isEqual,
    some,
    set,
    toLower,
    flattenDeep,
    isEmpty,
    filter,
    forOwn,
    isArray} from 'lodash';
import { catchError, map, switchMap } from 'rxjs/operators';
import { forkJoin, Observable, throwError, of } from 'rxjs';

import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { SparqlManagerService } from '../../../shared/services/sparqlManager.service';
import { DATASET, DCTERMS, OWL, RDF, RDFS, XSD } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { SPARQLSelectResults } from '../../../shared/models/sparqlSelectResults.interface';
import { PropertyDetails } from '../../models/propertyDetails.interface';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { getInputType, getPattern, getPropertyId, getPropertyValue } from '../../../shared/utility';

/**
 * @class explore.ExploreUtilsService
 *
 * `exploreUtilsService` is a service that provides utility functions for the explore sub module.
 */
@Injectable()
export class ExploreUtilsService {
    constructor(private dm: DatasetManagerService, private sparql: SparqlManagerService,
        private om: OntologyManagerService) {}

    /**
     * 
     * @param instanceIRI 
     * @param datasetRecordIRI 
     * @returns 
     */
    getReferencedTitles(instanceIRI: string, datasetRecordIRI: string): Observable<SPARQLSelectResults> {
        const generator = new sparqljs.Generator();
        const query = generator.stringify({
            'queryType': 'SELECT',
            'variables': [
                '?object',
                '?title'
            ],
            'where': [{
                'type': 'bgp',
                'triples': [{
                        'subject': instanceIRI,
                        'predicate': '?p',
                        'object': '?object'
                    },
                    {
                        'subject': '?object',
                        'predicate': {
                            'type': 'path',
                            'pathType': '|',
                            'items': [
                                `${RDFS}label`,
                                `${DCTERMS}title`
                            ]
                        },
                        'object': '?title'
                    }
                ]
            }],
            'type': 'query',
            'prefixes': {
                'rdfs': RDFS,
                'dcterms': DCTERMS
            }
        });
        return this.sparql.query(query, datasetRecordIRI)
            .pipe(map((data: string| SPARQLSelectResults) => data as SPARQLSelectResults));
    }
    /**
     * Gets the input type associated with the property in the properties list provided.
     *
     * @param {string} propertyIRI The IRI of the property
     * @param {PropertyDetails[]} properties The list of property details
     * @returns {string} A string identifying the input type that should be used for the provided property.
     */
    getInputType(propertyIRI: string, properties: PropertyDetails[]): string {
        return getInputType(this.getRange(propertyIRI, properties));
    }
    /**
     * Gets the pattern type associated with the property in the properties list provided.
     *
     * @param {string} propertyIRI The IRI of the property
     * @param {PropertyDetails[]} properties The list of property details
     * @returns {RegExp} A Regular Expression identifying the acceptable values for the provided property.
     */
    getPattern(propertyIRI: string, properties: PropertyDetails[]): RegExp {
        return getPattern(this.getRange(propertyIRI, properties));
    }
    /**
     * Checks to see if the property provided is of the desired type according to the list of properties.
     *
     * @param {string} propertyIRI The IRI of the property
     * @param {string} type The desired type
     * @param {PropertyDetails[]} properties The list of property details
     * @returns {boolean} True if the property is of the desired type; otherwise, false.
     */
    isPropertyOfType(propertyIRI: string, type: string, properties: PropertyDetails[]): boolean {
        return some(properties, {propertyIRI, type});
    }
    /**
     * Checks to see if the property provided has a boolean range.
     *
     * @param {string} propertyIRI The IRI of the property
     * @param {PropertyDetails[]} properties The list of property details
     * @returns {boolean} True if the property has a boolean range; otherwise, false.
     */
    isBoolean(propertyIRI: string, properties: PropertyDetails[]): boolean {
        return this.getRange(propertyIRI, properties) === `${XSD}boolean`;
    }
    /**
     * Creates a JSON-LD object only containing the '@id' property.
     *
     * @param {string} string The string to set as the '@id'
     * @returns {JSONLDId} A JSON-LD object containing '@id' set with the provided string.
     */
    createIdObj(string: string): JSONLDId {
        return {'@id': string};
    }
    /**
     * Creates a JSON-LD object containing the '@value' property and '@type' if required.
     *
     * @param {string} string The string to set as the '@id'
     * @param {string} propertyIRI The IRI of the property
     * @param {PropertyDetails[]} properties The list of property details
     * @returns {JSONLDValue} A JSON-LD object containing the '@value' and optionally '@type'.
     */
    createValueObj(string: string, propertyIRI: string, properties: PropertyDetails[]): JSONLDValue {
        const obj = {'@value': string};
        const range = this.getRange(propertyIRI, properties);
        return range ? set(obj, '@type', range) : obj;
    }
    /**
     * Gets the first range of the property from the list of properties.
     *
     * @param {string} propertyIRI The IRI of the property
     * @param {PropertyDetails[]} properties The list of property details
     * @returns {string} The first range for the property in the list of properties.
     */
    getRange(propertyIRI: string, properties: PropertyDetails[]): string {
        const range = get(find(properties, {propertyIRI}), 'range', []);
        return range.length ? range[0] : '';
    }
    /**
     * Checks to see if the string contains part, ignoring case.
     *
     * @param {string} string The full string to search through
     * @param {string} part The partial string to look for
     * @returns {boolean} True if the string contains the provided part; otherwise, false.
     */
    contains(string: string, part: string): boolean {
        return includes(toLower(string), toLower(part));
    }
    /**
     * Retrieves all the classes within the ontologies linked to the dataset identified by the provided
     * DatasetRecord ID.
     *
     * @param {string} datasetId The IRI of a DatasetRecord
     * @return {Observable} An Observable with the classes within all the linked ontologies of a DatasetRecord
     */
    getClasses(datasetId: string): Observable<{id: string, title: string, deprecated: boolean}[]> {
        const datasetArr = find(this.dm.datasetRecords, arr => some(arr, {'@id': datasetId}));
        if (!datasetArr) {
            return throwError('Dataset could not be found');
        }
        const ontologies = this.dm.getOntologyIdentifiers(datasetArr).map(identifier => ({
            recordId: getPropertyId(identifier, `${DATASET}linksToRecord`),
            branchId: getPropertyId(identifier, `${DATASET}linksToBranch`),
            commitId: getPropertyId(identifier, `${DATASET}linksToCommit`)
        }));
        return forkJoin(ontologies.map(ontology => this.om.getOntologyClasses(ontology.recordId, ontology.branchId, ontology.commitId, false)))
            .pipe(
                catchError(() => throwError('The Dataset ontologies could not be found')),
                switchMap((response: JSONLDObject[][]) => {
                    const allClasses = flattenDeep(response);
                    if (isEmpty(allClasses)) {
                        return throwError('The Dataset classes could not be retrieved');
                    }
                    return of(allClasses.map(clazz => {
                        const deprecated = includes(['true', true, '1', 1], getPropertyValue(clazz, `${OWL}deprecated`));
                        return {
                            id: clazz['@id'],
                            title: this.om.getEntityName(clazz),
                            deprecated
                        };
                    }));
                })
            );
    }
    /**
     * Gets the list of properties not set on the provided entity filtered down by the provided text.
     *
     * @param {PropertyDetails[]} properties The list of property details
     * @param {JSONLDObject} entity The entity to get properties from
     * @param {string} text The search text
     * @returns {string[]} A list of properties that are not already set on the entity.
     */
    getNewProperties(properties: PropertyDetails[], entity: JSONLDObject, text: string): PropertyDetails[] {
        const props = [];
        properties.forEach(property => {
                if ( !includes(Object.keys(entity), property.propertyIRI) ) {
                    props.push(property);
                }
            });
        return text ? filter(props, property => this.contains(property.propertyIRI.toLowerCase(), text.toLowerCase())) : props;
    }
    /**
     * Removes properties that have empty values.
     *
     * @param {JSONLDObject} object The object to remove properties from.
     * @returns {JSONLDObject} A new object with all of the empty valued properties removed.
     */
    removeEmptyProperties(object: JSONLDObject): JSONLDObject {
        const copy = Object.assign({}, object);
        forOwn(copy, (value, key) => {
            if (isArray(value) && value.length === 0) {
                delete copy[key];
            }
        });
        return copy;
    }
    /**
     * Removes properties from each item in the array that have empty values.
     *
     * @param {JSONLDObject[]} array The array that contains the objects to remove properties from.
     * @returns {JSONLDObject[]} A new array with all of the empty valued properties removed from each object.
     */
    removeEmptyPropertiesFromArray(array: JSONLDObject[]): JSONLDObject[] {
        return array.map(item => this.removeEmptyProperties(item));
    }
    /**
     * Retrieves the reified Statement object for the statement matching the provided subject, predicate, and object
     * from the provided JSON-LD array.
     *
     * @param {JSONLDObject[]} arr A JSON-LD array
     * @param {string} subIRI The subject of the reified statement
     * @param {string} propIRI The predicate of the reified statement
     * @param {JSONLDValue} valueObj The JSON-LD object representing the object value of the reified statement
     * @return {JSONLDObject} The reified Statement matching the provided subject, predicate, and object
     */
    getReification(arr: JSONLDObject[], subIRI: string, propIRI: string, valueObj: JSONLDValue|JSONLDId): JSONLDObject {
        return find(arr, thing => {
            return includes(get(thing, '@type', []), `${RDF}Statement`)
                && isEqual(this._getRdfProperty(thing, 'subject'), [{'@id': subIRI}])
                && isEqual(this._getRdfProperty(thing, 'predicate'), [{'@id': propIRI}])
                && isEqual(this._getRdfProperty(thing, 'object'), [valueObj]);
        });
    }

    private _getRdfProperty(thing, localName) {
        return get(thing, RDF + localName, {});
    }
}
