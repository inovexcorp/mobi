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
        delimitedManagerSvc;

    beforeEach(function() {
        module('mapperState');
        mockPrefixes();
        mockMappingManager();
        mockOntologyManager();
        mockDelimitedManager();

        inject(function(mapperStateService, _prefixes_, _ontologyManagerService_, _mappingManagerService_, _delimitedManagerService_) {
            prefixes = _prefixes_;
            mapperStateSvc = mapperStateService;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        mappingManagerSvc.mapping = {jsonld: [], id: 'mapping'};
    });

    it('should initialize important variables', function() {
        mapperStateSvc.initialize();
        expect(mapperStateSvc.editMapping).toBe(false);
        expect(mapperStateSvc.newMapping).toBe(false);
        expect(mapperStateSvc.step).toBe(0);
        expect(mapperStateSvc.invalidProps).toEqual([]);
        expect(mapperStateSvc.availableColumns).toEqual([]);
        expect(mapperStateSvc.availablePropsByClass).toEqual({});
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
        expect(mappingManagerSvc.mapping).toEqual({jsonld: [], id: ''});
        expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
    });
    it('should return a list of all the mapped column indexes', function() {
        var dataMappings = [{}];
        dataMappings[0][prefixes.delim + 'columnIndex'] = [{'@value': '0'}];
        mappingManagerSvc.getAllDataMappings.and.returnValue(dataMappings);
        var results = mapperStateSvc.getMappedColumns();
        expect(_.isArray(results)).toBe(true);
        expect(results.length).toBe(dataMappings.length);
        _.forEach(results, function(result, idx) {
            expect(result).toBe(dataMappings[idx][prefixes.delim + 'columnIndex'][0]['@value']);
        });
    });
    it('should update availableColumns depending on whether a property mapping has been selected', function() {
        spyOn(mapperStateSvc, 'getMappedColumns').and.returnValue(['0'])
        delimitedManagerSvc.dataRows = [['', '']];
        mapperStateSvc.updateAvailableColumns();
        expect(mapperStateSvc.availableColumns).not.toContain('0');
        expect(mapperStateSvc.availableColumns).toContain('1');

        mapperStateSvc.selectedPropMappingId = 'prop'
        mappingManagerSvc.mapping.jsonld = [{'@id': 'prop', 'columnIndex': [{'@value': '0'}]}];
        mapperStateSvc.updateAvailableColumns();
        expect(mapperStateSvc.availableColumns).toContain('0');
        expect(mapperStateSvc.availableColumns).toContain('1');
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
        mappingManagerSvc.sourceOntologies = [{}];
        var classMapId = 'classMap';
        var classId = 'class';
        var classProps = [{'@id': 'prop1'}, {'@id': 'prop2'}];
        var noDomainProps = [{'@id': 'prop3'}, {'@id': 'prop4'}];
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([{'hasProperty': [classProps[0]]}, {'hasProperty': [noDomainProps[0]]}]);
        mappingManagerSvc.getClassIdByMappingId.and.returnValue(classId);
        spyOn(mapperStateSvc, 'getClassProps').and.returnValue(_.union(classProps, noDomainProps));
        mapperStateSvc.setAvailableProps(classMapId);
        expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, classMapId);
        expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, classMapId);
        expect(mapperStateSvc.getClassProps).toHaveBeenCalledWith(mappingManagerSvc.sourceOntologies, classId);
        expect(mapperStateSvc.availablePropsByClass[classMapId]).not.toContain(classProps[0]);
        expect(mapperStateSvc.availablePropsByClass[classMapId]).toContain(classProps[1]);
        expect(mapperStateSvc.availablePropsByClass[classMapId] ).not.toContain(noDomainProps[0]);
        expect(mapperStateSvc.availablePropsByClass[classMapId]).toContain(noDomainProps[1]);
    });
    it('should get the list of available property for a class mapping', function() {
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
            return _.isEqual(entities, ontologies[0].entities) ? [classProps[0]] : [classProps[1]];
        });
        ontologyManagerSvc.getNoDomainProperties.and.callFake(function(entities) {
            return _.isEqual(entities, ontologies[0].entities) ? noDomainProps : [];
        });
        var result = mapperStateSvc.getClassProps(ontologies, 'class');
        expect(ontologyManagerSvc.getClassProperties.calls.count()).toBe(ontologies.length);
        expect(ontologyManagerSvc.getNoDomainProperties.calls.count()).toBe(ontologies.length);
        expect(result).toContain({ontologyId: ontologies[0].id, '@id': classProps[0]['@id']});
        expect(result).toContain({ontologyId: ontologies[1].id, '@id': classProps[1]['@id']});
        expect(result).toContain({ontologyId: ontologies[0].id, '@id': noDomainProps[0]['@id']});
        expect(result).toContain({ontologyId: ontologies[0].id, '@id': noDomainProps[1]['@id']});
    });
});