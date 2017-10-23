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
describe('Edit Mapping Page directive', function() {
    var $compile, scope, $q, element, controller, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('editMappingPage');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        mapperStateSvc.mapping = {record: {id: 'Id', title: 'Title', description: 'Description', keywords: ['Keyword']}, jsonld: []};
        element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        controller = element.controller('editMappingPage');
    });

    describe('controller methods', function() {
        describe('should set the correct state for saving a mapping', function() {
            beforeEach(function() {
                this.step = mapperStateSvc.step;
            });
            describe('if the mapping has changed', function() {
                beforeEach(function() {
                    mapperStateSvc.isMappingChanged.and.returnValue(true);
                });
                it('unless an error occurs', function() {
                    mapperStateSvc.saveMapping.and.returnValue($q.reject('Error message'));
                    controller.save();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(this.step);
                    expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    controller.save();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('');
                });
            });
            it('if the mapping has not changed', function() {
                controller.save();
                expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(controller.errorMessage).toBe('');
            });
        });
        describe('should set the correct state for canceling', function() {
            it('if the mapping has been changed', function() {
                mapperStateSvc.isMappingChanged.and.returnValue(true);
                controller.cancel();
                expect(mapperStateSvc.displayCancelConfirm).toBe(true);
            });
            it('if the mapping has not been changed', function() {
                controller.cancel();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(controller.errorMessage).toBe('');
            });
        });
        describe('should test whether the mapping is saveable when', function() {
            it('there are no class mappings and there are no invalid property mappings', function() {
                mappingManagerSvc.getAllClassMappings.and.returnValue([]);
                expect(controller.isSaveable()).toEqual(false);
            });
            it('there are class mappings and there are no invalid property mappings', function () {
                mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
                expect(controller.isSaveable()).toEqual(true);
            });
            it('there are invalid property mappings', function() {
                mapperStateSvc.invalidProps = [{}];
                expect(controller.isSaveable()).toEqual(false);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('edit-mapping-page')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-5').length).toBe(1);
            expect(element.querySelectorAll('.col-xs-7').length).toBe(1);
            expect(element.querySelectorAll('.edit-tabs').length).toBe(1);
        });
        it('with a mapping title', function() {
            expect(element.find('mapping-title').length).toBe(1);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with two tabs', function() {
            expect(element.find('tab').length).toBe(2);
        });
        it('with blocks', function() {
            expect(element.find('block').length).toBe(3);
        });
        it('with an edit mapping form', function() {
            expect(element.find('edit-mapping-form').length).toBe(1);
        });
        it('with an RDF preview form', function() {
            expect(element.find('rdf-preview-form').length).toBe(1);
        });
        it('with buttons for canceling, saving, and saving and running', function() {
            var footers = element.querySelectorAll('tab block-footer');
            _.forEach(footers, function(footer) {
                var buttons = angular.element(footer).find('button');
                expect(buttons.length).toBe(3);
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[1]).text().trim());
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[2]).text().trim());
            });
        });
        it('with disabled buttons if the mapping is not saveable', function() {
            spyOn(controller, 'isSaveable');
            scope.$digest();
            var buttons = _.toArray(element.querySelectorAll('tab block-footer button.btn-primary'));
            _.forEach(buttons, function(button) {
                expect(angular.element(button).attr('disabled')).toBeTruthy();
            });

            controller.isSaveable.and.returnValue(true);
            scope.$digest();
            _.forEach(buttons, function(button) {
                expect(angular.element(button).attr('disabled')).toBeFalsy();
            });
        });
    });
    it('should call cancel when a cancel button is clicked', function() {
        spyOn(controller, 'cancel');
        var cancelButtons = element.querySelectorAll('tab block-footer button.btn-default');
        _.forEach(_.toArray(cancelButtons), function(button) {
            controller.cancel.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(controller.cancel).toHaveBeenCalled();
        });
    });
    it('should call save when a save button is clicked', function() {
        spyOn(controller, 'save');
        var saveButtons = element.querySelectorAll('tab block-footer button.btn-primary.save-btn');
        _.forEach(_.toArray(saveButtons), function(button) {
            controller.save.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(controller.save).toHaveBeenCalled();
        });
    });
    it('should set the correct state when a save and run button is clicked', function() {
        var saveRunButtons = element.querySelectorAll('tab block-footer button.btn-primary.save-run-btn');
        _.forEach(_.toArray(saveRunButtons), function(button) {
            mapperStateSvc.displayRunMappingOverlay = false;
            angular.element(button).triggerHandler('click');
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
        });
    });
});
