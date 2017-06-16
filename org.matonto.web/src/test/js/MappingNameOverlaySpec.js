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
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            splitIRIFilter = _splitIRIFilter_;
        });

        mapperStateSvc.mapping = {id: '', jsonld: []};
        this.element = $compile(angular.element('<mapping-name-overlay></mapping-name-overlay>'))(scope);
        scope.$digest();
    });

    describe('controller methods', function() {
        beforeEach(function() {
            controller = this.element.controller('mappingNameOverlay');
        });
        describe('should set the correct state for setting the name', function() {
            beforeEach(function() {
                controller.newName = 'test';
            });
            it('if it is the edit mapping step', function() {
                splitIRIFilter.and.callFake(function(iri) {
                    return {
                        begin: iri,
                        then: iri,
                        end: iri
                    }
                });
                var selectedClassMappingId = mapperStateSvc.selectedClassMappingId;
                mapperStateSvc.step = mapperStateSvc.editMappingStep;
                controller.set();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                expect(mapperStateSvc.changedMapping).toBe(true);
                expect(mapperStateSvc.selectedClassMappingId).toBe(mappingManagerSvc.getMappingId(controller.newName) + '/' + selectedClassMappingId);
                expect(mappingManagerSvc.renameMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mappingManagerSvc.getMappingId(controller.newName));
                expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(selectedClassMappingId);
                expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(mapperStateSvc.selectedClassMappingId);
                expect(mapperStateSvc.mapping.id).toBe(mappingManagerSvc.getMappingId(controller.newName));
                expect(mapperStateSvc.editMappingName).toBe(false);
            });
            it('if it is not the edit mapping step', function() {
                var selectedClassMappingId = mapperStateSvc.selectedClassMappingId;
                controller.set();
                expect(mappingManagerSvc.getMappingId).toHaveBeenCalledWith(controller.newName);
                expect(mapperStateSvc.changedMapping).toBe(false);
                expect(mapperStateSvc.selectedClassMappingId).toBe(mappingManagerSvc.getMappingId(controller.newName) + '/' + selectedClassMappingId);
                expect(mappingManagerSvc.renameMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mappingManagerSvc.getMappingId(controller.newName));
                expect(mapperStateSvc.removeAvailableProps).toHaveBeenCalledWith(selectedClassMappingId);
                expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(mapperStateSvc.selectedClassMappingId);
                expect(mapperStateSvc.mapping.id).toBe(mappingManagerSvc.getMappingId(controller.newName));
                expect(mapperStateSvc.editMappingName).toBe(false);
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.editMappingName).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a mapping name input', function() {
            expect(this.element.find('mapping-name-input').length).toBe(1);
        });
        it('with buttons for cancel and set', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the validity of the form', function() {
            controller = this.element.controller('mappingNameOverlay');
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.mappingNameForm.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        controller = this.element.controller('mappingNameOverlay');
        spyOn(controller, 'cancel');

        var cancelButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
    it('should call set when the set button is clicked', function() {
        controller = this.element.controller('mappingNameOverlay');
        spyOn(controller, 'set');

        var runButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        runButton.triggerHandler('click');
        expect(controller.set).toHaveBeenCalled();
    });
});