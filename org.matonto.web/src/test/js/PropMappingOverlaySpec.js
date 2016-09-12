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
describe('Prop Mapping Overlay directive', function() {
    var $compile,
        scope,
        prefixes,
        mappingManagerSvc,
        mapperStateSvc,
        ontologyManagerSvc,
        delimitedManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('propMappingOverlay');
        mockPrefixes();
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _prefixes_, _mappingManagerService_, _mapperStateService_, _ontologyManagerService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });
    });

    describe('should initialize with the correct values', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            delimitedManagerSvc.filePreview = {headers: ['']};
        })
        it('if a new property mapping is being created', function() {
            mapperStateSvc.newProp = true;
            var element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('propMappingOverlay');
            expect(controller.selectedProp).toBeUndefined();
            expect(controller.selectedColumn).toBe('');
        });
        it('if a property mapping is being edited', function() {
            var prop = {};
            var columnIndex = 0;
            var propMapping = {'@id': 'propMap'};
            propMapping[prefixes.delim + 'columnIndex'] = [{'@value': columnIndex}];
            mappingManagerSvc.mapping.jsonld.push(propMapping);
            mapperStateSvc.selectedPropMappingId = propMapping['@id'];
            mappingManagerSvc.getPropIdByMapping.and.returnValue('prop');
            ontologyManagerSvc.getEntity.and.returnValue(prop);
            var element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('propMappingOverlay');
            expect(controller.selectedProp).toEqual(prop);
            expect(controller.selectedColumn).toBe(delimitedManagerSvc.filePreview.headers[columnIndex]);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            delimitedManagerSvc.filePreview = {headers: ['']};
            this.element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('propMappingOverlay');
        });
        it('should find the range class of an object property mapping', function() {
            var classObj = {'@id': 'class'};
            var prop = {};
            prop[prefixes.rdfs + 'range'] = [{'@id': classObj['@id']}];
            ontologyManagerSvc.getEntity.and.returnValue(classObj);
            var result = controller.getRangeClass(prop);
            expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalledWith(classObj['@id'])
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(result).toEqual(classObj);
        });
        describe('should set the correct state for setting the property mapping', function() {
            beforeEach(function() {
                controller.selectedProp = {'@id': 'prop'};
                controller.selectedColumn = delimitedManagerSvc.filePreview.headers[0];
            });
            describe('if a new property mapping is being created', function() {
                beforeEach(function() {
                    mapperStateSvc.newProp = true;
                    this.classMappingId = mapperStateSvc.selectedClassMappingId;
                });
                it('for an object property', function() {
                    var newClass = {'@id': 'class'};
                    var newMapping = [newClass];
                    ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                    mappingManagerSvc.addObjectProp.and.returnValue(newMapping);
                    mappingManagerSvc.getAllClassMappings.and.callFake(function(mapping) {
                        return _.isEqual(mapping, newMapping) ? [newClass] : [];
                    });
                    controller.set();
                    expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(controller.selectedProp['@id']);
                    expect(mappingManagerSvc.getAllClassMappings.calls.count()).toBe(2);
                    expect(mappingManagerSvc.addObjectProp).toHaveBeenCalled();
                    expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(newClass['@id']);
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMappingId);
                    expect(mapperStateSvc.newProp).toBe(false);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(newClass['@id']);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
                it('for a data property', function() {
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    controller.set();
                    expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(controller.selectedProp['@id']);
                    expect(mappingManagerSvc.addObjectProp).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addDataProp).toHaveBeenCalled();
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMappingId);
                    expect(mapperStateSvc.newProp).toBe(false);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
            });
            describe('if a property mapping is being edited', function() {
                beforeEach(function() {
                    mapperStateSvc.newProp = false;
                    this.originalIndex = 10;
                    this.propMapping = {'@id': 'prop'};
                    this.propMapping[prefixes.delim + 'columnIndex'] = [{'@value': this.originalIndex}];
                    mappingManagerSvc.mapping.jsonld.push(this.propMapping);
                    mapperStateSvc.selectedPropMappingId = this.propMapping['@id'];
                    this.classMappingId = mapperStateSvc.selectedClassMappingId;
                });
                it('and it is for an object property', function() {
                    mappingManagerSvc.isDataMapping.and.returnValue(false);
                    controller.set();
                    expect(this.propMapping[prefixes.delim + 'columnIndex'][0]['@value']).toBe(this.originalIndex);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
                it('and it is for a data property', function() {
                    mappingManagerSvc.isDataMapping.and.returnValue(true);
                    controller.set();
                    expect(this.propMapping[prefixes.delim + 'columnIndex'][0]['@value']).not.toBe(this.originalIndex);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
            expect(mapperStateSvc.newProp).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a prop select', function() {
            expect(this.element.find('prop-select').length).toBe(1);
        });
        it('depending on whether a new property mapping is being created', function() {
            var title = this.element.find('h6');
            expect(title.text()).toContain('Edit');

            mapperStateSvc.newProp = true;
            scope.$digest();
            expect(title.text()).toContain('Add');
        });
        describe('depending on whether the selected property is', function() {
            beforeEach(function() {
                controller = this.element.controller('propMappingOverlay');
                controller.selectedProp = {};
            });
            it('a data property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                scope.$digest();
                expect(this.element.querySelectorAll('.column-select-container').length).toBe(1);
                expect(this.element.find('column-select').length).toBe(1);
            });
            it('an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                scope.$digest();
                expect(this.element.querySelectorAll('.class-description').length).toBe(1);
            });
        });
        it('depending on the validity of the form', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            mapperStateSvc.newProp = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            controller = this.element.controller('propMappingOverlay');
            controller.selectedProp = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and set the property mapping value', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call set when the button is clicked', function() {
        var element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('propMappingOverlay');
        spyOn(controller, 'set');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        var element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('propMappingOverlay');
        spyOn(controller, 'cancel');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});