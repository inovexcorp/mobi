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
        element,
        controller,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        utilSvc;

    beforeEach(function() {
        module('templates');
        module('mappingOverlays');
        injectSplitIRIFilter();
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            utilSvc = _utilService_;
        });

        mapperStateSvc.mapping = {record: {id: ''}, jsonld: [], difference: {additions: [], deletions: []}};
        element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
        scope.$digest();
        controller = element.controller('mappingOverlays');
    });

    describe('controller methods', function() {
        it('should set the correct state for reseting', function() {
            controller.reset();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
        it('should get the name of a class mapping', function() {
            var classMappingId = 'class';
            expect(_.isString(controller.getClassName(classMappingId))).toBe(true);
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMappingId);
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith(jasmine.any(String));
        });
        it('if it is a property mapping', function() {
            var propMappingId = 'prop';
            expect(_.isString(controller.getPropName(propMappingId))).toBe(true);
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, propMappingId);
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith(jasmine.any(String));
        });
        it('should delete a class mapping from the mapping', function() {
            mapperStateSvc.selectedClassMappingId = 'class';
            var classMappingId = mapperStateSvc.selectedClassMappingId;
            /*var classMapping = {
                '@id': mapperStateSvc.selectedClassMappingId
            };
            var classOntology = {id: '', entities: []};
            var classObj = {'@id': 'class'};
            var props = [{'@id': 'prop'}];
            var dataProps = [{'@id': 'dataProp'}];
            mapperStateSvc.invalidProps = angular.copy(dataProps);
            mappingManagerSvc.getPropsLinkingToClass.and.returnValue(props);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(dataProps);
            mappingManagerSvc.isDataMapping.and.returnValue(true);
            mappingManagerSvc.getClassIdByMapping.and.returnValue(classObj['@id']);
            mappingManagerSvc.findSourceOntologyWithClass.and.returnValue(classOntology);
            ontologyManagerSvc.getEntity.and.callFake(function(entities, id) {
                return id === classObj['@id'] ? classObj : props[0];
            });
            mapperStateSvc.mapping.jsonld.push(classMapping);*/
            controller.deleteClass();
            expect(mapperStateSvc.deleteClass).toHaveBeenCalledWith(classMappingId);
            /*expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mappingManagerSvc.findClassWithObjectMapping.calls.count()).toBe(props.length);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classMapping['@id']);
            expect(mapperStateSvc.getAvailableProps.calls.count()).toBe(props.length);
            expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalledWith(classObj['@id'], mapperStateSvc.sourceOntologies);
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith([classOntology.entities], classObj['@id']);
            expect(mapperStateSvc.availableClasses).toContain({ontologyId: classOntology.id, classObj: classObj});
            expect(mapperStateSvc.invalidProps).not.toContain(dataProps[0]);*/
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe('');
            expect(mapperStateSvc.changedMapping).toBe(true);
        });
        describe('should delete a property mapping from the mapping', function() {
            var classMapping = {'@id': 'class'};
            // var availableProps, propMapping, propId = 'prop', classMapping = {'@id': 'class'};
            beforeEach(function() {
                mapperStateSvc.selectedPropMappingId = 'prop';
                mapperStateSvc.selectedClassMappingId = classMapping['@id'];
                /*propMapping = {
                    '@id': mapperStateSvc.selectedPropMappingId
                };
                availableProps = [];
                mapperStateSvc.invalidProps = [{'@id': propId}];
                mapperStateSvc.mapping.jsonld.push(classMapping);
                mapperStateSvc.selectedClassMappingId = classMapping['@id'];
                mapperStateSvc.availablePropsByClass = {};
                mapperStateSvc.getAvailableProps.and.returnValue(availableProps);
                mappingManagerSvc.getPropIdByMapping.and.returnValue(propId);*/
                mapperStateSvc.mapping.jsonld.push(classMapping);
            });
            it('if it is for an annotation', function() {
                /*mappingManagerSvc.annotationProperties = [propId];
                var originalMapping = angular.copy(mapperStateSvc.mapping.jsonld);*/
                controller.deleteProp();
                expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, classMapping['@id']);
                /*expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalled();
                expect(availableProps).toContain({propObj: {'@id': propId}, ontologyId: ''});
                expect(mappingManagerSvc.removeProp).toHaveBeenCalledWith(originalMapping, classMapping['@id'], propMapping['@id']);
                expect(mapperStateSvc.invalidProp).not.toContain({'@id': propId});*/
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(classMapping['@id']);
                expect(mapperStateSvc.changedMapping).toBe(true);
            });
            it('if it is not for an annotation', function() {
                /*var originalMapping = angular.copy(mapperStateSvc.mapping.jsonld);
                var ontology = {id: 'ontology'};
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(ontology);*/
                controller.deleteProp();
                expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, classMapping['@id']);
                /*expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalled();
                expect(availableProps).toContain({propObj: {}, ontologyId: ontology.id});
                expect(mappingManagerSvc.removeProp).toHaveBeenCalledWith(originalMapping, classMapping['@id'], propMapping['@id']);
                expect(mapperStateSvc.invalidProp).not.toContain({'@id': propId});*/
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(classMapping['@id']);
                expect(mapperStateSvc.changedMapping).toBe(true);
            });
        });
    });
    describe('contains the correct html', function() {
        it('depending on whether a mapping is being created', function() {
            mapperStateSvc.displayCreateMappingOverlay = true;
            scope.$digest();
            expect(element.find('create-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayCreateMappingOverlay = false;
            scope.$digest();
            expect(element.find('create-mapping-overlay').length).toBe(0);
        });
        it('depending on whether a mapping is being downloaded', function() {
            mapperStateSvc.displayDownloadMappingOverlay = true;
            scope.$digest();
            expect(element.find('download-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayDownloadMappingOverlay = false;
            scope.$digest();
            expect(element.find('download-mapping-overlay').length).toBe(0);
        });
        it('depending on whether a mapping configuration is being edited', function() {
            mapperStateSvc.displayMappingConfigOverlay = true;
            scope.$digest();
            expect(element.find('mapping-config-overlay').length).toBe(1);

            mapperStateSvc.displayMappingConfigOverlay = false;
            scope.$digest();
            expect(element.find('mapping-config-overlay').length).toBe(0);
        });
        it('depending on whether a property mapping is being edited or added', function() {
            mapperStateSvc.displayPropMappingOverlay = true;
            scope.$digest();
            expect(element.find('prop-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayPropMappingOverlay = false;
            scope.$digest();
            expect(element.find('prop-mapping-overlay').length).toBe(0);
        });
        it('depending on whether a class mapping is being added', function() {
            mapperStateSvc.displayClassMappingOverlay = true;
            scope.$digest();
            expect(element.find('class-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayClassMappingOverlay = false;
            scope.$digest();
            expect(element.find('class-mapping-overlay').length).toBe(0);
        });
        it('depending on whether the mapping name is being edited', function() {
            mapperStateSvc.editMappingName = true;
            scope.$digest();
            expect(element.find('mapping-name-overlay').length).toBe(1);

            mapperStateSvc.editMappingName = false;
            scope.$digest();
            expect(element.find('mapping-name-overlay').length).toBe(0);
        });
        it('depending on whether an IRI template is being edited', function() {
            mapperStateSvc.editIriTemplate = true;
            scope.$digest();
            expect(element.find('iri-template-overlay').length).toBe(1);

            mapperStateSvc.editIriTemplate = false;
            scope.$digest();
            expect(element.find('iri-template-overlay').length).toBe(0);
        });
        it('depending on whether the source ontology is invalid', function() {
            mapperStateSvc.invalidOntology = true;
            scope.$digest();
            expect(element.find('invalid-ontology-overlay').length).toBe(1);

            mapperStateSvc.invalidOntology = false;
            scope.$digest();
            expect(element.find('invalid-ontology-overlay').length).toBe(0);
        });
        it('depending on whether a mapping is about to be run', function() {
            mapperStateSvc.displayRunMappingOverlay = true;
            scope.$digest();
            expect(element.find('run-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayRunMappingOverlay = false;
            scope.$digest();
            expect(element.find('run-mapping-overlay').length).toBe(0);
        });
        it('depending on whether a cancel should be confirmed', function() {
            mapperStateSvc.displayCancelConfirm = true;
            scope.$digest();
            var overlay = element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('cancel-confirm')).toBe(true);

            mapperStateSvc.displayCancelConfirm = false;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a class mapping should be confirmed', function() {
            mapperStateSvc.displayDeleteClassConfirm = true;
            scope.$digest();
            var overlay = element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-class')).toBe(true);

            mapperStateSvc.displayDeleteClassConfirm = false;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a property mapping should be confirmed', function() {
            mapperStateSvc.displayDeletePropConfirm = true;
            scope.$digest();
            var overlay = element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-prop')).toBe(true);

            mapperStateSvc.displayDeletePropConfirm = false;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(0);
        });
    });
});
