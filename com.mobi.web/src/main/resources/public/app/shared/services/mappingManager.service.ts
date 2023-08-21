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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    forEach,
    get,
    concat,
    includes,
    findIndex,
    find} from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { CamelCasePipe } from '../pipes/camelCase.pipe';
import { DATA, DCTERMS, DELIM, MAPPINGS, RDFS } from '../../prefixes';
import { Mapping } from '../models/mapping.class';
import { MappingOntologyInfo } from '../models/mappingOntologyInfo.interface';
import { MappingOntology } from '../models/mappingOntology.interface';
import { RecordConfig } from '../models/recordConfig.interface';
import { OntologyManagerService } from './ontologyManager.service';
import { OntologyDocument } from '../models/ontologyDocument.interface';
import { createHttpParams, getPropertyId, handleError } from '../utility';
import { splitIRI } from '../pipes/splitIRI.pipe';

/**
 * @class shared:MappingManagerService
 *
 * A service that provides access to the Mobi mapping REST endpoints and utility functions for editing/creating mapping
 * arrays and accessing various aspects of mapping arrays.
 */
@Injectable()
export class MappingManagerService {
    prefix = `${REST_PREFIX}mappings`;

    /**
     * An array of annotation IRIs that are supported by the Mapping Tool.
     * @type {string[]}
     */
    annotationProperties = [
        `${RDFS}label`,
        `${RDFS}comment`,
        `${DCTERMS}title`,
        `${DCTERMS}description`
    ];

    constructor(private http: HttpClient, private om: OntologyManagerService,
        private spinnerSvc: ProgressSpinnerService, private camelCase: CamelCasePipe) {}

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
     * Adds a class mapping to a mapping based on the given class id. The class must be present in the passed array of
     * ontology entities.
     *
     * @param {Mapping} mapping The mapping JSON-LD array
     * @param {JSONLDObject[]} ontology The ontology array to search for the class in
     * @param {string} classId The id of the class in the ontology
     * @returns {JSONLDObject} The new class mapping object
     */
    addClass(mapping: Mapping, ontology: JSONLDObject[], classId: string): JSONLDObject {
        const classEntity = this.om.getEntity([ontology], classId);
        // Check if class exists in ontology
        if (classEntity) {
            // Collect IRI sections for prefix and create class mapping
            const splitIri = splitIRI(classId);
            const ontologyDataName = (splitIRI(this.om.getOntologyIRI(ontology))).end;
            return mapping.addClassMapping(classId, `${DATA}${ontologyDataName}/${splitIri.end.toLowerCase()}/`);
        }

        return;
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
    /**
     * Adds a data property mapping to a mapping for the specified class mapping. The class mapping must already be in
     * the mapping and data property must exist in the passed array of ontology entities.
     *
     * @param {Mapping} mapping The mapping JSON-LD array
     * @param {JSONLDObject[]} ontology The ontology array to search for the property in
     * @param {string} classMappingId The id of the class mapping to add the data property mapping to
     * @param {string} propId The id of the data property in the ontology
     * @param {number} columnIndex The column index to set the data property mapping's `columnIndex`
     * property to
     * @param {string} datatypeSpec The default datatype the DataMapping should use
     * @param {string} languageSpec The default language tag the DataMapping should use
     * @returns {JSONLDObject} The new data property mapping object
     */
    addDataProp(mapping: Mapping, ontology: JSONLDObject[], classMappingId: string, propId: string, columnIndex: number,
        datatypeSpec: string, languageSpec: string): JSONLDObject {
        // Check if class mapping exists and the property exists in the ontology or the property is one of the
        // supported annotations
        const propEntity = this.om.getEntity([ontology], propId);
        if (mapping.hasClassMapping(classMappingId) && ((propEntity && this.om.isDataTypeProperty(propEntity)) 
            || includes(this.annotationProperties, propId) || this.om.isAnnotation(propEntity))) {
            return mapping.addDataPropMapping(propId, columnIndex, classMappingId, datatypeSpec, languageSpec);
        }

        return;
    }
    /**
     * Adds a object property mapping to a mapping for the specified class mapping. The class mapping and the range
     * class mapping must already be in the mapping, the object property must exist in the passed array of ontology
     * entities, and the object property range must match the type of the range class mapping.
     *
     * @param {Mapping} mapping The mapping JSON-LD array
     * @param {MappingOntology[]} ontology The ontology array to search for the property in
     * @param {string} classMappingId The id of the class mapping to add the object property mapping to
     * @param {string} propId The id of the object property in the ontology
     * @param {string} rangeClassMappingId The id of the class mapping to set as the range of the new
     * object property mapping
     * @returns {JSONLDObject} The new object property mapping
     */
    addObjectProp(mapping: Mapping, ontology: JSONLDObject[], classMappingId: string, propId: string, 
        rangeClassMappingId: string): JSONLDObject {
        // Check if class mapping exists, range class mapping exists, object property exists in ontology,
        // and object property range matches the range class mapping
        const propEntity = this.om.getEntity([ontology], propId);
        const rangeClassMapping = mapping.getClassMapping(rangeClassMappingId);
        if (mapping.hasClassMapping(classMappingId) && rangeClassMapping && propEntity 
            && this.om.isObjectProperty(propEntity) 
            && getPropertyId(propEntity, `${RDFS}range`) === getPropertyId(rangeClassMapping, `${DELIM}mapsTo`)) {
            return mapping.addObjectPropMapping(propId, classMappingId, rangeClassMappingId);
        }

        return;
    }

    // Source Ontology methods
    /**
     * Retrieves an ontology and structures it for the mappingManagerService with its id and the list of entities within
     * it. Does not apply any in progress commit. Returns an observable with the structured ontology.
     * 
     * @param {MappingOntologyInfo} ontologyInfo The information of the OntologyRecord to retrieve
     * @param {string} recordId The id of the OntologyRecord
     * @param {string} branchId The id of the branch of the OntologyRecord
     * @param {string} commitId The id of the commit of the OntologyRecord
     * @returns {Observable<MappingOntology>} An observable that resolves with a structured ontology if the call was
     * successful; rejects otherwise
     */
    getOntology(ontologyInfo: MappingOntologyInfo): Observable<MappingOntology> {
        return this.om.getOntology(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId, undefined, 
            undefined, undefined, false)
            .pipe(map((ontology: JSONLDObject[]|string) => {
                const jsonld = ontology as JSONLDObject[];
                return {
                    id: this.om.getOntologyIRI(jsonld),
                    recordId: ontologyInfo.recordId,
                    entities: jsonld
                };
            }));
    }
    /**
     * Gets the list of source ontologies from the imports closure of the ontology with the passed id. If no id is
     * passed, returns An observable with an empty array. If the ontologies are found successfully, returns an observable
     * the source ontologies. Otherwise, returns an observable that rejects with an error message.
     *
     * @param {MappingOntologyInfo} ontologyInfo The id of the ontology to collect the imports closure of
     * @param {string} recordId The id of the OntologyRecord
     * @param {string} branchId The id of the branch of the OntologyRecord
     * @param {string} commitId The id of the commit of the OntologyRecord
     * @returns {Observable<MappingOntology[]>} An observable that resolves to an array of objects if no id is passed or
     * the source ontologies are found; rejects otherwise
     */
    getSourceOntologies(ontologyInfo: MappingOntologyInfo): Observable<MappingOntology[]> {
        let sourceOntology: MappingOntology;
        return this.getOntology(ontologyInfo).pipe(
            switchMap((ontology: MappingOntology) => {
                sourceOntology = ontology;
                return this.om.getImportedOntologies(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId);
            }),
            switchMap((imported: OntologyDocument[]) => {
                const importedOntologies: MappingOntology[] = imported.map(obj => ({
                    id: obj.ontologyId,
                    entities: obj.ontology as JSONLDObject[]
                }));
                return of([sourceOntology].concat(importedOntologies));
            })
        );
    }
    /**
     * Finds the ontology in the passed list of structured ontologies that contains the class
     * with the passed IRI.
     *
     * @param {string} classIRI The IRI of the class to search for
     * @param {MappingOntology[]} ontologies The list of ontologies to search for the class in
     * @returns {MappingOntology} The ontology with the class with the passed IRI
     */
    findSourceOntologyWithClass(classIRI: string, ontologies: MappingOntology[]): MappingOntology {
        return find(ontologies, ontology => findIndex(this.om.getClasses([ontology.entities]), {'@id': classIRI}) !== -1);
    }
    /**
     * Finds the ontology in the passed list of structured ontologies that contains the property
     * with the passed IRI.
     *
     * @param {string} propertyIRI The IRI of the property to search for
     * @param {MappingOntology[]} ontologies The list of ontologies to search for the property in
     * @returns {MappingOntology} The ontology containing the property with the passed IRI
     */
    findSourceOntologyWithProp(propertyIRI: string, ontologies: MappingOntology[]): MappingOntology {
        return find(ontologies, ontology => {
            const properties = concat(this.om.getDataTypeProperties([ontology.entities]), this.om.getObjectProperties([ontology.entities]), this.om.getAnnotations([ontology.entities]));
            return findIndex(properties, {'@id': propertyIRI}) !== -1;
        });
    }
    /**
     * Tests whether a mapping is compatible with the passed listed of structured ontologies. A mapping is
     * incompatible if mapped classes or properties no longer exist or mapped properties have changed
     * property type.
     *
     * @param {Mapping} mapping The mapping JSON-LD array
     * @param {MappingOntology[]} ontologies The array of ontologies to test for compatibility with
     * @returns {boolean} True if the passed list of ontologies have not changed in an incompatible way;
     * false otherwise
     */
    areCompatible(mapping: Mapping, ontologies: MappingOntology[]): boolean {
        return this.findIncompatibleMappings(mapping, ontologies).length === 0;
    }
    /**
     * Finds the list of any Class, Data, or Object Mappings within the passed mapping that are no longer
     * compatible with the passed list of source ontologies. A Class, Data, or Object is incompatible if
     * its IRI doesn't exist in the ontologies or if it has been deprecated. A ObjectMapping is also
     * incompatible if its range has changed or its range class is incompatible. If a DataMapping uses a
     * supported annotation property, it will not be incompatible.
     *
     * @param {Mapping} mapping The mapping JSON-LD array
     * @param {MappingOntology[]} ontologies The list of source ontologies to reference
     * @returns {JSONLDObject[]} All incompatible entities within the mapping
     */
    findIncompatibleMappings(mapping: Mapping, ontologies: MappingOntology[]): JSONLDObject[] {
        const incompatibleMappings = [];
        mapping.getAllClassMappings().forEach(classMapping => {
            const classId = Mapping.getClassIdByMapping(classMapping);
            const classOntology = this.findSourceOntologyWithClass(classId, ontologies);
            // Incompatible if class no longer exists or is deprecated
            if (!classOntology || this.om.isDeprecated(this.om.getEntity([classOntology.entities], classId))) {
                incompatibleMappings.push(classMapping);
            }
        });
        mapping.getAllDataMappings().forEach(propMapping => {
            const propId = Mapping.getPropIdByMapping(propMapping);
            const propOntology = this.findSourceOntologyWithProp(propId, ontologies);
            // Incompatible if data property no longer exists and is not a supported annotation
            if (!propOntology && !includes(this.annotationProperties, propId)) {
                incompatibleMappings.push(propMapping);
            } else if (propOntology) {
                const propObj = this.om.getEntity([propOntology.entities], propId);
                // Incompatible if data property is deprecated or is no longer a data or annotation property
                if (this.om.isDeprecated(propObj) || (!this.om.isDataTypeProperty(propObj) && !this.om.isAnnotation(propObj))) {
                    incompatibleMappings.push(propMapping);
                }
            }
        });
        mapping.getAllObjectMappings().forEach(propMapping => {
            const propId = Mapping.getPropIdByMapping(propMapping);
            const propOntology = this.findSourceOntologyWithProp(propId, ontologies);
            // Incompatible if object property no longer exists
            if (!propOntology) {
                incompatibleMappings.push(propMapping);
            } else {
                const propObj = this.om.getEntity([propOntology.entities], propId);
                // Incompatible if object property is deprecated or is no longer a object property
                if (this.om.isDeprecated(propObj) || !this.om.isObjectProperty(propObj)) {
                    incompatibleMappings.push(propMapping);
                    return;
                }
                const rangeClassId = mapping.getClassIdByMappingId(getPropertyId(propMapping, `${DELIM}classMapping`));
                // Incompatible if range of object property is different
                if (getPropertyId(propObj, `${RDFS}range`) !== rangeClassId) {
                    incompatibleMappings.push(propMapping);
                    return;
                }
                // Incompatible if range of object property is incompatible
                if (find(incompatibleMappings, entityMap => Mapping.getClassIdByMapping(entityMap) === rangeClassId)) {
                    incompatibleMappings.push(propMapping);
                }
            }
        });
        return incompatibleMappings;
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
