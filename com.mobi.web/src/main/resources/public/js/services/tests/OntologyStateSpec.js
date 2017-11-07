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
describe('Ontology State Service', function() {
    var ontologyStateSvc, $q, scope, util, stateManagerSvc, ontologyManagerSvc, updateRefsSvc, prefixes, catalogManagerSvc, hierarchy, indexObject, expectedPaths, ontologyState, defaultDatatypes, ontologyObj, classObj, dataPropertyObj, individualObj, ontology, getResponse, httpSvc, $document, responseObj, $state;

    var error, format, title, description, keywords, inProgressCommit, emptyInProgressCommit, recordId, recordTitle, branchId, commitId, ontologyId, catalogId, anonymous, branch, commitObj, ontologyType, vocabularyType, jsonFilter, differenceObj, index, importedOntologies, importedOntologyIds, classId, classId2, objectPropertyId, objectPropertyId2, datatypeId, datatypeId2, annotationId, annotationId2, dataPropertyId, dataPropertyId2, individualId, individualId2, conceptId, conceptSchemeId, irisResponse, importedIrisResponse, classHierarchiesResponse, conceptHierarchiesResponse, conceptSchemeHierarchiesResponse, classesWithIndividualsResponse, dataPropertyHierarchiesResponse, objectPropertyHierarchiesResponse, annotationPropertyHierarchiesResponse, branches, path;

    beforeEach(function() {
        module('ontologyState');
        mockPropertyManager();
        mockOntologyManager();
        mockUpdateRefs();
        mockStateManager();
        mockUtil();
        mockCatalogManager();
        injectRemoveMobiFilter();
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

        error = 'error';
        format = 'jsonld';
        title = 'title';
        description = 'description';
        keywords = 'keyword1,keyword2';
        inProgressCommit = {
            additions: ['test'],
            deletions: ['test']
        };
        emptyInProgressCommit = {
            additions: [],
            deletions: []
        };
        recordId = 'recordId';
        recordTitle = 'recordTitle';
        branchId = 'branchId';
        commitId = 'commitId';
        ontologyId = 'ontologyId';
        catalogId = 'catalogId';
        anonymous = 'anonymous';
        branch = {
            '@id': branchId
        };
        commitObj = {
            commit: {
                '@id': commitId
            }
        };
        ontologyType = 'ontology';
        vocabularyType = 'vocabulary';
        jsonFilter = 'json';
        differenceObj = {additions: '', deletions: ''};
        index = {
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
        importedOntologies = [];
        importedOntologyIds = [];
        classId = 'https://classId.com';
        classId2 = prefixes.skos + 'Concept';
        objectPropertyId = 'objectPropertyId';
        objectPropertyId2 = 'objectProperty2';
        datatypeId = 'datatypeId';
        datatypeId2 = 'datatypeId2';
        annotationId = 'annotationId';
        annotationId2 = 'annotationId2';
        dataPropertyId = 'dataPropertyId';
        dataPropertyId2 = 'dataPropertyId2';
        individualId = 'individualId';
        individualId2 = 'individualId2';
        conceptId = 'conceptId';
        conceptSchemeId = 'conceptSchemeId';
        irisResponse = {
            annotationProperties: [{localName: annotationId, namespace: annotationId}],
            classes: [{localName: classId, namespace: classId}],
            dataProperties: [{localName: dataPropertyId, namespace: dataPropertyId}],
            objectProperties: [{localName: objectPropertyId, namespace: objectPropertyId}],
            namedIndividuals: [{localName: individualId, namespace: individualId}],
            datatypes: [{localName: datatypeId, namespace: datatypeId}],
            derivedConcepts: [{localName: conceptId, namespace: conceptId}],
            derivedConceptSchemes: [{localName: conceptSchemeId, namespace: conceptSchemeId}]
        };
        importedIrisResponse = [{
            id: ontologyId,
            annotationProperties: [{localName: annotationId2, namespace: annotationId2}],
            classes: [{localName: classId2, namespace: classId2}],
            dataProperties: [{localName: dataPropertyId2, namespace: dataPropertyId2}],
            objectProperties: [{localName: objectPropertyId2, namespace: objectPropertyId2}],
            namedIndividuals: [{localName: individualId2, namespace: individualId2}],
            datatypes: [{localName: datatypeId2, namespace: datatypeId2}]
        }];
        classHierarchiesResponse = {
            hierarchy: [],
            index: {}
        };
        conceptHierarchiesResponse = {
            hierarchy: [],
            index: {}
        };
        conceptSchemeHierarchiesResponse = {
            hierarchy: [],
            index: {}
        };
        classesWithIndividualsResponse = {
            individuals: {
                'ClassA': ['IndivA1', 'IndivA2']
            },
            individualsParentPath: ['ClassA']
        };
        dataPropertyHierarchiesResponse = {
            hierarchy: [],
            index: {}
        };
        objectPropertyHierarchiesResponse = {
            hierarchy: [],
            index: {}
        };
        annotationPropertyHierarchiesResponse = {
            hierarchy: [],
            index: {}
        };
        branches = [branch];

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
            }, {
                entityIRI: 'node2b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            }, {
                entityIRI: 'node2c',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }]
        }, {
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
        ontologyManagerSvc.defaultDatatypes = _.concat(_.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], function(item) {
            return {
                'namespace': prefixes.xsd,
                'localName': item
            }
        }), _.map(['langString'], function(item) {
            return {
                namespace: prefixes.rdf,
                localName: item
            }
        }));
        ontologyObj = {
            '@id': ontologyId,
            '@type': [prefixes.owl + 'Ontology'],
            mobi: {
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
            upToDate: true,
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
        path = 'this.is.the.path';
    });

    afterEach(function() {
        ontologyStateSvc = null;
        $q = null;
        scope = null;
        util = null;
        stateManagerSvc = null;
        ontologyManagerSvc = null;
        updateRefsSvc = null;
        prefixes = null;
        catalogManagerSvc = null;
        hierarchy = null;
        indexObject = null;
        expectedPaths = null;
        ontologyState = null;
        defaultDatatypes = null;
        ontologyObj = null;
        classObj = null;
        dataPropertyObj = null;
        individualObj = null;
        ontology = null;
        getResponse = null;
        httpSvc = null;
        $document = null;
        responseObj = null;
        $state = null;
        error = null;
        format = null;
        title = null;
        description = null;
        keywords = null;
        inProgressCommit = null;
        emptyInProgressCommit = null;
        recordId = null;
        recordTitle = null;
        branchId = null;
        commitId = null;
        ontologyId = null;
        catalogId = null;
        anonymous = null;
        branch = null;
        commitObj = null;
        ontologyType = null;
        vocabularyType = null;
        jsonFilter = null;
        differenceObj = null;
        index = null;
        importedOntologies = null;
        importedOntologyIds = null;
        classId = null;
        classId2 = null;
        objectPropertyId = null;
        objectPropertyId2 = null;
        datatypeId = null;
        datatypeId2 = null;
        annotationId = null;
        annotationId2 = null;
        dataPropertyId = null;
        dataPropertyId2 = null;
        individualId = null;
        individualId2 = null;
        conceptId = null;
        conceptSchemeId = null;
        irisResponse = null;
        importedIrisResponse = null;
        classHierarchiesResponse = null;
        conceptHierarchiesResponse = null;
        conceptSchemeHierarchiesResponse = null;
        classesWithIndividualsResponse = null;
        dataPropertyHierarchiesResponse = null;
        objectPropertyHierarchiesResponse = null;
        annotationPropertyHierarchiesResponse = null;
        branches = null;
    });

    describe('getOntology calls the correct methods', function() {
        beforeEach(function() {
            this.expected = {
                recordId: recordId,
                ontology: ontology,
                branchId: branchId,
                commitId: commitId,
                inProgressCommit: inProgressCommit
            };
            this.expected2 = {
                recordId: recordId,
                ontology: ontology,
                branchId: branchId,
                commitId: commitId,
                inProgressCommit: emptyInProgressCommit
            };
        });
        describe('if state exists', function() {
            beforeEach(function() {
                stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
            });
            describe('and getInProgressCommit is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.resolve(inProgressCommit));
                });
                it('and getOntology is resolved', function() {
                    var self = this;
                    ontologyManagerSvc.getOntology.and.returnValue($q.resolve(ontology));
                    ontologyStateSvc.getOntology(recordId, format)
                        .then(function(response) {
                            expect(response).toEqual(self.expected);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                    expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                });
                describe('and getOntology is rejected', function() {
                    beforeEach(function() {
                        ontologyManagerSvc.getOntology.and.returnValue($q.reject(error));
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        beforeEach(function() {
                            stateManagerSvc.deleteOntologyState.and.returnValue($q.resolve());
                        });
                        it('and getLatestOntology is resolved', function() {
                            var self = this;
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.resolve(self.expected2));
                            ontologyStateSvc.getOntology(recordId, format)
                                .then(function(response) {
                                    expect(response).toEqual(self.expected2);
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
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(error));
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
                        stateManagerSvc.deleteOntologyState.and.returnValue($q.reject(error));
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
                    beforeEach(function() {
                        catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject('InProgressCommit could not be found'));
                    });
                    it('and getOntology is resolved', function() {
                        var self = this;
                        ontologyManagerSvc.getOntology.and.returnValue($q.when(ontology));
                        ontologyStateSvc.getOntology(recordId, format)
                            .then(function(response) {
                                expect(response).toEqual(self.expected2);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                        expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                    });
                    describe('and getOntology is rejected', function() {
                        beforeEach(function() {
                            ontologyManagerSvc.getOntology.and.returnValue($q.reject(error));
                        });
                        describe('and deleteOntologyState is resolved', function() {
                            beforeEach(function() {
                                stateManagerSvc.deleteOntologyState.and.returnValue($q.when());
                            });
                            it('and getLatestOntology is resolved', function() {
                                var self = this;
                                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.when(self.expected2));
                                ontologyStateSvc.getOntology(recordId, format)
                                    .then(function(response) {
                                        expect(response).toEqual(self.expected2);
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
                                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(error));
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
                            stateManagerSvc.deleteOntologyState.and.returnValue($q.reject(error));
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
                    beforeEach(function() {
                        catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(error));
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        beforeEach(function() {
                            stateManagerSvc.deleteOntologyState.and.returnValue($q.when());
                        });
                        it('and getLatestOntology is resolved', function() {
                            var self = this;
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.when(self.expected2));
                            ontologyStateSvc.getOntology(recordId, format)
                                .then(function(response) {
                                    expect(response).toEqual(self.expected2);
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
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(error));
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
                        stateManagerSvc.deleteOntologyState.and.returnValue($q.reject(error));
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
            it('and getLatestOntology is resolved', function() {
                var self = this;
                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.when(self.expected2));
                ontologyStateSvc.getOntology(recordId, format)
                    .then(function(response) {
                        expect(response).toEqual(self.expected2);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(recordId, format);
            });
            it('and getLatestOntology is rejected', function() {
                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(error));
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
        describe('if getRecordMasterBranch is resolved', function() {
            beforeEach(function() {
                catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': branchId}));
            });
            describe('and getRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when(branch));
                });
                describe('and createOntologyState is resolved', function() {
                    beforeEach(function() {
                        stateManagerSvc.createOntologyState.and.returnValue($q.when());
                    });
                    it('and getOntology is resolved', function() {
                        var self = this;
                        self.expected = {
                            recordId: recordId,
                            ontology: ontology,
                            branchId: branchId,
                            commitId: commitId,
                            inProgressCommit: emptyInProgressCommit
                        };
                        ontologyManagerSvc.getOntology.and.returnValue($q.when(ontology));
                        ontologyStateSvc.getLatestOntology(recordId, format)
                            .then(function(response) {
                                expect(response).toEqual(self.expected);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                    });
                    it('and getOntology is rejected', function() {
                        ontologyManagerSvc.getOntology.and.returnValue($q.reject(error));
                        ontologyStateSvc.getLatestOntology(recordId, format)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, format);
                    });
                });
                it('and createOntologyState is rejected', function() {
                    stateManagerSvc.createOntologyState.and.returnValue($q.reject(error));
                    ontologyStateSvc.getLatestOntology(recordId, format)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                });
            });
            it('and getRecordBranch is rejected', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(error));
                ontologyStateSvc.getLatestOntology(recordId, format)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(stateManagerSvc.createOntologyState).not.toHaveBeenCalled();
            });
        });
        it('if getRecordMasterBranch is rejected', function() {
            catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject(error));
            ontologyStateSvc.getLatestOntology(recordId, format)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(recordId, catalogId);
            expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
        });
    });
    describe('uploadThenGet should call the proper methods', function() {
        describe('when uploadFile resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadFile.and.returnValue($q.when({recordId: recordId}));
                spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.when(getResponse));
            });
            describe('and getOntology resolves', function() {
                beforeEach(function() {
                    ontologyManagerSvc.getOntologyIRI.and.returnValue(ontologyId);
                    spyOn(ontologyStateSvc, 'setSelected');
                    spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
                    spyOn(ontologyStateSvc, 'setPageTitle');
                });
                describe('and type is "ontology"', function() {
                    it('and addOntologyToList resolves', function() {
                        spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.when(listItem));
                        listItem.ontologyRecord.type = 'ontology';
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, ontologyType)
                            .then(function(response) {
                                expect(response).toEqual(recordId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                        expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title);
                        expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                        expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('ontology');
                    });
                    it('and addOntologyToList rejects', function() {
                        spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.reject(error));
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, ontologyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title);
                    });
                });
                describe('and type is "vocabulary"', function() {
                    it('and addVocabularyToList resolves', function() {
                        spyOn(ontologyStateSvc, 'addVocabularyToList').and.returnValue($q.when(listItem));
                        listItem.ontologyRecord.type = 'vocabulary';
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, vocabularyType)
                            .then(function(response) {
                                expect(response).toEqual(recordId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title);
                        expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                        expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('vocabulary');
                    });
                    it('and addVocabularyToList rejects', function() {
                        spyOn(ontologyStateSvc, 'addVocabularyToList').and.returnValue($q.reject(error));
                        ontologyStateSvc.uploadThenGet({}, title, description, keywords, vocabularyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title);
                    });
                });
            });
            it('and getOntology rejects', function() {
                ontologyStateSvc.getOntology.and.returnValue($q.reject(error));
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
            ontologyManagerSvc.uploadFile.and.returnValue($q.reject(error));
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
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.upToDate)
                            .then(_.noop, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                        expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                    it('and updateOntologyState rejects', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.reject(error));
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.upToDate)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                        expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                });
                it('and createOntologyListItem rejects', function() {
                    spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(error));
                    ontologyStateSvc.updateOntology(recordId, branchId, commitId, ontologyType, listItem.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                    expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                });
            });
            describe('and type is "vocabulary"', function() {
                describe('and createVocabularyListItem resolves', function() {
                    beforeEach(function() {
                        spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue($q.resolve(listItem));
                    });
                    it('and updateOntologyState resolves', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.resolve());
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.upToDate)
                            .then(_.noop, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                        expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                    it('and updateOntologyState rejects', function() {
                        stateManagerSvc.updateOntologyState.and.returnValue($q.reject(error));
                        ontologyStateSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.upToDate)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                        expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                        expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(recordId, branchId, commitId);
                    });
                });
                it('and createVocabularyListItem rejects', function() {
                    spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue($q.reject(error));
                    ontologyStateSvc.updateOntology(recordId, branchId, commitId, vocabularyType, listItem.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
                    expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                });
            });
        });
        it('and getOntology rejects', function() {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject(error));
            ontologyStateSvc.updateOntology(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(recordId, branchId, commitId, 'jsonld', false);
        });
    });
    describe('openOntology should call the proper methods', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'setSelected');
            spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
            spyOn(ontologyStateSvc, 'setPageTitle');
        });
        describe('when getOntology resolves', function() {
            beforeEach(function() {
                spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.when(getResponse));
            });
            describe('and getRecordBranch resolves', function() {
                beforeEach(function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when(branch));
                    ontologyManagerSvc.getOntologyIRI.and.returnValue(ontologyId);
                });
                describe('and type is "ontology"', function() {
                    it('and addOntologyToList resolves', function() {
                        spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.when(listItem));
                        listItem.ontologyRecord.type = 'ontology';
                        ontologyStateSvc.openOntology(recordId, title, ontologyType)
                            .then(function(response) {
                                expect(response).toEqual(ontologyId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                        expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, true);
                        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                        expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                        expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('ontology');
                    });
                    it('and addOntologyToList rejects', function() {
                        spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.reject(error));
                        ontologyStateSvc.openOntology(recordId, title, ontologyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(ontology);
                        expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, true);
                    });
                });
                describe('and type is "vocabulary"', function() {
                    it('and addVocabularyToList resolves', function() {
                        spyOn(ontologyStateSvc, 'addVocabularyToList').and.returnValue($q.when(listItem));
                        listItem.ontologyRecord.type = 'vocabulary';
                        ontologyStateSvc.openOntology(recordId, title, vocabularyType)
                            .then(function(response) {
                                expect(response).toEqual(ontologyId);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, true);
                        expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                        expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                        expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('vocabulary');
                    });
                    it('and addVocabularyToList rejects', function() {
                        spyOn(ontologyStateSvc, 'addVocabularyToList').and.returnValue($q.reject(error));
                        ontologyStateSvc.openOntology(recordId, title, vocabularyType)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyStateSvc.addVocabularyToList).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, true);
                    });
                });
            });
            it('and getRecordBranch rejects', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(error));
                ontologyStateSvc.openOntology(recordId)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
            });
        });
        it('and getOntology rejects', function() {
            spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.reject(error));
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
        expect(ontologyStateSvc.listItem).toEqual({});
    });
    it('removeBranch removes the correct object from the branches list', function() {
        spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
        ontologyStateSvc.removeBranch(recordId, branchId);
        expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        expect(listItem.branches).toEqual([]);
    });
    describe('saveChanges should call the correct methods', function() {
        describe('when getInProgressCommit resolves', function() {
            beforeEach(function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when());
            });
            it('and updateInProgressCommit resolves', function() {
                var resolved = 'this';
                catalogManagerSvc.updateInProgressCommit.and.returnValue($q.when(resolved));
                ontologyStateSvc.saveChanges(recordId, differenceObj)
                    .then(function(response) {
                        expect(response).toEqual(resolved);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
            it('and updateInProgressCommit rejects', function() {
                catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject(error));
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
                beforeEach(function() {
                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject('InProgressCommit could not be found'));
                });
                describe('and createInProgressCommit resolves', function() {
                    beforeEach(function() {
                        catalogManagerSvc.createInProgressCommit.and.returnValue($q.when());
                    });
                    it('and updateInProgressCommit resolves', function() {
                        var resolved = 'this';
                        catalogManagerSvc.updateInProgressCommit.and.returnValue($q.when(resolved));
                        ontologyStateSvc.saveChanges(recordId, differenceObj)
                            .then(function(response) {
                                expect(response).toEqual(resolved);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    });
                    it('and updateInProgressCommit rejects', function() {
                        catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject(error));
                        ontologyStateSvc.saveChanges(recordId, differenceObj)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(error);
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    });
                });
                it('and createInProgressCommit rejects', function() {
                    catalogManagerSvc.createInProgressCommit.and.returnValue($q.reject(error));
                    ontologyStateSvc.saveChanges(recordId, differenceObj)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                });
            });
            it('and the error message is not "InProgressCommit could not be found"', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(error));
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
        describe('when uploadJson succeeds', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadJson.and.returnValue($q.when({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId}));
                ontologyStateSvc.list = [];
                spyOn(ontologyStateSvc, 'setSelected');
                spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
                spyOn(ontologyStateSvc, 'setPageTitle');
            });
            it('and getRecordBranch resolves', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.when(branch));
                ontologyStateSvc.createOntology(ontologyObj, title, description, keywords)
                    .then(function(response) {
                        expect(response).toEqual({entityIRI: ontologyObj['@id'], recordId: recordId, branchId: branchId, commitId: commitId});
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.list.length).toBe(1);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('ontology');
            });
            it('and getRecordBranch rejects', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(error));
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
            ontologyManagerSvc.uploadJson.and.returnValue($q.reject(error));
            ontologyStateSvc.createOntology(ontologyObj, title)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
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
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({
                ontology: ontology,
                ontologyId: ontologyId,
                recordId: recordId,
                commitId: commitId,
                branchId: branchId,
                branches: [branch]
            });
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
            listItem.iriList = ['classA'];
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
            expect(listItem.iriList).toEqual([]);
        });
        it('if it does not point to blank nodes', function() {
            expect(ontologyStateSvc.removeEntity(listItem, classId)).toEqual([classObj]);
            expect(_.has(listItem.index, classId)).toBe(false);
            expect(listItem.index.dataPropertyId.position).toEqual(1);
            expect(listItem.iriList).not.toContain(classId);
        });
    });
    describe('setVocabularyStuff sets the appropriate state variables on', function() {
        beforeEach(function() {
            this.response = {
                derivedConcepts: [{localName: 'derivedConcept'}],
                derivedConceptSchemes: [{localName: 'derivedConceptScheme'}],
                concepts: {
                    index: {0: 'derivedConcept'},
                    hierarchy: ['derivedConcept']
                },
                conceptSchemes: {
                    index: {0: 'derivedConceptScheme'},
                    hierarchy: ['derivedConceptScheme']
                }
            };
            spyOn(ontologyStateSvc, 'flattenHierarchy').and.callFake(function(arr) {
                return arr;
            });
            responseObj.getItemIri.and.callFake(function(obj) {
                return obj.localName;
            });
        });
        describe('the current listItem when getVocabularyStuff', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.derivedConcepts = [];
                ontologyStateSvc.listItem.derivedConceptSchemes = [];
                ontologyStateSvc.listItem.concepts = {hierarchy: [], index: {}, flat: []};
                ontologyStateSvc.listItem.conceptSchemes = {hierarchy: [], index: {}, flat: []};
                ontologyStateSvc.listItem.editorTabStates.concepts = {entityIRI: 'iri', usages: []};
            });
            it('resolves', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.when(this.response));
                ontologyStateSvc.setVocabularyStuff();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyStateSvc.listItem.derivedConcepts).toEqual(['derivedConcept']);
                expect(ontologyStateSvc.listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual(this.response.concepts.hierarchy);
                expect(ontologyStateSvc.listItem.concepts.index).toEqual(this.response.concepts.index);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual(this.response.concepts.hierarchy);
                expect(ontologyStateSvc.listItem.conceptSchemes.hierarchy).toEqual(this.response.conceptSchemes.hierarchy);
                expect(ontologyStateSvc.listItem.conceptSchemes.index).toEqual(this.response.conceptSchemes.index);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual(this.response.conceptSchemes.hierarchy);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(this.response.concepts.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(this.response.conceptSchemes.hierarchy, ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({});
                expect(util.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.reject(error));
                ontologyStateSvc.setVocabularyStuff();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyStateSvc.listItem.derivedConcepts).toEqual([]);
                expect(ontologyStateSvc.listItem.derivedConceptSchemes).toEqual([]);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual([]);
                expect(ontologyStateSvc.listItem.concepts.index).toEqual({});
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                expect(ontologyStateSvc.listItem.conceptSchemes.hierarchy).toEqual([]);
                expect(ontologyStateSvc.listItem.conceptSchemes.index).toEqual({});
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
                expect(util.createErrorToast).toHaveBeenCalledWith(error);
            });
        });
        describe('the provided listItem when getVocabularyStuff', function() {
            beforeEach(function() {
                this.listItem = {
                    editorTabStates: {
                        concepts: {
                            entityIRI: 'iri',
                            usages: []
                        }
                    },
                    ontologyRecord: {
                        recordId: 'recordId',
                        branchId: 'branchId',
                        commitId: 'commitId'
                    },
                    derivedConcepts: [],
                    derivedConceptSchemes: [],
                    concepts: {
                        index: {},
                        hierarchy: [],
                        flat: []
                    },
                    conceptSchemes: {
                        index: {},
                        hierarchy: [],
                        flat: []
                    }
                };
            });
            it('resolves', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.when(this.response));
                ontologyStateSvc.setVocabularyStuff(this.listItem);
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(this.listItem.ontologyRecord.recordId, this.listItem.ontologyRecord.branchId, this.listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(this.listItem.derivedConcepts).toEqual(['derivedConcept']);
                expect(this.listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
                expect(this.listItem.concepts.hierarchy).toEqual(this.response.concepts.hierarchy);
                expect(this.listItem.concepts.index).toEqual(this.response.concepts.index);
                expect(this.listItem.concepts.flat).toEqual(this.response.concepts.hierarchy);
                expect(this.listItem.conceptSchemes.hierarchy).toEqual(this.response.conceptSchemes.hierarchy);
                expect(this.listItem.conceptSchemes.index).toEqual(this.response.conceptSchemes.index);
                expect(this.listItem.conceptSchemes.flat).toEqual(this.response.conceptSchemes.hierarchy);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(this.response.concepts.hierarchy, this.listItem.ontologyRecord.recordId, this.listItem);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(this.response.conceptSchemes.hierarchy, this.listItem.ontologyRecord.recordId, this.listItem);
                expect(this.listItem.editorTabStates.concepts).toEqual({});
                expect(util.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.reject(error));
                ontologyStateSvc.setVocabularyStuff(this.listItem);
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(this.listItem.ontologyRecord.recordId, this.listItem.ontologyRecord.branchId, this.listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(this.listItem.derivedConcepts).toEqual([]);
                expect(this.listItem.derivedConceptSchemes).toEqual([]);
                expect(this.listItem.concepts.hierarchy).toEqual([]);
                expect(this.listItem.concepts.index).toEqual({});
                expect(this.listItem.concepts.flat).toEqual([]);
                expect(this.listItem.conceptSchemes.hierarchy).toEqual([]);
                expect(this.listItem.conceptSchemes.index).toEqual({});
                expect(this.listItem.conceptSchemes.flat).toEqual([]);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(this.listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
                expect(util.createErrorToast).toHaveBeenCalledWith(error);
            });
        });
    });
    it('flattenHierarchy properly flattens the provided hierarchy', function() {
        spyOn(ontologyStateSvc, 'getEntityNameByIndex').and.callFake(_.identity);
        expect(ontologyStateSvc.flattenHierarchy([{
            entityIRI: 'Class B',
            subEntities: [{
                entityIRI: 'Class B2'
            }, {
                entityIRI: 'Class B1'
            }]
        }, {
            entityIRI: 'Class A'
        }], 'recordId')).toEqual([{
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
        }]);
    });
    it('createFlatEverythingTree creates the correct array', function() {
        ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'class1'}]);
        ontologyManagerSvc.getClassProperties.and.returnValue([{'@id': 'property1'}]);
        ontologyManagerSvc.getNoDomainProperties.and.returnValue([{'@id': 'property2'}]);
        var ontology = [{'@id': 'ontologyId'}];
        expect(ontologyStateSvc.createFlatEverythingTree([ontology], ontologyStateSvc.listItem)).toEqual([{
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
        }]);
        expect(ontologyManagerSvc.getClasses).toHaveBeenCalledWith([ontology]);
        expect(ontologyManagerSvc.getClassProperties).toHaveBeenCalledWith([ontology], 'class1');
        expect(ontologyManagerSvc.getNoDomainProperties).toHaveBeenCalledWith([ontology]);
    });
    it('createFlatIndividualTree creates the correct array', function() {
        expect(ontologyStateSvc.createFlatIndividualTree({
            individualsParentPath: ['Class A', 'Class B', 'Class B1'],
            classesAndIndividuals: {
                'Class A': ['Individual A2', 'Individual A1'],
                'Class B1': ['Individual B1']
            },
            classes: { flat: [{
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
            }] }
        })).toEqual([{
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
        }]);
        expect(ontologyStateSvc.createFlatIndividualTree({})).toEqual([]);
    });
    it('addEntity adds the entity to the provided ontology and index', function() {
        ontologyManagerSvc.getEntityName.and.returnValue('name');
        ontologyStateSvc.addEntity(listItem, individualObj);
        expect(ontology.length).toBe(4);
        expect(ontology[3]).toEqual(individualObj);
        expect(_.has(listItem.index, individualId)).toBe(true);
        expect(listItem.index[individualId].position).toEqual(3);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(individualObj);
        expect(listItem.index[individualId].label).toBe('name');
        expect(listItem.index[individualId].ontologyIri).toBe('ontologyId');
    });
    describe('getEntityNameByIndex should return the proper value', function() {
        it('when the entityIRI is in the index', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
                index: {
                    iri: {
                        label: 'name'
                    }
                }
            })).toBe('name');
        });
        it('when the entityIRI is in the imported index', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
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
            })).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
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
            })).toBe('name');
        });
        it('when the entityIRI is in multiple indices with only one label', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
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
            })).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices and no labels exist', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
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
            })).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
        it('when the entityIRI is not in the index', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {type: 'ontology'})).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
        it('when the listItem is undefined', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', undefined)).toBe('entity name');
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
            ontologyManagerSvc.getConceptHierarchies.and.returnValue($q.when(conceptHierarchiesResponse));
            ontologyManagerSvc.getConceptSchemeHierarchies.and.returnValue($q.when(conceptSchemeHierarchiesResponse));
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
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, false)
                .then(function(response) {
                    expect(_.get(response, 'annotations.iris')).toEqual([{
                        localName: annotationId2, namespace: annotationId2, ontologyId: ontologyId
                    }, {
                        localName: annotationId, namespace: annotationId
                    }]);
                    expect(_.get(response, 'classes.iris')).toEqual([
                        { localName: classId, namespace: classId },
                        { localName: classId2, namespace: classId2, ontologyId: ontologyId }
                    ]);
                    expect(response.isVocabulary).toEqual(true);
                    expect(_.get(response, 'dataProperties.iris')).toEqual([{
                        localName: dataPropertyId2, namespace: dataPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: dataPropertyId, namespace: dataPropertyId
                    }]);
                    expect(_.get(response, 'objectProperties.iris')).toEqual([{
                        localName: objectPropertyId2, namespace: objectPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: objectPropertyId, namespace: objectPropertyId
                    }]);
                    expect(_.get(response, 'individuals.iris')).toEqual([{
                        localName: individualId2, namespace: individualId2, ontologyId: ontologyId
                    }, {
                        localName: individualId, namespace: individualId
                    }]);
                    expect(_.get(response, 'dataPropertyRange')).toEqual(_.concat([{
                        localName: datatypeId2, namespace: datatypeId2, ontologyId: ontologyId
                    }, {
                        localName: datatypeId, namespace: datatypeId
                    }], ontologyManagerSvc.defaultDatatypes));
                    expect(_.get(response, 'derivedConcepts')).toEqual([conceptId]);
                    expect(_.get(response, 'derivedConceptSchemes')).toEqual([conceptSchemeId]);
                    expect(_.get(response, 'classes.hierarchy')).toEqual(classHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'classes.index')).toEqual(classHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.classes.hierarchy, recordId, response);
                    expect(_.get(response, 'classes.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
                    expect(_.get(response, 'classesAndIndividuals')).toEqual(classesWithIndividualsResponse.individuals);
                    expect(_.get(response, 'individualsParentPath')).toEqual(classesWithIndividualsResponse.individualsParentPath);
                    expect(_.get(response, 'dataProperties.hierarchy')).toEqual(dataPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'dataProperties.index')).toEqual(dataPropertyHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties.hierarchy, recordId, response);
                    expect(_.get(response, 'dataProperties.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'objectProperties.hierarchy')).toEqual(objectPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'objectProperties.index')).toEqual(objectPropertyHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties.hierarchy, recordId, response);
                    expect(_.get(response, 'objectProperties.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'branches')).toEqual(branches);
                    expect(_.get(response, 'annotations.hierarchy')).toEqual(annotationPropertyHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'annotations.index')).toEqual(annotationPropertyHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.annotations.hierarchy, recordId, response);
                    expect(_.get(response, 'annotations.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'concepts.hierarchy')).toEqual(conceptHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'concepts.index')).toEqual(conceptHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.concepts.hierarchy, recordId, response);
                    expect(_.get(response, 'concepts.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'conceptSchemes.hierarchy')).toEqual(conceptSchemeHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'conceptSchemes.index')).toEqual(conceptSchemeHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes.hierarchy, recordId, response);
                    expect(_.get(response, 'conceptSchemes.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'upToDate')).toBe(false);
                    expect(_.get(response, 'iriList')).toEqual([ontologyId, annotationId, classId, dataPropertyId, objectPropertyId, individualId, datatypeId, conceptId, conceptSchemeId, annotationId2, classId2, dataPropertyId2, objectPropertyId2, individualId2, datatypeId2]);
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([ontology, [{
                        '@id': 'ontologyId',
                        mobi: {
                            icon: 'fa-square-o',
                            imported: true,
                            importedIRI: 'ontologyId'
                        }
                    }]], response);
                    expect(_.get(response, 'flatEverythingTree')).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(response);
                    expect(_.get(response, 'individuals.flat')).toEqual([{prop: 'individual'}]);
                    expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getIris).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getImportedIris).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getClassHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getClassesWithIndividuals).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getDataPropertyHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getObjectPropertyHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getAnnotationPropertyHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(ontologyManagerSvc.getConceptHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getConceptSchemeHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
        });
        it('when one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
        it('when more than one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.reject(error));
            ontologyStateSvc.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    it('getIndividualsParentPath should return the list of unique classes', function() {
        expect(ontologyStateSvc.getIndividualsParentPath({
            classesAndIndividuals: {
                classA: ['ind1', 'ind2'],
                classB: ['ind3', 'ind4']
            },
            classes: {
                index: {
                    classB: ['classA'],
                    classZ: ['classY']
                }
            }
        })).toEqual(['classA', 'classB']);
    });
    describe('addOntologyToList should call the correct functions', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [];
        });
        it('when createOntologyListItem resolves', function() {
            spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.when(listItem));
            ontologyStateSvc.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, recordId)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyStateSvc.list.length).toBe(1);
            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true, recordId);
        });
        it('when createOntologyListItem rejects', function() {
            spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(error));
            ontologyStateSvc.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true, recordId);
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
            ontologyStateSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, false)
                .then(function(response) {
                    expect(_.get(response, 'derivedConcepts')).toEqual([conceptId]);
                    expect(_.get(response, 'derivedConceptSchemes')).toEqual([conceptSchemeId]);
                    expect(_.get(response, 'dataProperties.iris')).toEqual([{
                        localName: dataPropertyId2, namespace: dataPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: dataPropertyId, namespace: dataPropertyId
                    }]);
                    expect(_.get(response, 'objectProperties.iris')).toEqual([{
                        localName: objectPropertyId2, namespace: objectPropertyId2, ontologyId: ontologyId
                    }, {
                        localName: objectPropertyId, namespace: objectPropertyId
                    }]);
                    expect(_.get(response, 'concepts.hierarchy')).toEqual(conceptHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'concepts.index')).toEqual(conceptHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.concepts.hierarchy, recordId, response);
                    expect(_.get(response, 'concepts.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'conceptSchemes.hierarchy')).toEqual(conceptSchemeHierarchiesResponse.hierarchy);
                    expect(_.get(response, 'conceptSchemes.index')).toEqual(conceptSchemeHierarchiesResponse.index);
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes.hierarchy, recordId, response);
                    expect(_.get(response, 'conceptSchemes.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'branches')).toEqual(branches);
                    expect(_.get(response, 'upToDate')).toBe(false);
                    expect(_.get(response, 'iriList')).toEqual([ontologyId, annotationId, classId, dataPropertyId, objectPropertyId, individualId, datatypeId, conceptId, conceptSchemeId, annotationId2, classId2, dataPropertyId2, objectPropertyId2, individualId2, datatypeId2]);
                    expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getIris).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getImportedIris).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getConceptHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(ontologyManagerSvc.getConceptSchemeHierarchies).toHaveBeenCalledWith(recordId, branchId, commitId);
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
        });
        it('when one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.when(importedIrisResponse));
            ontologyStateSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
        it('when more than one call fails', function() {
            ontologyManagerSvc.getIris.and.returnValue($q.reject(error));
            ontologyManagerSvc.getImportedIris.and.returnValue($q.reject(error));
            ontologyStateSvc.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
        });
    });
    describe('addVocabularyToList should call the correct functions', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [];
        });
        it('when createVocabularyListItem resolves', function() {
            spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue($q.when(listItem));
            ontologyStateSvc.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, recordId)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyStateSvc.list.length).toBe(1);
            expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true, recordId);
        });
        it('when createVocabularyListItem rejects', function() {
            spyOn(ontologyStateSvc, 'createVocabularyListItem').and.returnValue($q.reject(error));
            ontologyStateSvc.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
            expect(ontologyStateSvc.createVocabularyListItem).toHaveBeenCalledWith(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, true, recordId);
        });
    });
    it('reset should clear the correct variables', function() {
        ontologyStateSvc.reset();
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.listItem).toEqual({selected: {}});
        expect(ontologyStateSvc.listItem.selected).toEqual({});
        expect($state.current.data.title).toBe('Ontology Editor');
        expect(ontologyStateSvc.showNewTab).toEqual(false);
        expect(ontologyStateSvc.showUploadTab).toEqual(false);
    });
    describe('afterSave calls the correct functions', function() {
        describe('when getInProgressCommit resolves', function() {
            beforeEach(function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(inProgressCommit));
            });
            describe('and getOntologyStateByRecordId is empty', function() {
                beforeEach(function() {
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({});
                });
                it('and createOntologyState resolves', function() {
                    stateManagerSvc.createOntologyState.and.returnValue($q.when(recordId));
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(response).toEqual(recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(_.has(ontologyStateSvc.listItem.editorTabStates, 'usages')).toBe(false);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
                it('and createOntologyState rejects', function() {
                    stateManagerSvc.createOntologyState.and.returnValue($q.reject(error));
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
            });
            describe('and getOntologyStateByRecordId is present', function() {
                beforeEach(function() {
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({id: 'id'});
                });
                it('and updateOntologyState resolves', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.when(recordId));
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(response).toEqual(recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
                it('and updateOntologyState rejects', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.reject(error));
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
            });
        });
        it('when getInProgressCommit rejects', function() {
            catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(error));
            ontologyStateSvc.afterSave()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, catalogId);
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
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.isOpened')).toBe(value);
        });
    });
    describe('getOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.isOpened', value);
                expect(ontologyStateSvc.getOpened(path)).toBe(value);
            });
        });
    });
    it('setNoDomainsOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setNoDomainsOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.noDomainsOpened')).toBe(value);
        });
    });
    describe('getNoDomainsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getNoDomainsOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.noDomainsOpened', value);
                expect(ontologyStateSvc.getNoDomainsOpened(path)).toBe(value);
            });
        });
    });
    it('setDataPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setDataPropertiesOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.dataPropertiesOpened')).toBe(value);
        });
    });
    describe('getDataPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getDataPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.dataPropertiesOpened', value);
                expect(ontologyStateSvc.getDataPropertiesOpened(path)).toBe(value);
            });
        });
    });
    it('setObjectPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setObjectPropertiesOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.objectPropertiesOpened')).toBe(value);
        });
    });
    describe('getObjectPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getObjectPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.objectPropertiesOpened', value);
                expect(ontologyStateSvc.getObjectPropertiesOpened(path)).toBe(value);
            });
        });
    });
    it('setAnnotationPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setAnnotationPropertiesOpened(path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.annotationPropertiesOpened')).toBe(value);
        });
    });
    describe('getAnnotationPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getAnnotationPropertiesOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(path) + '.annotationPropertiesOpened', value);
                expect(ontologyStateSvc.getAnnotationPropertiesOpened(path)).toBe(value);
            });
        });
    });
    describe('onEdit calls the correct manager methods', function() {
        beforeEach(function() {
            this.iriBegin = 'begin';
            this.iriThen = 'then';
            this.iriEnd = 'end';
            this.newIRI = this.iriBegin + this.iriThen + this.iriEnd;
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
            spyOn(ontologyStateSvc, 'addToAdditions');
            spyOn(ontologyStateSvc, 'addToDeletions');
        });
        it('regardless of getEntityUsages outcome when no match in additions', function() {
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.listItem.selected['@id'], this.newIRI);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.selected['@id'], 'construct');
        });
        it('regardless of getEntityUsages outcome when match in additions', function() {
            ontologyStateSvc.listItem.additions = [angular.copy(ontologyStateSvc.listItem.selected)];
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.listItem.selected['@id'], this.newIRI);
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
                ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
                expect(ontologyStateSvc.setCommonIriParts).not.toHaveBeenCalled();
            });
            it('not project', function() {
                spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('other');
                spyOn(ontologyStateSvc, 'setCommonIriParts');
                ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
                expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith(this.iriBegin, this.iriThen);
            });
        });
        it('when getEntityUsages resolves', function() {
            var statement = {'@id': 'test-id'};
            var response = [statement];
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.when(response));
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            scope.$apply();
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, statement);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(response, ontologyStateSvc.listItem.selected['@id'], this.newIRI);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, statement);
        });
        it('when getEntityUsages rejects', function() {
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.reject());
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            scope.$apply();
            expect(util.createErrorToast).toHaveBeenCalled();
        });
    });
    it('setCommonIriParts sets the proper values based on parameters', function() {
        ontologyStateSvc.setCommonIriParts('begin', 'then');
        expect(ontologyStateSvc.listItem.iriBegin).toEqual('begin');
        expect(ontologyStateSvc.listItem.iriThen).toEqual('then');
    });
    describe('setSelected should set the correct values and call the correct methods', function() {
        beforeEach(function() {
            this.object = {'@id': 'new'};
            this.id = 'id';
            ontologyStateSvc.listItem.selected = undefined;
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue(this.object);
            spyOn(ontologyStateSvc, 'setEntityUsages');
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
        });
        it('when getUsages is true and getActivePage object does not have a usages property', function() {
            ontologyStateSvc.setSelected(this.id, true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(this.object);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(this.id);
        });
        it('when getUsages is false', function() {
            ontologyStateSvc.setSelected(this.id, false);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(this.object);
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when getEntityByRecordId returns undefined', function() {
            ontologyStateSvc.getEntityByRecordId.and.returnValue(undefined);
            ontologyStateSvc.setSelected(this.id, true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(undefined);
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when getActivePage object does have a usages property', function() {
            ontologyStateSvc.getActivePage.and.returnValue({usages: []});
            ontologyStateSvc.setSelected(this.id, true);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.id, ontologyStateSvc.listItem);
            expect(ontologyStateSvc.listItem.selected).toEqual(this.object);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
    });
    describe('setEntityUsages should call the correct function', function() {
        beforeEach(function() {
            this.id = 'idx';
            this.key = 'project';
            this.activePage = {};
            this.httpId = 'usages-' + this.key + '-' + ontologyStateSvc.listItem.ontologyRecord.recordId;
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(this.activePage);
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue(this.key);
        });
        it('when getEntityUsages resolves', function() {
            var response = [{'@idx': 'this.id'}];
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.when(response));
            ontologyStateSvc.setEntityUsages(this.id);
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.httpId);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, this.id, 'select', this.httpId);
            expect(this.activePage.usages).toEqual(response);
        });
        it('when getEntityUsages rejects', function() {
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.reject(error));
            ontologyStateSvc.setEntityUsages(this.id);
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.httpId);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, this.id, 'select', this.httpId);
            expect(this.activePage.usages).toEqual([]);
        });
    });
    describe('resetStateTabs should set the correct variables', function() {
        beforeEach(function() {
            this.newOntologyIRI = 'newId';
            ontologyStateSvc.listItem.editorTabStates = {
                classes: {entityIRI: 'id', usages: []},
                project: {entityIRI: 'id', preview: 'test'}
            }
            ontologyManagerSvc.getOntologyIRI.and.returnValue(this.newOntologyIRI);
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue({'@id': this.newOntologyIRI});
            ontologyStateSvc.listItem.selected = {};
        });
        it('when getActiveKey is not project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('other');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.listItem.editorTabStates.classes).toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.project).toEqual({entityIRI: this.newOntologyIRI, preview: ''});
            expect(ontologyStateSvc.listItem.selected).toBeUndefined();
        });
        it('when getActiveKey is project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('project');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.listItem.editorTabStates.classes).toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.project).toEqual({entityIRI: this.newOntologyIRI, preview: ''});
            expect(ontologyStateSvc.listItem.selected).toEqual({'@id': this.newOntologyIRI});
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
            beforeEach(function () {
                this.newId = 'newId';
            });
            it('and getUsages is true', function() {
                ontologyStateSvc.selectItem(this.newId, true);
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(this.newId);
                expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(this.newId);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(this.newId, false);
            });
            it('and getUsages is false', function() {
                ontologyStateSvc.selectItem(this.newId, false);
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(this.newId);
                expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(this.newId, false);
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
                    }, {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }, {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }, {
                        entityIRI: 'new-node'
                    }]
                }, {
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
                        }, {
                            entityIRI: 'node3c',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    }, {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }, {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                }, {
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
                        }, {
                            entityIRI: 'node3c'
                        }]
                    }, {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }, {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }, {
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                }, {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }, {
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
                        }, {
                            entityIRI: 'node3c'
                        }]
                    }, {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    }, {
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
                }, {
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
                        }, {
                            entityIRI: 'node3c'
                        }]
                    }, {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }, {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                }, {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }, {
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
                        }, {
                            entityIRI: 'node3c'
                        }]
                    }, {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }, {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }, {
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
                    }, {
                        entityIRI: 'node3c'
                    }]
                }, {
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }, {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            }, {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }, {
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
                    }, {
                        entityIRI: 'node3c'
                    }]
                }, {
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }, {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            }, {
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
                }, {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            }, {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }, {
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                }, {
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
                }, {
                    entityIRI: 'node2b'
                }, {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            }, {
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
                }, {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            }, {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }, {
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
        beforeEach(function() {
            this.node = {
                indent: 1,
                entityIRI: 'iri',
                path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
            };
        });
        it('true when all parent paths are open', function() {
            spyOn(ontologyStateSvc, 'getOpened').and.returnValue(true);
            expect(ontologyStateSvc.areParentsOpen(this.node)).toBe(true);
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith('recordId.otherIRI');
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith('recordId.otherIRI.andAnotherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith('recordId');
        });
        it('false when all parent paths are not open', function() {
            spyOn(ontologyStateSvc, 'getOpened').and.returnValue(false);
            expect(ontologyStateSvc.areParentsOpen(this.node)).toBe(false);
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith('recordId.otherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith('recordId.otherIRI.andAnotherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith('recordId');
        });
    });
    it('joinPath joins the provided array correctly', function() {
        expect(ontologyStateSvc.joinPath(['a', 'b', 'c'])).toBe('a.b.c');
    });
    describe('goTo calls the proper manager functions with correct parameters when it is', function() {
        beforeEach(function() {
            this.entity = {'@id': 'entityId'};
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue(this.entity);
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({entityIRI: ''});
            spyOn(ontologyStateSvc, 'setActivePage');
            spyOn(ontologyStateSvc, 'selectItem');
            spyOn(ontologyStateSvc, 'openAt');
            ontologyStateSvc.listItem = {
                ontologyRecord: {},
                concepts: { flat: [] },
                conceptSchemes: { flat: [] },
                classes: { flat: [] },
                dataProperties: { flat: [] },
                objectProperties: { flat: [] },
                annotations: { flat: [] },
                derivedConcepts: ['concept'],
                derivedConceptSchemes: ['scheme'],
                individuals: { flat: [] }
            }
        });
        it('an ontology', function() {
            ontologyManagerSvc.isOntology.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('project');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
        });
        describe('of type ontology and the entity is', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.ontologyRecord.type = 'ontology';
            });
            it('a class', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('classes');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.flat, 'iri');
            });
            it('a datatype property', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setDataPropertiesOpened');
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.flat, 'iri');
                expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
            });
            it('an object property', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setObjectPropertiesOpened');
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.flat, 'iri');
                expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
            });
            it('an annotation property', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setAnnotationPropertiesOpened');
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.flat, 'iri');
                expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
            });
            it('an individual', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isIndividual.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isIndividual).toHaveBeenCalledWith(this.entity);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.individuals.flat, 'iri');
            });
        });
        describe('of type vocabulary and the entity is', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.ontologyRecord.type = 'vocabulary';
            });
            it('a concept', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isConcept.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('concepts');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.flat, 'iri');
            });
            it('a concept scheme', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isConcept.and.returnValue(false);
                ontologyManagerSvc.isConceptScheme.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('schemes');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.flat, 'iri');
            });
        });
    });
    it('openAt sets all parents open', function() {
        $document.querySelectorAll.and.returnValue([{offsetTop: 25}]);
        spyOn(ontologyStateSvc, 'setOpened');
        ontologyStateSvc.openAt([{
            entityIRI: 'iri-a',
            path: ['recordId', 'iri-a']
        }, {
            entityIRI: 'iri-b',
            path: ['recordId', 'iri-a', 'iri-b']
        }, {
            entityIRI: 'iri-c',
            path: ['recordId', 'iri-a', 'iri-b', 'iri-c']
        }], 'iri-c');
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
        beforeEach(function() {
            this.entity = {};
        });
        it('unless it is not a property', function() {
            ontologyManagerSvc.isProperty.and.returnValue(false);
            ontologyStateSvc.updatePropertyIcon(this.entity);
            expect(_.has(this.entity, 'mobi.icon')).toBe(false);
        });
        describe('if it is a property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isProperty.and.returnValue(true);
            });
            it('with more than one range', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range']", [{'@id': '1'}, {'@id': '2'}]);
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(this.entity, 'mobi.icon')).toBe('fa-cubes');
            });
            it('with a range of xsd:string or rdf:langString', function() {
                var self = this;
                self.tests = [prefixes.xsd + 'string', prefixes.rdf + 'langString'];
                _.forEach(self.tests, function(test) {
                    _.set(self.entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(self.entity);
                    expect(_.get(self.entity, 'mobi.icon')).toBe('fa-font');
                });
            });
            it('with a range of xsd:decimal, xsd:double, xsd:float, xsd:int, xsd:integer, xsd:long, or xsd:nonNegativeInteger', function() {
                var self = this;
                var tests = [prefixes.xsd + 'decimal', prefixes.xsd + 'double', prefixes.xsd + 'float', prefixes.xsd + 'int', prefixes.xsd + 'integer', prefixes.xsd + 'long', prefixes.xsd + 'nonNegativeInteger'];
                _.forEach(tests, function(test) {
                    _.set(self.entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(self.entity);
                    expect(_.get(self.entity, 'mobi.icon')).toBe('fa-calculator');
                });
            });
            it('with a range of xsd:language', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'language');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(this.entity, 'mobi.icon')).toBe('fa-language');
            });
            it('with a range of xsd:anyURI', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'anyURI');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(this.entity, 'mobi.icon')).toBe('fa-external-link');
            });
            it('with a range of xsd:anyURI', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'dateTime');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(this.entity, 'mobi.icon')).toBe('fa-clock-o');
            });
            it('with a range of xsd:boolean or xsd:byte', function() {
                var self = this;
                var tests = [prefixes.xsd + 'boolean', prefixes.xsd + 'byte'];
                _.forEach(tests, function(test) {
                    _.set(self.entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(self.entity);
                    expect(_.get(self.entity, 'mobi.icon')).toBe('fa-signal');
                });
            });
            it('with a range of rdfs:Literal', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.rdfs + 'Literal');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(this.entity, 'mobi.icon')).toBe('fa-cube');
            });
            it('with a range that is not predefined', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", 'test');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(this.entity, 'mobi.icon')).toBe('fa-link');
            });
        });
    });
    describe('uploadChanges should call the proper methods', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [{ ontologyRecord: { recordId: 'recordId' }, inProgressCommit: {  } }];
        });
        describe('when uploadChangesFile resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadChangesFile.and.returnValue($q.when());
            });
            it('and getInProgressCommit resolves', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when({ additions: ['a'], deletions: [] }));
                spyOn(ontologyStateSvc, 'updateOntology').and.returnValue($q.when());
                ontologyStateSvc.list[0].upToDate = true;
                ontologyStateSvc.uploadChanges({}, recordId, branchId, commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, recordId, branchId, commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
            });
            it ('and getInProgressCommit rejects', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(error));
                ontologyStateSvc.list[0].upToDate = true;
                ontologyStateSvc.uploadChanges({}, recordId, branchId, commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, recordId, branchId, commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
            });
        });
        it('when uploadChangesFile rejects', function() {
            ontologyManagerSvc.uploadChangesFile.and.returnValue($q.reject(error));
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
    describe('should add an IRI to classes.iris and update isVocabulary', function() {
        beforeEach(function () {
            this.listItem = {isVocabulary: false, classes: {iris: []}};
            this.iriObj = {id: 'iriObj'};
        });
        it('unless the IRI is already in the list', function() {
            this.listItem.classes.iris.push(this.iriObj);
            ontologyStateSvc.addToClassIRIs(this.listItem, this.iriObj);
            expect(responseObj.getItemIri).not.toHaveBeenCalled();
            expect(this.listItem.classes.iris).toEqual([this.iriObj]);
        });
        describe('if the IRI does not exist in the list', function () {
            it('and IRI is skos:Concept', function() {
                responseObj.getItemIri.and.returnValue(prefixes.skos + 'Concept');
                ontologyStateSvc.addToClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toContain(this.iriObj);
            });
            it('and IRI is skos:ConceptScheme', function() {
                responseObj.getItemIri.and.returnValue(prefixes.skos + 'ConceptScheme');
                ontologyStateSvc.addToClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toContain(this.iriObj);
            });
            it('unless IRI is not skos:Concept', function () {
                ontologyStateSvc.addToClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(false);
                expect(this.listItem.classes.iris).toContain(this.iriObj);
            });
        });
    });
    describe('should remove an IRI from classes.iris and update isVocabulary', function() {
        beforeEach(function () {
            this.iriObj = {id: 'iriObj'};
            this.listItem = {isVocabulary: true, classes: {iris: [this.iriObj]}};
        });
        describe('if IRI is skos:Concept and classIRIs', function() {
            beforeEach(function() {
                this.iriObj = {localName: 'Concept', namespace: prefixes.skos};
                this.listItem.classes.iris = [this.iriObj];
                responseObj.getItemIri.and.returnValue(prefixes.skos + 'Concept');
            });
            it('has skos:ConceptScheme', function() {
                this.listItem.classes.iris.push({localName: 'ConceptScheme', namespace: prefixes.skos});
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toEqual([{localName: 'ConceptScheme', namespace: prefixes.skos}]);
            });
            it('does not have skos:ConceptScheme', function() {
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(false);
                expect(this.listItem.classes.iris).toEqual([]);
            });
        });
        describe('if IRI is skos:ConceptScheme and classIRIs', function() {
            beforeEach(function() {
                this.iriObj = {localName: 'ConceptScheme', namespace: prefixes.skos};
                this.listItem.classes.iris = [this.iriObj];
                responseObj.getItemIri.and.returnValue(prefixes.skos + 'ConceptScheme');
            });
            it('has skos:Concept', function() {
                this.listItem.classes.iris.push({localName: 'Concept', namespace: prefixes.skos});
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toEqual([{localName: 'Concept', namespace: prefixes.skos}]);
            });
            it('does not have skos:Concept', function() {
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iriObj);
                expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
                expect(this.listItem.isVocabulary).toEqual(false);
                expect(this.listItem.classes.iris).toEqual([]);
            });
        });
        it('unless IRI is not skos:Concept', function () {
            ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iriObj);
            expect(responseObj.getItemIri).toHaveBeenCalledWith(this.iriObj);
            expect(this.listItem.isVocabulary).toEqual(true);
            expect(this.listItem.classes.iris).toEqual([]);
        });
    });
});