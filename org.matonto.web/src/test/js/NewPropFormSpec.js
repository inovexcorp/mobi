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
describe('New Prop Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('newPropForm');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        
        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            delimitedManagerSvc.filePreview = {headers: []};
            this.element = $compile(angular.element('<new-prop-form></new-prop-form>'))(scope);
            scope.$digest();
            controller = this.element.controller('newPropForm');
        });
        describe('should update the available columns', function() {
            it('unless the selected property is an object property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                controller.update();
                expect(mapperStateSvc.updateAvailableColumns).not.toHaveBeenCalled();
            });
            it('if the selected property is a data property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                controller.update();
                expect(mapperStateSvc.updateAvailableColumns).toHaveBeenCalled();
            });
        });
        it('should return the name of the selected class', function() {
            var result = controller.getClassName();
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId);
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        describe('should set the corrcet state for setting a property', function() {
            beforeEach(function() {
                mapperStateSvc.selectedProp = {'@id': ''};
                mappingManagerSvc.addDataProp.calls.reset();
                mappingManagerSvc.addObjectProp.calls.reset();
                this.classMappingId = mapperStateSvc.selectedClassMappingId;
            });
            it('if the selected property is an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                controller.set();
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(mapperStateSvc.selectedProp['@id']);
                expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
                expect(mappingManagerSvc.addObjectProp).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
                expect(mapperStateSvc.openedClasses).toContain(this.classMappingId);
            });
            it('if the selected property is a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                controller.set();
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(mapperStateSvc.selectedProp['@id']);
                expect(mappingManagerSvc.addDataProp).toHaveBeenCalled();
                expect(mappingManagerSvc.addObjectProp).not.toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
                expect(mapperStateSvc.openedClasses).toContain(this.classMappingId);
            });
        });
        it('should set the correct state for setting a property and continuing to the next', function() {
            mapperStateSvc.selectedClassMappingId = 'test';
            spyOn(controller, 'set');
            controller.setNext();
            expect(controller.set).toHaveBeenCalled();
            expect(mapperStateSvc.newProp).toBe(true);
            expect(mapperStateSvc.selectedClassMappingId).toBe('test');
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<new-prop-form></new-prop-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('new-prop-form')).toBe(true);
        });
        it('with a prop-select', function() {
            expect(this.element.find('prop-select').length).toBe(1);
        });
        it('depending on the type of selected property', function() {
            controller = this.element.controller('newPropForm');
            mapperStateSvc.selectedProp = undefined;
            scope.$digest();
            expect(this.element.find('range-class-description').length).toBe(0);
            expect(this.element.find('column-select').length).toBe(0);

            mapperStateSvc.selectedProp = {};
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('range-class-description').length).toBe(0);
            expect(this.element.find('column-select').length).toBe(1);

            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('range-class-description').length).toBe(1);
            expect(this.element.find('column-select').length).toBe(0);
        });
        it('with custom buttons for set and set and next', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Set', 'Set & Next'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Set & Next'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});