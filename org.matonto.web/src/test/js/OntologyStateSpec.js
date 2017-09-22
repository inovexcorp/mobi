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
describe('Ontology State Service', function() {
    var ontologyStateSvc, $q, scope, util, stateManagerSvc, ontologyManagerSvc, updateRefsSvc, prefixes, catalogManagerSvc, hierarchy, indexObject, expectedPaths, ontologyState, defaultDatatypes, ontologyObj, classObj, dataPropertyObj, individualObj, ontology, getResponse, httpSvc, $document, responseObj, $state;
    var error = 'error';
    var format = 'jsonld';
    var title = 'title';
    var description = 'description';
    var keywords = 'keyword1,keyword2';
    var inProgressCommit = {
        additions: ['test'],
        deletions: ['test']
    };
    var emptyInProgressCommit = {
        additions: [],
        deletions: []
    };
    var recordId = 'recordId';
    var recordTitle = 'recordTitle';
    var branchId = 'branchId';
    var commitId = 'commitId';
    var ontologyId = 'ontologyId';
    var catalogId = 'catalogId';
    var anonymous = 'anonymous';
    var branch = {
        '@id': branchId
    };
    var commitObj = {
        commit: {
            '@id': commitId
        }
    };
    var ontologyType = 'ontology';
    var vocabularyType = 'vocabulary';
    var jsonFilter = 'json';
    var differenceObj = {additions: '', deletions: ''};
    var index = {
        ontologyId: {
            position: 0,
            label: 'ontology',
            ontologyIri: ontologyId
        },
        'https://classId.com': {
            position: 1,
            label: 'class',
            ontologyIri: ontologyId
        },
        dataPropertyId: {
            position: 2,
            label: 'data property',
            ontologyIri: ontologyId
        },
    };
    var importedOntologies = [];
    var importedOntologyIds = [];
    var classId = 'https://classId.com';
    var classId2 = 'classId2';
    var objectPropertyId = 'objectPropertyId';
    var objectPropertyId2 = 'objectProperty2';
    var datatypeId = 'datatypeId';
    var datatypeId2 = 'datatypeId2';
    var annotationId = 'annotationId';
    var annotationId2 = 'annotationId2';
    var dataPropertyId = 'dataPropertyId';
    var dataPropertyId2 = 'dataPropertyId2';
    var individualId = 'individualId';
    var individualId2 = 'individualId2';
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
        namedIndividuals: [{localName: individualId2, namespace: individualId2}],
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
    var conceptSchemeHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var classesWithIndividualsResponse = {
        individuals: {
            'ClassA': ['IndivA1', 'IndivA2']
        },
        individualsParentPath: ['ClassA']
    };
    var dataPropertyHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var objectPropertyHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var annotationPropertyHierarchiesResponse = {
        hierarchy: [],
        index: {}
    };
    var branches = [branch];

    beforeEach(function() {
        module('ontologyState');
        mockPropertyManager();
        mockOntologyManager();
        mockUpdateRefs();
        mockStateManager();
        mockUtil();
        mockCatalogManager();
        injectRemoveMatontoFilter();
        mockPrefixes();
        mockManchesterConverter();
        mockHttpService();
        mockResponseObj();

        module(function($provide) {
            $provide.value('jsonFilter', function() {
                return jsonFilter;
            });
        });

        module(function($provide) {
            $provide.service('$document', function() {
                this.querySelectorAll = jasmine.createSpy('querySelectorAll');
            });
        });

        module(function($provide) {
            $provide.value('$state', function() {
                this.current = {
                    data: {
                        title: 'title'
                    }
                };
            });
        });

        inject(function(ontologyStateService, _updateRefsService_, _ontologyManagerService_, _catalogManagerService_, _$q_, _$rootScope_, _utilService_, _stateManagerService_, _prefixes_, _httpService_, _$document_, _responseObj_, _$state_) {
            ontologyStateSvc = ontologyStateService;
            updateRefsSvc = _updateRefsService_;
            ontologyManagerSvc = _ontologyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            responseObj = _responseObj_
            $q = _$q_;
            scope = _$rootScope_;
            util = _utilService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            httpSvc = _httpService_;
            $document = _$document_;
            $state = _$state_;
        });

        catalogManagerSvc.localCatalog = {'@id': catalogId};
        ontologyStateSvc.initialize();
        ontologyState = {'@id': 'id'};
        ontologyState[prefixes.ontologyState + 'record'] = [{'@id': recordId}];
        ontologyState[prefixes.ontologyState + 'branch'] = [{'@id': branchId}];
        ontologyState[prefixes.ontologyState + 'commit'] = [{'@id': commitId}];
        ontologyStateSvc.listItem = {
            ontologyRecord: {
                title: recordTitle,
                recordId: recordId,
                branchId: branchId,
                commitId: commitId
            }
        }
        ontologyStateSvc.listItem.selected = {'@id': 'id'};
        ontologyStateSvc.listItem.editorTabStates = {
            tab: {
                active: true,
                entityIRI: 'entityIRI',
                usages: []
            },
            other: {active: false}
        };

        /*
            node1a
                node2a
                    node3a
                    node3c
                node2b
                    node3a
                node2c
                    node3b
                        node3a
            node1b
                node3b
                    node3a
        */
        hierarchy = [{
            entityIRI: 'node1a',
            subEntities: [{
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                },
                {
                    entityIRI: 'node3c'
                }]
            },
            {
                entityIRI: 'node2b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            },
            {
                entityIRI: 'node2c',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }]
        },
        {
            entityIRI: 'node1b',
            subEntities: [{
                entityIRI: 'node3b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            }]
        }];
        indexObject = {
            'node2a': ['node1a'],
            'node2b': ['node1a'],
            'node2c': ['node1a'],
            'node3a': ['node2a', 'node2b', 'node3b'],
            'node3b': ['node2c', 'node1b'],
            'node3c': ['node2a']
        };
        expectedPaths = [
            ['node1a','node2a','node3a'],
            ['node1a','node2b','node3a'],
            ['node1a','node2c','node3b','node3a'],
            ['node1b','node3b','node3a']
        ];
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
        ontologyManagerSvc.defaultDatatypes = _.concat(xsdDatatypes, rdfDatatypes);
        ontologyObj = {
            '@id': ontologyId,
            '@type': [prefixes.owl + 'Ontology'],
            matonto: {
                anonymous: anonymous
            }
        };
        classObj = {
            '@id': classId,
            '@type': [prefixes.owl + 'Class']
        };
        dataPropertyObj = {
            '@id': dataPropertyId,
            '@type': [prefixes.owl + 'DatatypeProperty']
        };
        individualObj = {
            '@id': individualId,
            '@type': [prefixes.owl + 'NamedIndividual', classId]
        };
        ontology = [ontologyObj, classObj, dataPropertyObj];
        listItem = {
            ontology: ontology,
            ontologyId: ontologyId,
            importedOntologies: importedOntologies,
            importedOntologyIds: importedOntologyIds,
            ontologyRecord: {
                title: recordTitle,
                recordId: recordId,
                commitId: commitId,
                branchId: branchId
            },
            editorTabStates: {
                tab: {
                    active: true,
                    entityIRI: 'entityIRI',
                    usages: []
                },
                other: {active: false}
            },
            branches: [branch],
            index: index,
            ontologyState: {
                upToDate: true
            },
            iriList: [ontologyId, classId, dataPropertyId]
        };
        getResponse = {
            recordId: recordId,
            branchId: branchId,
            commitId: commitId,
            inProgressCommit: inProgressCommit,
            ontology: ontology
        };
        branch[prefixes.catalog + 'head'] = [{'@id': commitId}];
    });

    describe('getOntology calls the correct methods', function() {
        var expected, expected2;
        beforeEach(function() {
            expected = {
                recordId: recordId,
                ontology: ontology,
                branchId: branchId,
                commitId: commitId,
                inProgressCommit: inProgressCommit
            };
            expected2 = {
                recordId: recordId,
                ontology: ontology,
                branchId: branchId,
                commitId: commitId,
                inProgressCommit: emptyInProgressCommit
            };
        });
        describe('if state exists', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
                stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
            });
            describe('and getInProgressCommit is resolved', function() {
                var getOntologyDeferred;
                beforeEach(function() {
                    getDeferred.resolve(inProgressCommit);
                    getOntologyDeferred = $q.defer();
                    ontologyManagerSvc.getOntology.and.returnValue(getOntologyDeferred.promise);
                });
                it('and getOntology is resolved', function() {
                    getOntologyDeferred.resolve(ontology);
                    ontologyStateSvc.getOntology(recordId, format)
                        .then(function(response) {
                            expect(response).toEqual(expected);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                    expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                });
                describe('and getOntology is rejected', function() {
                    var deleteDeferred;
                    beforeEach(function() {
                        getOntologyDeferred.reject(error);
                        deleteDeferred = $q.defer();
                        stateManagerSvc.deleteOntologyState.and.returnValue(deleteDeferred.promise);
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        var getLatestDeferred;
                        beforeEach(function() {
                            deleteDeferred.resolve();
                            getLatestDeferred = $q.defer();
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue(getLatestDeferred.promise);
                        });
                        it('and getLatestOntology is resolved', function() {
                            getLatestDeferred.resolve(expected2);
                            ontologyStateSvc.getOntology(recordId, format)
                                .then(function(response) {
                                    expect(response).toEqual(expected2);
                                }, function() {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
                        });
                        it('and getLatestOntology is rejected', function() {
                            getLatestDeferred.reject(error);
                            ontologyStateSvc.getOntology(recordId, format).then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
                        });
                    });
                    it('and deleteOntologyState is rejected', function() {
                        deleteDeferred.reject(error);
                        ontologyStateSvc.getOntology(recordId, format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                });
            });
            describe('and getInProgressCommit is rejected', function() {
                describe('with message "InProgressCommit could not be found"', function() {
                    var getOntologyDeferred;
                    beforeEach(function() {
                        getDeferred.reject('InProgressCommit could not be found');
                        getOntologyDeferred = $q.defer();
                        ontologyManagerSvc.getOntology.and.returnValue(getOntologyDeferred.promise);
                    });
                    it('and getOntology is resolved', function() {
                        getOntologyDeferred.resolve(ontology);
                        ontologyStateSvc.getOntology(recordId, format)
                            .then(function(response) {
                                expect(response).toEqual(expected2);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                        expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                    });
                    describe('and getOntology is rejected', function() {
                        var deleteDeferred;
                        beforeEach(function() {
                            getOntologyDeferred.reject(error);
                            deleteDeferred = $q.defer();
                            stateManagerSvc.deleteOntologyState.and.returnValue(deleteDeferred.promise);
                        });
                        describe('and deleteOntologyState is resolved', function() {
                            var getLatestDeferred;
                            beforeEach(function() {
                                deleteDeferred.resolve();
                                getLatestDeferred = $q.defer();
                                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue(getLatestDeferred.promise);
                            });
                            it('and getLatestOntology is resolved', function() {
                                getLatestDeferred.resolve(expected2);
                                ontologyStateSvc.getOntology(recordId, format)
                                    .then(function(response) {
                                        expect(response).toEqual(expected2);
                                    }, function() {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                                expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
                            });
                            it('and getLatestOntology is rejected', function() {
                                getLatestDeferred.reject(error);
                                ontologyStateSvc.getOntology(recordId, format).then(function() {
                                    fail('Promise should have rejected');
                                }, function(response) {
                                    expect(response).toEqual(error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                                expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
                            });
                        });
                        it('and deleteOntologyState is rejected', function() {
                            deleteDeferred.reject(error);
                            ontologyStateSvc.getOntology(recordId, format).then(function(response) {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                        });
                    });
                });
                describe('with other message', function() {
                    var deleteDeferred;
                    beforeEach(function() {
                        getDeferred.reject(error);
                        deleteDeferred = $q.defer();
                        stateManagerSvc.deleteOntologyState.and.returnValue(deleteDeferred.promise);
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        var getLatestDeferred;
                        beforeEach(function() {
                            deleteDeferred.resolve();
                            getLatestDeferred = $q.defer();
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue(getLatestDeferred.promise);
                        });
                        it('and getLatestOntology is resolved', function() {
                            getLatestDeferred.resolve(expected2);
                            ontologyStateSvc.getOntology(recordId, format)
                                .then(function(response) {
                                    expect(response).toEqual(expected2);
                                }, function() {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
                        });
                        it('and getLatestOntology is rejected', function() {
                            getLatestDeferred.reject(error);
                            ontologyStateSvc.getOntology(recordId, format).then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
                        });
                    });
                    it('and deleteOntologyState is rejected', function() {
                        deleteDeferred.reject(error);
                        ontologyStateSvc.getOntology(recordId, format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                });
            });
        });
        describe('if state does not exist', function() {
            var getLatestDeferred;
            beforeEach(function() {
                getLatestDeferred = $q.defer();
                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue(getLatestDeferred.promise);
            });
            it('and getLatestOntology is resolved', function() {
                getLatestDeferred.resolve(expected2);
                ontologyStateSvc.getOntology(recordId, format)
                    .then(function(response) {
                        expect(response).toEqual(expected2);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
            });
            it('and getLatestOntology is rejected', function() {
                getLatestDeferred.reject(error);
                ontologyStateSvc.getOntology(recordId, format)
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
            });
        });
    });
    describe('getLatestOntology calls the correct methods', function() {
        var getMasterDeferred, expected;
        beforeEach(function() {
            expected = {
                recordId: recordId,
                ontology: ontology,
                branchId: branchId,
                commitId: commitId,
                inProgressCommit: emptyInProgressCommit
            };
            getMasterDeferred = $q.defer();
            catalogManagerSvc.getRecordMasterBranch.and.returnValue(getMasterDeferred.promise);
        });
        describe('if getRecordMasterBranch is resolved', function() {
            var getBranchDeferred;
            beforeEach(function() {
                getMasterDeferred.resolve({'@id': branchId});
                getBranchDeferred = $q.defer();
                catalogManagerSvc.getRecordBranch.and.returnValue(getBranchDeferred.promise);
            });
            describe('and getRecordBranch is resolved', function() {
                var createDeferred;
                beforeEach(function() {
                    getBranchDeferred.resolve(branch);
                    createDeferred = $q.defer();
                    stateManagerSvc.createOntologyState.and.returnValue(createDeferred.promise);
                });
                describe('and createOntologyState is resolved', function() {
                    var getDeferred;
                    beforeEach(function() {
                        createDeferred.resolve();
                        getDeferred = $q.defer();
                        ontologyManagerSvc.getOntology.and.returnValue(getDeferred.promise);
                    });
                    it('and getOntology is resolved', function(done) {
                        getDeferred.resolve(ontology);
                        ontologyStateSvc.getLatestOntology(recordId, format)
                            .then(function(response) {
                                expect(response).toEqual(expected);
                                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                                done();
                            }, function() {
                                fail('Promise should have resolved');
                                done();
                            });
                        scope.$apply();
                    });
                    it('and getOntology is rejected', function(done) {
                        getDeferred.reject(error);
                        ontologyStateSvc.getLatestOntology(recordId, format)
                            .then(function() {
                                fail('Promise should have rejected');
                                done();
                            }, function(response) {
                                expect(response).toEqual(error);
                                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                                expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                                done();
                            });
                        scope.$apply();
                    });
                });
                it('and createOntologyState is rejected', function(done) {
                    createDeferred.reject(error);
                    ontologyStateSvc.getLatestOntology(recordId, format)
                        .then(function() {
                            fail('Promise should have rejected');
                            done();
                        }, function(response) {
                            expect(response).toEqual(error);
                            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            done();
                        });
                    scope.$apply();
                });
            });
            it('and getRecordBranch is rejected', function(done) {
                getBranchDeferred.reject(error);
                ontologyStateSvc.getLatestOntology(recordId, format)
                    .then(function() {
                        fail('Promise should have rejected');
                        done();
                    }, function(response) {
                        expect(response).toEqual(error);
                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(stateManagerSvc.createOntologyState).not.toHaveBeenCalled();
                        done();
                    });
                scope.$apply();
            });
        });
        it('if getRecordMasterBranch is rejected', function(done) {
            getMasterDeferred.reject(error);
            ontologyStateSvc.getLatestOntology(recordId, format)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                    done();
                });
            scope.$apply();
        });
    });
    describe('uploadThenGet should call the proper methods', function() {
        var uploadDeferred;
        beforeEach(function() {
            uploadDeferred = $q.defer();
            ontologyManagerSvc.uploadFile.and.returnValue(uploadDeferred.promise);
        });
        describe('when uploadFile resolves', function() {
            var resolvedResponse = { recordId: recordId };
            var getDeferred;
            beforeEach(function() {
                uploadDeferred.resolve(resolvedResponse);
                getDeferred = $q.defer();
                spyOn(ontologyStateSvc, 'getOntology').and.returnValue(getDeferred.promise);
            });
            describe('and getOntology resolves', function() {
                beforeEach(function() {
                    getDeferred.resolve(getResponse);
                    ontologyManagerSvc.getOntologyIRI.and.returnValue(ontologyId);
                });
                describe('and type is "ontology"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addOntologyToList resolves', function() {
                        addDeferred.resolve(listItem);
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, ontologyType)
                            .then(function(response) {
                                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                                expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit, title);
                                expect(response).toEqual(recordId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addOntologyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, ontologyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit, title);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                describe('and type is "vocabulary"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyStateSvc, 'addVocabularyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addOntologyToList resolves', function() {
                        addDeferred.resolve(listItem);
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, vocabularyType)
                            .then(function(response) {
                                expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit, title);
                                expect(response).toEqual(recordId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addOntologyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, vocabularyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit, title);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
            });
            it('and getOntology rejects', function() {
                getDeferred.reject(error);
                ontologyStateSvc.uploadThenGet({}, title, description, keywords)
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
            ontologyStateSvc.uploadThenGet({}, title, description, keywords)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    describe('updateOntology should call the proper methods', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [ontologyStateSvc.listItem];
        });
        describe('and getOntology resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.resolve(ontology));
                ontologyManagerSvc.getOntologyIRI.and.returnValue(ontologyId);
            });
            describe('and type is "ontology"', function() {
                describe('and createOntologyListItem resolves', function() {
                    beforeEach(function() {
                        spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.resolve(listItem));
                    });
                    it('and updateOntologyState resolves', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.resolve());
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.ontologyState.upToDate)
                            .then(function(response) {
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                                expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.ontologyState.upToDate, listItem.ontologyRecord.title);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and updateOntologyState rejects', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.reject(error));
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.ontologyState.upToDate)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                                expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.ontologyState.upToDate, listItem.ontologyRecord.title);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                it('and createOntologyListItem rejects', function() {
                    spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(error));
                    ontologyStateSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.ontologyState.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.ontologyState.upToDate, listItem.ontologyRecord.title);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
            describe('and type is "vocabulary"', function() {
                describe('and createVocabularyListItem resolves', function() {
                    beforeEach(function() {
                        spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue($q.resolve(listItem));
                    });
                    it('and updateOntologyState resolves', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.resolve());
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.ontologyState.upToDate)
                            .then(function(response) {
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                                expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.ontologyState.upToDate, listItem.ontologyRecord.title);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and updateOntologyState rejects', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.reject(error));
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.ontologyState.upToDate)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                                expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.ontologyState.upToDate, listItem.ontologyRecord.title);
                                expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                it('and createVocabularyListItem rejects', function() {
                    spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue($q.reject(error));
                    ontologyStateSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.ontologyState.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                            expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.ontologyState.upToDate, listItem.ontologyRecord.title);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
        });
        it('and getOntology rejects', function() {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject(error));
            ontologyStateSvc.updateOntology(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    describe('openOntology should call the proper methods', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            spyOn(ontologyStateSvc, 'getOntology').and.returnValue(getDeferred.promise);
            spyOn(ontologyStateSvc, 'setSelected');
            spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
            spyOn(ontologyStateSvc, 'setPageTitle');
        });
        describe('and getOntology resolves', function() {
            var branchDeferred;
            beforeEach(function() {
                branchDeferred = $q.defer();
                catalogManagerSvc.getRecordBranch.and.returnValue(branchDeferred.promise);
                getDeferred.resolve(getResponse);
            });
            describe('and getRecordBranch resolves', function() {
                beforeEach(function() {
                    branchDeferred.resolve(branch);
                    ontologyManagerSvc.getOntologyIRI.and.returnValue(ontologyId);
                });
                describe('and type is "ontology"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addOntologyToList resolves', function() {
                        listItem.ontologyRecord.type = 'ontology';
                        addDeferred.resolve(listItem);
                        ontologyStateSvc.openOntology(recordId, title, ontologyType)
                            .then(function(response) {
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                                expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit, title, true);
                                expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                                expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('ontology');
                                expect(response).toEqual(ontologyId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addOntologyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyStateSvc.openOntology(recordId, title, ontologyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                                expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId,
                                    branchId, commitId, ontology, inProgressCommit, title, true);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
                describe('and type is "vocabulary"', function() {
                    var addDeferred;
                    beforeEach(function() {
                        addDeferred = $q.defer();
                        spyOn(ontologyStateSvc, 'addVocabularyToList').and.returnValue(addDeferred.promise);
                    });
                    it('and addVocabularyToList resolves', function() {
                        listItem.ontologyRecord.type = 'vocabulary';
                        addDeferred.resolve(listItem);
                        ontologyStateSvc.openOntology(recordId, title, vocabularyType)
                            .then(function(response) {
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit, title, true);
                                expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                                expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('vocabulary');
                                expect(response).toEqual(ontologyId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('and addVocabularyToList rejects', function() {
                        addDeferred.reject(error);
                        ontologyStateSvc.openOntology(recordId, title, vocabularyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId,
                                    catalogId);
                                expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId,
                                    recordId, branchId, commitId, ontology, inProgressCommit, title, true);
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                    });
                });
            });
            it('and getRecordBranch rejects', function() {
                branchDeferred.reject(error);
                ontologyStateSvc.openOntology(recordId)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId,
                            catalogId);
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
        it('and getOntology rejects', function() {
            getDeferred.reject(error);
            ontologyStateSvc.openOntology(recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    it('closeOntology removes the correct object from the list', function() {
        spyOn(ontologyStateSvc, 'setPageTitle');
        ontologyStateSvc.list = [{ontologyRecord: {recordId: recordId}}];
        ontologyStateSvc.closeOntology(recordId);
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.setPageTitle).toHaveBeenCalled();
    });
    it('removeBranch removes the correct object from the branches list', function() {
        spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
        ontologyStateSvc.removeBranch(recordId, branchId);
        expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        expect(listItem.branches).toEqual([]);
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
                ontologyStateSvc.saveChanges(recordId, differenceObj)
                    .then(function(response) {
                        expect(response).toEqual(resolved);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
            it('and updateInProgressCommit rejects', function() {
                updateDeferred.reject(error);
                ontologyStateSvc.saveChanges(recordId, differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
        describe('when getInProgressCommit rejects', function() {
            describe('and the error message is "InProgressCommit could not be found"', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    catalogManagerSvc.createInProgressCommit.and.returnValue(createDeferred.promise);
                    getDeferred.reject('InProgressCommit could not be found');
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
                        ontologyStateSvc.saveChanges(recordId, differenceObj)
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
                        ontologyStateSvc.saveChanges(recordId, differenceObj)
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
                    ontologyStateSvc.saveChanges(recordId, differenceObj)
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
            it('and the error message is not "InProgressCommit could not be found"', function() {
                getDeferred.reject(error);
                ontologyStateSvc.saveChanges(recordId, differenceObj)
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
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToAdditions(recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
        it('when entity is not in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': []};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToAdditions(recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
    });
    describe('addToDeletions should call the correct functions', function() {
        it('when entity is in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': [{'@id': 'id'}]};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToDeletions(recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
        it('when entity is not in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': []};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToDeletions(recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
    });
    describe('getListItemByRecordId should return the correct object', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [listItem];
        });
        it('when the ontologyId is in the list', function() {
            expect(ontologyStateSvc.getListItemByRecordId(recordId)).toEqual(listItem);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyStateSvc.getListItemByRecordId('other')).toEqual(undefined);
        });
    });
    describe('getOntologyByRecordId should return the correct object', function() {
        it('when the ontologyId is in the list', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyStateSvc.getOntologyByRecordId(recordId)).toEqual(listItem.ontology);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyStateSvc.getOntologyByRecordId('other')).toEqual([]);
        });
    });
    describe('createOntology calls the correct methods', function() {
        var uploadDeferred;
        beforeEach(function() {
            uploadDeferred = $q.defer();
            ontologyManagerSvc.uploadJson.and.returnValue(uploadDeferred.promise);
        });
        describe('when uploadJson succeeds', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                catalogManagerSvc.getRecordBranch.and.returnValue(getDeferred.promise);
                uploadDeferred.resolve({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                ontologyStateSvc.list = [];
                spyOn(ontologyStateSvc, 'setSelected');
                spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
                spyOn(ontologyStateSvc, 'setPageTitle');
            });
            it('and getRecordBranch resolves', function() {
                getDeferred.resolve(branch);
                ontologyStateSvc.createOntology(ontologyObj, title, description, keywords)
                    .then(function(response) {
                        expect(response).toEqual({entityIRI: ontologyObj['@id'], recordId: recordId, branchId: branchId,
                            commitId: commitId});
                        expect(ontologyStateSvc.list.length).toBe(1);
                        expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                        expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('ontology');
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
            it('and getRecordBranch rejects', function() {
                getDeferred.reject(error);
                ontologyStateSvc.createOntology(ontologyObj, title, description, keywords)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
            });
        });
        it('when uploadJson rejects', function() {
            uploadDeferred.reject(error);
            ontologyStateSvc.createOntology(ontologyObj, title)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
        });
    });
    describe('getEntityByRecordId returns', function() {
        it('object when present using index', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyStateSvc.getEntityByRecordId(recordId, classId)).toEqual(classObj);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        //the operation to retrieve the object if it isn't in the index is too expensive
        //so we are no longer doing that.
        it('undefined when present not using index', function() {
            var diffListItem = {
                ontology: ontology,
                ontologyId: ontologyId,
                recordId: recordId,
                commitId: commitId,
                branchId: branchId,
                branches: [branch]
            }
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(diffListItem);
            ontologyManagerSvc.getEntity.and.returnValue(classObj);
            expect(ontologyStateSvc.getEntityByRecordId(recordId, classId)).toBeUndefined();
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('undefined when not present', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.callThrough();
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            expect(ontologyStateSvc.getEntityByRecordId('', classId)).toEqual(undefined);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith('');
        });
    });
    describe('removeEntity removes the entity from the provided ontology and index', function() {
        it('if it points to blank nodes', function() {
            listItem.index = {
                classA: {position: 0},
                bnode0: {position: 1},
                classB: {position: 2},
                bnode1: {position: 3},
                bnode2: {position: 4},
                classC: {position: 5}
            };
            listItem.ontology = [
                {'@id': 'classA', '@type': [], bnode0: [{'@value': 'A'}], propA: [{'@id': 'bnode2'}]},
                {'@id': 'bnode0', propA: [{'@id': 'bnode1'}]},
                {'@id': 'classB'},
                {'@id': 'bnode1', propA: [{'@id': 'classB'}]},
                {'@id': 'bnode2'},
                {'@id': 'classC'}
            ];
            ontologyManagerSvc.isBlankNodeId.and.callFake(function(iri) {
                return _.startsWith(iri, 'bnode');
            });
            expect(ontologyStateSvc.removeEntity(listItem, 'classA')).toEqual([
                {'@id': 'classA', '@type': [], bnode0: [{'@value': 'A'}], propA: [{'@id': 'bnode2'}]},
                {'@id': 'bnode0', propA: [{'@id': 'bnode1'}]},
                {'@id': 'bnode2'},
                {'@id': 'bnode1', propA: [{'@id': 'classB'}]}
            ]);
            expect(listItem.index).toEqual({classB: {position: 0}, classC: {position: 1}});
        });
        it('if it does not point to blank nodes', function() {
            expect(ontologyStateSvc.removeEntity(listItem, classId)).toEqual([classObj]);
            expect(_.has(listItem.index, classId)).toBe(false);
            expect(listItem.index.dataPropertyId.position).toEqual(1);
        });
    });
    it('flattenHierarchy properly flattens the provided hierarchy', function() {
        spyOn(ontologyStateSvc, 'getEntityNameByIndex').and.callFake(_.identity);
        var hierarchy = [{
            entityIRI: 'Class B',
            subEntities: [{
                entityIRI: 'Class B2'
            }, {
                entityIRI: 'Class B1'
            }]
        }, {
            entityIRI: 'Class A'
        }];
        var expected = [{
            entityIRI: 'Class A',
            hasChildren: false,
            path: ['recordId', 'Class A'],
            indent: 0
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: ['recordId', 'Class B'],
            indent: 0
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1'],
            indent: 1
        }, {
            entityIRI: 'Class B2',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B2'],
            indent: 1
        }];
        expect(ontologyStateSvc.flattenHierarchy(hierarchy, 'recordId')).toEqual(expected);
    });
    it('createFlatEverythingTree creates the correct array', function() {
        ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'class1'}]);
        ontologyManagerSvc.getClassProperties.and.returnValue([{'@id': 'property1'}]);
        ontologyManagerSvc.getNoDomainProperties.and.returnValue([{'@id': 'property2'}]);
        var ontology = [{'@id': 'ontologyId'}];
        var expected = [{
            '@id': 'class1',
            hasChildren: true,
            indent: 0,
            path: ['recordId', 'class1']
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            path: ['recordId', 'class1', 'property1']
        }, {
            title: 'Properties',
            get: ontologyStateSvc.getNoDomainsOpened,
            set: ontologyStateSvc.setNoDomainsOpened
        }, {
            '@id': 'property2',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: ['recordId', 'property2']
        }];
        expect(ontologyStateSvc.createFlatEverythingTree([ontology], ontologyStateSvc.listItem)).toEqual(expected);
        expect(ontologyManagerSvc.getClasses).toHaveBeenCalledWith([ontology]);
        expect(ontologyManagerSvc.getClassProperties).toHaveBeenCalledWith([ontology], 'class1');
        expect(ontologyManagerSvc.getNoDomainProperties).toHaveBeenCalledWith([ontology]);
    });
    it('createFlatIndividualTree creates the correct array', function() {
        var listItem = {
            individualsParentPath: ['Class A', 'Class B', 'Class B1'],
            classesAndIndividuals: {
                'Class A': ['Individual A2', 'Individual A1'],
                'Class B1': ['Individual B1']
            },
            flatClassHierarchy: [{
                entityIRI: 'Class A',
                hasChildren: false,
                path: ['recordId', 'Class A'],
                indent: 0
            }, {
                entityIRI: 'Class B',
                hasChildren: true,
                path: ['recordId', 'Class B'],
                indent: 0
            }, {
                entityIRI: 'Class B1',
                hasChildren: false,
                path: ['recordId', 'Class B', 'Class B1'],
                indent: 1
            }, {
                entityIRI: 'Class B2',
                hasChildren: false,
                path: ['recordId', 'Class B', 'Class B2'],
                indent: 1
            }]
        };
        var expected = [{
            entityIRI: 'Class A',
            hasChildren: false,
            path: ['recordId', 'Class A'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Individual A1',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A1'],
            indent: 1
        }, {
            entityIRI: 'Individual A2',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A2'],
            indent: 1
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: ['recordId', 'Class B'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1'],
            indent: 1,
            isClass: true
        }, {
            entityIRI: 'Individual B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1', 'Individual B1'],
            indent: 2
        }];
        expect(ontologyStateSvc.createFlatIndividualTree(listItem)).toEqual(expected);
        expect(ontologyStateSvc.createFlatIndividualTree({})).toEqual([]);
    });
    it('addEntity adds the entity to the provided ontology and index', function() {
        ontologyManagerSvc.getEntityName.and.returnValue('name');
        ontologyStateSvc.addEntity(listItem, individualObj);
        expect(ontology.length).toBe(4);
        expect(ontology[3]).toEqual(individualObj);
        expect(_.has(listItem.index, individualId)).toBe(true);
        expect(listItem.index[individualId].position).toEqual(3);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(individualObj, listItem.ontologyRecord.type);
        expect(listItem.index[individualId].label).toBe('name');
        expect(listItem.index[individualId].ontologyIri).toBe('ontologyId');
    });
    describe('getEntityNameByIndex should return the proper value', function() {
        it('when the entityIRI is in the index', function() {
            var listItem = {
                index: {
                    iri: {
                        label: 'name'
                    }
                }
            };
            expect(ontologyStateSvc.getEntityNameByIndex('iri', listItem)).toBe('name');
        });
        it('when the entityIRI is in the imported index', function() {
            var listItem = {
                index: {
                    nomatchiri: {
                        label: 'name'
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                            label: 'importedname'
                        }
                    }
                }]
            };
            expect(ontologyStateSvc.getEntityNameByIndex('iri', listItem)).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices', function() {
            var listItem = {
                index: {
                    iri: {
                        label: 'name'
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                            label: 'importedname'
                        }
                    }
                }]
            };
            expect(ontologyStateSvc.getEntityNameByIndex('iri', listItem)).toBe('name');
        });
        it('when the entityIRI is in multiple indices with only one label', function() {
            var listItem = {
                index: {
                    iri: {
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                            label: 'importedname'
                        }
                    }
                }]
            };
            expect(ontologyStateSvc.getEntityNameByIndex('iri', listItem)).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices and no labels exist', function() {
            var listItem = {
                index: {
                    iri: {
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                        }
                    }
                }]
            };
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', listItem)).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
        it('when the entityIRI is not in the index', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {type: 'ontology'})).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
    });
    describe('createOntologyListItem should call the correct functions', function() {
        beforeEach(function() {
            ontologyManagerSvc.getClassHierarchies.and.returnValue($q.when(classHierarchiesResponse));
            ontologyManagerSvc.getClassesWithIndividuals.and.returnValue($q.when(classesWithIndividualsResponse));
            ontologyManagerSvc.getDataPropertyHierarchies.and.returnValue($q.when(dataPropertyHierarchiesResponse));
            ontologyManagerSvc.getObjectPropertyHierarchies.and.returnValue($q.when(objectPropertyHierarchiesResponse));
            ontologyManagerSvc.getAnnotationPropertyHierarchies.and.returnValue($q.when(annotationPropertyHierarchiesResponse));
            ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([{id: 'imported-ontology', ontologyId: 'ontologyId', ontology: [{'@id': 'ontologyId'}]}]));
            catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: branches}));
            spyOn(ontologyStateSvc, 'flattenHierarchy').and.returnValue([{prop: 'flatten'}]);
            spyOn(ontologyStateSvc, 'createFlatEverythingTree').and.returnValue([{prop: 'everything'}]);
            spyOn(ontologyStateSvc, 'createFlatIndividualTree').and.returnValue([{prop: 'individual'}]);
            ontologyManagerSvc.getFailedImports.and.returnValue(['failedId']);
        });
        it('when all promises resolve', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.when(irisResponse));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function(response) {
                    expect(ontologyManagerSvc.getIris).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getImportedIris).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getClassHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getClassesWithIndividuals).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getDataPropertyHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getObjectPropertyHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getAnnotationPropertyHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
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
                    }], ontologyManagerSvc.defaultDatatypes));
                    expect(_.get(response, 'classHierarchy')).toEqual(classHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'classIndex')).toEqual(classHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataPropertyHierarchy, recordId, response);
                    expect(_.get(response, 'flatClassHierarchy')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
                    expect(_.get(response, 'classesAndIndividuals')).toEqual(classesWithIndividualsResponse.individuals);
                    expect(_.get(response, 'individualsParentPath')).toEqual(classesWithIndividualsResponse.individualsParentPath);
                    expect(_.get(response, 'dataPropertyHierarchy')).toEqual(dataPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'dataPropertyIndex')).toEqual(dataPropertyHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataPropertyHierarchy, recordId, response);
                    expect(_.get(response, 'flatDataPropertyHierarchy')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'objectPropertyHierarchy')).toEqual(objectPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'objectPropertyIndex')).toEqual(objectPropertyHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.objectPropertyHierarchy, recordId, response);
                    expect(_.get(response, 'flatObjectPropertyHierarchy')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'branches')).toEqual(branches);
                    expect(_.get(response, 'annotationPropertyHierarchy')).toEqual(annotationPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'annotationPropertyIndex')).toEqual(annotationPropertyHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.annotationPropertyHierarchy, recordId, response);
                    expect(_.get(response, 'flatAnnotationPropertyHierarchy')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(_.get(response, 'ontologyState'), 'upToDate')).toBe(true);
                    expect(_.get(response, 'iriList')).toEqual([ontologyId, annotationId, classId, dataPropertyId, objectPropertyId, individualId, datatypeId, annotationId2, classId2, dataPropertyId2, objectPropertyId2, individualId2, datatypeId2]);
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([ontology, [{
                        '@id': 'ontologyId',
                        matonto: {
                            icon: 'fa-square-o',
                            imported: true,
                            importedIRI: 'ontologyId'
                        }
                    }]], response);
                    expect(_.get(response, 'flatEverythingTree')).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(response);
                    expect(_.get(response, 'flatIndividualsHierarchy')).toEqual([{prop: 'individual'}]);
                    expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
        });
        it('when one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
        it('when more than one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.reject(error));
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
        it('createOntologyListItem should have data types for all individuals in ontology', function() {
            individualObj["property1"] = [{'@type':prefixes.xsd + 'int', '@value':4}];
            individualObj["property2"] = [{'@value':'some string value'}];
            ontologyManagerSvc.getIris.and.returnValue($q.when(irisResponse));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology,
            inProgressCommit, true).then(function(response) {
                expect(_.get(response, 'property1')['@type']).toEqual(prefixes.xsd + 'int');
                expect(_.get(response, 'property2')['@type']).toEqual(prefixes.xsd + 'string');
            });
        });
    });
    it('getIndividualsParentPath should return the list of unique classes', function() {
        var listItem = {
            classesAndIndividuals: {
                classA: ['ind1', 'ind2'],
                classB: ['ind3', 'ind4']
            },
            classIndex: {
                classB: ['classA'],
                classZ: ['classY']
            }
        }
        var expected = ['classA', 'classB'];
        expect(ontologyStateSvc.getIndividualsParentPath(listItem)).toEqual(expected);
    });
    describe('addOntologyToList should call the correct functions', function() {
        var createDeferred;
        beforeEach(function() {
            ontologyStateSvc.list = [];
            createDeferred = $q.defer();
            spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue(createDeferred.promise);
        });
        it('when createOntologyListItem resolves', function() {
            createDeferred.resolve(listItem);
            ontologyStateSvc.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    expect(ontologyStateSvc.list.length).toBe(1);
                    expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                }, function() {
                    fail('Promise should have resolved');
                });
        });
        it('when createOntologyListItem rejects', function() {
            createDeferred.reject(error);
            ontologyStateSvc.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                });
        });
    });
    describe('createVocabularyListItem should call the correct functions', function() {
        beforeEach(function() {
            ontologyManagerSvc.getConceptHierarchies.and.returnValue($q.when(conceptHierarchiesResponse));
            ontologyManagerSvc.getConceptSchemeHierarchies.and.returnValue($q.when(conceptSchemeHierarchiesResponse));
            catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: branches}));
            spyOn(ontologyStateSvc, 'flattenHierarchy').and.returnValue([{prop: 'flatten'}]);
            ontologyManagerSvc.getFailedImports.and.returnValue(['failedId']);
        });
        it('when all promises resolve', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.when(irisResponse));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function(response) {
                    expect(ontologyManagerSvc.getIris).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getImportedIris).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getConceptHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getConceptSchemeHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
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
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptHierarchy, recordId, response);
                    expect(_.get(response, 'flatConceptHierarchy')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'conceptHierarchy')).toEqual(conceptSchemeHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'conceptIndex')).toEqual(conceptSchemeHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemeHierarchy, recordId, response);
                    expect(_.get(response, 'flatConceptSchemeHierarchy')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'branches')).toEqual(branches);
                    expect(_.get(_.get(response, 'ontologyState'), 'upToDate')).toBe(true);
                    expect(_.get(response, 'iriList')).toEqual([ontologyId, annotationId, classId, dataPropertyId, objectPropertyId, individualId, datatypeId, annotationId2, classId2, dataPropertyId2, objectPropertyId2, individualId2, datatypeId2]);
                    expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
        });
        it('when one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
        it('when more than one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.reject(error));
            ontologyStateSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology,
                inProgressCommit, true).then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    describe('addVocabularyToList should call the correct functions', function() {
        var createDeferred;
        beforeEach(function() {
            ontologyStateSvc.list = [];
            createDeferred = $q.defer();
            spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue(createDeferred.promise);
        });
        it('when createVocabularyListItem resolves', function() {
            createDeferred.resolve(listItem);
            ontologyStateSvc.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    expect(ontologyStateSvc.list.length).toBe(1);
                    expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                }, function() {
                    fail('Promise should have resolved');
                });
        });
        it('when createVocabularyListItem rejects', function() {
            createDeferred.reject(error);
            ontologyStateSvc.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId,
                        branchId, commitId, ontology, inProgressCommit, true);
                });
        });
    });
    it('reset should clear the correct variables', function() {
        ontologyStateSvc.reset();
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.listItem).toEqual({selected: {}});
        expect(ontologyStateSvc.listItem.selected).toEqual({});
    });
    describe('afterSave calls the correct functions', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
        });
        describe('when getInProgressCommit resolves', function() {
            beforeEach(function() {
                getDeferred.resolve(inProgressCommit);
            });
            describe('and getOntologyStateByRecordId is empty', function() {
                var createDeferred;
                beforeEach(function() {
                    createDeferred = $q.defer();
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({});
                    stateManagerSvc.createOntologyState.and.returnValue(createDeferred.promise);
                });
                it('and createOntologyState resolves', function() {
                    createDeferred.resolve(recordId);
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(_.has(ontologyStateSvc.listItem.editorTabStates, 'usages')).toBe(false);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                            expect(response).toEqual(recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                });
                it('and createOntologyState rejects', function() {
                    createDeferred.reject(error);
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
            describe('and getOntologyStateByRecordId is present', function() {
                var updateDeferred;
                beforeEach(function() {
                    updateDeferred = $q.defer();
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({id: 'id'});
                    stateManagerSvc.updateOntologyState.and.returnValue(updateDeferred.promise);
                });
                it('and createOntologyState resolves', function() {
                    updateDeferred.resolve(recordId);
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                            expect(response).toEqual(recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                });
                it('and createOntologyState rejects', function() {
                    updateDeferred.reject(error);
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                            expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                });
            });
        });
        it('when getInProgressCommit rejects', function() {
            getDeferred.reject(error);
            ontologyStateSvc.afterSave()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    it('clearInProgressCommit should clear the proper variables', function() {
        ontologyStateSvc.listItem = {
            inProgressCommit: {
                additions: ['addition'],
                deletions: ['deletion']
            }
        }
        ontologyStateSvc.clearInProgressCommit();
        expect(ontologyStateSvc.listItem.inProgressCommit.additions).toEqual([]);
        expect(ontologyStateSvc.listItem.inProgressCommit.deletions).toEqual([]);
    });
    it('setOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        ontologyStateSvc.setOpened(path, true);
        expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.isOpened')).toBe(true);

        ontologyStateSvc.setOpened(path, false);
        expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.isOpened')).toBe(false);
    });
    describe('getOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.isOpened', value);
                expect(ontologyStateSvc.getOpened(path)).toBe(value);
            });
        });
    });
    it('setNoDomainsOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setNoDomainsOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.noDomainsOpened')).toBe(value);
        });
    });
    describe('getNoDomainsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getNoDomainsOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.noDomainsOpened', value);
                expect(ontologyStateSvc.getNoDomainsOpened(path)).toBe(value);
            });
        });
    });
    it('setIndividualsOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setIndividualsOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.individualsOpened')).toBe(value);
        });
    });
    describe('getIndividualsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getIndividualsOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.individualsOpened', value);
                expect(ontologyStateSvc.getIndividualsOpened(path)).toBe(value);
            });
        });
    });
    it('setDataPropertiesOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setDataPropertiesOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.dataPropertiesOpened')).toBe(value);
        });
    });
    describe('getDataPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getDataPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.dataPropertiesOpened', value);
                expect(ontologyStateSvc.getDataPropertiesOpened(path)).toBe(value);
            });
        });
    });
    it('setObjectPropertiesOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setObjectPropertiesOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.objectPropertiesOpened')).toBe(value);
        });
    });
    describe('getObjectPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getObjectPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.objectPropertiesOpened', value);
                expect(ontologyStateSvc.getObjectPropertiesOpened(path)).toBe(value);
            });
        });
    });
    it('setAnnotationPropertiesOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setAnnotationPropertiesOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.annotationPropertiesOpened')).toBe(value);
        });
    });
    describe('getAnnotationPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getAnnotationPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, encodeURIComponent(path) + '.annotationPropertiesOpened', value);
                expect(ontologyStateSvc.getAnnotationPropertiesOpened(path)).toBe(value);
            });
        });
    });
    describe('onEdit calls the correct manager methods', function() {
        var iriBegin = 'begin';
        var iriThen = 'then';
        var iriEnd = 'end';
        var newIRI = iriBegin + iriThen + iriEnd;
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
            spyOn(ontologyStateSvc, 'addToAdditions');
            spyOn(ontologyStateSvc, 'addToDeletions');
            ontologyManagerSvc.getEntityUsages.and.returnValue(getDeferred.promise);
        });
        it('regardless of getEntityUsages outcome when no match in additions', function() {
            ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.listItem.selected['@id'], newIRI);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.selected['@id'], 'construct');
        });
        it('regardless of getEntityUsages outcome when match in additions', function() {
            ontologyStateSvc.listItem.additions = [angular.copy(ontologyStateSvc.listItem.selected)];
            ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.listItem.selected['@id'], newIRI);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.additions.length).toBe(0);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.selected['@id'], 'construct');
        });
        describe('when getActiveKey is', function() {
            it('project', function() {
                spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('project');
                spyOn(ontologyStateSvc, 'setCommonIriParts');
                ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
                expect(ontologyStateSvc.setCommonIriParts).not.toHaveBeenCalled();
            });
            it('not project', function() {
                spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('other');
                spyOn(ontologyStateSvc, 'setCommonIriParts');
                ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
                expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith(iriBegin, iriThen);
            });
        });
        it('when getEntityUsages resolves', function() {
            var statement = {'@id': 'test-id'};
            var response = [statement];
            getDeferred.resolve(response);
            ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
            scope.$apply();
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, statement);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(response, ontologyStateSvc.listItem.selected['@id'], newIRI);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, statement);
        });
        it('when getEntityUsages rejects', function() {
            getDeferred.reject();
            ontologyStateSvc.onEdit(iriBegin, iriThen, iriEnd);
            scope.$apply();
            expect(util.createErrorToast).toHaveBeenCalled();
        });
    });
    it('setCommonIriParts sets the proper values based on parameters', function() {
        var begin = 'begin';
        var then = 'then';
        ontologyStateSvc.setCommonIriParts(begin, then);
        expect(ontologyStateSvc.listItem.iriBegin).toEqual(begin);
        expect(ontologyStateSvc.listItem.iriThen).toEqual(then);
    });
    describe('setSelected should set the correct values and call the correct methods', function() {
        var object = {'@id': 'new'};
        var id = 'id';
        beforeEach(function() {
            ontologyStateSvc.listItem.selected = undefined;
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue(object);
            spyOn(ontologyStateSvc, 'setEntityUsages');
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
        });
        it('when getUsages is true and getActivePage object does not have a usages property', function() {
            ontologyStateSvc.setSelected(id, true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(object);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(id);
        });
        it('when getUsages is false', function() {
            ontologyStateSvc.setSelected(id, false);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(object);
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when getEntityByRecordId returns undefined', function() {
            ontologyStateSvc.getEntityByRecordId.and.returnValue(undefined);
            ontologyStateSvc.setSelected(id, true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(undefined);
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when getActivePage object does have a usages property', function() {
            ontologyStateSvc.getActivePage.and.returnValue({usages: []});
            ontologyStateSvc.setSelected(id, true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(object);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
    });
    describe('setEntityUsages should call the correct function', function() {
        var getDeferred;
        var id = 'id';
        var key = 'project';
        var activePage = {};
        beforeEach(function() {
            getDeferred = $q.defer();
            ontologyManagerSvc.getEntityUsages.and.returnValue(getDeferred.promise);
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(activePage);
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue(key);
            ontologyStateSvc.setEntityUsages(id);
        });
        it('when getEntityUsages resolves', function() {
            var response = [{'@id': 'id'}];
            getDeferred.resolve(response);
            scope.$apply();
            var httpId = 'usages-' + key + '-' + ontologyStateSvc.listItem.ontologyRecord.recordId;
            expect(httpSvc.cancel).toHaveBeenCalledWith(httpId);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, id, 'select', httpId);
            expect(activePage.usages).toEqual(response);
        });
        it('when getEntityUsages rejects', function() {
            getDeferred.reject('error');
            scope.$apply();
            var httpId = 'usages-' + key + '-' + ontologyStateSvc.listItem.ontologyRecord.recordId;
            expect(httpSvc.cancel).toHaveBeenCalledWith(httpId);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, id, 'select', httpId);
            expect(activePage.usages).toEqual([]);
        });
    });
    describe('resetStateTabs should set the correct variables', function() {
        var newOntologyIRI = 'newId';
        beforeEach(function() {
            ontologyStateSvc.listItem.editorTabStates = {
                classes: {entityIRI: 'id', usages: []},
                project: {entityIRI: 'id', preview: 'test'}
            }
            ontologyManagerSvc.getOntologyIRI.and.returnValue(newOntologyIRI);
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue({'@id': newOntologyIRI});
            ontologyStateSvc.listItem.selected = {};
        });
        it('when getActiveKey is not project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('other');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.listItem.editorTabStates.classes).toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.project).toEqual({entityIRI: newOntologyIRI, preview: ''});
            expect(ontologyStateSvc.listItem.selected).toBeUndefined();
        });
        it('when getActiveKey is project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('project');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.listItem.editorTabStates.classes).toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.project).toEqual({entityIRI: newOntologyIRI, preview: ''});
            expect(ontologyStateSvc.listItem.selected).toEqual({'@id': newOntologyIRI});
        });
    });
    describe('getActiveKey', function() {
        it('defaults to "project"', function() {
            ontologyStateSvc.listItem.editorTabStates.tab.active = false;
            expect(ontologyStateSvc.getActiveKey()).toEqual('project');
        });
        it('returns the correct value', function() {
            expect(ontologyStateSvc.getActiveKey()).toEqual('tab');
        });
    });
    it('getActivePage gets the proper item', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('tab');
        expect(ontologyStateSvc.getActivePage()).toEqual(ontologyStateSvc.listItem.editorTabStates.tab);
    });
    describe('setActivePage sets the correct variables', function() {
        it('when state has the key', function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
            ontologyStateSvc.setActivePage('other');
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.tab.active).toBe(false);
            expect(ontologyStateSvc.listItem.editorTabStates.other.active).toBe(true);
        });
        it('when state does not have the key', function() {
            spyOn(ontologyStateSvc, 'getActivePage');
            ontologyStateSvc.setActivePage('notThere');
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.tab.active).toBe(true);
            expect(ontologyStateSvc.listItem.editorTabStates.other.active).toBe(false);
        });
    });
    it('getActiveEntityIRI should return the proper value', function() {
        spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
        expect(ontologyStateSvc.getActiveEntityIRI()).toEqual('entityIRI');

        ontologyStateSvc.getActivePage.and.returnValue(ontologyStateSvc.listItem.editorTabStates.other);
        expect(ontologyStateSvc.getActiveEntityIRI()).toEqual(undefined);
    });
    describe('selectItem should call the proper functions', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
            spyOn(ontologyStateSvc, 'setEntityUsages');
            spyOn(ontologyStateSvc, 'setSelected');
        });
        it('when entityIRI is undefined', function() {
            ontologyStateSvc.selectItem(undefined);
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(undefined, false);
        });
        describe('when entityIRI is defined', function() {
            var newId = 'newId';
            it('and getUsages is true', function() {
                ontologyStateSvc.selectItem(newId, true);
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(newId);
                expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(newId);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(newId, false);
            });
            it('and getUsages is false', function() {
                ontologyStateSvc.selectItem(newId, false);
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(newId);
                expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(newId, false);
            });
        });
    });
    it('unSelectItem sets all the variables appropriately', function() {
        spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
        ontologyStateSvc.unSelectItem();
        expect(ontologyStateSvc.listItem.selected).toBeUndefined();
        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'entityIRI')).toBe(true);
        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
    });
    describe('hasChanges returns the proper value', function() {
        var recordId = 'recordId';
        it('when the listItem has additions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({additions: ['test']});
            expect(ontologyStateSvc.hasChanges(recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({deletions: ['test']});
            expect(ontologyStateSvc.hasChanges(recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has neither additions nor deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({});
            expect(ontologyStateSvc.hasChanges(recordId)).toBe(false);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
    });
    describe('isCommittable returns the proper value', function() {
        var recordId = 'recordId';
        it('when the listItem has additions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({inProgressCommit: {additions: ['test']}});
            expect(ontologyStateSvc.isCommittable(recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({inProgressCommit: {deletions: ['test']}});
            expect(ontologyStateSvc.isCommittable(recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
        it('when the listItem has neither additions nor deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({});
            expect(ontologyStateSvc.isCommittable(recordId)).toBe(false);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        });
    });
    describe('addEntityToHierarchy', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'flattenHierarchy');
        });
        describe('should add the entity to the single proper location in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node1a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'new-node'
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node1a']
                });
            });
            it('where the parent does not have subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3c');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3c']
                });
            });
        });
        describe('should add the entity to the multiple proper locations in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3b');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            },
                            {
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'new-node'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3b']
                });
            });
            it('where the parent does not have subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a',
                                subEntities: [{
                                    entityIRI: 'new-node'
                                }]
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3a']
                });
            });
        });
        describe('should add the same hierarchy structure to the new area', function() {
            it('when not at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'node2b', indexObject, 'node1b');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a','node1b'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a']
                });
            });
            it('when at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'node1b', indexObject, 'node1a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node1b',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'node1b': ['node1a']
                });
            });
        });
        it('should add the entity to the end of the hierarchy if the provided parentIRI is not in the hierarchy', function() {
            ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'not-there');
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3a'
                    },
                    {
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            },
            {
                entityIRI: 'new-node'
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
    });
    describe('deleteEntityFromParentInHierarchy', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'flattenHierarchy');
        });
        it('should remove the provided entityIRI from the parentIRI', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(hierarchy, 'node3a', 'node3b', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3a'
                    },
                    {
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        it('should add any subEntities that are unique to this location', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(hierarchy, 'node2a', 'node1a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            },
            {
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                },
                {
                    entityIRI: 'node3c'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
    });
    describe('deleteEntityFromHierarchy', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'flattenHierarchy');
        });
        it('should delete the entity from the hierarchy tree', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(hierarchy, 'node3a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b'
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        it('should move the subEntities if required', function() {
            updateRefsSvc.remove.and.callFake(function(indexObject, entityIRI) {
                _.unset(indexObject, 'node3c');
            });
            ontologyStateSvc.deleteEntityFromHierarchy(hierarchy, 'node2a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            },
            {
                entityIRI: 'node3c'
            }]);
            expect(updateRefsSvc.remove).toHaveBeenCalledWith(indexObject, 'node2a');
            expect(indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c', 'node1b']
            });
        });
    });
    it('getPathsTo should return all paths to provided node', function() {
        var result = ontologyStateSvc.getPathsTo(hierarchy, indexObject, 'node3a');
        expect(result.length).toBe(4);
        expect(_.sortBy(result)).toEqual(_.sortBy(expectedPaths));
    });
    describe('areParentsOpen should return', function() {
        var node = {
            indent: 1,
            entityIRI: 'iri',
            path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
        };
        it('true when all parent paths are open', function() {
            spyOn(ontologyStateSvc, 'getOpened').and.returnValue(true);
            expect(ontologyStateSvc.areParentsOpen(node)).toBe(true);
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith('recordId.otherIRI');
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith('recordId.otherIRI.andAnotherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith('recordId');
        });
        it('false when all parent paths are not open', function() {
            spyOn(ontologyStateSvc, 'getOpened').and.returnValue(false);
            expect(ontologyStateSvc.areParentsOpen(node)).toBe(false);
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith('recordId.otherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith('recordId.otherIRI.andAnotherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith('recordId');
        });
    });
    it('joinPath joins the provided array correctly', function() {
        expect(ontologyStateSvc.joinPath(['a', 'b', 'c'])).toBe('a.b.c');
    });
    describe('goTo calls the proper manager functions with correct parameters when it is', function() {
        var entity = {'@id': 'entityId'};
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue(entity);
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({entityIRI: ''});
            spyOn(ontologyStateSvc, 'setActivePage');
            spyOn(ontologyStateSvc, 'selectItem');
            spyOn(ontologyStateSvc, 'openAt');
            ontologyStateSvc.listItem = {
                ontologyRecord: {},
                flatConceptHierarchy: [],
                flatConceptSchemeHierarchy: [],
                flatClassHierarchy: [],
                flatDataPropertyHierarchy: [],
                flatObjectPropertyHierarchy: [],
                flatAnnotationPropertyHierarchy: [],
                derivedConcepts: ['concept'],
                derivedConceptSchemes: ['scheme']
            }
        });
        it('a concept', function() {
            ontologyManagerSvc.isConcept.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('concepts');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.flatConceptHierarchy, 'iri');
        });
        it('a concept scheme', function() {
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('schemes');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.flatConceptSchemeHierarchy, 'iri');
        });
        it('a class', function() {
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('classes');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.flatClassHierarchy, 'iri');
        });
        it('a datatype property', function() {
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            spyOn(ontologyStateSvc, 'setDataPropertiesOpened');
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.flatDataPropertyHierarchy, 'iri');
            expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
        });
        it('an object property', function() {
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            spyOn(ontologyStateSvc, 'setObjectPropertiesOpened');
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.flatObjectPropertyHierarchy, 'iri');
            expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
        });
        it('an annotation property', function() {
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isAnnotation.and.returnValue(true);
            spyOn(ontologyStateSvc, 'setAnnotationPropertiesOpened');
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.flatAnnotationPropertyHierarchy, 'iri');
            expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
        });
        it('an individual', function() {
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isIndividual).toHaveBeenCalledWith(entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).not.toHaveBeenCalled();
        });
    });
    it('openAt sets all parents open', function() {
        var item = [{offsetTop: 25}];
        $document.querySelectorAll.and.returnValue(item);
        spyOn(ontologyStateSvc, 'setOpened');
        var flatHierarchy = [{
            entityIRI: 'iri-a',
            path: ['recordId', 'iri-a']
        }, {
            entityIRI: 'iri-b',
            path: ['recordId', 'iri-a', 'iri-b']
        }, {
            entityIRI: 'iri-c',
            path: ['recordId', 'iri-a', 'iri-b', 'iri-c']
        }];
        ontologyStateSvc.openAt(flatHierarchy, 'iri-c');
        expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith('recordId.iri-a', true);
        expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith('recordId.iri-a.iri-b', true);
        // $scope.apply();
        // expect($document.querySelectorAll).toHaveBeenCalledWith('[class*=hierarchy-block] .repeater-container');
        // expect($document.querySelectorAll).toHaveBeenCalledWith('[data-path-to="recordId.iri-a.iri-b.iri-c"]');
        // expect(item[0].scrollTop).toBe(25);
    });
    describe('getDefaultPrefix returns the proper value for the prefix associated with ontology', function() {
        it('when there is no iriBegin or iriThen', function() {
            ontologyStateSvc.listItem.ontologyId = 'ontologyId#';
            expect(ontologyStateSvc.getDefaultPrefix()).toEqual('ontologyId/#');
        });
        it('when there is a iriBegin and iriThen', function() {
            ontologyStateSvc.listItem = {
                iriBegin: 'begin#',
                iriThen: 'then'
            }
            expect(ontologyStateSvc.getDefaultPrefix()).toEqual('begin/then');
        });
    });
    describe('updatePropertyIcon should set the icon of an entity', function() {
        var entity;
        beforeEach(function() {
            entity = {};
        });
        it('unless it is not a property', function() {
            ontologyManagerSvc.isProperty.and.returnValue(false);
            ontologyStateSvc.updatePropertyIcon(entity);
            expect(_.has(entity, 'matonto.icon')).toBe(false);
        });
        describe('if it is a property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isProperty.and.returnValue(true);
            });
            it('with more than one range', function() {
                _.set(entity, "['" + prefixes.rdfs + "range']", [{'@id': '1'}, {'@id': '2'}]);
                ontologyStateSvc.updatePropertyIcon(entity);
                expect(_.get(entity, 'matonto.icon')).toBe('fa-cubes');
            });
            it('with a range of xsd:string or rdf:langString', function() {
                var tests = [prefixes.xsd + 'string', prefixes.rdf + 'langString'];
                _.forEach(tests, function(test) {
                    _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(entity);
                    expect(_.get(entity, 'matonto.icon')).toBe('fa-font');
                });
            });
            it('with a range of xsd:decimal, xsd:double, xsd:float, xsd:int, xsd:integer, xsd:long, or xsd:nonNegativeInteger', function() {
                var tests = [prefixes.xsd + 'decimal', prefixes.xsd + 'double', prefixes.xsd + 'float', prefixes.xsd + 'int', prefixes.xsd + 'integer', prefixes.xsd + 'long', prefixes.xsd + 'nonNegativeInteger'];
                _.forEach(tests, function(test) {
                    _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(entity);
                    expect(_.get(entity, 'matonto.icon')).toBe('fa-calculator');
                });
            });
            it('with a range of xsd:language', function() {
                _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'language');
                ontologyStateSvc.updatePropertyIcon(entity);
                expect(_.get(entity, 'matonto.icon')).toBe('fa-language');
            });
            it('with a range of xsd:anyURI', function() {
                _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'anyURI');
                ontologyStateSvc.updatePropertyIcon(entity);
                expect(_.get(entity, 'matonto.icon')).toBe('fa-external-link');
            });
            it('with a range of xsd:anyURI', function() {
                _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'dateTime');
                ontologyStateSvc.updatePropertyIcon(entity);
                expect(_.get(entity, 'matonto.icon')).toBe('fa-clock-o');
            });
            it('with a range of xsd:boolean or xsd:byte', function() {
                var tests = [prefixes.xsd + 'boolean', prefixes.xsd + 'byte'];
                _.forEach(tests, function(test) {
                    _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(entity);
                    expect(_.get(entity, 'matonto.icon')).toBe('fa-signal');
                });
            });
            it('with a range of rdfs:Literal', function() {
                _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.rdfs + 'Literal');
                ontologyStateSvc.updatePropertyIcon(entity);
                expect(_.get(entity, 'matonto.icon')).toBe('fa-cube');
            });
            it('with a range that is not predefined', function() {
                _.set(entity, "['" + prefixes.rdfs + "range'][0]['@id']", 'test');
                ontologyStateSvc.updatePropertyIcon(entity);
                expect(_.get(entity, 'matonto.icon')).toBe('fa-link');
            });
        });
    });

    describe('uploadChanges should call the proper methods', function() {
        var uploadDeferred;
        beforeEach(function() {
            ontologyStateSvc.list = [{ ontologyRecord: { recordId: 'recordId' }, inProgressCommit: {  } }];
            uploadDeferred = $q.defer();
            ontologyManagerSvc.uploadChangesFile.and.returnValue(uploadDeferred.promise);
        });
        describe('when uploadChangesFile resolves', function() {
            var getDeferred;
            beforeEach(function() {
                uploadDeferred.resolve();
                getDeferred = $q.defer();
                catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
            });
            it('and getInProgressCommit resolves', function() {
                createDeferred = $q.defer();
                spyOn(ontologyStateSvc, 'updateOntology').and.returnValue(createDeferred.promise);
                ontologyStateSvc.list[0].ontologyState = { upToDate: true };
                getDeferred.promise = { additions: ['a'], deletions: [] };
                catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
                ontologyStateSvc.uploadChanges({}, recordId, branchId, commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, recordId, branchId, commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
            });
            it ('and getInProgressCommit rejects', function() {
                ontologyStateSvc.list[0].ontologyState = { upToDate: true };
                getDeferred.reject(error);
                ontologyStateSvc.uploadChanges({}, recordId, branchId, commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, recordId, branchId, commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
            });
        });
        it('when uploadChangesFile rejects', function() {
            uploadDeferred.reject(error);
            ontologyStateSvc.uploadChanges({}, recordId, branchId, commitId);
            scope.$apply();
            expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, recordId, branchId, commitId);
            expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
            expect(ontologyStateSvc.hasInProgressCommit(ontologyStateSvc.list[0])).toBe(false);
        });
    });
    describe('hasInProgressCommit returns the correct value', function() {
        it('when listItem.inProgressCommit is undefined.', function() {
            listItem.inProgressCommit = undefined;
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
        });
        it('when additions and deletions are undefined.', function() {
            listItem.inProgressCommit = {};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
        });
        it('when additions and/or deletions are defined but empty.', function() {
            listItem.inProgressCommit = {additions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
            listItem.inProgressCommit = {deletions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
            listItem.inProgressCommit = {additions: [], deletions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
        });
        it('when additions and/or deletions are defined and not empty.', function() {
            listItem.inProgressCommit = {additions: ['a'], deletions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(true);
            listItem.inProgressCommit = {additions: [], deletions: ['b']};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(true);
            listItem.inProgressCommit = {additions: ['a'], deletions: ['b']};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(true);
        });
    });
    describe('setPageTitle sets the variable to the correct value with the type is', function() {
        it('ontology', function() {
            ontologyStateSvc.setPageTitle('ontology');
            expect($state.current.data.title).toBe('Ontology Editor');
        });
        it('vocabulary', function() {
            ontologyStateSvc.setPageTitle('vocabulary');
            expect($state.current.data.title).toBe('Vocabulary Editor');
        });
    });
});
