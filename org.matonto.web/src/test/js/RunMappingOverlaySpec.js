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
    var $compile,
        scope,
        $q,
        element,
        controller,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        datasetManagerSvc;

    beforeEach(function() {
        module('templates');
        module('runMappingOverlay');
        injectSplitIRIFilter();
        injectHighlightFilter();
        injectTrustedFilter();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockDatasetManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _datasetManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            datasetManagerSvc = _datasetManagerService_;
        });

        mapperStateSvc.mapping = {id: '', jsonld: []};
        element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('runMappingOverlay');
    });

    describe('controller methods', function() {
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                mapperStateSvc.displayRunMappingOverlay = true;
            });
            describe('if it is also being saved', function() {
                beforeEach(function() {
                    mapperStateSvc.editMapping = true;
                    mapperStateSvc.changedMapping = true;
                });
                describe('and it already exists', function() {
                    beforeEach(function() {
                        mappingManagerSvc.mappingIds = [mapperStateSvc.mapping.id];
                    });
                    it('unless an error occurs', function() {
                        var step = mapperStateSvc.step;
                        mappingManagerSvc.updateMapping.and.returnValue($q.reject('Error message'));
                        controller.run();
                        scope.$apply();
                        expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                        expect(mappingManagerSvc.updateMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id, mapperStateSvc.mapping.jsonld);
                        expect(mapperStateSvc.changedMapping).toBe(true);
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
                    });
                    describe('successfully', function() {
                        it('downloading the data', function() {
                            controller.run();
                            scope.$apply();
                            expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.updateMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id, mapperStateSvc.mapping.jsonld);
                            expect(mapperStateSvc.changedMapping).toBe(false);
                            expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.format, controller.fileName);
                            expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                        });
                        it('uploading the data', function() {
                            controller.runMethod = 'upload';
                            controller.run();
                            scope.$apply();
                            expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.updateMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id, mapperStateSvc.mapping.jsonld);
                            expect(mapperStateSvc.changedMapping).toBe(false);
                            expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                            expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.datasetRecordIRI);
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                        });
                    });
                });
                describe('and does not exist yet', function() {
                    it('unless an error occurs', function() {
                        var step = mapperStateSvc.step;
                        mappingManagerSvc.upload.and.returnValue($q.reject('Error message'));
                        controller.run();
                        scope.$apply();
                        expect(mappingManagerSvc.updateMapping).not.toHaveBeenCalled();
                        expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.id);
                        expect(mapperStateSvc.changedMapping).toBe(true);
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
                    });
                    describe('successfully', function() {
                        it('downloading the data', function() {
                            controller.run();
                            scope.$apply();
                            expect(mappingManagerSvc.updateMapping).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.id);
                            expect(mapperStateSvc.changedMapping).toBe(false);
                            expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.format, controller.fileName);
                            expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                        });
                        it('uploading the data', function() {
                            controller.runMethod = 'upload';
                            controller.run();
                            scope.$apply();
                            expect(mappingManagerSvc.updateMapping).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.id);
                            expect(mapperStateSvc.changedMapping).toBe(false);
                            expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                            expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.datasetRecordIRI);
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                        });
                    });
                });
            });
            describe('if it is not being saved', function() {
                beforeEach(function() {
                    mapperStateSvc.editMapping = false;
                });
                it('and downloads the data', function() {
                    controller.run();
                    expect(mappingManagerSvc.updateMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(mapperStateSvc.changedMapping).toBe(false);
                    expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.format, controller.fileName);
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
                    expect(mappingManagerSvc.updateMapping).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(mapperStateSvc.changedMapping).toBe(false);
                    expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndUpload).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.datasetRecordIRI);
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
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$setValidity('required', true);
            controller.fileName = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
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