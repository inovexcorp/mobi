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
describe('Prop Mapping Overlay directive', function() {
    var $compile, scope, element, controller, prefixes, utilSvc, mappingManagerSvc, mapperStateSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propMappingOverlay');
        mockUtil();
        mockPrefixes();
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _prefixes_, _utilService_, _mappingManagerService_, _mapperStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        mapperStateSvc.mapping = {jsonld: [], difference: {additions: [], deletions: []}};
        mapperStateSvc.newProp = true;
        element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('propMappingOverlay');
    });

    describe('should initialize with the correct values', function() {
        it('if a new property mapping is being created', function() {
            expect(controller.selectedProp).toBeUndefined();
            expect(controller.selectedColumn).toBe('');
            expect(controller.rangeClassMapping).toBeUndefined();
        });
        describe('if a property mapping is being edited', function() {
            var prop, columnIndex = '0', propId = 'prop';
            beforeEach(function() {
                mapperStateSvc.newProp = false;
                prop = {};
                var propMapping = {'@id': 'propMap'};
                utilSvc.getPropertyValue.and.returnValue(columnIndex);
                mapperStateSvc.mapping.jsonld.push(propMapping);
                mapperStateSvc.selectedPropMappingId = propMapping['@id'];
                mappingManagerSvc.getPropIdByMapping.and.returnValue(propId);
                ontologyManagerSvc.getEntity.and.returnValue(prop);
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({id: 'propOntology', entities: []});
                utilSvc.getPropertyId.and.returnValue('class');
                mappingManagerSvc.getClassMappingsByClassId.and.returnValue([{}]);
                mapperStateSvc.availableClasses = [{classObj: {'@id': 'class'}}];
            });
            it('and it is an annotation property', function() {
                var annotationProp = {propObj: {'@id': propId}, ontologyId: ''};
                mappingManagerSvc.annotationProperties = [propId];
                element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('propMappingOverlay');
                expect(controller.selectedProp).toEqual(annotationProp);
                expect(controller.selectedColumn).toBe(columnIndex);
                expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
                expect(controller.rangeClassMapping).toBeUndefined();
                expect(controller.rangeClass).toBeUndefined();
            });
            it('and it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('propMappingOverlay');
                expect(controller.selectedProp).toEqual({ontologyId: 'propOntology', propObj: prop});
                expect(controller.selectedColumn).toBe('');
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
                expect(controller.rangeClassMapping).not.toBeUndefined();
                expect(controller.rangeClass).not.toBeUndefined();
            });
            it('and it is a data property', function() {
                element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('propMappingOverlay');
                expect(controller.selectedProp).toEqual({ontologyId: 'propOntology', propObj: prop});
                expect(controller.selectedColumn).toBe(columnIndex);
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
                expect(controller.rangeClassMapping).toBeUndefined();
                expect(controller.rangeClass).toBeUndefined();
            });
        });
    });
    describe('controller methods', function() {
        it('should get the name of the range class mapping', function() {
            controller.rangeClass = {classObj: {'@id': 'class'}};
            utilSvc.getBeautifulIRI.and.returnValue('Class');
            expect(controller.getClassMappingName()).toBe('[New Class]');

            controller.rangeClassMapping = {};
            expect(controller.getClassMappingName()).toBe('Class');
        });
        it('should test whether or not the Set button should be disabled', function() {
            mapperStateSvc.newProp = true;
            expect(controller.disableSet()).toBe(true);

            controller.selectedProp = {propObj: {}};
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            spyOn(controller, 'isNumber').and.returnValue(false);
            expect(controller.disableSet()).toBe(true);

            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            mapperStateSvc.newProp = false;
            expect(controller.disableSet()).toBe(true);

            mapperStateSvc.newProp = true;
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            expect(controller.disableSet()).toBe(true);

            ontologyManagerSvc.isDeprecated.and.returnValue(false);
            expect(controller.disableSet()).toBe(false);
        });
        it('should set the range class mapping of the selected property', function() {
            var classId = 'class';
            var classMapping = {'@id': classId};
            mapperStateSvc.availableClasses = [{classObj: {'@id': classId}}];
            utilSvc.getPropertyId.and.returnValue(classId);
            mappingManagerSvc.getClassMappingsByClassId.and.returnValue([classMapping]);
            controller.selectedProp = {propObj: {}};
            controller.setRangeClass();
            expect(controller.rangeClassMapping).toBe(classMapping);
            expect(controller.rangeClass).toEqual({classObj: {'@id': classId}});
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.rdfs + 'range');
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classId);
        });
        describe('should update the range of the selected property', function() {
            beforeEach(function() {
                spyOn(controller, 'setRangeClass');
                controller.rangeClass = {};
                controller.rangeClassMapping = {};
            });
            it('if it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                controller.updateRange();
                expect(controller.selectedColumn).toBe('');
                expect(controller.setRangeClass).toHaveBeenCalled();
                expect(controller.rangeClassMapping).toEqual({});
                expect(controller.rangeClass).toEqual({});
            });
            it('if it is a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                controller.updateRange();
                expect(controller.selectedColumn).toBe('');
                expect(controller.setRangeClass).not.toHaveBeenCalled();
                expect(controller.rangeClassMapping).toBeUndefined();
                expect(controller.rangeClass).toBeUndefined();
            });
        });
        describe('should set the value of the property mapping', function() {
            beforeEach(function() {
                controller.selectedProp = {ontologyId: 'propOntology', propObj: {'@id': 'prop'}};
                controller.selectedColumn = '0';
                mapperStateSvc.sourceOntologies = [{id: controller.selectedProp.ontologyId, entities: []}]
            });
            describe('if a new property mapping is being created', function() {
                var classMappingId, propMapping = {'@id': 'propMapping'};
                beforeEach(function() {
                    mapperStateSvc.newProp = true;
                    classMappingId = mapperStateSvc.selectedClassMappingId;
                });
                describe('for an object property', function() {
                    var classMapping = {'@id': 'classMapping'};
                    beforeEach(function() {
                        ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                        mappingManagerSvc.addClass.and.returnValue(classMapping);
                        mappingManagerSvc.addObjectProp.and.returnValue(propMapping);
                    });
                    it('and there is already a class mapping for the range', function() {
                        controller.rangeClassMapping = classMapping;
                        controller.set();
                        expect(mappingManagerSvc.addClass).not.toHaveBeenCalled();
                        expect(mappingManagerSvc.addObjectProp).toHaveBeenCalled();
                        expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.difference.additions).toContain(propMapping);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(classMapping['@id']);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(classMappingId);
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                    });
                    it('and there is no class mapping for the range', function() {
                        var rangeClassId = 'range';
                        controller.rangeClass = {ontologyId: 'classOntology', classObj: {'@id': rangeClassId}};
                        mapperStateSvc.availableClasses = [controller.rangeClass];
                        mapperStateSvc.sourceOntologies.push({id: 'classOntology', entities: []});
                        controller.set();
                        expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, jasmine.any(Array), rangeClassId);
                        expect(mapperStateSvc.mapping.difference.additions).toContain(classMapping);
                        expect(mapperStateSvc.availableClasses.length).toBe(0);
                        expect(mappingManagerSvc.addObjectProp).toHaveBeenCalled();
                        expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.difference.additions).toContain(propMapping);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(classMapping['@id']);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(classMappingId);
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                    });
                });
                it('for a data property', function() {
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    mappingManagerSvc.addDataProp.and.returnValue(propMapping);
                    controller.set();
                    expect(mappingManagerSvc.findSourceOntologyWithClass).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addClass).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addObjectProp).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addDataProp).toHaveBeenCalled();
                    expect(mapperStateSvc.mapping.difference.additions).toContain(propMapping);
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(classMappingId);
                    expect(mapperStateSvc.newProp).toBe(false);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
            });
            describe('if a property mapping is being edited', function() {
                var originalIndex = '10', propMapping, classMappingId;
                beforeEach(function() {
                    propMapping = {'@id': 'prop'};
                    mapperStateSvc.newProp = false;
                    propMapping[prefixes.delim + 'columnIndex'] = [{'@value': originalIndex}];
                    mapperStateSvc.mapping.jsonld.push(propMapping);
                    mapperStateSvc.selectedPropMappingId = propMapping['@id'];
                    classMappingId = mapperStateSvc.selectedClassMappingId;
                });
                it('and it is for an object property', function() {
                    mappingManagerSvc.isDataMapping.and.returnValue(false);
                    controller.set();
                    expect(propMapping[prefixes.delim + 'columnIndex'][0]['@value']).toBe(originalIndex);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(classMappingId);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
                it('and it is for a data property', function() {
                    mapperStateSvc.invalidProps = [{'@id': controller.selectedProp.propObj['@id']}];
                    mappingManagerSvc.isDataMapping.and.returnValue(true);
                    controller.set();
                    expect(propMapping[prefixes.delim + 'columnIndex'][0]['@value']).not.toBe(originalIndex);
                    expect(mapperStateSvc.invalidProps).not.toContain({'@id': controller.selectedProp.propObj['@id']});
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(classMappingId);
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
        it('for wrapping containers', function() {
            expect(element.hasClass('prop-mapping-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a prop select', function() {
            expect(element.find('prop-select').length).toBe(1);
        });
        it('depending on whether a new property mapping is being created', function() {
            var title = element.find('h6');
            expect(title.text()).toContain('Add');

            mapperStateSvc.newProp = false;
            scope.$digest();
            expect(title.text()).toContain('Edit');
        });
        describe('depending on whether the selected property is', function() {
            beforeEach(function() {
                controller.selectedProp = {propObj: {}};
            });
            it('a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                scope.$digest();
                expect(element.querySelectorAll('.column-select-container').length).toBe(1);
                expect(element.find('column-select').length).toBe(1);
            });
            it('an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                scope.$digest();
                expect(element.querySelectorAll('.range-class-select-container').length).toBe(1);
            });
        });
        it('depending on whether the selected object property is deprecated', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            controller.selectedProp = {propObj: {}};
            scope.$digest();
            expect(element.querySelectorAll('.range-class-select-container .deprecated').length).toBe(0);

            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            scope.$digest();
            expect(element.querySelectorAll('.range-class-select-container .deprecated').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            spyOn(controller, 'disableSet').and.returnValue(true);
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            controller.disableSet.and.returnValue(false);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and set the property mapping value', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call set when the button is clicked', function() {
        spyOn(controller, 'set');
        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(controller, 'cancel');
        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});
