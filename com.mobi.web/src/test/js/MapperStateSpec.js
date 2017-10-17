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
    var $q, scope, mapperStateSvc, prefixes, ontologyManagerSvc, mappingManagerSvc, delimitedManagerSvc, utilSvc, catalogManagerSvc;

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

        catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': catalogId};
        mapperStateSvc.mapping = {
            jsonld: [],
            record: {id: 'mapping'},
            difference: {
                additions: [],
                deletions: []
            }
        };
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
            var uploadDeferred;
            beforeEach(function() {
                mapperStateSvc.newMapping = true;
                uploadDeferred = $q.defer();
                mappingManagerSvc.upload.and.returnValue(uploadDeferred.promise);
            });
            it('unless an error occurs', function(done) {
                uploadDeferred.reject('Error message');
                mapperStateSvc.saveMapping().then(function(response) {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual('Error message');
                    expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                    expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
                    done();
                });
                scope.$apply();
            });
            it('successfully', function(done) {
                uploadDeferred.resolve('id');
                mapperStateSvc.saveMapping().then(function(response) {
                    expect(response).toEqual('id');
                    expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                    expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
                    done();
                }, function(response) {
                    fail('Promise should have resolved');
                    done();
                });
                scope.$apply();
            });
        });
        describe('if it is an existing mapping', function() {
            var createDeferred;
            beforeEach(function() {
                mapperStateSvc.newMapping = false;
                createDeferred = $q.defer();
                catalogManagerSvc.createInProgressCommit.and.returnValue(createDeferred.promise);
            });
            describe("and createInProgressCommit resolves", function() {
                var updateDeferred;
                beforeEach(function() {
                    createDeferred.resolve();
                    updateDeferred = $q.defer();
                    catalogManagerSvc.updateInProgressCommit.and.returnValue(updateDeferred.promise);
                });
                describe('and updateInProgressCommit resolves', function() {
                    var createCommitDeferred;
                    beforeEach(function() {
                        updateDeferred.resolve();
                        createCommitDeferred = $q.defer();
                        catalogManagerSvc.createBranchCommit.and.returnValue(createCommitDeferred.promise);
                    });
                    it('and createBranchCommit resolves', function(done) {
                        createCommitDeferred.resolve('');
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
                        mapperStateSvc.saveMapping().then(function(response) {
                            expect(response).toEqual(mapperStateSvc.mapping.record.id);
                            expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId);
                            expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                            expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId, mapperStateSvc.mapping.difference);
                            expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.branch, mapperStateSvc.mapping.record.id, catalogId, 'Changed Class, Prop 1, add3, Prop 2');
                            done();
                        }, function(response) {
                            fail('Promise should have resolved');
                            done();
                        });
                        scope.$apply();
                    });
                    it('and createBranchCommit rejects', function(done) {
                        createCommitDeferred.reject('Error message');
                        mapperStateSvc.saveMapping().then(function(response) {
                            fail('Promise should have rejected');
                            done();
                        }, function(response) {
                            expect(response).toEqual('Error message');
                            expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId);
                            expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                            expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId, mapperStateSvc.mapping.difference);
                            expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.branch, mapperStateSvc.mapping.record.id, catalogId, jasmine.any(String));
                            done();
                        });
                        scope.$apply();
                    });
                });
                it('and updateInProgressCommit rejects', function(done) {
                    updateDeferred.reject('Error message');
                    mapperStateSvc.saveMapping().then(function(response) {
                        fail('Promise should have rejected');
                        done();
                    }, function(response) {
                        expect(response).toEqual('Error message');
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId);
                        expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId, mapperStateSvc.mapping.difference);
                        expect(catalogManagerSvc.createBranchCommit).not.toHaveBeenCalled();
                        done();
                    });
                    scope.$apply();
                });
            });
            it('and createInProgressCommit rejects', function(done) {
                createDeferred.reject('Error message');
                mapperStateSvc.saveMapping().then(function(response) {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual('Error message');
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId);
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.createBranchCommit).not.toHaveBeenCalled();
                    done();
                });
                scope.$apply();
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
        var entityId = 'entity', propId = 'prop', newValue = 'new', originalValue = 'original', otherValue = 'other';
        beforeEach(function () {
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
            mapperStateSvc.changeProp(entityId, propId, newValue, newValue);
            expect(mapperStateSvc.mapping.difference.additions).toEqual(additions);
            expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
        });
        describe('if the new value is different', function() {
            describe('and the property has a @id value', function() {
                it('and the property was just set', function() {
                    var additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@id': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was just opened', function() {
                    var expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@id': newValue}];
                    var expectedDeletion = {'@id': entityId};
                    expectedDeletion[propId] = [{'@id': originalValue}];
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
                it('and the entity was opened and the property already changed', function() {
                    var additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@id': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@id': otherValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@id': otherValue}]);
                });
                it('and nothing has been set on the entity', function() {
                    var expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@id': newValue}];
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(entityId, propId, newValue, '', true);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was opened and another property was altered', function() {
                    var additionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@id': originalValue}]);
                });
                it('and the property was not set and another property was changed', function() {
                    var additionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, '', true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(_.has(deletionObj, "['" + propId + "']")).toEqual(false);
                });
                it('and the property was not set and another property was added', function() {
                    var additionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(entityId, propId, newValue, '', true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the property was changed back with no other changes', function() {
                    var additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@id': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@id': newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(mapperStateSvc.mapping.difference.additions).toEqual([]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with other changes', function() {
                    var expectedAddition = {'@id': entityId, test: true};
                    var additionObj = angular.copy(expectedAddition);
                    additionObj[propId] = [{'@id': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var expectedDeletion = {'@id': entityId, test: false};
                    var deletionObj = angular.copy(expectedDeletion);
                    deletionObj[propId] = [{'@id': newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
            });
            describe('and the property has a @value value', function() {
                it('and the property was just set', function() {
                    var additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@value': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue);
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was just opened', function() {
                    var expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@value': newValue}];
                    var expectedDeletion = {'@id': entityId};
                    expectedDeletion[propId] = [{'@value': originalValue}];
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
                it('and the entity was opened and the property already changed', function() {
                    var additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@value': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@value': otherValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue);
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@value': otherValue}]);
                });
                it('and nothing has been set on the entity', function() {
                    var expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@value': newValue}];
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(entityId, propId, newValue, '');
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the entity was opened and another property was altered', function() {
                    var additionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue);
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@value': originalValue}]);
                });
                it('and the property was not set and another property was changed', function() {
                    var additionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, '');
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(_.has(deletionObj, "['" + propId + "']")).toEqual(false);
                });
                it('and the property was not set and another property was added', function() {
                    var additionObj = {'@id': entityId};
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
                    mapperStateSvc.changeProp(entityId, propId, newValue, '');
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
                });
                it('and the property was changed back with no other changes', function() {
                    var additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@value': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@value': newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue);
                    expect(mapperStateSvc.mapping.difference.additions).toEqual([]);
                    expect(mapperStateSvc.mapping.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with other changes', function() {
                    var expectedAddition = {'@id': entityId, test: true};
                    var additionObj = angular.copy(expectedAddition);
                    additionObj[propId] = [{'@value': originalValue}];
                    mapperStateSvc.mapping.difference.additions.push(additionObj);
                    var expectedDeletion = {'@id': entityId, test: false};
                    var deletionObj = angular.copy(expectedDeletion);
                    deletionObj[propId] = [{'@value': newValue}];
                    mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                    mapperStateSvc.changeProp(entityId, propId, newValue, originalValue);
                    expect(mapperStateSvc.mapping.difference.additions).toContain(expectedAddition);
                    expect(mapperStateSvc.mapping.difference.deletions).toContain(expectedDeletion);
                });
            });
        });
    })
    describe('should reflect the deletion of entity in the difference', function() {
        var entity = {'@id': 'entity', test: [false]};
        it('if the entire entity was added originally', function() {
            mapperStateSvc.mapping.difference.additions.push(angular.copy(entity));
            var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
            mapperStateSvc.deleteEntity(entity);
            expect(mapperStateSvc.mapping.difference.additions.length).toEqual(0);
            expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
        });
        describe('if no part of the entity was added', function() {
            var additions;
            beforeEach(function() {
                additions = angular.copy(mapperStateSvc.mapping.difference.additions);
            });
            it('or deleted', function() {
                mapperStateSvc.deleteEntity(entity);
                expect(mapperStateSvc.mapping.difference.additions).toEqual(additions);
                expect(mapperStateSvc.mapping.difference.deletions).toContain(entity);
            });
            it('and a part was deleted', function() {
                var originalDeletionObj = {'@id': entity['@id'], test: [true]};
                var expected = _.merge({}, originalDeletionObj, entity);
                mapperStateSvc.mapping.difference.deletions.push(originalDeletionObj);
                mapperStateSvc.deleteEntity(entity);
                expect(mapperStateSvc.mapping.difference.additions).toEqual(additions);
                expect(originalDeletionObj).toEqual(expected);
            });
        });
    });
    describe('should delete a class and update the difference', function() {
        var classMapping = {'@id': 'classMapping'},
            classObj = {'@id': 'class'},
            propMapping = {'@id': 'propMapping'};
        beforeEach(function() {
            mapperStateSvc.invalidProps = [{'@id': propMapping['@id']}];
            mappingManagerSvc.getPropMappingsByClass.and.returnValue([propMapping]);
            mappingManagerSvc.removeClass.and.returnValue(classMapping);
            mappingManagerSvc.getClassIdByMapping.and.returnValue(classObj['@id']);
            spyOn(mapperStateSvc, 'deleteEntity');
            spyOn(mapperStateSvc, 'removeAvailableProps');
        });
        it('if it exists in an ontology', function() {
            var ontology = {id: 'ontology', entities: []};
            mappingManagerSvc.findSourceOntologyWithClass.and.returnValue(ontology);
            ontologyManagerSvc.getEntity.and.returnValue(classObj);
            mapperStateSvc.deleteClass(classMapping['@id']);
            expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalledWith(classObj['@id'], mapperStateSvc.sourceOntologies);
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith([ontology.entities], classObj['@id']);
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
            expect(mapperStateSvc.availableClasses).toContain({ontologyId: ontology.id, classObj: classObj});
        });
        it('if it does not exist in an ontology', function() {
            mappingManagerSvc.findSourceOntologyWithClass.and.returnValue(undefined);
            mapperStateSvc.deleteClass(classMapping['@id']);
            expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalledWith(classObj['@id'], mapperStateSvc.sourceOntologies);
            expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
            expect(mapperStateSvc.availableClasses.length).toEqual(0);
        });
    });
    describe('should delete a property and update the difference', function() {
        var propMapping = {'@id': 'propMapping'},
            classMappingId = 'classMapping',
            propObj = {'@id': 'prop', test: [true]},
            availableProps;
        beforeEach(function() {
            availableProps = [];
            mapperStateSvc.invalidProps = [{'@id': propMapping['@id']}];
            mappingManagerSvc.removeProp.and.returnValue(propMapping);
            mappingManagerSvc.getPropIdByMapping.and.returnValue(propObj['@id']);
            spyOn(mapperStateSvc, 'getAvailableProps').and.returnValue(availableProps);
            spyOn(mapperStateSvc, 'deleteEntity');
        });
        it('if it is an annotation property', function() {
            mappingManagerSvc.annotationProperties = [propObj['@id']];
            mappingManagerSvc.isDataMapping.and.returnValue(true);
            mapperStateSvc.deleteProp(propMapping['@id'], classMappingId);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
            expect(mappingManagerSvc.findSourceOntologyWithProp).not.toHaveBeenCalled();
            expect(mapperStateSvc.getAvailableProps).toHaveBeenCalledWith(classMappingId);
            expect(availableProps).toContain({ontologyId: '', propObj: {'@id': propObj['@id']}});
        });
        describe('if it is not an annotation property', function() {
            it('and exists in an ontology', function() {
                var ontology = {id: 'ontology', entities: []};
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(ontology);
                ontologyManagerSvc.getEntity.and.returnValue(propObj);
                mapperStateSvc.deleteProp(propMapping['@id'], classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(propObj['@id'], mapperStateSvc.sourceOntologies);
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith([ontology.entities], propObj['@id']);
                expect(mapperStateSvc.getAvailableProps).toHaveBeenCalledWith(classMappingId);
                expect(availableProps).toContain({ontologyId: ontology.id, propObj: propObj});
            });
            it('and does not exist in an ontology', function() {
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(undefined);
                mapperStateSvc.deleteProp(propMapping['@id'], classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(propObj['@id'], mapperStateSvc.sourceOntologies);
                expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
                expect(mapperStateSvc.getAvailableProps).not.toHaveBeenCalled();
                expect(availableProps.length).toEqual(0);
            });
        });
        it('if it was added originally', function () {
            utilSvc.hasPropertyId.and.returnValue(true);
            var additionObj = {'@id': classMappingId};
            mapperStateSvc.mapping.difference.additions.push(additionObj);
            var deletions = angular.copy(mapperStateSvc.mapping.difference.deletions);
            mapperStateSvc.deleteProp(propMapping['@id'], classMappingId);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(utilSvc.hasPropertyId).toHaveBeenCalledWith(additionObj, prefixes.delim + 'dataProperty', propMapping['@id']);
            expect(utilSvc.removePropertyId).toHaveBeenCalledWith(additionObj, prefixes.delim + 'dataProperty', propMapping['@id']);
            expect(mapperStateSvc.mapping.difference.deletions).toEqual(deletions);
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
        });
        describe('if it was not added', function () {
            var additionObj = {'@id': classMappingId};
            beforeEach(function() {
                mapperStateSvc.mapping.difference.additions.push(additionObj);
            });
            it('and the parent class mapping does not exist in deletions', function () {
                var deletionObj = {'@id': classMappingId};
                deletionObj[prefixes.delim + 'dataProperty'] = [{'@id': propMapping['@id']}];
                mapperStateSvc.deleteProp(propMapping['@id'], classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(utilSvc.hasPropertyId).toHaveBeenCalledWith(additionObj, prefixes.delim + 'dataProperty', propMapping['@id']);
                expect(utilSvc.removePropertyId).not.toHaveBeenCalled();
                expect(mapperStateSvc.mapping.difference.deletions).toContain(deletionObj);
                expect(mapperStateSvc.invalidProps.length).toEqual(0);
            });
            it('and the parent class mapping does exist in deletions', function () {
                var deletionObj = {'@id': classMappingId};
                mapperStateSvc.mapping.difference.deletions.push(deletionObj);
                mapperStateSvc.deleteProp(propMapping['@id'], classMappingId);
                expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(utilSvc.hasPropertyId).toHaveBeenCalledWith(additionObj, prefixes.delim + 'dataProperty', propMapping['@id']);
                expect(utilSvc.removePropertyId).not.toHaveBeenCalled();
                expect(deletionObj[prefixes.delim + 'dataProperty']).toEqual([{'@id': propMapping['@id']}]);
                expect(mapperStateSvc.invalidProps.length).toEqual(0);
            });
        });
    });
});
