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
import { Injectable } from '@angular/core';
import {
    startsWith,
    get,
    find,
    set,
    join,
    union,
    uniq,
    has,
    unset,
    concat,
    isEqual,
    remove,
    merge,
    nth,
    last
} from 'lodash';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DCTERMS, DELIM, MAPPINGS } from '../../prefixes';
import { Difference } from '../models/difference.class';

import { JSONLDObject } from '../models/JSONLDObject.interface';
import { Mapping } from '../models/mapping.class';
import { MappingClass } from '../models/mappingClass.interface';
import { MappingInvalidProp } from '../models/mappingInvalidProp.interface';
import { MappingOntology } from '../models/mappingOntology.interface';
import { MappingProperty } from '../models/mappingProperty.interface';
import { MappingRecord } from '../models/mappingRecord.interface';
import { MappingState } from '../models/mappingState.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { splitIRI } from '../pipes/splitIRI.pipe';
import { CatalogManagerService } from './catalogManager.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { MappingManagerService } from './mappingManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { getBeautifulIRI, getDctermsValue, getPropertyId, getPropertyValue, hasPropertyId, removePropertyId, setDctermsValue } from '../utility';

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
     * An array of all the ontologies used for the currently selected mapping. This includes the source ontology as
     * specified by the mapping array and the imports closure of that ontology.
     * @type {MappingOntology[]}
     */
    sourceOntologies: MappingOntology[] = [];
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
     * `availableClasses` holds an array of objects representing the classes from all source ontologies.
     * @type {MappingClass[]}
     */
    availableClasses: MappingClass[] = [];
    /**
     * An object with keys for classes in the imports closure of the currently selected
     * {@link shared.MapperStateService#selected} and values of all properties that can be set for the class.
     */
    propsByClass: {
        [key: string]: MappingProperty[]
    } = {};
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
     * A string that will be used to filter the {@link mappingList.directive:mappingList mapping list}.
     * @type {string}
     */
    mappingSearchString = '';

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
        this.propsByClass = {};
        this.availableClasses = [];
        this.selected = undefined;
        this.sourceOntologies = [];
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
        this.sourceOntologies = [];
        this.resetEdit();
        this.propsByClass = {};
    }
    /**
     * Retrieves and selects a mapping to the provided record.
     *
     * @param {MappingRecord} record the mapping record to select
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
     * @return {boolean} True if the mapping has been changed; false otherwise
     */
    isMappingChanged(): boolean {
        return get(this.selected, 'difference.additions', []).length > 0 || get(this.selected, 'difference.deletions', []).length > 0;
    }
    /**
     * Saves the current mapping appropriately depending on whether it is a new mapping or an existing mapping.
     */
    saveMapping(): Observable<string> {
        const catalogId = get(this.cm.localCatalog, '@id', '');
        if (this.newMapping) {
            return this.mm.upload(this.selected.config, this.selected.mapping.getJsonld());
        } else {
            return this.cm.updateInProgressCommit(this.selected.record.id, catalogId, this.selected.difference)
                .pipe(
                    switchMap(() => {
                        const addedNames = (this.selected.difference.additions as JSONLDObject[]).map(diff => this._getChangedEntityName(diff));
                        const deletedNames = (this.selected.difference.deletions as JSONLDObject[]).map(diff => this._getChangedEntityName(diff));
                        const commitMessage = `Changed ${join(union(addedNames, deletedNames), ', ')}`;
                        return this.cm.createBranchCommit(this.selected.record.branch, this.selected.record.id, catalogId, commitMessage);
                    }),
                    map(() => this.selected.record.id)
                );
        }
    }
    /**
     * Retrieves and saves the master branch of the current mapping for use on the
     * {@link mapper.MappingCommitsPageComponent mappingCommitsPage}.
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
                    dataPropName: this.mm.getPropMappingTitle(getDctermsValue(classMapping, 'title'), getDctermsValue(dataMapping, 'title'))
                } as MappingInvalidProp;
            })
            .filter(propObj => propObj.index > this.dm.dataRows[0].length - 1)
            .sort((a, b) => a.index - b.index);
    }
    /**
     * Finds all of the column indexes that have been mapped to data mappings in the currently selected
     * {@link shared.MapperStateService#selected}.
     *
     * @return {string[]} an array of strings of column indexes that have been mapped
     */
    getMappedColumns(): string[] {
        return uniq(this.selected.mapping.getAllDataMappings().map(dataMapping => getPropertyValue(dataMapping, `${DELIM}columnIndex`)));
    }
    /**
     * Returns the boolean indicating whether a class has properties to map.
     *
     * @param {string} classId The id of the class to check
     * @return {boolean} True if there are properties to map for the class; false otherwise.
     */
    hasProps(classId: string): boolean {
        return get(this.propsByClass, encodeURIComponent(classId), []).length > 0;
    }
    /**
     * Returns the boolean indicating whether the class of a class mapping has properties to map.
     *
     * @param {string} classMappingId The id of the class mapping to check
     * @return {boolean} True if there are properties to map for the class mapping's class; false otherwise.
     */
    hasPropsByClassMappingId(classMappingId: string): boolean {
        return this.hasProps(this.selected.mapping.getClassIdByMappingId(classMappingId));
    }
    /**
     * Returns the boolean indicating whether the properties for a class have been retrieved.
     *
     * @param {string} classId The id of the class to check
     * @return {boolean} True if properties have been retrieved for the class; false otherwise.
     */
    hasPropsSet(classId: string): boolean {
        return has(this.propsByClass, encodeURIComponent(classId));
    }
    /**
     * Returns the boolean indicating whether the properties for a class mapping's class have been retrieved.
     *
     * @param {string} classMappingId The id of the class mapping to check
     * @return {boolean} True if properties have been retrieved for the class of a class mapping; false
     * otherwise.
     */
    hasPropsSetByClassMappingId(classMappingId: string): boolean {
        return this.hasPropsSet(this.selected.mapping.getClassIdByMappingId(classMappingId));
    }
    /**
     * Removes a key-value pair from `propsByClass` using the passed class id.
     *
     * @param {string} classId The id of a class to remove from the props list.
     */
    removeProps(classId: string): void {
        unset(this.propsByClass, encodeURIComponent(classId));
    }
    /**
     * Removes a key-value pair from `propsByClass` using the passed class mapping id.
     *
     * @param {string} classId The id of a class mapping whose class will be removed from the props list.
     */
    removePropsByClassMappingId(classMappingId: string): void {
        this.removeProps(this.selected.mapping.getClassIdByMappingId(classMappingId));
    }
    /**
     * Sets the value for a class in `propsByClass` to an array of objects representing properties that can be
     * set for that class.
     *
     * @param {string} classId The id of the class to set the array of property objects for
     */
    setProps(classId: string): void {
        const annotations = this.mm.annotationProperties.map(id => ({
            ontologyId: splitIRI(id).begin,
            propObj: {'@id': id},
            name: getBeautifulIRI(id),
            isDeprecated: false,
            isObjectProperty: false
        }));
        const props = concat(this.getClassProps(this.sourceOntologies, classId), annotations);
        set(this.propsByClass, encodeURIComponent(classId), props);
    }
    /**
     * Sets the value for the class of a class mapping in `propsByClass` to an array of objects representing
     * properties that can be set for that class.
     *
     * @param {string} classMappingId The id of the class mapping to set the array of property objects for
     */
    setPropsByClassMappingId(classMappingId: string): void {
        this.setProps(this.selected.mapping.getClassIdByMappingId(classMappingId));
    }
    /**
     * Retrieves an array of property objects representing the properties that can be set for the class with
     * the passed id.
     *
     * @param {string} classId The id of the class to retrieve available properties of
     * @return {MappingProperty[]} An array of property objects that can be set on the class
     */
    getProps(classId: string): MappingProperty[] {
        return get(this.propsByClass, encodeURIComponent(classId), []);
    }
    /**
     * Retrieves an array of property objects representing the properties that can be set for the class mapping
     * with the passed id.
     *
     * @param {string} classMappingId The id of the class mapping to retrieve available properties of
     * @return {MappingProperty[]} An array of property objects that can be set on the class
     */
    getPropsByClassMappingId(classMappingId: string): MappingProperty[] {
        return this.getProps(this.selected.mapping.getClassIdByMappingId(classMappingId));
    }
    /**
     * Collects a list of objects representing the properties that can be mapped for a class from
     * a list of ontologies created by the {@link shared.MappingManagerService}.
     *
     * @param {MappingOntology[]} ontologies A list of ontology objects to collect properties from
     * @param {string} classId The id of the class to collect properties for
     * @return {MappingProperty[]} An array of objects with a property object and parent ontology id of properties
     * that can be mapped for the specified class.
     */
    getClassProps(ontologies: MappingOntology[], classId: string): MappingProperty[] {
        let props: MappingProperty[] = [];
        ontologies.forEach(ontology => {
            const merged = [
                ...this.om.getClassProperties([ontology.entities], classId),
                ...this.om.getNoDomainProperties([ontology.entities]),
                ...this.om.getAnnotations([ontology.entities])
            ];
            const classProps = [...new Set(merged)].filter(prop => !(this.om.isObjectProperty(prop) && this.om.isDataTypeProperty(prop)));
            props = union(props, classProps.map(prop => ({
                ontologyId: ontology.id,
                propObj: prop,
                name: this.om.getEntityName(prop),
                isDeprecated: this.om.isDeprecated(prop),
                isObjectProperty: this.om.isObjectProperty(prop)
            })));
        });
        return props;
    }
    /**
     * Collects a list of objects representing all the classes from a list of ontologies created by the
     * {@link shared.MappingManagerService}
     *
     * @param {MappingOntology[]} ontologies A list of ontology objects to collect properties from
     * @return {MappingClass[]} An array of objects with the class object and parent ontology id of classes
     */
    getClasses(ontologies: MappingOntology[]): MappingClass[] {
        let classes = [];
        ontologies.forEach(ontology => {
            classes = concat(classes, this.om.getClasses([ontology.entities]).map(classObj => ({
                ontologyId: ontology.id,
                classObj,
                name: this.om.getEntityName(classObj),
                isDeprecated: this.om.isDeprecated(classObj)
            })));
        });
        return classes;
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
                const deletionsValue = isId ? getPropertyId(deletionsObj, propId) : getPropertyValue(deletionsObj, propId);
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
     * @return {JSONLDObject} The ClassMapping JSON-LD that was added
     */
    addClassMapping(classIdObj: MappingClass): JSONLDObject {
        const ontology = find(this.sourceOntologies, {id: classIdObj.ontologyId});
        const originalClassMappings = this.selected.mapping.getClassMappingsByClassId(classIdObj.classObj['@id']);
        const classMapping = this.mm.addClass(this.selected.mapping, ontology.entities, classIdObj.classObj['@id']);
        const className = this.om.getEntityName(classIdObj.classObj);
        if (!originalClassMappings.length) {
            setDctermsValue(classMapping, 'title', className);
        } else {
            originalClassMappings.forEach(classMapping => {
                if (getDctermsValue(classMapping, 'title') === className) {
                    // TODO: Should make a replaceDctermsValue function
                    classMapping[`${DCTERMS}title`][0]['@value'] = `${className} (1)`;
                    this.changeProp(classMapping['@id'], `${DCTERMS}title`, `${className} (1)`, className);
                    return false;
                }
            });
            this._setNewTitle(classMapping, className, originalClassMappings);
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
     * @return {JSONLDObject} The DataMapping JSON-LD that was added
     */
    addDataMapping(propIdObj: MappingProperty, classMappingId: string, columnIndex: number, datatypeSpec?: string,
        languageSpec?: string): JSONLDObject {
        const ontology = find(this.sourceOntologies, {id: propIdObj.ontologyId});
        const propMapping = this.mm.addDataProp(this.selected.mapping, get(ontology, 'entities', []), classMappingId, propIdObj.propObj['@id'], columnIndex, datatypeSpec, languageSpec);
        setDctermsValue(propMapping, 'title', this.om.getEntityName(propIdObj.propObj));
        (this.selected.difference.additions as JSONLDObject[]).push(Object.assign({}, propMapping));
        return propMapping;
    }
    /**
     * Adds a ObjectMapping for the data property identified by the passed property ID object and updates the
     * additions and adds a title appropriately.
     *
     * @param {MappingProperty} propIdObj An ID object for a property in an ontology
     * @param {string} classMappingId The ID of the ClassMapping the ObjectMapping should be added to
     * @param {string} rangeClassMappingId The ID of the ClassMapping the ObjectMapping should point to
     * @return {JSONLDObject} The ObjectMapping JSON-LD that was added
     */
    addObjectMapping(propIdObj: MappingProperty, classMappingId: string, rangeClassMappingId: string): JSONLDObject {
        const ontology = find(this.sourceOntologies, {id: propIdObj.ontologyId});
        const propMapping = this.mm.addObjectProp(this.selected.mapping, get(ontology, 'entities', []), classMappingId, propIdObj.propObj['@id'], rangeClassMappingId);
        setDctermsValue(propMapping, 'title', this.om.getEntityName(propIdObj.propObj));
        (this.selected.difference.additions as JSONLDObject[]).push(Object.assign({}, propMapping));
        return propMapping;
    }
    /**
     * Updates the additions and deletions of the current mapping appropriately when an entity is deleted.
     *
     * @param {Object} entity The JSON-LD object of the entity to delete
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
        if (classMappings.length === 0) {
            this.removeProps(classId);
        } else if (classMappings.length === 1) {
            const lastClassMapping = classMappings[0];
            const originalTitle = getDctermsValue(lastClassMapping, 'title');
            const newTitle = originalTitle.replace(/ \((\d+)\)$/, '');
            // TODO: Should make a replaceDctermsValue function
            lastClassMapping[`${DCTERMS}title`][0]['@value'] = newTitle;
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
