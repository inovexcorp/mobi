/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Individual Types Modal directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('individualTypesModal');
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
        ontologyStateSvc.listItem.selected = {'@id': this.iri, '@type': ['type'], 'title': [{'@value': 'title'}]};
        ontologyStateSvc.listItem.classesAndIndividuals = {'type': [this.iri]};
        ontologyStateSvc.listItem.classesWithIndividuals = ['type'];
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
                ontologyStateSvc.getIndividualsParentPath.and.returnValue(['type']);
                ontologyStateSvc.createFlatIndividualTree.and.returnValue(['type']);
                ontologyStateSvc.flattenHierarchy.and.returnValue([this.iri]);
                ontoUtils.containsDerivedConcept.and.callFake(arr => _.some(arr, iri => _.includes(iri, 'concept')));
                ontoUtils.containsDerivedConceptScheme.and.callFake(arr => _.some(arr, iri => _.includes(iri, 'scheme')));
            });
            it('if a type was added', function() {
                this.controller.types.push('new');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type', 'new']);
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'type': [this.iri], 'new': [this.iri]});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['type', 'new']);
                expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['type']);
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual(['type']);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': this.iri, '@type': ['new']});
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            it('if a type was removed', function() {
                this.controller.types = [];
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual([]);
                expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({});
                expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual([]);
                expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['type']);
                expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.individuals.flat).toEqual(['type']);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': this.iri, '@type': ['type']});
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            it('if the individual is now a concept', function() {
                this.controller.types.push('concept');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type', 'concept']);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual([{entityIRI: this.iri}]);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith([{entityIRI: this.iri}], ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([this.iri]);
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@id', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@type', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith('title', [{'@value': 'title'}]);
            });
            it('if the individual is no longer a concept', function() {
                ontologyStateSvc.listItem.selected['@type'] = ['concept']
                this.controller.types = ['type'];
                ontologyStateSvc.listItem.concepts.flat = [this.iri];
                ontologyStateSvc.listItem.conceptSchemes.flat = [this.iri];
                ontologyStateSvc.flattenHierarchy.and.returnValue([]);
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type']);
                expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, this.iri, ontologyStateSvc.listItem.concepts.index);
                expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, this.iri, ontologyStateSvc.listItem.conceptSchemes.index);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
            });
            it('if the individual is now a concept scheme', function() {
                this.controller.types.push('scheme');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type', 'scheme']);
                expect(ontologyStateSvc.listItem.conceptSchemes.hierarchy).toEqual([{entityIRI: this.iri}]);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith([{entityIRI: this.iri}], ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([this.iri]);
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@id', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).not.toHaveBeenCalledWith('@type', jasmine.anything());
                expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith('title', [{'@value': 'title'}]);
            });
            it('if the individual is no longer a scheme', function() {
                ontologyStateSvc.listItem.selected['@type'] = ['scheme']
                this.controller.types = ['type'];
                ontologyStateSvc.listItem.conceptSchemes.flat = [this.iri];
                ontologyStateSvc.flattenHierarchy.and.returnValue([]);
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type']);
                expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, this.iri, ontologyStateSvc.listItem.conceptSchemes.index);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
            });
            it('unless the individual is now both a scheme and a concept', function() {
                this.controller.types.push('scheme');
                this.controller.types.push('concept');
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type']);
                expect(this.controller.error).toBeTruthy();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('unless nothing changed', function() {
                this.controller.submit();
                expect(ontologyStateSvc.listItem.selected['@type']).toEqual(['type']);
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