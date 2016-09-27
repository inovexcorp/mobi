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
describe('File Upload Page directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        ontologyManagerSvc,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('fileUploadPage');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _ontologyManagerService_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            $timeout = _$timeout_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<file-upload-page></file-upload-page>'))(scope);
            scope.$digest();
            controller = this.element.controller('fileUploadPage');
        });
        it('should get the name of a data mapping', function() {
            var result = controller.getDataMappingName('');
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, '');
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalled();
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(mappingManagerSvc.getPropMappingTitle).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        describe('should set the correct state for continuing to edit a mapping', function() {
            beforeEach(function() {
                this.baseClass = {'@id': 'base'};
                this.classMappings = [{}];
                mappingManagerSvc.getBaseClass.and.returnValue(this.baseClass);
                mappingManagerSvc.getAllClassMappings.and.returnValue(this.classMappings);
            });
            it('if a new mapping is being created', function() {
                mapperStateSvc.newMapping = true;
                controller.edit();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.baseClass['@id']);
                expect(mapperStateSvc.setAvailableProps.calls.count()).toBe(this.classMappings.length);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.displayMappingConfigOverlay).toBe(true);
            });
            it('if a saved mapping is being edited', function() {
                mapperStateSvc.newMapping = false;
                controller.edit();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.baseClass['@id']);
                expect(mapperStateSvc.setAvailableProps.calls.count()).toBe(this.classMappings.length);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.displayMappingConfigOverlay).not.toBe(true);
            });
        });
        it('should set the correct state for continuing to run a mapping', function() {
            var mappingId = mappingManagerSvc.mapping.id;
            controller.run();
            expect(delimitedManagerSvc.map).toHaveBeenCalledWith(mappingId);
            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mappingManagerSvc.mapping).toBeUndefined();
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayCancelConfirm).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<file-upload-page></file-upload-page>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('file-upload-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-5').length).toBe(1);
            expect(this.element.querySelectorAll('.col-xs-7').length).toBe(1);
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
            var button = angular.element(this.element.querySelectorAll('.col-xs-5 block-footer button.btn-default')[0]);
            expect(button.text().trim()).toBe('Cancel');
        });
        it('depending on whether a file has been selected and there are invalid properties', function() {
            scope.$digest();
            var continueButton = angular.element(this.element.querySelectorAll('.col-xs-5 block-footer button.btn-primary')[0]);
            expect(continueButton.attr('disabled')).toBeTruthy();

            delimitedManagerSvc.dataRows = [];
            scope.$digest();
            expect(continueButton.attr('disabled')).toBeFalsy();

            mapperStateSvc.invalidProps = [{}];
            scope.$digest();
            expect(continueButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether a mapping is being edited', function() {
            var continueButton = angular.element(this.element.querySelectorAll('.col-xs-5 block-footer button.btn-primary')[0]);
            expect(continueButton.text().trim()).toBe('Run');

            mapperStateSvc.editMapping = true;
            scope.$digest();
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
        mappingManagerSvc.mapping = {id: '', jsonld: []};
        var element = $compile(angular.element('<file-upload-page></file-upload-page>'))(scope);
        scope.$digest();
        controller = element.controller('fileUploadPage');
        spyOn(controller, 'cancel');

        var cancelButton = angular.element(element.querySelectorAll('block-footer button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
    describe('should call the correct function when clicking the continue button ', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<file-upload-page></file-upload-page>'))(scope);
            scope.$digest();
            controller = this.element.controller('fileUploadPage');
            this.continueButton = angular.element(this.element.querySelectorAll('block-footer button.btn-primary')[0]); 
        });
        it('if a mapping is being edited', function() {
            spyOn(controller, 'edit');
            mapperStateSvc.editMapping = true;
            this.continueButton.triggerHandler('click');
            expect(controller.edit).toHaveBeenCalled();
        });
        it('if a mapping is not being edited', function() {
            spyOn(controller, 'run');
            mapperStateSvc.editMapping = false;
            this.continueButton.triggerHandler('click');
            expect(controller.run).toHaveBeenCalled();
        });
    });
});