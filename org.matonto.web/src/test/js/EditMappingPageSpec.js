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
describe('Edit Mapping Page directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('editMappingPage');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            $timeout = _$timeout_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
            scope.$digest();
            controller = this.element.controller('editMappingPage');
        });
        describe('should set the correct state for saving a mapping', function() {
            beforeEach(function() {
                this.mapping = angular.copy(mappingManagerSvc.mapping);
            });
            it('if it already exists', function() {
                mappingManagerSvc.mappingIds = [mappingManagerSvc.mapping.id];
                controller.save();
                $timeout.flush();
                expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.id);
                expect(mappingManagerSvc.upload).toHaveBeenCalledWith(this.mapping.jsonld, this.mapping.id);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mappingManagerSvc.mapping).toBeUndefined();
                expect(mappingManagerSvc.sourceOntologies).toEqual([]);
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
            });
            it('if does not exist yet', function() {
                controller.save();
                $timeout.flush();
                expect(mappingManagerSvc.deleteMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.upload).toHaveBeenCalledWith(this.mapping.jsonld, this.mapping.id);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mappingManagerSvc.mapping).toBeUndefined();
                expect(mappingManagerSvc.sourceOntologies).toEqual([]);
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayCancelConfirm).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {id: '', jsonld: []};
            this.element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-mapping-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-5').length).toBe(1);
            expect(this.element.querySelectorAll('.col-xs-7').length).toBe(1);
            expect(this.element.querySelectorAll('.edit-tabs').length).toBe(1);
        });
        it('with a mapping title', function() {
            expect(this.element.find('mapping-title').length).toBe(1);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toBe(1);
        });
        it('with two tabs', function() {
            expect(this.element.find('tab').length).toBe(2);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(3);
        });
        it('with an edit mapping form', function() {
            expect(this.element.find('edit-mapping-form').length).toBe(1);
        });
        it('with an RDF preview form', function() {
            expect(this.element.find('rdf-preview-form').length).toBe(1);
        });
        it('with buttons for canceling, saving, and saving and running', function() {
            var footers = this.element.querySelectorAll('tab block-footer');
            _.forEach(footers, function(footer) {
                var buttons = angular.element(footer).find('button');
                expect(buttons.length).toBe(3);
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[1]).text().trim());
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[2]).text().trim());
            });
        });
        it('depending on whether the mapping configuration has been set', function() {
            mappingManagerSvc.getSourceOntologyId.and.returnValue('');
            scope.$digest();
            var buttons = this.element.querySelectorAll('tab block-footer button.btn-primary');
            _.forEach(_.toArray(buttons), function(button) {
                expect(angular.element(button).attr('disabled')).toBeTruthy();
            });

            mappingManagerSvc.mapping.jsonld = [{}, {}];
            scope.$digest();
            _.forEach(_.toArray(buttons), function(button) {
                expect(angular.element(button).attr('disabled')).toBeFalsy();
            });

            mappingManagerSvc.getSourceOntologyId.and.returnValue('id');
            mappingManagerSvc.mapping.jsonld = [];
            scope.$digest();
            _.forEach(_.toArray(buttons), function(button) {
                expect(angular.element(button).attr('disabled')).toBeFalsy();
            });
        });
    });
    it('should call cancel when a cancel button is clicked', function() {
        mappingManagerSvc.mapping = {id: '', jsonld: []};
        var element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        controller = element.controller('editMappingPage');
        spyOn(controller, 'cancel');

        var cancelButtons = element.querySelectorAll('tab block-footer button.btn-default');
        _.forEach(_.toArray(cancelButtons), function(button) {
            controller.cancel.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(controller.cancel).toHaveBeenCalled();
        });
    });
    it('should call save when a save button is clicked', function() {
        mappingManagerSvc.mapping = {id: '', jsonld: []};
        this.element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        controller = this.element.controller('editMappingPage');
        spyOn(controller, 'save');
        var saveButtons = this.element.querySelectorAll('tab block-footer button.btn-primary.save-btn');
        _.forEach(_.toArray(saveButtons), function(button) {
            controller.save.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(controller.save).toHaveBeenCalled();
        });
    });
    it('should the the correct state when a save and run button is clicked', function() {
        mappingManagerSvc.mapping = {id: '', jsonld: []};
        this.element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        controller = this.element.controller('editMappingPage');
        var saveRunButtons = this.element.querySelectorAll('tab block-footer button.btn-primary.save-run-btn');
        _.forEach(_.toArray(saveRunButtons), function(button) {
            mapperStateSvc.displayRunMappingOverlay = false;
            angular.element(button).triggerHandler('click');
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
        });
    });
});
