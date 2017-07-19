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
    var $compile, scope, element, controller, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, utilSvc;

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
        element = $compile(angular.element('<file-upload-page></file-upload-page>'))(scope);
        scope.$digest();
        controller = element.controller('fileUploadPage');
    });

    describe('controller methods', function() {
        it('should get the name of a data mapping', function() {
            expect(_.isString(controller.getDataMappingName(''))).toBe(true);
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, '');
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, '');
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(jasmine.any(Object));
            expect(utilSvc.getBeautifulIRI.calls.count()).toBe(2);
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
                controller.edit();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                expect(mapperStateSvc.setAvailableProps.calls.count()).toBe(this.classMappings.length);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.displayMappingConfigOverlay).toBe(true);
            });
            it('if a saved mapping is being edited', function() {
                mapperStateSvc.newMapping = false;
                controller.edit();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                expect(mapperStateSvc.setAvailableProps.calls.count()).toBe(this.classMappings.length);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.displayMappingConfigOverlay).not.toBe(true);
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayCancelConfirm).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('file-upload-page')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-5').length).toBe(1);
            expect(element.querySelectorAll('.col-xs-7').length).toBe(1);
        });
        it('with a mapping title', function() {
            expect(element.find('mapping-title').length).toBe(1);
        });
        it('with blocks', function() {
            expect(element.find('block').length).toBe(2);
        });
        it('with a file upload form', function() {
            expect(element.find('file-upload-form').length).toBe(1);
        });
        it('with a button for canceling', function() {
            var button = angular.element(element.querySelectorAll('.col-xs-5 block-footer button.btn-default')[0]);
            expect(button.text().trim()).toBe('Cancel');
        });
        it('depending on whether a file has been selected and there are invalid properties', function() {
            scope.$digest();
            var continueButton = angular.element(element.querySelectorAll('.col-xs-5 block-footer button.btn-primary')[0]);
            expect(continueButton.attr('disabled')).toBeTruthy();

            delimitedManagerSvc.dataRows = [];
            scope.$digest();
            expect(continueButton.attr('disabled')).toBeFalsy();

            mapperStateSvc.invalidProps = [{}];
            scope.$digest();
            expect(continueButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether a mapping is being edited', function() {
            var continueButton = angular.element(element.querySelectorAll('.col-xs-5 block-footer button.btn-primary')[0]);
            expect(continueButton.text().trim()).toBe('Run');

            mapperStateSvc.editMapping = true;
            scope.$digest();
            expect(continueButton.text().trim()).toBe('Continue');
        });
        it('depending on whether there are invalid columns', function() {
            mapperStateSvc.editMapping = true;
            mapperStateSvc.invalidProps = [];
            scope.$digest();
            expect(element.querySelectorAll('.invalid-props').length).toBe(0);

            mapperStateSvc.invalidProps = [{'@id': 'prop', index: 0}];
            scope.$digest();
            var invalidProps = angular.element(element.querySelectorAll('.invalid-props')[0]);
            expect(invalidProps).toBeTruthy();
            expect(invalidProps.querySelectorAll('ul li').length).toBe(mapperStateSvc.invalidProps.length);
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(controller, 'cancel');
        var cancelButton = angular.element(element.querySelectorAll('block-footer button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
    describe('should call the correct function when clicking the continue button ', function() {
        beforeEach(function() {
            this.continueButton = angular.element(element.querySelectorAll('block-footer button.btn-primary')[0]);
        });
        it('if a mapping is being edited', function() {
            spyOn(controller, 'edit');
            mapperStateSvc.editMapping = true;
            this.continueButton.triggerHandler('click');
            expect(controller.edit).toHaveBeenCalled();
        });
        it('if a mapping is not being edited', function() {
            mapperStateSvc.editMapping = false;
            this.continueButton.triggerHandler('click');
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
        });
    });
});