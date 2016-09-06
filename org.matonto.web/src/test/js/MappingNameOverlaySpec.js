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
describe('Mapping Name Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('mappingNameOverlay');
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                id: ''
            };
            this.element = $compile(angular.element('<mapping-name-overlay></mapping-name-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('mappingNameOverlay');
        });
        it('should set the correct state for setting the name', function() {
            beforeEach(function() {
                controller.newName = 'test';
            })
            it('if it is the initial step', function() {
                mapperStateSvc.step = 0;
                controller.set();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(mappingManagerSvc.getMappingId(controller.newName));
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                expect(mappingManagerSvc.mapping.id).toBe(mappingManagerSvc.getMappingId(controller.newName));
                expect(mapperStateSvc.editMappingName).toBe(false);
            });
            it('if it is not the intitial step', function() {
                mapperStateSvc.step = 1;
                controller.set();
                expect(mapperStateSvc.step).toBe(1);
                expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                expect(mappingManagerSvc.mapping.id).toBe(mappingManagerSvc.getMappingId(controller.newName));
                expect(mapperStateSvc.editMappingName).toBe(false);
            });
        });
        describe('should set the correct state for canceling', function() {
            beforeEach(function() {
                mapperStateSvc.editMapping = true;
                mapperStateSvc.newMapping = true;
                mappingManagerSvc.mapping = {};
            });
            it('if it is the intitial step', function() {
                mapperStateSvc.step = 0;
                controller.cancel();
                expect(mapperStateSvc.editMapping).toBe(false);
                expect(mapperStateSvc.newMapping).toBe(false);
                expect(mappingManagerSvc.mapping).toEqual(undefined);
                expect(mapperStateSvc.editMappingName).toBe(false);
            });
            it('if it is not the initial step', function() {
                mapperStateSvc.step = 1;
                controller.cancel();
                expect(mapperStateSvc.editMapping).toBe(true);
                expect(mapperStateSvc.newMapping).toBe(true);
                expect(mappingManagerSvc.mapping).toEqual({});
                expect(mapperStateSvc.editMappingName).toBe(false);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-name-overlay></mapping-name-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('depending on the step', function() {
            mapperStateSvc.step = 0;
            scope.$digest();
            expect(this.element.find('h6').text()).toContain('Set');

            mapperStateSvc.step = 1;
            scope.$digest();
            expect(this.element.find('h6').text()).toContain('Edit');
        });
        it('with a mapping name input', function() {
            expect(this.element.find('mapping-name-input').length).toBe(1);
        });
        it('with custom buttons for cancel and set', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});