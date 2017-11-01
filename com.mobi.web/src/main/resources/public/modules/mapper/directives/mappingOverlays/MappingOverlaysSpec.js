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
describe('Mapping Overlays directive', function() {
    var $compile, scope, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mappingOverlays');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            utilSvc = _utilService_;
        });

        mapperStateSvc.mapping = {record: {id: ''}, jsonld: [], difference: {additions: [], deletions: []}};
        this.element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingOverlays');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should set the correct state for reseting', function() {
            this.controller.reset();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
        it('should get the name of a mapping entity', function() {
            var id = 'id';
            mapperStateSvc.mapping.jsonld = [{'@id': id}];
            expect(_.isString(this.controller.getEntityName(id))).toBe(true);
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': id}, 'title');
        });
        it('should delete a class mapping from the mapping', function() {
            mapperStateSvc.selectedClassMappingId = 'class';
            var classMappingId = mapperStateSvc.selectedClassMappingId;
            this.controller.deleteClass();
            expect(mapperStateSvc.deleteClass).toHaveBeenCalledWith(classMappingId);
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe('');
        });
        describe('should delete a property mapping from the mapping', function() {
            beforeEach(function() {
                this.classMapping = {'@id': 'class'};
                mapperStateSvc.selectedPropMappingId = 'prop';
                mapperStateSvc.selectedClassMappingId = this.classMapping['@id'];
                mapperStateSvc.mapping.jsonld.push(this.classMapping);
            });
            it('if it is for an annotation', function() {
                this.controller.deleteProp();
                expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, this.classMapping['@id']);
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
            });
            it('if it is not for an annotation', function() {
                this.controller.deleteProp();
                expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, this.classMapping['@id']);
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
            });
        });
    });
    describe('contains the correct html', function() {
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
        it('depending on whether a class mapping is being added', function() {
            mapperStateSvc.displayClassMappingOverlay = true;
            scope.$digest();
            expect(this.element.find('class-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayClassMappingOverlay = false;
            scope.$digest();
            expect(this.element.find('class-mapping-overlay').length).toBe(0);
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
        it('depending on whether a mapping is about to be run', function() {
            mapperStateSvc.displayRunMappingOverlay = true;
            scope.$digest();
            expect(this.element.find('run-mapping-overlay').length).toBe(1);

            mapperStateSvc.displayRunMappingOverlay = false;
            scope.$digest();
            expect(this.element.find('run-mapping-overlay').length).toBe(0);
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
    });
});
