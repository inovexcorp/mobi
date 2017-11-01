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
    var $compile, scope, prefixes, utilSvc, mappingManagerSvc, mapperStateSvc, ontologyManagerSvc;

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

        this.compile = function() {
            this.element = $compile(angular.element('<prop-mapping-overlay></prop-mapping-overlay>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('propMappingOverlay');
        }

        mapperStateSvc.mapping = {jsonld: [], difference: {additions: [], deletions: []}};
        mapperStateSvc.newProp = true;
        this.compile();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        utilSvc = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('should initialize with the correct values', function() {
        it('if a new property mapping is being created', function() {
            expect(this.controller.selectedProp).toBeUndefined();
            expect(this.controller.selectedColumn).toBe('');
            expect(this.controller.rangeClassMapping).toBeUndefined();
        });
        describe('if a property mapping is being edited', function() {
            beforeEach(function() {
                this.columnIndex = '0';
                this.propId = 'prop';
                mapperStateSvc.newProp = false;
                this.prop = {};
                var propMapping = {'@id': 'propMap'};
                utilSvc.getPropertyValue.and.returnValue(this.columnIndex);
                mapperStateSvc.mapping.jsonld.push(propMapping);
                mapperStateSvc.selectedPropMappingId = propMapping['@id'];
                mappingManagerSvc.getPropIdByMapping.and.returnValue(this.propId);
                ontologyManagerSvc.getEntity.and.returnValue(this.prop);
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({id: 'propOntology', entities: []});
                utilSvc.getPropertyId.and.returnValue('class');
                mappingManagerSvc.getClassMappingsByClassId.and.returnValue([{}]);
                mapperStateSvc.availableClasses = [{classObj: {'@id': 'class'}}];
            });
            it('and it is an annotation property', function() {
                var annotationProp = {propObj: {'@id': this.propId}, ontologyId: ''};
                mappingManagerSvc.annotationProperties = [this.propId];
                this.compile();
                expect(this.controller.selectedProp).toEqual(annotationProp);
                expect(this.controller.selectedColumn).toBe(this.columnIndex);
                expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
                expect(this.controller.rangeClassMapping).toBeUndefined();
                expect(this.controller.rangeClass).toBeUndefined();
            });
            it('and it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.compile();
                expect(this.controller.selectedProp).toEqual({ontologyId: 'propOntology', propObj: this.prop});
                expect(this.controller.selectedColumn).toBe('');
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
                expect(this.controller.rangeClassMapping).not.toBeUndefined();
                expect(this.controller.rangeClass).not.toBeUndefined();
            });
            it('and it is a data property', function() {
                this.compile();
                expect(this.controller.selectedProp).toEqual({ontologyId: 'propOntology', propObj: this.prop});
                expect(this.controller.selectedColumn).toBe(this.columnIndex);
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
                expect(this.controller.rangeClassMapping).toBeUndefined();
                expect(this.controller.rangeClass).toBeUndefined();
            });
        });
    });
    describe('controller methods', function() {
        it('should get the name of the range class mapping', function() {
            this.controller.rangeClass = {classObj: {'@id': 'class'}};
            utilSvc.getBeautifulIRI.and.returnValue('Class');
            expect(this.controller.getClassMappingName()).toBe('[New Class]');

            this.controller.rangeClassMapping = {};
            utilSvc.getDctermsValue.and.returnValue('Class Title');
            expect(this.controller.getClassMappingName()).toBe('Class Title');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({}, 'title');
        });
        it('should test whether or not the Set button should be disabled', function() {
            mapperStateSvc.newProp = true;
            expect(this.controller.disableSet()).toBe(true);

            this.controller.selectedProp = {propObj: {}};
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            spyOn(this.controller, 'isNumber').and.returnValue(false);
            expect(this.controller.disableSet()).toBe(true);

            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            mapperStateSvc.newProp = false;
            expect(this.controller.disableSet()).toBe(true);

            mapperStateSvc.newProp = true;
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            expect(this.controller.disableSet()).toBe(true);

            ontologyManagerSvc.isDeprecated.and.returnValue(false);
            expect(this.controller.disableSet()).toBe(false);
        });
        it('should set the range class mapping of the selected property', function() {
            var classId = 'class';
            var classMapping = {'@id': classId};
            mapperStateSvc.availableClasses = [{classObj: {'@id': classId}}];
            utilSvc.getPropertyId.and.returnValue(classId);
            mappingManagerSvc.getClassMappingsByClassId.and.returnValue([classMapping]);
            this.controller.selectedProp = {propObj: {}};
            this.controller.setRangeClass();
            expect(this.controller.rangeClassMapping).toBe(classMapping);
            expect(this.controller.rangeClass).toEqual({classObj: {'@id': classId}});
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.rdfs + 'range');
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classId);
        });
        describe('should update the range of the selected property', function() {
            beforeEach(function() {
                spyOn(this.controller, 'setRangeClass');
                this.controller.rangeClass = {};
                this.controller.rangeClassMapping = {};
            });
            it('if it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.controller.updateRange();
                expect(this.controller.selectedColumn).toBe('');
                expect(this.controller.setRangeClass).toHaveBeenCalled();
                expect(this.controller.rangeClassMapping).toEqual({});
                expect(this.controller.rangeClass).toEqual({});
            });
            it('if it is a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                this.controller.updateRange();
                expect(this.controller.selectedColumn).toBe('');
                expect(this.controller.setRangeClass).not.toHaveBeenCalled();
                expect(this.controller.rangeClassMapping).toBeUndefined();
                expect(this.controller.rangeClass).toBeUndefined();
            });
        });
        describe('should set the value of the property mapping', function() {
            beforeEach(function() {
                this.controller.selectedProp = {ontologyId: 'propOntology', propObj: {'@id': 'prop'}};
                this.controller.selectedColumn = '0';
                mapperStateSvc.sourceOntologies = [{id: this.controller.selectedProp.ontologyId, entities: []}]
            });
            describe('if a new property mapping is being created', function() {
                beforeEach(function() {
                    mapperStateSvc.newProp = true;
                    this.classMappingId = mapperStateSvc.selectedClassMappingId;
                    this.propMapping = {'@id': 'propMapping'};
                });
                describe('for an object property', function() {
                    beforeEach(function() {
                        this.classMapping = {'@id': 'classMapping'};
                        ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                        mappingManagerSvc.addClass.and.returnValue(this.classMapping);
                        mappingManagerSvc.addObjectProp.and.returnValue(this.propMapping);
                    });
                    it('and there is already a class mapping for the range', function() {
                        this.controller.rangeClassMapping = this.classMapping;
                        this.controller.set();
                        expect(mappingManagerSvc.addClass).not.toHaveBeenCalled();
                        expect(mappingManagerSvc.addObjectProp).toHaveBeenCalled();
                        expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.difference.additions).toContain(this.propMapping);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMappingId);
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                    });
                    it('and there is no class mapping for the range', function() {
                        var rangeClassId = 'range';
                        this.controller.rangeClass = {ontologyId: 'classOntology', classObj: {'@id': rangeClassId}};
                        mapperStateSvc.availableClasses = [this.controller.rangeClass];
                        mapperStateSvc.sourceOntologies.push({id: 'classOntology', entities: []});
                        this.controller.set();
                        expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, jasmine.any(Array), rangeClassId);
                        expect(mapperStateSvc.mapping.difference.additions).toContain(this.classMapping);
                        expect(mapperStateSvc.availableClasses.length).toBe(0);
                        expect(mappingManagerSvc.addObjectProp).toHaveBeenCalled();
                        expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.difference.additions).toContain(this.propMapping);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                        expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMappingId);
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                    });
                });
                it('for a data property', function() {
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    mappingManagerSvc.addDataProp.and.returnValue(this.propMapping);
                    this.controller.set();
                    expect(mappingManagerSvc.findSourceOntologyWithClass).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addClass).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addObjectProp).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addDataProp).toHaveBeenCalled();
                    expect(mapperStateSvc.mapping.difference.additions).toContain(this.propMapping);
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMappingId);
                    expect(mapperStateSvc.newProp).toBe(false);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
            });
            describe('if a property mapping is being edited', function() {
                beforeEach(function() {
                    this.originalIndex = '10'
                    this.propMapping = {'@id': 'prop'};
                    mapperStateSvc.newProp = false;
                    this.propMapping[prefixes.delim + 'columnIndex'] = [{'@value': this.originalIndex}];
                    mapperStateSvc.mapping.jsonld.push(this.propMapping);
                    mapperStateSvc.selectedPropMappingId = this.propMapping['@id'];
                    this.classMappingId = mapperStateSvc.selectedClassMappingId;
                });
                it('and it is for an object property', function() {
                    mappingManagerSvc.isDataMapping.and.returnValue(false);
                    this.controller.set();
                    expect(this.propMapping[prefixes.delim + 'columnIndex'][0]['@value']).toBe(this.originalIndex);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
                it('and it is for a data property', function() {
                    mapperStateSvc.invalidProps = [{'@id': this.controller.selectedProp.propObj['@id']}];
                    mappingManagerSvc.isDataMapping.and.returnValue(true);
                    this.controller.set();
                    expect(this.propMapping[prefixes.delim + 'columnIndex'][0]['@value']).not.toBe(this.originalIndex);
                    expect(mapperStateSvc.invalidProps).not.toContain({'@id': this.controller.selectedProp.propObj['@id']});
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                    expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
                });
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(mapperStateSvc.displayPropMappingOverlay).toBe(false);
            expect(mapperStateSvc.newProp).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a prop select', function() {
            expect(this.element.find('prop-select').length).toBe(1);
        });
        it('depending on whether a new property mapping is being created', function() {
            var title = this.element.find('h6');
            expect(title.text()).toContain('Add');

            mapperStateSvc.newProp = false;
            scope.$digest();
            expect(title.text()).toContain('Edit');
        });
        describe('depending on whether the selected property is', function() {
            beforeEach(function() {
                this.controller.selectedProp = {propObj: {}};
            });
            it('a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                scope.$digest();
                expect(this.element.querySelectorAll('.column-select-container').length).toBe(1);
                expect(this.element.find('column-select').length).toBe(1);
            });
            it('an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                scope.$digest();
                expect(this.element.querySelectorAll('.range-class-select-container').length).toBe(1);
            });
        });
        it('depending on whether the selected object property is deprecated', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            this.controller.selectedProp = {propObj: {}};
            scope.$digest();
            expect(this.element.querySelectorAll('.range-class-select-container .deprecated').length).toBe(0);

            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.range-class-select-container .deprecated').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            spyOn(this.controller, 'disableSet').and.returnValue(true);
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.disableSet.and.returnValue(false);
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
        spyOn(this.controller, 'set');
        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
