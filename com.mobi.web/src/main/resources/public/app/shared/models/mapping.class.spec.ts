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
import { DELIM } from '../../prefixes';
import { JSONLDObject } from './JSONLDObject.interface';
import { Mapping } from './mapping.class';

describe('Mapping class', function() {
    const mappingId = 'mappingId';
    const classIRI = 'classIRI';
    const propIRI = 'propIRI';
    let mappingEntity: JSONLDObject;
    let targetClassMapping: JSONLDObject;
    let dataPropMapping: JSONLDObject;
    let objectPropMapping: JSONLDObject;
    let classMapping: JSONLDObject;
    let testMapping: Mapping;

    beforeEach(function() {
        mappingEntity = {
            '@id': mappingId,
            '@type': [`${DELIM}Mapping`]
        };
        targetClassMapping = {
            '@id': 'targetClassMapping',
            '@type': [`${DELIM}ClassMapping`],
            [`${DELIM}mapsTo`]: [{'@id': `${classIRI}1`}],
        };
        dataPropMapping = {
            '@id': 'dataPropMapping',
            '@type': [`${DELIM}PropertyMapping`, `${DELIM}DataMapping`],
            [`${DELIM}hasProperty`]: [{'@id': propIRI}]
        };
        objectPropMapping = {
            '@id': 'objectPropMapping',
            '@type': [`${DELIM}PropertyMapping`, `${DELIM}ObjectMapping`],
            [`${DELIM}hasProperty`]: [{'@id': propIRI}],
            [`${DELIM}classMapping`]: [{'@id': targetClassMapping['@id']}]
        };
        classMapping = {
            '@id': 'classMapping',
            '@type': [`${DELIM}ClassMapping`],
            [`${DELIM}mapsTo`]: [{'@id': classIRI}],
            [`${DELIM}dataProperty`]: [{'@id': dataPropMapping['@id']}],
            [`${DELIM}objectProperty`]: [{'@id': objectPropMapping['@id']}],
        };
        testMapping = new Mapping([mappingEntity, classMapping, targetClassMapping, dataPropMapping, objectPropMapping]);
    });

    afterEach(function() {
        targetClassMapping = null;
        dataPropMapping = null;
        testMapping = null;
    });

    describe('constructor works with', function() {
        it('with an id', function() {
            const result = new Mapping('test');
            expect(result.getJsonld()).toContain({'@id': 'test', '@type': [`${DELIM}Mapping`]});
        });
        it('with JSON-LD', function() {
            const jsonld = [classMapping, dataPropMapping];
            const result = new Mapping(jsonld);
            expect(result.getJsonld()).toEqual(jsonld);
        });
    });
    describe('static method', function() {
        it('getClassIdByMapping retrieves a ClassMapping classId', function() {
            expect(Mapping.getClassIdByMapping(classMapping)).toEqual(classIRI);
        });
        it('getPropIdByMapping retrieves a PropMapping propId', function() {
            expect(Mapping.getPropIdByMapping(dataPropMapping)).toEqual(propIRI);
        });
    });
    describe('instance method', function() {
        it('getJsonld returns the full JSON-LD array', function() {
            expect(testMapping.getJsonld()).toEqual([mappingEntity, classMapping, targetClassMapping, dataPropMapping, objectPropMapping]);
        });
        it('getMappingEntity returns the main mapping node', function() {
            expect(testMapping.getMappingEntity()).toEqual(mappingEntity);
        });
        it('getAllClassMappings returns all the Class Mappings', function() {
            expect(testMapping.getAllClassMappings()).toEqual([classMapping, targetClassMapping]);
        });
        it('getAllDataMappings returns all the Data Property Mappings', function() {
            expect(testMapping.getAllDataMappings()).toEqual([dataPropMapping]);
        });
        it('getAllObjectMappings returns all the Object Property Mappings', function() {
            expect(testMapping.getAllObjectMappings()).toEqual([objectPropMapping]);
        });
        it('getPropMappingsByClass returns all Property Mappings for a specific Class Mappings', function() {
            expect(testMapping.getPropMappingsByClass(classMapping['@id'])).toEqual([dataPropMapping, objectPropMapping]);
        });
        it('findClassWithDataMapping returns the Class Mapping with a specific Data Property Mapping', function() {
            expect(testMapping.findClassWithDataMapping(dataPropMapping['@id'])).toEqual(classMapping);
        });
        it('findClassWithObjectMapping returns the Class Mapping with a specific Object Property Mapping', function() {
            expect(testMapping.findClassWithObjectMapping(objectPropMapping['@id'])).toEqual(classMapping);
        });
        it('getPropsLinkingToClass returns the Object Property Mappings that point to a specific Class Mapping', function() {
            expect(testMapping.getPropsLinkingToClass(targetClassMapping['@id'])).toEqual([objectPropMapping]);
        });
        it('getClassMappingsByClassId returns Class Mappings that map to a specific class', function() {
            expect(testMapping.getClassMappingsByClassId(classIRI)).toEqual([classMapping]);
        });
        it('getPropMappingsByPropId returns Property Mappings that map to a specific property', function() {
            expect(testMapping.getPropMappingsByPropId(propIRI)).toEqual([dataPropMapping, objectPropMapping]);
        });
        it('hasClassMapping returns whether the Mapping contains a Class Mapping', function() {
            expect(testMapping.hasClassMapping(classMapping['@id'])).toEqual(true);
            expect(testMapping.hasClassMapping('error')).toEqual(false);
        });
        it('getClassMapping returns the Class Mapping with the specified id', function() {
            expect(testMapping.getClassMapping(classMapping['@id'])).toEqual(classMapping);
            expect(testMapping.getClassMapping('error')).toBeUndefined();
        });
        it('hasPropMapping returns whether the Mapping contains a Property Mapping', function() {
            expect(testMapping.hasPropMapping(dataPropMapping['@id'])).toEqual(true);
            expect(testMapping.hasPropMapping('error')).toEqual(false);
        });
        it('getPropMapping returns the Property Mapping with the specified id', function() {
            expect(testMapping.getPropMapping(dataPropMapping['@id'])).toEqual(dataPropMapping);
            expect(testMapping.getPropMapping('error')).toBeUndefined();
        });
        it('getClassIdByMappingId returns the class id from a Class Mapping with the specified id', function() {
            expect(testMapping.getClassIdByMappingId(classMapping['@id'])).toEqual(classIRI);
            expect(testMapping.getClassIdByMappingId('error')).toEqual('');
        });
        it('getPropIdByMappingId returns the property id from a Property Mapping with the specified id', function() {
            expect(testMapping.getPropIdByMappingId(dataPropMapping['@id'])).toEqual(propIRI);
            expect(testMapping.getPropIdByMappingId('error')).toEqual('');
        });
        describe('removePropMapping removes the specified Property Mapping from the specified parent Class Mapping', function() {
            it('unless the Property Mapping does not exist', function() {
                const jsonld = testMapping.getJsonld();
                expect(testMapping.removePropMapping('error', 'error')).toBeUndefined();
                expect(testMapping.getJsonld()).toEqual(jsonld);
            });
            it('if it is a Data Property Mapping', function() {
                expect(testMapping.removePropMapping(classMapping['@id'], dataPropMapping['@id'])).toEqual(dataPropMapping);
                expect(testMapping.getJsonld()).not.toContain(dataPropMapping);
                expect(classMapping[`${DELIM}dataProperty`]).toBeUndefined();
            });
            it('if it is an Object Property Mapping', function() {
                expect(testMapping.removePropMapping(classMapping['@id'], objectPropMapping['@id'])).toEqual(objectPropMapping);
                const jsonld = testMapping.getJsonld();
                expect(jsonld).not.toContain(objectPropMapping);
                expect(jsonld).toContain(targetClassMapping);
                expect(classMapping[`${DELIM}objectProperty`]).toBeUndefined();
            });
        });
        describe('removeClassMapping removes the specified Class Mapping', function() {
            it('unless the Class Mapping does not exist', function() {
                const jsonld = testMapping.getJsonld();
                expect(testMapping.removeClassMapping('error')).toBeUndefined();
                expect(testMapping.getJsonld()).toEqual(jsonld);
            });
            it('successfully removing linked Object Property Mappings', function() {
                expect(testMapping.removeClassMapping(targetClassMapping['@id'])).toEqual(targetClassMapping);
                const jsonld = testMapping.getJsonld();
                expect(jsonld).not.toContain(targetClassMapping);
                expect(jsonld).not.toContain(objectPropMapping);
                expect(classMapping[`${DELIM}objectProperty`]).toBeUndefined();
            });
            it('successfully removing all it\'s Property Mappings', function() {
                expect(testMapping.removeClassMapping(classMapping['@id'])).toEqual(classMapping);
                const jsonld = testMapping.getJsonld();
                expect(jsonld).not.toContain(classMapping);
                expect(jsonld).not.toContain(objectPropMapping);
                expect(jsonld).not.toContain(dataPropMapping);
            });
        });
        it('setSourceOntologyInfo sets the source ontology info for the Mapping', function() {
            testMapping.setSourceOntologyInfo({
                recordId: 'recordId',
                branchId: 'branchId',
                commitId: 'commitId'
            });
            expect(mappingEntity[`${DELIM}sourceRecord`]).toEqual([{'@id': 'recordId'}]);
            expect(mappingEntity[`${DELIM}sourceBranch`]).toEqual([{'@id': 'branchId'}]);
            expect(mappingEntity[`${DELIM}sourceCommit`]).toEqual([{'@id': 'commitId'}]);
        });
        it('getSourceOntologyInfo returns the source ontology info from the Mapping', function() {
            mappingEntity[`${DELIM}sourceRecord`] = [{'@id': 'recordId'}];
            mappingEntity[`${DELIM}sourceBranch`] = [{'@id': 'branchId'}];
            mappingEntity[`${DELIM}sourceCommit`] = [{'@id': 'commitId'}];
            expect(testMapping.getSourceOntologyInfo()).toEqual({
                recordId: 'recordId',
                branchId: 'branchId',
                commitId: 'commitId'
            });
        });
        it('addClassMapping adds a Class Mapping', function() {
            const result = testMapping.addClassMapping(`${classIRI}2`, 'prefix');
            expect(result).toEqual({
                '@id': jasmine.stringContaining(mappingId),
                '@type': [`${DELIM}ClassMapping`],
                [`${DELIM}mapsTo`]: [{'@id': `${classIRI}2`}],
                [`${DELIM}hasPrefix`]: [{'@value': 'prefix'}],
                [`${DELIM}localName`]: [{'@value': '${UUID}'}]
            });
            expect(testMapping.getJsonld()).toContain(result);
        });
        describe('addDataPropMapping adds a Data Property Mapping', function() {
            it('without a datatype or language', function() {
                const result = testMapping.addDataPropMapping(`${propIRI}2`, 0, classMapping['@id']);
                expect(result).toEqual({
                    '@id': jasmine.stringContaining(mappingId),
                    '@type': [`${DELIM}DataMapping`, `${DELIM}PropertyMapping`],
                    [`${DELIM}hasProperty`]: [{'@id': `${propIRI}2`}],
                    [`${DELIM}columnIndex`]: [{'@value': '0'}],
                });
                expect(classMapping[`${DELIM}dataProperty`]).toContain({'@id': result['@id']});
            });
            it('with a datatype, but no language', function() {
                const result = testMapping.addDataPropMapping(`${propIRI}2`, 0, classMapping['@id'], 'datatype');
                expect(result).toEqual({
                    '@id': jasmine.stringContaining(mappingId),
                    '@type': [`${DELIM}DataMapping`, `${DELIM}PropertyMapping`],
                    [`${DELIM}hasProperty`]: [{'@id': `${propIRI}2`}],
                    [`${DELIM}columnIndex`]: [{'@value': '0'}],
                    [`${DELIM}datatypeSpec`]: [{'@id': 'datatype'}]
                });
                expect(classMapping[`${DELIM}dataProperty`]).toContain({'@id': result['@id']});
            });
            it('with a datatype and language', function() {
                const result = testMapping.addDataPropMapping(`${propIRI}2`, 0, classMapping['@id'], 'datatype', 'language');
                expect(result).toEqual({
                    '@id': jasmine.stringContaining(mappingId),
                    '@type': [`${DELIM}DataMapping`, `${DELIM}PropertyMapping`],
                    [`${DELIM}hasProperty`]: [{'@id': `${propIRI}2`}],
                    [`${DELIM}columnIndex`]: [{'@value': '0'}],
                    [`${DELIM}datatypeSpec`]: [{'@id': 'datatype'}],
                    [`${DELIM}languageSpec`]: [{'@value': 'language'}]
                });
                expect(classMapping[`${DELIM}dataProperty`]).toContain({'@id': result['@id']});
            });
        });
        it('addObjectPropMapping adds an Object Property Mapping', function() {
            const result = testMapping.addObjectPropMapping(`${propIRI}2`, classMapping['@id'], targetClassMapping['@id']);
            expect(result).toEqual({
                '@id': jasmine.stringContaining(mappingId),
                '@type': [`${DELIM}ObjectMapping`, `${DELIM}PropertyMapping`],
                [`${DELIM}hasProperty`]: [{'@id': `${propIRI}2`}],
                [`${DELIM}classMapping`]: [{'@id': targetClassMapping['@id']}],
            });
            expect(classMapping[`${DELIM}objectProperty`]).toContain({'@id': result['@id']});
        });
        it('copy should create a copy of the Mapping', function() {
            const newId = 'http://test.com';
            const result = testMapping.copy(newId);
            const jsonld = result.getJsonld();
            expect(jsonld.length).toEqual(testMapping.getJsonld().length);
            // Validate Mapping Entity
            expect(jsonld).toContain({
                '@id': newId,
                '@type': [`${DELIM}Mapping`]
            });
            // Validate Class Mappings
            expect(jsonld).toContain({
                '@id': jasmine.stringContaining(newId),
                '@type': [`${DELIM}ClassMapping`],
                [`${DELIM}mapsTo`]: [{'@id': `${classIRI}1`}],
            });
            expect(jsonld).toContain({
                '@id': jasmine.stringContaining(newId),
                '@type': [`${DELIM}ClassMapping`],
                [`${DELIM}mapsTo`]: [{'@id': classIRI}],
                [`${DELIM}dataProperty`]: [{'@id': jasmine.stringContaining(newId)}],
                [`${DELIM}objectProperty`]: [{'@id': jasmine.stringContaining(newId)}],
            });
            // Validate Data Property Mapping
            expect(jsonld).toContain({
                '@id': jasmine.stringContaining(newId),
                '@type': [`${DELIM}PropertyMapping`, `${DELIM}DataMapping`],
                [`${DELIM}hasProperty`]: [{'@id': propIRI}]
            });
            // Validate Object Property Mapping
            expect(jsonld).toContain({
                '@id': jasmine.stringContaining(newId),
                '@type': [`${DELIM}PropertyMapping`, `${DELIM}ObjectMapping`],
                [`${DELIM}hasProperty`]: [{'@id': propIRI}],
                [`${DELIM}classMapping`]: [{'@id': jasmine.stringContaining(newId)}]
            });
            
        });
    });
});
