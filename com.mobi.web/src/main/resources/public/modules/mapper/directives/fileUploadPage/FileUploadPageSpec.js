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
describe('File Upload Page directive', function() {
    var $compile, scope, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('fileUploadPage');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            utilSvc = _utilService_;
        });

        mapperStateSvc.mapping = {record: {id: ''}, jsonld: []};
        this.element = $compile(angular.element('<file-upload-page></file-upload-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('fileUploadPage');
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
        it('should get the name of a data mapping', function() {
            mapperStateSvc.mapping.jsonld = [{'@id': 'dataMapping'}];
            mappingManagerSvc.findClassWithDataMapping.and.returnValue({'@id': 'classMapping'});
            expect(_.isString(this.controller.getDataMappingName('dataMapping'))).toBe(true);
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, 'dataMapping');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'dataMapping'}, 'title');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'classMapping'}, 'title');
            expect(mappingManagerSvc.getPropMappingTitle).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(String));
        });
        describe('should set the correct state for continuing to edit a mapping', function() {
            beforeEach(function() {
                this.classMapping = {'@id': 'class'};
                this.classMappings = [this.classMapping];
                mappingManagerSvc.getAllClassMappings.and.returnValue(this.classMappings);
            });
            it('if a new mapping is being created', function() {
                mapperStateSvc.newMapping = true;
                this.controller.edit();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                expect(mapperStateSvc.setProps.calls.count()).toBe(this.classMappings.length);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.displayMappingConfigOverlay).toBe(true);
            });
            it('if a saved mapping is being edited', function() {
                mapperStateSvc.newMapping = false;
                this.controller.edit();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                expect(mapperStateSvc.setProps.calls.count()).toBe(this.classMappings.length);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.displayMappingConfigOverlay).not.toBe(true);
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('file-upload-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-5').length).toBe(1);
            expect(this.element.querySelectorAll('.col-7').length).toBe(1);
        });
        it('with a mapping title', function() {
            expect(this.element.find('mapping-title').length).toBe(1);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(2);
        });
        it('with a file upload form', function() {
            expect(this.element.find('file-upload-form').length).toBe(1);
        });
        it('with a button for canceling', function() {
            var button = angular.element(this.element.querySelectorAll('.col-5 block-footer button:not(.btn-primary)')[0]);
            expect(button.text().trim()).toBe('Cancel');
        });
        it('depending on whether a file has been selected and there are invalid properties', function() {
            scope.$digest();
            var continueButton = angular.element(this.element.querySelectorAll('.col-5 block-footer button.btn-primary')[0]);
            expect(continueButton.attr('disabled')).toBeTruthy();

            delimitedManagerSvc.dataRows = [];
            scope.$digest();
            expect(continueButton.attr('disabled')).toBeFalsy();

            mapperStateSvc.invalidProps = [{}];
            scope.$digest();
            expect(continueButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether a mapping is being edited', function() {
            var runMapping = angular.element(this.element.querySelectorAll('.run-btn'));
            expect(runMapping.text().trim()).toBe('Run Mapping');

            mapperStateSvc.editMapping = true;
            scope.$digest();
            var continueButton = angular.element(this.element.querySelectorAll('.continue-btn'));
            expect(continueButton.text().trim()).toBe('Continue');
        });
        it('depending on whether there are invalid columns', function() {
            mapperStateSvc.editMapping = true;
            mapperStateSvc.invalidProps = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.invalid-props').length).toBe(0);

            mapperStateSvc.invalidProps = [{'@id': 'prop', index: 0}];
            scope.$digest();
            var invalidProps = angular.element(this.element.querySelectorAll('.invalid-props')[0]);
            expect(invalidProps).toBeTruthy();
            expect(invalidProps.querySelectorAll('ul li').length).toBe(mapperStateSvc.invalidProps.length);
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var cancelButton = angular.element(this.element.querySelectorAll('block-footer button:not(.btn-primary)')[0]);
        cancelButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call edit when clicking the continue button ', function() {
        mapperStateSvc.editMapping = true;
        scope.$digest();
        this.continueButton = angular.element(this.element.querySelectorAll('.continue-btn'));
        spyOn(this.controller, 'edit');
        this.continueButton.triggerHandler('click');
        expect(this.controller.edit).toHaveBeenCalled();
    });
    it('should set displayRunMappingDownloadOverlay when the clicked', function() {
        this.mapOntology = angular.element(this.element.querySelectorAll('.dropdown-menu button')[0]);
        mapperStateSvc.editMapping = false;
        this.mapOntology.triggerHandler('click');
        expect(mapperStateSvc.displayRunMappingDownloadOverlay).toBe(true);
    });
    it('should set displayRunMappingDatasetOverlay when the clicked', function() {
        this.mapOntology = angular.element(this.element.querySelectorAll('.dropdown-menu button')[1]);
        mapperStateSvc.editMapping = false;
        this.mapOntology.triggerHandler('click');
        expect(mapperStateSvc.displayRunMappingDatasetOverlay).toBe(true);
    });
    it('should set displayRunMappingOntologyOverlay when the clicked', function() {
        this.mapOntology = angular.element(this.element.querySelectorAll('.dropdown-menu button')[2]);
        mapperStateSvc.editMapping = false;
        this.mapOntology.triggerHandler('click');
        expect(mapperStateSvc.displayRunMappingOntologyOverlay).toBe(true);
    });
});