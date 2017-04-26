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
    var $httpBackend, ontologyManagerSvc, catalogManagerSvc, scope, prefixes, $q, windowSvc, util, ontologyObj, paramSerializer, classObj, objectPropertyObj, dataPropertyObj,annotationObj, individualObj, restrictionObj, conceptObj, schemeObj, ontology, httpSvc;
    var recordId = 'recordId';
    var ontologyId = 'ontologyId';
    var branchId = 'branchId';
    var commitId = 'commitId';
    var catalogId = 'catalogId';
    var format = 'jsonld';
    var file = {};
    var title = 'title';
    var description = 'description';
    var keywords = 'keyword1,keyword2';
    var error = 'error';
    var records = {
        data: [{
            'dcterms:identifier': 'id1'
        }, {
            'dcterms:identifier': 'id2'
        }]
    }
    var fileName = 'fileName';
    var originalIRI = 'originalIRI';
    var anonymous = 'anonymous';
    var classId = 'classId';
    var objectPropertyId = 'objectPropertyId';
    var dataPropertyId = 'dataPropertyId';
    var annotationId = 'annotationId';
    var individualId = 'individualId';
    var restrictionId = 'restrictionId';
    var blankNodeId = '_:genid0';
    var blankNodeObj = {
        '@id': blankNodeId
    }
    var usages = {
        results: {
            bindings: []
        }
    };
    var conceptId = 'conceptId';
    var schemeId = 'schemeId';
    var searchResults = [];
    var searchText = 'searchText';

    beforeEach(function() {
        module('ontologyManager');
        mockPrefixes();
        mockCatalogManager();
        mockUtil();
        mockHttpService();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(ontologyManagerService, _$httpBackend_, _$q_, _$rootScope_, _$window_, _catalogManagerService_, _prefixes_, _utilService_, $httpParamSerializer, _httpService_) {
            ontologyManagerSvc = ontologyManagerService;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            scope = _$rootScope_;
            windowSvc = _$window_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            util = _utilService_;
            paramSerializer = $httpParamSerializer;
            httpSvc = _httpService_;
        });

        catalogManagerSvc.localCatalog = {'@id': catalogId};
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
        };
        annotationObj = {
            '@id': annotationId,
            '@type': [prefixes.owl + 'AnnotationProperty'],
            matonto: {
                originalIRI: annotationId
            }
        };
        individualObj = {
            '@id': individualId,
            '@type': [prefixes.owl + 'NamedIndividual', classId],
            matonto: {
                originalIRI: individualId
            }
        };
        restrictionObj = {
            '@id': restrictionId,
            '@type': [prefixes.owl + 'Restriction'],
            matonto: {
                originalIRI: restrictionId
            }
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
        ontology = [ontologyObj, classObj, dataPropertyObj];
    });

    function flushAndVerify() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }

    it('reset should clear the proper variables', function() {
        ontologyManagerSvc.ontologyRecords = ['record'];
        ontologyManagerSvc.reset();
        expect(ontologyManagerSvc.ontologyRecords).toEqual([]);
    });
    describe('getAllOntologyRecords gets a list of all ontology records', function() {
        var getDeferred;
        beforeEach(function() {
            getDeferred = $q.defer();
            catalogManagerSvc.getRecords.and.returnValue(getDeferred.promise);
        });
        it('when getRecords resolves', function(done) {
            getDeferred.resolve(records);
            ontologyManagerSvc.getAllOntologyRecords({})
                .then(function(response) {
                    expect(catalogManagerSvc.getRecords).toHaveBeenCalled();
                    expect(response).toEqual(records.data);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            scope.$apply();
        });
        it('when getRecords rejects', function(done) {
            getDeferred.reject(error);
            ontologyManagerSvc.getAllOntologyRecords({})
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(catalogManagerSvc.getRecords).toHaveBeenCalled();
                    expect(response).toEqual(error);
                    done();
                });
            scope.$apply();
        });
    });
    describe('uploadFile hits the proper endpoint', function() {
        it('with description and keywords', function(done) {
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadFile(file, title, description, keywords)
                .then(function() {
                    expect(true).toBe(true);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('with no description or keywords', function(done) {
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadFile(file, title)
                .then(function() {
                    expect(true).toBe(true);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('unless an error occurs', function(done) {
            var params = paramSerializer({ title: title });
            $httpBackend.expectPOST('/matontorest/ontologies',
                function(data) {
                    return data instanceof FormData;
                },
                function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(400, null, null, error);
            ontologyManagerSvc.uploadFile(file, title)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
    });
    describe('uploadJson hits the proper endpoint', function() {
        it('with description and keywords', function(done) {
            var params = paramSerializer({
                title: title,
                description: description,
                keywords: keywords
            });
            $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj,
                function(headers) {
                    return headers['Content-Type'] === 'application/json';
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadJson(ontologyObj, title, description, keywords)
                .then(function(data) {
                    expect(data).toEqual({ontologyId: ontologyId, recordId: recordId});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('with no description or keywords', function(done) {
            var params = paramSerializer({ title: title });
            $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj,
                function(headers) {
                    return headers['Content-Type'] === 'application/json';
                }).respond(200, {ontologyId: ontologyId, recordId: recordId});
            ontologyManagerSvc.uploadJson(ontologyObj, title)
                .then(function(data) {
                    expect(data).toEqual({ontologyId: ontologyId, recordId: recordId});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('unless an error occurs', function(done) {
            var params = paramSerializer({ title: title });
            $httpBackend.expectPOST('/matontorest/ontologies?' + params, ontologyObj,
                function(headers) {
                    return headers['Content-Type'] === 'application/json';
                }).respond(400, null, null, error);
            ontologyManagerSvc.uploadJson(ontologyObj, title)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
                flushAndVerify();
        });
    });
    describe('downloadOntology should set the $window.location properly', function() {
        it('with a format', function() {
            ontologyManagerSvc.downloadOntology(recordId, branchId, commitId, 'turtle');
            expect(windowSvc.location).toBe('/matontorest/ontologies/' + encodeURIComponent(recordId) + '?branchId=' + encodeURIComponent(branchId) + '&commitId=' + encodeURIComponent(commitId) + '&fileName=ontology&rdfFormat=turtle');
        });
        it('without a format', function() {
            ontologyManagerSvc.downloadOntology(recordId, branchId, commitId);
            expect(windowSvc.location).toBe('/matontorest/ontologies/' + encodeURIComponent(recordId) + '?branchId=' + encodeURIComponent(branchId) + '&commitId=' + encodeURIComponent(commitId) + '&fileName=ontology&rdfFormat=jsonld');
        });
        it('with a fileName', function() {
            ontologyManagerSvc.downloadOntology(recordId, branchId, commitId, 'turtle', 'fileName');
            expect(windowSvc.location).toBe('/matontorest/ontologies/' + encodeURIComponent(recordId) + '?branchId=' + encodeURIComponent(branchId) + '&commitId=' + encodeURIComponent(commitId) + '&fileName=fileName&rdfFormat=turtle');
        });
        it('without a fileName', function() {
            ontologyManagerSvc.downloadOntology(recordId, branchId, commitId, 'turtle');
            expect(windowSvc.location).toBe('/matontorest/ontologies/' + encodeURIComponent(recordId) + '?branchId=' + encodeURIComponent(branchId) + '&commitId=' + encodeURIComponent(commitId) + '&fileName=ontology&rdfFormat=turtle');
        });
    });
    describe('getOntology hits the proper endpoint', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId, rdfFormat: format });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + encodeURIComponent(recordId) + '?' + params,
                function(headers) {
                    return headers['Accept'] === 'text/plain';
                }).respond(400, null, null, error);
            ontologyManagerSvc.getOntology(recordId, branchId, commitId, format)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + encodeURIComponent(recordId) + '?' + params,
                function(headers) {
                    return headers['Accept'] === 'text/plain';
                }).respond(200, ontology);
            ontologyManagerSvc.getOntology(recordId, branchId, commitId, format)
                .then(function(data) {
                    expect(data).toEqual(ontology);
                    done();
                }, function(response) {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getIris retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/iris?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getIris(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/iris?' + params).respond(200, {});
            ontologyManagerSvc.getIris(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getImportedIris retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/imported-iris?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getImportedIris(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('unless there are none', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/imported-iris?' + params).respond(204);
            ontologyManagerSvc.getImportedIris(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual([]);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/imported-iris?' + params).respond(200, [{}]);
            ontologyManagerSvc.getImportedIris(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual([{}]);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getClassHierarchies retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/class-hierarchies?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getClassHierarchies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/class-hierarchies?' + params).respond(200, {});
            ontologyManagerSvc.getClassHierarchies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getClassesWithIndividuals retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/classes-with-individuals?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getClassesWithIndividuals(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/classes-with-individuals?' + params).respond(200, {});
            ontologyManagerSvc.getClassesWithIndividuals(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getDataPropertyHierarchies retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/data-property-hierarchies?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getDataPropertyHierarchies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/data-property-hierarchies?' + params).respond(200, {});
            ontologyManagerSvc.getDataPropertyHierarchies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getObjectPropertyHierarchies retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/object-property-hierarchies?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getObjectPropertyHierarchies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                });
            flushAndVerify();
        });
        it('successfully', function() {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/object-property-hierarchies?' + params).respond(200, {});
            ontologyManagerSvc.getObjectPropertyHierarchies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
        });
    });
    describe('getAnnotationPropertyHierarchies retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/annotation-property-hierarchies?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getAnnotationPropertyHierarchies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                    done();
                });
            flushAndVerify();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/annotation-property-hierarchies?' + params).respond(200, {});
            ontologyManagerSvc.getAnnotationPropertyHierarchies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getConceptHierarchies retrieves all IRIs in an ontology', function() {
        var params;
        beforeEach(function() {
            params = paramSerializer({ branchId: branchId, commitId: commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/concept-hierarchies?' + params).respond(400, null, null, error);
            ontologyManagerSvc.getConceptHierarchies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(error);
                    expect(util.onError).toHaveBeenCalled();
                });
            flushAndVerify();
        });
        it('successfully', function() {
            $httpBackend.expectGET('/matontorest/ontologies/' + recordId + '/concept-hierarchies?' + params).respond(200, {});
            ontologyManagerSvc.getConceptHierarchies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify();
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
        it('when get succeeds', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(200, [ontology]);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual([ontology]);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('when get is empty', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(204);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function(response) {
                    expect(response).toEqual([]);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            flushAndVerify();
        });
        it('when another success response', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(201, null, null, error);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    done();
                });
            flushAndVerify();
        });
        it('when get fails', function(done) {
            $httpBackend.expectGET('/matontorest/ontologies/recordId/imported-ontologies?' + params)
                .respond(400, null, null, error);
            ontologyManagerSvc.getImportedOntologies(recordId, branchId, commitId)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual(error);
                    done();
                });
            flushAndVerify();
        });
    });
    describe('getEntityUsages should call the proper functions', function() {
        var params, getDeferred, config;
        beforeEach(function() {
            params = paramSerializer({
                branchId: branchId,
                commitId: commitId
            });
            config = {
                params: {
                    branchId: branchId,
                    commitId: commitId,
                    queryType: 'select'
                }
            }
            getDeferred = $q.defer();
            httpSvc.get.and.returnValue(getDeferred.promise);
        });
        describe('when get succeeds', function() {
            describe('with no id set', function() {
                it('and queryType is select', function(done) {
                    $httpBackend.expectGET('/matontorest/ontologies/recordId/entity-usages/classId?' + params + '&queryType=select')
                        .respond(200, usages);
                    ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'select')
                        .then(function(response) {
                            expect(response).toEqual(usages.results.bindings);
                            done();
                        }, function() {
                            fail('Promise should have resolved');
                            done();
                        });
                    flushAndVerify();
                });
                it('and queryType is construct', function(done) {
                    $httpBackend.expectGET('/matontorest/ontologies/recordId/entity-usages/classId?' + params + '&queryType=construct')
                        .respond(200, usages);
                    ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'construct')
                        .then(function(response) {
                            expect(response).toEqual(usages);
                            done();
                        }, function() {
                            fail('Promise should have resolved');
                            done();
                        });
                    flushAndVerify();
                });
            });
            describe('when id is set', function() {
                beforeEach(function() {
                    getDeferred.resolve({data: usages});
                });
                it('and queryType is select', function(done) {
                    ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'select', 'usages')
                        .then(function(response) {
                            expect(httpSvc.get).toHaveBeenCalledWith('/matontorest/ontologies/' + encodeURIComponent(recordId) + '/entity-usages/' + encodeURIComponent(classId), config, 'usages');
                            expect(response).toEqual(usages.results.bindings);
                            done();
                        }, function() {
                            fail('Promise should have resolved');
                            done();
                        });
                    scope.$apply();
                });
                it('and queryType is construct', function(done) {
                    config.params.queryType = 'construct';
                    ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'construct', 'usages')
                        .then(function(response) {
                            expect(httpSvc.get).toHaveBeenCalledWith('/matontorest/ontologies/' + encodeURIComponent(recordId) + '/entity-usages/' + encodeURIComponent(classId), config, 'usages');
                            expect(response).toEqual(usages);
                            done();
                        }, function() {
                            fail('Promise should have resolved');
                            done();
                        });
                    scope.$apply();
                });
            });
        });
        describe('when get fails', function() {
            it('when id is not set', function(done) {
                $httpBackend.expectGET('/matontorest/ontologies/recordId/entity-usages/classId?' + params + '&queryType=select')
                    .respond(400, null, null, error);
                ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId)
                    .then(function() {
                        fail('Promise should have rejected');
                        done();
                    }, function(response) {
                        expect(response).toEqual(error);
                        done();
                    });
                flushAndVerify();
            });
            it('when id is set', function() {
                getDeferred.reject(error);
                ontologyManagerSvc.getEntityUsages(recordId, branchId, commitId, classId, 'select', 'usages')
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function() {
                        expect(httpSvc.get).toHaveBeenCalledWith('/matontorest/ontologies/' + encodeURIComponent(recordId) + '/entity-usages/' + encodeURIComponent(classId), config, 'usages');
                        expect(util.onError).toHaveBeenCalledWith(error, jasmine.any(Object));
                    });
                scope.$apply();
            });
        });
    });
    describe('getSearchResults should call the correct functions', function() {
        var params, getDeferred;
        beforeEach(function() {
            params = paramSerializer({
                searchText: searchText,
                branchId: branchId,
                commitId: commitId
            });
            getDeferred = $q.defer();
            httpSvc.get.and.returnValue(getDeferred.promise);
        });
        it('when get succeeds', function(done) {
            getDeferred.resolve({status: 200, data: searchResults});
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function(response) {
                    expect(response).toEqual(searchResults);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            scope.$apply();
        });
        it('when get is empty', function(done) {
            getDeferred.resolve({status: 204});
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function(response) {
                    expect(response).toEqual([]);
                    done();
                }, function() {
                    fail('Promise should have resolved');
                    done();
                });
            scope.$apply();
        });
        it('when get succeeds with different code', function(done) {
            getDeferred.resolve({status: 201});
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toEqual('An error has occurred with your search.');
                    done();
                });
            scope.$apply();
        });
        it('when get fails', function(done) {
            getDeferred.reject(error);
            ontologyManagerSvc.getSearchResults(recordId, branchId, commitId, searchText)
                .then(function() {
                    fail('Promise should have rejected');
                    done();
                }, function() {
                    expect(util.onError).toHaveBeenCalledWith(error, jasmine.any(Object), 'An error has occurred with your search.');
                    done();
                });
            scope.$apply();
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
        it('true if the entity contains a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNode(blankNodeObj)).toBe(true);
        });
        it('false if the entity does not contain a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNode({})).toBe(false);
        });
    });
    describe('isBlankNodeId should return', function() {
        it('true if the id is a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNodeId('_:genid')).toBe(true);
            expect(ontologyManagerSvc.isBlankNodeId('_:b')).toBe(true);
        });
        it('false if the id is not a blank node id', function() {
            _.forEach(['', [], {}, true, false, undefined, null, 0, 1], function(test) {
                expect(ontologyManagerSvc.isBlankNodeId(test)).toBe(false);
            });
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
});
