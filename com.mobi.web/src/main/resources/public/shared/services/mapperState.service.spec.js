/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
        module('shared');
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
        expect(mapperStateSvc.propsByClass).toEqual({});
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
                    .then(() => fail('Promise should have rejected'), response => expect(response).toEqual('Error message'));
                scope.$apply();
                expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                mappingManagerSvc.upload.and.returnValue($q.when('id'));
                mapperStateSvc.saveMapping().then(response => expect(response).toEqual('id'), () => fail('Promise should have resolved'));
                scope.$apply();
                expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
            });
        });
        describe('if it is an existing mapping', function() {
            beforeEach(function() {
                mapperStateSvc.newMapping = false;
            });
            describe('and updateInProgressCommit resolves', function() {
                beforeEach(function() {
                    catalogManagerSvc.updateInProgressCommit.and.returnValue($q.when());
                });
                it('and createBranchCommit resolves', function() {
                    utilSvc.getDctermsValue.and.callFake(obj => obj.title);
                    catalogManagerSvc.createBranchCommit.and.returnValue($q.when(''));
                    var add1 = {'@id': 'add1', title: 'Class'};
                    var add2 = {'@id': 'add2', title: 'Prop 1'};
                    var add3 = {'@id': 'add3'};
                    var del1 = {'@id': 'del1', title: 'Prop 2'};
                    mapperStateSvc.mapping.difference.additions = [add1, add2, add3];
                    mapperStateSvc.mapping.difference.deletions = [del1, add2];
                    mapperStateSvc.mapping.jsonld = [add1, add2, add3];
                    mappingManagerSvc.isClassMapping.and.callFake(obj => _.isEqual(obj, add1));
                    mappingManagerSvc.isPropertyMapping.and.callFake(obj =>_.isEqual(obj, add2) || _.isEqual(obj, del1));
                    utilSvc.getBeautifulIRI.and.returnValue('iri');
                    mapperStateSvc.saveMapping()
                        .then(response => expect(response).toEqual(mapperStateSvc.mapping.record.id), () => fail('Promise should have resolved'));
                    scope.$apply();
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId, mapperStateSvc.mapping.difference);
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(add1, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(add2, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(add3, 'title');
                    expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith(add3['@id']);
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(del1, 'title');
                    expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.branch, mapperStateSvc.mapping.record.id, this.catalogId, 'Changed Class, Prop 1, iri, Prop 2');
                });
                it('and createBranchCommit rejects', function() {
                    catalogManagerSvc.createBranchCommit.and.returnValue($q.reject('Error message'));
                    mapperStateSvc.saveMapping()
                        .then(() => fail('Promise should have rejected'), response => expect(response).toEqual('Error message'));
                    scope.$apply();
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId, mapperStateSvc.mapping.difference);
                    expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.branch, mapperStateSvc.mapping.record.id, this.catalogId, jasmine.any(String));
                });
            });
            it('and updateInProgressCommit rejects', function() {
                catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject('Error message'));
                mapperStateSvc.saveMapping()
                    .then(() => fail('Promise should have rejected'), response => expect(response).toEqual('Error message'));
                scope.$apply();
                expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.catalogId, mapperStateSvc.mapping.difference);
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
        utilSvc.getPropertyValue.and.callFake((obj, prop) =>obj[prop]);
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
        _.forEach(results, (result, idx) => {
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(dataMappings[idx], prefixes.delim + 'columnIndex');
            expect(result).toBe('0');
        });
    });
    it('should check whether a class has properties', function() {
        mapperStateSvc.propsByClass = {'class': [{}]};
        var result = mapperStateSvc.hasProps('class');
        expect(result).toBe(true);
        result = mapperStateSvc.hasProps('class1');
        expect(result).toBe(false);
    });
    it('should check whether a class mapping has properties', function() {
        spyOn(mapperStateSvc, 'hasProps').and.returnValue(true);
        mappingManagerSvc.getClassIdByMappingId.and.returnValue('class');
        expect(mapperStateSvc.hasPropsByClassMappingId('classMapping')).toEqual(true);
        expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classMapping');
        expect(mapperStateSvc.hasProps).toHaveBeenCalledWith('class');
    });
    it('should remove the list of properties for a class', function() {
        mapperStateSvc.propsByClass = {'clazz': []};
        mapperStateSvc.removeProps('clazz');
        expect(mapperStateSvc.propsByClass.clazz).toBeUndefined();
    });
    it('should remove the list of properties for a class mapping', function() {
        spyOn(mapperStateSvc, 'removeProps');
        mappingManagerSvc.getClassIdByMappingId.and.returnValue('class');
        mapperStateSvc.removePropsByClassMappingId('classMapping');
        expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classMapping');
        expect(mapperStateSvc.removeProps).toHaveBeenCalledWith('class');
    });
    it('should set the list of properties for a class', function() {
        mapperStateSvc.sourceOntologies = [{}];
        var classId = 'class';
        var classProps = [{propObj: {'@id': 'prop1'}}];
        var noDomainProps = [{propObj: {'@id': 'prop2'}}];
        var annotationProps = [{propObj: {'@id': 'prop3'}}];

        mappingManagerSvc.annotationProperties = ['test'];
        spyOn(mapperStateSvc, 'getClassProps').and.returnValue(_.union(classProps, noDomainProps, annotationProps));

        mapperStateSvc.setProps(classId);
        expect(mapperStateSvc.getClassProps).toHaveBeenCalledWith(mapperStateSvc.sourceOntologies, classId);
        expect(mapperStateSvc.propsByClass[classId]).toContain(classProps[0]);
        expect(mapperStateSvc.propsByClass[classId]).toContain(noDomainProps[0]);
        expect(mapperStateSvc.propsByClass[classId] ).toContain(annotationProps[0]);
        _.forEach(mappingManagerSvc.annotationProperties, prop => expect(mapperStateSvc.propsByClass[classId]).toContain({ontologyId: '', propObj: {'@id': prop}}));
    });
    it('should set the list of properties for a class mapping', function() {
        spyOn(mapperStateSvc, 'setProps');
        mappingManagerSvc.getClassIdByMappingId.and.returnValue('class');
        mapperStateSvc.setPropsByClassMappingId('classMapping');
        expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classMapping');
        expect(mapperStateSvc.setProps).toHaveBeenCalledWith('class');
    });
    it('should get the list of properties for a class', function() {
        var props = [{}];
        mapperStateSvc.propsByClass = {'class': props};
        var result = mapperStateSvc.getProps('class');
        expect(result).toEqual(props);
        result = mapperStateSvc.getProps('class1');
        expect(result).toEqual([]);
    });
    it('should get the list of properties for a class mapping', function() {
        spyOn(mapperStateSvc, 'getProps').and.returnValue([{}]);
        mappingManagerSvc.getClassIdByMappingId.and.returnValue('class');
        expect(mapperStateSvc.getPropsByClassMappingId('classMapping')).toEqual([{}]);
        expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classMapping');
        expect(mapperStateSvc.getProps).toHaveBeenCalledWith('class');
    });
    it('should get the list of properties usable with a class', function() {
        var ontologies = [{id: 'ontology1', entities: []}, {id: 'ontology2', entities: [{}]}];
        var classProps = [{'@id': 'prop1'}, {'@id': 'prop2'}];
        var noDomainProps = [{'@id': 'prop3'}, {'@id': 'prop4'}];
        var annotationProps = [{'@id': 'prop5'}, {'@id': 'prop6'}];
        ontologyManagerSvc.getClassProperties.and.callFake(entities => _.isEqual(entities, [ontologies[0].entities]) ? [classProps[0]] : [classProps[1]]);
        ontologyManagerSvc.getNoDomainProperties.and.callFake(entities => _.isEqual(entities, [ontologies[0].entities]) ? noDomainProps : []);
        ontologyManagerSvc.getAnnotations.and.callFake(entities => _.isEqual(entities, [ontologies[0].entities]) ? annotationProps : [])
        var result = mapperStateSvc.getClassProps(ontologies, 'class');
        expect(ontologyManagerSvc.getClassProperties.calls.count()).toBe(ontologies.length);
        expect(ontologyManagerSvc.getNoDomainProperties.calls.count()).toBe(ontologies.length);
        expect(ontologyManagerSvc.getAnnotations.calls.count()).toBe(ontologies.length);
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: classProps[0]});
        expect(result).toContain({ontologyId: ontologies[1].id, propObj: classProps[1]});
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: noDomainProps[0]});
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: noDomainProps[1]});
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: annotationProps[0]});
        expect(result).toContain({ontologyId: ontologies[0].id, propObj: annotationProps[1]});
    });
    it('should get the list of classes from a list of ontologies', function() {
        var ontologies = [{id: 'ontology1', entities: []}, {id: 'ontology2', entities: [{}]}];
        var classes1 = [{'@id': 'class1'}];
        var classes2 = [{'@id': 'class2'}];
        ontologyManagerSvc.getClasses.and.callFake(entities =>_.isEqual(entities, [ontologies[0].entities]) ? classes1 : classes2);
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
            utilSvc.getPropertyValue.and.callFake((obj, propId) => _.get(obj, "['" + propId + "'][0]['@value']", ''));
            utilSvc.getPropertyId.and.callFake((obj, propId) => _.get(obj, "['" + propId + "'][0]['@id']", ''));
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
    describe('should add a class mapping with the correct title if', function() {
        beforeEach(function() {
            this.entityName = 'Class';
            this.ontology = { id: 'ontologyId', entities: [] };
            this.newClassMapping = {'@id': 'new'};
            mapperStateSvc.sourceOntologies = [this.ontology];
            mappingManagerSvc.addClass.and.returnValue(this.newClassMapping);
            ontologyManagerSvc.getEntityName.and.returnValue(this.entityName);
            spyOn(mapperStateSvc, 'changeProp');
            this.classIdObj = { ontologyId: this.ontology.id, classObj: {'@id': 'class'} };
        });
        it('it is the first of the class', function() {
            expect(mapperStateSvc.addClassMapping(this.classIdObj)).toEqual(this.newClassMapping);
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classIdObj.classObj['@id']);
            expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontology.entities, this.classIdObj.classObj['@id']);
            expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.newClassMapping, 'title', this.entityName);
            expect(mapperStateSvc.changeProp).not.toHaveBeenCalled();
            expect(mapperStateSvc.mapping.difference.additions).toContain(this.newClassMapping);
        });
        describe('the class has already been mapped', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.callFake(obj => obj[prefixes.dcterms + 'title'][0]['@value']);
            });
            it('and it does not have an index', function() {
                var originalClassMapping = {'@id': 'original'};
                originalClassMapping[prefixes.dcterms + 'title'] = [{'@value': this.entityName}];
                mappingManagerSvc.getClassMappingsByClassId.and.returnValue([originalClassMapping]);
                expect(mapperStateSvc.addClassMapping(this.classIdObj)).toEqual(this.newClassMapping);
                expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classIdObj.classObj['@id']);
                expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontology.entities, this.classIdObj.classObj['@id']);
                expect(originalClassMapping[prefixes.dcterms + 'title'][0]['@value']).toEqual(this.entityName + ' (1)');
                expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(originalClassMapping['@id'], prefixes.dcterms + 'title', this.entityName + ' (1)', this.entityName);
                expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.newClassMapping, 'title', this.entityName + ' (2)');
                expect(mapperStateSvc.mapping.difference.additions).toContain(this.newClassMapping);
            });
            it('with a missing number', function() {
                var originalMappings = [{'@id': 'original1'}, {'@id': 'original2'}];
                originalMappings[0][prefixes.dcterms + 'title'] = [{'@value': this.entityName + ' (1)'}];
                originalMappings[1][prefixes.dcterms + 'title'] = [{'@value': this.entityName + ' (3)'}];
                mappingManagerSvc.getClassMappingsByClassId.and.returnValue(originalMappings);
                expect(mapperStateSvc.addClassMapping(this.classIdObj)).toEqual(this.newClassMapping);
                expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classIdObj.classObj['@id']);
                expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontology.entities, this.classIdObj.classObj['@id']);
                expect(originalMappings[0][prefixes.dcterms + 'title'][0]['@value']).toEqual(this.entityName + ' (1)');
                expect(originalMappings[1][prefixes.dcterms + 'title'][0]['@value']).toEqual(this.entityName + ' (3)');
                expect(mapperStateSvc.changeProp).not.toHaveBeenCalled();
                expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.newClassMapping, 'title', this.entityName + ' (2)');
                expect(mapperStateSvc.mapping.difference.additions).toContain(this.newClassMapping);
            });
            it('with no missing numbers', function() {
                var originalMappings = [{'@id': 'original1'}, {'@id': 'original2'}];
                originalMappings[0][prefixes.dcterms + 'title'] = [{'@value': this.entityName + ' (1)'}];
                originalMappings[1][prefixes.dcterms + 'title'] = [{'@value': this.entityName + ' (2)'}];
                mappingManagerSvc.getClassMappingsByClassId.and.returnValue(originalMappings);
                expect(mapperStateSvc.addClassMapping(this.classIdObj)).toEqual(this.newClassMapping);
                expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classIdObj.classObj['@id']);
                expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontology.entities, this.classIdObj.classObj['@id']);
                expect(originalMappings[0][prefixes.dcterms + 'title'][0]['@value']).toEqual(this.entityName + ' (1)');
                expect(originalMappings[1][prefixes.dcterms + 'title'][0]['@value']).toEqual(this.entityName + ' (2)');
                expect(mapperStateSvc.changeProp).not.toHaveBeenCalled();
                expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.newClassMapping, 'title', this.entityName + ' (3)');
                expect(mapperStateSvc.mapping.difference.additions).toContain(this.newClassMapping);
            });
        });
    });
    it('should add a data property mapping', function() {
        var ontology = { id: 'ontologyId', entities: [] };
        mapperStateSvc.sourceOntologies = [ontology];
        var propIdObj = { ontologyId: ontology.id, propObj: {'@id': 'prop'} };
        var newPropMapping = {'@id': 'new'};
        mappingManagerSvc.addDataProp.and.returnValue(newPropMapping);
        ontologyManagerSvc.getEntityName.and.returnValue('Prop');
        expect(mapperStateSvc.addDataMapping(propIdObj, 'classMappingId', '0')).toEqual(newPropMapping);
        expect(mappingManagerSvc.addDataProp).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, ontology.entities, 'classMappingId', propIdObj.propObj['@id'], '0', undefined, undefined);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(propIdObj.propObj);
        expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(newPropMapping, 'title', 'Prop');
        expect(mapperStateSvc.mapping.difference.additions).toContain(newPropMapping);
    });
    it('should add an object property mapping', function() {
        var ontology = { id: 'ontologyId', entities: [] };
        mapperStateSvc.sourceOntologies = [ontology];
        var propIdObj = { ontologyId: ontology.id, propObj: {'@id': 'prop'} };
        var newPropMapping = {'@id': 'new'};
        mappingManagerSvc.addObjectProp.and.returnValue(newPropMapping);
        ontologyManagerSvc.getEntityName.and.returnValue('Prop');
        expect(mapperStateSvc.addObjectMapping(propIdObj, 'classMappingId', 'rangeClassMappingId')).toEqual(newPropMapping);
        expect(mappingManagerSvc.addObjectProp).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, ontology.entities, 'classMappingId', propIdObj.propObj['@id'], 'rangeClassMappingId', undefined, undefined);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(propIdObj.propObj);
        expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(newPropMapping, 'title', 'Prop');
        expect(mapperStateSvc.mapping.difference.additions).toContain(newPropMapping);
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
    describe('should delete a class mapping and update the difference', function() {
        beforeEach(function() {
            this.classMapping = {'@id': 'classMapping'};
            this.propMapping = {'@id': 'propMapping'};
            mapperStateSvc.invalidProps = [{'@id': this.propMapping['@id']}];
            mappingManagerSvc.getPropMappingsByClass.and.returnValue([this.propMapping]);
            mappingManagerSvc.removeClass.and.returnValue(this.classMapping);
            spyOn(mapperStateSvc, 'deleteEntity');
            spyOn(mapperStateSvc, 'removeProps');
            spyOn(mapperStateSvc, 'changeProp');
            mappingManagerSvc.getClassIdByMapping.and.returnValue('classId');
            utilSvc.getDctermsValue.and.returnValue('original (1)');
        });
        it('if it is the second to last of the specific class', function() {
            var lastClassMapping = {'@id': 'leftover'};
            lastClassMapping[prefixes.dcterms + 'title'] = [{'@value': 'original (1)'}];
            mappingManagerSvc.getClassMappingsByClassId.and.returnValue([lastClassMapping]);
            mapperStateSvc.deleteClass(this.classMapping['@id']);
            expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.classMapping);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
            expect(mapperStateSvc.removeProps).not.toHaveBeenCalled();
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(this.classMapping);
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classId');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(lastClassMapping, 'title');
            expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(lastClassMapping['@id'], prefixes.dcterms + 'title', 'original', 'original (1)');
        });
        it('if it is not the second to last of the specific class', function() {
            mappingManagerSvc.getClassMappingsByClassId.and.returnValue([{}, {}]);
            mapperStateSvc.deleteClass(this.classMapping['@id']);
            expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.classMapping);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
            expect(mapperStateSvc.removeProps).not.toHaveBeenCalled();
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(this.classMapping);
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classId');
            expect(utilSvc.getDctermsValue).not.toHaveBeenCalled();
            expect(mapperStateSvc.changeProp).not.toHaveBeenCalled();
        });
        it('if it is the last of the specific class', function() {
            mapperStateSvc.deleteClass(this.classMapping['@id']);
            expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id']);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.classMapping);
            expect(mapperStateSvc.deleteEntity).toHaveBeenCalledWith(this.propMapping);
            expect(mapperStateSvc.removeProps).toHaveBeenCalledWith('classId');
            expect(mapperStateSvc.invalidProps.length).toEqual(0);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(this.classMapping);
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'classId');
            expect(utilSvc.getDctermsValue).not.toHaveBeenCalled();
            expect(mapperStateSvc.changeProp).not.toHaveBeenCalled();
        });
    });
    describe('should delete a property mapping and update the difference', function() {
        beforeEach(function() {
            this.propMapping = {'@id': 'propMapping'};
            this.classMappingId = 'classMapping';
            this.propObj = {'@id': 'prop', test: [true]}
            this.availableProps = [];
            mapperStateSvc.invalidProps = [{'@id': this.propMapping['@id']}];
            mappingManagerSvc.removeProp.and.returnValue(this.propMapping);
            spyOn(mapperStateSvc, 'deleteEntity');
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
