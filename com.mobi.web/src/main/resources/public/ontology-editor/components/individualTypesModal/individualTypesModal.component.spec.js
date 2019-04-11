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
describe('Individual Types Modal component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('ontologyClassSelect', 'ontologyClassSelect');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_
        });

        this.iri = 'id';
        ontologyStateSvc.listItem.selected = {'@id': this.iri, '@type': [prefixes.owl + 'NamedIndividual', 'type1', 'type2'], 'title': [{'@value': 'title'}]};
        ontologyStateSvc.listItem.classesAndIndividuals = {'type1': [this.iri], 'type2': [this.iri]};
        ontologyStateSvc.listItem.classesWithIndividuals = ['type1', 'type2'];
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<individual-types-modal close="close()" dismiss="dismiss()"></individual-types-modal>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('individualTypesModal');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        prefixes = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('INDIVIDUAL-TYPES-MODAL');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with an ontology-class-select', function() {
            expect(this.element.find('ontology-class-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text().trim()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text().trim()) >= 0).toBe(true);
        });
    });
    describe('controller methods', function() {
        it('should determine whether an IRI is owl:NamedIndividual', function() {
            expect(this.controller.isNamedIndividual('test')).toEqual(false);
            expect(this.controller.isNamedIndividual(prefixes.owl + 'NamedIndividual')).toEqual(true);
        });
        describe('should update the individual types', function() {
            beforeEach(function() {
                ontologyStateSvc.getIndividualsParentPath.and.returnValue(['type1']);
                ontologyStateSvc.createFlatIndividualTree.and.returnValue(['type1']);
                ontologyStateSvc.flattenHierarchy.and.returnValue([this.iri]);
                ontoUtils.containsDerivedConcept.and.callFake(arr => _.some(arr, iri => _.includes(iri, 'concept')));
                ontoUtils.containsDerivedConceptScheme.and.callFake(arr => _.some(arr, iri => _.includes(iri, 'scheme')));
            });
            it('if a type was added', function() {
                this.controller.types.push('new');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1', 'type2', 'new']);
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'type1': [this.iri], 'type2': [this.iri], 'new': [this.iri]});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['type1', 'type2', 'new']);
                expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['type1']);
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual(['type1']);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': this.iri, '@type': ['new']});
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            it('if a type was removed', function() {
                this.controller.types = [prefixes.owl + 'NamedIndividual', 'type1'];
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'type1': [this.iri]});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['type1']);
                expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['type1']);
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual(['type1']);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': this.iri, '@type': ['type2']});
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            it('if the individual is now a concept', function() {
                this.controller.types.push('concept');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1', 'type2', 'concept']);
                expect(ontoUtils.addConcept).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@id', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@type', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith('title', [{'@value': 'title'}]);
            });
            describe('if the individual is no longer a concept', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.selected['@type'] = [prefixes.owl + 'NamedIndividual', 'type1', 'concept']
                    this.controller.types = [prefixes.owl + 'NamedIndividual', 'type1'];
                    ontologyStateSvc.listItem.concepts.flat = [this.iri];
                    ontologyStateSvc.listItem.concepts.iris = {[this.iri]: ''};
                    ontologyStateSvc.listItem.conceptSchemes.flat = [this.iri];
                    ontologyStateSvc.flattenHierarchy.and.returnValue([]);
                });
                describe('and the individual is selected in the concepts page', function() {
                    beforeEach(function() {
                        ontologyStateSvc.listItem.editorTabStates.concepts = {
                            entityIRI: this.iri,
                            usages: {},
                        };
                    });
                    it('and the concepts page is active', function() {
                        ontologyStateSvc.getActiveKey.and.returnValue('concepts');
                        this.controller.submit();
                        expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                        expect(ontologyStateSvc.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts, this.iri);
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                        expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({});
                        expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                    });
                    it('and the concepts page is not active', function() {
                        this.controller.submit();
                        expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                        expect(ontologyStateSvc.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts, this.iri);
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                        expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({});
                        expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                    });
                });
                describe('and the individual is selected in the schemes page', function() {
                    beforeEach(function() {
                        ontologyStateSvc.listItem.editorTabStates.schemes = {
                            entityIRI: this.iri,
                            usages: {},
                        };
                    });
                    it('and the schemes page is active', function() {
                        ontologyStateSvc.getActiveKey.and.returnValue('schemes');
                        this.controller.submit();
                        expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                        expect(ontologyStateSvc.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts, this.iri);
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                        expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                    });
                    it('and the schemes page is not active', function() {
                        this.controller.submit();
                        expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                        expect(ontologyStateSvc.listItem.concepts.iris).toEqual({});
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts, this.iri);
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                        expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                    });
                });
                it('and is not selected elsewhere', function() {
                    this.controller.submit();
                    expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                    expect(ontologyStateSvc.listItem.concepts.iris).toEqual({});
                    expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts, this.iri);
                    expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                    expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                    expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                    expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                });
            });
            it('if the individual is now a concept scheme', function() {
                this.controller.types.push('scheme');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1', 'type2', 'scheme']);
                expect(ontoUtils.addConceptScheme).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@id', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@type', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith('title', [{'@value': 'title'}]);
            });
            describe('if the individual is no longer a scheme', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.selected['@type'] = [prefixes.owl + 'NamedIndividual', 'type1', 'scheme']
                    this.controller.types = [prefixes.owl + 'NamedIndividual', 'type1'];
                    ontologyStateSvc.listItem.conceptSchemes.flat = [this.iri];
                    ontologyStateSvc.listItem.concepts.iris = {[this.iri]: ''};
                    ontologyStateSvc.flattenHierarchy.and.returnValue([]);
                });
                describe('and the individual is selected in the schemes page', function() {
                    beforeEach(function() {
                        ontologyStateSvc.listItem.editorTabStates.schemes = {
                            entityIRI: this.iri,
                            usages: {},
                        };
                    });
                    it('and the schemes page is active', function() {
                        ontologyStateSvc.getActiveKey.and.returnValue('schemes');
                        this.controller.submit();
                        expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                        expect(ontologyStateSvc.listItem.conceptSchemes.iris).toEqual({});
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                    });
                    it('and the schemes page is not active', function() {
                        this.controller.submit();
                        expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                        expect(ontologyStateSvc.listItem.conceptSchemes.iris).toEqual({});
                        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                        expect(ontologyStateSvc.listItem.editorTabStates.schemes).toEqual({});
                        expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                    });
                });
                it('and the individual is not selected elsewhere', function() {
                    this.controller.submit();
                    expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1']);
                    expect(ontologyStateSvc.listItem.conceptSchemes.iris).toEqual({});
                    expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, this.iri);
                    expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                    expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                });
            });
            it('unless all types were removed except NamedIndividual', function() {
                this.controller.types = [prefixes.owl + 'NamedIndividual'];
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1', 'type2']);
                expect(this.controller.error).toBeTruthy();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('unless the individual is now both a scheme and a concept', function() {
                this.controller.types.push('scheme');
                this.controller.types.push('concept');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1', 'type2']);
                expect(this.controller.error).toBeTruthy();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('unless nothing changed', function() {
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([prefixes.owl + 'NamedIndividual', 'type1', 'type2']);
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(this.controller, 'submit');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.submit).toHaveBeenCalled();
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});