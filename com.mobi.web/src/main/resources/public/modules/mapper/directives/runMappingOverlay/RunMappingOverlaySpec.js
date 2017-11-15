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
describe('Run Mapping Overlay directive', function() {
    var $compile, scope, $q, mapperStateSvc, delimitedManagerSvc, datasetManagerSvc, camelCase, prefixes;

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

        this.datasetRecord = {'@id': 'dataset'};
        datasetManagerSvc.getDatasetRecords.and.returnValue($q.when({data: [[this.datasetRecord]]}));
        datasetManagerSvc.getRecordFromArray.and.returnValue(this.datasetRecord);
        camelCase.and.callFake(_.identity);
        mapperStateSvc.mapping = {record: {title: 'record'}, jsonld: []};
        this.element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('runMappingOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        datasetManagerSvc = null;
        camelCase = null;
        prefixes = null;
    });

    describe('should initialize with the correct values for', function() {
        it('fileName', function() {
            expect(this.controller.fileName).toBe(mapperStateSvc.mapping.record.title);
        });
        it('datasetRecords', function() {
            scope.$apply();
            expect(this.controller.datasetRecords).toEqual([this.datasetRecord]);
            expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalled();
            expect(datasetManagerSvc.getRecordFromArray).toHaveBeenCalledWith([this.datasetRecord]);
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                this.step = mapperStateSvc.step;
                mapperStateSvc.displayRunMappingOverlay = true;
            });
            describe('if it is also being saved', function() {
                describe('and there are changes', function() {
                    beforeEach(function() {
                        mapperStateSvc.editMapping = true;
                        mapperStateSvc.isMappingChanged.and.returnValue(true);
                    });
                    it('unless an error occurs', function() {
                        mapperStateSvc.saveMapping.and.returnValue($q.reject('Error message'));
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(this.step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
                        expect(this.controller.errorMessage).toEqual('Error message');
                    });
                    describe('successfully', function() {
                        beforeEach(function() {
                            this.newId = 'id';
                            mapperStateSvc.saveMapping.and.returnValue($q.when(this.newId));
                        });
                        it('downloading the data', function() {
                            this.controller.run();
                            scope.$apply();
                            expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                            expect(mapperStateSvc.mapping.record.id).toEqual(this.newId);
                            expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(this.newId, this.controller.format, this.controller.fileName);
                            expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                            expect(this.controller.errorMessage).toEqual('');
                        });
                        it('uploading the data', function() {
                            this.controller.runMethod = 'upload';
                            this.controller.run();
                            scope.$apply();
                            expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                            expect(mapperStateSvc.mapping.record.id).toEqual(this.newId);
                            expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                            expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(this.newId, this.controller.datasetRecordIRI);
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                            expect(this.controller.errorMessage).toEqual('');
                        });
                    });
                });
                describe('and there are no changes', function() {
                    beforeEach(function() {
                        mapperStateSvc.isMappingChanged.and.returnValue(false);
                    });
                    it('and downloads the data', function() {
                        this.controller.run();
                        expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.format, this.controller.fileName);
                        expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                    });
                    it('and uploads the data', function() {
                        this.controller.runMethod = 'upload';
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.datasetRecordIRI);
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                    });
                });
            });
            describe('if it is not being saved', function() {
                beforeEach(function() {
                    mapperStateSvc.editMapping = false;
                });
                it('and downloads the data', function() {
                    this.controller.run();
                    expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.format, this.controller.fileName);
                    expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                });
                it('and uploads the data', function() {
                    this.controller.runMethod = 'upload';
                    this.controller.run();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.datasetRecordIRI);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('run-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a radio-buttons', function() {
            expect(this.element.find('radio-button').length).toBe(2);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a text-input', function() {
            expect(this.element.find('text-input').length).toBe(1);
        });
        it('with a mapper-serialization-select', function() {
            expect(this.element.find('mapper-serialization-select').length).toBe(1);
        });
        it('with buttons for cancel and set', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Run'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Run'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$setValidity('required', false);
            this.controller.fileName = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call run when the run button is clicked', function() {
        spyOn(this.controller, 'run');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.run).toHaveBeenCalled();
    });
});