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
describe('Edit Mapping Form directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        ontologyManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('editMappingForm');
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: '', jsonld: []};
            this.element = $compile(angular.element('<edit-mapping-form></edit-mapping-form>'))(scope);
            scope.$digest();
            controller = this.element.controller('editMappingForm');
        });
        describe('should get the name of the mapping\'s source ontology', function() {
            beforeEach(function() {
                ontologyManagerSvc.getEntityName.calls.reset();
            });
            it('if it exists', function() {
                var result = controller.getSourceOntologyName();
                expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
                expect(typeof result).toBe('string');
            });
            it('unless it does not exist', function() {
                mappingManagerSvc.getSourceOntology.and.returnValue(undefined);
                var result = controller.getSourceOntologyName();
                expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
                expect(result).toBe('');
            });
        });
        it('should get a class mapping name', function() {
            var result = controller.getClassName({});
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith({});
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        describe('should get the name of the base class', function() {
            beforeEach(function() {
                spyOn(controller, 'getClassName').and.returnValue('');                
            });
            it('if it exists', function() {
                var result = controller.getBaseClassName();
                expect(mappingManagerSvc.getBaseClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
                expect(controller.getClassName).toHaveBeenCalled();
                expect(typeof result).toBe('string');
            });
            it('unless it does not exist', function() {
                mappingManagerSvc.getBaseClass.and.returnValue(undefined);
                var result = controller.getBaseClassName();
                expect(mappingManagerSvc.getBaseClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
                expect(controller.getClassName).not.toHaveBeenCalled();
                expect(result).toBe('');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: '', jsonld: []};
            this.element = $compile(angular.element('<edit-mapping-form></edit-mapping-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-mapping-form')).toBe(true);
            expect(this.element.querySelectorAll('.mapping-config').length).toBe(1);
            expect(this.element.querySelectorAll('.class-mapping-select-container').length).toBe(1);
        });
        it('with a class mapping select', function() {
            expect(this.element.find('class-mapping-select').length).toBe(1);
        });
        it('depending on whether a class has been selected and if it is the base class', function() {
            mapperStateSvc.selectedClassMappingId = '';
            scope.$digest();
            var deleteClassButton = angular.element(this.element.querySelectorAll('.class-mapping-select-container button')[0]);
            expect(this.element.find('class-mapping-details').length).toBe(0);
            expect(deleteClassButton.attr('disabled')).toBeTruthy();

            mappingManagerSvc.getBaseClass.and.returnValue({'@id': 'base'});
            mapperStateSvc.selectedClassMappingId = 'class';
            scope.$digest();
            expect(this.element.find('class-mapping-details').length).toBe(1);
            expect(deleteClassButton.attr('disabled')).toBeFalsy();

            mapperStateSvc.selectedClassMappingId = 'base';
            scope.$digest();
            expect(this.element.find('class-mapping-details').length).toBe(1);
            expect(deleteClassButton.attr('disabled')).toBeTruthy();
        });
    });
    it('should set the correct state when the edit config link is clicked', function() {
        mappingManagerSvc.mapping = {name: '', jsonld: []};
        var element = $compile(angular.element('<edit-mapping-form></edit-mapping-form>'))(scope);
        scope.$digest();

        var editConfigLink = angular.element(element.querySelectorAll('.mapping-config custom-label a')[0]);
        editConfigLink.triggerHandler('click');
        expect(mapperStateSvc.displayMappingConfig).toBe(true);
    });
    it('should set the correct state when delete class button is clicked', function() {
        mappingManagerSvc.mapping = {name: '', jsonld: []};
        mapperStateSvc.selectedClassMappingId = 'class';
        var element = $compile(angular.element('<edit-mapping-form></edit-mapping-form>'))(scope);
        scope.$digest();

        var deleteClassButton = angular.element(element.querySelectorAll('.class-mapping-select-container button')[0]);
        deleteClassButton.triggerHandler('click');
        expect(mapperStateSvc.displayDeleteClassConfirm).toBe(true);
    });
});