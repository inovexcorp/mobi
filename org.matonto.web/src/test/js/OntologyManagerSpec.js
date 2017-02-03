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
        ontologyManagerSvc.initialize();
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
            ontologyManagerSvc.uploadFile(file, title, description, keywords).then(function() {
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
            ontologyManagerSvc.uploadFile(file, title).then(function() {
                expect(true).toBe(true);
            }, function() {
                fail('Promise should have resolved');
            });
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
});
