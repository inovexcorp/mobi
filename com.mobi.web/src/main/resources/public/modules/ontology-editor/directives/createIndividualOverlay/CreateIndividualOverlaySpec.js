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
    var $compile, scope, ontologyStateSvc, resObj, prefixes, splitIRI, ontoUtils;

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

        this.iri = 'iri#'
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);
        this.element = $compile(angular.element('<create-individual-overlay></create-individual-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createIndividualOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        resObj = null;
        prefixes = null;
        splitIRI = null;
        ontoUtils = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toBe(this.iri);
        expect(this.controller.individual['@id']).toBe(this.controller.prefix);
        expect(this.controller.individual['@type']).toEqual([]);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('create-individual-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(this.element.find('static-iri').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with an input for the individual name', function() {
            expect(this.element.querySelectorAll('input[name="name"]').length).toBe(1);
        });
        it('with custom buttons to create and cancel', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[0]).text().trim()) >= 0).toBe(true);
            expect(['Cancel', 'Create'].indexOf(angular.element(buttons[1]).text().trim()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the form validity', function() {
            this.controller.individual['@type'] = ['ClassA'];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.name = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the length of the type array', function() {
            this.controller.name = 'test';
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.individual['@type'] = ['ClassA'];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the individual IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text().trim()).toBe('Create');
        });
    });
    describe('controller methods', function() {
        describe('should update the individual id', function() {
            beforeEach(function() {
                this.controller.name = 'name';
                this.id = this.controller.individual['@id'];
            });
            it('unless the IRI has not changed', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.individual['@id']).toBe(this.controller.prefix + this.controller.name);
            });
            it('if the IRI has changed', function() {
                this.controller.iriHasChanged = true;
                this.controller.nameChanged();
                expect(this.controller.individual['@id']).toBe(this.id);
            });
        });
        it('should change the individual IRI based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.iriHasChanged).toBe(true);
            expect(this.controller.individual['@id']).toBe('begin' + 'then' + 'end');
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('should get an ontology IRI', function() {
            it('if the item has an id set', function() {
                expect(this.controller.getItemOntologyIri({ontologyId: 'ontology'})).toBe('ontology');
            });
            it('if the item does not have an id set', function() {
                expect(this.controller.getItemOntologyIri({})).toBe(ontologyStateSvc.listItem.ontologyId);
            });
        });
        describe('should create an individual', function() {
            beforeEach(function() {
                this.split = {begin: 'begin', then: 'then', end: 'end'};
                ontologyStateSvc.listItem = {
                    ontologyRecord: {},
                    ontology: [{}],
                    individuals: { iris: [] },
                    classesWithIndividuals: [],
                    individualsParentPath: [],
                    classesAndIndividuals: {},
                    classes: {
                        hierarchy: [],
                        index: {}
                    },
                    concepts: {
                        hierarchy: [],
                        flat: []
                    }
                };
                ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
                ontologyStateSvc.getPathsTo.and.returnValue([['ClassA']]);
                splitIRIFilter.and.returnValue(this.split);
                this.controller.individual = {'@id': 'id', '@type': ['ClassA']};
                ontologyStateSvc.flattenHierarchy.and.returnValue(['ClassA']);
            });
            it('if it is a derived concept', function() {
                ontologyStateSvc.listItem.derivedConcepts = ['ClassA'];
                this.controller.create();
                expect(ontologyStateSvc.listItem.individuals.iris).toContain({namespace: this.split.begin + this.split.then, localName: this.split.end});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['id']});
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA']);
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith([],{},'ClassA');
                expect(this.controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.individual);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.individual);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.individual['@id'], false);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual([{entityIRI: 'id'}]);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual(['ClassA']);
                expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
            });
            it('if it is a concept', function() {
                this.controller.individual['@type'].push(prefixes.skos + 'Concept');
                this.controller.create();
                expect(ontologyStateSvc.listItem.individuals.iris).toContain({namespace: this.split.begin + this.split.then, localName: this.split.end});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA', prefixes.skos + 'Concept']);
                var expectedClassesAndIndividuals = {ClassA: ['id']};
                expectedClassesAndIndividuals[prefixes.skos + 'Concept'] = ['id']
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual(expectedClassesAndIndividuals);
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA']);
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith([],{},'ClassA');
                expect(this.controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.individual);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.individual);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.individual['@id'], false);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual([{entityIRI: 'id'}]);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual(['ClassA']);
                expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
            });
            it('if it is not a derived concept or a concept', function() {
                this.controller.create();
                expect(ontologyStateSvc.listItem.individuals.iris).toContain({namespace: this.split.begin + this.split.then, localName: this.split.end});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['id']});
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA']);
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith([],{},'ClassA');
                expect(this.controller.individual['@type']).toContain(prefixes.owl + 'NamedIndividual');
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.individual);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.individual);
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(this.controller.individual['@id'], false);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual([]);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
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
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateIndividualOverlay).toBe(false);
    });
});
