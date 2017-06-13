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
describe('Mapper State service', function() {
    var $httpBackend,
        mapperStateSvc,
        prefixes,
        ontologyManagerSvc,
        mappingManagerSvc,
        delimitedManagerSvc,
        utilSvc;

    beforeEach(function() {
        module('mapperState');
        mockPrefixes();
        mockMappingManager();
        mockOntologyManager();
        mockDelimitedManager();
        mockUtil();

        inject(function(mapperStateService, _prefixes_, _ontologyManagerService_, _mappingManagerService_, _delimitedManagerService_, _utilService_) {
            prefixes = _prefixes_;
            mapperStateSvc = mapperStateService;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            utilSvc = _utilService_;
        });

        mapperStateSvc.mapping = {jsonld: [], id: 'mapping'};
    });

    it('should initialize important variables', function() {
        mapperStateSvc.initialize();
        expect(mapperStateSvc.editMapping).toBe(false);
        expect(mapperStateSvc.newMapping).toBe(false);
        expect(mapperStateSvc.step).toBe(0);
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
        mapperStateSvc.createMapping();
        expect(mapperStateSvc.editMapping).toBe(true);
        expect(mapperStateSvc.newMapping).toBe(true);
        expect(mapperStateSvc.mapping).toEqual({jsonld: [], id: '', record: undefined});
        expect(mapperStateSvc.sourceOntologies).toEqual([]);
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
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
});