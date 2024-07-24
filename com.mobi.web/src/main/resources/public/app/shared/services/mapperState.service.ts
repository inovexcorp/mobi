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
import {
    startsWith,
    get,
    find,
    join,
    union,
    uniq,
    has,
    isEqual,
    remove,
    merge,
    nth,
    last
} from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DATA, DCTERMS, DELIM, ONTOLOGYEDITOR, OWL, RDFS } from '../../prefixes';
import { Difference } from '../models/difference.class';

import { JSONLDObject } from '../models/JSONLDObject.interface';
import { Mapping } from '../models/mapping.class';
import { MappingClass } from '../models/mappingClass.interface';
import { MappingInvalidProp } from '../models/mappingInvalidProp.interface';
import { MappingProperty } from '../models/mappingProperty.interface';
import { MappingRecord } from '../models/mappingRecord.interface';
import { MappingState } from '../models/mappingState.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { splitIRI } from '../pipes/splitIRI.pipe';
import { CatalogManagerService } from './catalogManager.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { MappingManagerService } from './mappingManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { MappingOntologyInfo } from '../models/mappingOntologyInfo.interface';
import { 
    getBeautifulIRI, 
    getDctermsValue, 
    getPropertyId, 
    getPropertyValue, 
    hasPropertyId, 
    removePropertyId, 
    setDctermsValue, 
    updateDctermsValue
} from '../utility';
import { beautify } from '../pipes/beautify.pipe';

/**
 * @class shared.MapperStateService
 *
 * A service which contains various variables to hold the state of the mapping tool page and utility functions to update
 * those variables.
 */
@Injectable()
export class MapperStateService {
    constructor(private mm: MappingManagerService, private cm: CatalogManagerService, private dm: DelimitedManagerService,
        private om: OntologyManagerService) {}

    // Static step indexes
    selectMappingStep = 0;
    fileUploadStep = 1;
    editMappingStep = 2;

    // Queries
    protected CLASSES_QUERY = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    
    SELECT DISTINCT 
      ?iri
      ?name
      (SAMPLE(?descriptions) as ?description) 
      (SAMPLE(?deprecateds) as ?deprecated)
    WHERE {
      BIND("%SEARCH%" as ?search)
      {
        SELECT ?iri (GROUP_CONCAT(?nameOption;separator="�") as ?names)
        WHERE {
          {
            SELECT ?iri ?nameOption
            WHERE {
              {
                ?iri a owl:Class .
                FILTER(ISIRI(?iri))
                BIND(REPLACE(STR(?iri), "^.*?([_\\\\p{L}][-_\\\\p{L}\\\\p{N}]*)$", "$1") as ?nameOption)
                BIND(15 as ?propertyOrder)
              } UNION {
                VALUES (?property ?propertyOrder) { (rdfs:label 2) (dct:title 4) (dc:title 6) (skos:prefLabel 8) (skos:altLabel 10) }
                ?iri a owl:Class ;
                  ?property ?nameOption .
                FILTER(ISIRI(?iri))
                OPTIONAL {
                  ?iri ?property ?nameOption .
                  FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
                  BIND(?propertyOrder - 1 as ?propertyOrder)
                }
              } UNION {
                ?iri a owl:Class ;
                  (skosxl:prefLabel/skosxl:literalForm) ?nameOption .
                FILTER(ISIRI(?iri))
                BIND(13 as ?propertyOrder)
              } UNION {
                ?iri a owl:Class ;
                  (skosxl:altLabel/skosxl:literalForm) ?nameOption .
                FILTER(ISIRI(?iri))
                BIND(14 as ?propertyOrder)
              }
            } ORDER BY ?propertyOrder
          }
        } GROUP BY ?iri
      }
      OPTIONAL {
        ?iri rdfs:comment | dct:description | dc:description ?descriptions .
      }
      OPTIONAL {
        ?iri owl:deprecated ?deprecateds .
      }
      BIND(IF(STRBEFORE(?names, "�") = "", ?names, STRBEFORE(?names, "�")) as ?name)
      FILTER(CONTAINS(LCASE(?name), LCASE(?search)))
    } GROUP BY ?iri ?name ORDER BY LCASE(?name) LIMIT %LIMIT%
    `;

    protected CLASS_QUERY = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

    SELECT DISTINCT 
      ?iri
      ?name
      (SAMPLE(?descriptions) as ?description) 
      (SAMPLE(?deprecateds) as ?deprecated)
    WHERE {
      {
        SELECT ?iri (GROUP_CONCAT(?nameOption;separator="�") as ?names)
        WHERE {
          {
            SELECT ?iri ?nameOption
            WHERE {
              VALUES ?iri { %IRI% }
              {
                ?iri a owl:Class .
                FILTER(ISIRI(?iri))
                BIND(REPLACE(STR(?iri), "^.*?([_\\\\p{L}][-_\\\\p{L}\\\\p{N}]*)$", "$1") as ?nameOption)
                BIND(15 as ?propertyOrder)
              } UNION {
                VALUES (?property ?propertyOrder) { (rdfs:label 2) (dct:title 4) (dc:title 6) (skos:prefLabel 8) (skos:altLabel 10) }
                ?iri a owl:Class ;
                  ?property ?nameOption .
                FILTER(ISIRI(?iri))
                OPTIONAL {
                  ?iri ?property ?nameOption .
                  FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
                  BIND(?propertyOrder - 1 as ?propertyOrder)
                }
              } UNION {
                ?iri a owl:Class ;
                      (skosxl:prefLabel/skosxl:literalForm) ?nameOption .
                FILTER(ISIRI(?iri))
                BIND(13 as ?propertyOrder)
              } UNION {
                ?iri a owl:Class ;
                        (skosxl:altLabel/skosxl:literalForm) ?nameOption .
                FILTER(ISIRI(?iri))
                BIND(14 as ?propertyOrder)
              }
            } ORDER BY ?propertyOrder
          }
        } GROUP BY ?iri
      }
      OPTIONAL {
        ?iri rdfs:comment | dct:description | dc:description ?descriptions .
      }
      OPTIONAL {
        ?iri owl:deprecated ?deprecateds .
      }
      BIND(IF(STRBEFORE(?names, "�") = "", ?names, STRBEFORE(?names, "�")) as ?name)
    } GROUP BY ?iri ?name
    `;

    protected PROPS_QUERY = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    
    SELECT DISTINCT 
      ?iri
      ?type
      ?name
      (SAMPLE(?descriptions) as ?description) 
      (SAMPLE(?deprecateds) as ?deprecated)
      (GROUP_CONCAT(DISTINCT ?range;separator="�") as ?ranges)
    WHERE {
      BIND("%SEARCH%" as ?search)
      {
        SELECT ?iri ?type (GROUP_CONCAT(?nameOption;separator="�") as ?names)
        WHERE {
          {
            SELECT ?iri ?type ?nameOption
            WHERE {
              {
                SELECT DISTINCT ?iri ?type
                WHERE {
                  BIND(<%CLASS%> as ?clazz)
	                VALUES ?type { owl:DatatypeProperty owl:ObjectProperty owl:AnnotationProperty }
              	  {
                    ?iri a ?type .
                    FILTER NOT EXISTS {
                  	  ?iri rdfs:domain ?domain .
                    }
                  } UNION {
	                  ?clazz rdfs:subClassOf* ?domain .
                    ?iri a ?type ;
                      rdfs:domain ?domain .
                  } UNION {
                    ?iri a ?type ;
                      rdfs:domain/owl:unionOf/(rdf:rest*) ?bnode .
                    ?bnode rdf:first/^rdfs:subClassOf* ?clazz .
                  }
                  FILTER(ISIRI(?iri))
                }
              }

              {
            	  ?iri a ?type .
                BIND(REPLACE(STR(?iri), "^.*?([_\\\\p{L}][-_\\\\p{L}\\\\p{N}]*)$", "$1") as ?nameOption)
                BIND(15 as ?propertyOrder)
              } UNION {
                VALUES (?property ?propertyOrder) { (rdfs:label 2) (dct:title 4) (dc:title 6) (skos:prefLabel 8) (skos:altLabel 10) }
                ?iri ?property ?nameOption .
                OPTIONAL {
                  ?iri ?property ?nameOption .
                  FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
                  BIND(?propertyOrder - 1 as ?propertyOrder)
                }
              } UNION {
                ?iri (skosxl:prefLabel/skosxl:literalForm) ?nameOption .
                BIND(13 as ?propertyOrder)
              } UNION {
                ?iri (skosxl:altLabel/skosxl:literalForm) ?nameOption .
                BIND(14 as ?propertyOrder)
              }
            } ORDER BY ?propertyOrder
          }
        } GROUP BY ?iri ?type
      }
      OPTIONAL {
        ?iri rdfs:comment | dct:description | dc:description ?descriptions .
      }
      OPTIONAL {
        ?iri owl:deprecated ?deprecateds .
      }
      OPTIONAL {
        ?iri rdfs:subPropertyOf* ?prop .
        ?prop rdfs:range ?startingRange .
        ?startingRange ^rdfs:subClassOf* ?range .
        FILTER(isIRI(?range))
      }
      BIND(IF(STRBEFORE(?names, "�") = "", ?names, STRBEFORE(?names, "�")) as ?name)
      FILTER(CONTAINS(LCASE(?name), LCASE(?search)))
    } GROUP BY ?iri ?type ?name ORDER BY LCASE(?name) LIMIT %LIMIT%
    `;

    protected PROP_QUERY = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    
    SELECT DISTINCT 
      ?iri
      ?type
      ?name
      (SAMPLE(?descriptions) as ?description) 
      (SAMPLE(?deprecateds) as ?deprecated)
      (GROUP_CONCAT(DISTINCT ?range;separator="�") as ?ranges)
    WHERE {
      {
        SELECT ?iri ?type (GROUP_CONCAT(?nameOption;separator="�") as ?names)
        WHERE {
          {
            SELECT ?iri ?type ?nameOption
            WHERE {
              VALUES (?iri ?type) { %IRI% }
              {
            	  ?iri a ?type .
                BIND(REPLACE(STR(?iri), "^.*?([_\\\\p{L}][-_\\\\p{L}\\\\p{N}]*)$", "$1") as ?nameOption)
                BIND(15 as ?propertyOrder)
              } UNION {
                VALUES (?property ?propertyOrder) { (rdfs:label 2) (dct:title 4) (dc:title 6) (skos:prefLabel 8) (skos:altLabel 10) }
                ?iri a ?type ;
                  ?property ?nameOption .
                OPTIONAL {
                  ?iri ?property ?nameOption .
                  FILTER(LANGMATCHES(LANG(?nameOption), "EN"))
                  BIND(?propertyOrder - 1 as ?propertyOrder)
                }
              } UNION {
                ?iri a ?type ;
                  (skosxl:prefLabel/skosxl:literalForm) ?nameOption .
                BIND(13 as ?propertyOrder)
              } UNION {
                ?iri a ?type ;
                  (skosxl:altLabel/skosxl:literalForm) ?nameOption .
                BIND(14 as ?propertyOrder)
              }
            } ORDER BY ?propertyOrder
          }
        } GROUP BY ?iri ?type
      }
      OPTIONAL {
        ?iri rdfs:comment | dct:description | dc:description ?descriptions .
      }
      OPTIONAL {
        ?iri owl:deprecated ?deprecateds .
      }
      OPTIONAL {
        ?iri rdfs:range ?startingRange .
        ?startingRange ^rdfs:subClassOf* ?range .
        FILTER(isIRI(?range))
      }
      BIND(IF(STRBEFORE(?names, "�") = "", ?names, STRBEFORE(?names, "�")) as ?name)
    } GROUP BY ?iri ?type ?name
    `;

    // Constants
    supportedAnnotations: MappingProperty[] = [
        { iri: `${RDFS}label`, name: 'Label', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
        { iri: `${RDFS}comment`, name: 'Comment', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
        { iri: `${DCTERMS}title`, name: 'Title', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
        { iri: `${DCTERMS}description`, name: 'Description', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
    ];

    // State variables
    /**
     * Controls whether the {@link mapper.EditMappingTabComponent} initializes with the
     * {@link mapper.MappingConfigOverlayComponent} already open.
     * @type {boolean}
     */
    startWithConfigModal = false;
    /**
     * The configuration to be used when retrieving the results of a Mapping Records query. These configurations are the
     * limit, page index, search text, and sort option. The limit and sortOption are not to be changed for now.
     * @type {PaginatedConfig}
     */
    paginationConfig: PaginatedConfig = {
        limit: 10,
        pageIndex: 0,
        searchText: '',
        type: `${DELIM}MappingRecord`,
        sortOption: {
            field: `${DCTERMS}title`,
            label: 'Title',
            asc: true
        }
    };
    /**
     * The total number of Mapping Records found in the {@link mapper.MappingSelectPageComponent}
     * @type {number}
     */
    totalSize = 0;
    /**
     * The mapping object of the mapping being currently viewed/edited.
     * @type {MappingState}
     */
    selected: MappingState = undefined;
    /**
     * A boolean indicating whether or not the mapping page is editing a mapping
     * @type {boolean}
     */
    editMapping = false;
    /**
     * A boolean indicating whether or not the mapping page is creating a new mapping
     * @type {boolean}
     */
    newMapping = false;
    /**
     * A number indicating what step in the mapping process the mapping page is currently on
     * @type {number}
     */
    step = 0;
    /**
     * The index of the selected tab in the {@link mapper.EditMappingPageComponent}
     * @type {number}
     */
    editTabIndex = 0;
    /**
     * An array of objects representing property mappings in the current {@link shared.MapperStateService#selected}
     * that are mapped to non-existent column indexes in the currently loaded
     * {@link shared.DelimitedManagerService#dataRows delimited data}.
     * @type {MappingInvalidProp[]}
     */
    invalidProps: MappingInvalidProp[] = [];
    /**
     * A string with the IRI of the currently selected class mapping.
     * @type {string}
     */
    selectedClassMappingId = '';
    /**
     * A string with the IRI of the currently selected property mapping.
     * @type {string}
     */
    selectedPropMappingId = '';
    /**
     * A boolean indicating whether or not the a new property is being mapped
     * @type {boolean}
     */
    newProp = false;
    /**
     * An array of strings containing column indexes to highlight in the
     * {@link mapper.PreviewDataGridComponent previewDataGrid}.
     * @type {string[]}
     */
    highlightIndexes = [];
    /**
     * A string that will be used to filter the list of mappings.
     * @type {string}
     */
    mappingSearchString = '';
    /**
     * A map of the IRIs from the selected mapping's source ontology imports closure to their respective parent ontology 
     * IRI grouped by entity type.
     */
    iriMap: {
        classes: {[key: string]: string},
        annotationProperties: {[key: string]: string},
        objectProperties: {[key: string]: string},
        dataProperties: {[key: string]: string}
    };

    /**
     * A string that that represents the Mapping Record type.
     * @type {string}
     */
    recordType = DELIM + 'MappingRecord'

    /**
     * Sets the main state variables back to their default values and resets the values of
     * {@link shared.MapperStateService#selected} and {@link shared.MapperStateService#sourceOntologies}.
     */
    initialize(): void {
        this.editMapping = false;
        this.newMapping = false;
        this.step = 0;
        this.editTabIndex = 0;
        this.invalidProps = [];
        this.selected = undefined;
        this.iriMap = undefined;
    }
    /**
     * Sets the edit related state variables back to their default values.
     */
    resetEdit(): void {
        this.selectedClassMappingId = '';
        this.selectedPropMappingId = '';
        this.highlightIndexes = [];
        this.newProp = false;
    }
    /**
     * Resets all the pagination related variables.
     */
     resetPagination(): void {
        this.paginationConfig.pageIndex = 0;
        this.paginationConfig.searchText = '';
        this.totalSize = 0;
    }
    /**
     * Sets the state variables and {@link shared.MapperStateService#sourceOntologies} to indicate creating a new
     * mapping.
     */
    startCreateMapping(): void {
        this.editMapping = true;
        this.newMapping = true;
        this.resetEdit();
    }
    /**
     * Retrieves a mapping based off the provided MappingRecord and returns a {@link MappingState}. Has a
     * {@link Mapping}, {@link MappingRecord}, and an empty {@link Difference} set.
     *
     * @param {MappingRecord} record the mapping record to select
     * @returns {Observable<MappingState>} An Observable with the retrieved {@link MappingState} if successful; 
     *    fails with an error message otherwise 
     */
    getMappingState(record: MappingRecord): Observable<MappingState> {
        return this.mm.getMapping(record.id)
            .pipe(
                switchMap((jsonld: JSONLDObject[]) => {
                    const mappingState: MappingState = {
                        mapping: new Mapping(jsonld),
                        record,
                        difference: new Difference()
                    };
                    const recordId = get(mappingState.mapping.getSourceOntologyInfo(), 'recordId');
                    return this.cm.getRecord(recordId, this.cm.localCatalog['@id'])
                        .pipe(switchMap((ontologyRecord: JSONLDObject[]) => {
                            mappingState.ontology = find(ontologyRecord, ['@id', recordId]);
                            return of(mappingState);
                        }));
                })
            );
    }
    /**
     * Tests whether changes have been made to the opened mapping.
     *
     * @returns {boolean} True if the mapping has been changed; false otherwise
     */
    isMappingChanged(): boolean {
        return get(this.selected, 'difference.additions', []).length > 0 
            || get(this.selected, 'difference.deletions', []).length > 0;
    }
    /**
     * Saves the current mapping appropriately depending on whether it is a new mapping or an existing mapping.
     * 
     * @returns {Observable<string>} An Observable with the IRI of the MappingRecord if successful; fails with an error
     *    message otherwise
     */
    saveMapping(): Observable<string> {
        const catalogId = get(this.cm.localCatalog, '@id', '');
        if (this.newMapping) {
            return this.mm.upload(this.selected.config, this.selected.mapping.getJsonld());
        } else {
            return this.cm.updateInProgressCommit(this.selected.record.id, catalogId, this.selected.difference)
                .pipe(
                    switchMap(() => {
                        const addedNames = (this.selected.difference.additions as JSONLDObject[])
                            .map(diff => this._getChangedEntityName(diff));
                        const deletedNames = (this.selected.difference.deletions as JSONLDObject[])
                            .map(diff => this._getChangedEntityName(diff));
                        const commitMessage = `Changed ${join(union(addedNames, deletedNames), ', ')}`;
                        return this.cm.createBranchCommit(this.selected.record.branch, this.selected.record.id, 
                            catalogId, commitMessage);
                    }),
                    map(() => this.selected.record.id)
                );
        }
    }
    /**
     * Retrieves and saves the master branch of the current mapping for use on the
     * {@link mapper.MappingCommitsPageComponent}.
     * 
     * @returns {Observable<null>} An Observable indicating the success of the operation.
     */
    setMasterBranch(): Observable<null> {
        const catalogId = get(this.cm.localCatalog, '@id', '');
        return this.cm.getRecordMasterBranch(this.selected.record.id, catalogId)
            .pipe(switchMap((branch: JSONLDObject) => {
                this.selected.branch = branch;
                return of(null);
            }));
    }
    /**
     * Finds the list of any Class, Data, or Object Mappings within the passed mapping that are no longer compatible
     * with the imports closure of the associated OntologyRecord. A Class, Data, or Object is incompatible if its IRI
     * doesn't exist in the ontologies, is not longer the correct type, or if it has been deprecated. An ObjectMapping
     * is also incompatible if its range has changed or its range class is incompatible. If a DataMapping uses a
     * supported annotation property, it will not be incompatible. Returns the final list as an Observable.
     * 
     * @param {Mapping} mapping The Mapping to validate
     * @returns {Observable<JSONLDObject[]>} An Observable with the list of incompatible mappings if successful; returns
     *    with an empty array if an error occurs
     */
    findIncompatibleMappings(mapping: Mapping): Observable<JSONLDObject[]> {
        // Collect the unique list of class IRIs and their associated ClassMappings
        const classIRIsToMappings: { [key: string]: JSONLDObject[] } = {};
        mapping.getAllClassMappings().forEach(classMapping => {
            const classId = Mapping.getClassIdByMapping(classMapping);
            if (!classIRIsToMappings[classId]) {
                classIRIsToMappings[classId] = [];
            }
            classIRIsToMappings[classId].push(classMapping);
        });
        // Collect the unique list of data/annotation property IRIs and their associated DataMappings
        const propIRIsToDataMappings: { [key: string]: JSONLDObject[] } = {};
        mapping.getAllDataMappings().forEach(propMapping => {
            const propId = Mapping.getPropIdByMapping(propMapping);
            // Filter out any supported annotations since they _shouldn't_ be found in the imports closure
            if (!this.supportedAnnotations.find(ann => ann.iri === propId)) {
                if (!propIRIsToDataMappings[propId]) {
                  propIRIsToDataMappings[propId] = [];
                }
                propIRIsToDataMappings[propId].push(propMapping);
            }
        });
        // Collect the unique list of object property IRIs and their associated ObjectMappings
        const propIRIsToObjectMappings: { [key: string]: JSONLDObject[] } = {};
        mapping.getAllObjectMappings().forEach(propMapping => {
            const propId = Mapping.getPropIdByMapping(propMapping);
            if (!propIRIsToObjectMappings[propId]) {
              propIRIsToObjectMappings[propId] = [];
            }
            propIRIsToObjectMappings[propId].push(propMapping);
        });
        const ontInfo = mapping.getSourceOntologyInfo();
        const classIRIs = Object.keys(classIRIsToMappings);
        const dataPropIRIs = Object.keys(propIRIsToDataMappings);
        const objPropIRIs = Object.keys(propIRIsToObjectMappings);
        // Fetch metadata about the specific classes and properties within the mapping
        const obs = [classIRIs.length > 0 ? this.retrieveSpecificClasses(ontInfo, classIRIs) : of([])].concat(
            objPropIRIs.length > 0 || dataPropIRIs.length > 0 ? this.retrieveSpecificProps(ontInfo, 
                objPropIRIs.map(iri => ({ iri, type: `${OWL}ObjectProperty` }))
                    .concat(dataPropIRIs.map(iri => ({ iri, type: `${OWL}DatatypeProperty` })))
                    .concat(dataPropIRIs.map(iri => ({ iri, type: `${OWL}AnnotationProperty` })))) : of([])
        );
        return forkJoin(obs).pipe(
            map(responses => {
                let incompatibleMappings = [];
                classIRIs.forEach(classIRI => {
                    const mappingClass = responses[0].find(mappingClass => mappingClass.iri === classIRI);
                    // All mappings incompatible if class could not be found or is deprecated
                    if (!mappingClass || mappingClass.deprecated) {
                        incompatibleMappings = incompatibleMappings.concat(classIRIsToMappings[classIRI]);
                    }
                });
                dataPropIRIs.forEach(propIRI => {
                    const mappingProperty = responses[1].find(mappingProperty => mappingProperty.iri === propIRI);
                    // All mappings incompatible if object property could not be found, switched types, or is deprecated
                    if (!mappingProperty || mappingProperty.deprecated 
                      || ![`${OWL}DatatypeProperty`, `${OWL}AnnotationProperty`].includes(mappingProperty.type)) {
                        incompatibleMappings = incompatibleMappings.concat(propIRIsToDataMappings[propIRI]);
                    }
                });
                objPropIRIs.forEach(propIRI => {
                    const mappingProperty = responses[1].find(mappingProperty => mappingProperty.iri === propIRI);
                    // All mappings incompatible if object property could not be found, switched types, or is deprecated
                    if (!mappingProperty || mappingProperty.deprecated 
                      || mappingProperty.type !== `${OWL}ObjectProperty`) {
                        incompatibleMappings = incompatibleMappings.concat(propIRIsToObjectMappings[propIRI]);
                        return;
                    }
                    // For each specific mapping
                    propIRIsToObjectMappings[propIRI].forEach(propMapping => {
                        const rangeClassId = mapping.getClassIdByMappingId(getPropertyId(propMapping, 
                            `${DELIM}classMapping`));
                        // Incompatible if class of range class mapping is not in object property range options
                        if (!mappingProperty.ranges.includes(rangeClassId)) {
                            incompatibleMappings.push(propMapping);
                            return;
                        }
                        // Incompatible if range class mapping of property mapping is incompatible
                        if (incompatibleMappings.find(incomMapping => 
                          Mapping.getClassIdByMapping(incomMapping) === rangeClassId)) {
                            incompatibleMappings.push(propMapping);
                        }
                    });
                });
                return incompatibleMappings;
            }),
            catchError(error => {
                console.error(error);
                return of([]);
            })
        );
    }
    /**
     * Validates the current {@link shared.MapperStateService#selected} against the currently loaded
     * {@link shared.DelimitedManagerService delimited data} and sets
     * {@link shared.MapperStateService#invalidProps} to the list of data properties in the mapping that link to
     * columns that don't exist in the delimited data.
     */
    setInvalidProps(): void {
        this.invalidProps = this.selected.mapping.getAllDataMappings()
            .map(dataMapping => {
                const classMapping = this.selected.mapping.findClassWithDataMapping(dataMapping['@id']);
                return {
                    id: dataMapping['@id'],
                    index: parseInt(getPropertyValue(dataMapping, `${DELIM}columnIndex`), 10),
                    dataPropName: this.mm.getPropMappingTitle(getDctermsValue(classMapping, 'title'),
                        getDctermsValue(dataMapping, 'title'))
                } as MappingInvalidProp;
            })
            .filter(propObj => propObj.index > this.dm.dataRows[0].length - 1)
            .sort((a, b) => a.index - b.index);
    }
    /**
     * Finds all of the column indexes that have been mapped to data mappings in the currently selected
     * {@link shared.MapperStateService#selected}.
     *
     * @returns {string[]} an array of strings of column indexes that have been mapped
     */
    getMappedColumns(): string[] {
        return uniq(this.selected.mapping.getAllDataMappings()
            .map(dataMapping => getPropertyValue(dataMapping, `${DELIM}columnIndex`)));
    }
    /**
     * Updates the additions and deletions of the current mapping appropriately when a single property
     * value is changed.
     *
     * @param {string} entityId The id of the entity in the mapping whose property value was changed
     * @param {string} propId The id of the property that was changed
     * @param {string} newValue The new value of the property
     * @param {string} originalValue The original value of the property
     * @param {boolean} isId True if it has an '@id'
     */
    changeProp(entityId: string, propId: string, newValue: string, originalValue: string, isId = false): void {
        if (newValue !== originalValue) {
            const valueKey = isId ? '@id' : '@value';
            let additionsObj = find(this.selected.difference.additions as JSONLDObject[], {'@id': entityId});
            let deletionsObj = find(this.selected.difference.deletions as JSONLDObject[], {'@id': entityId});
            if (additionsObj) {
                const deletionsValue = isId ? getPropertyId(deletionsObj, propId) 
                    : getPropertyValue(deletionsObj, propId);
                if (deletionsValue === newValue) {
                    delete additionsObj[propId];
                    if (isEqual(additionsObj, {'@id': entityId})) {
                        remove(this.selected.difference.additions as JSONLDObject[], additionsObj);
                    }
                    delete deletionsObj[propId];
                    if (isEqual(deletionsObj, {'@id': entityId})) {
                        remove(this.selected.difference.deletions as JSONLDObject[], deletionsObj);
                    }
                } else {
                    additionsObj[propId] = [{[valueKey]: newValue}];
                    if (deletionsObj && originalValue && !has(deletionsObj, `['${propId}']`)) {
                        deletionsObj[propId] = [{[valueKey]: originalValue}];
                    }
                }
            } else {
                additionsObj = {'@id': entityId, [propId]: [{[valueKey]: newValue}]};
                (this.selected.difference.additions as JSONLDObject[]).push(additionsObj);

                if (originalValue) {
                    deletionsObj = {'@id': entityId, [propId]: [{[valueKey]: originalValue}]};
                    (this.selected.difference.deletions as JSONLDObject[]).push(deletionsObj);
                }
            }
        }
    }
    /**
     * Adds a ClassMapping for the class identified by the passed class ID object and updates the additions
     * and ClassMapping titles appropriately.
     *
     * @param {MappingClass} classIdObj An ID object for a class in an ontology
     * @returns {JSONLDObject} The ClassMapping JSON-LD that was added
     */
    addClassMapping(classDetails: MappingClass): JSONLDObject {
        const ontologyId = this.iriMap?.classes[classDetails.iri];
        if (!ontologyId) {
            return;
        }
        const splitIri = splitIRI(classDetails.iri);
        const ontologyDataName = splitIRI(ontologyId).end;
        const originalClassMappings = this.selected.mapping.getClassMappingsByClassId(classDetails.iri);
        const classMapping = this.selected.mapping.addClassMapping(classDetails.iri, 
            `${DATA}${ontologyDataName}/${splitIri.end.toLowerCase()}/`);
        if (!originalClassMappings.length) {
              setDctermsValue(classMapping, 'title', classDetails.name);
        } else {
            originalClassMappings.forEach(classMapping => {
                if (getDctermsValue(classMapping, 'title') === classDetails.name) {
                    updateDctermsValue(classMapping, 'title', `${classDetails.name} (1)`);
                    this.changeProp(classMapping['@id'], `${DCTERMS}title`, `${classDetails.name} (1)`, 
                        classDetails.name);
                    return false;
                }
            });
            this._setNewTitle(classMapping, classDetails.name, originalClassMappings);
        }
        (this.selected.difference.additions as JSONLDObject[]).push(Object.assign({}, classMapping));
        return classMapping;
    }
    /**
     * Adds a DataMapping for the data property identified by the passed property ID object and updates the
     * additions and adds a title appropriately.
     *
     * @param {MappingProperty} propIdObj An ID object for a property in an ontology
     * @param {string} classMappingId The ID of the ClassMapping the DataMapping should be added to
     * @param {string} columnIndex The column index the DataMapping should point to
     * @param {string} datatypeSpec The default datatype the DataMapping should use
     * @param {string} languageSpec The default language tag the DataMapping should use
     * @returns {JSONLDObject} The DataMapping JSON-LD that was added
     */
    addDataMapping(propDetails: MappingProperty, classMappingId: string, columnIndex: number, datatypeSpec?: string,
      languageSpec?: string): JSONLDObject {
        const ontologyId = this.iriMap?.dataProperties[propDetails.iri] 
            || this.iriMap?.annotationProperties[propDetails.iri];
        if (this.selected.mapping.hasClassMapping(classMappingId) 
          && ((ontologyId && [`${OWL}DatatypeProperty`, `${OWL}AnnotationProperty`].includes(propDetails.type)) 
          || this.supportedAnnotations.includes(propDetails))) {
            const propMapping = this.selected.mapping.addDataPropMapping(propDetails.iri, columnIndex, classMappingId, 
                datatypeSpec, languageSpec);
            setDctermsValue(propMapping, 'title', propDetails.name);
            (this.selected.difference.additions as JSONLDObject[]).push(Object.assign({}, propMapping));
            return propMapping;
        }
        return;
    }
    /**
     * Adds a ObjectMapping for the data property identified by the passed property ID object and updates the
     * additions and adds a title appropriately.
     *
     * @param {MappingProperty} propIdObj An ID object for a property in an ontology
     * @param {string} classMappingId The ID of the ClassMapping the ObjectMapping should be added to
     * @param {string} rangeClassMappingId The ID of the ClassMapping the ObjectMapping should point to
     * @returns {JSONLDObject} The ObjectMapping JSON-LD that was added
     */
    addObjectMapping(propDetails: MappingProperty, classMappingId: string, rangeClassMappingId: string): JSONLDObject {
        const ontologyId = this.iriMap?.objectProperties[propDetails.iri];
        const rangeClassMapping = this.selected.mapping.getClassMapping(rangeClassMappingId);
        if (this.selected.mapping.hasClassMapping(classMappingId) && rangeClassMapping && ontologyId 
            && propDetails.type === `${OWL}ObjectProperty`) {
            const propMapping = this.selected.mapping.addObjectPropMapping(propDetails.iri, classMappingId, rangeClassMappingId);
            setDctermsValue(propMapping, 'title', propDetails.name);
            (this.selected.difference.additions as JSONLDObject[]).push(Object.assign({}, propMapping));
            return propMapping;
        }

        return;
    }
    /**
     * Updates the additions and deletions of the current mapping appropriately when an entity is deleted.
     *
     * @param {JSONLDObject} entity The JSON-LD object of the entity to delete
     */
    deleteEntity(entity: JSONLDObject): void {
        const additionsObj = find((this.selected.difference.additions as JSONLDObject[]), {'@id': entity['@id']});
        if (isEqual(Object.assign({}, additionsObj), Object.assign({}, entity))) {
            remove((this.selected.difference.additions as JSONLDObject[]), additionsObj);
        } else {
            const deletionObj = find((this.selected.difference.deletions as JSONLDObject[]), {'@id': entity['@id']});
            if (deletionObj) {
                merge(deletionObj, entity);
            } else {
                (this.selected.difference.deletions as JSONLDObject[]).push(Object.assign({}, entity));
            }
        }
    }
    /**
     * Deletes a ClassMapping with the provided id from the current mapping, updating the additions and
     * deletions appropriately for all properties that point to the ClassMapping and the properties on the
     * ClassMapping.
     *
     * @param {string} classMappingId The id of the ClassMapping to delete.
     */
    deleteClass(classMappingId: string): void {
        const propsLinkingToClass = this.selected.mapping.getPropsLinkingToClass(classMappingId).map(propMapping => ({
            propMapping,
            classMappingId: this.selected.mapping.findClassWithObjectMapping(propMapping['@id'])['@id']
        }));
        const classMappingProps = this.selected.mapping.getPropMappingsByClass(classMappingId);
        const deletedClass = this.selected.mapping.removeClassMapping(classMappingId);
        this.deleteEntity(deletedClass);
        classMappingProps.forEach(propMapping => {
            remove(this.invalidProps, {id: propMapping['@id']});
            this.deleteEntity(propMapping);
        });
        propsLinkingToClass.forEach(obj => this._cleanUpDeletedProp(obj.propMapping, obj.classMappingId));
        const classId = Mapping.getClassIdByMapping(deletedClass);
        const classMappings = this.selected.mapping.getClassMappingsByClassId(classId);
        if (classMappings.length === 1) {
            const lastClassMapping = classMappings[0];
            const originalTitle = getDctermsValue(lastClassMapping, 'title');
            const newTitle = originalTitle.replace(/ \((\d+)\)$/, '');
            updateDctermsValue(lastClassMapping, 'title', newTitle);
            this.changeProp(lastClassMapping['@id'], `${DCTERMS}title`, newTitle, originalTitle);
        }
    }
    /**
     * Deletes a PropertyMapping with the provided id from the current mapping, updating the additions and
     * deletions appropriately for the parent ClassMapping.
     *
     * @param {string} propMappingId The id of the PropertyMapping to delete
     * @param {string} parentClassMappingId The id of the parent ClassMapping for the PropertyMapping
     */
    deleteProp(propMappingId: string, parentClassMappingId: string): void {
        const deletedProp = this.selected.mapping.removePropMapping(parentClassMappingId, propMappingId);
        this._cleanUpDeletedProp(deletedProp, parentClassMappingId);
    }
    /**
     * Sets the map of entity IRIs to ontology IRIs from the imports closure of source ontology of the currently
     * selected {@link Mapping}. Returns an Observable indicating the success of the request.
     * 
     * @returns {Observable<null>} An Observable indicating the success of the operation.
     */
    setIriMap(): Observable<null> {
        const ontInfo = this.selected.mapping.getSourceOntologyInfo();
        const ontIri = getPropertyId(this.selected.ontology, `${ONTOLOGYEDITOR}ontologyIRI`);
        return forkJoin([
            this.om.getIris(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId),
            this.om.getImportedIris(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId)
        ]).pipe(map(response => {
            this.iriMap = {
                classes: {},
                annotationProperties: {},
                objectProperties: {},
                dataProperties: {}
            };
            ['classes', 'dataProperties', 'objectProperties', 'annotationProperties'].forEach(key => {
                response[0][key].forEach(iri => {
                    this.iriMap[key][iri] = ontIri;
                });
                if (response[1]) {
                    response[1].forEach(iriList => {
                        iriList[key].forEach(iri => {
                            this.iriMap[key][iri] = iriList.id;
                        });
                    });
                }
            });
            return null;
        }));
    }
    /**
     * Retrieves the list of classes within the imports closure of the OntologyRecord represented by the provided
     * {@link MappingOntologyInfo} in the form of an array of {@link MappingClass} objects with important metadata.
     * Accomplished through the use of a SPARQL query with a specified limit to the results and supports optional search
     * text.
     * 
     * @param {MappingOntologyInfo} ontInfo The metadata about which OntologyRecord to search within
     * @param {string} searchText Optional text to filter the list of classes by. Searches over the calculated names of
     *    the classes. Can be an empty string.
     * @param {number} [limit=100] An optional limit to apply to the list of results. Defaults to 100.
     * @returns {Observable<MappingClass[]>} An Observable with an unsorted array of {@link MappingClass} collected from
     *    the entire imports closure of the ontology if successful; fails with an error message otherwise
     */
    retrieveClasses(ontInfo: MappingOntologyInfo, searchText: string, limit = 100, isTracked = false): Observable<MappingClass[]> {
        const query = this.CLASSES_QUERY.replace('%SEARCH%', searchText).replace('%LIMIT%', `${limit}`);
        return this.om.postQueryResults(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, query, 'application/json', 
          true, false, isTracked)
            .pipe(map(response => {
                if (!response) {
                  return [];
                }
                return (response as SPARQLSelectResults).results.bindings.map(binding => ({
                    iri: binding['iri'].value,
                    name: beautify(binding['name'].value),
                    description: binding['description']?.value || '',
                    deprecated: ['true', '1', 'TRUE'].includes(binding['deprecated']?.value) || false
                }));
            }));
    }
    /**
     * Retrieves details about specific classes based off their IRIs within the imports closure of the OntologyRecord
     * associated with the currently selected {@link Mapping} in the form of a {@link MappingClass} array. Accomplished
     * through the  use of a SPARQL query. If the classes are not found, Observable contains an empty array.
     * 
     * @param {string[]} iris The IRI strings of the specific classes to retrieve
     * @returns {Observable<MappingClass>} An Observable with the array of {@link MappingClass} about the identified OWL
     *    classes or an empty array if successful; fails with an error message otherwise. 
     */
    retrieveSpecificClasses(ontInfo: MappingOntologyInfo, iris: string[]): Observable<MappingClass[]> {
      const query = this.CLASS_QUERY.replace('%IRI%', iris.map(iri => `<${iri}>`).join(' '));
      return this.om.postQueryResults(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, query, 'application/json')
          .pipe(map(response => {
              if (!response) {
                return [];
              }
              return (response as SPARQLSelectResults).results.bindings.map(binding => ({
                iri: binding['iri'].value,
                name: beautify(binding['name'].value),
                description: binding['description']?.value || '',
                deprecated: ['true', '1', 'TRUE'].includes(binding['deprecated']?.value) || false
              }));
          }));
    }
    /**
     * Retrieves the list of properties for a specific class IRI within the imports closure of the OntologyRecord
     * associated with the currently selected {@link Mapping} in the form of an array of {@link MappingProperty} objects
     * with important metadata. Accomplished through the use of a SPARQL query with a specified limit to the results and
     * supports optional search text.
     * 
     * @param {string} classIri The IRI of the Class to find properties for.
     * @param {string} searchText Optional text to filter the list of classes by. Searches over the calculated names of
     *    the classes. Can be an empty string.
     * @param {number} [limit=100] An optional limit to apply to the list of results. Defaults to 100.
     * @returns {Observable<MappingProperty[]>} An Observable with a sorted array of {@link MappingProperty} collected
     *    from the entire imports closure of the ontology if successful; fails with an error message otherwise
     */
    retrieveProps(ontInfo: MappingOntologyInfo, classIri: string, searchText: string, limit = 100, isTracked = false): 
      Observable<MappingProperty[]> {
        const query = this.PROPS_QUERY
            .replace('%CLASS%', classIri)
            .replace('%SEARCH%', searchText)
            .replace('%LIMIT%', `${limit}`);
        return this.om.postQueryResults(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, query, 'application/json', 
          true, false, isTracked)
            .pipe(map(response => {
                if (!response) {
                    return [];
                }
                return (response as SPARQLSelectResults).results.bindings.map(binding => ({
                    iri: binding['iri'].value,
                    type: binding['type'].value,
                    name: binding['name'].value,
                    description: binding['description']?.value || '',
                    deprecated: ['true', '1', 'TRUE'].includes(binding['deprecated']?.value) || false,
                    ranges: binding['ranges']?.value ? binding['ranges']?.value.split('�') : []
                }));
            }));
    }

    /**
     * Retrieves details about specific properties based off their IRIs and property types within the imports closure of
     * the OntologyRecord associated with the currently selected {@link Mapping} in the form of a
     * {@link MappingProperty} array. Accomplished through the  use of a SPARQL query. If the properties are not found, 
     * Observable contains an empty array.
     * 
     * @param {{iri: string, type: string}[]} iris An array of IRIs and associated property types (owl:ObjectProperty, 
     *    owl:DatatypeProperty, owl:AnnotationProperty)
     * @returns {Observable<MappingProperty[]>} An Observable with the array of {@link MappingProperty} about the
     *    identified OWL properties or an empty array if successful; fails with an error message otherwise. 
     */
    retrieveSpecificProps(ontInfo: MappingOntologyInfo, iris: {iri: string, type: string}[]): 
      Observable<MappingProperty[]> {
        const query = this.PROP_QUERY.replace('%IRI%', iris.map(iri => `(<${iri.iri}> <${iri.type}>)`).join(' '));
        return this.om.postQueryResults(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, query, 'application/json')
            .pipe(map(response => {
                if (!response) {
                    return [];
                }
                return (response as SPARQLSelectResults).results.bindings.map(binding => ({
                    iri: binding['iri'].value,
                    type: binding['type'].value,
                    name: beautify(binding['name'].value),
                    description: binding['description']?.value || '',
                    deprecated: ['true', '1', 'TRUE'].includes(binding['deprecated']?.value) || false,
                    ranges: binding['ranges']?.value ? binding['ranges']?.value.split('�') : []
                }));
            }));
    }

    private _cleanUpDeletedProp(propMapping, parentClassMappingId) {
        this.deleteEntity(propMapping);
        const additionsObj = find(this.selected.difference.additions as JSONLDObject[], {'@id': parentClassMappingId});
        const prop = DELIM + (this.mm.isDataMapping(propMapping) ? 'dataProperty' : 'objectProperty');
        if (hasPropertyId(additionsObj, prop, propMapping['@id'])) {
            removePropertyId(additionsObj, prop, propMapping['@id']);
            if (isEqual(additionsObj, {'@id': parentClassMappingId})) {
                remove(this.selected.difference.additions as JSONLDObject[], additionsObj);
            }
        } else {
            const deletionsObj = find(this.selected.difference.deletions as JSONLDObject[], {'@id': parentClassMappingId});
            if (deletionsObj) {
                if (!has(deletionsObj, `['${prop}']`)) {
                    deletionsObj[prop] = [];
                }
                deletionsObj[prop].push({'@id': propMapping['@id']});
            } else {
                (this.selected.difference.deletions as JSONLDObject[]).push({'@id': parentClassMappingId, [prop]: [{'@id': propMapping['@id']}]});
            }
        }
        remove(this.invalidProps, {id: propMapping['@id']});
    }
    private _getChangedEntityName(diffObj) {
        const entity = find(this.selected.mapping.getJsonld(), {'@id': diffObj['@id']}) || diffObj;
        return getDctermsValue(entity, 'title') || getBeautifulIRI(diffObj['@id']);
    }
    private _setNewTitle(classMapping: JSONLDObject, className: string, existingClassMappings: JSONLDObject[]) {
        const regex = / \((\d+)\)$/;
        const sortedNums = existingClassMappings
            // Collect all titles that start with the name of the passed entity
            .map(obj => getDctermsValue(obj, 'title'))
            .filter(title => startsWith(title, className))
            // Collect the index number based on the set string format
            .map(title => parseInt(nth(regex.exec(title), 1), 10))
            .sort((a, b) => a - b);

        // If there are no missing numbers, newIdx is the next number
        let newIdx = ` (${last(sortedNums) + 1})`;
        for (let i = 1; i < sortedNums.length; i++) {
            // If there is a missing number between this index and the index of the previous title,
            // newIdx is one more than previous
            if (sortedNums[i] - sortedNums[i - 1] !== 1) {
                newIdx = ` (${sortedNums[i - 1] + 1})`;
                break;
            }
        }
        setDctermsValue(classMapping, 'title', className + newIdx);
    }
}
