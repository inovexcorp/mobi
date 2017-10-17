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
describe('Create Individual Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, resObj, deferred, prefixes, splitIRIFilter, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('createIndividualOverlay');
        injectCamelCaseFilter();
        injectSplitIRIFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockOntologyState();
        mockResponseObj();
        mockPrefixes();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _prefixes_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            resObj = _responseObj_;
            splitIRIFilter = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });
    });

    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            ontologyStateSvc.getDefaultPrefix.and.returnValue('begin/');
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createIndividualOverlay');
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe('begin/');
            expect(controller.individual['@id']).toBe(controller.prefix);
            expect(controller.individual['@type']).toEqual([]);
        });
        it('if parent ontology is not opened', function() {
            ontologyStateSvc.getDefaultPrefix.and.returnValue('iri#');
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createIndividualOverlay');
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe('iri#');
            expect(controller.individual['@id']).toBe(controller.prefix);
            expect(controller.individual['@type']).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-individual-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
        it('with an input for the individual name', function() {
            expect(element.querySelectorAll('input[name="name"]').length).toBe(1);
        });
        it('with custom buttons to create and cancel', function() {
            var buttons = element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text().trim()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text().trim()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller = element.controller('createIndividualOverlay');
            controller.error = 'error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on the form validity', function() {
            controller = element.controller('createIndividualOverlay');
            controller.individual['@type'] = ['ClassA'];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.name = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the length of the type array', function() {
            controller = element.controller('createIndividualOverlay');
            controller.name = 'test';
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.individual['@type'] = ['ClassA'];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the individual IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            
            scope.$digest();
            
            var disabled = element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text().trim()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('createIndividualOverlay');
        });
        describe('should update the individual id', function() {
            beforeEach(function() {
                controller.name = 'name';
                this.id = controller.individual['@id'];
            });
            it('unless the IRI has not changed', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.individual['@id']).toBe(controller.prefix + controller.name);
            });
            it('if the IRI has changed', function() {
                controller.iriHasChanged = true;
                controller.nameChanged();
                expect(controller.individual['@id']).toBe(this.id);
            });
        });
        it('should change the individual IRI based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.iriHasChanged).toBe(true);
            expect(controller.individual['@id']).toBe('begin' + 'then' + 'end');
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('should get an ontology IRI', function() {
            it('if the item has an id set', function() {
                expect(controller.getItemOntologyIri({ontologyId: 'ontology'})).toBe('ontology');
            });
            it('if the item does not have an id set', function() {
                expect(controller.getItemOntologyIri({})).toBe(ontologyStateSvc.listItem.ontologyId);
            });
        });
        it('should create an individual', function() {
            var split = {begin: 'begin', then: 'then', end: 'end'};
            ontologyStateSvc.listItem = {
                ontologyRecord: {},
                ontology: [{}],
                individuals: [],
                classesWithIndividuals: [],
                individualsParentPath: [],
                classesAndIndividuals: {},
                classHierarchy: [],
                classIndex: {}
            };
            ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
            ontologyStateSvc.getPathsTo.and.returnValue([['ClassA']]);
            splitIRIFilter.and.returnValue(split);
            controller.individual = {'@id': 'id', '@type': ['ClassA']};
            controller.create();
            expect(ontologyStateSvc.listItem.individuals).toContain({namespace: split.begin + split.then, localName: split.end});
            expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
            expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['id']});
            expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA']);
            expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith([],{},'ClassA');
            expect(controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
            expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.individual);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, controller.individual);
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.individual['@id'], false);
            expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.flatIndividualsHierarchy).toEqual([{prop: 'individual'}]);
        });
    });
    it('should call create when the button is clicked', function() {
        element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createIndividualOverlay');
        spyOn(controller, 'create');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
        scope.$digest();

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(false);
    });
});
