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
    var ontologyStateSvc, $q, scope, util, stateManagerSvc, ontologyManagerSvc, updateRefsSvc, prefixes, catalogManagerSvc, httpSvc, $document, responseObj;
    var listItem;

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
            $provide.service('$document', function() {
                this.querySelectorAll = jasmine.createSpy('querySelectorAll');
            });
        });

        inject(function(ontologyStateService, _updateRefsService_, _ontologyManagerService_, _catalogManagerService_, _$q_, _$rootScope_, _utilService_, _stateManagerService_, _prefixes_, _httpService_, _$document_, _responseObj_) {
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
        });

        this.error = 'error';
        this.format = 'jsonld';
        this.title = 'title';
        this.description = 'description';
        this.keywords = 'keyword1,keyword2';
        this.inProgressCommit = {
            additions: ['test'],
            deletions: ['test']
        };
        this.emptyInProgressCommit = {
            additions: [],
            deletions: []
        };
        this.recordId = 'recordId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        this.ontologyId = 'ontologyId';
        this.catalogId = 'catalogId';
        this.classId = 'https://classId.com';
        this.objectPropertyId = 'objectPropertyId';
        this.datatypeId = 'datatypeId';
        this.annotationId = 'annotationId';
        this.dataPropertyId = 'dataPropertyId';
        this.individualId = 'individualId';
        this.conceptId = 'conceptId';
        this.conceptSchemeId = 'conceptSchemeId';
        this.semanticRelationId = 'semanticRelationId';

        this.branch = {
            '@id': this.branchId
        };
        this.differenceObj = {additions: '', deletions: ''};

        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        ontologyStateSvc.initialize();
        ontologyStateSvc.listItem = {
            ontologyRecord: {
                title: 'recordTitle',
                recordId: this.recordId,
                branchId: this.branchId,
                commitId: this.commitId
            }
        };
        ontologyStateSvc.listItem.selected = {'@id': 'id'};
        ontologyStateSvc.listItem.editorTabStates = {
            tab: {
                active: true,
                entityIRI: 'entityIRI',
                usages: []
            },
            other: {active: false}
        };

        this.hierarchy = [{
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
        this.indexObject = {
            'node2a': ['node1a'],
            'node2b': ['node1a'],
            'node2c': ['node1a'],
            'node3a': ['node2a', 'node2b', 'node3b'],
            'node3b': ['node2c', 'node1b'],
            'node3c': ['node2a']
        };
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
        this.ontologyObj = {
            '@id': this.ontologyId,
            '@type': [prefixes.owl + 'Ontology'],
            mobi: {
                anonymous: 'anonymous'
            }
        };
        this.classObj = {
            '@id': this.classId,
            '@type': [prefixes.owl + 'Class']
        };
        this.dataPropertyObj = {
            '@id': this.dataPropertyId,
            '@type': [prefixes.owl + 'DatatypeProperty']
        };
        this.individualObj = {
            '@id': this.individualId,
            '@type': [prefixes.owl + 'NamedIndividual', this.classId]
        };
        this.ontology = [this.ontologyObj, this.classObj, this.dataPropertyObj];
        this.branch[prefixes.catalog + 'head'] = [{'@id': this.commitId}];
        this.path = 'this.is.the.path';
        this.getResponse = {
            recordId: this.recordId,
            branchId: this.branchId,
            commitId: this.commitId,
            inProgressCommit: this.inProgressCommit,
            ontology: this.ontology
        };
        listItem = {
            ontology: this.ontology,
            ontologyId: this.ontologyId,
            importedOntologies: [],
            importedOntologyIds: [],
            ontologyRecord: {
                title: 'recordTitle',
                recordId: this.recordId,
                commitId: this.commitId,
                branchId: this.branchId
            },
            editorTabStates: {
                tab: {
                    active: true,
                    entityIRI: 'entityIRI',
                    usages: []
                },
                other: {active: false}
            },
            branches: [this.branch],
            index: {
                ontologyId: {
                    position: 0,
                    label: 'ontology',
                    ontologyIri: this.ontologyId
                },
                'https://classId.com': {
                    position: 1,
                    label: 'class',
                    ontologyIri: this.ontologyId
                },
                dataPropertyId: {
                    position: 2,
                    label: 'data property',
                    ontologyIri: this.ontologyId
                },
            },
            upToDate: true,
            iriList: [this.ontologyId, this.classId, this.dataPropertyId]
        };
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
        httpSvc = null;
        $document = null;
        responseObj = null;
        listItem = null;
    });

    describe('getOntology calls the correct methods', function() {
        beforeEach(function() {
            this.expected = {
                recordId: this.recordId,
                ontology: this.ontology,
                branchId: this.branchId,
                commitId: this.commitId,
                inProgressCommit: this.inProgressCommit
            };
            this.expected2 = {
                recordId: this.recordId,
                ontology: this.ontology,
                branchId: this.branchId,
                commitId: this.commitId,
                inProgressCommit: this.emptyInProgressCommit
            };
        });
        describe('if state exists', function() {
            beforeEach(function() {
                var ontologyState = {'@id': 'id'};
                ontologyState[prefixes.ontologyState + 'record'] = [{'@id': this.recordId}];
                ontologyState[prefixes.ontologyState + 'branch'] = [{'@id': this.branchId}];
                ontologyState[prefixes.ontologyState + 'commit'] = [{'@id': this.commitId}];
                stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
            });
            describe('and getInProgressCommit is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.resolve(this.inProgressCommit));
                });
                it('and getOntology is resolved', function() {
                    var self = this;
                    ontologyManagerSvc.getOntology.and.returnValue($q.resolve(this.ontology));
                    ontologyStateSvc.getOntology(this.recordId, this.format)
                        .then(function(response) {
                            expect(response).toEqual(self.expected);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                    expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                });
                describe('and getOntology is rejected', function() {
                    beforeEach(function() {
                        ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        beforeEach(function() {
                            stateManagerSvc.deleteOntologyState.and.returnValue($q.resolve());
                        });
                        it('and getLatestOntology is resolved', function() {
                            var self = this;
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.resolve(self.expected2));
                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                .then(function(response) {
                                    expect(response).toEqual(self.expected2);
                                }, function() {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                        });
                        it('and getLatestOntology is rejected', function() {
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(this.error);
                            }.bind(this));
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                        });
                    });
                    it('and deleteOntologyState is rejected', function() {
                        stateManagerSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.getOntology(this.recordId, this.format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
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
                        ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                        ontologyStateSvc.getOntology(this.recordId, this.format)
                            .then(function(response) {
                                expect(response).toEqual(self.expected2);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                        expect(stateManagerSvc.deleteOntologyState).not.toHaveBeenCalled();
                    });
                    describe('and getOntology is rejected', function() {
                        beforeEach(function() {
                            ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                        });
                        describe('and deleteOntologyState is resolved', function() {
                            beforeEach(function() {
                                stateManagerSvc.deleteOntologyState.and.returnValue($q.when());
                            });
                            it('and getLatestOntology is resolved', function() {
                                var self = this;
                                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.when(self.expected2));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(function(response) {
                                        expect(response).toEqual(self.expected2);
                                    }, function() {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                            it('and getLatestOntology is rejected', function() {
                                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(function() {
                                    fail('Promise should have rejected');
                                }, function(response) {
                                    expect(response).toEqual(this.error);
                                }.bind(this));
                                scope.$apply();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                        });
                        it('and deleteOntologyState is rejected', function() {
                            stateManagerSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(function(response) {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(this.error);
                            }.bind(this));
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                        });
                    });
                });
                describe('with other message', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(this.error));
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        beforeEach(function() {
                            stateManagerSvc.deleteOntologyState.and.returnValue($q.when());
                        });
                        it('and getLatestOntology is resolved', function() {
                            var self = this;
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.when(self.expected2));
                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                .then(function(response) {
                                    expect(response).toEqual(self.expected2);
                                }, function() {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                        });
                        it('and getLatestOntology is rejected', function() {
                            spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(this.error);
                            }.bind(this));
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                        });
                    });
                    it('and deleteOntologyState is rejected', function() {
                        stateManagerSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.getOntology(this.recordId, this.format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                        expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                        expect(stateManagerSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                    });
                });
            });
        });
        describe('if state does not exist', function() {
            it('and getLatestOntology is resolved', function() {
                var self = this;
                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.when(self.expected2));
                ontologyStateSvc.getOntology(this.recordId, this.format)
                    .then(function(response) {
                        expect(response).toEqual(self.expected2);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
            });
            it('and getLatestOntology is rejected', function() {
                spyOn(ontologyStateSvc, 'getLatestOntology').and.returnValue($q.reject(this.error));
                ontologyStateSvc.getOntology(this.recordId, this.format)
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
            });
        });
    });
    describe('getLatestOntology calls the correct methods', function() {
        describe('if getRecordMasterBranch is resolved', function() {
            beforeEach(function() {
                catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': this.branchId}));
            });
            describe('and getRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                });
                describe('and createOntologyState is resolved', function() {
                    beforeEach(function() {
                        stateManagerSvc.createOntologyState.and.returnValue($q.when());
                    });
                    it('and getOntology is resolved', function() {
                        var self = this;
                        self.expected = {
                            recordId: this.recordId,
                            ontology: this.ontology,
                            branchId: this.branchId,
                            commitId: this.commitId,
                            inProgressCommit: this.emptyInProgressCommit
                        };
                        ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                        ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                            .then(function(response) {
                                expect(response).toEqual(self.expected);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                    });
                    it('and getOntology is rejected', function() {
                        ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(this.error);
                            }.bind(this));
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                        expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                    });
                });
                it('and createOntologyState is rejected', function() {
                    stateManagerSvc.createOntologyState.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                });
            });
            it('and getRecordBranch is rejected', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(this.error));
                ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                expect(stateManagerSvc.createOntologyState).not.toHaveBeenCalled();
            });
        });
        it('if getRecordMasterBranch is rejected', function() {
            catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject(this.error));
            ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
            expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
        });
    });
    describe('uploadThenGet should call the proper methods', function() {
        describe('when uploadFile resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadFile.and.returnValue($q.when({recordId: this.recordId}));
                spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.when(this.getResponse));
            });
            describe('and getOntology resolves', function() {
                beforeEach(function() {
                    ontologyManagerSvc.getOntologyIRI.and.returnValue(this.ontologyId);
                    spyOn(ontologyStateSvc, 'setSelected');
                    spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
                });
                it('and addOntologyToList resolves', function() {
                    spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.when(listItem));
                    ontologyStateSvc.uploadThenGet({}, this.title, this.description, this.keywords)
                        .then(function(response) {
                            expect(response).toEqual(this.recordId);
                        }.bind(this), function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(this.ontology);
                    expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.title);
                    expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                });
                it('and addOntologyToList rejects', function() {
                    spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.reject(this.error));
                    ontologyStateSvc.uploadThenGet({}, this.title, this.description, this.keywords)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.title);
                });
            });
            it('and getOntology rejects', function() {
                ontologyStateSvc.getOntology.and.returnValue($q.reject(this.error));
                ontologyStateSvc.uploadThenGet({}, this.title, this.description, this.keywords)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
            });
        });
        it('when uploadFile rejects', function() {
            ontologyManagerSvc.uploadFile.and.returnValue($q.reject(this.error));
            ontologyStateSvc.uploadThenGet({}, this.title, this.description, this.keywords)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
        });
    });
    describe('updateOntology should call the proper methods', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [ontologyStateSvc.listItem];
        });
        describe('and getOntology resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.resolve(this.ontology));
                ontologyManagerSvc.getOntologyIRI.and.returnValue(this.ontologyId);
            });
            describe('and createOntologyListItem resolves', function() {
                beforeEach(function() {
                    spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.resolve(listItem));
                });
                it('and updateOntologyState resolves', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.resolve());
                    ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                        .then(_.noop, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                    expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                });
                it('and updateOntologyState rejects', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                    expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                });
            });
            it('and createOntologyListItem rejects', function() {
                spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(this.error));
                ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
            });
        });
        it('and getOntology rejects', function() {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
            ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
        });
    });
    describe('openOntology should call the proper methods', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'setSelected');
            spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
        });
        describe('when getOntology resolves', function() {
            beforeEach(function() {
                spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.when(this.getResponse));
            });
            describe('and getRecordBranch resolves', function() {
                beforeEach(function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                    ontologyManagerSvc.getOntologyIRI.and.returnValue(this.ontologyId);
                });
                it('and addOntologyToList resolves', function() {
                    spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.when(listItem));
                    ontologyStateSvc.openOntology(this.recordId, this.title)
                        .then(function(response) {
                            expect(response).toEqual(this.ontologyId);
                        }.bind(this), function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                    expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(this.ontology);
                    expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.title, true);
                    expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                    expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
                });
                it('and addOntologyToList rejects', function() {
                    spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.reject(this.error));
                    ontologyStateSvc.openOntology(this.recordId, this.title)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                    expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(this.ontology);
                    expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.title, true);
                });
            });
            it('and getRecordBranch rejects', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(this.error));
                ontologyStateSvc.openOntology(this.recordId)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
            });
        });
        it('and getOntology rejects', function() {
            spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.reject(this.error));
            ontologyStateSvc.openOntology(this.recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
        });
    });
    it('closeOntology removes the correct object from the list', function() {
        ontologyStateSvc.list = [{ontologyRecord: {recordId: this.recordId}}];
        ontologyStateSvc.closeOntology(this.recordId);
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.listItem).toEqual({});
    });
    it('removeBranch removes the correct object from the branches list', function() {
        spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
        ontologyStateSvc.removeBranch(this.recordId, this.branchId);
        expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
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
                ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                    .then(function(response) {
                        expect(response).toEqual(resolved);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
            it('and updateInProgressCommit rejects', function() {
                catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject(this.error));
                ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
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
                        ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                            .then(function(response) {
                                expect(response).toEqual(resolved);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                    });
                    it('and updateInProgressCommit rejects', function() {
                        catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                            .then(function() {
                                fail('Promise should have rejected');
                            }, function(response) {
                                expect(response).toEqual(this.error);
                            }.bind(this));
                        scope.$apply();
                        expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                    });
                });
                it('and createInProgressCommit rejects', function() {
                    catalogManagerSvc.createInProgressCommit.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                });
            });
            it('and the error message is not "InProgressCommit could not be found"', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(this.error));
                ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
            });
        });
    });
    describe('addToAdditions should call the correct functions', function() {
        it('when entity is in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': [{'@id': 'id'}]};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToAdditions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
        it('when entity is not in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': []};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToAdditions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
    });
    describe('addToDeletions should call the correct functions', function() {
        it('when entity is in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': [{'@id': 'id'}]};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToDeletions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
        it('when entity is not in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': []};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToDeletions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
    });
    describe('getListItemByRecordId should return the correct object', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [listItem];
        });
        it('when the ontologyId is in the list', function() {
            expect(ontologyStateSvc.getListItemByRecordId(this.recordId)).toEqual(listItem);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyStateSvc.getListItemByRecordId('other')).toEqual(undefined);
        });
    });
    describe('getOntologyByRecordId should return the correct object', function() {
        it('when the ontologyId is in the list', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyStateSvc.getOntologyByRecordId(this.recordId)).toEqual(listItem.ontology);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyStateSvc.getOntologyByRecordId('other')).toEqual([]);
        });
    });
    describe('createOntology calls the correct methods', function() {
        describe('when uploadJson succeeds', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadJson.and.returnValue($q.when({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId}));
                ontologyStateSvc.list = [];
                spyOn(ontologyStateSvc, 'setSelected');
                spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
            });
            it('and getRecordBranch resolves', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                ontologyStateSvc.createOntology(this.ontologyObj, this.title, this.description, this.keywords)
                    .then(function(response) {
                        expect(response).toEqual({entityIRI: this.ontologyObj['@id'], recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
                    }.bind(this), function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.list.length).toBe(1);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
            });
            it('and getRecordBranch rejects', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(this.error));
                ontologyStateSvc.createOntology(this.ontologyObj, this.title, this.description, this.keywords)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(this.error);
                    }.bind(this));
                scope.$apply();
            });
        });
        it('when uploadJson rejects', function() {
            ontologyManagerSvc.uploadJson.and.returnValue($q.reject(this.error));
            ontologyStateSvc.createOntology(this.ontologyObj, this.title)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
        });
    });
    describe('getEntityByRecordId returns', function() {
        it('object when present using index', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyStateSvc.getEntityByRecordId(this.recordId, this.classId)).toEqual(this.classObj);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        //the operation to retrieve the object if it isn't in the index is too expensive
        //so we are no longer doing that.
        it('undefined when present not using index', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({
                ontology: this.ontology,
                ontologyId: this.ontologyId,
                recordId: this.recordId,
                commitId: this.commitId,
                branchId: this.branchId,
                branches: [this.branch]
            });
            ontologyManagerSvc.getEntity.and.returnValue(this.classObj);
            expect(ontologyStateSvc.getEntityByRecordId(this.recordId, this.classId)).toBeUndefined();
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        it('undefined when not present', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.callThrough();
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            expect(ontologyStateSvc.getEntityByRecordId('', this.classId)).toEqual(undefined);
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
            expect(ontologyStateSvc.removeEntity(listItem, this.classId)).toEqual([this.classObj]);
            expect(_.has(listItem.index, this.classId)).toBe(false);
            expect(listItem.index.dataPropertyId.position).toEqual(1);
            expect(listItem.iriList).not.toContain(this.classId);
        });
    });
    describe('setVocabularyStuff sets the appropriate state variables on', function() {
        beforeEach(function() {
            this.response = {
                derivedConcepts: [{localName: 'derivedConcept'}],
                derivedConceptSchemes: [{localName: 'derivedConceptScheme'}],
                derivedSemanticRelations: [{localName: 'derivedSemanticRelation'}],
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
                ontologyStateSvc.listItem.derivedSemanticRelations = [];
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
                expect(ontologyStateSvc.listItem.derivedSemanticRelations).toEqual([{localName: 'derivedSemanticRelation'}]);
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
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.reject(this.error));
                ontologyStateSvc.setVocabularyStuff();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyStateSvc.listItem.derivedConcepts).toEqual([]);
                expect(ontologyStateSvc.listItem.derivedConceptSchemes).toEqual([]);
                expect(ontologyStateSvc.listItem.derivedSemanticRelations).toEqual([]);
                expect(ontologyStateSvc.listItem.concepts.hierarchy).toEqual([]);
                expect(ontologyStateSvc.listItem.concepts.index).toEqual({});
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual([]);
                expect(ontologyStateSvc.listItem.conceptSchemes.hierarchy).toEqual([]);
                expect(ontologyStateSvc.listItem.conceptSchemes.index).toEqual({});
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual([]);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
                expect(util.createErrorToast).toHaveBeenCalledWith(this.error);
            });
        });
        describe('the provided listItem when getVocabularyStuff', function() {
            beforeEach(function() {
                listItem.editorTabStates.concepts = { entityIRI: 'iri', usages: [] };
                listItem.derivedConcepts = [];
                listItem.derivedConceptSchemes = [];
                listItem.concepts = { index: {}, hierarchy: [], flat: [] };
                listItem.conceptSchemes = { index: {}, hierarchy: [], flat: [] };
            });
            it('resolves', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.when(this.response));
                ontologyStateSvc.setVocabularyStuff(listItem);
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(listItem.derivedConcepts).toEqual(['derivedConcept']);
                expect(listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
                expect(listItem.concepts.hierarchy).toEqual(this.response.concepts.hierarchy);
                expect(listItem.concepts.index).toEqual(this.response.concepts.index);
                expect(listItem.concepts.flat).toEqual(this.response.concepts.hierarchy);
                expect(listItem.conceptSchemes.hierarchy).toEqual(this.response.conceptSchemes.hierarchy);
                expect(listItem.conceptSchemes.index).toEqual(this.response.conceptSchemes.index);
                expect(listItem.conceptSchemes.flat).toEqual(this.response.conceptSchemes.hierarchy);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(this.response.concepts.hierarchy, listItem.ontologyRecord.recordId, listItem);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(this.response.conceptSchemes.hierarchy, listItem.ontologyRecord.recordId, listItem);
                expect(listItem.editorTabStates.concepts).toEqual({});
                expect(util.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.reject(this.error));
                ontologyStateSvc.setVocabularyStuff(listItem);
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(listItem.derivedConcepts).toEqual([]);
                expect(listItem.derivedConceptSchemes).toEqual([]);
                expect(listItem.concepts.hierarchy).toEqual([]);
                expect(listItem.concepts.index).toEqual({});
                expect(listItem.concepts.flat).toEqual([]);
                expect(listItem.conceptSchemes.hierarchy).toEqual([]);
                expect(listItem.conceptSchemes.index).toEqual({});
                expect(listItem.conceptSchemes.flat).toEqual([]);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
                expect(util.createErrorToast).toHaveBeenCalledWith(this.error);
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
        }], this.recordId)).toEqual([{
            entityIRI: 'Class A',
            hasChildren: false,
            path: [this.recordId, 'Class A'],
            indent: 0
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: [this.recordId, 'Class B'],
            indent: 0
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B1'],
            indent: 1
        }, {
            entityIRI: 'Class B2',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B2'],
            indent: 1
        }]);
    });
    it('createFlatEverythingTree creates the correct array', function() {
        ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'class1'}]);
        ontologyManagerSvc.getClassProperties.and.returnValue([{'@id': 'property1'}]);
        ontologyManagerSvc.getNoDomainProperties.and.returnValue([{'@id': 'property2'}]);
        var ontology = [{'@id': this.ontologyId}];
        expect(ontologyStateSvc.createFlatEverythingTree([ontology], ontologyStateSvc.listItem)).toEqual([{
            '@id': 'class1',
            hasChildren: true,
            indent: 0,
            path: [this.recordId, 'class1']
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            path: [this.recordId, 'class1', 'property1']
        }, {
            title: 'Properties',
            get: ontologyStateSvc.getNoDomainsOpened,
            set: ontologyStateSvc.setNoDomainsOpened
        }, {
            '@id': 'property2',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: [this.recordId, 'property2']
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
                path: [this.recordId, 'Class A'],
                indent: 0
            }, {
                entityIRI: 'Class B',
                hasChildren: true,
                path: [this.recordId, 'Class B'],
                indent: 0
            }, {
                entityIRI: 'Class B1',
                hasChildren: false,
                path: [this.recordId, 'Class B', 'Class B1'],
                indent: 1
            }, {
                entityIRI: 'Class B2',
                hasChildren: false,
                path: [this.recordId, 'Class B', 'Class B2'],
                indent: 1
            }] }
        })).toEqual([{
            entityIRI: 'Class A',
            hasChildren: false,
            path: [this.recordId, 'Class A'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Individual A1',
            hasChildren: false,
            path: [this.recordId, 'Class A', 'Individual A1'],
            indent: 1
        }, {
            entityIRI: 'Individual A2',
            hasChildren: false,
            path: [this.recordId, 'Class A', 'Individual A2'],
            indent: 1
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: [this.recordId, 'Class B'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B1'],
            indent: 1,
            isClass: true
        }, {
            entityIRI: 'Individual B1',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B1', 'Individual B1'],
            indent: 2
        }]);
        expect(ontologyStateSvc.createFlatIndividualTree({})).toEqual([]);
    });
    it('addEntity adds the entity to the provided ontology and index', function() {
        ontologyManagerSvc.getEntityName.and.returnValue('name');
        ontologyStateSvc.addEntity(listItem, this.individualObj);
        expect(this.ontology.length).toBe(4);
        expect(this.ontology[3]).toEqual(this.individualObj);
        expect(_.has(listItem.index, this.individualId)).toBe(true);
        expect(listItem.index[this.individualId].position).toEqual(3);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(this.individualObj);
        expect(listItem.index[this.individualId].label).toBe('name');
        expect(listItem.index[this.individualId].ontologyIri).toBe(this.ontologyId);
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
            expect(ontologyStateSvc.getEntityNameByIndex('iri')).toBe('entity name');
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
            this.classId2 = prefixes.skos + 'Concept';
            this.dataPropertyId2 = 'dataPropertyId2';
            this.objectPropertyId2 = 'objectProperty2';
            this.datatypeId2 = 'datatypeId2';
            this.annotationId2 = 'annotationId2';
            this.individualId2 = 'individualId2';
            ontologyManagerSvc.getOntologyStuff.and.returnValue($q.when({
                iriList: {
                    annotationProperties: [{localName: this.annotationId, namespace: this.annotationId}],
                    classes: [{localName: this.classId, namespace: this.classId}],
                    datatypes: [{localName: this.datatypeId, namespace: this.datatypeId}],
                    objectProperties: [{localName: this.objectPropertyId, namespace: this.objectPropertyId}],
                    dataProperties: [{localName: this.dataPropertyId, namespace: this.dataPropertyId}],
                    namedIndividuals: [{localName: this.individualId, namespace: this.individualId}],
                    derivedConcepts: [{localName: this.conceptId, namespace: this.conceptId}],
                    derivedConceptSchemes: [{localName: this.conceptSchemeId, namespace: this.conceptSchemeId}],
                    derivedSemanticRelations: [{localName: this.semanticRelationId, namespace: this.semanticRelationId}]
                },
                importedIRIs: [{
                    id: this.ontologyId,
                    annotationProperties: [{localName: this.annotationId2, namespace: this.annotationId2}],
                    classes: [{localName: this.classId2, namespace: this.classId2}],
                    dataProperties: [{localName: this.dataPropertyId2, namespace: this.dataPropertyId2}],
                    objectProperties: [{localName: this.objectPropertyId2, namespace: this.objectPropertyId2}],
                    namedIndividuals: [{localName: this.individualId2, namespace: this.individualId2}],
                    datatypes: [{localName: this.datatypeId2, namespace: this.datatypeId2}]
                }],
                importedOntologies: [{ontology: [], ontologyId: 'importId', id: 'id'}],
                classHierarchy: {hierarchy: [], index: {}},
                individuals: {ClassA: ['IndivA1', 'IndivA2']},
                dataPropertyHierarchy: {hierarchy: [], index: {}},
                objectPropertyHierarchy: {hierarchy: [], index: {}},
                annotationHierarchy: {hierarchy: [], index: {}},
                conceptHierarchy: {hierarchy: [], index: {}},
                conceptSchemeHierarchy: {hierarchy: [], index: {}},
                failedImports: ['failedId']
            }));
            this.branches = [this.branch];
            catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: this.branches}));
            spyOn(ontologyStateSvc, 'flattenHierarchy').and.returnValue([{prop: 'flatten'}]);
            spyOn(ontologyStateSvc, 'createFlatEverythingTree').and.returnValue([{prop: 'everything'}]);
            spyOn(ontologyStateSvc, 'createFlatIndividualTree').and.returnValue([{prop: 'individual'}]);
            spyOn(ontologyStateSvc, 'getIndividualsParentPath').and.returnValue(['ClassA']);
        });
        it('when all promises resolve', function() {
            ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, false)
                .then(function(response) {
                    expect(_.get(response, 'annotations.iris')).toEqual([{
                        localName: this.annotationId2, namespace: this.annotationId2, ontologyId: this.ontologyId
                    }, {
                        localName: this.annotationId, namespace: this.annotationId
                    }]);
                    expect(_.get(response, 'classes.iris')).toEqual([
                        { localName: this.classId, namespace: this.classId },
                        { localName: this.classId2, namespace: this.classId2, ontologyId: this.ontologyId }
                    ]);
                    expect(response.isVocabulary).toEqual(true);
                    expect(_.get(response, 'dataProperties.iris')).toEqual([{
                        localName: this.dataPropertyId2, namespace: this.dataPropertyId2, ontologyId: this.ontologyId
                    }, {
                        localName: this.dataPropertyId, namespace: this.dataPropertyId
                    }]);
                    expect(_.get(response, 'objectProperties.iris')).toEqual([{
                        localName: this.objectPropertyId2, namespace: this.objectPropertyId2, ontologyId: this.ontologyId
                    }, {
                        localName: this.objectPropertyId, namespace: this.objectPropertyId
                    }]);
                    expect(_.get(response, 'individuals.iris')).toEqual([{
                        localName: this.individualId2, namespace: this.individualId2, ontologyId: this.ontologyId
                    }, {
                        localName: this.individualId, namespace: this.individualId
                    }]);
                    expect(_.get(response, 'dataPropertyRange')).toEqual(_.concat([{
                        localName: this.datatypeId2, namespace: this.datatypeId2, ontologyId: this.ontologyId
                    }, {
                        localName: this.datatypeId, namespace: this.datatypeId
                    }], ontologyManagerSvc.defaultDatatypes));
                    expect(_.get(response, 'derivedConcepts')).toEqual([this.conceptId]);
                    expect(_.get(response, 'derivedConceptSchemes')).toEqual([this.conceptSchemeId]);
                    expect(_.get(response, 'derivedSemanticRelations')).toEqual([{localName: this.semanticRelationId, namespace: this.semanticRelationId}]);
                    expect(_.get(response, 'classes.hierarchy')).toEqual([]);
                    expect(_.get(response, 'classes.index')).toEqual({});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.classes.hierarchy, this.recordId, response);
                    expect(_.get(response, 'classes.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
                    expect(_.get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
                    expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalled();
                    expect(_.get(response, 'individualsParentPath')).toEqual(['ClassA']);
                    expect(_.get(response, 'dataProperties.hierarchy')).toEqual([]);
                    expect(_.get(response, 'dataProperties.index')).toEqual({});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties.hierarchy, this.recordId, response);
                    expect(_.get(response, 'dataProperties.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'objectProperties.hierarchy')).toEqual([]);
                    expect(_.get(response, 'objectProperties.index')).toEqual({});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties.hierarchy, this.recordId, response);
                    expect(_.get(response, 'objectProperties.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'branches')).toEqual(this.branches);
                    expect(_.get(response, 'annotations.hierarchy')).toEqual([]);
                    expect(_.get(response, 'annotations.index')).toEqual({});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.annotations.hierarchy, this.recordId, response);
                    expect(_.get(response, 'annotations.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'concepts.hierarchy')).toEqual([]);
                    expect(_.get(response, 'concepts.index')).toEqual({});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.concepts.hierarchy, this.recordId, response);
                    expect(_.get(response, 'concepts.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'conceptSchemes.hierarchy')).toEqual([]);
                    expect(_.get(response, 'conceptSchemes.index')).toEqual({});
                    expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes.hierarchy, this.recordId, response);
                    expect(_.get(response, 'conceptSchemes.flat')).toEqual([{prop: 'flatten'}]);
                    expect(_.get(response, 'upToDate')).toBe(false);
                    expect(_.get(response, 'iriList')).toEqual([this.ontologyId, this.annotationId, this.classId, this.datatypeId, this.objectPropertyId, this.dataPropertyId, this.individualId, this.conceptId, this.conceptSchemeId, this.semanticRelationId, this.annotationId2, this.classId2, this.dataPropertyId2, this.objectPropertyId2, this.individualId2, this.datatypeId2]);
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([this.ontology, []], response);
                    expect(_.get(response, 'flatEverythingTree')).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(response);
                    expect(_.get(response, 'individuals.flat')).toEqual([{prop: 'individual'}]);
                    expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                    expect(_.get(response, 'importedOntologyIds')).toEqual(['id']);
                    expect(_.get(response, 'importedOntologies')).toEqual([{
                        id: 'id',
                        ontologyId: 'importId',
                        ontology: [],
                        index: {},
                        blankNodes: {}
                    }]);
                }.bind(this), function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntologyStuff).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId);
        });
        it('when one call fails', function() {
            catalogManagerSvc.getRecordBranches.and.returnValue($q.reject(this.error));
            ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
        });
        it('when more than one call fails', function() {
            ontologyManagerSvc.getOntologyStuff.and.returnValue($q.reject(this.error));
            catalogManagerSvc.getRecordBranches.and.returnValue($q.reject(this.error));
            ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
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
            ontologyStateSvc.addOntologyToList(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.recordId)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyStateSvc.list.length).toBe(1);
            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true, this.recordId);
        });
        it('when createOntologyListItem rejects', function() {
            spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(this.error));
            ontologyStateSvc.addOntologyToList(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true, this.recordId);
        });
    });
    it('reset should clear the correct variables', function() {
        ontologyStateSvc.reset();
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.listItem).toEqual({});
        expect(ontologyStateSvc.showNewTab).toEqual(false);
        expect(ontologyStateSvc.showUploadTab).toEqual(false);
    });
    describe('afterSave calls the correct functions', function() {
        describe('when getInProgressCommit resolves', function() {
            beforeEach(function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.inProgressCommit));
            });
            describe('and getOntologyStateByRecordId is empty', function() {
                beforeEach(function() {
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({});
                });
                it('and createOntologyState resolves', function() {
                    stateManagerSvc.createOntologyState.and.returnValue($q.when(this.recordId));
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(response).toEqual(this.recordId);
                        }.bind(this), function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(_.has(ontologyStateSvc.listItem.editorTabStates, 'usages')).toBe(false);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.createOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
                it('and createOntologyState rejects', function() {
                    stateManagerSvc.createOntologyState.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
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
                    stateManagerSvc.updateOntologyState.and.returnValue($q.when(this.recordId));
                    ontologyStateSvc.afterSave()
                        .then(function(response) {
                            expect(response).toEqual(this.recordId);
                        }.bind(this), function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
                it('and updateOntologyState rejects', function() {
                    stateManagerSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.afterSave()
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(this.error);
                        }.bind(this));
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                    expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(stateManagerSvc.updateOntologyState).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId);
                });
            });
        });
        it('when getInProgressCommit rejects', function() {
            catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(this.error));
            ontologyStateSvc.afterSave()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(this.error);
                }.bind(this));
            scope.$apply();
            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
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
            ontologyStateSvc.setOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.isOpened')).toBe(value);
        });
    });
    describe('getOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.isOpened', value);
                expect(ontologyStateSvc.getOpened(this.path)).toBe(value);
            });
        });
    });
    it('setNoDomainsOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setNoDomainsOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.noDomainsOpened')).toBe(value);
        });
    });
    describe('getNoDomainsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getNoDomainsOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.noDomainsOpened', value);
                expect(ontologyStateSvc.getNoDomainsOpened(this.path)).toBe(value);
            });
        });
    });
    it('setDataPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setDataPropertiesOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.dataPropertiesOpened')).toBe(value);
        });
    });
    describe('getDataPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getDataPropertiesOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.dataPropertiesOpened', value);
                expect(ontologyStateSvc.getDataPropertiesOpened(this.path)).toBe(value);
            });
        });
    });
    it('setObjectPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setObjectPropertiesOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.objectPropertiesOpened')).toBe(value);
        });
    });
    describe('getObjectPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getObjectPropertiesOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.objectPropertiesOpened', value);
                expect(ontologyStateSvc.getObjectPropertiesOpened(this.path)).toBe(value);
            });
        });
    });
    it('setAnnotationPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], function(value) {
            ontologyStateSvc.setAnnotationPropertiesOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.annotationPropertiesOpened')).toBe(value);
        });
    });
    describe('getAnnotationPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getAnnotationPropertiesOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], function(value) {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.annotationPropertiesOpened', value);
                expect(ontologyStateSvc.getAnnotationPropertiesOpened(this.path)).toBe(value);
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
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.reject(this.error));
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
            expect(ontologyStateSvc.hasChanges(this.recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        it('when the listItem has deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({deletions: ['test']});
            expect(ontologyStateSvc.hasChanges(this.recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        it('when the listItem has neither additions nor deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({});
            expect(ontologyStateSvc.hasChanges(this.recordId)).toBe(false);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
    });
    describe('isCommittable returns the proper value', function() {
        it('when the listItem has additions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({inProgressCommit: {additions: ['test']}});
            expect(ontologyStateSvc.isCommittable(this.recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        it('when the listItem has deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({inProgressCommit: {deletions: ['test']}});
            expect(ontologyStateSvc.isCommittable(this.recordId)).toBe(true);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        it('when the listItem has neither additions nor deletions', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({});
            expect(ontologyStateSvc.isCommittable(this.recordId)).toBe(false);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
    });
    describe('addEntityToHierarchy', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'flattenHierarchy');
        });
        describe('should add the entity to the single proper location in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'new-node', this.indexObject, 'node1a');
                expect(this.hierarchy).toEqual([{
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
                expect(this.indexObject).toEqual({
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
                ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'new-node', this.indexObject, 'node3c');
                expect(this.hierarchy).toEqual([{
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
                expect(this.indexObject).toEqual({
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
                ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'new-node', this.indexObject, 'node3b');
                expect(this.hierarchy).toEqual([{
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
                expect(this.indexObject).toEqual({
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
                ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'new-node', this.indexObject, 'node3a');
                expect(this.hierarchy).toEqual([{
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
                expect(this.indexObject).toEqual({
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
                ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'node2b', this.indexObject, 'node1b');
                expect(this.hierarchy).toEqual([{
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
                expect(this.indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a','node1b'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a']
                });
            });
            it('when at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'node1b', this.indexObject, 'node1a');
                expect(this.hierarchy).toEqual([{
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
                expect(this.indexObject).toEqual({
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
            ontologyStateSvc.addEntityToHierarchy(this.hierarchy, 'new-node', this.indexObject, 'not-there');
            expect(this.hierarchy).toEqual([{
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
            expect(this.indexObject).toEqual({
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
            ontologyStateSvc.deleteEntityFromParentInHierarchy(this.hierarchy, 'node3a', 'node3b', this.indexObject);
            expect(this.hierarchy).toEqual([{
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
            expect(this.indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        it('should add any subEntities that are unique to this location', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(this.hierarchy, 'node2a', 'node1a', this.indexObject);
            expect(this.hierarchy).toEqual([{
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
            expect(this.indexObject).toEqual({
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
            ontologyStateSvc.deleteEntityFromHierarchy(this.hierarchy, 'node3a', this.indexObject);
            expect(this.hierarchy).toEqual([{
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
            expect(this.indexObject).toEqual({
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
            ontologyStateSvc.deleteEntityFromHierarchy(this.hierarchy, 'node2a', this.indexObject);
            expect(this.hierarchy).toEqual([{
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
            expect(updateRefsSvc.remove).toHaveBeenCalledWith(this.indexObject, 'node2a');
            expect(this.indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c', 'node1b']
            });
        });
    });
    it('getPathsTo should return all paths to provided node', function() {
        var expectedPaths = [
            ['node1a','node2a','node3a'],
            ['node1a','node2b','node3a'],
            ['node1a','node2c','node3b','node3a'],
            ['node1b','node3b','node3a']
        ];
        var result = ontologyStateSvc.getPathsTo(this.hierarchy, this.indexObject, 'node3a');
        expect(result.length).toBe(4);
        expect(_.sortBy(result)).toEqual(_.sortBy(expectedPaths));
    });
    describe('areParentsOpen should return', function() {
        beforeEach(function() {
            this.node = {
                indent: 1,
                entityIRI: 'iri',
                path: [this.recordId, 'otherIRI', 'andAnotherIRI', 'iri']
            };
        });
        it('true when all parent paths are open', function() {
            spyOn(ontologyStateSvc, 'getOpened').and.returnValue(true);
            expect(ontologyStateSvc.areParentsOpen(this.node)).toBe(true);
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith(this.recordId + '.otherIRI');
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith(this.recordId + '.otherIRI.andAnotherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith(this.recordId);
        });
        it('false when all parent paths are not open', function() {
            spyOn(ontologyStateSvc, 'getOpened').and.returnValue(false);
            expect(ontologyStateSvc.areParentsOpen(this.node)).toBe(false);
            expect(ontologyStateSvc.getOpened).toHaveBeenCalledWith(this.recordId + '.otherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith(this.recordId + '.otherIRI.andAnotherIRI');
            expect(ontologyStateSvc.getOpened).not.toHaveBeenCalledWith(this.recordId);
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
            expect(ontologyManagerSvc.isClass).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('project');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
        });
        it('a class', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
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
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
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
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
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
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.flat, 'iri');
            expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
        });
        it('a concept', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('concepts');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.flat, 'iri');
        });
        it('an conceptScheme', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('schemes');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.flat, 'iri');
        });
        it('an individual', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyManagerSvc.isIndividual).toHaveBeenCalledWith(this.entity);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.individuals.flat, 'iri');
        });
    });
    it('openAt sets all parents open', function() {
        $document.querySelectorAll.and.returnValue([{offsetTop: 25}]);
        spyOn(ontologyStateSvc, 'setOpened');
        ontologyStateSvc.openAt([{
            entityIRI: 'iri-a',
            path: [this.recordId, 'iri-a']
        }, {
            entityIRI: 'iri-b',
            path: [this.recordId, 'iri-a', 'iri-b']
        }, {
            entityIRI: 'iri-c',
            path: [this.recordId, 'iri-a', 'iri-b', 'iri-c']
        }], 'iri-c');
        expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(this.recordId + '.iri-a', true);
        expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(this.recordId + '.iri-a.iri-b', true);
        // $scope.apply();
        // expect($document.querySelectorAll).toHaveBeenCalledWith('[class*=hierarchy-block] .repeater-container');
        // expect($document.querySelectorAll).toHaveBeenCalledWith('[data-path-to="' + this.recordId + '.iri-a.iri-b.iri-c"]');
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
            ontologyStateSvc.list = [{ ontologyRecord: { recordId: this.recordId }, inProgressCommit: {  } }];
        });
        describe('when uploadChangesFile resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadChangesFile.and.returnValue($q.when());
            });
            it('and getInProgressCommit resolves', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when({ additions: ['a'], deletions: [] }));
                spyOn(ontologyStateSvc, 'updateOntology').and.returnValue($q.when());
                ontologyStateSvc.list[0].upToDate = true;
                ontologyStateSvc.uploadChanges({}, this.recordId, this.branchId, this.commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, this.recordId, this.branchId, this.commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
            it ('and getInProgressCommit rejects', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(this.error));
                ontologyStateSvc.list[0].upToDate = true;
                ontologyStateSvc.uploadChanges({}, this.recordId, this.branchId, this.commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, this.recordId, this.branchId, this.commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
        });
        it('when uploadChangesFile rejects', function() {
            ontologyManagerSvc.uploadChangesFile.and.returnValue($q.reject(this.error));
            ontologyStateSvc.uploadChanges({}, this.recordId, this.branchId, this.commitId);
            scope.$apply();
            expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, this.recordId, this.branchId, this.commitId);
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
    describe('addErrorToUploadItem should add the message to the correct message when', function() {
        beforeEach(function() {
            ontologyStateSvc.uploadList = [{id: 'id'}, {id: 'id2'}];
        });
        it('found', function() {
            ontologyStateSvc.addErrorToUploadItem('id2', 'error');
            expect(ontologyStateSvc.uploadList).toEqual([{id: 'id'}, {id: 'id2', error: 'error'}]);
        });
        it('not found', function() {
            ontologyStateSvc.addErrorToUploadItem('missing', 'error');
            expect(ontologyStateSvc.uploadList).toEqual([{id: 'id'}, {id: 'id2'}]);
        });
    });
});