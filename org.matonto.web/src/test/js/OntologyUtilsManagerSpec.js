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
    var ontologyUtilsManagerSvc, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRIFilter, util, updateRefs, scope, $q;

    beforeEach(function() {
        module('ontologyUtilsManager');
        mockOntologyManager();
        mockOntologyState();
        mockUpdateRefs();
        mockPrefixes();
        injectSplitIRIFilter();
        mockUtil();

        inject(function(ontologyUtilsManagerService, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _splitIRIFilter_, _utilService_, _updateRefsService_, _$rootScope_, _$q_) {
            ontologyUtilsManagerSvc = ontologyUtilsManagerService;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
            util = _utilService_;
            updateRefs = _updateRefsService_;
            scope = _$rootScope_;
            $q = _$q_;
        });
    });

    describe('commonDelete calls the proper methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            ontologyManagerSvc.getEntityUsages.and.returnValue(getDeferred.promise);
        });
        it('when getEntityUsages resolves', function() {
            spyOn(ontologyUtilsManagerSvc, 'saveCurrentChanges');
            getDeferred.resolve([{'@id': 'id'}]);
            ontologyUtilsManagerSvc.commonDelete('iri');
            scope.$apply();
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, 'iri', 'construct');
            expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.selected);
            expect(ontologyManagerSvc.removeEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, 'iri');
            expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, {'@id': 'id'});
            expect(updateRefs.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontology, 'iri');
            expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
            expect(ontologyUtilsManagerSvc.saveCurrentChanges).toHaveBeenCalled();
        });
        it('when getEntityUsages rejects', function() {
            getDeferred.reject('error');
            ontologyUtilsManagerSvc.commonDelete('iri');
            scope.$apply();
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, 'iri', 'construct');
            expect(util.createErrorToast).toHaveBeenCalledWith('error');
        });
    });
    it('deleteClass should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.subClasses = [{namespace: 'begin/', localName: 'end'}];
        ontologyStateSvc.listItem.classesWithIndividuals = ['begin/end'];
        ontologyUtilsManagerSvc.deleteClass();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classHierarchy, 'begin/end', ontologyStateSvc.listItem.classIndex);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteObjectProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.subObjectProperties = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteObjectProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyHierarchy, 'begin/end', ontologyStateSvc.listItem.objectPropertyIndex);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
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
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteAnnotationProperty should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.annotations = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteAnnotationProperty();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.annotations.length).toBe(0);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteIndividual should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.individuals = ['begin/end'];
        ontologyUtilsManagerSvc.deleteIndividual();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteConcept should call the proper methods', function() {
        spyOn(ontologyUtilsManagerSvc, 'commonDelete');
        ontologyStateSvc.getActiveEntityIRI.and.returnValue('begin/end');
        splitIRIFilter.and.returnValue({begin: 'begin', then: '/', end: 'end'});
        ontologyStateSvc.listItem.subDataProperties = [{namespace: 'begin/', localName: 'end'}];
        ontologyUtilsManagerSvc.deleteConcept();
        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
        expect(ontologyStateSvc.listItem.subClasses.length).toBe(0);
        expect(ontologyStateSvc.deleteEntityFromHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptHierarchy, 'begin/end', ontologyStateSvc.listItem.conceptIndex);
        expect(ontologyUtilsManagerSvc.commonDelete).toHaveBeenCalledWith('begin/end');
    });
    it('deleteConceptScheme should call the proper method', function() {
        spyOn(ontologyUtilsManagerSvc, 'deleteConcept');
        ontologyUtilsManagerSvc.deleteConceptScheme();
        expect(ontologyUtilsManagerSvc.deleteConcept).toHaveBeenCalled();
    });
    it('isBlankNodeString tests whether an id is a blank node', function() {
        var falseTests = ['', [], {}, true, false, undefined, null, 0, 1];
        var result;
        _.forEach(falseTests, function(test) {
            result = ontologyUtilsManagerSvc.isBlankNodeString(test);
            expect(result).toBe(false);
        });

        result = ontologyUtilsManagerSvc.isBlankNodeString('_:genid');
        expect(result).toBe(true);
    });
    describe('getBlankNodeValue returns', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.blankNodes = {key1: 'value1'};
        });
        it('value for the key provided contained in the object', function() {
            spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(true);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(ontologyStateSvc.listItem.blankNodes['key1']);
        });
        it('key for the key provided not contained in the object', function() {
            spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(true);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key2')).toEqual('key2');
        });
        it('undefined if isBlankNodeString returns false', function() {
            spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(false);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(undefined);
        });
    });
    it('isLinkable returns proper value', function() {
        ontologyStateSvc.listItem.index = {iri: 0, '_:genid': 1};
        expect(ontologyUtilsManagerSvc.isLinkable('iri')).toEqual(true);
        expect(ontologyUtilsManagerSvc.isLinkable('word')).toEqual(false);
        spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(true);
        expect(ontologyUtilsManagerSvc.isLinkable('_:genid')).toEqual(false);
    });
    it('getNameByIRI should call the proper methods', function() {
        var entity = {'@id': 'id'};
        var iri = 'iri';
        var recordId = 'recordId';
        ontologyStateSvc.listItem.recordId = recordId;
        ontologyManagerSvc.getEntityByRecordId.and.returnValue(entity);
        ontologyManagerSvc.getEntityName.and.returnValue('result');
        expect(ontologyUtilsManagerSvc.getNameByIRI(iri)).toEqual('result');
        expect(ontologyManagerSvc.getEntityByRecordId).toHaveBeenCalledWith(recordId, iri);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(entity);
    });
    it('getNameByNode calls the correct method', function() {
        spyOn(ontologyUtilsManagerSvc, 'getNameByIRI').and.returnValue('result');
        expect(ontologyUtilsManagerSvc.getNameByNode({entityIRI: 'iri'})).toEqual('result');
        expect(ontologyUtilsManagerSvc.getNameByIRI).toHaveBeenCalledWith('iri');
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
            ontologyManagerSvc.saveChanges.and.returnValue(saveDeferred.promise);
            ontologyUtilsManagerSvc.saveCurrentChanges();
        });
        it('calls the correct manager function', function() {
            expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
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
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveKey is project', function() {
                    ontologyStateSvc.getActiveKey.and.returnValue('project');
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveKey is individuals', function() {
                    ontologyStateSvc.getActiveKey.and.returnValue('individuals');
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
                    expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                });
                it('if getActiveEntityIRI is undefined', function() {
                    ontologyStateSvc.getActiveEntityIRI.and.returnValue(undefined);
                    scope.$apply();
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId);
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
                }
            };
            ontologyManagerSvc.getEntityName.and.returnValue('new-value');
        });
        it('when the listItem.index contains the selected @id', function() {
            ontologyStateSvc.selected = {'@id': 'iri'};
            ontologyUtilsManagerSvc.updateLabel();
            expect(ontologyStateSvc.listItem.index.iri.label).toBe('new-value');
        });
        it('when the listItem.index does not contain the selected @id', function() {
            ontologyStateSvc.selected = {};
            ontologyUtilsManagerSvc.updateLabel();
            expect(ontologyStateSvc.listItem.index.iri.label).toBe('old-value');
        });
    });
});