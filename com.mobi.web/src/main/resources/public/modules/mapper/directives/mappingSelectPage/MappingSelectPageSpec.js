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
describe('Mapping Select Page directive', function() {
    var $compile, scope, $q, mappingManagerSvc, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mappingSelectPage');
        mockMappingManager();
        mockMapperState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            $q = _$q_;
        });

        mapperStateSvc.mapping = {record: {title: 'Record'}, ontology: {'@id': 'ontology'}, jsonld: []};
        this.element = $compile(angular.element('<mapping-select-page></mapping-select-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingSelectPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should set the correct state for editing a mapping', function() {
            spyOn(this.controller, 'loadOntologyAndContinue');
            this.controller.edit();
            expect(mapperStateSvc.mappingSearchString).toBe('');
            expect(mapperStateSvc.editMapping).toBe(true);
            expect(this.controller.loadOntologyAndContinue).toHaveBeenCalled();
        });
        it('should set the correct state for running a mapping', function() {
            var mappedColumns = [{}];
            mapperStateSvc.getMappedColumns.and.returnValue(mappedColumns);
            spyOn(this.controller, 'loadOntologyAndContinue');
            this.controller.run();
            expect(mapperStateSvc.mappingSearchString).toBe('');
            expect(mapperStateSvc.highlightIndexes).toEqual(mappedColumns);
            expect(this.controller.loadOntologyAndContinue).toHaveBeenCalled();
        });
        it('should set the correct state for downloading a mapping', function() {
            this.controller.download();
            expect(mapperStateSvc.displayDownloadMappingOverlay).toBe(true);
        });
        it('should set the correct state for duplicating a mapping', function() {
            this.controller.duplicate();
            expect(mapperStateSvc.displayCreateMappingOverlay).toBe(true);
        });
        describe('should load an ontology and continue', function() {
            beforeEach(function() {
                this.ontologies = [{}];
                this.step = mapperStateSvc.step;
                mappingManagerSvc.getSourceOntologies.and.returnValue($q.when(this.ontologies));
            });
            it('if the ontology and mapping are compatiable', function() {
                mapperStateSvc.getClasses.and.returnValue([{}]);
                mappingManagerSvc.areCompatible.and.returnValue(true);
                this.controller.loadOntologyAndContinue();
                scope.$apply();
                expect(mapperStateSvc.sourceOntologies).toEqual(this.ontologies);
                expect(mapperStateSvc.getClasses).toHaveBeenCalledWith(this.ontologies);
                expect(mapperStateSvc.availableClasses).toEqual([{}]);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mapperStateSvc.invalidOntology).toBe(false);
            });
            it('unless the ontology and mapping are incompatiable', function() {
                mappingManagerSvc.areCompatible.and.returnValue(false);
                this.controller.loadOntologyAndContinue();
                scope.$apply();
                expect(mapperStateSvc.sourceOntologies).toEqual([]);
                expect(mapperStateSvc.getClasses).not.toHaveBeenCalled();
                expect(mapperStateSvc.availableClasses).toEqual([]);
                expect(mapperStateSvc.step).toBe(this.step);
                expect(mapperStateSvc.invalidOntology).toBe(true);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-select-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with a mappingListBlock', function() {
            expect(this.element.find('mapping-list-block').length).toBe(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with buttons for downloading, editing, running, and duplicating a mapping', function() {
            var buttons = this.element.querySelectorAll('.col-xs-8 block-header div ul li a');
            expect(buttons.length).toBe(4);
            _.forEach(_.toArray(buttons), function(button) {
                expect(['Edit', 'Run', 'Download', 'Duplicate']).toContain(angular.element(button).text().trim());
            });
        });
        it('depending on whether a mapping has been selected', function() {
            var mappingHeader = angular.element(this.element.querySelectorAll('.col-xs-8 block-header .mapping-preview-header')[0]);
            expect(mappingHeader.hasClass('invisible')).toBe(false);
            expect(this.element.querySelectorAll('.preview').length).toBe(1);

            mapperStateSvc.mapping = undefined;
            scope.$digest();
            expect(mappingHeader.hasClass('invisible')).toBe(true);
            expect(this.element.querySelectorAll('.preview').length).toBe(0);
        });
        it('with the correct classes based on whether the source ontology record was set', function() {
            var sourceOntologyName = angular.element(this.element.querySelectorAll('.source-ontology')[0]);
            expect(sourceOntologyName.hasClass('text-danger')).toBe(false);
            expect(sourceOntologyName.find('span').length).toBe(0);

            delete mapperStateSvc.mapping.ontology;
            scope.$digest();
            expect(sourceOntologyName.hasClass('text-danger')).toBe(true);
            expect(sourceOntologyName.find('span').length).toBe(1);
        });
    });
    it('should call downloadMapping when the button is clicked', function() {
        spyOn(this.controller, 'download');
        var downloadButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header .download-btn')[0]);
        angular.element(downloadButton).triggerHandler('click');
        expect(this.controller.download).toHaveBeenCalled();
    });
    it('should call edit when the button is clicked', function() {
        spyOn(this.controller, 'edit');
        var editButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header .edit-btn')[0]);
        angular.element(editButton).triggerHandler('click');
        expect(this.controller.edit).toHaveBeenCalled();
    });
    it('should call run when the button is clicked', function() {
        spyOn(this.controller, 'run');
        var runButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header .run-btn')[0]);
        angular.element(runButton).triggerHandler('click');
        expect(this.controller.run).toHaveBeenCalled();
    });
    it('should call duplicate when the button is clicked', function() {
        spyOn(this.controller, 'duplicate');
        var duplicateButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header .duplicate-btn')[0]);
        angular.element(duplicateButton).triggerHandler('click');
        expect(this.controller.duplicate).toHaveBeenCalled();
    });
});