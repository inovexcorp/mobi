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
describe('Create Property Overlay directive', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc, prefixes, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('createPropertyOverlay');
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectCamelCaseFilter();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.iri = 'iri#';
        this.asymmetricProperty = prefixes.owl + 'AsymmetricProperty';
        this.functionalProperty = prefixes.owl + 'FunctionalProperty';

        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);
        this.element = $compile(angular.element('<create-property-overlay></create-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createPropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontoUtils = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toBe(this.iri);
        expect(this.controller.property['@id']).toBe(this.controller.prefix);
        expect(this.controller.property[prefixes.dcterms + 'title']).toEqual([{'@value': ''}]);
        expect(this.controller.property[prefixes.dcterms + 'description']).toEqual([{'@value': ''}]);
        expect(this.controller.characteristics).toEqual([
            {
                checked: false,
                typeIRI: prefixes.owl + 'FunctionalProperty',
                displayText: 'Functional Property',
                objectOnly: false
            },
            {
                checked: false,
                typeIRI: prefixes.owl + 'AsymmetricProperty',
                displayText: 'Asymmetric Property',
                objectOnly: true
            }
        ]);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('create-property-overlay')).toBe(true);
            expect(this.element.hasClass('scrollable-overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a .content-wrapper', function() {
            expect(this.element.querySelectorAll('.content-wrapper').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(this.element.find('static-iri').length).toBe(1);
        });
        it('with radio-buttons', function() {
            expect(this.element.find('radio-button').length).toBe(3);
        });
        describe('with checkboxes', function() {
            it('unless nothing is selected or type if AnnotationProperty', function() {
                expect(this.element.find('checkbox').length).toBe(0);
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                scope.$apply();
                expect(this.element.find('checkbox').length).toBe(0);
            });
            describe('if type is', function() {
                it('ObjectProperty', function() {
                    ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                    scope.$apply();
                    expect(this.element.find('checkbox').length).toBe(2);
                });
                it('DataProperty', function() {
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                    scope.$apply();
                    expect(this.element.find('checkbox').length).toBe(1);
                });
            });
        });
        it('with checkboxes', function() {
            expect(this.element.find('checkbox').length).toBe(0);
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$apply();
            expect(this.element.find('checkbox').length).toBe(2);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('with a iri-select for domain', function() {
            expect(this.element.querySelectorAll('iri-select[display-text="\'Domain\'"]').length).toBe(0);
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$apply();
            expect(this.element.querySelectorAll('iri-select[display-text="\'Domain\'"]').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(this.element.find('advanced-language-select').length).toBe(1);
        });
        it('with custom buttons to create and cancel', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the form validity', function() {
            this.controller.property['@type'] = ['test'];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.property[prefixes.dcterms + 'title'][0]['@value'] = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the length of the type array', function() {
            this.controller.property[prefixes.dcterms + 'title'][0]['@value'] = 'test';
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.property['@type'] = ['test'];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the property is a datatype property', function() {
            expect(this.element.querySelectorAll('iri-select.range-datatype').length).toBe(0);

            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('iri-select.range-datatype').length).toBe(1);
        });
        it('depending on whether the property is a object property', function() {
            expect(this.element.querySelectorAll('iri-select.range-object').length).toBe(0);

            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('iri-select.range-object').length).toBe(1);
        });
        it('depending on whether the property IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();
            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        describe('nameChanged', function() {
            beforeEach(function() {
                this.controller.property = {};
                this.controller.property[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                this.controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.property['@id']).toEqual(this.controller.prefix + this.controller.property[prefixes.dcterms + 'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                this.controller.iriHasChanged = true;
                this.controller.property['@id'] = 'iri';
                this.controller.nameChanged();
                expect(this.controller.property['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.property['@id']).toBe('begin' + 'then' + 'end');
            expect(this.controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions', function() {
            beforeEach(function() {
                ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
                this.controller.property['@id'] = 'property-iri';
                this.controller.property['@type'] = [];
                this.controller.property[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
            });
            it('and sets the domains and ranges', function() {
                this.controller.domains = ['domain'];
                this.controller.ranges = ['range'];
                this.controller.create();
                expect(_.has(this.controller.property, prefixes.dcterms + 'description')).toBe(false);
                expect(this.controller.property[prefixes.rdfs + 'domain']).toEqual([{'@id': 'domain'}]);
                expect(this.controller.property[prefixes.rdfs + 'range']).toEqual([{'@id': 'range'}]);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            describe('if the property is a object property and controller.values', function() {
                beforeEach(function() {
                    this.controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                    ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                });
                it('is empty', function() {
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                    expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                    expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                    expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(ontologyStateSvc.listItem.objectProperties.iris).toEqual(_.set({}, "['" + this.controller.property['@id'] + "']", ontologyStateSvc.listItem.ontologyId));
                    expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.listItem.dataProperties.iris).toEqual({});
                    expect(ontologyStateSvc.listItem.dataProperties.hierarchy).toEqual([]);
                    expect(ontologyStateSvc.listItem.annotations.iris).toEqual({});
                    expect(ontologyStateSvc.listItem.objectProperties.hierarchy).toContain({entityIRI: this.controller.property['@id']});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                describe('has values', function() {
                    beforeEach(function() {
                        this.controller.values = [{'@id': 'propertyA'}];
                    });
                    it('with a derived semantic relation', function() {
                        ontoUtils.containsDerivedSemanticRelation.and.returnValue(true);
                        this.controller.create();
                        expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                        expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                        expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                        expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                        expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                        expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                        expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                        expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                        expect(ontologyStateSvc.listItem.objectProperties.iris).toEqual(_.set({}, "['" + this.controller.property['@id'] + "']", ontologyStateSvc.listItem.ontologyId));
                        expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                        expect(ontologyStateSvc.listItem.dataProperties.iris).toEqual({});
                        expect(ontologyStateSvc.listItem.dataProperties.hierarchy).toEqual([]);
                        expect(ontologyStateSvc.listItem.annotations.iris).toEqual({});
                        expect(this.controller.property[prefixes.rdfs + 'subPropertyOf']).toEqual([{'@id': 'propertyA'}]);
                        expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith('property-iri', ['propertyA'], 'objectProperties');
                        expect(ontologyStateSvc.listItem.derivedSemanticRelations).toContain(this.controller.property['@id']);
                    });
                    it('without a derived semantic relation', function() {
                        this.controller.create();
                        expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                        expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                        expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                        expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                        expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                        expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                        expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                        expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                        expect(ontologyStateSvc.listItem.objectProperties.iris).toEqual(_.set({}, "['" + this.controller.property['@id'] + "']", ontologyStateSvc.listItem.ontologyId));
                        expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                        expect(ontologyStateSvc.listItem.dataProperties.iris).toEqual({});
                        expect(ontologyStateSvc.listItem.dataProperties.hierarchy).toEqual([]);
                        expect(ontologyStateSvc.listItem.annotations.iris).toEqual({});
                        expect(this.controller.property[prefixes.rdfs + 'subPropertyOf']).toEqual([{'@id': 'propertyA'}]);
                        expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith('property-iri', ['propertyA'], 'objectProperties');
                        expect(ontologyStateSvc.listItem.derivedSemanticRelations).toEqual([]);
                    });
                });
            });
            describe('if the property is a datatype property and controller.values', function() {
                beforeEach(function() {
                    this.controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                });
                it('is empty', function() {
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                    expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                    expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                    expect(ontologyStateSvc.listItem.objectProperties.iris).toEqual({});
                    expect(ontologyStateSvc.listItem.objectProperties.hierarchy).toEqual([]);
                    expect(ontologyStateSvc.listItem.annotations.iris).toEqual({});
                    expect(ontologyStateSvc.listItem.dataProperties.iris).toEqual(_.set({}, "['" + this.controller.property['@id'] + "']", ontologyStateSvc.listItem.ontologyId));
                    expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                    expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(ontologyStateSvc.listItem.dataProperties.hierarchy).toContain({entityIRI: this.controller.property['@id']});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                it('has values', function() {
                    this.controller.values = [{'@id': 'propertyA'}];
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                    expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                    expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                    expect(ontologyStateSvc.listItem.objectProperties.iris).toEqual({});
                    expect(ontologyStateSvc.listItem.objectProperties.hierarchy).toEqual([]);
                    expect(ontologyStateSvc.listItem.annotations.iris).toEqual({});
                    expect(ontologyStateSvc.listItem.dataProperties.iris).toEqual(_.set({}, "['" + this.controller.property['@id'] + "']", ontologyStateSvc.listItem.ontologyId));
                    expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                    expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(this.controller.property[prefixes.rdfs + 'subPropertyOf']).toEqual([{'@id': 'propertyA'}]);
                    expect(ontoUtils.setSuperProperties).toHaveBeenCalledWith('property-iri', ['propertyA'], 'dataProperties');
                });
            });
            it('if the property is an annotation property', function() {
                this.controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                this.controller.create();
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.controller.property);
                expect(ontologyStateSvc.listItem.objectProperties.iris).toEqual({});
                expect(ontologyStateSvc.listItem.objectProperties.hierarchy).toEqual([]);
                expect(ontologyStateSvc.listItem.dataProperties.iris).toEqual({});
                expect(ontologyStateSvc.listItem.dataProperties.hierarchy).toEqual([]);
                expect(ontologyStateSvc.listItem.annotations.iris).toEqual(_.set({}, "['" + this.controller.property['@id'] + "']", ontologyStateSvc.listItem.ontologyId));
                expect(ontologyStateSvc.listItem.annotations.hierarchy).toContain({entityIRI: this.controller.property['@id']});
                expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.property['@id']);
                expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            describe('if characteristics', function() {
                it('are set', function() {
                    _.forEach(this.controller.characteristics, function(obj) {
                        obj.checked = true;
                    });
                    this.controller.create();
                    expect(_.includes(this.controller.property['@type'], this.functionalProperty)).toBe(true);
                    expect(_.includes(this.controller.property['@type'], this.asymmetricProperty)).toBe(true);
                });
                it('are not set', function() {
                    this.controller.create();
                    expect(_.includes(this.controller.property['@type'], this.functionalProperty)).toBe(false);
                    expect(_.includes(this.controller.property['@type'], this.asymmetricProperty)).toBe(false);
                });
            });
        });
        describe('getKey should return the correct value when isDataTypeProperty returns', function() {
            it('true', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                expect(this.controller.getKey()).toBe('dataProperties');
            });
            it('false', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                expect(this.controller.getKey()).toBe('objectProperties');
            });
        });
        describe('typeChange should reset the correct variables', function() {
            beforeEach(function() {
                this.controller.domains = ['domain'];
                this.controller.ranges = ['range'];
                this.controller.values = [{prop: 'value'}];
                _.forEach(this.controller.characteristics, function(obj) {
                    obj.checked = true;
                });
            });
            it('if the property is an AnnotationProperty', function() {
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                this.controller.typeChange();
                expect(this.controller.values).toEqual([]);
                _.forEach(this.controller.characteristics, function(obj) {
                    expect(obj.checked).toBe(false);
                });
                expect(this.controller.domains).toEqual([]);
                expect(this.controller.ranges).toEqual([]);
            });
            it('if the property is a DatatypeProperty', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                this.controller.typeChange();
                expect(this.controller.values).toEqual([]);
                _.forEach(_.filter(this.controller.characteristics, 'objectOnly'), function(obj) {
                    expect(obj.checked).toBe(false);
                });
                expect(this.controller.domains).toEqual(['domain']);
                expect(this.controller.ranges).toEqual([]);
            });
            it('if the property is an ObjectProperty', function() {
                this.controller.typeChange();
                expect(this.controller.values).toEqual([]);
                _.forEach(this.controller.characteristics, function(obj) {
                    expect(obj.checked).toBe(true);
                });
                expect(this.controller.domains).toEqual(['domain']);
                expect(this.controller.ranges).toEqual([]);
            });
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
    });
});
