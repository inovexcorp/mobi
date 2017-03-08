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
describe('Ontology Manager service', function() {
    var $httpBackend, ontologyManagerSvc, catalogManagerSvc, stateManagerSvc, scope, ontologyState, prefixes, $q, util,
        windowSvc, listItem, filter, ontologyObj, paramSerializer, classObj, objectPropertyObj, dataPropertyObj,
        annotationObj, individualObj, restrictionObj, ontology, getResponse, conceptObj, schemeObj, defaultDatatypes;
    var recordId = 'recordId';
    var ontologyId = 'ontologyId';
    var branchId = 'branchId';
    var branch = {
        '@id': branchId
    };
    var commitId = 'commitId';
    var catalogId = 'catalogId';
    var format = 'jsonld';
    var commitObj = {
        commit: {
            '@id': commitId
        }
    }
    var file = {};
    var title = 'title';
    var description = 'description';
    var keywords = 'keyword1,keyword2';
    var ontologyType = 'ontology';
    var vocabularyType = 'vocabulary';
    var error = 'error';
    var inProgressCommit = {
        additions: ['test'],
        deletions: ['test']
    }
    var emptyInProgressCommit = {
        additions: [],
        deletions: []
    }
    var records = {
        data: [{
            'dcterms:identifier': 'id1'
        }, {
            'dcterms:identifier': 'id2'
        }]
    }
    var fileName = 'fileName';
    var jsonFilter = 'json';
    var differenceObj = {additions: '', deletions: ''};
    var originalIRI = 'originalIRI';
    var anonymous = 'anonymous';
    var classId = 'classId';
    var objectPropertyId = 'objectPropertyId';
    var dataPropertyId = 'dataPropertyId';
    var annotationId = 'annotationId';
    var individualId = 'individualId';
    var restrictionId = 'restrictionId';
    var blankNodeId = '_:b0';
    var blankNodeObj = {
        '@id': blankNodeId
    }
    var index = {
        ontologyId: 0,
        classId: 1,
        dataPropertyId: 2
    }
    var usages = {
        results: {
            bindings: []
        }
    }
    var conceptId = 'conceptId';
    var schemeId = 'schemeId';
    var searchResults = [];
    var searchText = 'searchText';
    var datatypeId = 'datatypeId';
    var annotationId2 = 'annotationId2';
    var classId2 = 'classId2';
    var dataPropertyId2 = 'dataPropertyId2';
    var objectPropertyId2 = 'objectProperty2';
    var individualId2 = 'individualId2';
    var datatypeId2 = 'datatypeId2';
    var irisResponse = {
        annotationProperties: [{localName: annotationId, namespace: annotationId}],
        classes: [{localName: classId, namespace: classId}],
        dataProperties: [{localName: dataPropertyId, namespace: dataPropertyId}],
        objectProperties: [{localName: objectPropertyId, namespace: objectPropertyId}],
        namedIndividuals: [{localName: individualId, namespace: individualId}],
        datatypes: [{localName: datatypeId, namespace: datatypeId}]
    };
    var importedIrisResponse = [{
        id: ontologyId,
        annotationProperties: [{localName: annotationId2, namespace: annotationId2}],
        classes: [{localName: classId2, namespace: classId2}],
        dataProperties: [{localName: dataPropertyId2, namespace: dataPropertyId2}],
        objectProperties: [{localName: objectPropertyId2, namespace: objectPropertyId2}],
        individuals: [{localName: individualId2, namespace: individualId2}],
        datatypes: [{localName: datatypeId2, namespace: datatypeId2}]
    }];
    var classHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var conceptHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var classesWithIndividualsResponse = {
        hierarchy: [],
        index: {}
    };
    var dataPropertyHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var objectPropertyHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var branches = [branch];

    beforeEach(function() {
        module('ontologyManager');
        mockPrefixes();
        mockPropertyManager();
        mockCatalogManager();
        mockUtil();
        mockStateManager();
        mockUtil();
        injectRemoveMatontoFilter();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
            $provide.value('jsonFilter', function() {
                return jsonFilter;
            });
        });

        inject(function(ontologyManagerService, _$httpBackend_, _$q_, _$rootScope_, _catalogManagerService_,
            _stateManagerService_, _prefixes_, _utilService_, _$window_, _$filter_, $httpParamSerializer) {
            ontologyManagerSvc = ontologyManagerService;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            util = _utilService_;
            windowSvc = _$window_;
            filter = _$filter_;
            paramSerializer = $httpParamSerializer;
        });

        catalogManagerSvc.localCatalog = {'@id': catalogId};
        ontologyState = {'@id': 'id'};
        ontologyState[prefixes.ontologyState + 'record'] = [{'@id': recordId}];
        ontologyState[prefixes.ontologyState + 'branch'] = [{'@id': branchId}];
        ontologyState[prefixes.ontologyState + 'commit'] = [{'@id': commitId}];
        ontologyManagerSvc.initialize();
        ontologyObj = {
            '@id': ontologyId,
            '@type': [prefixes.owl + 'Ontology'],
            matonto: {
                originalIRI: originalIRI,
                anonymous: anonymous
            }
        }
        classObj = {
            '@id': classId,
            '@type': [prefixes.owl + 'Class'],
            matonto: {
                originalIRI: classId
            }
        }
        objectPropertyObj = {
            '@id': objectPropertyId,
            '@type': [prefixes.owl + 'ObjectProperty'],
            matonto: {
                originalIRI: objectPropertyId
            }
        }
        objectPropertyObj[prefixes.rdfs + 'domain'] = [{'@id': classId}];
        dataPropertyObj = {
            '@id': dataPropertyId,
            '@type': [prefixes.owl + 'DatatypeProperty'],
            matonto: {
                originalIRI: dataPropertyId
            }
        }
        annotationObj = {
            '@id': annotationId,
            '@type': [prefixes.owl + 'AnnotationProperty'],
            matonto: {
                originalIRI: annotationId
            }
        }
        individualObj = {
            '@id': individualId,
            '@type': [prefixes.owl + 'NamedIndividual', classId],
            matonto: {
                originalIRI: individualId
            }
        }
        restrictionObj = {
            '@id': restrictionId,
            '@type': [prefixes.owl + 'Restriction'],
            matonto: {
                originalIRI: restrictionId
            }
        }
        ontology = [ontologyObj, classObj, dataPropertyObj];
        listItem = {
            ontology: ontology,
            ontologyId: ontologyId,
            recordId: recordId,
            commitId: commitId,
            branchId: branchId,
            branches: [branch],
            index: index,
            upToDate: true
        }
        getResponse = {
            recordId: recordId,
            branchId: branchId,
            commitId: commitId,
            inProgressCommit: inProgressCommit,
            ontology: ontology
        }
        conceptObj = {
            '@id': conceptId,
            '@type': [prefixes.skos + 'Concept'],
            matonto: {
                originalIRI: conceptId
            }
        }
        schemeObj = {
            '@id': schemeId,
            '@type': [prefixes.skos + 'ConceptScheme'],
            matonto: {
                originalIRI: schemeId
            }
        }
        var xsdDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], function(item) {
            return {
                'namespace': prefixes.xsd,
                'localName': item
            }
        });
        var rdfDatatypes = _.map(['langString'], function(item) {
            return {
                namespace: prefixes.rdf,
                localName: item
            }
        });
        defaultDatatypes = _.concat(xsdDatatypes, rdfDatatypes);
    });

    function flushAndVerify() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }

    it('reset should clear the proper variables', function() {
        ontologyManagerSvc.ontologyRecords = ['record'];
        ontologyManagerSvc.list = ['item'];
        ontologyManagerSvc.reset();
        expect(ontologyManagerSvc.ontologyRecords).toEqual([]);
        expect(ontologyManagerSvc.list).toEqual([]);
    });

    describe('getAllOntologyRecords gets a list of all ontology records', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            catalogManagerSvc.getRecords.and.returnValue(getDeferred.promise);
        });
        it('when getRecords resolves', function() {
            getDeferred.resolve(records);
            ontologyManagerSvc.getAllOntologyRecords({})
                .then(function(response) {
                    expect(catalogManagerSvc.getRecords).toHaveBeenCalled();
                    expect(response).toEqual(records.data);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
        });
        it('when getRecords rejects', function() {
            getDeferred.reject(error);
            ontologyManagerSvc.getAllOntologyRecords({})
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(catalogManagerSvc.getRecords).toHaveBeenCalled();
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });

    describe('uploadFile hits the proper endpoint', function() {
        it('with description and keywords', function() {
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadFile(file, title, description, keywords)
                .then(function() {
                    expect(true).toBe(true);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('with no description or keywords', function() {
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadFile(file, title)
                .then(function() {
                    expect(true).toBe(true);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
    });

    describe('getOntology calls the correct methods', function() {
        var resourceDeferred, expected;
        beforeEach(function() {
            resourceDeferred = $q.defer();
            catalogManagerSvc.getResource.and.returnValue(resourceDeferred.promise);
            expected = {
                recordId: recordId,
                ontology: ontology,
                branchId: branchId,
                commitId: commitId,
                inProgressCommit: inProgressCommit
            }
        });
        describe('if state exists', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
                stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
            });
            describe('and getInProgressCommit is resolved', function() {
                beforeEach(function() {
                    getDeferred.resolve(inProgressCommit);
                });
                it('and getResource is resolved', function() {
                    resourceDeferred.resolve(ontology);
                    ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                        expect(response).toEqual(expected);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                        true, format);
                    expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                });
                describe('and getResource is rejected', function() {
                    var deleteDeferred;
                    beforeEach(function() {
                        resourceDeferred.reject(error);
                        deleteDeferred = $q.defer();
                        stateManagerSvc.deleteOntologyState.and.returnValue(deleteDeferred.promise);
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        var masterDeferred;
                        beforeEach(function() {
                            deleteDeferred.resolve();
                            masterDeferred = $q.defer();
                            catalogManagerSvc.getRecordMasterBranch.and.returnValue(masterDeferred.promise);
                        });
                        describe('and getMasterBranch is resolved', function() {
                            var commitDeferred;
                            beforeEach(function() {
                                masterDeferred.resolve({'@id': branchId});
                                commitDeferred = $q.defer();
                                catalogManagerSvc.getBranchHeadCommit.and.returnValue(commitDeferred.promise);
                            });
                            describe('and getBranchHeadCommit is resolved', function() {
                                var createDeferred, expected2;
                                var commitId2 = 'commitId2';
                                var commitObj2 = {
                                    commit: {
                                        '@id': commitId2
                                    }
                                }
                                beforeEach(function() {
                                    expected2 = {
                                        recordId: recordId,
                                        ontology: ontology,
                                        branchId: branchId,
                                        commitId: commitId2,
                                        inProgressCommit: inProgressCommit
                                    }
                                    commitDeferred.resolve(commitObj2);
                                    createDeferred = $q.defer();
                                    stateManagerSvc.createOntologyState.and.returnValue(createDeferred.promise);
                                });
                                describe('and createOntologyState is resolved', function() {
                                    var firstTime;
                                    beforeEach(function() {
                                        firstTime = true;
                                        createDeferred.resolve();
                                    });
                                    it('and getResource is resolved', function() {
                                        catalogManagerSvc.getResource.and.callFake(function(cId, bId, rId, catId, apply, format) {
                                            return (cId === commitId) ? $q.reject() : $q.resolve(ontology);
                                        });
                                        ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                                            _.set(expected2, 'inProgressCommit', emptyInProgressCommit);
                                            expect(response).toEqual(expected2);
                                        }, function() {
                                            fail('Promise should have resolved');
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                                            true, format);
                                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                            catalogId);
                                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                            commitId2);
                                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId2, branchId, recordId,
                                            catalogId, false, format);
                                    });
                                    it('and getResource is rejected', function() {
                                        catalogManagerSvc.getResource.and.returnValue($q.reject(error));
                                        ontologyManagerSvc.getOntology(recordId, format).then(function() {
                                            fail('Promise should have rejected');
                                        }, function(response) {
                                            expect(response).toEqual(error);
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                                            true, format);
                                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                            catalogId);
                                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                            commitId2);
                                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId2, branchId, recordId,
                                            catalogId, false, format);
                                    });
                                });
                                it('and createOntologyState is rejected', function() {
                                    createDeferred.reject(error);
                                    ontologyManagerSvc.getOntology(recordId, format).then(function() {
                                        fail('Promise should have rejected');
                                    }, function(response) {
                                        expect(response).toEqual(error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                                        true, format);
                                    expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                        catalogId);
                                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId2);
                                });
                            });
                            it('and getBranchHeadCommit is rejected', function() {
                                commitDeferred.reject(error);
                                ontologyManagerSvc.getOntology(recordId, format).then(function() {
                                    fail('Promise should have rejected');
                                }, function(response) {
                                    expect(response).toEqual(error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                                    true, format);
                                expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId, catalogId);
                            });
                        });
                        it('and getMasterBranch is rejected', function() {
                            masterDeferred.reject(error);
                            ontologyManagerSvc.getOntology(recordId, format).then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                                true, format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
                        });
                    });
                    it('and deleteOntologyState is rejected', function() {
                        deleteDeferred.reject(error);
                        stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                        ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                            true, format);
                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                });
            });
            describe('and getInProgressCommit is rejected', function() {
                describe('with message "User has no InProgressCommit"', function() {
                    beforeEach(function() {
                        getDeferred.reject('User has no InProgressCommit');
                    });
                    it('and getResource is resolved', function() {
                        resourceDeferred.resolve(ontology);
                        stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                        ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                            _.set(expected, 'inProgressCommit', emptyInProgressCommit);
                            expect(response).toEqual(expected);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId,
                            catalogId, false, format);
                    });
                    it('and getResource is rejected', function() {
                        resourceDeferred.reject(error);
                        stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                        ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId,
                            catalogId, false, format);
                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                });
                it('with other message', function() {
                    getDeferred.reject(error);
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                    ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                    scope.$apply();
                    expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                });
            });
        });
        describe('if state does not exist', function() {
            var masterDeferred;
            beforeEach(function() {
                masterDeferred = $q.defer();
                catalogManagerSvc.getRecordMasterBranch.and.returnValue(masterDeferred.promise);
            });
            describe('and getMasterBranch is resolved', function() {
                var commitDeferred;
                beforeEach(function() {
                    masterDeferred.resolve({'@id': branchId});
                    commitDeferred = $q.defer();
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue(commitDeferred.promise);
                });
                describe('and getBranchHeadCommit is resolved', function() {
                    var createDeferred;
                    beforeEach(function() {
                        commitDeferred.resolve(commitObj);
                        createDeferred = $q.defer();
                        stateManagerSvc.createOntologyState.and.returnValue(createDeferred.promise);
                    });
                    describe('and createOntologyState is resolved', function() {
                        var resourceDeferred;
                        beforeEach(function() {
                            createDeferred.resolve();
                            resourceDeferred = $q.defer();
                            catalogManagerSvc.getResource.and.returnValue(resourceDeferred.promise);
                        });
                        it('and getResource is resolved', function() {
                            resourceDeferred.resolve(ontology);
                            ontologyManagerSvc.getOntology(recordId, format).then(function(response) {
                                _.set(expected, 'inProgressCommit', emptyInProgressCommit);
                                expect(response).toEqual(expected);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                catalogId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                commitId);
                            expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId,
                                catalogId, false, format);
                        });
                        it('and getResource is rejected', function() {
                            resourceDeferred.reject(error);
                            ontologyManagerSvc.getOntology(recordId, format).then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                catalogId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                commitId);
                            expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId,
                                catalogId, false, format);
                        });
                    });
                    it('and createOntologyState is rejected', function() {
                        createDeferred.reject(error);
                        ontologyManagerSvc.getOntology(recordId, format).then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                            catalogId);
                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                        expect(catalogManagerSvc.getResource).not.toHaveBeenCalled();
                    });
                });
                it('and getBranchHeadCommit is rejected', function() {
                    commitDeferred.reject(error);
                    ontologyManagerSvc.getOntology(recordId, format).then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId, catalogId);
                    expect(catalogManagerSvc.getResource).not.toHaveBeenCalled();
                });
            });
            it('and getMasterBranch is rejected', function() {
                masterDeferred.reject(error);
                ontologyManagerSvc.getOntology(recordId, format).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
                scope.$apply();
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getResource).not.toHaveBeenCalled();
            });
        });
    });

    describe('uploadThenGet should call the proper methods', function() {
        var uploadDeferred;
        beforeEach(function() {
            uploadDeferred = $q.defer();
            spyOn(ontologyManagerSvc, 'uploadFile').and.returnValue(uploadDeferred.promise);
        });
        describe('when uploadFile resolves', function() {
            var resolvedResponse = {
                data: {
                    recordId: recordId,
                    ontologyId: ontologyId
                }
            }
            var getDeferred;
            beforeEach(function() {
                uploadDeferred.resolve(resolvedResponse);
                getDeferred = $q.defer();
                spyOn(ontologyManagerSvc, 'getOntology').and.returnValue(getDeferred.promise);
            });
            describe('and getOntology resolves', function() {
                beforeEach(function() {
                    getDeferred.resolve(getResponse);
                });
                describe('and type is "ontology"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyManagerSvc, 'addOntologyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addOntologyToList resolves', function() {
                        addDeferred.resolve();
                        ontologyManagerSvc.uploadThenGet({}, title, description, keywords, ontologyType)
                            .then(function(response) {
                                expect(ontologyManagerSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit);
                                expect(response).toEqual(recordId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addOntologyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyManagerSvc.uploadThenGet({}, title, description, keywords, ontologyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyManagerSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                describe('and type is "vocabulary"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyManagerSvc, 'addVocabularyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addOntologyToList resolves', function() {
                        addDeferred.resolve();
                        ontologyManagerSvc.uploadThenGet({}, title, description, keywords, vocabularyType)
                            .then(function(response) {
                                expect(ontologyManagerSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit);
                                expect(response).toEqual(recordId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addOntologyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyManagerSvc.uploadThenGet({}, title, description, keywords, vocabularyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyManagerSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
            });
            it('and getOntology rejects', function() {
                getDeferred.reject(error);
                ontologyManagerSvc.uploadThenGet({}, title, description, keywords)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
        it('when uploadFile rejects', function() {
            uploadDeferred.reject(error);
            ontologyManagerSvc.uploadThenGet({}, title, description, keywords)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });

    describe('updateOntology should call the proper methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            catalogManagerSvc.getResource.and.returnValue(getDeferred.promise);
        });
        describe('and getResource resolves', function() {
            beforeEach(function() {
                getDeferred.resolve(ontology);
                spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            });
            describe('and type is "ontology"', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    spyOn(ontologyManagerSvc, 'createOntologyListItem').and.returnValue(createDeferred.promise);
                });
                describe('and createOntologyListItem resolves', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        createDeferred.resolve();
                        updateDeferred = $q.defer();
                        stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                    });
                    it('and updateOntologyState resolves', function() {
                        updateDeferred.resolve();
                        ontologyManagerSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.upToDate)
                            .then(function(response) {
                                expect(ontologyManagerSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                    commitId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and updateOntologyState rejects', function() {
                        updateDeferred.reject(error);
                        ontologyManagerSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.upToDate)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyManagerSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                    commitId);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                it('and createOntologyListItem rejects', function() {
                    createDeferred.reject(error);
                    ontologyManagerSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(ontologyManagerSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                                branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
            describe('and type is "vocabulary"', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    spyOn(ontologyManagerSvc, 'createVocabularyListItem').and.returnValue(createDeferred.promise);
                });
                describe('and createVocabularyListItem resolves', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        createDeferred.resolve();
                        updateDeferred = $q.defer();
                        stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                    });
                    it('and updateOntologyState resolves', function() {
                        updateDeferred.resolve();
                        ontologyManagerSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.upToDate)
                            .then(function(response) {
                                expect(ontologyManagerSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                    commitId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and updateOntologyState rejects', function() {
                        updateDeferred.reject(error);
                        ontologyManagerSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.upToDate)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyManagerSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId,
                                    commitId);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                it('and createVocabularyListItem rejects', function() {
                    createDeferred.reject(error);
                    ontologyManagerSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(ontologyManagerSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId,
                                recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
        });
        it('and getResource rejects', function() {
            getDeferred.reject(error);
            ontologyManagerSvc.updateOntology(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                        false);
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });

    describe('openOntology should call the proper methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            spyOn(ontologyManagerSvc, 'getOntology').and.returnValue(getDeferred.promise);
        });
        describe('and getOntology resolves', function() {
            var branchDeferred;
            beforeEach(function() {
                branchDeferred = $q.defer();
                catalogManagerSvc.getBranchHeadCommit.and.returnValue(branchDeferred.promise);
                getDeferred.resolve(getResponse);
            });
            describe('and getBranchHeadCommit resolves', function() {
                beforeEach(function() {
                    branchDeferred.resolve(commitObj);
                    spyOn(ontologyManagerSvc, 'getOntologyIRI').and.returnValue(ontologyId);
                });
                describe('and type is "ontology"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyManagerSvc, 'addOntologyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addOntologyToList resolves', function() {
                        addDeferred.resolve();
                        ontologyManagerSvc.openOntology(recordId, ontologyType)
                            .then(function(response) {
                                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                                expect(ontologyManagerSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit, true);
                                expect(response).toEqual(ontologyId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addOntologyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyManagerSvc.openOntology(recordId, ontologyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                                expect(ontologyManagerSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit, true);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                describe('and type is "vocabulary"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyManagerSvc, 'addVocabularyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addVocabularyToList resolves', function() {
                        addDeferred.resolve();
                        ontologyManagerSvc.openOntology(recordId, vocabularyType)
                            .then(function(response) {
                                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyManagerSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit, true);
                                expect(response).toEqual(ontologyId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addVocabularyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyManagerSvc.openOntology(recordId, vocabularyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyManagerSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit, true);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
            });
            it('and getBranchHeadCommit rejects', function() {
                branchDeferred.reject(error);
                ontologyManagerSvc.openOntology(recordId)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId,
                            catalogId);
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
        it('and getOntology rejects', function() {
            getDeferred.reject(error);
            ontologyManagerSvc.openOntology(recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });

    it('closeOntology removes the correct object from the list', function() {
        ontologyManagerSvc.list = [{recordId: recordId}];
        ontologyManagerSvc.closeOntology(recordId);
        expect(ontologyManagerSvc.list).toEqual([]);
    });

    it('removeBranch removes the correct object from the branches list', function() {
        spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
        ontologyManagerSvc.removeBranch(recordId, branchId);
        expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        expect(listItem.branches).toEqual([]);
    });

    describe('getPreview should call the correct methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            spyOn(ontologyManagerSvc, 'getOntology').and.returnValue(getDeferred.promise);
        });
        describe('when getOntology resolves', function() {
            beforeEach(function() {
                getDeferred.resolve(getResponse);
            });
            it('and rdfFormat is jsonld', function() {
                ontologyManagerSvc.getPreview(recordId, format)
                    .then(function(response) {
                        expect(response).toEqual(jsonFilter);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
            it('and rdfFormat is not jsonld', function() {
                ontologyManagerSvc.getPreview(recordId, 'other')
                    .then(function(response) {
                        expect(response).toEqual(ontology);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
        });
        it('when getOntology rejects', function() {
            getDeferred.reject(error);
            ontologyManagerSvc.getPreview(recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });

    describe('saveChanges should call the correct methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
        });
        describe('when getInProgressCommit resolves', function() {
            var updateDeferred;
            beforeEach(function() {
                updateDeferred = $q.defer();
                catalogManagerSvc.updateInProgressCommit.and.returnValue(updateDeferred.promise);
                getDeferred.resolve();
            });
            it('and updateInProgressCommit resolves', function() {
                var resolved = 'this';
                updateDeferred.resolve(resolved);
                ontologyManagerSvc.saveChanges(recordId, differenceObj)
                    .then(function(response) {
                        expect(response).toEqual(resolved);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
            it('and updateInProgressCommit rejects', function() {
                updateDeferred.reject(error);
                ontologyManagerSvc.saveChanges(recordId, differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
        describe('when getInProgressCommit rejects', function() {
            describe('and the error message is "User has no InProgressCommit"', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    catalogManagerSvc.createInProgressCommit.and.returnValue(createDeferred.promise);
                    getDeferred.reject('User has no InProgressCommit');
                });
                describe('and createInProgressCommit resolves', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        updateDeferred = $q.defer();
                        catalogManagerSvc.updateInProgressCommit.and.returnValue(updateDeferred.promise);
                        createDeferred.resolve();
                    });
                    it('and updateInProgressCommit resolves', function() {
                        var resolved = 'this';
                        updateDeferred.resolve(resolved);
                        ontologyManagerSvc.saveChanges(recordId, differenceObj)
                            .then(function(response) {
                                expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId,
                                    catalogId);
                                expect(response).toEqual(resolved);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and updateInProgressCommit rejects', function() {
                        updateDeferred.reject(error);
                        ontologyManagerSvc.saveChanges(recordId, differenceObj)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId,
                                    catalogId);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                it('and createInProgressCommit rejects', function() {
                    createDeferred.reject(error);
                    ontologyManagerSvc.saveChanges(recordId, differenceObj)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId,
                                catalogId);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
            it('and the error message is not "User has no InProgressCommit"', function() {
                getDeferred.reject(error);
                ontologyManagerSvc.saveChanges(recordId, differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
    });

    describe('addToAdditions should call the correct functions', function() {
        it('when entity is in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': [{'@id': 'id'}]};
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyManagerSvc.addToAdditions(recordId, statement);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
        it('when entity is not in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': []};
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyManagerSvc.addToAdditions(recordId, statement);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
    });

    describe('addToDeletions should call the correct functions', function() {
        it('when entity is in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': [{'@id': 'id'}]};
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyManagerSvc.addToDeletions(recordId, statement);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
        it('when entity is not in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': []};
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyManagerSvc.addToDeletions(recordId, statement);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
    });

    describe('getListItemByRecordId should return the correct object', function() {
        beforeEach(function() {
            ontologyManagerSvc.list = [listItem];
        });
        it('when the ontologyId is in the list', function() {
            expect(ontologyManagerSvc.getListItemByRecordId(recordId)).toEqual(listItem);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyManagerSvc.getListItemByRecordId('other')).toEqual(undefined);
        });
    });

    describe('getOntologyByRecordId should return the correct object', function() {
        it('when the ontologyId is in the list', function() {
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyManagerSvc.getOntologyByRecordId(recordId)).toEqual(listItem.ontology);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyManagerSvc.getOntologyByRecordId('other')).toEqual([]);
        });
    });

    describe('isOntology should return', function() {
        it('true if the entity contains the ontology type', function() {
            expect(ontologyManagerSvc.isOntology(ontologyObj)).toBe(true);
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(ontologyManagerSvc.isOntology({})).toBe(false);
        });
    });

    describe('hasOntologyEntity should return', function() {
        it('true if there is an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.hasOntologyEntity([ontologyObj])).toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.hasOntologyEntity([])).toBe(false);
        });
    });

    describe('getOntologyEntity should return', function() {
        it('correct object if there is an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.getOntologyEntity([ontologyObj])).toBe(ontologyObj);
        });
        it('undefined if there is not an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.getOntologyEntity([])).toBe(undefined);
        });
    });

    describe('getOntologyIRI should return', function() {
        it('@id if there is an ontology entity in the ontology with @id', function() {
            expect(ontologyManagerSvc.getOntologyIRI([ontologyObj])).toBe(ontologyId);
        });
        it('matonto.originalIRI if there is an ontology entity without @id', function() {
            var obj = {
                '@type': prefixes.owl + 'Ontology',
                matonto: {
                    originalIRI: originalIRI,
                    anonymous: anonymous
                }
            }
            expect(ontologyManagerSvc.getOntologyIRI([obj])).toBe(originalIRI);
        });
        it('matonto.anonymous if there is an ontology entity without @id and matonto.originalIRI', function() {
            var obj = {
                '@type': prefixes.owl + 'Ontology',
                matonto: {
                    anonymous: anonymous
                }
            }
            expect(ontologyManagerSvc.getOntologyIRI([obj])).toBe(anonymous);
        });
        it('"" if none are present or no ontology entity', function() {
            expect(ontologyManagerSvc.getOntologyIRI([])).toBe('');
        });
    });

    describe('createOntology calls the correct methods', function() {
        describe('when post succeeds', function() {
            describe('with description and keywords', function() {
                var getDeferred, params;
                beforeEach(function() {
                    getDeferred = $q.defer();
                    catalogManagerSvc.getRecordBranch.and.returnValue(getDeferred.promise);
                    params = paramSerializer({
                        title: title,
                        description: description,
                        keywords: keywords
                    });
                    ontologyManagerSvc.list = [];
                });
                it('and getRecordBranch resolves', function() {
                    getDeferred.resolve(branch);
                    $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj, function(headers) {
                        return headers['Content-Type'] === 'application/json';
                    }).respond(200, {ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    ontologyManagerSvc.createOntology(ontologyObj, title, description, keywords)
                        .then(function(response) {
                            expect(response).toEqual({entityIRI: ontologyObj['@id'], recordId: recordId, branchId: branchId,
                                commitId: commitId});
                            expect(ontologyManagerSvc.list.length).toBe(1);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify();
                });
                it('and getRecordBranch rejects', function() {
                    getDeferred.reject(error);
                    $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj, function(headers) {
                        return headers['Content-Type'] === 'application/json';
                    }).respond(200, {ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    ontologyManagerSvc.createOntology(ontologyObj, title, description, keywords)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    flushAndVerify();
                });
            });
            describe('with no description and keywords', function() {
                var getDeferred, params;
                beforeEach(function() {
                    getDeferred = $q.defer();
                    catalogManagerSvc.getRecordBranch.and.returnValue(getDeferred.promise);
                    params = paramSerializer({title: title});
                    ontologyManagerSvc.list = [];
                });
                it('and getRecordBranch resolves', function() {
                    getDeferred.resolve(branch);
                    $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj, function(headers) {
                        return headers['Content-Type'] === 'application/json';
                    }).respond(200, {ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    ontologyManagerSvc.createOntology(ontologyObj, title)
                        .then(function(response) {
                            expect(response).toEqual({entityIRI: ontologyObj['@id'], recordId: recordId, branchId: branchId,
                                commitId: commitId});
                            expect(ontologyManagerSvc.list.length).toBe(1);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify();
                });
                it('and getRecordBranch rejects', function() {
                    getDeferred.reject(error);
                    $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj, function(headers) {
                        return headers['Content-Type'] === 'application/json';
                    }).respond(200, {ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    ontologyManagerSvc.createOntology(ontologyObj, title)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    flushAndVerify();
                });
            });
        });
        it('when post fails', function() {
            $httpBackend.expectPOST('/matontorest/ontologies', ontologyObj, function(headers) {
                return headers['Content-Type'] === 'application/json';
            }).respond(400, null, null, error);
            ontologyManagerSvc.createOntology(ontologyObj, title)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
        });
    });

    describe('isClass should return', function() {
        it('true if the entity contains the class type', function() {
            expect(ontologyManagerSvc.isClass(classObj)).toBe(true);
        });
        it('false if the entity does not contain the class type', function() {
            expect(ontologyManagerSvc.isClass({})).toBe(false);
        });
    });

    describe('hasClasses should return', function() {
        it('true if there are any class entities in the ontology', function() {
            expect(ontologyManagerSvc.hasClasses([classObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any class entities in the ontology', function() {
            expect(ontologyManagerSvc.hasClasses([ontologyObj])).toBe(false);
        });
    });

    describe('getClasses should return', function() {
        it('correct class objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getClasses([classObj, ontologyObj])).toEqual([classObj]);
        });
        it('undefined if there are no classes in the ontology', function() {
            expect(ontologyManagerSvc.getClasses([ontologyObj])).toEqual([]);
        });
    });

    describe('getClassIRIs should return', function() {
        it('classId if there are classes in the ontology', function() {
            expect(ontologyManagerSvc.getClassIRIs([ontologyObj, classObj])).toEqual([classId]);
        });
        it('[] if there are no classes in the ontology', function() {
            expect(ontologyManagerSvc.getClassIRIs([ontologyObj])).toEqual([]);
        });
    });

    describe('hasClassProperties should return', function() {
        it('true if there are any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.hasClassProperties([classObj, ontologyObj, objectPropertyObj], classId))
                .toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.hasClassProperties([classObj, ontologyObj], classId)).toBe(false);
        });
    });

    describe('getClassProperties should return', function() {
        it('correct objects if there are any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassProperties([classObj, ontologyObj, objectPropertyObj], classId))
                .toEqual([objectPropertyObj]);
        });
        it('[] if there are no entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassProperties([classObj, ontologyObj], classId)).toEqual([]);
        });
    });

    describe('getClassPropertyIRIs should return', function() {
        it('correct IRIs if there are any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassPropertyIRIs([classObj, ontologyObj, objectPropertyObj], classId))
                .toEqual([objectPropertyId]);
        });
        it('[] if there are not any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassPropertyIRIs([classObj, ontologyObj], classId)).toEqual([]);
        });
    });

    describe('isObjectProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(ontologyManagerSvc.isObjectProperty(objectPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the object property type', function() {
            expect(ontologyManagerSvc.isObjectProperty({})).toBe(false);
        });
    });

    describe('isDataTypeProperty should return', function() {
        it('true if the entity contains the data property type', function() {
            expect(ontologyManagerSvc.isDataTypeProperty(dataPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the data property type', function() {
            expect(ontologyManagerSvc.isDataTypeProperty({})).toBe(false);
        });
    });

    describe('isProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(ontologyManagerSvc.isProperty(objectPropertyObj)).toBe(true);
        });
        it('true if the entity contains the data property type', function() {
            expect(ontologyManagerSvc.isProperty(dataPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the object or data property type', function() {
            expect(ontologyManagerSvc.isProperty({})).toBe(false);
        });
    });

    describe('hasNoDomainProperties should return', function() {
        it('true if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([ontologyObj, dataPropertyObj])).toBe(true);
        });
        it('false if the ontology does not contain any properties', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([ontologyObj])).toBe(false);
        });
        it('false if the ontology does not contain any properties without rdfs:domains', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([ontologyObj, objectPropertyObj])).toBe(false);
        });
    });

    describe('getNoDomainProperties should return', function() {
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([ontologyObj, dataPropertyObj])).toEqual([dataPropertyObj]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([ontologyObj])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([ontologyObj, objectPropertyObj])).toEqual([]);
        });
    });

    describe('getNoDomainPropertyIRIs should return', function() {
        it('correct IRI if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([ontologyObj, dataPropertyObj]))
                .toEqual([dataPropertyId]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([ontologyObj])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([ontologyObj, objectPropertyObj])).toEqual([]);
        });
    });

    describe('hasObjectProperties should return', function() {
        it('true if there are any object property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasObjectProperties([objectPropertyObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any object property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasObjectProperties([ontologyObj])).toBe(false);
        });
    });

    describe('getObjectProperties should return', function() {
        it('correct object property objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getObjectProperties([objectPropertyObj, ontologyObj]))
                .toEqual([objectPropertyObj]);
        });
        it('undefined if there are no object properties in the ontology', function() {
            expect(ontologyManagerSvc.getObjectProperties([ontologyObj])).toEqual([]);
        });
    });

    describe('getObjectPropertyIRIs should return', function() {
        it('objectPropertyId if there are object properties in the ontology', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([ontologyObj, objectPropertyObj]))
                .toEqual([objectPropertyId]);
        });
        it('[] if there are no object properties in the ontology', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([ontologyObj])).toEqual([]);
        });
    });

    describe('hasDataTypeProperties should return', function() {
        it('true if there are any data property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasDataTypeProperties([dataPropertyObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any data property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasDataTypeProperties([ontologyObj])).toBe(false);
        });
    });

    describe('getDataTypeProperties should return', function() {
        it('correct data property objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([dataPropertyObj, ontologyObj]))
                .toEqual([dataPropertyObj]);
        });
        it('undefined if there are no data properties in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([ontologyObj])).toEqual([]);
        });
    });

    describe('getDataTypePropertyIRIs should return', function() {
        it('dataPropertyId if there are data properties in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([ontologyObj, dataPropertyObj]))
                .toEqual([dataPropertyId]);
        });
        it('[] if there are no data properties in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([ontologyObj])).toEqual([]);
        });
    });

    describe('isAnnotation should return', function() {
        it('true if the entity contains the annotation property type', function() {
            expect(ontologyManagerSvc.isAnnotation(annotationObj)).toBe(true);
        });
        it('false if the entity does not contain the annotation property type', function() {
            expect(ontologyManagerSvc.isAnnotation({})).toBe(false);
        });
    });

    describe('hasAnnotations should return', function() {
        it('true if there are any annotation entities in the ontology', function() {
            expect(ontologyManagerSvc.hasAnnotations([annotationObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any annotation entities in the ontology', function() {
            expect(ontologyManagerSvc.hasAnnotations([ontologyObj])).toBe(false);
        });
    });

    describe('getAnnotations should return', function() {
        it('correct annotation objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotations([annotationObj, ontologyObj])).toEqual([annotationObj]);
        });
        it('undefined if there are no annotations in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotations([ontologyObj])).toEqual([]);
        });
    });

    describe('getAnnotationIRIs should return', function() {
        it('annotationId if there are annotations in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([ontologyObj, annotationObj])).toEqual([annotationId]);
        });
        it('[] if there are no annotations in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([ontologyObj])).toEqual([]);
        });
    });

    describe('isIndividual should return', function() {
        it('true if the entity contains the named individual type', function() {
            expect(ontologyManagerSvc.isIndividual(individualObj)).toBe(true);
        });
        it('false if the entity does not contain the named individual type', function() {
            expect(ontologyManagerSvc.isIndividual({})).toBe(false);
        });
    });

    describe('hasIndividuals should return', function() {
        it('true if there are any individual entities in the ontology', function() {
            expect(ontologyManagerSvc.hasIndividuals([individualObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any individual entities in the ontology', function() {
            expect(ontologyManagerSvc.hasIndividuals([ontologyObj])).toBe(false);
        });
    });

    describe('getIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getIndividuals([individualObj, ontologyObj])).toEqual([individualObj]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(ontologyManagerSvc.getIndividuals([ontologyObj])).toEqual([]);
        });
    });

    describe('hasNoTypeIndividuals should return', function() {
        it('true if there are any in the ontology with no other @type', function() {
            var diffIndividualObj = {
                '@id': individualId,
                '@type': [prefixes.owl + 'NamedIndividual'],
                matonto: {
                    originalIRI: originalIRI
                }
            }
            expect(ontologyManagerSvc.hasNoTypeIndividuals([diffIndividualObj, ontologyObj])).toBe(true);
        });
        it('false if there are no individuals in the ontology with no other @type', function() {
            expect(ontologyManagerSvc.hasNoTypeIndividuals([ontologyObj, individualObj])).toBe(false);
        });
        it('false if there are no individuals in the ontology', function() {
            expect(ontologyManagerSvc.hasNoTypeIndividuals([ontologyObj])).toBe(false);
        });
    });

    describe('getNoTypeIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology with no other @type', function() {
            var diffIndividualObj = {
                '@id': individualId,
                '@type': [prefixes.owl + 'NamedIndividual'],
                matonto: {
                    originalIRI: originalIRI
                }
            }
            expect(ontologyManagerSvc.getNoTypeIndividuals([diffIndividualObj, ontologyObj]))
                .toEqual([diffIndividualObj]);
        });
        it('undefined if there are no individuals in the ontology with no other @type', function() {
            expect(ontologyManagerSvc.getNoTypeIndividuals([ontologyObj, individualObj])).toEqual([]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(ontologyManagerSvc.getNoTypeIndividuals([ontologyObj])).toEqual([]);
        });
    });

    describe('hasClassIndividuals should return', function() {
        it('true if there are any entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.hasClassIndividuals([individualObj, ontologyObj, objectPropertyObj], classId))
                .toBe(true);
        });
        it('false if there are no entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.hasClassIndividuals([classObj, ontologyObj], classId)).toBe(false);
        });
    });

    describe('getClassIndividuals should return', function() {
        it('correct object if there are any entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassIndividuals([individualObj, ontologyObj, objectPropertyObj], classId))
                .toEqual([individualObj]);
        });
        it('[] if there are no entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassIndividuals([classObj, ontologyObj], classId)).toEqual([]);
        });
    });

    describe('isRestriction should return', function() {
        it('true if the entity contains the restriction type', function() {
            expect(ontologyManagerSvc.isRestriction(restrictionObj)).toBe(true);
        });
        it('false if the entity does not contain the restriction type', function() {
            expect(ontologyManagerSvc.isRestriction({})).toBe(false);
        });
    });

    describe('getRestrictions should return', function() {
        it('correct restriction objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getRestrictions([restrictionObj, ontologyObj])).toEqual([restrictionObj]);
        });
        it('undefined if there are no restrictions in the ontology', function() {
            expect(ontologyManagerSvc.getRestrictions([ontologyObj])).toEqual([]);
        });
    });

    describe('isBlankNode should return', function() {
        it('true if the entity contains the a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNode(blankNodeObj)).toBe(true);
        });
        it('false if the entity does not contain a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNode({})).toBe(false);
        });
    });

    describe('getBlankNodes should return', function() {
        it('correct blank node objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getBlankNodes([blankNodeObj, ontologyObj])).toEqual([blankNodeObj]);
        });
        it('undefined if there are no blank nodes in the ontology', function() {
            expect(ontologyManagerSvc.getBlankNodes([ontologyObj])).toEqual([]);
        });
    });

    describe('getEntity returns', function() {
        it('object when present', function() {
            expect(ontologyManagerSvc.getEntity([classObj, ontologyObj], classId)).toEqual(classObj);
        });
        it('undefined when not present', function() {
            expect(ontologyManagerSvc.getEntity([], classId)).toBe(undefined);
        });
    });

    describe('getEntity returns', function() {
        it('object when present', function() {
            expect(ontologyManagerSvc.getEntity([classObj, ontologyObj], classId)).toEqual(classObj);
        });
        it('undefined when not present', function() {
            expect(ontologyManagerSvc.getEntity([], classId)).toBe(undefined);
        });
    });

    describe('getEntityByRecordId returns', function() {
        it('object when present using index', function() {
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyManagerSvc.getEntityByRecordId(recordId, classId)).toEqual(classObj);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('object when present not using index', function() {
            var diffListItem = {
                ontology: ontology,
                ontologyId: ontologyId,
                recordId: recordId,
                commitId: commitId,
                branchId: branchId,
                branches: [branch]
            }
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.returnValue(diffListItem);
            spyOn(ontologyManagerSvc, 'getEntity').and.callThrough();
            expect(ontologyManagerSvc.getEntityByRecordId(recordId, classId)).toEqual(classObj);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith(ontology, classId);
        });
        it('undefined when not present', function() {
            spyOn(ontologyManagerSvc, 'getListItemByRecordId').and.callThrough();
            expect(ontologyManagerSvc.getEntityByRecordId('', classId)).toEqual(undefined);
            expect(ontologyManagerSvc.getListItemByRecordId).toHaveBeenCalledWith('');
        });
    });

    it('removeEntity removes the entity from the provided ontology and index', function() {
        expect(ontologyManagerSvc.removeEntity(listItem, classId)).toEqual(classObj);
        expect(_.has(listItem.index, classId)).toBe(false);
        expect(listItem.index.dataPropertyId).toEqual(1);
    });

    it('addEntity adds the entity to the provided ontology and index', function() {
        ontologyManagerSvc.addEntity(listItem, individualObj);
        expect(ontology.length).toBe(4);
        expect(ontology[3]).toEqual(individualObj);
        expect(_.has(listItem.index, individualId)).toBe(true);
        expect(listItem.index[individualId]).toEqual(3);
    });

    describe('getEntityName should return', function() {
        it('returns the rdfs:label if present', function() {
            util.getPropertyValue.and.returnValue(title);
            expect(ontologyManagerSvc.getEntityName({})).toEqual(title);
            expect(util.getPropertyValue).toHaveBeenCalledWith({}, prefixes.rdfs + 'label');
        });
        it('returns the dcterms:title if present and no rdfs:label', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue(title);
            var entity = {};
            expect(ontologyManagerSvc.getEntityName(entity)).toEqual(title);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
        });
        it('returns the dc:title if present and no rdfs:label or dcterms:title', function() {
            util.getPropertyValue.and.callFake(function(entity, property) {
                return (property === prefixes.dc + 'title') ? title : '';
            });
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            expect(ontologyManagerSvc.getEntityName(entity)).toEqual(title);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'title');
        });
        it('returns the @id if present and no rdfs:label, dcterms:title, or dc:title', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue('');
            util.getBeautifulIRI.and.returnValue(ontologyId);
            var entity = {'@id': ontologyId};
            expect(ontologyManagerSvc.getEntityName(entity)).toEqual(ontologyId);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'title');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith(ontologyId);
        });
        it('returns matonto.anonymous if present and no rdfs:label, dcterms:title, dc:title, or @id', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue('');
            var entity = {matonto: {anonymous: anonymous}};
            expect(ontologyManagerSvc.getEntityName(entity)).toEqual(anonymous);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'title');
        });
        it('returns "" if no rdfs:label, dcterms:title, dc:title, @id, or matonto.anonymous', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            expect(ontologyManagerSvc.getEntityName(entity)).toEqual('');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'title');
        });
        it('when type is vocabulary, returns skos:prefLabel if present', function() {
            util.getPropertyValue.and.callFake(function(entity, property) {
                return (property === prefixes.skos + 'prefLabel') ? title : '';
            });
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            ontologyManagerSvc.getEntityName(entity, 'vocabulary');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.skos + 'prefLabel');
        });
        it('when type is vocabulary, returns skos:altLabel if present and no skos:prefLabel', function() {
            util.getPropertyValue.and.callFake(function(entity, property) {
                return (property === prefixes.skos + 'altLabel') ? title : '';
            });
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            ontologyManagerSvc.getEntityName(entity, 'vocabulary');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'label');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.skos + 'prefLabel');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.skos + 'altLabel');
        });
    });

    describe('getEntityDescription should return', function() {
        it('rdfs:comment if present', function() {
            util.getPropertyValue.and.returnValue(description);
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual(description);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'comment');
        });
        it('dcterms:description if present and no rdfs:comment', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue(description);
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual(description);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'comment');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'description');
        });
        it('dc:description if present and no rdfs:comment or dcterms:description', function() {
            util.getPropertyValue.and.callFake(function(entity, property) {
                return (property === prefixes.dc + 'description') ? description : '';
            });
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual(description);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'comment');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'description');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'description');
        });
        it('"" if no rdfs:comment, dcterms:description, or dc:description', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual('');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'comment');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'description');
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.dc + 'description');
        });
    });

    describe('getImportedOntologies should call the proper functions', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({
                branchId: branchId,
                commitId: commitId,
                rdfFormat: format
            });
        });
        it('when get succeeds', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(200, [ontology]);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual([ontology]);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('when get is empty', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(204);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('when another success response', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(201, null, null, error);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
        it('when get fails', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(400, null, null, error);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
    });

    describe('getEntityUsages should call the proper functions', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({
                branchId: branchId,
                commitId: commitId
            });
        });
        describe('when get succeeds', function() {
            it('and queryType is select', function() {
                $httpBackend.expectGET('/matontorest/ontologies/recordId/entity-usages/classId?' + params + '&queryType=select')
                    .respond(200, usages);
                ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'select')
                    .then(function(response) {
                        expect(response).toEqual(usages.results.bindings);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                flushAndVerify();
            });
            it('and queryType is construct', function() {
                $httpBackend.expectGET('/matontorest/ontologies/recordId/entity-usages/classId?' + params + '&queryType=construct')
                    .respond(200, usages);
                ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'construct')
                    .then(function(response) {
                        expect(response).toEqual(usages);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                flushAndVerify();
            });
        });
        it('when get fails', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/entity-usages/classId?' + params + '&queryType=select')
                .respond(400, null, null, error);
            ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
    });

    describe('isConcept should return', function() {
        it('true if the entity contains the concept type', function() {
            expect(ontologyManagerSvc.isConcept(conceptObj)).toBe(true);
        });
        it('false if the entity does not contain the concept type', function() {
            expect(ontologyManagerSvc.isConcept({})).toBe(false);
        });
    });

    describe('hasConcepts should return', function() {
        it('true if there are any concept entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([conceptObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any concept entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([ontologyObj])).toBe(false);
        });
    });

    describe('getConcepts should return', function() {
        it('correct concept objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getConcepts([conceptObj, ontologyObj])).toEqual([conceptObj]);
        });
        it('undefined if there are no concepts in the ontology', function() {
            expect(ontologyManagerSvc.getConcepts([ontologyObj])).toEqual([]);
        });
    });

    describe('getConceptIRIs should return', function() {
        it('conceptId if there are concepts in the ontology', function() {
            expect(ontologyManagerSvc.getConceptIRIs([ontologyObj, conceptObj])).toEqual([conceptId]);
        });
        it('[] if there are no concepts in the ontology', function() {
            expect(ontologyManagerSvc.getConceptIRIs([ontologyObj])).toEqual([]);
        });
    });

    describe('isConceptScheme should return', function() {
        it('true if the entity contains the concept scheme type', function() {
            expect(ontologyManagerSvc.isConceptScheme(schemeObj)).toBe(true);
        });
        it('false if the entity does not contain the concept scheme type', function() {
            expect(ontologyManagerSvc.isConceptScheme({})).toBe(false);
        });
    });

    describe('hasConceptSchemes should return', function() {
        it('true if there are any concept scheme entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([schemeObj, ontologyObj])).toBe(true);
        });
        it('false if there are not any concept scheme entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([ontologyObj])).toBe(false);
        });
    });

    describe('getConceptSchemes should return', function() {
        it('correct concept scheme objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemes([schemeObj, ontologyObj])).toEqual([schemeObj]);
        });
        it('undefined if there are no concept schemes in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemes([ontologyObj])).toEqual([]);
        });
    });

    describe('getConceptSchemeIRIs should return', function() {
        it('schemeId if there are concept schemes in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([ontologyObj, schemeObj])).toEqual([schemeId]);
        });
        it('[] if there are no concept schemes in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([ontologyObj])).toEqual([]);
        });
    });

    describe('getSearchResults should call the correct functions', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({
                searchText: searchText,
                branchId: branchId,
                commitId: commitId
            });
        });
        it('when get succeeds', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/search-results?' + params)
                .respond(200, searchResults);
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function(response) {
                    expect(response).toEqual(searchResults);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('when get is empty', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/search-results?' + params)
                .respond(204);
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('when get succeeds with different code', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/search-results?' + params)
                .respond(201);
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('An error has occurred with your search.');
                });
            flushAndVerify();
        });
        it('when get fails', function() {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/search-results?' + params)
                .respond(400, null, null, error);
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
    });

    describe('createOntologyListItem should call the correct functions', function() {
        var iris, importedIris, classHierarchies, classesWithIndividuals, dataPropertyHierarchies,
            objectPropertyHierarchies, getDeferred, params;
        beforeEach(function() {
            params = paramSerializer({
                branchId: branchId,
                commitId: commitId
            });
            getDeferred = $q.defer();
            iris = $httpBackend.expectGET('/matontorest/ontologies/recordId/iris?' + params);
            importedIris = $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-iris?' + params);
            classHierarchies = $httpBackend.expectGET('/matontorest/ontologies/recordId/class-hierarchies?' + params);
            classesWithIndividuals = $httpBackend
                .expectGET('/matontorest/ontologies/recordId/classes-with-individuals?' + params);
            dataPropertyHierarchies = $httpBackend
                .expectGET('/matontorest/ontologies/recordId/data-property-hierarchies?' + params);
            objectPropertyHierarchies = $httpBackend
                .expectGET('/matontorest/ontologies/recordId/object-property-hierarchies?' + params);
            catalogManagerSvc.getRecordBranches.and.returnValue(getDeferred.promise);
        });
        it('when all promises resolve', function() {
            iris.respond(200, irisResponse);
            importedIris.respond(200, importedIrisResponse);
            classHierarchies.respond(200, classHierarchiesResponse);
            classesWithIndividuals.respond(200, classesWithIndividualsResponse);
            dataPropertyHierarchies.respond(200, dataPropertyHierarchiesResponse);
            objectPropertyHierarchies.respond(200, objectPropertyHierarchiesResponse);
            getDeferred.resolve({data: branches});
            ontologyManagerSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function(response) {
                    expect(_.get(response, 'annotations')).toEqual([{
                        localName: annotationId2, namespace: annotationId2, ontologyId: ontologyId
                    }, {
                        localName: annotationId, namespace: annotationId
                    }]);
                    expect(_.get(response, 'subClasses')).toEqual([{
                        localName: classId2, namespace: classId2, ontologyId: ontologyId
                    }, {
                        localName: classId, namespace: classId
                    }]);
                    expect(_.get(response, 'subDataProperties')).toEqual([{
                        localName: dataPropertyId2, namespace: dataPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: dataPropertyId, namespace: dataPropertyId
                    }]);
                    expect(_.get(response, 'subObjectProperties')).toEqual([{
                        localName: objectPropertyId2, namespace: objectPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: objectPropertyId, namespace: objectPropertyId
                    }]);
                    expect(_.get(response, 'individuals')).toEqual([{
                        localName: individualId2, namespace: individualId2, ontologyId: ontologyId
                    }, {
                        localName: individualId, namespace: individualId
                    }]);
                    expect(_.get(response, 'dataPropertyRange')).toEqual(_.concat([{
                        localName: datatypeId2, namespace: datatypeId2, ontologyId: ontologyId
                    }, {
                        localName: datatypeId, namespace: datatypeId
                    }], defaultDatatypes));
                    expect(_.get(response, 'classHierarchy')).toEqual(classHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'classIndex')).toEqual(classHierarchiesResponse.index);
                    expect(_.get(response, 'classesWithIndividuals')).toEqual(classesWithIndividualsResponse.hierarchy);
                    expect(_.get(response, 'classesWithIndividualsIndex'))
                        .toEqual(classesWithIndividualsResponse.index);
                    expect(_.get(response, 'dataPropertyHierarchy')).toEqual(dataPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'dataPropertyIndex')).toEqual(dataPropertyHierarchiesResponse.index);
                    expect(_.get(response, 'objectPropertyHierarchy'))
                        .toEqual(objectPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'objectPropertyIndex')).toEqual(objectPropertyHierarchiesResponse.index);
                    expect(_.get(response, 'branches')).toEqual(branches);
                    expect(_.get(response, 'upToDate')).toBe(true);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('when one call fails', function() {
            iris.respond(400, null, null, error);
            importedIris.respond(200);
            classHierarchies.respond(200);
            classesWithIndividuals.respond(200);
            dataPropertyHierarchies.respond(200);
            objectPropertyHierarchies.respond(200);
            getDeferred.resolve();
            ontologyManagerSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
        it('when more than one call fails', function() {
            iris.respond(400, null, null, error);
            importedIris.respond(400, null, null, error);
            classHierarchies.respond(200);
            classesWithIndividuals.respond(200);
            dataPropertyHierarchies.respond(200);
            objectPropertyHierarchies.respond(200);
            getDeferred.resolve();
            ontologyManagerSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
    });

    describe('addOntologyToList should call the correct functions', function() {
        var createDeferred;
        beforeEach(function() {
            ontologyManagerSvc.list = [];
            createDeferred = $q.defer();
            spyOn(ontologyManagerSvc, 'createOntologyListItem').and.returnValue(createDeferred.promise);
        });
        it('when createOntologyListItem resolves', function() {
            createDeferred.resolve(listItem);
            ontologyManagerSvc.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    expect(ontologyManagerSvc.list.length).toBe(1);
                    expect(ontologyManagerSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                }, function() {
                    fail('Promise should have resolved');
                });
        });
        it('when createOntologyListItem rejects', function() {
            createDeferred.reject(error);
            ontologyManagerSvc.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(ontologyManagerSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                });
        });
    });

    describe('createVocabularyListItem should call the correct functions', function() {
        var iris, importedIris, classHierarchies, classesWithIndividuals, dataPropertyHierarchies,
            objectPropertyHierarchies, getDeferred, params;
        beforeEach(function() {
            params = paramSerializer({
                branchId: branchId,
                commitId: commitId
            });
            getDeferred = $q.defer();
            iris = $httpBackend.expectGET('/matontorest/ontologies/recordId/iris?' + params);
            importedIris = $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-iris?' + params);
            conceptHierarchies = $httpBackend.expectGET('/matontorest/ontologies/recordId/concept-hierarchies?'
                + params);
            catalogManagerSvc.getRecordBranches.and.returnValue(getDeferred.promise);
        });
        it('when all promises resolve', function() {
            iris.respond(200, irisResponse);
            importedIris.respond(200, importedIrisResponse);
            conceptHierarchies.respond(200, conceptHierarchiesResponse);
            getDeferred.resolve({data: branches});
            ontologyManagerSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function(response) {
                    expect(_.get(response, 'subDataProperties')).toEqual([{
                        localName: dataPropertyId2, namespace: dataPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: dataPropertyId, namespace: dataPropertyId
                    }]);
                    expect(_.get(response, 'subObjectProperties')).toEqual([{
                        localName: objectPropertyId2, namespace: objectPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: objectPropertyId, namespace: objectPropertyId
                    }]);
                    expect(_.get(response, 'conceptHierarchy')).toEqual(conceptHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'conceptIndex')).toEqual(conceptHierarchiesResponse.index);
                    expect(_.get(response, 'branches')).toEqual(branches);
                    expect(_.get(response, 'upToDate')).toBe(true);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
        it('when one call fails', function() {
            iris.respond(400, null, null, error);
            importedIris.respond(200);
            conceptHierarchies.respond(200);
            getDeferred.resolve();
            ontologyManagerSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
        it('when more than one call fails', function() {
            iris.respond(400, null, null, error);
            importedIris.respond(400, null, null, error);
            conceptHierarchies.respond(200);
            getDeferred.resolve();
            ontologyManagerSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            flushAndVerify();
        });
    });

    describe('addVocabularyToList should call the correct functions', function() {
        var createDeferred;
        beforeEach(function() {
            ontologyManagerSvc.list = [];
            createDeferred = $q.defer();
            spyOn(ontologyManagerSvc, 'createVocabularyListItem').and.returnValue(createDeferred.promise);
        });
        it('when createVocabularyListItem resolves', function() {
            createDeferred.resolve(listItem);
            ontologyManagerSvc.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    expect(ontologyManagerSvc.list.length).toBe(1);
                    expect(ontologyManagerSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                }, function() {
                    fail('Promise should have resolved');
                });
        });
        it('when createVocabularyListItem rejects', function() {
            createDeferred.reject(error);
            ontologyManagerSvc.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(ontologyManagerSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                });
        });
    });
});
