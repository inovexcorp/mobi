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
        mapperStateSvc;

    beforeEach(function() {
        module('mapperState');
        mockPrefixes();
        mockMappingManager();
        mockOntologyManager();
        mockDelimitedManager();

        inject(function(mapperStateService, _ontologyManagerService_, _mappingManagerService_, _delimitedManagerService_) {
            mapperStateSvc = mapperStateService;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        mappingManagerSvc.mapping = {jsonld: [], name: 'mapping'};
    });

    it('should initialize important variables', function() {
        mapperStateSvc.initialize();
        expect(mapperStateSvc.editMapping).toBe(false);
        expect(mapperStateSvc.newMapping).toBe(false);
        expect(mapperStateSvc.step).toBe(0);
        expect(mapperStateSvc.invalidProps).toEqual([]);
        expect(mapperStateSvc.availableColumns).toEqual([]);
        expect(mapperStateSvc.availableProps).toEqual([]);
        expect(mapperStateSvc.openedClasses).toEqual([]);
        expect(mapperStateSvc.availablePropsByClass).toEqual({});
    });
    it('should reset edit related variables', function() {
        mapperStateSvc.resetEdit();
        expect(mapperStateSvc.selectedClassMappingId).toBe('');
        expect(mapperStateSvc.selectedPropMappingId).toBe('');
        expect(mapperStateSvc.selectedColumn).toBe('');
        expect(mapperStateSvc.newProp).toBe(false);
        expect(mapperStateSvc.selectedProp).toEqual(undefined);
    });
    it('should set all variables for creating a new mapping', function() {
        spyOn(mapperStateSvc, 'resetEdit');
        mapperStateSvc.createMapping();
        expect(mapperStateSvc.editMapping).toBe(true);
        expect(mapperStateSvc.newMapping).toBe(true);
        // expect(mapperStateSvc.step).toBe(0);
        expect(mappingManagerSvc.mapping).toEqual({jsonld: [], name: ''});
        expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        // expect(mapperStateSvc.editMappingName).toBe(true);
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
    });
    it('should get the cached source ontology values', function() {
        var result = mapperStateSvc.getCachedSourceOntologyId();
        expect(typeof result).toBe('string');
        result = mapperStateSvc.getCachedSourceOntologies();
        expect(result).toBe(undefined);
    });
    it('should cache the source ontology values from the current mapping', function() {
        mappingManagerSvc.getSourceOntologyId.and.returnValue('test');
        mappingManagerSvc.sourceOntologies = [{}];
        mapperStateSvc.cacheSourceOntologies();
        expect(mapperStateSvc.getCachedSourceOntologyId()).toBe('test');
        expect(mapperStateSvc.getCachedSourceOntologies()).toEqual(mappingManagerSvc.sourceOntologies);
    });
    it('should clear the cached source ontology values', function() {
        mapperStateSvc.clearCachedSourceOntologies();
        expect(mapperStateSvc.getCachedSourceOntologyId()).toBe('');
        expect(mapperStateSvc.getCachedSourceOntologies()).toEqual(undefined);
    });
    it('should restore the cached source ontology values to the current mapping', function() {
        var ontologyId = mapperStateSvc.getCachedSourceOntologyId();
        var ontologies = mapperStateSvc.getCachedSourceOntologies();
        mapperStateSvc.restoreCachedSourceOntologies();
        expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, ontologyId);
        expect(mappingManagerSvc.sourceOntologies).toEqual(ontologies);
        expect(mapperStateSvc.getCachedSourceOntologyId()).toBe('');
        expect(mapperStateSvc.getCachedSourceOntologies()).toEqual(undefined);
    });
    it('should return a list of all the mapped column headers', function() {
        var dataMappings = [{'columnIndex': [{'@value': '0'}], index: 0}];
        mappingManagerSvc.getAllDataMappings.and.returnValue(dataMappings);
        delimitedManagerSvc.filePreview = {headers: ['test']};
        var results = mapperStateSvc.getMappedColumns();
        expect(_.isArray(results)).toBe(true);
        expect(results.length).toBe(dataMappings.length);
        _.forEach(results, function(result, idx) {
            expect(result).toBe(delimitedManagerSvc.filePreview.headers[dataMappings[idx].index]);
        });
    });
    it('should update availableColumns depending on whether a property mapping has been selected', function() {
        spyOn(mapperStateSvc, 'getMappedColumns').and.returnValue(['test1'])
        delimitedManagerSvc.filePreview = {headers: ['test1', 'test2']};
        mapperStateSvc.updateAvailableColumns();
        expect(mapperStateSvc.availableColumns).not.toContain('test1');
        expect(mapperStateSvc.availableColumns).toContain('test2');

        mapperStateSvc.selectedPropMappingId = 'prop'
        mappingManagerSvc.mapping.jsonld = [{'@id': 'prop', 'columnIndex': [{'@value': '0'}]}];
        mapperStateSvc.updateAvailableColumns();
        expect(mapperStateSvc.availableColumns).toContain('test1');
        expect(mapperStateSvc.availableColumns).toContain('test2');
    });
    it('should update availableProps for a specific class mapping', function() {
        var props = [{}];
        spyOn(mapperStateSvc, 'getAvailableProps').and.returnValue([{}]);
        mapperStateSvc.updateAvailableProps('class');
        expect(mapperStateSvc.getAvailableProps).toHaveBeenCalledWith('class');
        expect(mapperStateSvc.availableProps).toEqual(props);
    });
    it('should check whether a class mapping has available properties', function() {
        mapperStateSvc.availablePropsByClass = {'class': true};
        var result = mapperStateSvc.hasAvailableProps('class');
        expect(result).toBe(true);
        result = mapperStateSvc.hasAvailableProps('class1');
        expect(result).toBe(false);
    });
    it('should set whether a class mapping has available properties', function() {
        spyOn(mapperStateSvc, 'getAvailableProps').and.returnValue([{}]);
        mapperStateSvc.setAvailableProps('class');
        expect(mapperStateSvc.availablePropsByClass.class).toBe(true);

        mapperStateSvc.getAvailableProps.and.returnValue([]);
        mapperStateSvc.setAvailableProps('class');
        expect(mapperStateSvc.availablePropsByClass.class).toBe(false);
    });
    it('should retrieve the list of property objects that have not been used been by a class mapping', function() {
        mappingManagerSvc.sourceOntologies = [{}];
        var classProps = [{'@id': 'prop1'}, {'@id': 'prop2'}];
        var noDomainProps = [{'@id': 'prop3'}, {'@id': 'prop4'}];
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([{'hasProperty': [classProps[0]]}, {'hasProperty': [noDomainProps[0]]}]);
        ontologyManagerSvc.getClassProperties.and.returnValue(classProps);
        ontologyManagerSvc.getNoDomainProperties.and.returnValue(noDomainProps);
        var result = mapperStateSvc.getAvailableProps('class');
        expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, 'class');
        expect(ontologyManagerSvc.getClassProperties.calls.count()).toBe(mappingManagerSvc.sourceOntologies.length);
        expect(result).not.toContain(classProps[0]);
        expect(result).toContain(classProps[1]);
        expect(result).not.toContain(noDomainProps[0]);
        expect(result).toContain(noDomainProps[1]);
    });
    it('should change the mapping name if editing a previous mapping', function() {
        var name = mappingManagerSvc.mapping.name;
        mapperStateSvc.newMapping = true;
        mapperStateSvc.changedMapping();
        expect(mappingManagerSvc.mapping.name).toBe(name);

        mapperStateSvc.newMapping = false;
        mapperStateSvc.changedMapping();
        expect(mappingManagerSvc.mapping.name).not.toBe(name);

        var newName = mappingManagerSvc.mapping.name;
        mapperStateSvc.changedMapping();
        expect(mappingManagerSvc.mapping.name).toBe(newName);
    });
});