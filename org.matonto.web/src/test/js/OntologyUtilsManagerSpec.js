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
describe('Ontology Utils Manager service', function() {
    var ontologyUtilsManagerSvc, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRIFilter, util, updateRefs, scope, $q, responseObj;

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
            splitIRIFilter = _splitIRIFilter_;
            util = _utilService_;
            updateRefs = _updateRefsService_;
            scope = _$rootScope_;
            $q = _$q_;
            responseObj = _responseObj_;
        });

        ontologyStateSvc.flattenHierarchy.and.returnValue([{entityIRI: 'iri'}]);
    });

    describe('commonDelete calls the proper methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            ontologyManagerSvc.getEntityUsages.and.returnValue(getDeferred.promise);
        });
        describe('when getEntityUsages resolves', function() {
            beforeEach(function() {
                spyOn(ontologyUtilsManagerSvc, 'saveCurrentChanges');
                getDeferred.resolve([{'@id': 'id'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([{prop: 'ontology'}]);
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.removeEntity.and.returnValue([ontologyStateSvc.listItem.selected]);
            });
            it('and when updateEverythingTree is false', function() {
                ontologyUtilsManagerSvc.commonDelete('iri');
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
                ontologyUtilsManagerSvc.commonDelete('iri', true);
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
            getDeferred.reject('error');
            ontologyUtilsManagerSvc.commonDelete('iri');
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
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.subClasses = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteClass();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, 'ClassB', ontologyStateSvc.listItem.classIndex);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('ClassB', true);
        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
        expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
        expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.flatIndividualsHierarchy).toEqual([{prop: 'individual'}]);
    });
    it('deleteObjectProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.subObjectProperties = [{namespace: 'begin/', localName: 'end'}];
        ontologyStateSvc.getOntologiesArray.and.returnValue([{prop: 'ontology'}]);
        ontologyUtilsManagerSvc.deleteObjectProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyHierarchy, 'begin/end', ontologyStateSvc.listItem.objectPropertyIndex);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatObjectPropertyHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end', true);
    });
    it('deleteDataTypeProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.subDataProperties = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteDataTypeProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataPropertyHierarchy, 'begin/end', ontologyStateSvc.listItem.dataPropertyIndex);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataPropertyHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatDataPropertyHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end', true);
    });
    it('deleteAnnotationProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.annotations = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteAnnotationProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.annotations.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotationPropertyHierarchy, 'begin/end', ontologyStateSvc.listItem.annotationPropertyIndex);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotationPropertyHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatAnnotationPropertyHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteIndividual should call the proper methods', function() {
        ontologyStateSvc.getIndividualsParentPath.and.returnValue(['ClassA', 'ClassB']);
        ontologyStateSvc.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
        ontologyStateSvc.listItem.classesAndIndividuals = {
            'ClassA': ['IndivA1', 'IndivA2'],
            'ClassB': ['IndivB1']
        };
        ontologyStateSvc.listItem.selected['@type'] = ['ClassB'];
        ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'individual'}]);
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('IndivB1');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyUtilsManagerSvc.deleteIndividual();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('IndivB1');
        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
        expect(ontologyStateSvc.listItem.classesWithIndividuals).toEqual(['ClassA']);
        expect(ontologyStateSvc.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
        expect(ontologyStateSvc.listItem.flatIndividualsHierarchy).toEqual([{prop: 'individual'}]);
    });
    it('deleteConcept should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        ontologyUtilsManagerSvc.deleteConcept();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, 'begin/end', ontologyStateSvc.listItem.conceptIndex);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatConceptHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeHierarchy, 'begin/end', ontologyStateSvc.listItem.conceptSchemeIndex);
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatConceptSchemeHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteConceptScheme should call the proper method', function() {
        ontologyStateSvc.listItem.conceptSchemeHierarchy = [{entityIRI: 'begin/end', subEntities: [{}]}, {entityIRI: 'iri'}];
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        ontologyUtilsManagerSvc.deleteConceptScheme();
        expect(ontologyStateSvc.listItem.conceptSchemeHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(updateRefs.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeIndex, 'begin/end');
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemeHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatConceptSchemeHierarchy).toEqual([{entityIRI: 'iri'}]);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    describe('getBlankNodeValue returns', function() {
        var importedOntology;
        beforeEach(function() {
            importedOntology = {ontologyId: 'imported', blankNodes: {key1: 'importedValue1'}};
            ontologyStateSvc.listItem.blankNodes = {key1: 'value1'};
            ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
            ontologyStateSvc.listItem.importedOntologies = [importedOntology];
        });
        describe('value for the key provided contained in the object', function() {
            it('if selected is imported', function() {
                ontologyStateSvc.listItem.selected.matonto = {imported: true, importedIRI: importedOntology.ontologyId};
                expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(importedOntology.blankNodes['key1']);
            });
            it('if selected is not imported', function() {
                expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(ontologyStateSvc.listItem.blankNodes['key1']);
            });
        });
        describe('key for the key provided not contained in the object', function() {
            it('if selected is imported', function() {
                ontologyStateSvc.listItem.selected.matonto = {imported: true, importedIRI: importedOntology.ontologyId};
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
            var language = 'en';
            it('and it has a dcterms:title', function() {
                var entity = {};
                entity[prefixes.dcterms + 'title'] = [{'@value': 'value'}];
                var expected = {};
                expected[prefixes.dcterms + 'title'] = [{'@value': 'value', '@language': language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, language);
                expect(entity).toEqual(expected);
            });
            it('and it has a dcterms:description', function() {
                var entity = {};
                entity[prefixes.dcterms + 'description'] = [{'@value': 'value'}];
                var expected = {};
                expected[prefixes.dcterms + 'description'] = [{'@value': 'value', '@language': language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, language);
                expect(entity).toEqual(expected);
            });
            it('and it has both dcterms:title and dcterms:description', function() {
                var entity = {};
                entity[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                entity[prefixes.dcterms + 'title'] = [{'@value': 'title'}];
                var expected = {};
                expected[prefixes.dcterms + 'description'] = [{'@value': 'description', '@language': language}];
                expected[prefixes.dcterms + 'title'] = [{'@value': 'title', '@language': language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, language);
                expect(entity).toEqual(expected);
            });
            it('and it has a skos:prefLabel', function() {
                var entity = {};
                entity[prefixes.skos + 'prefLabel'] = [{'@value': 'value'}];
                var expected = {};
                expected[prefixes.skos + 'prefLabel'] = [{'@value': 'value', '@language': language}];
                ontologyUtilsManagerSvc.addLanguageToNewEntity(entity, language);
                expect(entity).toEqual(expected);
            });
        });
    });

    describe('saveCurrentChanges', function() {
        var saveDeferred;
        beforeEach(function() {
            saveDeferred = $q.defer();
            ontologyStateSvc.listItem.ontologyId = 'id';
            ontologyStateSvc.saveChanges.and.returnValue(saveDeferred.promise);
            ontologyUtilsManagerSvc.saveCurrentChanges();
        });
        it('calls the correct manager function', function() {
            expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
        });
        describe('when resolved, sets the correct variable and calls correct manager function', function() {
            var afterDeferred;
            beforeEach(function() {
                saveDeferred.resolve('id');
                afterDeferred = $q.defer();
                ontologyStateSvc.afterSave.and.returnValue(afterDeferred.promise);
            });
            describe('when afterSave is resolved', function() {
                beforeEach(function() {
                    afterDeferred.resolve();
                    ontologyStateSvc.isCommittable.and.returnValue(true);
                });
                it('if getActiveKey is not project and getActiveEntityIRI is defined', function() {
                    var id = 'id';
                    ontologyStateSvc.getActiveKey.and.returnValue('');
                    ontologyStateSvc.getActiveEntityIRI.and.returnValue(id);
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(id);
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveKey is project', function() {
                    ontologyStateSvc.getActiveKey.and.returnValue('project');
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveKey is individuals', function() {
                    ontologyStateSvc.getActiveKey.and.returnValue('individuals');
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveEntityIRI is undefined', function() {
                    ontologyStateSvc.getActiveEntityIRI.and.returnValue(undefined);
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
            });
            it('when afterSave is rejected', function() {
                afterDeferred.reject('error');
                scope.$apply();
                expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
                expect(ontologyStateSvc.listItem.isSaved).toBe(false);
            });
        });
        it('when rejected, sets the correct variable', function() {
            saveDeferred.reject('error');
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
                    commitId: '',
                    type: ''
                }
            };
            ontologyManagerSvc.getEntityName.and.returnValue('new-value');
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isAnnotation.and.returnValue(false);
            ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'new-item'}]);
        });
        describe('when the listItem.index contains the selected @id', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.selected = {
                    '@id': 'iri',
                    matonto: {
                        originalIRI: ''
                    }
                };
            });
            it('and listItem.ontologyRecord.type is vocabulary', function() {
                ontologyStateSvc.listItem.ontologyRecord.type = 'vocabulary';
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.flatConceptHierarchy).toEqual([{prop: 'new-item'}]);
            });
            it('and isClass is true', function() {
                ontologyManagerSvc.isClass.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.flatClassHierarchy).toEqual([{prop: 'new-item'}]);
            });
            it('and isDataTypeProperty is true', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataPropertyHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.flatDataPropertyHierarchy).toEqual([{prop: 'new-item'}]);
            });
            it('and isObjectProperty is true', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.flatObjectPropertyHierarchy).toEqual([{prop: 'new-item'}]);
            });
            it('and isAnnotation is true', function() {
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                ontologyUtilsManagerSvc.updateLabel();
                expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotationPropertyHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(ontologyStateSvc.listItem.flatAnnotationPropertyHierarchy).toEqual([{prop: 'new-item'}]);
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
            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, 'iri', ontologyStateSvc.listItem.classIndex, value);
        });
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatClassHierarchy).toEqual([{prop: 'flattened'}]);
    });

    describe('updateflatIndividualsHierarchy should call the corret methods when getPathsTo', function() {
        var classIRIs = ['class1', 'class2'];
        it('has paths', function() {
            ontologyStateSvc.getPathsTo.and.callFake(function(hierarchy, index, iri) {
                return ['default', iri];
            });
            ontologyStateSvc.createFlatIndividualTree.and.returnValue([{prop: 'tree'}]);
            ontologyUtilsManagerSvc.updateflatIndividualsHierarchy(classIRIs);
            _.forEach(classIRIs, function(classIRI) {
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, ontologyStateSvc.listItem.classIndex, classIRI);
            });
            expect(ontologyStateSvc.listItem.individualsParentPath).toEqual(['default', 'class1', 'class2']);
            expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.flatIndividualsHierarchy).toEqual([{prop: 'tree'}]);
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
        ontologyUtilsManagerSvc.setSuperProperties('iri', propertyIRIs, 'hierarchy', 'index', 'flatHierarchy');
        _.forEach(propertyIRIs, function(value) {
            expect(ontologyStateSvc.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.hierarchy, 'iri', ontologyStateSvc.listItem.index, value);
        });
        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId);
        expect(ontologyStateSvc.listItem.flatHierarchy).toEqual([{prop: 'flattened'}]);
    });

    describe('checkIri should return correct values when forEdit is', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.iriList.push('id');
        });
        describe('false and the IRI is', function() {
            it('not a duplicate', function() {
                expect(ontologyUtilsManagerSvc.checkIri('other')).toBe(false);
            });
            it('a duplicate', function() {
                expect(ontologyUtilsManagerSvc.checkIri('id')).toBe(true);
            });
        });
        describe('true and the IRI is', function() {
            it('not a duplicate', function() {
                expect(ontologyUtilsManagerSvc.checkIri('other', true)).toBe(false);
            });
            describe('a duplicate and', function() {
                it('not selected', function() {
                    ontologyStateSvc.listItem.selected = {'@id': 'iri'};
                    expect(ontologyUtilsManagerSvc.checkIri('id', true)).toBe(true);
                });
                it('is selected', function() {
                    ontologyStateSvc.listItem.selected = {'@id': 'id'};
                    expect(ontologyUtilsManagerSvc.checkIri('id', true)).toBe(false);
                });
            });
        });
    });
});
