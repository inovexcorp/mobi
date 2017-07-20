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
describe('Run Mapping Overlay directive', function() {
    var $compile, scope, $q, element, controller, mapperStateSvc, delimitedManagerSvc, datasetManagerSvc, camelCase, prefixes;
    var datasetRecord;

    beforeEach(function() {
        module('templates');
        module('runMappingOverlay');
        injectCamelCaseFilter();
        injectHighlightFilter();
        injectTrustedFilter();
        mockMapperState();
        mockDelimitedManager();
        mockDatasetManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _mapperStateService_, _delimitedManagerService_, _datasetManagerService_, _camelCaseFilter_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            datasetManagerSvc = _datasetManagerService_;
            camelCase = _camelCaseFilter_;
            prefixes = _prefixes_;
        });

        datasetRecord = {'@type': [prefixes.dataset + 'DatasetRecord']};
        datasetManagerSvc.getDatasetRecords.and.returnValue($q.when({data: [[datasetRecord]]}));
        camelCase.and.callFake(_.identity);
        mapperStateSvc.mapping = {record: {title: 'record'}, jsonld: []};
        element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('runMappingOverlay');
    });

    describe('should initialize with the correct values for', function() {
        it('fileName', function() {
            expect(controller.fileName).toBe(mapperStateSvc.mapping.record.title);
        });
        it('datasetRecords', function() {
            scope.$apply();
            expect(controller.datasetRecords).toEqual([datasetRecord]);
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for running mapping', function() {
            var step;
            beforeEach(function() {
                step = mapperStateSvc.step;
                mapperStateSvc.displayRunMappingOverlay = true;
            });
            describe('if it is also being saved', function() {
                var saveDeferred;
                beforeEach(function() {
                    saveDeferred = $q.defer();
                    mapperStateSvc.saveMapping.and.returnValue(saveDeferred.promise);
                    mapperStateSvc.editMapping = true;
                });
                it('unless an error occurs', function() {
                    saveDeferred.reject('Error message');
                    controller.run();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(step);
                    expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                    expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
                    expect(controller.errorMessage).toEqual('Error message');
                });
                describe('successfully', function() {
                    var newId = 'id';
                    beforeEach(function() {
                        saveDeferred.resolve(newId);
                    });
                    it('downloading the data', function() {
                        controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.record.id).toEqual(newId);
                        expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(newId, controller.format, controller.fileName);
                        expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                        expect(controller.errorMessage).toEqual('');
                    });
                    it('uploading the data', function() {
                        controller.runMethod = 'upload';
                        controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.record.id).toEqual(newId);
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(newId, controller.datasetRecordIRI);
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                        expect(controller.errorMessage).toEqual('');
                    });
                });
            });
            describe('if it is not being saved', function() {
                beforeEach(function() {
                    mapperStateSvc.editMapping = false;
                });
                it('and downloads the data', function() {
                    controller.run();
                    expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, controller.format, controller.fileName);
                    expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                });
                it('and uploads the data', function() {
                    controller.runMethod = 'upload';
                    controller.run();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, controller.datasetRecordIRI);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('run-mapping-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a radio-buttons', function() {
            expect(element.find('radio-button').length).toBe(2);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
        it('with a text-input', function() {
            expect(element.find('text-input').length).toBe(1);
        });
        it('with a mapper-serialization-select', function() {
            expect(element.find('mapper-serialization-select').length).toBe(1);
        });
        it('with buttons for cancel and set', function() {
            var buttons = element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Run'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Run'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.form.$setValidity('required', false);
            controller.fileName = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(controller, 'cancel');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
    it('should call run when the run button is clicked', function() {
        spyOn(controller, 'run');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.run).toHaveBeenCalled();
    });
});