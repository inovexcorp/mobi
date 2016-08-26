/*-
 * #%L
 * org.matonto.web
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
    var $httpBackend,
        mappingManagerSvc,
        ontologyManagerSvc,
        uuidSvc,
        windowSvc,
        prefixes,
        $q;

    beforeEach(function() {
        module('mappingManager');
        mockPrefixes();
        injectSplitIRIFilter();
        mockOntologyManager();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(mappingManagerService, _ontologyManagerService_, _uuid_, _$httpBackend_, _$window_, _prefixes_, _$q_) {
            mappingManagerSvc = mappingManagerService;
            ontologyManagerSvc = _ontologyManagerService_;
            uuidSvc = _uuid_;
            $httpBackend = _$httpBackend_;
            windowSvc = _$window_;
            prefixes = _prefixes_;
            $q = _$q_;
        });
    });

    it('should set the correct initial state for previous mapping names', function() {
        var mappings = ['mapping1', 'mapping2'];
        $httpBackend.whenGET('/matontorest/mappings').respond(200, mappings);
        $httpBackend.flush();
        expect(mappingManagerSvc.previousMappingNames.length).toBe(mappings.length);
        _.forEach(mappingManagerSvc.previousMappingNames, function(name) {
            expect(typeof name).toBe('string');
        });
    });
    describe('should upload a mapping', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/mappings').respond(200, []);
            $httpBackend.flush();
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/mappings', 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            mappingManagerSvc.upload([]).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPOST('/matontorest/mappings', 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, 'mapping');
            mappingManagerSvc.upload([]).then(function(response) {
                expect(response).toBe('mapping');
                expect(mappingManagerSvc.previousMappingNames).toContain('mapping');
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('replacing an existing one', function(done) {
            var name = 'mappingname';
            mappingManagerSvc.previousMappingNames = [name];
            $httpBackend.expectPOST('/matontorest/mappings', 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, name);
            mappingManagerSvc.upload([]).then(function(response) {
                expect(response).toBe(name);
                expect(mappingManagerSvc.previousMappingNames).toEqual([name]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a mapping by name', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/mappings').respond(200, []);
            $httpBackend.flush();
        });
        it('unless an error occurs', function(done) {
            var name = 'mappingname';
            $httpBackend.expectGET('/matontorest/mappings/' + name).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            mappingManagerSvc.getMapping(name).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var name = 'mappingname';
            $httpBackend.expectGET('/matontorest/mappings/' + name).respond(200, {'@graph': []});
            mappingManagerSvc.getMapping(name).then(function(response) {
                expect(response).toEqual([]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should download a mapping by name', function() {
        mappingManagerSvc.downloadMapping('mapping', 'jsonld');
        expect(windowSvc.location).toBe('/matontorest/mappings/mapping?format=jsonld');
    });
    describe('should delete a mapping by name', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/mappings').respond(200, []);
            $httpBackend.flush();
        });
        it('unless an error occurs', function(done) {
            var name = 'mappingname';
            $httpBackend.expectDELETE('/matontorest/mappings/' + name).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            mappingManagerSvc.deleteMapping(name).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var name = 'mappingname';
            mappingManagerSvc.previousMappingNames = [name];
            $httpBackend.expectDELETE('/matontorest/mappings/' + name).respond(200, '');
            mappingManagerSvc.deleteMapping(name).then(function(response) {
                expect(mappingManagerSvc.previousMappingNames).not.toContain(name);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should create a new mapping', function() {
        var result = mappingManagerSvc.createNewMapping('mappingname');
        expect(_.isArray(result)).toBe(true);
        var obj = _.find(result, {'@id': 'mappingname'});
        expect(obj).toBeTruthy();
        expect(obj['@type']).toEqual(['Mapping']);
    });
    it('should set the source ontology of a mapping', function() {
        var mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        var result = mappingManagerSvc.setSourceOntology(mapping, 'ontology');
        var doc = _.find(result, {'@id': 'mappingname'});
        expect(doc.sourceOntology).toEqual([{'@id': 'ontology'}]);
    });
    describe('should add a class mapping to a mapping', function() {
        beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        });
        it('unless the class does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addClass(this.mapping, {}, 'classid');
            expect(result).toEqual(this.mapping);
        });
        it('if the class exists in the passed ontology', function() {
            var result = mappingManagerSvc.addClass(this.mapping, {}, 'classid');
            var obj = _.find(result, {'@type': ['ClassMapping']});
            expect(obj).toBeTruthy();
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(obj.mapsTo).toEqual([{'@id': 'classid'}]);
            expect(obj.localName).toEqual([{'@value': '${UUID}'}]);
        });
    });
    describe('should set the IRI template of a class mapping', function() {
        it('unless it does not exist in the mapping', function() {
            beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        });
            var result = mappingManagerSvc.editIriTemplate(this.mapping, 'classId', 'test/', '${0}');
            expect(result).toEqual(this.mapping);
        });
        it('successfully', function() {
            spyOn(mappingManagerSvc, 'getSourceOntologyId').and.returnValue('ontology');
            this.mapping.push({'@id': 'classId'});
            var result = mappingManagerSvc.editIriTemplate(this.mapping, 'classId', 'test/', '${0}');
            var obj = _.find(result, {'@id': 'classId'});
            expect(obj.hasPrefix[0]['@value']).toContain('test/');
            expect(obj.localName[0]['@value']).toBe('${0}');
        });
    });
    describe('should add a data property mapping to a mapping', function() {
        beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}, {'@id': 'classId'}];
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, 'classId', 'propId', 0);
            expect(result).toEqual(this.mapping);
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, 'classId', 'propId', 0);
            expect(result).toEqual(this.mapping);
        });
        it('unless the IRI passed is not for a data property', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, 'classId', 'propId', 0);
            expect(result).toEqual(this.mapping);
        });
        describe('if the data property exists in the passed ontology', function() {
            beforeEach(function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            });
            it('creating a new one', function() {
                var result = mappingManagerSvc.addDataProp(this.mapping, {}, 'classId', 'propId', 0);
                var classMapping = _.find(result, {'@id': 'classId'});
                var propMapping = _.find(result, {'@type': ['DataMapping']});
                expect(result.length).toBe(2);
                expect(propMapping).toBeTruthy();
                expect(uuidSvc.v4).toHaveBeenCalled();
                expect(_.isArray(classMapping.dataProperty)).toBe(true);
                expect(classMapping.dataProperty).toContain({'@id': propMapping['@id']});
                expect(propMapping.columnIndex[0]['@value']).toBe('0');
                expect(propMapping.hasProperty[0]['@id']).toEqual('propId');
            });
            it('replacing an existing one', function() {
                var dataMapping = {'@id': 'dataMapping', '@type': ['DataMapping'], columnIndex: [{'@value': 1}], hasProperty: [{'@id': 'propId'}]};
                this.mapping.push(dataMapping);
                spyOn(mappingManagerSvc, 'getDataMappingFromClass').and.returnValue(dataMapping);
                var result = mappingManagerSvc.addDataProp(this.mapping, {}, 'classId', 'propId', 0);
                var classMapping = _.find(result, {'@id': 'classId'});
                var propMapping = _.find(result, {'@type': ['DataMapping']});
                expect(result.length).toBe(2);
                expect(uuidSvc.v4).not.toHaveBeenCalled();
                expect(propMapping.columnIndex[0]['@value']).toEqual('0');
                expect(propMapping.hasProperty[0]['@id']).toEqual('propId');
            });
        });
    });
    describe('should add an object property mapping to a mapping', function() {
        beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}, {'@id': 'class1'}];
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], 'class1', 'propId');
            expect(result).toEqual(this.mapping);
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], 'class1', 'propId');
            expect(result).toEqual(this.mapping);
        });
        it('unless the IRI is not for an object property', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], 'class1', 'propId');
            expect(result).toEqual(this.mapping);
        });
        it('if the property exists in the passed ontology', function() {
            spyOn(mappingManagerSvc, 'findSourceOntologyWithClass').and.returnValue({});
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            var obj = {};
            obj[prefixes.rdfs + 'range'] = [{'@id': 'class2'}];
            ontologyManagerSvc.getEntity.and.returnValue(obj);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], 'class1', 'propId');
            var classMapping1 = _.find(result, {'@id': 'class1'});
            var classMapping2 = _.find(result, {'mapsTo': [{'@id': 'class2'}]});
            var propMapping = _.find(result, {'@type': ['ObjectMapping']});
            expect(propMapping).toBeTruthy();
            expect(classMapping2).toBeTruthy();
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(_.isArray(classMapping1.objectProperty)).toBe(true);
            expect(classMapping1.objectProperty).toContain({'@id': propMapping['@id']});
            expect(propMapping.classMapping[0]['@id']).toEqual(classMapping2['@id']);
            expect(propMapping.hasProperty[0]['@id']).toEqual('propId');
        });
    });
    describe('should remove a property mapping from a mapping', function() {
        it('unless the property mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.removeProp([], 'classId', 'propId');
            expect(result).toEqual([]);
        });
        describe('if the property mapping exists in mapping and is a data mapping', function() {
            beforeEach(function() {
                this.propMapping = {'@id': 'propId'};
                this.classMapping = {'@id': 'classId'};
            });
            it('and is a data property', function() {
                this.classMapping.dataProperty = [{}, this.propMapping]
                spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(false);
                var result = mappingManagerSvc.removeProp([this.classMapping, this.propMapping], 'classId', this.propMapping['@id']);
                var classMapping = _.find(result, {'@id': 'classId'});
                var obj = _.find(result, {'@id': 'propId'});
                expect(result.length).toBe(1);
                expect(obj).not.toBeTruthy();
                expect(_.isArray(classMapping.dataProperty)).toBe(true);
                expect(classMapping.dataProperty).not.toContain(this.propMapping);
            });
            it('and is an object property', function() {
                this.classMapping.objectProperty = [{}, this.propMapping];
                spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(true);
                var result = mappingManagerSvc.removeProp([this.classMapping, this.propMapping], 'classId', this.propMapping['@id']);
                var classMapping = _.find(result, {'@id': 'classId'});
                var obj = _.find(result, {'@id': 'propId'});
                expect(result.length).toBe(1);
                expect(obj).not.toBeTruthy();
                expect(_.isArray(classMapping.objectProperty)).toBe(true);
                expect(classMapping.objectProperty).not.toContain(this.propMapping);
            });
        });
    });
    describe('should remove a class mapping from a mapping', function() {
        it('unless the class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.removeClass([], 'classId');
            expect(result).toEqual([]);
        });
        describe('if the class mapping exists', function() {
            beforeEach(function() {
                this.classMapping = {'@id': 'classId'};            
            });
            it('and no object mappings use it', function() {
                var result = mappingManagerSvc.removeClass([this.classMapping], 'classId');
                expect(result).not.toContain(this.classMapping);
            });
            it('and object mappings use it', function() {
                var propMapping = {'@id': 'propId', 'classMapping': [this.classMapping]};
                var classMapping2 = {'@id': 'class2', 'objectProperty': [{}, {'@id': propMapping['@id']}]};
                spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([propMapping]);
                spyOn(mappingManagerSvc, 'findClassWithObjectMapping').and.returnValue(classMapping2);
                var result = mappingManagerSvc.removeClass([this.classMapping, propMapping, classMapping2], this.classMapping['@id']);
                var obj = _.find(result, {'@id': 'class2'});
                expect(_.isArray(obj.objectProperty)).toBe(true);
                expect(obj.objectProperty).not.toContain({'@id': 'propId'});
                expect(result).not.toContain(propMapping);
                expect(result).not.toContain(this.classMapping);
            });
            it('along with all its properties', function() {
                var objectMapping = {'@id': 'objectId', '@type': ['ObjectMapping']};
                var dataMapping = {'@id': 'dataId', '@type': ['DataMapping']};
                this.classMapping.objectProperty = [{}, objectMapping];
                this.classMapping.dataProperty = [{}, dataMapping];
                var result = mappingManagerSvc.removeClass([this.classMapping, objectMapping, dataMapping], 'classId');
                expect(result).not.toContain(this.classMapping);
                expect(result).not.toContain(dataMapping);
                expect(result).not.toContain(objectMapping);
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
        var classMapping = {'@id': 'classId', 'mapsTo': [{'@id': 'class'}]};
        var result = mappingManagerSvc.getClassIdByMapping(classMapping);
        expect(result).toBe('class');
    });
    it('should get the property id of a property mapping by its id', function() {
        var propMapping = {'@id': 'classId'};
        spyOn(mappingManagerSvc, 'getPropIdByMapping').and.returnValue('');
        var result = mappingManagerSvc.getPropIdByMappingId([propMapping], propMapping['@id']);
        expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
        expect(typeof result).toBe('string');
    });
    it('should get the property id of a property mapping', function() {
        var propMapping = {'@id': 'propId', 'hasProperty': [{'@id': 'prop'}]};
        var result = mappingManagerSvc.getPropIdByMapping(propMapping);
        expect(result).toBe('prop');
    });
    it('should get an ontology in the correct structure', function() {
        it('unless an error occurs', function(done) {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject({statusText: 'Error message'}));
            mappingManagerSvc.getOntology('').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(error) {
                expect(error).toBe('Error message');
                done();
            });
        });
        it('unless something went wrong', function(done) {
            ontologyManagerSvc.getOntology.and.returnValue($q.when({status: 206, statusText: 'Error message'}));
            mappingManagerSvc.getOntology('').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(error) {
                expect(error).toBe('Error message');
                done();
            });
        });
        it('successfully', function(done) {
            var ontology = {id: '', ontology: []};
            ontologyManagerSvc.getOntology.and.returnValue($q.when({status: 206, data: ontology}));
            mappingManagerSvc.getOntology('').then(function(response) {
                expect(typeof response).toBe('object');
                expect(response.id).toBe(ontology.id);
                expect(response.entities).toBe(ontology.ontology);
                done();
            });
        });
    });
    it('should get the id of the source ontology of a mapping', function() {
        var result = mappingManagerSvc.getSourceOntologyId([{'@id': 'mappingname', '@type': ['Mapping'], 'sourceOntology': [{'@id': 'ontology'}]}]);
        expect(result).toBe('ontology');
    });
    it('should get the source ontology of a mapping', function() {
        mappingManagerSvc.sourceOntologies = [{id: 'ontology'}]
        spyOn(mappingManagerSvc, 'getSourceOntologyId').and.returnValue('ontology')
        var result = mappingManagerSvc.getSourceOntology([]);
        expect(result).toEqual({id: 'ontology'});
    });
    it('should find the source ontology with a certain class', function() {
        var ontology = {};
        mappingManagerSvc.sourceOntologies = [ontology];
        ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'class'}]);
        var result = mappingManagerSvc.findSourceOntologyWithClass('class');
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getClasses.and.returnValue([]);
        result = mappingManagerSvc.findSourceOntologyWithClass('class');
        expect(result).toBeUndefined();
    });
    it('should find the source ontology with a certain property', function() {
        var ontology = {};
        mappingManagerSvc.sourceOntologies = [ontology];
        ontologyManagerSvc.getDataTypeProperties.and.returnValue([{'@id': 'prop'}]);
        var result = mappingManagerSvc.findSourceOntologyWithProp('prop');
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getDataTypeProperties.and.returnValue([]);
        ontologyManagerSvc.getObjectProperties.and.returnValue([{'@id': 'prop'}]);
        result = mappingManagerSvc.findSourceOntologyWithProp('prop');
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getObjectProperties.and.returnValue([]);
        result = mappingManagerSvc.findSourceOntologyWithProp('prop');
        expect(result).toBeUndefined();
    });
    it('should test whether the opened mapping and its source ontologies are compatible', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        spyOn(mappingManagerSvc, 'getAllClassMappings').and.returnValue([{}]);
        spyOn(mappingManagerSvc, 'getClassIdByMapping').and.returnValue('');
        spyOn(mappingManagerSvc, 'findSourceOntologyWithClass').and.returnValue(undefined);
        var result = mappingManagerSvc.areCompatible();
        expect(result).toBe(false);

        mappingManagerSvc.findSourceOntologyWithClass.and.returnValue({});
        spyOn(mappingManagerSvc, 'getPropMappingsByClass').and.returnValue([{}]);
        spyOn(mappingManagerSvc, 'getPropIdByMapping').and.returnValue('');
        spyOn(mappingManagerSvc, 'findSourceOntologyWithProp').and.returnValue(undefined);
        result = mappingManagerSvc.areCompatible();
        expect(result).toBe(false);

        mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
        ontologyManagerSvc.isObjectProperty.and.returnValue(true);
        spyOn(mappingManagerSvc, 'isDataMapping').and.returnValue(true);
        result = mappingManagerSvc.areCompatible();
        expect(result).toBe(false);

        ontologyManagerSvc.isObjectProperty.and.returnValue(false);
        ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
        spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(true);
        result = mappingManagerSvc.areCompatible();
        expect(result).toBe(false);

        ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
        result = mappingManagerSvc.areCompatible();
        expect(result).toBe(true);
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
    it('should return the title of a property mapping', function() {
        var result = mappingManagerSvc.getPropMappingTitle('class', 'prop');
        expect(typeof result).toBe('string');
    });
});