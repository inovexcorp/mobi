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
describe('Mapping Overlays directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('mappingOverlays');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        injectSplitIRIFilter();
        
        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
            scope.$digest();
            controller = this.element.controller('mappingOverlays');
        });
        it('should set the correct state for reseting', function() {
            controller.reset();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mappingManagerSvc.mapping).toBe(undefined);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
        it('should get the name of a class mapping', function() {
            var classMappingId = 'class';
            var result = controller.getClassName(classMappingId);
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, classMappingId);
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('if it is a property mapping', function() {
            var propMappingId = 'class';
            var result = controller.getPropName(propMappingId);
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, propMappingId);
            expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should delete a class mapping from the mapping', function() {
            var classMappingId = mapperStateSvc.selectedClassMappingId;
            var baseClass = {'@id': 'base'};
            var props = [{'@id': 'prop'}];
            mappingManagerSvc.getPropsLinkingToClass.and.returnValue(props);
            mappingManagerSvc.getBaseClass.and.returnValue(baseClass);
            controller.deleteClass();
            expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, classMappingId);
            expect(mappingManagerSvc.findClassWithObjectMapping.calls.count()).toBe(props.length);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, classMappingId);
            expect(mapperStateSvc.getAvailableProps.calls.count()).toBe(props.length);
            expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(classMappingId);
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe(baseClass['@id']);
        });
        it('should delete a property mapping from the mapping', function() {
            var classMapping = {'@id': 'class'};
            var ontology = {id: 'ontology'};
            var propId = 'prop';
            var availableProps = [];
            mappingManagerSvc.mapping.jsonld.push(classMapping);
            var originalMapping = angular.copy(mappingManagerSvc.mapping.jsonld);
            mapperStateSvc.selectedClassMappingId = classMapping['@id'];
            mapperStateSvc.availablePropsByClass = {};
            mapperStateSvc.getAvailableProps.and.returnValue(availableProps);
            mappingManagerSvc.getPropIdByMappingId.and.returnValue(propId);
            mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(ontology);
            controller.deleteProp();
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(originalMapping, mapperStateSvc.selectedPropMappingId);
            expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalled();
            expect(availableProps).toContain({'@id': propId, ontologyId: ontology.id});
            expect(mappingManagerSvc.removeProp).toHaveBeenCalledWith(originalMapping, classMapping['@id'], mapperStateSvc.selectedPropMappingId);
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe(classMapping['@id']);
        });
        it('should delete a mapping', function() {
            var id = 'test';
            mappingManagerSvc.mapping.id = id;
            controller.deleteMapping();
            scope.$apply();
            expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(id);
            expect(mappingManagerSvc.mapping).toEqual(undefined);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: '', jsonld: []};
            this.element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
            scope.$digest();
        });
        it('depending on whether a mapping is being created', function() {
            mapperStateSvc.displayCreateMappingOverlay = true;
            scope.$digest();
            expect(this.element.find('create-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayCreateMappingOverlay = false;
            scope.$digest();
            expect(this.element.find('create-mapping-overlay').length).toBe(0);
        });
        it('depending on whether a mapping is being downloaded', function() {
            mapperStateSvc.displayDownloadMappingOverlay = true;
            scope.$digest();
            expect(this.element.find('download-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayDownloadMappingOverlay = false;
            scope.$digest();
            expect(this.element.find('download-mapping-overlay').length).toBe(0);
        });
        it('depending on whether a mapping configuration is being edited', function() {
            mapperStateSvc.displayMappingConfigOverlay = true;
            scope.$digest();
            expect(this.element.find('mapping-config-overlay').length).toBe(1);

            mapperStateSvc.displayMappingConfigOverlay = false;
            scope.$digest();
            expect(this.element.find('mapping-config-overlay').length).toBe(0);
        });
        it('depending on whether a property mapping is being edited or added', function() {
            mapperStateSvc.displayPropMappingOverlay = true;
            scope.$digest();
            expect(this.element.find('prop-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayPropMappingOverlay = false;
            scope.$digest();
            expect(this.element.find('prop-mapping-overlay').length).toBe(0);
        });
        it('depending on whether the mapping name is being edited', function() {
            mapperStateSvc.editMappingName = true;
            scope.$digest();
            expect(this.element.find('mapping-name-overlay').length).toBe(1);

            mapperStateSvc.editMappingName = false;
            scope.$digest();
            expect(this.element.find('mapping-name-overlay').length).toBe(0);
        });
        it('depending on whether an IRI template is being edited', function() {
            mapperStateSvc.editIriTemplate = true;
            scope.$digest();
            expect(this.element.find('iri-template-overlay').length).toBe(1);

            mapperStateSvc.editIriTemplate = false;
            scope.$digest();
            expect(this.element.find('iri-template-overlay').length).toBe(0);
        });
        it('depending on whether the source ontology is invalid', function() {
            mapperStateSvc.invalidOntology = true;
            scope.$digest();
            expect(this.element.find('invalid-ontology-overlay').length).toBe(1);

            mapperStateSvc.invalidOntology = false;
            scope.$digest();
            expect(this.element.find('invalid-ontology-overlay').length).toBe(0);
        });
        it('depending on whether a cancel should be confirmed', function() {
            mapperStateSvc.displayCancelConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('cancel-confirm')).toBe(true);

            mapperStateSvc.displayCancelConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a class mapping should be confirmed', function() {
            mapperStateSvc.displayDeleteClassConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-class')).toBe(true);

            mapperStateSvc.displayDeleteClassConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a property mapping should be confirmed', function() {
            mapperStateSvc.displayDeletePropConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-prop')).toBe(true);

            mapperStateSvc.displayDeletePropConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a mapping should be confirmed', function() {
            mapperStateSvc.displayDeleteMappingConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-mapping')).toBe(true);

            mapperStateSvc.displayDeleteMappingConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
    });
});