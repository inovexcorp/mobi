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
describe('Class Mapping Details directive', function() {
    var $compile, scope, prefixes, utilSvc, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('classMappingDetails');
        mockPrefixes();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockPropertyManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _prefixes_, _utilService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        mapperStateSvc.mapping = {jsonld: []};
        delimitedManagerSvc.dataRows = [['']];
        this.element = $compile(angular.element('<class-mapping-details></class-mapping-details>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classMappingDetails');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        utilSvc = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should create the IRI template for the class mapping', function() {
            var classMapping = {'@id': 'classMapping'};
            mapperStateSvc.selectedClassMappingId = classMapping['@id'];
            mapperStateSvc.mapping.jsonld = [classMapping];
            expect(_.isString(this.controller.getIriTemplate())).toBe(true);
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(classMapping, prefixes.delim + 'hasPrefix');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(classMapping, prefixes.delim + 'localName');
        });
        it('should get the id of the linked class mapping of a property mapping', function() {
            var propMapping = {};
            var result = this.controller.getLinkedClassId(propMapping);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(propMapping, prefixes.delim + 'classMapping');
            expect(_.isString(result)).toBe(true);
        });
        it('should get the linked column index of a property mapping', function() {
            var propMapping = {};
            var result = this.controller.getLinkedColumnIndex(propMapping);
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(propMapping, prefixes.delim + 'columnIndex');
            expect(_.isString(result)).toBe(true);
        });
        describe('should get the value of a property', function() {
            it('if it is a data property mapping', function() {
                var index = '0';
                spyOn(this.controller, 'getLinkedColumnIndex').and.returnValue(index);
                mappingManagerSvc.isDataMapping.and.returnValue(true);
                var result = this.controller.getPropValue({});
                expect(delimitedManagerSvc.getHeader).toHaveBeenCalledWith(index)
                expect(typeof result).toBe('string');
            });
            it('if it is an object property mapping', function() {
                var className = 'class';
                spyOn(this.controller, 'getLinkedClassId').and.returnValue('');
                utilSvc.getDctermsValue.and.returnValue(className);
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                mapperStateSvc.mapping.jsonld = [{'@id': ''}];
                var result = this.controller.getPropValue({});
                expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(jasmine.any(Object), 'title');
                expect(result).toBe(className);
            });
        });
        it('should retrieve a preview of a data property value', function() {
            delimitedManagerSvc.dataRows = [['first'], ['second']];
            spyOn(this.controller, 'getLinkedColumnIndex').and.returnValue('0');
            expect(this.controller.getDataValuePreview({})).toBe('second');
            expect(this.controller.getLinkedColumnIndex).toHaveBeenCalledWith({});
            delimitedManagerSvc.containsHeaders = false;
            expect(this.controller.getDataValuePreview({})).toBe('first');
            expect(this.controller.getLinkedColumnIndex).toHaveBeenCalledWith({});
        });
        describe('should switch the selected class mapping', function() {
            beforeEach(function() {
                this.newId = 'id';
                mapperStateSvc.selectedClassMappingId = 'class';
                mapperStateSvc.selectedPropMappingId = 'prop';
                spyOn(this.controller, 'getLinkedClassId').and.returnValue(this.newId);
            });
            it('if the property mapping is for an object property', function() {
                mappingManagerSvc.isObjectMapping.and.returnValue(true);
                this.controller.switchClass({});
                expect(this.controller.getLinkedClassId).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.newId);
                expect(mapperStateSvc.selectedPropMappingId).toBe('');
            });
            it('unless the property mapping is not for an object property', function() {
                mappingManagerSvc.isObjectMapping.and.returnValue(false);
                this.controller.switchClass({});
                expect(this.controller.getLinkedClassId).not.toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).not.toBe(this.newId);
                expect(mapperStateSvc.selectedPropMappingId).not.toBe('');
            });
        });
        it('should set the proper state for adding a property mapping', function() {
            this.controller.addProp();
            expect(mapperStateSvc.displayPropMappingOverlay).toBe(true);
            expect(mapperStateSvc.newProp).toBe(true);
        });
        it('should set the proper state for editing a property mapping', function() {
            mapperStateSvc.newProp = false;
            var propMapping = {'@id': 'prop'};
            this.controller.editProp(propMapping);
            expect(mapperStateSvc.selectedPropMappingId).toBe(propMapping['@id']);
            expect(mapperStateSvc.displayPropMappingOverlay).toBe(true);
            expect(mapperStateSvc.newProp).toBe(false);
        });
        it('should set the proper state for deleting a property mapping', function() {
            var propMapping = {'@id': 'prop'};
            this.controller.deleteProp(propMapping);
            expect(mapperStateSvc.selectedPropMappingId).toBe(propMapping['@id']);
            expect(mapperStateSvc.displayDeletePropConfirm).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.getAllProps.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
            spyOn(this.controller, 'getPropValue').and.returnValue('');
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-mapping-details')).toBe(true);
            expect(this.element.querySelectorAll('.iri-template').length).toBe(1);
            expect(this.element.querySelectorAll('.class-mapping-props').length).toBe(1);
        });
        it('depending on whether a class mapping is selected', function() {
            var button = angular.element(this.element.querySelectorAll('.iri-template custom-label button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            mapperStateSvc.selectedClassMappingId = 'class';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the selected class mapping has available properties to map', function() {
            var button = angular.element(this.element.querySelectorAll('.class-mapping-props button.add-prop-mapping-button')[0]);
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
            expect(this.element.querySelectorAll('.prop-list .list-group-item').length).toBe(properties.length);
        });
        it('depending on whether a property is a data or object property', function() {
            mappingManagerSvc.isDataMapping.and.returnValue(true);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue([{}]);
            scope.$digest();
            expect(this.element.querySelectorAll('.prop-list .list-group-item .data-prop-value').length).toBe(1);
            mappingManagerSvc.isObjectMapping.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.prop-list .list-group-item .object-prop-value').length).toBe(1);
        });
        it('depending on whether a property is selected', function() {
            var property = {'@id': 'prop'};
            mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
            scope.$digest();
            var propButton = angular.element(this.element.querySelectorAll('.prop-list .list-group-item')[0]);
            expect(propButton.hasClass('active')).toBe(false);

            mapperStateSvc.selectedPropMappingId = property['@id'];
            scope.$digest();
            expect(propButton.hasClass('active')).toBe(true);
        });
    });
    it('should set the right state for editing the IRI template when the link is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.iri-template custom-label button')[0]);
        button.triggerHandler('click');
        expect(mapperStateSvc.editIriTemplate).toBe(true);
    });
    it('should call addProp when the Add Property link is clicked', function() {
        spyOn(this.controller, 'addProp');
        var button = angular.element(this.element.querySelectorAll('.class-mapping-props button.add-prop-mapping-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.addProp).toHaveBeenCalled();
    });
    it('should select a property when clicked', function() {
        var property = {'@id': 'prop'};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        mapperStateSvc.getAllProps.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        scope.$digest();
        spyOn(this.controller, 'getLinkedColumnIndex').and.returnValue('0');
        var listDiv = angular.element(this.element.querySelectorAll('.prop-list .list-group-item')[0]);
        listDiv.triggerHandler('click');
        expect(mapperStateSvc.selectedPropMappingId).toBe(property['@id']);
        expect(mapperStateSvc.highlightIndexes).toEqual(['0']);
    });
    it('should call switchClass when a property is double clicked', function() {
        var property = {};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        mapperStateSvc.getAllProps.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        spyOn(this.controller, 'switchClass');
        scope.$digest();
        var listDiv = angular.element(this.element.querySelectorAll('.prop-list .list-group-item')[0]);
        listDiv.triggerHandler('dblclick');
        expect(this.controller.switchClass).toHaveBeenCalled();
    });
    it('should call editProp when an edit property link is clicked', function() {
        var property = {};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        mapperStateSvc.getAllProps.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        spyOn(this.controller, 'editProp');
        scope.$digest();
        var link = angular.element(this.element.querySelectorAll('.prop-list .list-group-item .edit-prop')[0]);
        link.triggerHandler('click');
        expect(this.controller.editProp).toHaveBeenCalledWith(property);
    });
    it('should call deleteProp when a delete property link is clicked', function() {
        var property = {};
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([property]);
        mapperStateSvc.getAllProps.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        spyOn(this.controller, 'deleteProp');
        scope.$digest();
        var link = angular.element(this.element.querySelectorAll('.prop-list .list-group-item .delete-prop')[0]);
        link.triggerHandler('click');
        expect(this.controller.deleteProp).toHaveBeenCalledWith(property);
    });
});