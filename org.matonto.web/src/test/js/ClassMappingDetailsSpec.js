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
describe('Class Mapping Details directive', function() {
    var $compile,
        scope,
        prefixes,
        utilSvc,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('classMappingDetails');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _prefixes_, _utilService_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        mapperStateSvc.mapping = {jsonld: []};
        delimitedManagerSvc.dataRows = [['']];
        this.element = $compile(angular.element('<class-mapping-details></class-mapping-details>'))(scope);
        scope.$digest();
    });

    describe('controller methods', function() {
        beforeEach(function() {
            controller = this.element.controller('classMappingDetails');
        });
        it('should create the IRI template for the class mapping', function() {
            expect(_.isString(controller.getIriTemplate())).toBe(true);
        });
        it('should get the id of the linked class mapping of a property mapping', function() {
            var propMapping = {};
            var result = controller.getLinkedClassId(propMapping);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(propMapping, prefixes.delim + 'classMapping');
            expect(_.isString(result)).toBe(true);
        });
        it('should get the linked column index of a property mapping', function() {
            var propMapping = {};
            var result = controller.getLinkedColumnIndex(propMapping);
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(propMapping, prefixes.delim + 'columnIndex');
            expect(_.isString(result)).toBe(true);
        });
        it('should get a class name', function() {
            expect(_.isString(controller.getClassName({'@id': ''}))).toBe(true);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith({'@id': ''});
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
        });
        it('should get a property name', function() {
            expect(_.isString(controller.getPropName({'@id': ''}))).toBe(true);
            expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith({'@id': ''});
            expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
        });
        describe('should get the value of a property', function() {
            it('if it is a data property mapping', function() {
                var index = '0';
                spyOn(controller, 'getLinkedColumnIndex').and.returnValue(index);
                mappingManagerSvc.isDataMapping.and.returnValue(true);
                var result = controller.getPropValue({});
                expect(delimitedManagerSvc.getHeader).toHaveBeenCalledWith(index)
                expect(typeof result).toBe('string');
            });
            it('if it is an object property mapping', function() {
                var className = 'class';
                spyOn(controller, 'getLinkedClassId').and.returnValue('');
                spyOn(controller, 'getClassName').and.returnValue(className);
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                var result = controller.getPropValue({});
                expect(result).toBe(className);
            });
        });
        describe('should switch the selected class mapping', function() {
            beforeEach(function() {
                this.newId = 'id';
                mapperStateSvc.selectedClassMappingId = 'class';
                mapperStateSvc.selectedPropMappingId = 'prop';
                spyOn(controller, 'getLinkedClassId').and.returnValue(this.newId);
            });
            it('if the property mapping is for an object property', function() {
                mappingManagerSvc.isObjectMapping.and.returnValue(true);
                controller.switchClass({});
                expect(controller.getLinkedClassId).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.newId);
                expect(mapperStateSvc.selectedPropMappingId).toBe('');
            });
            it('unless the property mapping is not for an object property', function() {
                mappingManagerSvc.isObjectMapping.and.returnValue(false);
                controller.switchClass({});
                expect(controller.getLinkedClassId).not.toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).not.toBe(this.newId);
                expect(mapperStateSvc.selectedPropMappingId).not.toBe('');
            });
        });
        it('should set the proper state for adding a property mapping', function() {
            controller.addProp();
            expect(mapperStateSvc.updateAvailableColumns).toHaveBeenCalled();
            expect(mapperStateSvc.displayPropMappingOverlay).toBe(true);
            expect(mapperStateSvc.newProp).toBe(true);
        });
        it('should set the proper state for editing a property mapping', function() {
            mapperStateSvc.newProp = false;
            var propMapping = {'@id': 'prop'};
            controller.editProp(propMapping);
            expect(mapperStateSvc.selectedPropMappingId).toBe(propMapping['@id']);
            expect(mapperStateSvc.updateAvailableColumns).toHaveBeenCalled();
            expect(mapperStateSvc.displayPropMappingOverlay).toBe(true);
            expect(mapperStateSvc.newProp).toBe(false);
        });
        it('should set the proper state for deleting a property mapping', function() {
            var propMapping = {'@id': 'prop'};
            controller.deleteProp(propMapping);
            expect(mapperStateSvc.selectedPropMappingId).toBe(propMapping['@id']);
            expect(mapperStateSvc.displayDeletePropConfirm).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            controller = this.element.controller('classMappingDetails');
            spyOn(controller, 'getPropName').and.returnValue('');
            spyOn(controller, 'getPropValue').and.returnValue('');
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-mapping-details')).toBe(true);
            expect(this.element.querySelectorAll('.iri-template').length).toBe(1);
            expect(this.element.querySelectorAll('.class-mapping-props').length).toBe(1);
        });
        it('depending on whether the selected class mapping has available properties to map', function() {
            var button = angular.element(this.element.querySelectorAll('.class-mapping-props custom-label button')[0]);
            mapperStateSvc.hasAvailableProps.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();

            mapperStateSvc.hasAvailableProps.and.returnValue(false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on the number of mapped properties', function() {
            var properties = [{}, {}];
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(properties);
            scope.$digest();
            expect(this.element.querySelectorAll('.prop-list button').length).toBe(properties.length);
        });
        it('depending on whether a property is selected', function() {
            var property = {'@id': 'prop'};
            mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
            scope.$digest();
            var propButton = angular.element(this.element.querySelectorAll('.prop-list button')[0]);
            expect(propButton.hasClass('active')).toBe(false);

            mapperStateSvc.selectedPropMappingId = property['@id'];
            scope.$digest();
            expect(propButton.hasClass('active')).toBe(true);
        });
    });
    it('should set the right state for editing the IRI template when the link is clicked', function() {
        var iriTemplateLink = angular.element(this.element.querySelectorAll('.iri-template custom-label a')[0]);
        iriTemplateLink.triggerHandler('click');
        expect(mapperStateSvc.editIriTemplate).toBe(true);
    });
    it('should call addProp when the Add Property link is clicked', function() {
        controller = this.element.controller('classMappingDetails');
        spyOn(controller, 'addProp');

        var addPropButton = angular.element(this.element.querySelectorAll('.class-mapping-props custom-label button')[0]);
        addPropButton.triggerHandler('click');
        expect(controller.addProp).toHaveBeenCalled();
    });
    it('should select a property when clicked', function() {
        var property = {'@id': 'prop'};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        controller = this.element.controller('classMappingDetails');
        spyOn(controller, 'getPropName').and.returnValue('');
        spyOn(controller, 'getPropValue').and.returnValue('');
        scope.$digest();
        spyOn(controller, 'getLinkedColumnIndex').and.returnValue('0');

        var propertyButton = angular.element(this.element.querySelectorAll('.prop-list button')[0]);
        propertyButton.triggerHandler('click');
        expect(mapperStateSvc.selectedPropMappingId).toBe(property['@id']);
        expect(mapperStateSvc.highlightIndexes).toEqual(['0']);
    });
    it('should call switchClass when a property is double clicked', function() {
        var property = {};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        controller = this.element.controller('classMappingDetails');
        spyOn(controller, 'getPropName').and.returnValue('');
        spyOn(controller, 'getPropValue').and.returnValue('');
        spyOn(controller, 'switchClass');
        scope.$digest();

        var propertyButton = angular.element(this.element.querySelectorAll('.prop-list button')[0]);
        propertyButton.triggerHandler('dblclick');
        expect(controller.switchClass).toHaveBeenCalled();
    });
    it('should call editProp when an edit property link is clicked', function() {
        var property = {};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        controller = this.element.controller('classMappingDetails');
        spyOn(controller, 'getPropName').and.returnValue('');
        spyOn(controller, 'getPropValue').and.returnValue('');
        spyOn(controller, 'editProp');
        scope.$digest();

        var editPropLink = angular.element(this.element.querySelectorAll('.prop-list button .edit-prop')[0]);
        editPropLink.triggerHandler('click');
        expect(controller.editProp).toHaveBeenCalledWith(property);
    });
    it('should call deleteProp when a delete property link is clicked', function() {
        var property = {};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        controller = this.element.controller('classMappingDetails');
        spyOn(controller, 'getPropName').and.returnValue('');
        spyOn(controller, 'getPropValue').and.returnValue('');
        spyOn(controller, 'deleteProp');
        scope.$digest();

        var deletePropLink = angular.element(this.element.querySelectorAll('.prop-list button .delete-prop')[0]);
        deletePropLink.triggerHandler('click');
        expect(controller.deleteProp).toHaveBeenCalledWith(property);
    });
});