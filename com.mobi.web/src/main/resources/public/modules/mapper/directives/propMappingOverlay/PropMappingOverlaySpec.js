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
describe('Prop Mapping Overlay component', function() {
    var $compile, scope, prefixes, utilSvc, mappingManagerSvc, mapperStateSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propMappingOverlay');
        mockUtil();
        mockPrefixes();
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();
        mockPropertyManager();
        injectTrustedFilter();

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
            scope.close = jasmine.createSpy('close');
            scope.dismiss = jasmine.createSpy('dismiss');
            this.element = $compile(angular.element('<prop-mapping-overlay close="close()" dismiss="dismiss()"></prop-mapping-overlay>'))(scope);
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
            expect(this.controller.selectedPropMapping).toBeUndefined();
            expect(this.controller.selectedProp).toBeUndefined();
            expect(this.controller.selectedColumn).toBe('');
            expect(this.controller.rangeClassMappingId).toEqual('');
            expect(this.controller.classMappings).toEqual([]);
            expect(this.controller.rangeClass).toBeUndefined();
        });
        describe('if a property mapping is being edited', function() {
            beforeEach(function() {
                this.columnIndex = '0';
                this.propId = 'prop';
                mapperStateSvc.newProp = false;
                this.prop = {};
                this.propMapping = {'@id': 'propMap'};
                this.ontology = {id: 'propOntology', entities: []};
                utilSvc.getPropertyValue.and.returnValue(this.columnIndex);
                mapperStateSvc.mapping.jsonld.push(this.propMapping);
                mapperStateSvc.selectedPropMappingId = this.propMapping['@id'];
                mappingManagerSvc.getPropIdByMapping.and.returnValue(this.propId);
                ontologyManagerSvc.getEntity.and.returnValue(this.prop);
                mappingManagerSvc.findSourceOntologyWithProp.and.returnValue(this.ontology);
                utilSvc.getPropertyId.and.returnValue('class');
                mappingManagerSvc.getClassMappingsByClassId.and.returnValue([{}]);
                mapperStateSvc.availableClasses = [{classObj: {'@id': 'class'}}];
            });
            it('and it is an annotation property', function() {
                var annotationProp = {propObj: {'@id': this.propId}, ontologyId: ''};
                mappingManagerSvc.annotationProperties = [this.propId];
                this.compile();
                expect(this.controller.selectedPropMapping).toEqual(this.propMapping)
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).not.toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
                expect(this.controller.selectedProp).toEqual(annotationProp);
                expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(this.propMapping, prefixes.delim + 'columnIndex');
                expect(this.controller.selectedColumn).toBe(this.columnIndex);
            });
            it('and it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.compile();
                expect(this.controller.selectedPropMapping).toEqual(this.propMapping)
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(this.propId, mapperStateSvc.sourceOntologies);
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith([this.ontology.entities], this.propId);
                expect(this.controller.selectedProp).toEqual({ontologyId: this.ontology.id, propObj: this.prop});
                expect(this.controller.selectedColumn).toBe('');
            });
            it('and it is a data property', function() {
                this.compile();
                expect(this.controller.selectedPropMapping).toEqual(this.propMapping)
                expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(this.propMapping);
                expect(mappingManagerSvc.findSourceOntologyWithProp).toHaveBeenCalledWith(this.propId, mapperStateSvc.sourceOntologies);
                expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith([this.ontology.entities], this.propId);
                expect(this.controller.selectedProp).toEqual({ontologyId: this.ontology.id, propObj: this.prop});
                expect(this.controller.selectedColumn).toBe(this.columnIndex);
            });
        });
    });
    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should test whether or not the Set button should be disabled', function() {
            mapperStateSvc.newProp = true;
            expect(this.controller.disableSet()).toBe(true);

            this.controller.selectedProp = {propObj: {}};
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            this.controller.selectedColumn = '';
            expect(this.controller.disableSet()).toBe(true);

            this.controller.selectedColumn = '1';
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            expect(this.controller.disableSet()).toBe(true);

            this.controller.rangeClassMappingId = 'test';
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            expect(this.controller.disableSet()).toBe(true);

            ontologyManagerSvc.isDeprecated.and.returnValue(false);
            expect(this.controller.disableSet()).toBe(false);
        });
        it('should set the range class mapping of the selected property', function() {
            var classId = 'class';
            var rangeClassMappingId = 'rangeClassMapping';
            var classMapping = {'@id': classId};
            mapperStateSvc.availableClasses = [{classObj: {'@id': classId}}];
            utilSvc.getPropertyId.and.callFake((obj, prop) => {
                switch (prop) {
                    case prefixes.rdfs + 'range':
                        return classId;
                        break;
                    case prefixes.delim + 'classMapping':
                        return rangeClassMappingId;
                        break;
                    default:
                        return '';
                        break;
                }
            });
            mappingManagerSvc.getClassMappingsByClassId.and.returnValue([classMapping]);
            ontologyManagerSvc.getEntityName.and.returnValue('Class');
            var expectedNewItem = {
                '@id': 'new',
                [prefixes.dcterms + 'title']: [{'@value': '[New Class]'}]
            };
            this.controller.selectedProp = {propObj: {id : 'propObj'}};
            this.controller.selectedPropMapping = {};
            this.controller.setRangeClass();
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.controller.selectedProp.propObj, prefixes.rdfs + 'range');
            expect(this.controller.rangeClass).toEqual({classObj: {'@id': classId}});
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(this.controller.rangeClass.classObj);
            expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, classId);
            expect(this.controller.classMappings).toEqual([expectedNewItem, classMapping]);
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.controller.selectedPropMapping, prefixes.delim + 'classMapping');
            expect(this.controller.rangeClassMappingId).toEqual(rangeClassMappingId);
        });
        describe('should update the range of the selected property', function() {
            beforeEach(function() {
                spyOn(this.controller, 'setRangeClass');
                this.controller.rangeClass = {};
                this.controller.rangeClassMappingId = 'test';
                this.controller.classMappings = [{}];
            });
            it('if it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.controller.updateRange();
                expect(this.controller.selectedColumn).toBe('');
                expect(this.controller.setRangeClass).toHaveBeenCalled();
                expect(this.controller.rangeClassMappingId).toEqual('test');
                expect(this.controller.rangeClass).toEqual({});
                expect(this.controller.classMappings).toEqual([{}]);
            });
            it('if it is a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                this.controller.updateRange();
                expect(this.controller.selectedColumn).toBe('');
                expect(this.controller.setRangeClass).not.toHaveBeenCalled();
                expect(this.controller.rangeClassMappingId).toEqual('');
                expect(this.controller.rangeClass).toBeUndefined();
                expect(this.controller.classMappings).toEqual([]);
            });
        });
        it('should check if the datatype is a lang string', function() {
            this.controller.datatype = 'notLangString';
            expect(this.controller.isLangString()).toBe(false);
            this.controller.datatype = prefixes.rdf + 'langString';
            expect(this.controller.isLangString()).toBe(true);
        });
        it('should clear the datatype', function() {
            this.controller.showDatatypeSelect = true;
            this.controller.datatype = 'datatype';
            this.controller.clearDatatype();
            expect(this.controller.showDatatypeSelect).toBe(false);
            expect(this.controller.datatype).toBe(undefined);
        });
        describe('should set the value of the property mapping', function() {
            beforeEach(function() {
                this.controller.selectedProp = {ontologyId: 'propOntology', propObj: {'@id': 'prop'}};
                this.controller.selectedColumn = '0';
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
                        mapperStateSvc.addClassMapping.and.returnValue(this.classMapping);
                        mapperStateSvc.addObjectMapping.and.returnValue(this.propMapping);
                    });
                    it('and a class mapping was selected', function() {
                        mapperStateSvc.mapping.jsonld = [this.classMapping];
                        this.controller.rangeClassMappingId = this.classMapping['@id'];
                        this.controller.set();
                        expect(mapperStateSvc.addClassMapping).not.toHaveBeenCalled();
                        expect(mapperStateSvc.addObjectMapping).toHaveBeenCalledWith(this.controller.selectedProp, mapperStateSvc.selectedClassMappingId, this.classMapping['@id']);
                        expect(mapperStateSvc.addDataMapping).not.toHaveBeenCalled();
                        expect(mapperStateSvc.setProps).not.toHaveBeenCalled();
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('and a new class mapping should be created', function() {
                        this.controller.rangeClassMappingId = 'new';
                        this.controller.rangeClass = {ontologyId: 'classOntology', classObj: {'@id': 'range'}};
                        this.controller.set();
                        expect(mapperStateSvc.addClassMapping).toHaveBeenCalledWith(this.controller.rangeClass);
                        expect(mapperStateSvc.addObjectMapping).toHaveBeenCalledWith(this.controller.selectedProp, mapperStateSvc.selectedClassMappingId, this.classMapping['@id']);
                        expect(mapperStateSvc.addDataMapping).not.toHaveBeenCalled();
                        expect(mapperStateSvc.setProps).toHaveBeenCalledWith('range');
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                    });
                });
                describe('for a data property', function() {
                    beforeEach(function() {
                        ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                        mapperStateSvc.addDataMapping.and.returnValue(this.propMapping);
                    });
                    it('with no datatype override', function() {
                        this.controller.set();
                        expect(mapperStateSvc.addClassMapping).not.toHaveBeenCalled();
                        expect(mapperStateSvc.addObjectMapping).not.toHaveBeenCalled();
                        expect(mapperStateSvc.addDataMapping).toHaveBeenCalledWith(this.controller.selectedProp, mapperStateSvc.selectedClassMappingId, this.controller.selectedColumn, undefined, undefined);
                        expect(mapperStateSvc.newProp).toBe(false);
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                    });
                    describe('with a datatype override set', function() {

                        it('that is not a lang string', function() {
                            this.controller.datatype = prefixes.xsd + 'double';
                            this.controller.set();
                            expect(mapperStateSvc.addClassMapping).not.toHaveBeenCalled();
                            expect(mapperStateSvc.addObjectMapping).not.toHaveBeenCalled();
                            expect(mapperStateSvc.addDataMapping).toHaveBeenCalledWith(this.controller.selectedProp, mapperStateSvc.selectedClassMappingId, this.controller.selectedColumn, 'xsd:double', undefined);
                            expect(mapperStateSvc.newProp).toBe(false);
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(scope.close).toHaveBeenCalled();
                        });
                        it('that is a lang string', function() {
                            this.controller.datatype = prefixes.rdf + 'langString';
                            this.controller.language = 'en';
                            this.controller.set();
                            expect(mapperStateSvc.addClassMapping).not.toHaveBeenCalled();
                            expect(mapperStateSvc.addObjectMapping).not.toHaveBeenCalled();
                            expect(mapperStateSvc.addDataMapping).toHaveBeenCalledWith(this.controller.selectedProp, mapperStateSvc.selectedClassMappingId, this.controller.selectedColumn, 'rdf:langString', 'en');
                            expect(mapperStateSvc.newProp).toBe(false);
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(scope.close).toHaveBeenCalled();
                        });
                    });

                });
            });
            describe('if a property mapping is being edited', function() {
                beforeEach(function() {
                    this.controller.selectedPropMapping = {'@id': 'prop'};
                    mapperStateSvc.selectedPropMappingId = this.controller.selectedPropMapping['@id'];
                    mapperStateSvc.newProp = false;
                    this.classMappingId = mapperStateSvc.selectedClassMappingId;
                });
                describe('and it is for an object property', function() {
                    beforeEach(function() {
                        this.classMapping = {'@id': 'classMapping'};
                        mapperStateSvc.addClassMapping.and.returnValue(this.classMapping);
                        mappingManagerSvc.isDataMapping.and.returnValue(false);
                        utilSvc.getPropertyId.and.returnValue('original');
                        this.controller.selectedPropMapping[prefixes.delim + 'classMapping'] = [{'@id': 'original'}];
                    });
                    it('and a class mapping was selected', function() {
                        this.controller.rangeClassMappingId = this.classMapping['@id'];
                        mapperStateSvc.mapping.jsonld = [this.classMapping];
                        this.controller.set();
                        expect(mapperStateSvc.addClassMapping).not.toHaveBeenCalled();
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.controller.selectedPropMapping, prefixes.delim + 'classMapping');
                        expect(this.controller.selectedPropMapping[prefixes.delim + 'classMapping']).toEqual([{'@id': this.classMapping['@id']}]);
                        expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, prefixes.delim + 'classMapping', this.classMapping['@id'], 'original');
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('and a new class mapping should be created', function() {
                        this.controller.rangeClassMappingId = 'new';
                        this.controller.rangeClass = {ontologyId: 'classOntology', classObj: {'@id': 'range'}};
                        this.controller.set();
                        expect(mapperStateSvc.addClassMapping).toHaveBeenCalledWith(this.controller.rangeClass);
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.controller.selectedPropMapping, prefixes.delim + 'classMapping');
                        expect(this.controller.selectedPropMapping[prefixes.delim + 'classMapping']).toEqual([{'@id': this.classMapping['@id']}]);
                        expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, prefixes.delim + 'classMapping', this.classMapping['@id'], 'original');
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                        expect(scope.close).toHaveBeenCalled();
                    });
                });
                describe('and it is for a data property', function() {
                    it('with the column index updated', function() {
                        this.controller.selectedColumn = '0';
                        mapperStateSvc.invalidProps = [{'@id': this.controller.selectedProp.propObj['@id']}];
                        mappingManagerSvc.isDataMapping.and.returnValue(true);
                        utilSvc.getPropertyValue.and.returnValue('10');
                        this.controller.selectedPropMapping[prefixes.delim + 'columnIndex'] = [{'@value': '10'}]
                        this.controller.set();
                        expect(utilSvc.getPropertyValue).toHaveBeenCalledWith(this.controller.selectedPropMapping, prefixes.delim + 'columnIndex');
                        expect(this.controller.selectedPropMapping[prefixes.delim + 'columnIndex']).toEqual([{'@value': '0'}]);
                        expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, prefixes.delim + 'columnIndex', this.controller.selectedColumn, '10');
                        expect(mapperStateSvc.invalidProps).not.toContain({'@id': this.controller.selectedProp.propObj['@id']});
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('with the datatypeSpec updated', function() {
                        this.controller.selectedPropMapping[prefixes.delim + 'columnIndex'] = [{'@value': '10'}]
                        this.controller.datatype = prefixes.xsd + 'double';
                        mapperStateSvc.invalidProps = [{'@id': this.controller.selectedProp.propObj['@id']}];
                        mappingManagerSvc.isDataMapping.and.returnValue(true);
                        utilSvc.getPropertyId.and.returnValue('string');
                        this.controller.selectedPropMapping[prefixes.delim + 'datatypeSpec'] = [{'@id': 'string'}]
                        this.controller.set();
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.controller.selectedPropMapping, prefixes.delim + 'datatypeSpec');
                        expect(this.controller.selectedPropMapping[prefixes.delim + 'datatypeSpec']).toEqual([{'@id': prefixes.xsd + 'double'}]);
                        expect(mapperStateSvc.changeProp).toHaveBeenCalledWith(mapperStateSvc.selectedPropMappingId, prefixes.delim + 'datatypeSpec', this.controller.datatype, 'string', true);
                        expect(mapperStateSvc.invalidProps).not.toContain({'@id': this.controller.selectedProp.propObj['@id']});
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMappingId);
                        expect(scope.close).toHaveBeenCalled();
                    });
                });
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(mapperStateSvc.newProp).toBe(false);
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('PROP-MAPPING-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a prop select', function() {
            expect(this.element.find('prop-select').length).toBe(1);
        });
        it('depending on whether a new property mapping is being created', function() {
            var title = this.element.find('h3');
            expect(title.text()).toContain('Add');

            mapperStateSvc.newProp = false;
            scope.$digest();
            expect(title.text()).toContain('Edit');
        });
        describe('depending on whether the selected property is', function() {
            beforeEach(function() {
                this.controller.selectedProp = {propObj: {}};
            });
            describe('a data or annotation property', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                });
                it('not expanded', function() {
                    this.controller.showDatatypeSelect = false;
                    scope.$digest();
                    expect(this.element.querySelectorAll('.column-select-container').length).toBe(1);
                    expect(this.element.find('column-select').length).toBe(1);
                    expect(this.element.querySelectorAll('.datatype-select-container').length).toBe(1);
                    expect(this.element.querySelectorAll('.datatype-select-container a').length).toBe(1);
                    expect(this.element.find('iri-select').length).toBe(0);
                });
                describe('expanded', function() {
                    beforeEach(function() {
                        this.controller.showDatatypeSelect = true;
                    });
                    it('and is not a lang string', function () {
                        scope.$digest();
                        expect(this.element.querySelectorAll('.column-select-container').length).toBe(1);
                        expect(this.element.find('column-select').length).toBe(1);
                        expect(this.element.querySelectorAll('.datatype-select-container').length).toBe(1);
                        expect(this.element.querySelectorAll('.datatype-select-container a').length).toBe(1);
                        expect(this.element.find('iri-select').length).toBe(1);
                        expect(this.element.querySelectorAll('.language-select-container').length).toBe(0);
                        expect(this.element.find('language-select').length).toBe(0);
                    });
                    it('and is a lang string', function () {
                        this.controller.datatype = prefixes.rdf + 'langString';
                        scope.$digest();
                        expect(this.element.querySelectorAll('.column-select-container').length).toBe(1);
                        expect(this.element.find('column-select').length).toBe(1);
                        expect(this.element.querySelectorAll('.datatype-select-container').length).toBe(1);
                        expect(this.element.querySelectorAll('.datatype-select-container a').length).toBe(1);
                        expect(this.element.find('iri-select').length).toBe(1);
                        expect(this.element.querySelectorAll('.language-select-container').length).toBe(1);
                        expect(this.element.find('language-select').length).toBe(1);
                    });
                });
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
            var classSelect = angular.element(this.element.querySelectorAll('.range-class-select-container ui-select')[0]);
            expect(classSelect.attr('disabled')).toBeFalsy();

            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            scope.$digest();
            expect(classSelect.attr('disabled')).toBeTruthy();
        });
        it('depending on the validity of the form', function() {
            spyOn(this.controller, 'disableSet').and.returnValue(true);
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.disableSet.and.returnValue(false);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and submit the property mapping value', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call set when the button is clicked', function() {
        spyOn(this.controller, 'set');
        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
