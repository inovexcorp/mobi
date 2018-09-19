/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Mapping Manager service', function() {
    var mappingManagerSvc, $httpBackend, $httpParamSerializer, ontologyManagerSvc, utilSvc, uuidSvc, prefixes, splitIRI, camelCase, $q, scope;

    beforeEach(function() {
        module('mappingManager');
        mockPrefixes();
        injectCamelCaseFilter();
        injectSplitIRIFilter();
        mockOntologyManager();
        mockUtil();
        injectRestPathConstant();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(mappingManagerService, _ontologyManagerService_, _utilService_, _uuid_, _$httpBackend_, _$httpParamSerializer_, _prefixes_, _splitIRIFilter_, _camelCaseFilter_, _$q_, _$rootScope_) {
            mappingManagerSvc = mappingManagerService;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            uuidSvc = _uuid_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            prefixes = _prefixes_;
            splitIRI = _splitIRIFilter_;
            camelCase = _camelCaseFilter_;
            $q = _$q_;
            scope = _$rootScope_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        mappingManagerSvc = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        ontologyManagerSvc = null;
        utilSvc = null;
        uuidSvc = null;
        prefixes = null;
        splitIRI = null;
        camelCase = null;
        $q = null;
        scope = null;
    });

    describe('should get a list of mapping records', function() {
        beforeEach(function() {
            this.params = $httpParamSerializer({sort: prefixes.dcterms + 'title'});
        });
        it('unless an error occors', function() {
            $httpBackend.expectGET('/mobirest/mappings?' + this.params).respond(400, null, null, 'Error Message');
            mappingManagerSvc.getMappingRecords()
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/mappings?' + this.params).respond(200, []);
            mappingManagerSvc.getMappingRecords()
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should upload a mapping', function() {
        beforeEach(function () {
            this.title = 'title';
            this.description = 'description';
            this.keywords = [];
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/mappings',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(400, null, null, 'Error Message');
            mappingManagerSvc.upload([], this.title, this.description, this.keywords)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectPOST('/mobirest/mappings',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, 'mapping');
            mappingManagerSvc.upload([], this.title, this.description, this.keywords)
                .then(function(response) {
                    expect(response).toBe('mapping');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a mapping by id', function() {
        beforeEach(function() {
            this.id = 'mapping-record';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/mappings/' + this.id).respond(400, null, null, 'Error Message');
            mappingManagerSvc.getMapping(this.id)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/mappings/' + this.id).respond(200, []);
            mappingManagerSvc.getMapping(this.id)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should download a mapping by id with the', function() {
        it('provided format', function() {
            mappingManagerSvc.downloadMapping('mapping', 'turtle');
            expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/mappings/mapping?format=turtle');
        });
        it('default format', function() {
            mappingManagerSvc.downloadMapping('mapping');
            expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/mappings/mapping?format=jsonld');
        });
    });
    describe('should delete a mapping by id', function() {
        beforeEach(function() {
            this.id = 'mappingname';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectDELETE('/mobirest/mappings/' + this.id).respond(400, null, null, 'Error Message');
            mappingManagerSvc.deleteMapping(this.id)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectDELETE('/mobirest/mappings/' + this.id).respond(200, '');
            mappingManagerSvc.deleteMapping(this.id)
                .then(function(response) {
                    expect(response).toEqual('');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    it('should get the mapping IRI based on a title', function() {
        expect(mappingManagerSvc.getMappingId('title')).toEqual(prefixes.mappings + 'title');
        expect(camelCase).toHaveBeenCalledWith('title', 'class');
    });
    it('should create a new mapping', function() {
        var result = mappingManagerSvc.createNewMapping('mappingname');
        expect(_.isArray(result)).toBe(true);
        var obj = _.find(result, {'@id': 'mappingname'});
        expect(obj).toBeTruthy();
        expect(obj['@type']).toEqual(['Mapping']);
    });
    it('should set the source ontology information of a mapping', function() {
        var mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        mappingManagerSvc.setSourceOntologyInfo(mapping, 'record', 'branch', 'commit');
        var mappingObj = _.find(mapping, {'@id': 'mappingname'});
        expect(mappingObj[prefixes.delim + 'sourceRecord']).toEqual([{'@id': 'record'}]);
        expect(mappingObj[prefixes.delim + 'sourceBranch']).toEqual([{'@id': 'branch'}]);
        expect(mappingObj[prefixes.delim + 'sourceCommit']).toEqual([{'@id': 'commit'}]);
    });
    it('should create a copy of a mapping', function() {
        var mappingEntity = {'@id': 'originalMapping', '@type': [prefixes.delim + 'Mapping'], id: 'mapping'};
        var classMapping1 = {'@id': 'class1', 'id': 'class1'};
        var classMapping2 = {'@id': 'class2', 'id': 'class2'};
        var objectMapping = {'@id': 'object', 'id': 'object'};
        objectMapping[prefixes.delim + 'classMapping'] = [angular.copy(classMapping2)];
        var dataMapping = {'@id': 'data', 'id': 'data'};
        spyOn(mappingManagerSvc, 'getAllClassMappings').and.returnValue([classMapping1, classMapping2]);
        spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([objectMapping]);
        spyOn(mappingManagerSvc, 'getAllDataMappings').and.returnValue([dataMapping]);
        spyOn(mappingManagerSvc, 'isObjectMapping').and.callFake(function(entity) {
            return entity.id === objectMapping.id;
        });
        var changedMapping = [classMapping1, classMapping2, objectMapping, dataMapping];
        var mapping = _.concat(angular.copy(changedMapping), mappingEntity);
        var result = mappingManagerSvc.copyMapping(mapping, 'newMapping');
        expect(result.length).toBe(mapping.length);
        expect(_.find(result, {id: 'mapping'})['@id']).toBe('newMapping');
        _.forEach(changedMapping, function(entity) {
            var original = _.find(mapping, {'id': entity.id});
            expect(original['@id']).not.toBe(entity['@id']);
            if (_.has(entity, "['" + prefixes.delim + "classMapping']")){
                expect(entity[prefixes.delim + 'classMapping']).not.toEqual(original[prefixes.delim + 'classMapping']);
            }
        });
    });
    describe('should add a class mapping to a mapping', function() {
        beforeEach(function() {
            this.ontologyId = 'http://example.com';
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
            utilSvc.getBeautifulIRI.and.returnValue('ontology');
            ontologyManagerSvc.getEntityName.and.returnValue('Class');
        });
        it('unless the class does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addClass(this.mapping, {}, 'classid');
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('if the class exists in the passed ontology', function() {
            var result = mappingManagerSvc.addClass(this.mapping, {}, 'classid');
            expect(this.mapping).toContain(result);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(result['@type']).toContain(prefixes.delim + 'ClassMapping');
            expect(_.has(result, prefixes.delim + 'hasPrefix')).toBe(true);
            expect(result[prefixes.delim + 'localName']).toEqual([{'@value': '${UUID}'}]);
            expect(result[prefixes.delim + 'mapsTo']).toEqual([{'@id': 'classid'}]);
        });
    });
    describe('should set the IRI template of a class mapping', function() {
        beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        });
        it('unless it does not exist in the mapping', function() {
            var mapping = angular.copy(this.mapping);
            mappingManagerSvc.editIriTemplate(this.mapping, 'classId', 'test/', '${0}');
            expect(mapping).toEqual(this.mapping);
        });
        it('successfully', function() {
            var classMapping = {'@id': 'classId'};
            splitIRI.and.returnValue({begin: 'ontology', then: '/'});
            this.mapping.push(classMapping);
            mappingManagerSvc.editIriTemplate(this.mapping, classMapping['@id'], 'test/', '${0}');
            expect(classMapping[prefixes.delim + 'hasPrefix']).toEqual([{'@value': 'test/'}]);
            expect(classMapping[prefixes.delim + 'localName']).toEqual([{'@value': '${0}'}]);
        });
    });
    describe('should add a data property mapping to a mapping', function() {
        beforeEach(function() {
            this.classMapping = {'@id': 'classId'};
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}, this.classMapping];
            ontologyManagerSvc.getEntityName.and.returnValue('Property');
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addDataProp(this.mapping, [], this.classMapping['@id'], 'propId', 0);
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addDataProp(this.mapping, [], this.classMapping['@id'], 'propId', 0);
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('unless the IRI passed is not for a data property and is not a supported annotation', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            var result = mappingManagerSvc.addDataProp(this.mapping, [], this.classMapping['@id'], 'propId', 0);
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('if the data property exists in the passed ontology', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            this.propObj = {'@id': 'propId'};
            ontologyManagerSvc.getEntity.and.returnValue(this.propObj);
            var result = mappingManagerSvc.addDataProp(this.mapping, [], this.classMapping['@id'], 'propId', 0);
            expect(this.mapping).toContain(result);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(result['@type']).toContain(prefixes.delim + 'DataMapping');
            expect(result[prefixes.delim + 'columnIndex']).toEqual([{'@value': '0'}]);
            expect(result[prefixes.delim + 'hasProperty']).toEqual([{'@id': 'propId'}]);
            expect(_.isArray(this.classMapping[prefixes.delim + 'dataProperty'])).toBe(true);
            expect(this.classMapping[prefixes.delim + 'dataProperty']).toContain({'@id': result['@id']});
        });
        it('if the property is a supported default annotation', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            mappingManagerSvc.annotationProperties = ['propId'];
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addDataProp(this.mapping, [], this.classMapping['@id'], 'propId', 0);
            expect(this.mapping).toContain(result);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(result['@type']).toContain(prefixes.delim + 'DataMapping');
            expect(result[prefixes.delim + 'columnIndex']).toEqual([{'@value': '0'}]);
            expect(result[prefixes.delim + 'hasProperty']).toEqual([{'@id': 'propId'}]);
            expect(_.isArray(this.classMapping[prefixes.delim + 'dataProperty'])).toBe(true);
            expect(this.classMapping[prefixes.delim + 'dataProperty']).toContain({'@id': result['@id']});
        });
        it('if the property is a supported annotation from the ontology', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isAnnotation.and.returnValue(true);
            mappingManagerSvc.annotationProperties = [];
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addDataProp(this.mapping, [], this.classMapping['@id'], 'propId', 0);
            expect(this.mapping).toContain(result);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(result['@type']).toContain(prefixes.delim + 'DataMapping');
            expect(result[prefixes.delim + 'columnIndex']).toEqual([{'@value': '0'}]);
            expect(result[prefixes.delim + 'hasProperty']).toEqual([{'@id': 'propId'}]);
            expect(_.isArray(this.classMapping[prefixes.delim + 'dataProperty'])).toBe(true);
            expect(this.classMapping[prefixes.delim + 'dataProperty']).toContain({'@id': result['@id']});
        });
    });
    describe('should add an object property mapping to a mapping', function() {
        beforeEach(function() {
            this.parentClassMapping = {'@id': 'class1'};
            this.rangeClassMapping = {'@id': 'class2'};
            this.rangeClassMapping[prefixes.delim + 'mapsTo'] = [{'@id': 'classId'}];
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}, this.parentClassMapping, this.rangeClassMapping];
            ontologyManagerSvc.getEntityName.and.returnValue('Property');
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addObjectProp([], [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(result).toBeUndefined();
        });
        it('unless the range class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addObjectProp([this.parentClassMapping], [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(result).toBeUndefined();
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(this.mapping).not.toContain(result);
            expect(result).toBeUndefined();
        });
        it('unless the IRI is not for an object property', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(this.mapping).not.toContain(result);
            expect(result).toBeUndefined();
        });
        it('unless the range of the object property does not matched the range class mapping', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            var obj = {};
            obj[prefixes.rdfs + 'range'] = [{'@id': ''}];
            utilSvc.getPropertyId.and.returnValue(obj[prefixes.rdfs + 'range'][0]['@id']);
            ontologyManagerSvc.getEntity.and.returnValue(obj);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(this.mapping).not.toContain(result);
            expect(result).toBeUndefined();
        });
        it('if the object property exists in the passed ontology', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            this.propObj = {'@id': 'propId'};
            this.propObj[prefixes.rdfs + 'range'] = angular.copy(this.rangeClassMapping[prefixes.delim + 'mapsTo']);
            utilSvc.getPropertyId.and.returnValue(this.propObj[prefixes.rdfs + 'range'][0]['@id']);
            ontologyManagerSvc.getEntity.and.returnValue(this.propObj);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(_.isArray(this.parentClassMapping.objectProperty)).toBe(true);
            expect(this.parentClassMapping.objectProperty).toContain({'@id': result['@id']});
            expect(result[prefixes.delim + 'classMapping']).toEqual([{'@id': this.rangeClassMapping['@id']}]);
            expect(result[prefixes.delim + 'hasProperty']).toEqual([{'@id': 'propId'}]);
        });
    });
    describe('should remove a property mapping from a mapping', function() {
        beforeEach(function() {
            this.mapping = [];
        });
        it('unless the property mapping does not exist in the mapping', function() {
            mappingManagerSvc.removeProp(this.mapping, 'classId', 'propId');
            expect(this.mapping).toEqual([]);
        });
        describe('if the property mapping exists in mapping and is a data mapping', function() {
            beforeEach(function() {
                this.propMapping = {'@id': 'propId'};
                this.classMapping = {'@id': 'classId'};
            });
            it('and is a data property', function() {
                this.classMapping.dataProperty = [{}, this.propMapping]
                spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(false);
                this.mapping = [this.classMapping, this.propMapping];
                mappingManagerSvc.removeProp(this.mapping, 'classId', this.propMapping['@id']);
                expect(this.mapping).not.toContain(this.propMapping);
                expect(_.isArray(this.classMapping.dataProperty)).toBe(true);
                expect(this.classMapping.dataProperty).not.toContain(this.propMapping);
            });
            it('and is an object property', function() {
                this.classMapping.objectProperty = [{}, this.propMapping];
                spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(true);
                this.mapping = [this.classMapping, this.propMapping];
                mappingManagerSvc.removeProp(this.mapping, 'classId', this.propMapping['@id']);
                expect(this.mapping).not.toContain(this.propMapping);
                expect(_.isArray(this.classMapping.objectProperty)).toBe(true);
                expect(this.classMapping.objectProperty).not.toContain(this.propMapping);
            });
        });
    });
    describe('should remove a class mapping from a mapping', function() {
        beforeEach(function() {
            this.mapping = [];
        });
        it('unless the class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.removeClass(this.mapping, 'classId');
            expect(this.mapping).toEqual([]);
        });
        describe('if the class mapping exists', function() {
            beforeEach(function() {
                this.classMapping = {'@id': 'classId'};
                this.mapping.push(this.classMapping);
            });
            it('and no object mappings use it', function() {
                mappingManagerSvc.removeClass(this.mapping, 'classId');
                expect(this.mapping).not.toContain(this.classMapping);
            });
            it('and object mappings use it', function() {
                var propMapping = {'@id': 'propId', 'classMapping': [this.classMapping]};
                var classMapping2 = {'@id': 'class2', 'objectProperty': [{}, {'@id': propMapping['@id']}]};
                spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([propMapping]);
                spyOn(mappingManagerSvc, 'findClassWithObjectMapping').and.returnValue(classMapping2);
                this.mapping = _.concat(this.mapping, [propMapping, classMapping2]);
                mappingManagerSvc.removeClass(this.mapping, this.classMapping['@id']);
                expect(_.isArray(classMapping2.objectProperty)).toBe(true);
                expect(classMapping2.objectProperty).not.toContain({'@id': 'propId'});
                expect(this.mapping).not.toContain(propMapping);
                expect(this.mapping).not.toContain(this.classMapping);
            });
            it('along with all its properties', function() {
                var objectMapping = {'@id': 'objectId', '@type': ['ObjectMapping']};
                var dataMapping = {'@id': 'dataId', '@type': ['DataMapping']};
                this.classMapping.objectProperty = [{}, objectMapping];
                this.classMapping.dataProperty = [{}, dataMapping];
                this.mapping = _.concat(this.mapping, [objectMapping, dataMapping]);
                mappingManagerSvc.removeClass(this.mapping, 'classId');
                expect(this.mapping).not.toContain(this.classMapping);
                expect(this.mapping).not.toContain(dataMapping);
                expect(this.mapping).not.toContain(objectMapping);
            });
        });
    });
    it('should get the class id of a class mapping by its id', function() {
        var classMapping = {'@id': 'classId'};
        spyOn(mappingManagerSvc, 'getClassIdByMapping').and.returnValue('');
        var result = mappingManagerSvc.getClassIdByMappingId([classMapping], classMapping['@id']);
        expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
        expect(typeof result).toBe('string');
    });
    it('should get the class id of a class mapping', function() {
        var classMapping = {'@id': 'classId'};
        classMapping[prefixes.delim + 'mapsTo'] = [{'@id': 'class'}];
        utilSvc.getPropertyId.and.returnValue(classMapping[prefixes.delim + 'mapsTo'][0]['@id']);
        expect(mappingManagerSvc.getClassIdByMapping(classMapping)).toBe('class');
    });
    it('should get the property id of a property mapping by its id', function() {
        var propMapping = {'@id': 'propId'};
        spyOn(mappingManagerSvc, 'getPropIdByMapping').and.returnValue('');
        var result = mappingManagerSvc.getPropIdByMappingId([propMapping], propMapping['@id']);
        expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
        expect(typeof result).toBe('string');
    });
    it('should get the property id of a property mapping', function() {
        var propMapping = {'@id': 'propId'};
        propMapping[prefixes.delim + 'hasProperty'] = [{'@id': 'prop'}];
        utilSvc.getPropertyId.and.returnValue(propMapping[prefixes.delim + 'hasProperty'][0]['@id']);
        expect(mappingManagerSvc.getPropIdByMapping(propMapping)).toBe('prop');
    });
    describe('should get an ontology in the correct structure', function() {
        beforeEach(function() {
            this.ontologyInfo = {recordId: '', branchId: '', commitId: ''};
        });
        it('unless the parameter object is missing information', function(done) {
            mappingManagerSvc.getOntology({}).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(error) {
                expect(error).toBe('Missing identification information');
                done();
            });
            scope.$apply();
        });
        it('unless an error occurs', function(done) {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject('Error message'));
            mappingManagerSvc.getOntology(this.ontologyInfo).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(error) {
                expect(error).toBe('Error message');
                done();
            });
            scope.$apply();
        });
        it('successfully', function(done) {
            var test = this;
            ontologyManagerSvc.getOntology.and.returnValue($q.when([]));
            ontologyManagerSvc.getOntologyIRI.and.returnValue('ontology');
            mappingManagerSvc.getOntology(test.ontologyInfo).then(function(response) {
                expect(typeof response).toBe('object');
                expect(response.id).toBe('ontology');
                expect(response.recordId).toBe(test.ontologyInfo.recordId);
                expect(response.entities).toEqual([]);
                done();
            });
            scope.$apply();
        });
    });
    describe('should get the list of source ontologies from the imports closure of the specified ontology', function() {
        beforeEach(function() {
            this.ontologyInfo = {recordId: '', branchId: '', commitId: ''};
            this.mapping = {jsonld: []};
            this.ontology = {id: 'ontology', entities: [], recordId: this.ontologyInfo.recordId};
            this.importedOntology = {id: 'imported', entities: []};
        });
        it('unless the parameter object is missing information', function(done) {
            mappingManagerSvc.getSourceOntologies({}).then(function(response) {
                expect(response).toEqual([]);
                done();
            });
            scope.$apply();
        });
        describe('if the ontology is open', function() {
            beforeEach(function() {
                ontologyManagerSvc.list = [{ontologyId: this.ontology.id, recordId: this.ontologyInfo.recordId, branchId: this.ontologyInfo.branchId, commitId: this.ontologyInfo.commitId, ontology: this.ontology.entities}];
                spyOn(mappingManagerSvc, 'getOntology');
            });
            it('unless an error occurs', function(done) {
                var test = this;
                ontologyManagerSvc.getImportedOntologies.and.returnValue($q.reject('Error message'));
                mappingManagerSvc.getSourceOntologies(test.ontologyInfo).then(function() {
                    fail('The promise should have rejected');
                    done();
                }, function(errorMessage) {
                    expect(mappingManagerSvc.getOntology).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(test.ontologyInfo.recordId, test.ontologyInfo.branchId, test.ontologyInfo.commitId);
                    expect(errorMessage).toBe('Error message');
                    done();
                });
                scope.$apply();
            });
            it('successfully', function(done) {
                var test = this;
                ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([{ontologyId: test.importedOntology.id, ontology: test.importedOntology.entities}]));
                mappingManagerSvc.getSourceOntologies(test.ontologyInfo).then(function(ontologies) {
                    expect(mappingManagerSvc.getOntology).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(test.ontologyInfo.recordId, test.ontologyInfo.branchId, test.ontologyInfo.commitId);
                    expect(ontologies).toContain(test.ontology);
                    expect(ontologies).toContain(test.importedOntology);
                    done();
                });
                scope.$apply();
            });
        });
        describe('if the ontology is not open', function() {
            beforeEach(function() {
                ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([{ontologyId: this.importedOntology.id, ontology: this.importedOntology.entities}]));
            });
            it('unless an error occurs', function(done) {
                var test = this;
                spyOn(mappingManagerSvc, 'getOntology').and.returnValue($q.reject('Error message'));
                mappingManagerSvc.getSourceOntologies(test.ontologyInfo).then(function() {
                    fail('The promise should have rejected');
                    done();
                }, function(errorMessage) {
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(test.ontologyInfo);
                    expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalled();
                    expect(errorMessage).toBe('Error message');
                    done();
                });
                scope.$apply();
            });
            it('successfully', function(done) {
                var test = this;
                spyOn(mappingManagerSvc, 'getOntology').and.returnValue($q.when(test.ontology));
                mappingManagerSvc.getSourceOntologies(test.ontologyInfo).then(function(ontologies) {
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(test.ontologyInfo);
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(test.ontologyInfo.recordId, test.ontologyInfo.branchId, test.ontologyInfo.commitId);
                    expect(ontologies).toContain(test.ontology);
                    expect(ontologies).toContain(test.importedOntology);
                    done();
                });
                scope.$apply();
            });
        });
    });
    it('should get the info of the source ontology of a mapping', function() {
        var mapping = {'@id': 'mappingname', '@type': ['Mapping']};
        mapping[prefixes.delim + 'sourceRecord'] = [{'@id': 'record'}];
        mapping[prefixes.delim + 'sourceBranch'] = [{'@id': 'branch'}];
        mapping[prefixes.delim + 'sourceCommit'] = [{'@id': 'commit'}];
        var result = mappingManagerSvc.getSourceOntologyInfo([mapping]);
        expect(result.recordId).toBe('record');
        expect(result.branchId).toBe('branch');
        expect(result.commitId).toBe('commit');
    });
    it('should find the source ontology with a certain class', function() {
        var ontology = {};
        var sourceOntologies = [ontology];
        ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'class'}]);
        var result = mappingManagerSvc.findSourceOntologyWithClass('class', sourceOntologies);
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getClasses.and.returnValue([]);
        result = mappingManagerSvc.findSourceOntologyWithClass('class', sourceOntologies);
        expect(result).toBeUndefined();
    });
    it('should find the source ontology with a certain property', function() {
        var ontology = {};
        var sourceOntologies = [ontology];
        ontologyManagerSvc.getDataTypeProperties.and.returnValue([{'@id': 'prop'}]);
        var result = mappingManagerSvc.findSourceOntologyWithProp('prop', sourceOntologies);
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getDataTypeProperties.and.returnValue([]);
        ontologyManagerSvc.getObjectProperties.and.returnValue([{'@id': 'prop'}]);
        result = mappingManagerSvc.findSourceOntologyWithProp('prop', sourceOntologies);
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getObjectProperties.and.returnValue([]);
        result = mappingManagerSvc.findSourceOntologyWithProp('prop', sourceOntologies);
        expect(result).toBeUndefined();
    });
    it('should test whether a mapping and its source ontologies are compatible', function() {
        spyOn(mappingManagerSvc, 'findIncompatibleMappings').and.returnValue([]);
        expect(mappingManagerSvc.areCompatible({}, [])).toBe(true);

        mappingManagerSvc.findIncompatibleMappings.and.returnValue([{}]);
        expect(mappingManagerSvc.areCompatible({}, [])).toBe(false);
    });
    describe('should collect incompatible entities within a mapping based on its source ontologies when', function() {
        beforeEach(function() {
            this.mapping = {jsonld: []};
            this.sourceOntologies = [{}];
            this.classMapping = {id: 'classMapping'};
            this.classObj = {'id': 'class'};
            this.dataPropMapping = {id: 'dataMapping'};
            this.dataPropObj = {'id': 'dataProp'};
            this.objectPropMapping = {id: 'objectMapping'};
            this.objectPropObj = {'id': 'objectProp'};
            var self = this;
            ontologyManagerSvc.getEntity.and.callFake(function(arr, id) {
                if (id === self.classObj.id) {
                    return self.classObj;
                } else if (id === self.dataPropObj.id) {
                    return self.dataPropObj;
                } else if (id === self.objectPropObj.id) {
                    return self.objectPropObj;
                } else {
                    return undefined;
                }
            });
            spyOn(mappingManagerSvc, 'getPropIdByMapping').and.callFake(function(propObj) {
                if (propObj === self.objectPropMapping) {
                    return self.objectPropObj.id;
                } else if (propObj === self.dataPropMapping) {
                    return self.dataPropObj.id;
                } else {
                    return '';
                }
            });
            spyOn(mappingManagerSvc, 'getClassIdByMapping').and.returnValue(this.classObj.id);
            spyOn(mappingManagerSvc, 'getAllClassMappings');
            spyOn(mappingManagerSvc, 'getAllDataMappings');
            spyOn(mappingManagerSvc, 'getAllObjectMappings');
            spyOn(mappingManagerSvc, 'findSourceOntologyWithClass');
            spyOn(mappingManagerSvc, 'findSourceOntologyWithProp');
        });
        it('class does not exist', function() {
            mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.classMapping]);
        });
        it('class is deprecated', function() {
            mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);
            mappingManagerSvc.findSourceOntologyWithClass.and.returnValue({});
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.classMapping]);
        });
        it('data property does not exist and is not an annotation property', function() {
            mappingManagerSvc.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.dataPropMapping]);
        });
        it('data property is an annotation property', function() {
            mappingManagerSvc.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            mappingManagerSvc.annotationProperties = [this.dataPropObj.id];
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([]);
        });
        it('data property is deprecated', function() {
            mappingManagerSvc.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.dataPropMapping]);
        });
        it('data property is not a data property', function() {
            mappingManagerSvc.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.dataPropMapping]);
        });
        it('object property does not exist', function() {
            mappingManagerSvc.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.objectPropMapping]);
        });
        it('object property is deprecated', function() {
            mappingManagerSvc.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.objectPropMapping]);
        });
        it('object property is not a object property', function() {
            mappingManagerSvc.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.objectPropMapping]);
        });
        it('object property range class is not the same', function() {
            mappingManagerSvc.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.objectPropMapping]);
        });
        it('Object property range is incompatible', function() {
            mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);
            mappingManagerSvc.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            utilSvc.getPropertyId.and.returnValue(this.classObj.id);
            expect(mappingManagerSvc.findIncompatibleMappings(this.mapping, this.sourceOntologies)).toEqual([this.classMapping, this.objectPropMapping]);
        });
    });
    describe('should get a data mapping from a class mapping', function() {
        it('unless it does not exist', function() {
            var classMapping = {'@id': 'classId'};
            var result = mappingManagerSvc.getDataMappingFromClass([classMapping], 'classId', 'propId');
            expect(result).toBe(undefined);
        });
        it('if it exists', function() {
            var dataMapping = {'@id': 'dataMapping', '@type': ['DataMapping'], 'hasProperty': [{'@id': 'propId'}]};
            var classMapping = {'@id': 'classId', 'dataProperty': [{'@id': dataMapping['@id']}]};
            var result = mappingManagerSvc.getDataMappingFromClass([classMapping, dataMapping], 'classId', 'propId');
            expect(result).toEqual(dataMapping);
        });
    });
    it('should get all class mappings in a mapping', function() {
        var result = mappingManagerSvc.getAllClassMappings([{'@type': ['ClassMapping']}]);
        expect(result.length).toBe(1);
    });
    it('should get all object mappings in a mapping', function() {
        var result = mappingManagerSvc.getAllObjectMappings([{'@type': ['ObjectMapping']}]);
        expect(result.length).toBe(1);
    });
    it('should get all data mappings in a mapping', function() {
        var result = mappingManagerSvc.getAllDataMappings([{'@type': ['DataMapping']}]);
        expect(result.length).toBe(1);
    });
    it('should get all the property mappings for a class mapping in a mapping', function() {
        var dataMapping = {'@id': 'data'};
        var objectMapping = {'@id': 'object'};
        var classMapping = {'@id': 'classId', 'dataProperty': [dataMapping], 'objectProperty': [objectMapping]};
        var result = mappingManagerSvc.getPropMappingsByClass([classMapping, dataMapping, objectMapping], classMapping['@id']);
        expect(result.length).toBe(2);
    });
    it('should test whether a mapping entity is a class mapping', function() {
        var result = mappingManagerSvc.isClassMapping({});
        expect(result).toBe(false);
        result = mappingManagerSvc.isClassMapping({'@type': ['ClassMapping']});
        expect(result).toBe(true);
    });
    it('should test whether a mapping entity is an object mapping', function() {
        var result = mappingManagerSvc.isObjectMapping({});
        expect(result).toBe(false);
        result = mappingManagerSvc.isObjectMapping({'@type': ['ObjectMapping']});
        expect(result).toBe(true);
    });
    it('should test whether a mapping entity is a data mapping', function() {
        var result = mappingManagerSvc.isDataMapping({});
        expect(result).toBe(false);
        result = mappingManagerSvc.isDataMapping({'@type': ['DataMapping']});
        expect(result).toBe(true);
    });
    it('should find the parent class mapping for a data mapping', function() {
        var classMapping = {'@id': 'classId', '@type': ['ClassMapping'], 'dataProperty': [{'@id': 'propId'}]};
        var result = mappingManagerSvc.findClassWithDataMapping([classMapping], 'propId');
        expect(result).toEqual(classMapping);
    });
    it('should find the parent class mapping for an object mapping', function() {
        var classMapping = {'@id': 'classId', '@type': ['ClassMapping'], 'objectProperty': [{'@id': 'propId'}]};
        var result = mappingManagerSvc.findClassWithObjectMapping([classMapping], 'propId');
        expect(result).toEqual(classMapping);
    });
    it('should find all object property mappings that link to a specified class mapping', function() {
        var classMappingId = 'class';
        var prop = {};
        prop[prefixes.delim + 'classMapping'] = [{'@id': classMappingId}];
        spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([prop]);
        var result = mappingManagerSvc.getPropsLinkingToClass([], classMappingId);
        expect(result).toContain(prop);
    });
    it('should return the title of a property mapping', function() {
        var result = mappingManagerSvc.getPropMappingTitle('class', 'prop');
        expect(typeof result).toBe('string');
    });
});
