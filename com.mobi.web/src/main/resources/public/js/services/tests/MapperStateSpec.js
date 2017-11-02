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
describe('Mapper State service', function() {
    var mapperStateSvc, $q, scope, prefixes, ontologyManagerSvc, mappingManagerSvc, delimitedManagerSvc, utilSvc, catalogManagerSvc;

    beforeEach(function() {
        module('mapperState');
        mockPrefixes();
        mockMappingManager();
        mockOntologyManager();
        mockDelimitedManager();
        mockUtil();
        mockCatalogManager();

        inject(function(mapperStateService, _$q_, _$rootScope_, _prefixes_, _ontologyManagerService_, _mappingManagerService_, _delimitedManagerService_, _utilService_, _catalogManagerService_) {
            mapperStateSvc = mapperStateService;
            $q = _$q_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            utilSvc = _utilService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        this.catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        mapperStateSvc.mapping = {
            jsonld: [],
            record: {id: 'mapping'},
            difference: {
                additions: [],
                deletions: []
            }
        };
    });

    afterEach(function() {
        mapperStateSvc = null;
        $q = null;
        scope = null;
        prefixes = null;
        ontologyManagerSvc = null;
        mappingManagerSvc = null;
        delimitedManagerSvc = null;
        utilSvc = null;
        catalogManagerSvc = null;
    });

    it('should initialize important variables', function() {
        mapperStateSvc.initialize();
        expect(mapperStateSvc.editMapping).toBe(false);
        expect(mapperStateSvc.newMapping).toBe(false);
        expect(mapperStateSvc.step).toBe(0);
        expect(mapperStateSvc.editTabs).toEqual({edit: true, commits: false});
        expect(mapperStateSvc.invalidProps).toEqual([]);
        expect(mapperStateSvc.availablePropsByClass).toEqual({});
        expect(mapperStateSvc.mapping).toBeUndefined();
        expect(mapperStateSvc.sourceOntologies).toEqual([]);
    });
    it('should reset edit related variables', function() {
        mapperStateSvc.resetEdit();
        expect(mapperStateSvc.selectedClassMappingId).toBe('');
        expect(mapperStateSvc.selectedPropMappingId).toBe('');
        expect(mapperStateSvc.highlightIndexes).toEqual([]);
        expect(mapperStateSvc.newProp).toBe(false);
    });
    it('should set all variables for creating a new mapping', function() {
        spyOn(mapperStateSvc, 'resetEdit');
        var result = mapperStateSvc.createMapping();
        expect(mapperStateSvc.editMapping).toBe(true);
        expect(mapperStateSvc.newMapping).toBe(true);
        expect(result).toEqual({jsonld: [], record: {}, ontology: undefined, difference: {additions: [], deletions: []}});
        expect(mapperStateSvc.sourceOntologies).toEqual([]);
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
    });
    it('should test whether the mapping has been changed', function() {
        expect(mapperStateSvc.isMappingChanged()).toEqual(false);
        mapperStateSvc.mapping.difference.additions = [{}];
        expect(mapperStateSvc.isMappingChanged()).toEqual(true);
        mapperStateSvc.mapping.difference.deletions = [{}];
        expect(mapperStateSvc.isMappingChanged()).toEqual(true);
        mapperStateSvc.mapping.difference.additions = [];
        expect(mapperStateSvc.isMappingChanged()).toEqual(true);
    });
    describe('should save the current mapping', function() {
        describe('if it is a new mapping', function() {
            beforeEach(function() {
                mapperStateSvc.newMapping = true;
            });
            it('unless an error occurs', function() {
                mappingManagerSvc.upload.and.returnValue($q.reject('Error message'));
                mapperStateSvc.saveMapping()
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual('Error message');
                    });
                scope.$apply();
                expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                mappingManagerSvc.upload.and.returnValue($q.when('id'));
                mapperStateSvc.saveMapping().then(function(response) {
                    expect(response).toEqual('id');
                }, function(response) {
                    fail('Promise should have resolved');
                });
                scope.$apply();
                expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
            });
        });
        describe('if it is an existing mapping', function() {
            beforeEach(function() {
                mapperStateSvc.newMapping = false;
            });
            describe("and createInProgressCommit resolves", function() {
                beforeEach(function() {
                    catalogManagerSvc.createInProgressCommit.and.returnValue($q.when());
                });
                describe('and updateInProgressCommit resolves', function() {
                    beforeEach(function() {
                        catalogManagerSvc.updateInProgressCommit.and.returnValue($q.when());
                    });
                    it('and createBranchCommit resolves', function() {
                        catalogManagerSvc.createBranchCommit.and.returnValue($q.when(''));
                        var add1 = {'@id': 'add1'};
                        var add2 = {'@id': 'add2'};
                        var add3 = {'@id': 'add3'};
                        var del1 = {'@id': 'del1'};
                        mapperStateSvc.mapping.difference.additions = [add1, add2, add3];
                        mapperStateSvc.mapping.difference.deletions = [del1, add2];
                        mapperStateSvc.mapping.jsonld = [add1, add2, add3];
                        mappingManagerSvc.isClassMapping.and.callFake(function(obj) {
                            return _.isEqual(obj, add1);
                        });
                        mappingManagerSvc.isPropertyMapping.and.callFake(function(obj) {
                            return _.isEqual(obj, add2) || _.isEqual(obj, del1);
                        });
                        mappingManagerSvc.getClassIdByMapping.and.callFake(function(obj) {
                            return 'Class';
                        });
                        mappingManagerSvc.getPropIdByMapping.and.callFake(function(obj) {
                            if (_.isEqual(obj, add2)) {
                                return 'Prop 1';
                            } else {
                                return 'Prop 2';
                            }
                        });
                        utilSvc.getBeautifulIRI.and.callFake(_.identity);
                        mapperStateSvc.saveMapping()
                            .then(function(response) {
                                expect(response).toEqual(mapperStateSvc.mapping.record.id);
                            }, function(response) {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId);
                        expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId, mapperStateSvc.mapping.difference);
                        expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.branch, mapperStateSvc.mapping.record.id, this.catalogId, 'Changed Class, Prop 1, add3, Prop 2');
                    });
                    it('and createBranchCommit rejects', function() {
                        catalogManagerSvc.createBranchCommit.and.returnValue($q.reject('Error message'));
                        mapperStateSvc.saveMapping()
                            .then(function(response) {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual('Error message');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId);
                        expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId, mapperStateSvc.mapping.difference);
                        expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.branch, mapperStateSvc.mapping.record.id, this.catalogId, jasmine.any(String));
                    });
                });
                it('and updateInProgressCommit rejects', function() {
                    catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject('Error message'));
                    mapperStateSvc.saveMapping()
                        .then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual('Error message');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId);
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId, mapperStateSvc.mapping.difference);
                    expect(catalogManagerSvc.createBranchCommit).not.toHaveBeenCalled();
                });
            });
            it('and createInProgressCommit rejects', function() {
                catalogManagerSvc.createInProgressCommit.and.returnValue($q.reject('Error message'));
                mapperStateSvc.saveMapping()
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual('Error message');
                    });
                scope.$apply();
                expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId);
                expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
                expect(catalogManagerSvc.createBranchCommit).not.toHaveBeenCalled();
            });
        });
    });
    describe('should retrieve and set the master branch of the current mapping record', function() {
        it('if getRecordMasterBranch resolves', function() {
            catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({}));
            mapperStateSvc.setMasterBranch();
            scope.$apply();
            expect(mapperStateSvc.mapping.branch).toEqual({});
            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
        });
        it('unless getRecordMasterBranch rejects', function() {
            catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject('Error message'));
            mapperStateSvc.setMasterBranch();
            scope.$apply();
            expect(mapperStateSvc.mapping.branch).toBeUndefined();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
        });
    });
    it('should set the list of invalid property mappings', function() {
        delimitedManagerSvc.dataRows = [['']];
        var invalidProp = {'@id': 'invalid'};
        invalidProp[prefixes.delim + 'columnIndex'] = '1';
        var validProp = {'@id': 'valid'};
        validProp[prefixes.delim + 'columnIndex'] = '0';
        utilSvc.getPropertyValue.and.callFake(function(obj, prop) {
            return obj[prop];
        });
        mappingManagerSvc.getAllDataMappings.and.returnValue([invalidProp, validProp]);
        mapperStateSvc.setInvalidProps();
        expect(mapperStateSvc.invalidProps).toContain(jasmine.objectContaining({'@id': invalidProp['@id'], index: 1}));
    });
    it('should return a list of all the mapped column indexes', function() {
        var dataMappings = [{}];
        utilSvc.getPropertyValue.and.returnValue('0');
        mappingManagerSvc.getAllDataMappings.and.returnValue(dataMappings);
        var results = mapperStateSvc.getMappedColumns();
        expect(_.isArray(results)).toBe(true);
        expect(results.length).toBe(dataMappings.length);
        _.forEach(results, function(result, idx) {
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(dataMappings[idx], prefixes.delim + 'columnIndex');
            expect(result).toBe('0');
        });
    });
    it('should check whether a class mapping has available properties', function() {
        mapperStateSvc.availablePropsByClass = {'class': [{}]};
        var result = mapperStateSvc.hasAvailableProps('class');
        expect(result).toBe(true);
        result = mapperStateSvc.hasAvailableProps('class1');
        expect(result).toBe(false);
    });
    it('should remove the list of available properties for a class', function() {
        mapperStateSvc.availablePropsByClass = {'class': []};
        mapperStateSvc.removeAvailableProps('class');
        expect(mapperStateSvc.availablePropsByClass.class).toBeUndefined();
    });
    it('should set the list of available properties for a class mapping', function() {
        mapperStateSvc.sourceOntologies = [{}];
        var classMapId = 'classMap';
        var classId = 'class';
        var classProps = [{propObj: {'@id': 'prop1'}}, {propObj: {'@id': 'prop2'}}];
        var noDomainProps = [{propObj: {'@id': 'prop3'}}, {propObj: {'@id': 'prop4'}}];
        var propMappings = [{}, {}];
        propMappings[0][prefixes.delim + 'hasProperty'] = classProps[0].propObj['@id'];
        propMappings[1][prefixes.delim + 'hasProperty'] = noDomainProps[0].propObj['@id'];
        mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
        utilSvc.getPropertyId.and.callFake(function(obj, prop) {
            return obj[prop];
        });
        mappingManagerSvc.getClassIdByMappingId.and.returnValue(classId);
        mappingManagerSvc.annotationProperties = ['test'];
        spyOn(mapperStateSvc, 'getClassProps').and.returnValue(_.union(classProps, noDomainProps));
        mapperStateSvc.setAvailableProps(classMapId);
        _.forEach(propMappings, function(propMapping) {
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(propMapping, prefixes.delim + 'hasProperty');
        });
        expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapId);
        expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapId);
        expect(mapperStateSvc.getClassProps).toHaveBeenCalledWith(mapperStateSvc.sourceOntologies, classId);
        expect(mapperStateSvc.availablePropsByClass[classMapId]).not.toContain(classProps[0]);
        expect(mapperStateSvc.availablePropsByClass[classMapId]).toContain(classProps[1]);
        expect(mapperStateSvc.availablePropsByClass[classMapId] ).not.toContain(noDomainProps[0]);
        expect(mapperStateSvc.availablePropsByClass[classMapId]).toContain(noDomainProps[1]);
        _.forEach(mappingManagerSvc.annotationProperties, function(prop) {
            expect(mapperStateSvc.availablePropsByClass[classMapId]).toContain({ontologyId: '', propObj: {'@id': prop}});
        });
    });
    it('should get the list of available properties for a class mapping', function() {
        var availableProps = [{}];
        mapperStateSvc.availablePropsByClass = {'class': availableProps};
        var result = mapperStateSvc.getAvailableProps('class');
        expect(result).toEqual(availableProps);
        result = mapperStateSvc.getAvailableProps('class1');
        expect(result).toEqual([]);
    });
    it('should get the list of properties usable with a class', function() {
        var ontologies = [{id: 'ontology1', entities: []}, {id: 'ontology2', entities: [{}]}];
        var classProps = [{'@id': 'prop1'}, {'@id': 'prop2'}];
        var noDomainProps = [{'@id': 'prop3'}, {'@id': 'prop4'}];
        ontologyManagerSvc.getClassProperties.and.callFake(function(entities, classId) {
            return _.isEqual(entities, [ontologies[0].entities]) ? [classProps[0]] : [classProps[1]];
        });
        ontologyManagerSvc.getNoDomainProperties.and.callFake(function(entities) {
            return _.isEqual(entities, [ontologies[0].entities]) ? noDomainProps : [];
        });
        var result = mapperStateSvc.getClassProps(ontologies, 'class');
        expect(ontologyManagerSvc.getClassProperties.calls.count()).toBe(ontologies.length);
        expect(ontologyManagerSvc.getNoDomainProperties.calls.count()).toBe(ontologies.length);
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: classProps[0]});
        expect(result).toContain({ontologyId: ontologies[1].id, propObj: classProps[1]});
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: noDomainProps[0]});
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: noDomainProps[1]});
    });
    it('should get the list of classes from a list of ontologies', function() {
        var ontologies = [{id: 'ontology1', entities: []}, {id: 'ontology2', entities: [{}]}];
        var classes1 = [{'@id': 'class1'}];
        var classes2 = [{'@id': 'class2'}];
        ontologyManagerSvc.getClasses.and.callFake(function(entities) {
            return _.isEqual(entities, [ontologies[0].entities]) ? classes1 : classes2;
        });
        var result = mapperStateSvc.getClasses(ontologies);
        expect(result).toContain({ontologyId: ontologies[0].id, classObj: classes1[0]});
        expect(result).toContain({ontologyId: ontologies[1].id, classObj: classes2[0]});
    });
    describe('should reflect the change of a property value in the difference', function() {
        beforeEach(function() {
            this.entityId = 'entity';
            this.propId = 'prop';
            this.newValue = 'new';
            this.originalValue = 'original';
            this.otherValue = 'other';
            utilSvc.getPropertyValue.and.callFake(function(obj, propId) {
                return _.get(obj, "['" + propId + "'][0]['@value']", '');
            });
            utilSvc.getPropertyId.and.callFake(function(obj, propId) {
                return _.get(obj, "['" + propId + "'][0]['@id']", '');
            });
        });
        it('unless the new value is the same as the original', function() {
            var additions = angular.copy(mapperStateSvc.mapping.difference.additions);
            var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
            mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.newValue);
            expect(mapperStateSvc.mapping.difference.additions).toEqual(additions);
            expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
        });
        describe('if the new value is different', function() {
            describe('and the property has a @id value', function() {
                it('and the property was just set', function() {
                    var additionObj = {'@id': this.entityId};
                    additionObj[this.propId] = [{'@id': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue, true);
                    expect(additionObj[this.propId]).toEqual([{'@id': this.newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was just opened', function() {
                    var expectedAddition = {'@id': this.entityId};
                    expectedAddition[this.propId] = [{'@id': this.newValue}];
                    var expectedDeletion = {'@id': this.entityId};
                    expectedDeletion[this.propId] = [{'@id': this.originalValue}];
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue, true);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
                it('and the entity was opened and the property already changed', function() {
                    var additionObj = {'@id': this.entityId};
                    additionObj[this.propId] = [{'@id': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    deletionObj[this.propId] = [{'@id': this.otherValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue, true);
                    expect(additionObj[this.propId]).toEqual([{'@id': this.newValue}]);
                    expect(deletionObj[this.propId]).toEqual([{'@id': this.otherValue}]);
                });
                it('and nothing has been set on the entity', function() {
                    var expectedAddition = {'@id': this.entityId};
                    expectedAddition[this.propId] = [{'@id': this.newValue}];
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, '', true);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was opened and another property was altered', function() {
                    var additionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue, true);
                    expect(additionObj[this.propId]).toEqual([{'@id': this.newValue}]);
                    expect(deletionObj[this.propId]).toEqual([{'@id': this.originalValue}]);
                });
                it('and the property was not set and another property was changed', function() {
                    var additionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, '', true);
                    expect(additionObj[this.propId]).toEqual([{'@id': this.newValue}]);
                    expect(_.has(deletionObj, "['" + this.propId + "']")).toEqual(false);
                });
                it('and the property was not set and another property was added', function() {
                    var additionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, '', true);
                    expect(additionObj[this.propId]).toEqual([{'@id': this.newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the property was changed back with no other changes', function() {
                    var additionObj = {'@id': this.entityId};
                    additionObj[this.propId] = [{'@id': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    deletionObj[this.propId] = [{'@id': this.newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue, true);
                    expect(mapperStateSvc.mapping.difference.additions).toEqual([]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with other changes', function() {
                    var expectedAddition = {'@id': this.entityId, test: true};
                    var additionObj = angular.copy(expectedAddition);
                    additionObj[this.propId] = [{'@id': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var expectedDeletion = {'@id': this.entityId, test: false};
                    var deletionObj = angular.copy(expectedDeletion);
                    deletionObj[this.propId] = [{'@id': this.newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue, true);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
            });
            describe('and the property has a @value value', function() {
                it('and the property was just set', function() {
                    var additionObj = {'@id': this.entityId};
                    additionObj[this.propId] = [{'@value': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue);
                    expect(additionObj[this.propId]).toEqual([{'@value': this.newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was just opened', function() {
                    var expectedAddition = {'@id': this.entityId};
                    expectedAddition[this.propId] = [{'@value': this.newValue}];
                    var expectedDeletion = {'@id': this.entityId};
                    expectedDeletion[this.propId] = [{'@value': this.originalValue}];
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
                it('and the entity was opened and the property already changed', function() {
                    var additionObj = {'@id': this.entityId};
                    additionObj[this.propId] = [{'@value': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    deletionObj[this.propId] = [{'@value': this.otherValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue);
                    expect(additionObj[this.propId]).toEqual([{'@value': this.newValue}]);
                    expect(deletionObj[this.propId]).toEqual([{'@value': this.otherValue}]);
                });
                it('and nothing has been set on the entity', function() {
                    var expectedAddition = {'@id': this.entityId};
                    expectedAddition[this.propId] = [{'@value': this.newValue}];
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, '');
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was opened and another property was altered', function() {
                    var additionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue);
                    expect(additionObj[this.propId]).toEqual([{'@value': this.newValue}]);
                    expect(deletionObj[this.propId]).toEqual([{'@value': this.originalValue}]);
                });
                it('and the property was not set and another property was changed', function() {
                    var additionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, '');
                    expect(additionObj[this.propId]).toEqual([{'@value': this.newValue}]);
                    expect(_.has(deletionObj, "['" + this.propId + "']")).toEqual(false);
                });
                it('and the property was not set and another property was added', function() {
                    var additionObj = {'@id': this.entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, '');
                    expect(additionObj[this.propId]).toEqual([{'@value': this.newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the property was changed back with no other changes', function() {
                    var additionObj = {'@id': this.entityId};
                    additionObj[this.propId] = [{'@value': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': this.entityId};
                    deletionObj[this.propId] = [{'@value': this.newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue);
                    expect(mapperStateSvc.mapping.difference.additions).toEqual([]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with other changes', function() {
                    var expectedAddition = {'@id': this.entityId, test: true};
                    var additionObj = angular.copy(expectedAddition);
                    additionObj[this.propId] = [{'@value': this.originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var expectedDeletion = {'@id': this.entityId, test: false};
                    var deletionObj = angular.copy(expectedDeletion);
                    deletionObj[this.propId] = [{'@value': this.newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(this.entityId, this.propId, this.newValue, this.originalValue);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
            });
        });
    });
    describe('should reflect the deletion of entity in the difference', function() {
        beforeEach(function () {
            this.entity = {'@id': 'entity', test: [false]};
        });
        it('if the entire entity was added originally', function() {
            mapperStateSvc.mapping.difference.additions.push(angular.copy(this.entity));
            var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
            mapperStateSvc.deleteEntity(this.entity);
            expect(mapperStateSvc.mapping.difference.additions.length).toEqual(0);
            expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
        });
        describe('if no part of the entity was added', function() {
            beforeEach(function() {
                this.additions = angular.copy(mapperStateSvc.mapping.difference.additions);
            });
            it('or deleted', function() {
                mapperStateSvc.deleteEntity(this.entity);
                expect(mapperStateSvc.mapping.difference.additions).toEqual(this.additions);
                expect(mapperStateSvc.mapping.difference.deletions).toContain(this.entity);
            });
            it('and a part was deleted', function() {
                var originalDeletionObj = {'@id': this.entity['@id'], test: [true]};
                var expected = _.merge({}, originalDeletionObj, this.entity);
                mapperStateSvc.mapping.difference.deletions.push(originalDeletionObj);
                mapperStateSvc.deleteEntity(this.entity);
                expect(mapperStateSvc.mapping.difference.additions).toEqual(this.additions);
                expect(originalDeletionObj).toEqual(expected);
            });
        });
    });
    it('should delete a class and update the difference', function() {
        var classMapping = {'@id': 'classMapping'};
        var propMapping = {'@id': 'propMapping'};
        mapperStateSvc.invalidProps = [{'@id': propMapping['@id']}];
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([propMapping]);
        mappingManagerSvc.removeClass.and.returnValue(classMapping);
        spyOn(mapperStateSvc, 'deleteEntity');
        spyOn(mapperStateSvc, 'removeAvailableProps');
        mapperStateSvc.deleteClass(classMapping['@id']);
        expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
        expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
        expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
        expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(classMapping);
        expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
        expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(classMapping['@id']);
        expect(mapperStateSvc.invalidProps.length).toEqual(0);
    });
    describe('should delete a property and update the difference', function() {
        beforeEach(function() {
            this.propMapping = {'@id': 'propMapping'};
            this.classMappingId = 'classMapping';
            this.propObj = {'@id': 'prop', test: [true]}
            this.availableProps = [];
            mapperStateSvc.invalidProps = [{'@id': this.propMapping['@id']}];
            mappingManagerSvc.removeProp.and.returnValue(this.propMapping);
            mappingManagerSvc.getPropIdByMapping.and.returnValue(this.propObj['@id']);
            spyOn(mapperStateSvc, 'getAvailableProps').and.returnValue(this.availableProps);
            spyOn(mapperStateSvc, 'deleteEntity');
        });
        it('if it is an annotation property', function() {
            mappingManagerSvc.annotationProperties = [this.propObj['@id']];
            mappingManagerSvc.isDataMapping.and.returnValue(true);
            mapperStateSvc.deleteProp(this.propMapping['@id'], this.classMappingId);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
            expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(this.propMapping);
            expect(mappingManagerSvc.findSourceOntologyWithProp).not.toHaveBeenCalled();
            expect(mapperStateSvc.getAvailableProps).toHaveBeenCalledWith(this.classMappingId);
            expect(this.availableProps).toContain({ontologyId: '', propObj: {'@id': this.propObj['@id']}});
        });
        describe('if it is not an annotation property', function() {
            it('and exists in an ontology', function() {
                var ontology = {id: 'ontology', entities: []};
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(ontology);
                ontologyManagerSvc.getEntity.and.returnValue(this.propObj);
                mapperStateSvc.deleteProp(this.propMapping['@id'], this.classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(this.propObj['@id'], mapperStateSvc.sourceOntologies);
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith([ontology.entities], this.propObj['@id']);
                expect(mapperStateSvc.getAvailableProps).toHaveBeenCalledWith(this.classMappingId);
                expect(this.availableProps).toContain({ontologyId: ontology.id, propObj: this.propObj});
            });
            it('and does not exist in an ontology', function() {
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(undefined);
                mapperStateSvc.deleteProp(this.propMapping['@id'], this.classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(this.propObj['@id'], mapperStateSvc.sourceOntologies);
                expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
                expect(mapperStateSvc.getAvailableProps).not.toHaveBeenCalled();
                expect(this.availableProps.length).toEqual(0);
            });
        });
        it('if it was added originally', function () {
            utilSvc.hasPropertyId.and.returnValue(true);
            var additionObj = {'@id': this.classMappingId};
            mapperStateSvc.mapping.difference.additions.push(additionObj);
            var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
            mapperStateSvc.deleteProp(this.propMapping['@id'], this.classMappingId);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
            expect(utilSvc.hasPropertyId).toHaveBeenCalledWith(additionObj, prefixes.delim + 'dataProperty', this.propMapping['@id']);
            expect(utilSvc.removePropertyId).toHaveBeenCalledWith(additionObj, prefixes.delim + 'dataProperty', this.propMapping['@id']);
            expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
        });
        describe('if it was not added', function () {
            beforeEach(function() {
                this.additionObj = {'@id': this.classMappingId};
                mapperStateSvc.mapping.difference.additions.push(this.additionObj);
            });
            it('and the parent class mapping does not exist in deletions', function () {
                var deletionObj = {'@id': this.classMappingId};
                deletionObj[prefixes.delim + 'dataProperty'] = [{'@id': this.propMapping['@id']}];
                mapperStateSvc.deleteProp(this.propMapping['@id'], this.classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
                expect(utilSvc.hasPropertyId).toHaveBeenCalledWith(this.additionObj, prefixes.delim + 'dataProperty', this.propMapping['@id']);
                expect(utilSvc.removePropertyId).not.toHaveBeenCalled();
                expect(mapperStateSvc.mapping.difference.deletions).toContain(deletionObj);
                expect(mapperStateSvc.invalidProps.length).toEqual(0);
            });
            it('and the parent class mapping does exist in deletions', function () {
                var deletionObj = {'@id': this.classMappingId};
                mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                mapperStateSvc.deleteProp(this.propMapping['@id'], this.classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
                expect(utilSvc.hasPropertyId).toHaveBeenCalledWith(this.additionObj, prefixes.delim + 'dataProperty', this.propMapping['@id']);
                expect(utilSvc.removePropertyId).not.toHaveBeenCalled();
                expect(deletionObj[prefixes.delim + 'dataProperty']).toEqual([{'@id': this.propMapping['@id']}]);
                expect(mapperStateSvc.invalidProps.length).toEqual(0);
            });
        });
    });
});
