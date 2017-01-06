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
    var $httpBackend, ontologyManagerSvc, catalogManagerSvc, stateManagerSvc, scope, ontologyState, prefixes, $q;
    var recordId = 'recordId';
    var ontologyId = 'ontologyId';
    var branchId = 'branchId';
    var commitId = 'commitId';
    var catalogId = 'catalogId';
    var format = 'jsonld';
    var ontology = [];
    var commitObj = {
        commit: [{
            '@graph': [{
                '@id': commitId
            }]
        }]
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

    beforeEach(function() {
        module('ontologyManager');
        mockPrefixes();
        mockPropertyManager();
        mockCatalogManager();
        mockUtil();
        mockStateManager();
        mockUtil();
        injectRemoveMatontoFilter();

        inject(function(ontologyManagerService, _$httpBackend_, _$q_, _$rootScope_, _catalogManagerService_,
            _stateManagerService_, _prefixes_) {
            ontologyManagerSvc = ontologyManagerService;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
        });

        catalogManagerSvc.localCatalog = {'@id': catalogId};
        ontologyState = {'@id': 'id'};
        ontologyState[prefixes.ontologyState + 'record'] = [{'@id': recordId}];
        ontologyState[prefixes.ontologyState + 'branch'] = [{'@id': branchId}];
        ontologyState[prefixes.ontologyState + 'commit'] = [{'@id': commitId}];
    });

    function flushAndVerify() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }

    describe('uploadFile hits the proper endpoint', function() {
        it('with description and keywords', function() {
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadFile(file, title, description, keywords);
            flushAndVerify();
        });
        it('with no description or keywords', function() {
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadFile(file, title);
            flushAndVerify();
        });
    });

    describe('getOntology calls the correct methods', function() {
        var expected = {
            recordId: recordId,
            ontologyId: ontologyId,
            ontology: ontology,
            branchId: branchId,
            commitId: commitId,
            inProgressCommit: inProgressCommit
        }
        var resourceDeferred;
        beforeEach(function() {
            resourceDeferred = $q.defer();
            catalogManagerSvc.getResource.and.returnValue(resourceDeferred.promise);
        });
        describe('if state exists', function() {
            var getDeferred;
            beforeEach(function() {
                getDeferred = $q.defer();
                catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
            });
            describe('and getInProgressCommit is resolved', function() {
                beforeEach(function() {
                    getDeferred.resolve(inProgressCommit);
                });
                it('and getResource is resolved', function() {
                    resourceDeferred.resolve(ontology);
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                    ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function(response) {
                        expect(response).toEqual(expected);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                        true, format);
                });
                it('and getResource is rejected', function() {
                    resourceDeferred.reject(error);
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                    ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId, catalogId,
                        true, format);
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
                        ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function(response) {
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
                        ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function(response) {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                        expect(catalogManagerSvc.getResource).toHaveBeenCalledWith(commitId, branchId, recordId,
                            catalogId, false, format);
                    });
                });
                it('with other message', function() {
                    getDeferred.reject(error);
                    stateManagerSvc.getOntologyStateByRecordId.and.returnValue({model: [ontologyState]});
                    ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                    scope.$apply();
                    expect(catalogManagerSvc.getResource).not.toHaveBeenCalled();
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
                            ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function(response) {
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
                            ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function() {
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
                        ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function() {
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
                    ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function() {
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
                ontologyManagerSvc.getOntology(ontologyId, recordId, format).then(function() {
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

    describe('addToAdditions should call the correct functions', function() {
        it('when entity is in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': [{'@id': 'id'}]};
            spyOn(ontologyManagerSvc, 'getListItemById').and.returnValue(listItem);
            ontologyManagerSvc.addToAdditions(ontologyId, statement);
            expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(ontologyId);
            expect(listItem.additions[0]).toEqual(statement);
        });
        it('when entity is not in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': []};
            spyOn(ontologyManagerSvc, 'getListItemById').and.returnValue(listItem);
            ontologyManagerSvc.addToAdditions(ontologyId, statement);
            expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(ontologyId);
            expect(listItem.additions[0]).toEqual(statement);
        });
    });

    describe('addToDeletions should call the correct functions', function() {
        it('when entity is in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': [{'@id': 'id'}]};
            spyOn(ontologyManagerSvc, 'getListItemById').and.returnValue(listItem);
            ontologyManagerSvc.addToDeletions(ontologyId, statement);
            expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(ontologyId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
        it('when entity is not in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': []};
            spyOn(ontologyManagerSvc, 'getListItemById').and.returnValue(listItem);
            ontologyManagerSvc.addToDeletions(ontologyId, statement);
            expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(ontologyId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
    });

    describe('saveChanges calls the correct methods when the user', function() {
        var getDeferred, createDeferred, updateDeferred;
        var differenceObj = {additions: '', deletions: ''};
        beforeEach(function() {
            getDeferred = $q.defer();
            createDeferred = $q.defer();
            updateDeferred = $q.defer();
            catalogManagerSvc.getInProgressCommit.and.returnValue(getDeferred.promise);
            catalogManagerSvc.createInProgressCommit.and.returnValue(createDeferred.promise);
            catalogManagerSvc.updateInProgressCommit.and.returnValue(updateDeferred.promise);
        });
        describe('has an InProgressCommit', function() {
            beforeEach(function() {
                getDeferred.resolve();
            });
            it('and update is successful', function() {
                var update = 'update';
                updateDeferred.resolve(update);
                ontologyManagerSvc.saveChanges(recordId, differenceObj)
                    .then(function(response) {
                        expect(response).toEqual(update);
                    }, function(response) {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId,
                    differenceObj);
                expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
            });
            it('and update is not successful', function() {
                var error = 'error';
                updateDeferred.reject(error);
                ontologyManagerSvc.saveChanges(recordId, differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId,
                    differenceObj);
                expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
            });
        });
        describe('does not have an InProgressCommit', function() {
            beforeEach(function() {
                getDeferred.reject('User has no InProgressCommit');
            });
            describe('and creation is successful', function() {
                beforeEach(function() {
                    createDeferred.resolve();
                });
                it('and update is successful', function() {
                    var update = 'update';
                    updateDeferred.resolve(update);
                    ontologyManagerSvc.saveChanges(recordId, differenceObj)
                        .then(function(response) {
                            expect(response).toEqual(update);
                        }, function(response) {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId,
                        differenceObj);
                });
                it('and update is not successful', function() {
                    var error = 'error';
                    updateDeferred.reject(error);
                    ontologyManagerSvc.saveChanges(recordId, differenceObj)
                        .then(function() {
                            fail('Promise should have rejected');
                        }, function(response) {
                            expect(response).toEqual(error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                    expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId,
                        differenceObj);
                });
            });
            it('and creation is not successful', function() {
                var error = 'error';
                createDeferred.reject(error);
                ontologyManagerSvc.saveChanges(recordId, differenceObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual(error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
                expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
            });
        });
        it('get InProgressCommit has an error', function() {
            var error = 'error';
            getDeferred.reject(error);
            ontologyManagerSvc.saveChanges(recordId, differenceObj)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                });
            scope.$apply();
            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
            expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
            expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
        });
    });

    /*describe('uploadThenGet calls the correct methods', function() {
        beforeEach(function() {
            spyOn(ontologyManagerSvc, 'uploadFile').and.returnValue($q.resolve({
                ontologyId: ontologyId,
                recordId: recordId
            }));
            spyOn(ontologyManagerSvc, 'getOntology').and.returnValue($q.resolve({
                ontologyId: ontologyId,
                recordId: recordId,
                ontology: ontology
            }));
            scope.$apply();
        });
        describe('with description and keywords', function() {
            it('and type ontology', function() {
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/iris').respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/imported-iris').respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/class-hierarchies').respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/classes-with-individuals')
                    .respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/data-property-hierarchies')
                    .respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/object-property-hierarchies')
                    .respond(200, []);
                ontologyManagerSvc.uploadThenGet(file, title, description, keywords, ontologyType);
                $httpBackend.flush();
            });
            it('and type vocabulary', function() {
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/iris').respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/imported-iris').respond(200, []);
                $httpBackend.whenGET('/matontorest/ontologies/' + ontologyId + '/concept-hierarchies').respond(200, []);
                ontologyManagerSvc.uploadThenGet(file, title, description, keywords, vocabularyType);
                $httpBackend.flush();
            });
        });
    });*/

    /*it('getAllOntologyIds parses out the dcterms:identifier from each record', function(done) {
        var ontologyIds = [{
            "@id": "https://matonto.org/records#931c73f0-31dd-4bcf-b40b-30586930d60d",
            "@type": ["http://matonto.org/ontologies/catalog#OntologyRecord"],
            "http://purl.org/dc/terms/identifier": [{"@value": "http://matonto.org/ontology/1.0"}]
        }, {
            "@id": "https://matonto.org/records#931c73f0-31dd-4bcf-b40b-30586930d60d2",
            "@type": ["http://matonto.org/ontologies/catalog#OntologyRecord"],
            "http://purl.org/dc/terms/identifier": [{"@value": "http://matonto.org/ontology/2.0"}]
        }];
        var expected = ["http://matonto.org/ontology/1.0", "http://matonto.org/ontology/2.0"];
        var config = {
            params: {
                type: 'http://matonto.org/ontologies/catalog#OntologyRecord'
            }
        }
        $httpBackend.whenGET('/matontorest/catalogs/' + ontologyManagerSvc.catalogId + '/records').respond(200,
            ontologyIds);
        ontologyManagerSvc.getAllOntologyIds().then(function(response) {
            expect(_.get(response, 'data', [])).toBe(expected);
            done();
        }, function(response) {
            fail('Promise should have resolved');
            done();
        });
        $httpBackend.flush();
    });*/

    /*describe('uploadThenGet calls correct methods', function() {
        beforeEach(function() {
            spyOn(ontologyManagerSvc, 'uploadFile').and.returnValue(deferred.promise);
            spyOn(ontologyManagerSvc, 'getOntology').and.returnValue(deferred2.promise);
        });
        describe('when uploadFile resolves', function() {
            beforeEach(function() {
                deferred.resolve({ontologyId: ontologyId, recordId: recordId});
            });
            it('and getOntology resolves', function() {
                ontologyManagerSvc.uploadThenGet(null, 'title', 'description', 'keywords');
                deferred2.resolve({ontologyId: ontologyId, recordId: recordId, ontology: []});
                scope.$apply();
            });
        });
    });*/
});
