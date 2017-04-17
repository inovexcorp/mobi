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
describe('Mapping Select Page directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        mappingManagerSvc,
        mapperStateSvc,
        ontologyManagerSvc,
        utilSvc;

    beforeEach(function() {
        module('templates');
        module('mappingSelectPage');
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();
        mockUtil();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _ontologyManagerService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        mapperStateSvc.mapping = {jsonld: []};
        element = $compile(angular.element('<mapping-select-page></mapping-select-page>'))(scope);
        scope.$digest();
        controller = element.controller('mappingSelectPage');
    });

    describe('controller methods', function() {
        it('should set the correct state for editing a mapping', function() {
            spyOn(controller, 'loadOntologyAndContinue');
            controller.edit();
            expect(mapperStateSvc.mappingSearchString).toBe('');
            expect(mapperStateSvc.editMapping).toBe(true);
            expect(controller.loadOntologyAndContinue).toHaveBeenCalled();
        });
        it('should set the correct state for running a mapping', function() {
            spyOn(controller, 'loadOntologyAndContinue');
            controller.run();
            expect(mapperStateSvc.mappingSearchString).toBe('');
            expect(controller.loadOntologyAndContinue).toHaveBeenCalled();
        });
        it('should set the correct state for creating a new mapping', function() {
            controller.createMapping();
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
            expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
        })
        it('should set the correct state for deleting a mapping', function() {
            controller.deleteMapping();
            expect(mapperStateSvc.displayDeleteMappingConfirm).toBe(true);
        });
        it('should set the correct state for downloading a mapping', function() {
            controller.downloadMapping();
            expect(mapperStateSvc.displayDownloadMappingOverlay).toBe(true);
        });
        describe('should load an ontology and continue', function() {
            beforeEach(function() {
                this.ontologies = [{}];
                mappingManagerSvc.getSourceOntologies.and.returnValue($q.when(this.ontologies));
            });
            it('if the ontology and mapping are compatiable', function() {
                var classId = 'class1';
                var otherClass = {classObj: {'@id': 'class2'}};
                mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
                mappingManagerSvc.getClassIdByMapping.and.returnValue(classId);
                mapperStateSvc.getClasses.and.returnValue([{classObj: {'@id': classId}}, otherClass]);
                mappingManagerSvc.areCompatible.and.returnValue(true);
                controller.loadOntologyAndContinue();
                scope.$apply();
                expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
                expect(mappingManagerSvc.getAllClassMappings).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                expect(mapperStateSvc.getClasses).toHaveBeenCalledWith(this.ontologies);
                expect(mapperStateSvc.availableClasses).toEqual([otherClass]);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.invalidOntology).toBe(false);
            });
            it('unless the ontology and mapping are incompatiable', function() {
                mappingManagerSvc.areCompatible.and.returnValue(false);
                controller.loadOntologyAndContinue();
                scope.$apply();
                expect(mapperStateSvc.sourceOntologies).toEqual([]);
                expect(mappingManagerSvc.getAllClassMappings).not.toHaveBeenCalled();
                expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                expect(mapperStateSvc.availableClasses).toEqual([]);
                expect(mapperStateSvc.step).not.toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.invalidOntology).toBe(true);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-select-page')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-4').length).toBe(1);
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with blocks', function() {
            expect(element.find('block').length).toBe(2);
        });
        it('with a mapping list', function() {
            expect(element.find('mapping-list').length).toBe(1);
        });
        it('with a block search header for the mapping list', function() {
            expect(element.querySelectorAll('.col-xs-4 block-search').length).toBe(1);
        });
        it('with buttons for creating a mapping and deleting a mapping', function() {
            var createButton = element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0];
            expect(createButton).toBeDefined();
            expect(angular.element(createButton).text().trim()).toContain('Create');

            var deleteButton = element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0];
            expect(deleteButton).toBeDefined();
            expect(angular.element(deleteButton).text().trim()).toContain('Delete');
        });
        it('with buttons for downloading, editing, and running a mapping', function() {
            var buttons = element.querySelectorAll('.col-xs-8 block-header button.btn-link');
            expect(buttons.length).toBe(3);
            _.forEach(_.toArray(buttons), function(button) {
                expect(['Edit', 'Run', 'Download']).toContain(angular.element(button).text().trim());
            });
        });
        it('depending on whether a mapping has been selected', function() {
            var deleteButton = angular.element(element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
            var mappingHeader = angular.element(element.querySelectorAll('.col-xs-8 block-header .mapping-preview-header')[0]);
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(mappingHeader.hasClass('invisible')).toBe(false);
            expect(element.find('mapping-preview').length).toBe(1);

            mapperStateSvc.mapping = undefined;
            scope.$digest();
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(mappingHeader.hasClass('invisible')).toBe(true);
            expect(element.find('mapping-preview').length).toBe(0);
        });
        it('depending on whether the mapping source ontology exists', function() {
            var editButton = angular.element(element.querySelectorAll('.col-xs-8 block-header button.btn-link.edit-btn')[0]);
            var runButton = angular.element(element.querySelectorAll('.col-xs-8 block-header button.btn-link.run-btn')[0]);
            expect(editButton.attr('disabled')).toBeTruthy();
            expect(runButton.attr('disabled')).toBeTruthy();

            mapperStateSvc.mapping.record = {};
            scope.$digest();
            expect(editButton.attr('disabled')).toBeFalsy();
            expect(runButton.attr('disabled')).toBeFalsy();
        });
    });
    it('should call createMapping when the button is clicked', function() {
        spyOn(controller, 'createMapping');
        var createButton = angular.element(element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0]);
        angular.element(createButton).triggerHandler('click');
        expect(controller.createMapping).toHaveBeenCalled();
    });
    it('should call deleteMapping when the button is clicked', function() {
        spyOn(controller, 'deleteMapping');
        var deleteButton = angular.element(element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
        angular.element(deleteButton).triggerHandler('click');
        expect(controller.deleteMapping).toHaveBeenCalled();
    });
    it('should call downloadMapping when the button is clicked', function() {
        spyOn(controller, 'downloadMapping');
        var downloadButton = angular.element(element.querySelectorAll('.col-xs-8 block-header button.btn-link.download-btn')[0]);
        angular.element(downloadButton).triggerHandler('click');
        expect(controller.downloadMapping).toHaveBeenCalled();
    });
    it('should call edit when the button is clicked', function() {
        spyOn(controller, 'edit');
        var editButton = angular.element(element.querySelectorAll('.col-xs-8 block-header button.btn-link.edit-btn')[0]);
        angular.element(editButton).triggerHandler('click');
        expect(controller.edit).toHaveBeenCalled();
    });
    it('should call run when the button is clicked', function() {
        spyOn(controller, 'run');
        var runButton = angular.element(element.querySelectorAll('.col-xs-8 block-header button.btn-link.run-btn')[0]);
        angular.element(runButton).triggerHandler('click');
        expect(controller.run).toHaveBeenCalled();
    });
});