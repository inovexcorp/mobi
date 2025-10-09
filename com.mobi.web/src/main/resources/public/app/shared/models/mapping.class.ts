/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
  concat,
  filter,
  find,
  findIndex,
  get,
  head,
  includes,
  intersectionBy,
  isArray,
  map,
  pull,
  remove,
  set
} from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { DELIM } from '../../prefixes';
import { getPropertyId } from '../utility';
import { JSONLDObject } from './JSONLDObject.interface';
import { MappingOntologyInfo } from './mappingOntologyInfo.interface';

export class Mapping {

  public jsonld: JSONLDObject[];

  constructor(iriOrJsonld: JSONLDObject[] | string) {
    if (typeof iriOrJsonld === 'string') {
      const mappingEntity = {
        '@id': iriOrJsonld,
        '@type': [`${DELIM}Mapping`]
      };
      this.jsonld = [mappingEntity];
    } else if (isArray(iriOrJsonld)) {
      this.jsonld = iriOrJsonld;
    }
  }

  /**
   * Collects the id of the class being mapped by the passed class mapping.
   *
   * @param {JSONLDObject} classMapping The the class mapping to collect the class id from
   * @returns {string} The id of the class mapped by the class mapping
   */
  static getClassIdByMapping(classMapping: JSONLDObject): string {
    return getPropertyId(classMapping, `${DELIM}mapsTo`);
  }

  /**
   * Collects the id of the property being mapped by the passed property mapping.
   *
   * @param {JSONLDObject} propMapping The property mapping to collect the property id from
   * @returns {string} The id of the property mapped by the property mapping
   */
  static getPropIdByMapping(propMapping: JSONLDObject): string {
    return getPropertyId(propMapping, `${DELIM}hasProperty`);
  }

  /**
   * @returns The JSON-LD array of the Mapping
   */
  getJsonld(): JSONLDObject[] {
    return Object.assign([], this.jsonld);
  }

  /**
   * @returns the main Mapping entity within the JSON-LD
   */
  getMappingEntity(): JSONLDObject {
    return head(this._getEntitiesByType(this.jsonld, 'Mapping'));
  }

  /**
   * Retrieves all class mapping in the mapping array
   *
   * @returns {JSONLDObject[]} An array of all the class mappings in the mapping array
   */
  getAllClassMappings(): JSONLDObject[] {
    return this._getEntitiesByType(this.jsonld, 'ClassMapping');
  }

  /**
   * Retrieves all data property mapping in the mapping array
   *
   * @returns {JSONLDObject[]} An array of all the data property mappings in the mapping array
   */
  getAllDataMappings(): JSONLDObject[] {
    return this._getEntitiesByType(this.jsonld, 'DataMapping');
  }

  /**
   * Retrieves all object property mapping in the mapping array
   *
   * @returns {JSONLDObject[]} An array of all the object property mappings in the mapping array
   */
  getAllObjectMappings(): JSONLDObject[] {
    return this._getEntitiesByType(this.jsonld, 'ObjectMapping');
  }

  /**
   * Retrieves all property mappings for the specified class mapping in the mapping.
   *
   * @param {string} classMappingId The id of the class mapping to collect property mappings from
   * @returns {JSONLDObject[]} An array of all the property mappings for the specified class mapping
   */
  getPropMappingsByClass(classMappingId: string): JSONLDObject[] {
    const classMapping = this._getEntityById(this.jsonld, classMappingId);
    return intersectionBy(
      this.jsonld, concat(this._getDataProperties(classMapping), this._getObjectProperties(classMapping)),
      '@id'
    );
  }

  /**
   * Finds the class mapping which contains the specified data property mapping.
   *
   * @param {string} dataMappingId The id of a data property mapping
   * @returns {JSONLDObject} The class mapping which contains the specified data property mapping
   */
  findClassWithDataMapping(dataMappingId: string): JSONLDObject {
    return this._findClassWithPropMapping(dataMappingId, 'dataProperty');
  }

  /**
   * Finds the class mapping which contains the specified object property mapping.
   *
   * @param {string} objectMappingId The id of a data property mapping
   * @returns {JSONLDObject} The class mapping which contains the specified object property mapping
   */
  findClassWithObjectMapping(objectMappingId: string): JSONLDObject {
    return this._findClassWithPropMapping(objectMappingId, 'objectProperty');
  }

  /**
   * Finds all property mappings that link to the class mapping with the specified id.
   *
   * @param {string} classMappingId The id of the class mapping to search for properties linking to
   * @return {JSONLDObject[]} The property mappings that link to the specified class mapping
   */
  getPropsLinkingToClass(classMappingId: string): JSONLDObject[] {
    return this.getAllObjectMappings().filter(objectMapping =>
      getPropertyId(objectMapping, `${DELIM}classMapping`) === classMappingId);
  }

  /**
   * Collects all class mappings in the mapping that map to the passed class IRI.
   *
   * @param {string} classId The IRI of the class to filter by
   * @return {JSONLDObject[]} The array of class mappings for the identified class in the mapping
   */
  getClassMappingsByClassId(classId: string): JSONLDObject[] {
    return filter(this.getAllClassMappings(), [`${DELIM}mapsTo`, [{'@id': classId}]]);
  }

  /**
   * Collects all property mappings in the passed mapping that map to the passed property IRI.
   *
   * @param {string} propId The IRI of the property to filter by
   * @return {JSONLDObject[]} THe array of property mappings for the identified property in the mapping
   */
  getPropMappingsByPropId(propId: string): JSONLDObject[] {
    const propMappings = concat(this.getAllDataMappings(), this.getAllObjectMappings());
    return filter(propMappings, [`${DELIM}hasProperty`, [{'@id': propId}]]);
  }

  /**
   * @param {string} classMappingId The IRI of a Class Mapping to search for
   * @returns Whether the Mapping contains a Class Mapping with the specified IRI
   */
  hasClassMapping(classMappingId: string): boolean {
    const entity = this._getEntityById(this.jsonld, classMappingId);
    return !!entity && this._isType(entity, 'ClassMapping');
  }

  /**
   * Retrieves a Class Mapping with the provided IRI. Must be a Class Mapping, will not return if IRI exists as another
   * type.
   * @param {string} classMappingId The IRI of a Class Mapping to search for
   * @returns The JSON-LD of the specified Class Mapping
   */
  getClassMapping(classMappingId: string): JSONLDObject {
    const entity = this._getEntityById(this.jsonld, classMappingId);
    if (entity && this._isType(entity, 'ClassMapping')) {
      return entity;
    }
    return;
  }

  /**
   * @param {string} propMappingId The IRI of a Property Mapping to search for
   * @returns Whether the Mapping contains a Property Mapping with the specified IRI
   */
  hasPropMapping(propMappingId: string): boolean {
    const entity = this._getEntityById(this.jsonld, propMappingId);
    return !!entity && this._isType(entity, 'PropertyMapping');
  }

  /**
   * Retrieves a Property Mapping with the provided IRI. Must be a Property Mapping, will not return if IRI exists as
   * another type.
   * @param {string} propMappingId The IRI of a Property Mapping to search for
   * @returns The JSON-LD of the specified Property Mapping
   */
  getPropMapping(propMappingId: string): JSONLDObject {
    const entity = this._getEntityById(this.jsonld, propMappingId);
    if (entity && this._isType(entity, 'PropertyMapping')) {
      return entity;
    }
    return;
  }

  /**
   * Collects the IRI of the class being mapped by a Class Mapping specified by its IRI.
   *
   * @param {string} classMappingId The IRI of a Class Mapping
   * @returns The IRI of the Class being mapped by the Class Mapping
   */
  getClassIdByMappingId(classMappingId: string): string {
    return Mapping.getClassIdByMapping(this.getClassMapping(classMappingId));
  }

  /**
   * Collects the IRI of the property being mapped by a Property Mapping specified by IRI.
   *
   * @param propMappingId The IRI of a Property Mapping
   * @returns The IRI of the Property being mapped by the Class Mapping
   */
  getPropIdByMappingId(propMappingId: string): string {
    return Mapping.getPropIdByMapping(this.getPropMapping(propMappingId));
  }

  /**
   * Removes a Property Mapping from the mapping from the specified Class Mapping. The Class Mapping and Property
   * Mapping must already be in the mapping.
   *
   * @param {string} classMappingId The IRI of the Class Mapping with the Property Mapping to remove
   * @param {string} propMappingId The IRI of the Property Mapping to remove
   * @returns {JSONLDObject} The JSON-LD of the deleted Property Mapping
   */
  removePropMapping(classMappingId: string, propMappingId: string): JSONLDObject {
    const propMapping = this.getPropMapping(propMappingId);
    if (propMapping) {
      // Collect the property mapping and the class mapping
      const propType = this._isType(propMapping, 'ObjectMapping') ? 'objectProperty' : 'dataProperty';
      const classMapping = this.getClassMapping(classMappingId);
      // Remove the property mapping
      pull(this.jsonld, propMapping);
      // Remove the property mapping id from the class mapping's properties
      remove(classMapping[DELIM + propType], {'@id': propMappingId});
      this._cleanPropertyArray(classMapping, propType);
    }
    return propMapping;
  }

  /**
   * Removes a Class Mapping from the mapping. The Class Mapping must already be in the mapping. Also removes every
   * Property Mapping from the specified Class Mapping and any Object Property Mappings from other Class Mappings that
   * point to it.
   *
   * @param {string} classMappingId The IRI of the Class Mapping to remove
   * @returns {JSONLDObject} The JSON-LD of the deleted Class Mapping
   */
  removeClassMapping(classMappingId: string): JSONLDObject {
    const classMapping = this.getClassMapping(classMappingId);
    if (classMapping) {
      // Collect class mapping and any object mappings that use the class mapping
      // let classId = Mapping.getClassIdByMapping(classMapping);
      const objectMappings = this.getPropsLinkingToClass(classMappingId);
      // If there are object mappings that use the class mapping, iterate through them
      objectMappings.forEach(objectMapping => {
        // Collect the class mapping that uses the object mapping
        const classWithObjectMapping = this.findClassWithObjectMapping(objectMapping['@id']);
        // Remove the object property for the object mapping
        remove(classWithObjectMapping[`${DELIM}objectProperty`], {'@id': objectMapping['@id']});
        this._cleanPropertyArray(classWithObjectMapping, 'objectProperty');
        //Replace class mapping
        this.jsonld.splice(findIndex(this.jsonld, {'@id': classWithObjectMapping['@id']}), 1, classWithObjectMapping);
        // Remove object mapping
        remove(this.jsonld, objectMapping);
      });
      // Remove all properties of the class mapping and the class mapping itself
      concat(this._getDataProperties(classMapping), this._getObjectProperties(classMapping)).forEach(prop => {
        this.removePropMapping(classMapping['@id'], prop['@id']);
      });
      remove(this.jsonld, {'@id': classMapping['@id']});
    }
    return classMapping;
  }

  /**
   * Sets the `sourceOntology` property to the mapping's `Mapping` entity.
   *
   * @param {MappingOntologyInfo} ontologyInfo Information about the Record, Branch, and Commit of an ontology to set
   */
  setSourceOntologyInfo(ontologyInfo: MappingOntologyInfo): void {
    const mappingEntity = this.getMappingEntity();
    mappingEntity[`${DELIM}sourceRecord`] = [{'@id': ontologyInfo.recordId}];
    mappingEntity[`${DELIM}sourceBranch`] = [{'@id': ontologyInfo.branchId}];
    mappingEntity[`${DELIM}sourceCommit`] = [{'@id': ontologyInfo.commitId}];
  }

  /**
   * @returns {MappingOntologyInfo} The source ontology information of the mapping. This includes the record id, the
   * branch id, and the commit id.
   */
  getSourceOntologyInfo(): MappingOntologyInfo {
    const mappingEntity = this.getMappingEntity();
    return {
      recordId: getPropertyId(mappingEntity, `${DELIM}sourceRecord`),
      branchId: getPropertyId(mappingEntity, `${DELIM}sourceBranch`),
      commitId: getPropertyId(mappingEntity, `${DELIM}sourceCommit`),
    };
  }

  /**
   * Adds a class mapping to the mapping based on the provided class IRI and IRI prefix.
   *
   * @param {string} classId The IRI of the class to map
   * @param {string} prefix The prefix to set on the new Class Mapping
   * @returns {JSONLDObject} The JSON-LD of the new Class Mapping
   */
  addClassMapping(classId: string, prefix: string): JSONLDObject {
    const classMapping = {
      '@id': `${this.getMappingEntity()['@id']}/${uuidv4()}`,
      '@type': [`${DELIM}ClassMapping`],
      [`${DELIM}mapsTo`]: [{'@id': classId}],
      [`${DELIM}hasPrefix`]: [{'@value': prefix}],
      [`${DELIM}localName`]: [{'@value': '${UUID}'}]
    };
    this.jsonld.push(classMapping);
    return classMapping;
  }

  /**
   * Adds a Data Property Mapping to the mapping for the specified Class Mapping. The Class Mapping must already be in
   * the mapping. Sets the `columnIndex` of the Data Property Mapping to the passed index and the datatype and
   * language is provided
   *
   * @param {string} propId The IRI of the data property to map
   * @param {number} columnIndex The column index to set on the new Data Property Mapping
   * @param {string} classMappingId The IRI of the parent Class Mapping
   * @param {string} datatypeSpec An optional default datatype the Data Property Mapping should use
   * @param {string} languageSpec An optional default language tag the Data Property Mapping should use
   * @returns {JSONLDObject} The JSON-LD of the new Data Property mapping
   */
  addDataPropMapping(propId: string, columnIndex: number, classMappingId: string, datatypeSpec?: string,
                     languageSpec?: string): JSONLDObject {
    // Add new data mapping id to data properties of class mapping
    const propMapping = {
      '@id': `${this.getMappingEntity()['@id']}/${uuidv4()}`
    };
    const classMapping = this._getEntityById(this.jsonld, classMappingId);
    // Sets the dataProperty key if not already present
    classMapping[`${DELIM}dataProperty`] = this._getDataProperties(classMapping);
    classMapping[`${DELIM}dataProperty`].push(Object.assign({}, propMapping));
    // Create data mapping
    propMapping['@type'] = [`${DELIM}DataMapping`, `${DELIM}PropertyMapping`];
    propMapping[`${DELIM}columnIndex`] = [{'@value': `${columnIndex}`}];
    propMapping[`${DELIM}hasProperty`] = [{'@id': propId}];
    if (datatypeSpec) {
      propMapping[`${DELIM}datatypeSpec`] = [{'@id': datatypeSpec}];
      if (languageSpec) {
        propMapping[`${DELIM}languageSpec`] = [{'@value': languageSpec}];
      }
    }
    this.jsonld.push(propMapping);
    return propMapping;
  }

  /**
   * Adds a Object Property Mapping to the mapping for the specified Class Mapping. The Class Mapping
   * and the range Class Mapping must already be in the mapping.
   *
   * @param {string} propId The IRI of the object property to map
   * @param {string} classMappingId The IRI of the parent class mapping
   * @param {string} rangeClassMappingId The IRI of the class mapping to set as the range of the new Object property
   * Mapping
   * @returns {JSONLDObject} The JSON-LD of the new Object Property Mapping
   */
  addObjectPropMapping(propId: string, classMappingId: string, rangeClassMappingId: string): JSONLDObject {
    // Add new object mapping id to object properties of class mapping
    const propMapping = {
      '@id': `${this.getMappingEntity()['@id']}/${uuidv4()}`
    };
    const classMapping = this._getEntityById(this.jsonld, classMappingId);
    classMapping[`${DELIM}objectProperty`] = this._getObjectProperties(classMapping);
    classMapping[`${DELIM}objectProperty`].push(Object.assign({}, propMapping));
    // Create object mapping
    propMapping['@type'] = [`${DELIM}ObjectMapping`, `${DELIM}PropertyMapping`];
    propMapping[`${DELIM}classMapping`] = [{'@id': rangeClassMappingId}];
    propMapping[`${DELIM}hasProperty`] = [{'@id': propId}];
    this.jsonld.push(propMapping);
    return propMapping;
  }

  /**
   * Creates a copy of the mapping using the passed new id, updating all ids to use the new mapping id.
   *
   * @param {string} newId The id of the new mapping
   * @returns {Mapping} A copy of the passed mapping with the new id
   */
  copy(newId: string): Mapping {
    const newMapping = new Mapping(this.getJsonld());
    newMapping.getMappingEntity()['@id'] = newId;
    const idTransforms = {};
    newMapping.getAllClassMappings().forEach(classMapping => {
      set(idTransforms, encodeURIComponent(classMapping['@id']), `${newId}/${uuidv4()}`);
      classMapping['@id'] = get(idTransforms, encodeURIComponent(classMapping['@id']));
      concat(get(classMapping, `['${DELIM}dataProperty']`, []),
        get(classMapping, `['${DELIM}objectProperty']`, [])).forEach(propIdObj => {
        set(idTransforms, encodeURIComponent(propIdObj['@id']), `${newId}/${uuidv4()}`);
        propIdObj['@id'] = get(idTransforms, encodeURIComponent(propIdObj['@id']));
      });
    });
    concat(newMapping.getAllDataMappings(), newMapping.getAllObjectMappings()).forEach(propMapping => {
      if (this._isType(propMapping, 'ObjectMapping')) {
        propMapping[`${DELIM}classMapping`][0]['@id'] =
          get(idTransforms, encodeURIComponent(propMapping[`${DELIM}classMapping`][0]['@id']));
      }
      propMapping['@id'] = get(idTransforms, encodeURIComponent(propMapping['@id']));
    });
    return newMapping;
  }

  private _cleanPropertyArray(classMapping, propType) {
    if (get(classMapping, DELIM + propType) && get(classMapping, DELIM + propType).length === 0) {
      delete classMapping[DELIM + propType];
    }
  }

  private _getEntitiesByType(mapping: JSONLDObject[], type: string) {
    return filter(mapping, {'@type': [DELIM + type]});
  }

  private _getEntityById(mapping: JSONLDObject[], id: string) {
    return find(mapping, {'@id': id});
  }

  private _findClassWithPropMapping(propMappingId: string, type: string) {
    return find(this.getAllClassMappings(), classMapping => map(this._getProperties(classMapping, type), '@id').indexOf(propMappingId) >= 0);
  }

  private _getDataProperties(classMapping: JSONLDObject) {
    return this._getProperties(classMapping, 'dataProperty');
  }

  private _getObjectProperties(classMapping: JSONLDObject) {
    return this._getProperties(classMapping, 'objectProperty');
  }

  private _getProperties(classMapping: JSONLDObject, type: string) {
    return get(classMapping, `['${DELIM}${type}']`, []);
  }

  private _isType(entity: JSONLDObject, type: string) {
    return includes(get(entity, '[\'@type\']'), DELIM + type);
  }
}
