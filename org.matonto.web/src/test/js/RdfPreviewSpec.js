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
describe('RDF Preview directive', function() {
    var $compile,
        scope,
        jsonFilter = jasmine.createSpy('jsonFilter'),
        delimitedManagerSvc,
        mappingManagerSvc,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('rdfPreview');
        mockMappingManager();
        mockDelimitedManager();

        module(function($provide) {
            $provide.value('jsonFilter', jsonFilter);
        });

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_, _mappingManagerService_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            delimitedManagerSvc = _delimitedManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            $timeout = _$timeout_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
            scope.$digest();
            controller = this.element.controller('rdfPreview');
        });
        describe('should generate an RDF preview', function() {            
            it('if format is JSON-LD', function() {
                controller.serializeOption = 'jsonld';
                controller.generatePreview();
                $timeout.flush();
                expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.serializeOption);
                expect(typeof delimitedManagerSvc.preview).toBe('object');
            });
            it('if format is not JSON-LD', function() {
                controller.serializeOption = 'turtle';
                controller.generatePreview();
                $timeout.flush();
                expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.serializeOption);
                expect(typeof delimitedManagerSvc.preview).toBe('string');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('rdf-preview')).toBe(true);
            expect(this.element.hasClass('slide')).toBe(true);
        });
        it('with the correct classes depending on whether it is visible', function() {
            var toggleIcon = angular.element(this.element.querySelectorAll('.toggle-btn i')[0]);
            expect(this.element.hasClass('out')).toBe(false);
            expect(this.element.hasClass('in')).toBe(true);
            expect(toggleIcon.hasClass('fa-chevron-right')).toBe(false);
            expect(toggleIcon.hasClass('fa-chevron-left')).toBe(true);

            controller = this.element.controller('rdfPreview');
            controller.visible = true;
            scope.$digest();
            expect(this.element.hasClass('out')).toBe(true);
            expect(this.element.hasClass('in')).toBe(false);
            expect(toggleIcon.hasClass('fa-chevron-right')).toBe(true);
            expect(toggleIcon.hasClass('fa-chevron-left')).toBe(false);
        });
        it('with the correctly formatted preview', function() {
            jsonFilter.calls.reset();
            delimitedManagerSvc.preview = '';
            scope.$digest();
            expect(jsonFilter).not.toHaveBeenCalled();

            delimitedManagerSvc.preview = {};
            scope.$digest();
            expect(jsonFilter).toHaveBeenCalledWith({}, 4);
        });
    });
    it('should set the visibility when the toggle button is clicked', function() {
        var element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
        scope.$digest();
        controller = element.controller('rdfPreview');
        expect(controller.visible).toBe(false);
        angular.element(element.querySelectorAll('.toggle-btn')).triggerHandler('click');
        expect(controller.visible).toBe(true);
    });
    it('should call generatePreview when the Refresh button is clicked', function() {
        scope.createPreview = jasmine.createSpy('createPreview');
        var element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
        scope.$digest();
        controller = element.controller('rdfPreview');
        spyOn(controller, 'generatePreview');
        angular.element(element.querySelectorAll('.controls button')).triggerHandler('click');
        expect(controller.generatePreview).toHaveBeenCalled();
    });
});