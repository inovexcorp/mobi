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
describe('Ontology Utils Manager service', function() {
    var ontologyUtilsManagerSvc, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRI, util, updateRefs, scope, $q, responseObj;

    beforeEach(function() {
        module('ontologyUtilsManager');
        mockOntologyManager();
        mockOntologyState();
        mockUpdateRefs();
        mockPrefixes();
        injectSplitIRIFilter();
        mockUtil();
        mockResponseObj();

        inject(function(ontologyUtilsManagerService, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _splitIRIFilter_, _utilService_, _updateRefsService_, _$rootScope_, _$q_, _responseObj_) {
            ontologyUtilsManagerSvc = ontologyUtilsManagerService;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            splitIRI = _splitIRIFilter_;
            util = _utilService_;
            updateRefs = _updateRefsService_;
            scope = _$rootScope_;
            $q = _$q_;
            responseObj = _responseObj_;
        });

        ontologyStateSvc.flattenHierarchy.and.returnValue([{entityIRI: 'iri'}]);
    });

    afterEach(function() {
        ontologyUtilsManagerSvc = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        prefixes = null;
        splitIRI = null;
        util = null;
        updateRefs = null;
        scope = null;
        $q = null;
        responseObj = null;
    });

    describe('containsDerivedConcept returns', function() {
        beforeEach(function () {
            ontologyStateSvc.listItem.derivedConcepts = ['derived'];
        });
        describe('true if array contains', function() {
            it('a derived Concept', function() {
                expect(ontologyUtilsManagerSvc.containsDerivedConcept(['derived'])).toEqual(true);
            });
            it('skos:Concept', function() {
                expect(ontologyUtilsManagerSvc.containsDerivedConcept([prefixes.skos + 'Concept'])).toEqual(true);
            });
        });
        it('false if array does not contain a derived Concept or skos:Concept', function() {
            expect(ontologyUtilsManagerSvc.containsDerivedConcept(['test'])).toEqual(false);
        });
    });
    describe('containsDerivedSemanticRelation returns', function() {
        beforeEach(function () {
            ontologyStateSvc.listItem.derivedSemanticRelations = [{localName: 'derived', namespace: ''}];
            responseObj.getItemIri.and.callFake(function(obj) {
                return obj.namespace + obj.localName;
            });
        });
        describe('true if array contains', function() {
            it('a derived semanticRelation', function() {
                expect(ontologyUtilsManagerSvc.containsDerivedSemanticRelation([{localName: 'derived', namespace: ''}])).toEqual(true);
            });
            it('skos:semanticRelation', function() {
                expect(ontologyUtilsManagerSvc.containsDerivedSemanticRelation([{localName: 'semanticRelation', namespace: prefixes.skos}])).toEqual(true);
            });
        });
        it('false if array does not contain a derived semanticRelation or skos:semanticRelation', function() {
            expect(ontologyUtilsManagerSvc.containsDerivedSemanticRelation([{localName: 'test', namespace: ''}])).toEqual(false);
        });
    });
    describe('containsDerivedConceptScheme returns', function() {
        beforeEach(function () {
            ontologyStateSvc.listItem.derivedConceptSchemes = ['derived'];
        });
        describe('true if array contains', function() {
            it('a derived ConceptScheme', function() {
                expect(ontologyUtilsManagerSvc.containsDerivedConceptScheme(['derived'])).toEqual(true);
            });
            it('skos:ConceptScheme', function() {
                expect(ontologyUtilsManagerSvc.containsDerivedConceptScheme([prefixes.skos + 'ConceptScheme'])).toEqual(true);
            });
        });
        it('false if array does not contain a derived ConceptScheme or skos:ConceptScheme', function() {
            expect(ontologyUtilsManagerSvc.containsDerivedConceptScheme(['test'])).toEqual(false);
        });
    });
    it('addConcept should update relevant lists when a concept is added', function() {
        var concept = {'@id': 'concept'};
        ontologyUtilsManagerSvc.addConcept(concept);
        expect(ontologyStateSvc.listItem.concepts.hierarchy).toContain({entityIRI: concept['@id']});
        expect(ontologyStateSvc.listItem.concepts.flat).toEqual([{entityIRI: 'iri'}]);
    });
    it('addConceptScheme should update relevant lists when a conceptScheme is added', function() {
        var scheme = {'@id': 'scheme'};
        ontologyUtilsManagerSvc.addConceptScheme(scheme);
        expect(ontologyStateSvc.listItem.conceptSchemes.hierarchy).toContain({entityIRI: scheme['@id']});
        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{entityIRI: 'iri'}]);
    });
    it('addIndividual should update relevant lists when an individual is added', function() {
        var individual = {'@id': 'individual', '@type': ['ClassA']};
        var split = {begin: 'begin', then: 'then', end: 'end'};
        ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
        ontologyStateSvc.getPathsTo.and.returnValue([['ClassA']]);
        splitIRI.and.returnValue(split);
        ontologyUtilsManagerSvc.addIndividual(individual);
        expect(ontologyStateSvc.listItem.individuals.iris).toContain({namespace: split.begin + split.then, localName: split.end});
        expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
        expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['individual']});
        expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA']);
        expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith([], {},'ClassA');
        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
    });
    describe('commonDelete calls the proper methods', function() {
        describe('when getEntityUsages resolves', function() {
            beforeEach(function() {
                spyOn(ontologyUtilsManagerSvc, 'saveCurrentChanges');
                ontologyManagerSvc.getEntityUsages.and.returnValue($q.when([{'@id': 'id'}]));
                ontologyStateSvc.getOntologiesArray.and.returnValue([{prop: 'ontology'}]);
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.removeEntity.and.returnValue([ontologyStateSvc.listItem.selected]);
            });
            it('and when updateEverythingTree is false', function() {
                ontologyUtilsManagerSvc.commonDelete('iri')
                    .then(_.noop, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'iri', 'construct');
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.removeEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, 'iri');
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': 'id'});
                expect(updateRefs.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontology, 'iri');
                expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.flatEverythingTree).not.toEqual([{prop: 'everything'}]);
                expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
            });
            it('and when updateEverythingTree is true', function() {
                ontologyUtilsManagerSvc.commonDelete('iri', true)
                    .then(_.noop, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'iri', 'construct');
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.removeEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, 'iri');
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': 'id'});
                expect(updateRefs.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontology, 'iri');
                expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([{prop: 'ontology'}], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
            });
        });
        it('when getEntityUsages rejects', function() {
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.reject('error'));
            ontologyUtilsManagerSvc.commonDelete('iri')
                .then(function() {
                    fail('Promise should have rejected');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'iri', 'construct');
            expect(util.createErrorToast).toHaveBeenCalledWith('error');
        });
    });
    it('deleteClass should call the proper methods', function() {
        ontologyStateSvc.getIndividualsParentPath.and.returnValue(['ClassA', 'ClassB']);
        ontologyStateSvc.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
        ontologyStateSvc.listItem.classesAndIndividuals = {
            'ClassA': ['IndivA1', 'IndivA2'],
            'ClassB': ['IndivB1']
        };
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('ClassB');
        ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
        spyOn(ontologyUtilsManagerSvc, 'commonDelete').and.returnValue($q.when());
        splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyUtilsManagerSvc.deleteClass();
        scope.$apply();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.removeFromClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, {namespace: 'begin/', localName: 'end'});
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.hierarchy, 'ClassB', ontologyStateSvc.listItem.classes.index);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('ClassB', true);
        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
        expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
        expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
        expect(ontologyStateSvc.setVocabularyStuff).toHaveBeenCalled();
    });
    it('deleteObjectProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete').and.returnValue($q.when());
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.objectProperties.iris = [{namespace: 'begin/', localName: 'end'}];
        ontologyStateSvc.getOntologiesArray.and.returnValue([{prop: 'ontology'}]);
        ontologyUtilsManagerSvc.deleteObjectProperty();
        scope.$apply();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.objectProperties.iris.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.hierarchy, 'begin/end', ontologyStateSvc.listItem.objectProperties.index);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.objectProperties.flat).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end', true);
        expect(ontologyStateSvc.setVocabularyStuff).toHaveBeenCalled();
    });
    it('deleteDataTypeProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.dataProperties.iris = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteDataTypeProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.dataProperties.iris.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.hierarchy, 'begin/end', ontologyStateSvc.listItem.dataProperties.index);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.dataProperties.flat).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end', true);
    });
    it('deleteAnnotationProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.annotations.iris = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteAnnotationProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.annotations.iris.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.hierarchy, 'begin/end', ontologyStateSvc.listItem.annotations.index);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.annotations.flat).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    describe('deleteIndividual should call the proper methods', function() {
        beforeEach(function() {
            this.entityIRI = 'IndivB1';
            ontologyStateSvc.getIndividualsParentPath.and.returnValue(['ClassA', 'ClassB']);
            ontologyStateSvc.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
            ontologyStateSvc.listItem.classesAndIndividuals = {
                'ClassA': ['IndivA1', 'IndivA2'],
                'ClassB': [this.entityIRI]
            };
            ontologyStateSvc.listItem.selected['@type'] = ['ClassB'];
            ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
            spyOn(ontologyUtilsManagerSvc, 'commonDelete');
            ontologyStateSvc.getActiveEntityIRI.and.returnValue(this.entityIRI);
            splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
            ontologyStateSvc.listItem.individuals.iris = [{namespace: 'begin/', localName: 'end'}];
        });
        it('if is is a derived concept', function() {
            spyOn(ontologyUtilsManagerSvc, 'containsDerivedConcept').and.returnValue(true);
            ontologyUtilsManagerSvc.deleteIndividual();
            expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.individuals.iris.length).toEqual(0);
            expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
            expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
            expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
            expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
            expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, this.entityIRI, ontologyStateSvc.listItem.concepts.index);
            expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.concepts.flat).toEqual([{entityIRI: 'iri'}]);
            expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, this.entityIRI, ontologyStateSvc.listItem.conceptSchemes.index);
            expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{entityIRI: 'iri'}]);
            expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith(this.entityIRI);
        });
        it('if it is a derived conceptScheme', function() {
            spyOn(ontologyUtilsManagerSvc, 'containsDerivedConcept').and.returnValue(false);
            spyOn(ontologyUtilsManagerSvc, 'containsDerivedConceptScheme').and.returnValue(true);
            ontologyUtilsManagerSvc.deleteIndividual();
            expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.individuals.iris.length).toEqual(0);
            expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
            expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
            expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
            expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
            expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, this.entityIRI, ontologyStateSvc.listItem.conceptSchemes.index);
            expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{entityIRI: 'iri'}]);
            expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith(this.entityIRI);
        });
        it('if it is not a derived concept or conceptScheme', function() {
            spyOn(ontologyUtilsManagerSvc, 'containsDerivedConcept').and.returnValue(false);
            spyOn(ontologyUtilsManagerSvc, 'containsDerivedConceptScheme').and.returnValue(false);
            ontologyUtilsManagerSvc.deleteIndividual();
            expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.individuals.iris.length).toEqual(0);
            expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
            expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
            expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
            expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
            expect(ontologyStateSvc.deleteEntityFromHierarchy).not.toHaveBeenCalled();
            expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
            expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
            expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('IndivB1');
        });
    });
    it('deleteConcept should call the proper methods', function() {
        var entityIRI = 'begin/end';
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue(entityIRI);
        ontologyStateSvc.getIndividualsParentPath.and.returnValue(['ClassA', 'ClassB']);
        ontologyStateSvc.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
        ontologyStateSvc.listItem.classesAndIndividuals = {
            'ClassA': ['IndivA1', 'IndivA2'],
            'ClassB': [entityIRI]
        };
        ontologyStateSvc.listItem.selected['@type'] = ['ClassB'];
        ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
        splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.individuals.iris = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteConcept();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, entityIRI, ontologyStateSvc.listItem.concepts.index);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.concepts.flat).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, entityIRI, ontologyStateSvc.listItem.conceptSchemes.index);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyStateSvc.listItem.individuals.iris.length).toEqual(0);
        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
        expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
        expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith(entityIRI);
    });
    it('deleteConceptScheme should call the proper methods', function() {
        var entityIRI = 'begin/end';
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue(entityIRI);
        ontologyStateSvc.getIndividualsParentPath.and.returnValue(['ClassA', 'ClassB']);
        ontologyStateSvc.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
        ontologyStateSvc.listItem.classesAndIndividuals = {
            'ClassA': ['IndivA1', 'IndivA2'],
            'ClassB': [entityIRI]
        };
        ontologyStateSvc.listItem.selected['@type'] = ['ClassB'];
        ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
        splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.individuals.iris = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteConceptScheme();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, entityIRI, ontologyStateSvc.listItem.conceptSchemes.index);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyStateSvc.listItem.individuals.iris.length).toEqual(0);
        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
        expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
        expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'individual'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith(entityIRI);
    });
    describe('getBlankNodeValue returns', function() {
        beforeEach(function() {
            this.importedOntology = {ontologyId: 'imported', blankNodes: {key1: 'importedValue1'}};
            ontologyStateSvc.listItem.blankNodes = {key1: 'value1'};
            ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
            ontologyStateSvc.listItem.importedOntologies = [this.importedOntology];
        });
        describe('value for the key provided contained in the object', function() {
            it('if selected is imported', function() {
                ontologyStateSvc.listItem.selected.mobi = {imported: true, importedIRI: this.importedOntology.ontologyId};
                expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(this.importedOntology.blankNodes['key1']);
            });
            it('if selected is not imported', function() {
                expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(ontologyStateSvc.listItem.blankNodes['key1']);
            });
        });
        describe('key for the key provided not contained in the object', function() {
            it('if selected is imported', function() {
                ontologyStateSvc.listItem.selected.mobi = {imported: true, importedIRI: this.importedOntology.ontologyId};
                expect(ontologyUtilsManagerSvc.getBlankNodeValue('key2')).toEqual('key2');
            });
            it('if selected is not imported', function() {
                expect(ontologyUtilsManagerSvc.getBlankNodeValue('key2')).toEqual('key2');
            });
        });
        it('undefined if isBlankNodeId returns false', function() {
            ontologyManagerSvc.isBlankNodeId.and.returnValue(false);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(undefined);
        });
    });
    describe('isLinkable returns proper value', function() {
        it('when getEntityByRecordId exists and isBlankNodeId is false', function() {
            ontologyStateSvc.getEntityByRecordId.and.returnValue({});
            ontologyManagerSvc.isBlankNodeId.and.returnValue(false);
            expect(ontologyUtilsManagerSvc.isLinkable('iri')).toEqual(true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, 'iri');
            expect(ontologyManagerSvc.isBlankNodeId).toHaveBeenCalledWith('iri');
        });
        it('when getEntityByRecordId is undefined and isBlankNodeId is false', function() {
            ontologyStateSvc.getEntityByRecordId.and.returnValue(undefined);
            ontologyManagerSvc.isBlankNodeId.and.returnValue(false);
            expect(ontologyUtilsManagerSvc.isLinkable('iri')).toEqual(false);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, 'iri');
            expect(ontologyManagerSvc.isBlankNodeId).not.toHaveBeenCalled();
        });
        it('when getEntityByRecordId exists and isBlankNodeId is true', function() {
            ontologyStateSvc.getEntityByRecordId.and.returnValue({});
            ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
            expect(ontologyUtilsManagerSvc.isLinkable('iri')).toEqual(false);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, 'iri');
            expect(ontologyManagerSvc.isBlankNodeId).toHaveBeenCalledWith('iri');
        });
        it('when getEntityByRecordId is undefined and isBlankNodeId is true', function() {
            ontologyStateSvc.getEntityByRecordId.and.returnValue(undefined);
            ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
            expect(ontologyUtilsManagerSvc.isLinkable('iri')).toEqual(false);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, 'iri');
            expect(ontologyManagerSvc.isBlankNodeId).not.toHaveBeenCalled();
        });
    });
    it('getNameByNode calls the correct method', function() {
        spyOn(ontologyUtilsManagerSvc, 'getLabelForIRI').and.returnValue('result');
        expect(ontologyUtilsManagerSvc.getNameByNode({entityIRI: 'iri'})).toEqual('result');
        expect(ontologyUtilsManagerSvc.getLabelForIRI).toHaveBeenCalledWith('iri');
    });
    describe('addLanguageToNewEntity should set the proper values', function() {
        it('when language is undefined', function() {
            var entity = {};
            ontologyUtilsManagerSvc.addLanguageToNewEntity(entity);
            expect(entity).toEqual({});
        });
        describe('when language is provided', function() {
            beforeEach(function () {
                this.language = 'en';
            });
            it('and it has a dcterms:title', function() {
                var entity = {};
                entity[prefixes.dcterms + 'title'] = [{'@value': 'value'}];
                var expected = {};
                expected[prefixes.dcterms + 'title'] = [{'@value': 'value', '@language': this.language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, this.language);
                expect(entity).toEqual(expected);
            });
            it('and it has a dcterms:description', function() {
                var entity = {};
                entity[prefixes.dcterms + 'description'] = [{'@value': 'value'}];
                var expected = {};
                expected[prefixes.dcterms + 'description'] = [{'@value': 'value', '@language': this.language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, this.language);
                expect(entity).toEqual(expected);
            });
            it('and it has both dcterms:title and dcterms:description', function() {
                var entity = {};
                entity[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                entity[prefixes.dcterms + 'title'] = [{'@value': 'title'}];
                var expected = {};
                expected[prefixes.dcterms + 'description'] = [{'@value': 'description', '@language': this.language}];
                expected[prefixes.dcterms + 'title'] = [{'@value': 'title', '@language': this.language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, this.language);
                expect(entity).toEqual(expected);
            });
            it('and it has a skos:prefLabel', function() {
                var entity = {};
                entity[prefixes.skos + 'prefLabel'] = [{'@value': 'value'}];
                var expected = {};
                expected[prefixes.skos + 'prefLabel'] = [{'@value': 'value', '@language': this.language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, this.language);
                expect(entity).toEqual(expected);
            });
        });
    });
    describe('saveCurrentChanges', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontologyId = 'id';
        });
        it('calls the correct manager function', function() {
            ontologyStateSvc.saveChanges.and.returnValue($q.when(''));
            ontologyUtilsManagerSvc.saveCurrentChanges();
            expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
        });
        describe('when resolved, sets the correct variable and calls correct manager function', function() {
            beforeEach(function() {
                ontologyStateSvc.saveChanges.and.returnValue($q.when('id'));
            });
            describe('when afterSave is resolved', function() {
                beforeEach(function() {
                    ontologyStateSvc.afterSave.and.returnValue($q.when());
                    ontologyStateSvc.isCommittable.and.returnValue(true);
                });
                it('if getActiveKey is not project and getActiveEntityIRI is defined', function() {
                    var id = 'id';
                    ontologyStateSvc.getActiveKey.and.returnValue('');
                    ontologyStateSvc.getActiveEntityIRI.and.returnValue(id);
                    ontologyUtilsManagerSvc.saveCurrentChanges()
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(id);
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveKey is project', function() {
                    ontologyStateSvc.getActiveKey.and.returnValue('project');
                    ontologyUtilsManagerSvc.saveCurrentChanges()
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveKey is individuals', function() {
                    ontologyStateSvc.getActiveKey.and.returnValue('individuals');
                    ontologyUtilsManagerSvc.saveCurrentChanges()
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveEntityIRI is undefined', function() {
                    ontologyStateSvc.getActiveEntityIRI.and.returnValue(undefined);
                    ontologyUtilsManagerSvc.saveCurrentChanges()
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
            });
            it('when afterSave is rejected', function() {
                ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                ontologyUtilsManagerSvc.saveCurrentChanges()
                    .then(function() {
                        fail('Promise should have rejected');
                    });
                scope.$apply();
                expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
                expect(ontologyStateSvc.listItem.isSaved).toBe(false);
            });
        });
        it('when rejected, sets the correct variable', function() {
            ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
            ontologyUtilsManagerSvc.saveCurrentChanges()
                .then(function() {
                    fail('Promise should have rejected');
                });
            scope.$apply();
            expect(util.createErrorToast).toHaveBeenCalledWith('error');
            expect(ontologyStateSvc.listItem.isSaved).toBe(false);
        });
    });
    describe('updateLabel sets the label correctly', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem = {
                index: {
                    iri: {
                        label: 'old-value'
                    }
                },
                ontologyRecord: {
                    title: '',
                    recordId: '',
                    branchId: '',
                    commitId: ''
                },
                classes: {
                    hierarchy: [],
                    flat: []
                },
                dataProperties: {
                    hierarchy: [],
                    flat: []
                },
                objectProperties: {
                    hierarchy: [],
                    flat: []
                },
                annotations: {
                    hierarchy: [],
                    flat: []
                },
                concepts: {
                    hierarchy: [],
                    flat: []
                },
                conceptSchemes: {
                    hierarchy: [],
                    flat: []
                },
                derivedConcepts: [],
                derivedConceptSchemes: []
            };
            ontologyManagerSvc.getEntityName.and.returnValue('new-value');
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isAnnotation.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'new-item'}]);
        });
        describe('when the listItem.index contains the selected @id', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.selected = {
                    '@id': 'iri',
                    mobi: {
                        originalIRI: ''
                    }
                };
            });
            it('and isClass is true', function() {
                ontologyManagerSvc.isClass.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.classes.flat).toEqual([{prop: 'new-item'}]);
            });
            it('and isDataTypeProperty is true', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.dataProperties.flat).toEqual([{prop: 'new-item'}]);
            });
            it('and isObjectProperty is true', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.objectProperties.flat).toEqual([{prop: 'new-item'}]);
            });
            it('and isAnnotation is true', function() {
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.annotations.flat).toEqual([{prop: 'new-item'}]);
            });
            it('and isConcept is true', function() {
                ontologyManagerSvc.isConcept.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([{prop: 'new-item'}]);
            });
            it('and isConceptScheme is true', function() {
                ontologyManagerSvc.isConceptScheme.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([{prop: 'new-item'}]);
            });
        });
        it('when the listItem.index does not contain the selected @id', function() {
            ontologyStateSvc.listItem.selected = {'@id': 'other-iri'};
            ontologyUtilsManagerSvc.updateLabel();
            expect(ontologyStateSvc.listItem.index.iri.label).toBe('old-value');
        });
    });
    it('getLabelForIRI should call the proper methods', function() {
        ontologyStateSvc.getEntityNameByIndex.and.returnValue('result');
        expect(ontologyUtilsManagerSvc.getLabelForIRI('iri')).toEqual('result');
        expect(ontologyStateSvc.getEntityNameByIndex).toHaveBeenCalledWith('iri', ontologyStateSvc.listItem);
    });
    it('getDropDownText should call the correct methods', function() {
        responseObj.getItemIri.and.returnValue('iri');
        ontologyStateSvc.getEntityNameByIndex.and.returnValue('name');
        expect(ontologyUtilsManagerSvc.getDropDownText({})).toBe('name');
        expect(responseObj.getItemIri).toHaveBeenCalledWith({});
        expect(ontologyStateSvc.getEntityNameByIndex).toHaveBeenCalledWith('iri', ontologyStateSvc.listItem);
    });
    it('setSuperClasses should call the correct methods', function() {
        ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'flattened'}]);
        var classIRIs = ['classId1', 'classId2'];
        ontologyUtilsManagerSvc.setSuperClasses('iri', classIRIs);
        _.forEach(classIRIs, function(value) {
            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.hierarchy, 'iri', ontologyStateSvc.listItem.classes.index, value);
        });
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.classes.flat).toEqual([{prop: 'flattened'}]);
    });
    describe('updateflatIndividualsHierarchy should call the corret methods when getPathsTo', function() {
        it('has paths', function() {
            var classIRIs = ['class1', 'class2']
            ontologyStateSvc.getPathsTo.and.callFake(function(hierarchy, index, iri) {
                return ['default', iri];
            });
            ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'tree'}]);
            ontologyUtilsManagerSvc.updateflatIndividualsHierarchy(classIRIs);
            _.forEach(classIRIs, function(classIRI) {
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.hierarchy, ontologyStateSvc.listItem.classes.index, classIRI);
            });
            expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['default', 'class1', 'class2']);
            expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.individuals.flat).toEqual([{prop: 'tree'}]);
        });
        it('does not have paths', function() {
            ontologyUtilsManagerSvc.updateflatIndividualsHierarchy([]);
            expect(ontologyStateSvc.getPathsTo).not.toHaveBeenCalled();
            expect(ontologyStateSvc.createFlatIndividualTree).not.toHaveBeenCalled();
        });
    });
    it('setSuperProperties should call the correct methods', function() {
        ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'flattened'}]);
        var propertyIRIs = ['classId1', 'classId2'];
        ontologyUtilsManagerSvc.setSuperProperties('iri', propertyIRIs, 'dataProperties');
        _.forEach(propertyIRIs, function(value) {
            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.hierarchy, 'iri', ontologyStateSvc.listItem.index, value);
        });
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.dataProperties.flat).toEqual([{prop: 'flattened'}]);
    });
    describe('checkIri should return correct values when the IRI is', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.iriList.push('id');
        });
        it('not a duplicate and not selected.', function() {
            expect(ontologyUtilsManagerSvc.checkIri('newIri')).toBe(false);
        });
        it('a duplicate and not selected.', function() {
            ontologyStateSvc.listItem.selected = {'@id': 'newIri'};
            expect(ontologyUtilsManagerSvc.checkIri('id')).toBe(true);
        });
        it('not a duplicate and there is an IRI selected.', function() {
            ontologyStateSvc.listItem.selected = {'@id': 'id'};
            expect(ontologyUtilsManagerSvc.checkIri('newIri')).toBe(false);
        });
        it('a duplicate and is selected.', function() {
            ontologyStateSvc.listItem.selected = {'@id': 'id'};
            expect(ontologyUtilsManagerSvc.checkIri('id')).toBe(false);
        });
    });
});
