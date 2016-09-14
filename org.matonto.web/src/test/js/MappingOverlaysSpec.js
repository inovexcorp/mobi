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
        it('should test whether an entity is a class mapping', function() {
            mappingManagerSvc.mapping.jsonld = [{'@id': 'test'}];
            var result = controller.isClassMapping('test');
            expect(mappingManagerSvc.isClassMapping).toHaveBeenCalledWith({'@id': 'test'});
            expect(result).toBe(true);

            mappingManagerSvc.isClassMapping.and.returnValue(false);
            result = controller.isClassMapping('');
            expect(mappingManagerSvc.isClassMapping).toHaveBeenCalledWith(undefined);
            expect(result).toBe(false);
        });
        it('should get the name of the entity being deleting', function() {
            it('if it is a class mapping', function() {
                spyOn(controller, 'isClassMapping').and.returnValue(true);
                controller.getDeleteEntityName();
                expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
                expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
                expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
                expect(mappingManagerSvc.getPropIdByMappingId).not.toHaveBeenCalled();
                expect(mappingManagerSvc.findSourceOntologyWithProp).not.toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            });
            it('if it is a property mapping', function() {
                spyOn(controller, 'isClassMapping').and.returnValue(false);
                controller.getDeleteEntityName();
                expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
                expect(mappingManagerSvc.getClassIdByMappingId).not.toHaveBeenCalled();
                expect(mappingManagerSvc.findSourceOntologyWithClass).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            });
        });
        it('should delete an entity from the mapping', function() {
            beforeEach(function() {
                mapperStateSvc.deleteId = 'test';
                this.deleteId = mapperStateSvc.deleteId;
            });
            it('if it is a class mapping', function() {
                var props = [{'@id': 'prop'}];
                mappingManagerSvc.getPropsLinkingToClass.and.returnValue(props);
                spyOn(controller, 'isClassMapping').and.returnValue(true);
                mapperStateSvc.openedClasses = [mapperStateSvc.deleteId];
                scope.$digest();
                controller.deleteEntity();
                expect(mapperStateSvc.openedClasses).not.toContain(this.deleteId);
                expect(mappingManagerSvc.getPropsLinkingToClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, this.deleteId);
                expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, this.deleteId);
                expect(mapperStateSvc.setAvailableProps.calls.count()).toBe(props.length);
                expect(mappingManagerSvc.findClassWithDataMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.removeProp).not.toHaveBeenCalled();
                expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.deleteId).toBe('');
            });
            describe('if it is a property mapping', function() {
                beforeEach(function() {
                    controller.isClassMapping.and.returnValue(false);
                });
                it('for a data property', function() {
                    controller.deleteEntity();
                    expect(mappingManagerSvc.removeClass).not.toHaveBeenCalledWith();
                    expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, this.deleteId);
                    expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.removeProp).toHaveBeenCalled();
                    expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.deleteId).toBe('');
                });
                it('for an object property', function() {
                    mappingManagerSvc.findClassWithDataMapping.and.returnValue(undefined);
                    controller.deleteEntity();
                    expect(mappingManagerSvc.removeClass).not.toHaveBeenCalledWith();
                    expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, this.deleteId);
                    expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, this.deleteId);
                    expect(mappingManagerSvc.removeProp).toHaveBeenCalled();
                    expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.deleteId).toBe('');
                });
            });
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
            this.element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
            scope.$digest();
        });
        it('depending on the state step', function() {
            mapperStateSvc.step = 0;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.fileUploadStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(1);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.ontologySelectStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(1);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.startingClassSelectStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(1);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.finishStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(1);
        });
        it('depending on whether the mapping name is being edited', function() {
            mapperStateSvc.editMappingName = true;
            scope.$digest();
            expect(this.element.find('mapping-name-overlay').length).toBe(1);

            mapperStateSvc.editMappingName = false;
            scope.$digest();
            expect(this.element.find('mapping-name-overlay').length).toBe(0);
        });
        it('depending on whether the ontology is being previewed', function() {
            mapperStateSvc.previewOntology = true;
            scope.$digest();
            expect(this.element.find('ontology-preview-overlay').length).toBe(1);

            mapperStateSvc.previewOntology = false;
            scope.$digest();
            expect(this.element.find('ontology-preview-overlay').length).toBe(0);
        });
        it('depending on whether an IRI template is being edited', function() {
            mapperStateSvc.editIriTemplate = true;
            scope.$digest();
            expect(this.element.find('iri-template-overlay').length).toBe(1);

            mapperStateSvc.editIriTemplate = false;
            scope.$digest();
            expect(this.element.find('iri-template-overlay').length).toBe(0);
        });
        it('depending on whether the soruce ontology is invalid', function() {
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
        it('depending on whether creating a new mapping should be confirmed', function() {
            mapperStateSvc.displayNewMappingConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('create-new-mapping')).toBe(true);

            mapperStateSvc.displayNewMappingConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting an entity should be confirmed', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            mapperStateSvc.displayDeleteEntityConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-entity')).toBe(true);

            mapperStateSvc.displayDeleteEntityConfirm = false;
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