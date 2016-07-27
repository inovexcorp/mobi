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
describe('Edit Prop Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    beforeEach(function() {
        module('templates');
        module('editPropForm');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        
        inject(function(_ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });
    
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<edit-prop-form></edit-prop-form>'))(scope);
            scope.$digest();
        });
        it('should get the class id', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.getClassId();

            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId);
            expect(typeof result).toBe('string')
        });
        it('should get the prop id', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.getPropId();

            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.selectedPropMappingId);
            expect(typeof result).toBe('string')
        });
        it('should get the property title', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.getTitle();

            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(ontologyManagerSvc.getClass).toHaveBeenCalled();
            expect(mappingManagerSvc.getPropMappingTitle).toHaveBeenCalled();
            expect(typeof result).toBe('string')
        });
        it('should test whether property is an object property', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.isObjectProperty();
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalled();
            expect(result).toBe(false);
        });
        it('should set a new column index correctly', function() {
            var controller = this.element.controller('editPropForm');
            var prop = {'@id': 'test'};
            delimitedManagerSvc.filePreview = {headers: []};
            spyOn(controller, 'getPropId').and.returnValue(prop['@id']);
            spyOn(controller, 'isObjectProperty').and.returnValue(false);
            mappingManagerSvc.getDataMappingFromClass.and.returnValue(prop);
            mapperStateSvc.invalidProps = [prop];
            scope.$digest();
            controller.set();
            expect(ontologyManagerSvc.findOntologyWithClass).toHaveBeenCalled();
            expect(mappingManagerSvc.addDataProp).toHaveBeenCalled();
            expect(mappingManagerSvc.getDataMappingFromClass).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(mapperStateSvc.invalidProps).not.toContain(prop);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<edit-prop-form></edit-prop-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-prop')).toBe(true);
        });
        it('depending on what type of property it is', function() {
            var buttons = this.element.find('custom-button');
            expect(this.element.find('column-select').length).toBe(1);
            expect(this.element.find('range-class-description').length).toBe(0);
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Set');

            spyOn(this.element.controller('editPropForm'), 'isObjectProperty').and.returnValue(true);
            scope.$digest();
            buttons = this.element.find('custom-button');
            expect(this.element.find('range-class-description').length).toBe(1);
            expect(this.element.find('column-select').length).toBe(0);
            expect(buttons.length).toBe(0);
        });
    });
});