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
describe('Edit Class Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('editClassForm');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                jsonld: [{'@id': ''}]
            };
            this.element = $compile(angular.element('<edit-class-form></edit-class-form>'))(scope);
            scope.$digest();
            controller = this.element.controller('editClassForm');
        });
        it('should create the IRI template for the class mapping', function() {
            var result = controller.getIriTemplate();
            expect(typeof result).toBe('string');
        });
        it('should get a class title', function() {
            var result = controller.getTitle();
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalled();
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                jsonld: [{'@id': ''}]
            };
            this.element = $compile(angular.element('<edit-class-form></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-class')).toBe(true);
            expect(this.element.querySelectorAll('.iri-template').length).toBe(1);
        });
    });
    it('should set the correct state when the edit link is clicked', function() {
        mappingManagerSvc.mapping = {
            jsonld: [{'@id': ''}]
        };
        var element = $compile(angular.element('<edit-class-form></edit-class-form>'))(scope);
        scope.$digest();

        angular.element(element.querySelectorAll('.iri-template a')[0]).triggerHandler('click');
        expect(mapperStateSvc.editIriTemplate).toBe(true);
    });
});