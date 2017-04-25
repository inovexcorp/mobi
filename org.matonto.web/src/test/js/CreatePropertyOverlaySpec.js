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
describe('Create Property Overlay directive', function() {
    var $compile, scope, element, controller, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRIFilter, functionalProperty, ontoUtils;
    var iri = 'iri#';

    beforeEach(function() {
        module('templates');
        module('createPropertyOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        injectSplitIRIFilter();
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontologyStateSvc.getDefaultPrefix.and.returnValue(iri);
        element = $compile(angular.element('<create-property-overlay></create-property-overlay>'))(scope);
        scope.$digest();
        functionalProperty = prefixes.owl + 'FunctionalProperty';
        controller = element.controller('createPropertyOverlay');
    });

    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.property['@id']).toBe(controller.prefix);
        });
        it('if parent ontology is not opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.property['@id']).toBe(controller.prefix);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-property-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('with radio-buttons', function() {
            expect(element.find('radio-button').length).toBe(3);
        });
        it('with a checkbox', function() {
            expect(element.find('checkbox').length).toBe(0);
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$apply();
            expect(element.find('checkbox').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a object-select for domain', function() {
            expect(element.querySelectorAll('object-select[display-text="\'Domain\'"]').length).toBe(0);
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$apply();
            expect(element.querySelectorAll('object-select[display-text="\'Domain\'"]').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(element.find('advanced-language-select').length).toBe(1);
        });
        it('with custom buttons to create and cancel', function() {
            var buttons = element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller = element.controller('createPropertyOverlay');
            controller.error = 'error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on the form validity', function() {
            controller = element.controller('createPropertyOverlay');
            controller.property['@type'] = ['test'];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.property[prefixes.dcterms + 'title'][0]['@value'] = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the length of the type array', function() {
            controller = element.controller('createPropertyOverlay');
            controller.property[prefixes.dcterms + 'title'][0]['@value'] = 'test';
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.property['@type'] = ['test'];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the property is a datatype property', function() {
            expect(element.querySelectorAll('object-select.range-datatype').length).toBe(0);

            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            scope.$digest();
            expect(element.querySelectorAll('object-select.range-datatype').length).toBe(1);
        });
        it('depending on whether the property is a object property', function() {
            expect(element.querySelectorAll('object-select.range-object').length).toBe(0);

            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(element.querySelectorAll('object-select.range-object').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.property = {};
                controller.property[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.property['@id']).toEqual(controller.prefix + controller.property[prefixes.dcterms +
                    'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.property['@id'] = 'iri';
                controller.nameChanged();
                expect(controller.property['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.property['@id']).toBe('begin' + 'then' + 'end');
            expect(controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions', function() {
            beforeEach(function() {
                this.listItem = {
                    subObjectProperties: [],
                    objectPropertyHierarchy: [],
                    subDataProperties: [],
                    dataPropertyHierarchy: [],
                    ontology: [{}],
                    annotations: []
                };
                this.split = {begin: 'begin', then: 'then', end: 'end'};
                ontologyStateSvc.listItem = this.listItem;
                splitIRIFilter.and.returnValue(this.split);
                controller.property['@id'] = 'property-iri';
                controller.property['@type'] = [];
                controller.property[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
                controller.property[prefixes.rdfs + 'range'] = [];
                controller.property[prefixes.rdfs + 'domain'] = [];
            });
            it('and unsets the correct properties', function() {
                controller.create();
                expect(_.has(controller.property, prefixes.dcterms + 'description')).toBe(false);
                expect(_.has(controller.property, prefixes.rdfs + 'range')).toBe(false);
                expect(_.has(controller.property, prefixes.rdfs + 'domain')).toBe(false);
                expect(controller.property.matonto.originalIRI).toEqual(controller.property['@id']);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.property, controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.property);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(controller.property);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, controller.property);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.property['@id']);
                expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the property is a object property', function() {
                controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                controller.create();
                expect(controller.property.matonto.originalIRI).toEqual(controller.property['@id']);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.property, controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.property);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(controller.property);
                expect(this.listItem.subObjectProperties).toContain({namespace: this.split.begin + this.split.then, localName: this.split.end});
                expect(this.listItem.objectPropertyHierarchy).toContain({entityIRI: controller.property['@id']});
                expect(this.listItem.subDataProperties).toEqual([]);
                expect(this.listItem.dataPropertyHierarchy).toEqual([]);
                expect(this.listItem.annotations).toEqual([]);
                expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, true);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, controller.property);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyHierarchy, ontologyStateSvc.listItem.recordId);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.property['@id']);
                expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the property is a datatype property', function() {
                controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                controller.create();
                expect(controller.property.matonto.originalIRI).toEqual(controller.property['@id']);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.property, controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.property);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(controller.property);
                expect(this.listItem.subObjectProperties).toEqual([]);
                expect(this.listItem.objectPropertyHierarchy).toEqual([]);
                expect(this.listItem.annotations).toEqual([]);
                expect(this.listItem.subDataProperties).toContain({namespace: this.split.begin + this.split.then, localName: this.split.end});
                expect(this.listItem.dataPropertyHierarchy).toContain({entityIRI: controller.property['@id']});
                expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, true);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, controller.property);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataPropertyHierarchy, ontologyStateSvc.listItem.recordId);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.property['@id']);
                expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the property is an annotation property', function() {
                controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                controller.create();
                expect(controller.property.matonto.originalIRI).toEqual(controller.property['@id']);
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.property, controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.property);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(controller.property);
                expect(this.listItem.subObjectProperties).toEqual([]);
                expect(this.listItem.objectPropertyHierarchy).toEqual([]);
                expect(this.listItem.subDataProperties).toEqual([]);
                expect(this.listItem.dataPropertyHierarchy).toEqual([]);
                expect(this.listItem.annotations).toContain({namespace: this.split.begin + this.split.then, localName: this.split.end});
                expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, true);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, controller.property);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.property['@id']);
                expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if controller.checkbox is true', function() {
                controller.checkbox = true;
                controller.create();
                expect(_.includes(controller.property['@type'], functionalProperty)).toBe(true);
            });
            it('if controller.checkbox is false', function() {
                controller.checkbox = false;
                controller.create();
                expect(_.includes(controller.property['@type'], functionalProperty)).toBe(false);
            });
        });
    });
    it('should call create when the button is clicked', function() {
        controller = element.controller('createPropertyOverlay');
        spyOn(controller, 'create');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(false);
    });
});
