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
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        $timeout,
        $q,
        controller;

    beforeEach(function() {
        module('templates');
        module('runMappingOverlay');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _$timeout_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            $timeout = _$timeout_;
            $q = _$q_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('runMappingOverlay');
        });
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                mapperStateSvc.displayRunMappingOverlay = true;
            });
            describe('if it is also being saved', function() {
                beforeEach(function() {
                    mapperStateSvc.editMapping = true;
                });
                describe('and it already exists', function() {
                    beforeEach(function() {
                        mappingManagerSvc.mappingIds = [mapperStateSvc.mapping.id];
                    });
                    it('unless an error occurs', function() {
                        var step = mapperStateSvc.step;
                        mappingManagerSvc.deleteMapping.and.returnValue($q.reject('Error message'));
                        controller.run();
                        $timeout.flush();
                        expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id);
                        expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.map).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
                    });
                    it('successfully', function() {
                        controller.run();
                        $timeout.flush();
                        expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id);
                        expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.id);
                        expect(delimitedManagerSvc.map).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.format, controller.fileName);
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                    });
                });
                describe('and does not exist yet', function() {
                    it('unless an error occurs', function() {
                        var step = mapperStateSvc.step;
                        mappingManagerSvc.upload.and.returnValue($q.reject('Error message'));
                        controller.run();
                        $timeout.flush();
                        expect(mappingManagerSvc.deleteMapping).not.toHaveBeenCalled();
                        expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.id);
                        expect(delimitedManagerSvc.map).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
                    });
                    it('successfully', function() {
                        controller.run();
                        $timeout.flush();
                        expect(mappingManagerSvc.deleteMapping).not.toHaveBeenCalled();
                        expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.id);
                        expect(delimitedManagerSvc.map).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.format, controller.fileName);
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
                    });
                });
            });
            it('if it is not being saved', function() {
                mapperStateSvc.editMapping = false;
                controller.run();
                expect(mappingManagerSvc.deleteMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                expect(delimitedManagerSvc.map).toHaveBeenCalledWith(mapperStateSvc.mapping.id, controller.format, controller.fileName);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('run-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a text input', function() {
            expect(this.element.find('text-input').length).toBe(1);
        });
        it('with a mapper serialization select', function() {
            expect(this.element.find('mapper-serialization-select').length).toBe(1);
        });
        it('with buttons for cancel and set', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Run'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Run'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the validity of the form', function() {
            controller = this.element.controller('runMappingOverlay');
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.runMappingForm.$setValidity('required', true);
            controller.fileName = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        mapperStateSvc.mapping = {id: '', jsonld: []};
        var element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('runMappingOverlay');
        spyOn(controller, 'cancel');

        var cancelButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
    it('should call run when the run button is clicked', function() {
        mapperStateSvc.mapping = {id: '', jsonld: []};
        var element = $compile(angular.element('<run-mapping-overlay></run-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('runMappingOverlay');
        spyOn(controller, 'run');

        var runButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        runButton.triggerHandler('click');
        expect(controller.run).toHaveBeenCalled();
    });
});