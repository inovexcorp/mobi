/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Class Mapping Details component', function() {
    var $compile, scope, prefixes, utilSvc, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockPrefixes();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockPropertyManager();
        mockUtil();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _prefixes_, _utilService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            modalSvc = _modalService_;
        });

        mapperStateSvc.mapping = {jsonld: []};
        delimitedManagerSvc.dataRows = [['']];
        scope.classMappingId = 'classMapping';
        scope.changeClassMapping = jasmine.createSpy('changeClassMapping');
        scope.updateClassMappings = jasmine.createSpy('updateClassMappings');
        this.element = $compile(angular.element('<class-mapping-details class-mapping-id="classMappingId" change-class-mapping="changeClassMapping(value)" update-class-mappings="updateClassMappings()"></class-mapping-details>'))(scope);
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
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('classMappingId should be one way bound', function() {
            var original = scope.classMappingId;
            this.controller.classMappingId = 'test';
            scope.$digest();
            expect(scope.classMappingId).toEqual(original);
        });
        it('changeClassMapping should be called in the parent scope', function() {
            this.controller.changeClassMapping({value: 'test'});
            expect(scope.changeClassMapping).toHaveBeenCalledWith('test');
        });
        it('updateClassMappings should be called in the parent scope', function() {
            this.controller.updateClassMappings();
            expect(scope.updateClassMappings).toHaveBeenCalled();
        });
    });
    it('should set the correct variables on changes', function() {
        spyOn(this.controller, 'setPropMappings');
        spyOn(this.controller, 'setIriTemplate');
        mapperStateSvc.hasPropsByClassMappingId.and.returnValue(true);
        this.controller.$onChanges();
        expect(this.controller.setPropMappings).toHaveBeenCalled();
        expect(this.controller.setIriTemplate).toHaveBeenCalled();
        expect(mapperStateSvc.hasPropsByClassMappingId).toHaveBeenCalledWith(this.controller.classMappingId);
        expect(this.controller.hasPropsToMap).toEqual(true);
    });
    describe('controller methods', function() {
        it('should open the iriTemplateOverlay', function() {
            this.controller.editIriTemplate();
            expect(modalSvc.openModal).toHaveBeenCalledWith('iriTemplateOverlay', {}, this.controller.setIriTemplate);
        });
        it('should set the IRI template for the class mapping', function() {
            var classMapping = {'@id': 'classMapping'};
            this.controller.classMappingId = classMapping['@id'];
            mapperStateSvc.mapping.jsonld = [classMapping];
            utilSvc.getPropertyValue.and.callFake((obj, prop) => prop === prefixes.delim + 'hasPrefix' ? 'prefix:' : 'localName');
            this.controller.setIriTemplate();
            expect(this.controller.iriTemplate).toEqual('prefix:localName');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(classMapping, prefixes.delim + 'hasPrefix');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(classMapping, prefixes.delim + 'localName');
        });
        it('should get the id of the linked class mapping of a property mapping', function() {
            var propMapping = {};
            var result = this.controller.getLinkedClassId(propMapping);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(propMapping, prefixes.delim + 'classMapping');
            expect(_.isString(result)).toEqual(true);
        });
        it('should get the linked column index of a property mapping', function() {
            var propMapping = {};
            var result = this.controller.getLinkedColumnIndex(propMapping);
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(propMapping, prefixes.delim + 'columnIndex');
            expect(_.isString(result)).toEqual(true);
        });
        describe('should get the value of a property', function() {
            it('if it is a data property mapping', function() {
                var index = '0';
                spyOn(this.controller, 'getLinkedColumnIndex').and.returnValue(index);
                mappingManagerSvc.isDataMapping.and.returnValue(true);
                var result = this.controller.getPropValue({});
                expect(delimitedManagerSvc.getHeader).toHaveBeenCalledWith(index)
                expect(typeof result).toEqual('string');
            });
            it('if it is an object property mapping', function() {
                var className = 'class';
                spyOn(this.controller, 'getLinkedClassId').and.returnValue('');
                utilSvc.getDctermsValue.and.returnValue(className);
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                mapperStateSvc.mapping.jsonld = [{'@id': ''}];
                var result = this.controller.getPropValue({});
                expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(jasmine.any(Object), 'title');
                expect(result).toEqual(className);
            });
        });
        it('should retrieve a preview of a data property value', function() {
            delimitedManagerSvc.dataRows = [['first'], ['second']];
            spyOn(this.controller, 'getLinkedColumnIndex').and.returnValue('0');
            expect(this.controller.getDataValuePreview({})).toEqual('second');
            expect(this.controller.getLinkedColumnIndex).toHaveBeenCalledWith({});
            delimitedManagerSvc.containsHeaders = false;
            expect(this.controller.getDataValuePreview({})).toEqual('first');
            expect(this.controller.getLinkedColumnIndex).toHaveBeenCalledWith({});
        });
        describe('should switch the selected class mapping', function() {
            beforeEach(function() {
                this.newId = 'id';
                mapperStateSvc.selectedPropMappingId = 'prop';
                spyOn(this.controller, 'getLinkedClassId').and.returnValue(this.newId);
            });
            it('if the property mapping is for an object property', function() {
                mappingManagerSvc.isObjectMapping.and.returnValue(true);
                this.controller.switchClass({});
                expect(this.controller.getLinkedClassId).toHaveBeenCalled();
                expect(scope.changeClassMapping).toHaveBeenCalledWith(this.newId);
                expect(mapperStateSvc.selectedPropMappingId).toEqual('');
            });
            it('unless the property mapping is not for an object property', function() {
                mappingManagerSvc.isObjectMapping.and.returnValue(false);
                this.controller.switchClass({});
                expect(this.controller.getLinkedClassId).not.toHaveBeenCalled();
                expect(scope.changeClassMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.selectedPropMappingId).not.toEqual('');
            });
        });
        it('should set the proper state for adding a property mapping', function() {
            this.controller.addProp();
            expect(mapperStateSvc.newProp).toEqual(true);
            expect(modalSvc.openModal).toHaveBeenCalledWith('propMappingOverlay', {}, jasmine.any(Function));
        });
        it('should set the proper state for editing a property mapping', function() {
            mapperStateSvc.newProp = false;
            var propMapping = {'@id': 'prop'};
            this.controller.editProp(propMapping);
            expect(mapperStateSvc.selectedPropMappingId).toEqual(propMapping['@id']);
            expect(mapperStateSvc.newProp).toEqual(false);
            expect(modalSvc.openModal).toHaveBeenCalledWith('propMappingOverlay', {}, this.controller.setPropMappings);
        });
        it('should confirm deleting a property mapping', function() {
            var propMapping = {'@id': 'prop'};
            this.controller.confirmDeleteProp(propMapping);
            expect(mapperStateSvc.selectedPropMappingId).toEqual(propMapping['@id']);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to delete'), this.controller.deleteProp);
        });
        it('should delete a property mapping from the mapping', function() {
            var propId = 'prop';
            mapperStateSvc.selectedPropMappingId = propId;
            spyOn(this.controller, 'setPropMappings');
            this.controller.deleteProp();
            expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(propId, this.controller.classMappingId);
            expect(mapperStateSvc.selectedPropMappingId).toEqual('');
            expect(mapperStateSvc.highlightIndexes).toEqual([]);
            expect(this.controller.setPropMappings).toHaveBeenCalled();
        });
        it('should get the name of a mapping entity', function() {
            var id = 'id';
            mapperStateSvc.mapping.jsonld = [{'@id': id}];
            expect(_.isString(this.controller.getEntityName(id))).toEqual(true);
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': id}, 'title');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.getPropsByClassMappingId.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
            spyOn(this.controller, 'getPropValue').and.returnValue('');
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CLASS-MAPPING-DETAILS');
            expect(this.element.querySelectorAll('.class-mapping-details').length).toEqual(1);
            expect(this.element.querySelectorAll('.iri-template').length).toEqual(1);
            expect(this.element.querySelectorAll('.class-mapping-props').length).toEqual(1);
        });
        it('depending on whether a class mapping is selected', function() {
            var button = angular.element(this.element.querySelectorAll('.iri-template custom-label button')[0]);
            expect(button.attr('disabled')).toBeFalsy();
            
            this.controller.classMappingId = '';
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the selected class mapping has properties to map', function() {
            var button = angular.element(this.element.querySelectorAll('.class-mapping-props button.add-prop-mapping-button')[0]);
            expect(button.attr('disabled')).toBeTruthy();
            
            this.controller.hasPropsToMap = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the number of mapped properties', function() {
            this.controller.propMappings = [{'@id': 'prop1'}, {'@id': 'prop2'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.prop-list .list-group-item').length).toEqual(this.controller.propMappings.length);
        });
        it('depending on whether a property is a data or object property', function() {
            this.controller.propMappings = [{dataMappingInfo: {}}];
            scope.$digest();
            expect(this.element.querySelectorAll('.prop-list .list-group-item .data-prop-value').length).toEqual(1);
            this.controller.propMappings = [{objectMappingInfo: {}}];
            scope.$digest();
            expect(this.element.querySelectorAll('.prop-list .list-group-item .object-prop-value').length).toEqual(1);
        });
        it('depending on whether a property is selected', function() {
            var property = {'@id': 'prop'};
            this.controller.propMappings = [property];
            scope.$digest();
            var propButton = angular.element(this.element.querySelectorAll('.prop-list .list-group-item')[0]);
            expect(propButton.hasClass('active')).toEqual(false);

            mapperStateSvc.selectedPropMappingId = property['@id'];
            scope.$digest();
            expect(propButton.hasClass('active')).toEqual(true);
        });
    });
    it('should call editIriTemplate when the link is clicked', function() {
        spyOn(this.controller, 'editIriTemplate');
        var button = angular.element(this.element.querySelectorAll('.iri-template custom-label button')[0]);
        button.triggerHandler('click');
        expect(this.controller.editIriTemplate).toHaveBeenCalled();
    });
    it('should call addProp when the Add Property link is clicked', function() {
        spyOn(this.controller, 'addProp');
        var button = angular.element(this.element.querySelectorAll('.class-mapping-props button.add-prop-mapping-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.addProp).toHaveBeenCalled();
    });
    it('should select a property when clicked', function() {
        var property = {'@id': 'prop'};
        this.controller.propMappings = [property];
        mapperStateSvc.getPropsByClassMappingId.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        scope.$digest();
        spyOn(this.controller, 'getLinkedColumnIndex').and.returnValue('0');
        var listDiv = angular.element(this.element.querySelectorAll('.prop-list .list-group-item')[0]);
        listDiv.triggerHandler('click');
        expect(mapperStateSvc.selectedPropMappingId).toEqual(property['@id']);
        expect(mapperStateSvc.highlightIndexes).toEqual(['0']);
    });
    it('should call switchClass when a property is double clicked', function() {
        var property = {};
        this.controller.propMappings = [property];
        mapperStateSvc.getPropsByClassMappingId.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        spyOn(this.controller, 'switchClass');
        scope.$digest();
        var listDiv = angular.element(this.element.querySelectorAll('.prop-list .list-group-item')[0]);
        listDiv.triggerHandler('dblclick');
        expect(this.controller.switchClass).toHaveBeenCalled();
    });
    it('should call editProp when an edit property link is clicked', function() {
        var property = {};
        this.controller.propMappings = [property];
        mapperStateSvc.getPropsByClassMappingId.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        spyOn(this.controller, 'editProp');
        scope.$digest();
        var link = angular.element(this.element.querySelectorAll('.prop-list .list-group-item .edit-prop')[0]);
        link.triggerHandler('click');
        expect(this.controller.editProp).toHaveBeenCalledWith(property);
    });
    it('should call deleteProp when a delete property link is clicked', function() {
        var property = {};
        this.controller.propMappings = [property];
        mapperStateSvc.getPropsByClassMappingId.and.returnValue([{ ontologyId: '', propObj: {'@id': ''} }]);
        spyOn(this.controller, 'getPropValue').and.returnValue('');
        spyOn(this.controller, 'confirmDeleteProp');
        scope.$digest();
        var link = angular.element(this.element.querySelectorAll('.prop-list .list-group-item .delete-prop')[0]);
        link.triggerHandler('click');
        expect(this.controller.confirmDeleteProp).toHaveBeenCalledWith(property);
    });
});