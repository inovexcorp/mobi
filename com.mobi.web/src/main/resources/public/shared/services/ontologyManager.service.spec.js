/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { noop } from 'lodash';
import {
    mockPrefixes,
    mockCatalogManager,
    mockUtil,
    mockHttpService,
    injectRestPathConstant,
    flushAndVerify
} from '../../../../../test/js/Shared';

describe('Ontology Manager service', function() {
    var $httpBackend, ontologyManagerSvc, catalogManagerSvc, scope, prefixes, $q, util, paramSerializer, httpSvc;

    beforeEach(function() {
        angular.mock.module('shared');
        mockPrefixes();
        mockCatalogManager();
        mockUtil();
        mockHttpService();
        injectRestPathConstant();

        inject(function(ontologyManagerService, _$httpBackend_, _$q_, _$rootScope_, _catalogManagerService_, _prefixes_, _utilService_, $httpParamSerializer, _httpService_) {
            ontologyManagerSvc = ontologyManagerService;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            util = _utilService_;
            paramSerializer = $httpParamSerializer;
            httpSvc = _httpService_;
        });

        this.recordId = 'recordId';
        this.ontologyId = 'ontologyId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        this.catalogId = 'catalogId';
        this.format = 'jsonld';
        this.file = {};
        this.title = 'title';
        this.description = 'description';
        this.keywords = ['keyword1', 'keyword2'];
        this.error = 'error';
        this.errorObject = {'errorMessage': 'error', 'errorDetails': []};

        this.records = {
            data: [{
                'dcterms:identifier': 'id1'
            }, {
                'dcterms:identifier': 'id2'
            }]
        };
        this.anonymous = 'anonymous';
        this.classId = 'classId';
        this.objectPropertyId = 'objectPropertyId';
        this.dataPropertyId = 'dataPropertyId';
        this.annotationId = 'annotationId';
        this.individualId = 'individualId';
        this.restrictionId = 'restrictionId';
        this.blankNodeId = '_:genid0';
        this.blankNodeObj = {
            '@id': this.blankNodeId
        };
        this.usages = {
            results: {
                bindings: []
            }
        };
        this.conceptId = 'conceptId';
        this.schemeId = 'schemeId';
        this.derivedConceptType = ['derivedConcept'];
        this.derivedConceptSchemeType = ['derivedConceptScheme'];
        this.importedClassId = 'importedClassId';
        this.importedDataPropertyId = 'importedDataPropertyId';
        this.importedDataPropertyId = 'importedObjectPropertyId';
        this.importedAnnotationId = 'importedAnnotationId';
        this.importedIndividualId = 'importedIndividualId';
        this.importedRestrictionId = 'importedRestrictionId';
        this.importedConceptId = 'importedConceptId';
        this.importedSchemeId = 'importedSchemeId';
        this.importedOntologyId = 'importedOntologyId';
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        ontologyManagerSvc.initialize();
        this.ontologyObj = {
            '@id': this.ontologyId,
            '@type': [prefixes.owl + 'Ontology', prefixes.ontologyEditor + 'OntologyRecord']
        };
        this.classObj = {
            '@id': this.classId,
            '@type': [prefixes.owl + 'Class']
        };
        this.objectPropertyObj = {
            '@id': this.objectPropertyId,
            '@type': [prefixes.owl + 'ObjectProperty']
        };
        this.objectPropertyObj[prefixes.rdfs + 'domain'] = [{'@id': this.classId}];
        this.dataPropertyObj = {
            '@id': this.dataPropertyId,
            '@type': [prefixes.owl + 'DatatypeProperty']
        };
        this.annotationObj = {
            '@id': this.annotationId,
            '@type': [prefixes.owl + 'AnnotationProperty']
        };
        this.individualObj = {
            '@id': this.individualId,
            '@type': [prefixes.owl + 'NamedIndividual', this.classId]
        };
        this.restrictionObj = {
            '@id': this.restrictionId,
            '@type': [prefixes.owl + 'Restriction']
        };
        this.conceptObj = {
            '@id': this.conceptId,
            '@type': [prefixes.skos + 'Concept']
        };
        this.derivedConceptObj = {
            '@id': this.conceptId,
            '@type': [this.derivedConceptType]
        };
        this.schemeObj = {
            '@id': this.schemeId,
            '@type': [prefixes.skos + 'ConceptScheme']
        };
        this.derivedConceptSchemeObj = {
            '@id': this.schemeId,
            '@type': [this.derivedConceptSchemeType]
        };
        this.ontology = [this.ontologyObj, this.classObj, this.dataPropertyObj];
        this.importedOntObj = {
            '@id': this.importedOntologyId,
            '@type': [prefixes.owl + 'Ontology']
        };
        this.importedClassObj = {
            '@id': this.importedClassId,
            '@type': [prefixes.owl + 'Class']
        };
        this.importedDataPropertyObj = {
            '@id': this.importedDataPropertyId,
            '@type': [prefixes.owl + 'DatatypeProperty']
        };
        this.importedObjectPropertyObj = {
            '@id': this.importedDataPropertyId,
            '@type': [prefixes.owl + 'ObjectProperty']
        };
        this.importedObjectPropertyObj[prefixes.rdfs + 'domain'] = [{'@id': this.importedClassId}];
        this.importedAnnotationObj = {
            '@id': this.importedAnnotationId,
            '@type': [prefixes.owl + 'AnnotationProperty']
        };
        this.importedIndividualObj = {
            '@id': this.importedIndividualId,
            '@type': [prefixes.owl + 'NamedIndividual', this.importedClassId]
        };
        this.importedRestrictionObj = {
            '@id': this.importedRestrictionId,
            '@type': [prefixes.owl + 'Restriction']
        };
        this.importedConceptObj = {
            '@id': this.importedConceptId,
            '@type': [prefixes.skos + 'Concept']
        };
        this.importedSchemeObj = {
            '@id': this.importedSchemeId,
            '@type': [prefixes.skos + 'ConceptScheme']
        };

        util.rejectError.and.returnValue($q.reject(this.error));
        util.rejectErrorObject.and.returnValue($q.reject(this.errorObject));
    });

    afterEach(function() {
        $httpBackend = null;
        ontologyManagerSvc = null;
        catalogManagerSvc = null;
        scope = null;
        prefixes = null;
        $q = null;
        util = null;
        paramSerializer = null;
        httpSvc = null;
    });

    it('reset should clear the proper variables', function() {
        ontologyManagerSvc.ontologyRecords = ['record'];
        ontologyManagerSvc.reset();
        expect(ontologyManagerSvc.ontologyRecords).toEqual([]);
    });

    describe('uploadOntology hits the proper endpoint', function() {
        describe('with a file', function() {
            describe('without an id and', function() {
                it('with description and keywords', function() {
                    $httpBackend.expectPOST('/mobirest/ontologies',
                        function(data) {
                            return data instanceof FormData;
                        }, function(headers) {
                            return headers['Content-Type'] === undefined;
                        }).respond(200, {ontologyId: this.ontologyId, recordId: this.recordId});
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        flushAndVerify($httpBackend);
                    };
                    ontologyManagerSvc.uploadOntology(this.file, undefined, this.title, this.description, this.keywords, callBack);
                });
                it('with no description or keywords', function() {
                    $httpBackend.expectPOST('/mobirest/ontologies',
                        function(data) {
                            return data instanceof FormData;
                        }, function(headers) {
                            return headers['Content-Type'] === undefined;
                        }).respond(200, {ontologyId: this.ontologyId, recordId: this.recordId});
                    const callBack = function(id, promise) {
                        promise.t.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        flushAndVerify($httpBackend);
                    };
                    ontologyManagerSvc.uploadOntology(this.file, undefined, this.title, undefined, undefined, undefined, callBack);
                        
                });
                it('unless an error occurs', function() {
                    $httpBackend.expectPOST('/mobirest/ontologies',
                        function(data) {
                            return data instanceof FormData;
                        }, function(headers) {
                            return headers['Content-Type'] === undefined;
                        }).respond(400, this.errorObject, null, this.error);
                    const callBack = function(id, promise) {
                        promise.then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.errorObject);
                        });
                        flushAndVerify($httpBackend);
                        expect(util.rejectErrorObject).toHaveBeenCalledWith(jasmine.objectContaining({
                            status: 400,
                            statusText: this.error
                        }));
                    };
                    ontologyManagerSvc.uploadOntology(this.file, undefined, this.title, undefined, undefined, undefined, callBack);
                });
            });
            describe('with an id', function() {
                beforeEach(function() {
                    this.config = {
                        transformRequest: jasmine.any(Function),
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                    this.fd = new FormData();
                    this.fd.append('file', this.file);
                    this.fd.append('title', this.title);
                });
                it('with description and keywords', function() {
                    httpSvc.post.and.returnValue($q.when({data: {ontologyId: this.ontologyId, recordId: this.recordId}}));
                    this.fd.append('description', this.description);
                    this.keywords.forEach(word => {
                        this.fd.append('keywords', word);
                    });
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        scope.$apply();
                        expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/ontologies', this.fd, this.config, 'id');
                    };   
                    ontologyManagerSvc.uploadOntology(this.file, undefined, this.title, this.description, this.keywords, 'id', callBack);
                });
                it('with no description or keywords', function() {
                    httpSvc.post.and.returnValue($q.when({data: {ontologyId: this.ontologyId, recordId: this.recordId}}));
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        scope.$apply();
                        expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/ontologies', this.fd, this.config, 'id');
                    };
                    ontologyManagerSvc.uploadOntology(this.file, undefined, this.title, undefined, undefined, 'id', callBack);
                   
                });
                it('unless an error occurs', function() {
                    httpSvc.post.and.returnValue($q.reject({statusText: this.error}));
                    const callBack = function(id, promise) {
                        promise.then(() => {
                            fail('Promise should have rejected');
                        });
                        scope.$apply();
                        expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/ontologies', this.fd, this.config, 'id');
                        expect(util.rejectErrorObject).toHaveBeenCalledWith({statusText: this.error});
                    };
                    ontologyManagerSvc.uploadOntology(this.file, undefined, this.title, undefined, undefined, 'id', callBack);
                });
            });
        });
        describe('with JSON-LD', function() {
            describe('without an id and', function() {
                it('with description and keywords', function() {
                    $httpBackend.expectPOST('/mobirest/ontologies',
                        function(data) {
                            return data instanceof FormData;
                        }, function(headers) {
                            return headers['Content-Type'] === undefined;
                        }).respond(200, {ontologyId: this.ontologyId, recordId: this.recordId});
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        flushAndVerify($httpBackend);
                    }
                    ontologyManagerSvc.uploadOntology(undefined, this.ontologyObj, this.title, this.description, this.keywords, callBack);
                });
                it('with no description or keywords', function() {
                    $httpBackend.expectPOST('/mobirest/ontologies',
                        function(data) {
                            return data instanceof FormData;
                        }, function(headers) {
                            return headers['Content-Type'] === undefined;
                        }).respond(200, {ontologyId: this.ontologyId, recordId: this.recordId});
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        flushAndVerify($httpBackend);
                    }
                    ontologyManagerSvc.uploadOntology(undefined, this.ontologyObj, this.title, undefined, undefined, undefined, callBack);
                });
                it('unless an error occurs', function() {
                    $httpBackend.expectPOST('/mobirest/ontologies',
                        function(data) {
                            return data instanceof FormData;
                        }, function(headers) {
                            return headers['Content-Type'] === undefined;
                        }).respond(400, this.errorObject, null, this.error);
                    const callBack =  function (id, promise, title) {
                        promise.then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.errorObject);
                        });
                        flushAndVerify($httpBackend);
                        expect(util.rejectErrorObject).toHaveBeenCalledWith(jasmine.objectContaining({
                            status: 400,
                            statusText: this.error
                        }));
                    };
                    ontologyManagerSvc.uploadOntology(undefined, this.ontologyObj, this.title, undefined, undefined, undefined, callBack);
                });
            });
            describe('with an id', function() {
                beforeEach(function() {
                    this.config = {
                        transformRequest: jasmine.any(Function),
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                    this.fd = new FormData();
                    this.fd.append('file', this.file);
                    this.fd.append('title', this.title);
                });
                it('with description and keywords', function() {
                    httpSvc.post.and.returnValue($q.when({data: {ontologyId: this.ontologyId, recordId: this.recordId}}));
                    this.fd.append('description', this.description);
                    this.keywords.forEach(word => {
                        this.fd.append('keywords', word);
                    });
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        scope.$apply();
                        expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/ontologies', this.fd, this.config, 'id');
                    }
                    ontologyManagerSvc.uploadOntology(undefined, this.ontologyObj, this.title, this.description, this.keywords, 'id', callBack)  
                });
                it('with no description or keywords', function() {
                    httpSvc.post.and.returnValue($q.when({data: {ontologyId: this.ontologyId, recordId: this.recordId}}));
                    const callBack = function(id, promise) {
                        promise.then(response => {
                            expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId});
                        }, () => {
                            fail('Promise should have resolved');
                        });
                        scope.$apply();
                        expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/ontologies', this.fd, this.config, 'id');
                    };
                    ontologyManagerSvc.uploadOntology(undefined, this.ontologyObj, this.title, undefined, undefined, 'id', callBack);
                });
                it('unless an error occurs', function() {
                    httpSvc.post.and.returnValue($q.reject({statusText: this.error}));
                    const callBack = function(id, promise) {
                        promise.then(() => {
                            fail('Promise should have rejected');
                        });
                        scope.$apply();
                        expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/ontologies', this.fd, this.config, 'id');
                        expect(util.rejectErrorObject).toHaveBeenCalledWith({statusText: this.error});
                    };
                    ontologyManagerSvc.uploadOntology(undefined, this.ontologyObj, this.title, undefined, undefined, 'id', callBack);
                });
            });
        });
    });
    describe('uploadOntology file not supported', function() {
         it('trig with title, description and keywords', function() {
            const callback = function(id, promise) {
                promise.then(response => {
                    fail('Promise should have not resolved');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
            }
            ontologyManagerSvc.uploadOntology(this.file, undefined, 'title.trig', this.description, this.keywords, 'id', callback);
        });
        it('trig.zip with title, description and keywords', function() {
           const callback = function(id, promise) {
               promise.then(response => {
                   fail('Promise should have not resolved');
               }, errorObject => {
                   expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
               });
           }
           ontologyManagerSvc.uploadOntology(this.file, undefined, 'title.trig.zip', this.description, this.keywords, 'id', callback);
        });
        it('trig.gzip with title, description and keywords', function() {
           const callback = function(id, promise) {
               promise.then(response => {
                   fail('Promise should have not resolved');
               }, errorObject => {
                   expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
               });
           }
           ontologyManagerSvc.uploadOntology(this.file, undefined, 'title.trig.gzip', this.description, this.keywords, 'id', callback);
        });
    });
    describe('deleteOntology hits the proper endpoint', function() {
        it('successfully', function() {
            $httpBackend.expectDELETE('/mobirest/ontologies/' + encodeURIComponent(this.recordId)).respond(200);
            ontologyManagerSvc.deleteOntology(this.recordId)
                .then(noop, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectDELETE('/mobirest/ontologies/' + encodeURIComponent(this.recordId)).respond(400, null, null, this.error);
            ontologyManagerSvc.deleteOntology(this.recordId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: this.error
            }));
        });
    });
    describe('downloadOntology should call the util.startDownload method properly', function() {
        beforeEach(function () {
            this.params = {
                branchId: this.branchId,
                commitId: this.commitId,
                fileName: 'ontology',
                rdfFormat: 'jsonld'
            };
        });
        it('with a format and no fileName', function() {
            this.params.rdfFormat = 'turtle';
            var params = paramSerializer(this.params);
            ontologyManagerSvc.downloadOntology(this.recordId, this.branchId, this.commitId, 'turtle');
            expect(util.startDownload).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + params);
        });
        it('without a format or a fileName', function() {
            var params = paramSerializer(this.params);
            ontologyManagerSvc.downloadOntology(this.recordId, this.branchId, this.commitId);
            expect(util.startDownload).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + params);
        });
        it('with a format and fileName', function() {
            this.params.rdfFormat = 'turtle';
            this.params.fileName = 'fileName';
            var params = paramSerializer(this.params);
            ontologyManagerSvc.downloadOntology(this.recordId, this.branchId, this.commitId, 'turtle', 'fileName');
            expect(util.startDownload).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + params);
        });
        it('without a format and with a fileName', function() {
            this.params.fileName = 'fileName';
            var params = paramSerializer(this.params);
            ontologyManagerSvc.downloadOntology(this.recordId, this.branchId, this.commitId, undefined, 'fileName');
            expect(util.startDownload).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + params);
        });
    });
    describe('getOntology hits the proper endpoint', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId, rdfFormat: this.format, clearCache: false, skolemize: true, applyInProgressCommit: true });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + this.params,
                function(headers) {
                    return headers['Accept'] === 'text/plain';
                }).respond(400, null, null, this.error);
            ontologyManagerSvc.getOntology(this.recordId, this.branchId, this.commitId, this.format, false, false, true)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: this.error
            }));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + this.params,
                function(headers) {
                    return headers['Accept'] === 'text/plain';
                }).respond(200, this.ontology);
            ontologyManagerSvc.getOntology(this.recordId, this.branchId, this.commitId, this.format, false, false, true)
                .then(data => {
                    expect(data).toEqual(this.ontology);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('deleteOntologyBranch hits the proper endpoint', function() {
        it('successfully', function() {
            $httpBackend.expectDELETE('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId)).respond(200);
            ontologyManagerSvc.deleteOntologyBranch(this.recordId, this.branchId)
                .then(noop, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectDELETE('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId)).respond(400, null, null, this.error);
            ontologyManagerSvc.deleteOntologyBranch(this.recordId, this.branchId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: this.error
            }));
        });
    });
    describe('getVocabularyStuff retrieves information about skos:Concepts and skos:ConceptSchemes in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        describe('with no id set', function() {
            it('unless an error occurs', function() {
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/vocabulary-stuff?' + this.params).respond(400, null, null, this.error);
                ontologyManagerSvc.getVocabularyStuff(this.recordId, this.branchId, this.commitId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                flushAndVerify($httpBackend);
                expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: 'error'}));
            });
            it('successfully', function() {
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/vocabulary-stuff?' + this.params).respond(200, {});
                ontologyManagerSvc.getVocabularyStuff(this.recordId, this.branchId, this.commitId)
                    .then(response => {
                        expect(response).toEqual({});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
        });
        describe('with an id', function() {
            beforeEach(function() {
                this.config = { params: { branchId: this.branchId, commitId: this.commitId } };
            });
            it('unless an error occurs', function() {
                httpSvc.get.and.returnValue($q.reject({status: 400, statusText: this.error}));
                ontologyManagerSvc.getVocabularyStuff(this.recordId, this.branchId, this.commitId, 'id')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/vocabulary-stuff', this.config, 'id');
                expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
            });
            it('successfully', function() {
                httpSvc.get.and.returnValue($q.when({data: {}}));
                ontologyManagerSvc.getVocabularyStuff(this.recordId, this.branchId, this.commitId, 'id')
                    .then(response => {
                        expect(response).toEqual({});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/vocabulary-stuff', this.config, 'id');
            });
        });
    });
    describe('getOntologyStuff retrieves information about ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        describe('with no id set', function() {
            it('unless an error occurs', function() {
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/ontology-stuff?' + this.params).respond(400, null, null, this.error);
                ontologyManagerSvc.getOntologyStuff(this.recordId, this.branchId, this.commitId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                flushAndVerify($httpBackend);
                expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: 'error'}));
            });
            it('successfully clearing the cache', function() {
                this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId, clearCache: true });
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/ontology-stuff?' + this.params).respond(200, {});
                ontologyManagerSvc.getOntologyStuff(this.recordId, this.branchId, this.commitId, true)
                    .then(response => {
                        expect(response).toEqual({});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
            it('successfully', function() {
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/ontology-stuff?' + this.params).respond(200, {});
                ontologyManagerSvc.getOntologyStuff(this.recordId, this.branchId, this.commitId)
                    .then(response => {
                        expect(response).toEqual({});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
        });
        describe('with an id', function() {
            beforeEach(function() {
                this.config = { params: { branchId: this.branchId, commitId: this.commitId, clearCache: undefined } };
            });
            it('unless an error occurs', function() {
                httpSvc.get.and.returnValue($q.reject({status: 400, statusText: this.error}));
                ontologyManagerSvc.getOntologyStuff(this.recordId, this.branchId, this.commitId, undefined, 'id')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/ontology-stuff', this.config, 'id');
                expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
            });
            it('successfully clearing the cache', function() {
                this.config.params.clearCache = true;
                httpSvc.get.and.returnValue($q.when({data: {}}));
                ontologyManagerSvc.getOntologyStuff(this.recordId, this.branchId, this.commitId, true, 'id')
                    .then(response => {
                        expect(response).toEqual({});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/ontology-stuff', this.config, 'id');
            });
            it('successfully', function() {
                httpSvc.get.and.returnValue($q.when({data: {}}));
                ontologyManagerSvc.getOntologyStuff(this.recordId, this.branchId, this.commitId, undefined, 'id')
                    .then(response => {
                        expect(response).toEqual({});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/ontology-stuff', this.config, 'id');
            });
        });
    });
    describe('getIris retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/iris?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getIris(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/iris?' + this.params).respond(200, {});
            ontologyManagerSvc.getIris(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getOntologyClasses retrieves all classes in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId, applyInProgressCommit: false });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/classes?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getOntologyClasses(this.recordId, this.branchId, this.commitId, false)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/classes?' + this.params).respond(200, [{}]);
            ontologyManagerSvc.getOntologyClasses(this.recordId, this.branchId, this.commitId, false)
                .then(response => {
                    expect(response).toEqual([{}]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getDataProperties retrieves all data properties in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/data-properties?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getDataProperties(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/data-properties?' + this.params).respond(200, [{}]);
            ontologyManagerSvc.getDataProperties(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual([{}]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getObjProperties retrieves all data properties in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/object-properties?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getObjProperties(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/object-properties?' + this.params).respond(200, [{}]);
            ontologyManagerSvc.getObjProperties(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual([{}]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getImportedIris retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-iris?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getImportedIris(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('unless there are none', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-iris?' + this.params).respond(204);
            ontologyManagerSvc.getImportedIris(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-iris?' + this.params).respond(200, [{}]);
            ontologyManagerSvc.getImportedIris(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual([{}]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getClassHierarchies retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/class-hierarchies?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getClassHierarchies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/class-hierarchies?' + this.params).respond(200, {});
            ontologyManagerSvc.getClassHierarchies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getClassesWithIndividuals retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/classes-with-individuals?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getClassesWithIndividuals(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/classes-with-individuals?' + this.params).respond(200, {});
            ontologyManagerSvc.getClassesWithIndividuals(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getDataPropertyHierarchies retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/data-property-hierarchies?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getDataPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/data-property-hierarchies?' + this.params).respond(200, {});
            ontologyManagerSvc.getDataPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getObjectPropertyHierarchies retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/object-property-hierarchies?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getObjectPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/object-property-hierarchies?' + this.params).respond(200, {});
            ontologyManagerSvc.getObjectPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getAnnotationPropertyHierarchies retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/annotation-property-hierarchies?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getAnnotationPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/annotation-property-hierarchies?' + this.params).respond(200, {});
            ontologyManagerSvc.getAnnotationPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getConceptHierarchies retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/concept-hierarchies?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getConceptHierarchies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/concept-hierarchies?' + this.params).respond(200, {});
            ontologyManagerSvc.getConceptHierarchies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getConceptSchemeHierarchies retrieves all IRIs in an ontology', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/concept-scheme-hierarchies?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getConceptSchemeHierarchies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/concept-scheme-hierarchies?' + this.params).respond(200, {});
            ontologyManagerSvc.getConceptSchemeHierarchies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('getImportedOntologies should call the proper functions', function() {
        beforeEach(function() {
            this.params = paramSerializer({
                branchId: this.branchId,
                commitId: this.commitId,
                rdfFormat: this.format
            });
        });
        it('when get succeeds', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-ontologies?' + this.params)
                .respond(200, [this.ontology]);
            ontologyManagerSvc.getImportedOntologies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual([this.ontology]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('when get is empty', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-ontologies?' + this.params)
                .respond(204);
            ontologyManagerSvc.getImportedOntologies(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('when another success response', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-ontologies?' + this.params)
                .respond(201, null, null, this.error);
            ontologyManagerSvc.getImportedOntologies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
        });
        it('when get fails', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/imported-ontologies?' + this.params)
                .respond(400, null, null, this.error);
            ontologyManagerSvc.getImportedOntologies(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
    });
    describe('getEntityUsages should call the proper functions', function() {
        beforeEach(function() {
            this.params = paramSerializer({
                branchId: this.branchId,
                commitId: this.commitId
            });
            this.config = {
                params: {
                    branchId: this.branchId,
                    commitId: this.commitId,
                    queryType: 'select'
                }
            };
        });
        describe('when get succeeds', function() {
            describe('with no id set', function() {
                it('and queryType is select', function() {
                    $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/entity-usages/classId?' + this.params + '&queryType=select')
                        .respond(200, this.usages);
                    ontologyManagerSvc.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'select')
                        .then(response => {
                            expect(response).toEqual(this.usages.results.bindings);
                        }, () => {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                });
                it('and queryType is construct', function() {
                    $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/entity-usages/classId?' + this.params + '&queryType=construct')
                        .respond(200, this.usages);
                    ontologyManagerSvc.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'construct')
                        .then(response => {
                            expect(response).toEqual(this.usages);
                        }, () => {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                });
            });
            describe('when id is set', function() {
                beforeEach(function() {
                    httpSvc.get.and.returnValue($q.when({data: this.usages}));
                });
                it('and queryType is select', function() {
                    ontologyManagerSvc.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'select', 'usages')
                        .then(response => {
                            expect(response).toEqual(this.usages.results.bindings);
                        }, () => {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/entity-usages/' + encodeURIComponent(this.classId), this.config, 'usages');
                });
                it('and queryType is construct', function() {
                    this.config.params.queryType = 'construct';
                    ontologyManagerSvc.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'construct', 'usages')
                        .then(response => {
                            expect(response).toEqual(this.usages);
                        }, () => {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/entity-usages/' + encodeURIComponent(this.classId), this.config, 'usages');
                });
            });
        });
        describe('when get fails', function() {
            it('when id is not set', function() {
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/entity-usages/classId?' + this.params + '&queryType=select')
                    .respond(400, null, null, this.error);
                ontologyManagerSvc.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
            });
            it('when id is set', function() {
                httpSvc.get.and.returnValue($q.reject({statusText: this.error}));
                ontologyManagerSvc.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'select', 'usages')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/entity-usages/' + encodeURIComponent(this.classId), this.config, 'usages');
                expect(util.rejectError).toHaveBeenCalledWith({statusText: this.error});
            });
        });
    });
    describe('getOntologyEntityNames calls the correct functions when POST /mobirest/ontologies/{recordId}/entity-names', function() {
        beforeEach(function() {
            this.params = paramSerializer({
                branchId: this.branchId,
                commitId: this.commitId,
                includeImports: false,
                applyInProgressCommit: false
            });

        });
        it('successfully', function() {
            $httpBackend.expectPOST('/mobirest/ontologies/' + this.recordId + '/entity-names?' + this.params,
                () => {
                    return {'filterResources': []};
                },
                function(headers) {
                    return headers['Content-Type'] === 'application/json';
                }).respond(200, {});
            ontologyManagerSvc.getOntologyEntityNames(this.recordId, this.branchId, this.commitId, false, false)
                .then(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/ontologies/' + this.recordId + '/entity-names?' + this.params,
                () =>  {
                    return {'filterResources': []};
                }, function(headers) {
                    return headers['Content-Type'] === 'application/json';
                }).respond(400, null, null, this.error);
            ontologyManagerSvc.getOntologyEntityNames(this.recordId, this.branchId, this.commitId, false, false)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
    });
    describe('getSearchResults should call the correct functions', function() {
        beforeEach(function () {
            this.searchText = 'searchText';
        });
        it('when get succeeds', function() {
            var searchResults = [];
            httpSvc.get.and.returnValue($q.when({status: 200, data: searchResults}));
            ontologyManagerSvc.getSearchResults(this.recordId, this.branchId, this.commitId, this.searchText)
                .then(function(response) {
                    expect(response).toEqual(searchResults);
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
        });
        it('when get is empty', function() {
            httpSvc.get.and.returnValue($q.when({status: 204}));
            ontologyManagerSvc.getSearchResults(this.recordId, this.branchId, this.commitId, this.searchText)
                .then(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
        });
        it('when get succeeds with different code', function() {
            httpSvc.get.and.returnValue($q.when({status: 201}));
            ontologyManagerSvc.getSearchResults(this.recordId, this.branchId, this.commitId, this.searchText)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('An error has occurred with your search.');
                });
            scope.$apply();
        });
        it('when get fails', function() {
            httpSvc.get.and.returnValue($q.reject({statusText: this.error}));
            ontologyManagerSvc.getSearchResults(this.recordId, this.branchId, this.commitId, this.searchText)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
            expect(util.rejectError).toHaveBeenCalledWith({statusText: this.error}, 'An error has occurred with your search.');
        });
    });
    describe('getQueryResults calls the correct functions when GET /mobirest/ontologies/{recordId}/query', function() {
        beforeEach(function() {
            this.query = 'select * where {?s ?p ?o}';
            this.params = paramSerializer({
                query: this.query,
                branchId: this.branchId,
                commitId: this.commitId,
                format: this.format,
                applyInProgressCommit: false,
                includeImports: true
            });
        });
        it('succeeds', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/query?' + this.params).respond(200, [{}]);
            ontologyManagerSvc.getQueryResults(this.recordId, this.branchId, this.commitId, this.query, this.format)
                .then(response => expect(response).toEqual([{}]),
                    () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/query?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getQueryResults(this.recordId, this.branchId, this.commitId, this.query, this.format)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toBe(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: this.error, status: 400}));
        });
    });
    describe('getFailedImports calls the correct functions when GET /mobirest/ontologies/{recordId}/failed-imports', function() {
        beforeEach(function() {
            this.params = paramSerializer({
                branchId: this.branchId,
                commitId: this.commitId
            });
        });
        it('succeeds', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/failed-imports?' + this.params).respond(200, ['failedId']);
            ontologyManagerSvc.getFailedImports(this.recordId, this.branchId, this.commitId)
                .then(response => {
                    expect(response).toEqual(['failedId']);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/failed-imports?' + this.params).respond(400, null, null, this.error);
            ontologyManagerSvc.getFailedImports(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toBe(this.error);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: this.error, status: 400}));
        });
    });
    describe('getEntityAndBlankNodes retrieves entity and blank node RDF', function() {
        beforeEach(function() {
            this.params = {
                branchId: this.branchId,
                commitId: this.commitId,
                format: 'jsonld',
                includeImports: true,
                applyInProgressCommit: true
            };
        });
        describe('with an id', function() {
            beforeEach(function() {
                this.config = {params: this.params};
            });
            it('successfully with defaults', function() {
                httpSvc.get.and.returnValue($q.when({data: [{}]}));
                ontologyManagerSvc.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId, undefined, undefined, undefined, 'id')
                    .then(response => {
                        expect(response).toEqual([{}]);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId, this.config, 'id');
            });
            it('successfully with specified params', function() {
                httpSvc.get.and.returnValue($q.when({data: [{}]}));
                this.params.format = 'turtle';
                this.params.includeImports = false;
                this.params.applyInProgressCommit = false;
                ontologyManagerSvc.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId, 'turtle', false, false, 'id')
                    .then(response => {
                        expect(response).toEqual([{}]);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId, this.config, 'id');
            });
            it('unless an error occurs', function() {
                httpSvc.get.and.returnValue($q.reject({statusText: this.error}));
                ontologyManagerSvc.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId, undefined, undefined, undefined, 'id')
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toBe(this.error);
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId, this.config, 'id');
                expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: this.error}));
            });
        });
        describe('without an id', function() {
            it('successfully with defaults', function() {
                var params = paramSerializer(this.params);
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId + '?' + params).respond(200, [{}]);
                ontologyManagerSvc.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId)
                    .then(response => {
                        expect(response).toEqual([{}]);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
            it('successfully with specified params', function() {
                this.params.format = 'turtle';
                this.params.includeImports = false;
                this.params.applyInProgressCommit = false;
                var params = paramSerializer(this.params);
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId + '?' + params).respond(200, [{}]);
                ontologyManagerSvc.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId, 'turtle', false, false)
                    .then(response => {
                        expect(response).toEqual([{}]);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
            it('unless an error occurs', function() {
                var params = paramSerializer(this.params);
                $httpBackend.expectGET('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId + '?' + params).respond(400, null, null, this.error);
                ontologyManagerSvc.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toBe(this.error);
                    });
                flushAndVerify($httpBackend);
                expect(util.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: this.error, status: 400}));
            });
        });
    });
    describe('isOntology should return', function() {
        it('true if the entity contains the ontology type', function() {
            expect(ontologyManagerSvc.isOntology(this.ontologyObj)).toBe(true);
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(ontologyManagerSvc.isOntology({})).toBe(false);
        });
    });
    describe('isOntologyRecord should return', function() {
        it('true if the entity contains the ontology type', function() {
            expect(ontologyManagerSvc.isOntologyRecord(this.ontologyObj)).toBe(true);
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(ontologyManagerSvc.isOntologyRecord({})).toBe(false);
        });
    });
    describe('hasOntologyEntity should return', function() {
        it('true if there is an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.hasOntologyEntity([this.ontologyObj])).toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.hasOntologyEntity([])).toBe(false);
        });
    });
    describe('getOntologyEntity should return', function() {
        it('correct object if there is an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.getOntologyEntity([this.ontologyObj])).toBe(this.ontologyObj);
        });
        it('undefined if there is not an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.getOntologyEntity([])).toBe(undefined);
        });
    });
    describe('getOntologyIRI should return', function() {
        it('@id if there is an ontology entity in the ontology with @id', function() {
            expect(ontologyManagerSvc.getOntologyIRI([this.ontologyObj])).toBe(this.ontologyId);
        });
        it('"" if none are present or no ontology entity', function() {
            expect(ontologyManagerSvc.getOntologyIRI([])).toBe('');
        });
    });
    describe('isDatatype should return', function() {
        it('true if the entity contains the datatype type', function() {
            expect(ontologyManagerSvc.isDatatype({'@type': [prefixes.rdfs + 'Datatype']})).toBe(true);
        });
        it('false if the entity does not contain the datatype type', function() {
            expect(ontologyManagerSvc.isDatatype({})).toBe(false);
        });
    });
    describe('isClass should return', function() {
        it('true if the entity contains the class type', function() {
            expect(ontologyManagerSvc.isClass(this.classObj)).toBe(true);
        });
        it('false if the entity does not contain the class type', function() {
            expect(ontologyManagerSvc.isClass({})).toBe(false);
        });
    });
    describe('hasClasses should return', function() {
        it('true if there are any class entities in the ontology', function() {
            expect(ontologyManagerSvc.hasClasses([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are class entities only in the ontology', function() {
            expect(ontologyManagerSvc.hasClasses([[this.classObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are class entities only in the imported ontology', function() {
            expect(ontologyManagerSvc.hasClasses([[this.ontologyObj], [this.importedClassObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any class entities in the ontology', function() {
            expect(ontologyManagerSvc.hasClasses([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getClasses should return', function() {
        it('correct class objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getClasses([[this.classObj, this.ontologyObj],[this.importedClassObj, this.importedOntObj]])).toEqual([this.classObj, this.importedClassObj]);
        });
        it('correct class objects if there are any only in the ontology', function() {
            expect(ontologyManagerSvc.getClasses([[this.classObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.classObj]);
        });
        it('correct class objects if there are any only in the imported ontology', function() {
            expect(ontologyManagerSvc.getClasses([[this.ontologyObj], [this.importedClassObj, this.importedOntObj]])).toEqual([this.importedClassObj]);
        });
        it('correct class objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getClasses([[this.classObj, this.ontologyObj],[this.classObj, this.importedOntObj]])).toEqual([this.classObj]);
        });
        it('undefined if there are no classes in the ontology', function() {
            expect(ontologyManagerSvc.getClasses([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getClassIRIs should return', function() {
        it('classId if there are classes in the ontology', function() {
            expect(ontologyManagerSvc.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj, this.importedClassObj]])).toEqual([this.classId, this.importedClassId]);
        });
        it('classId if there are classes only in the ontology', function() {
            expect(ontologyManagerSvc.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj]])).toEqual([this.classId]);
        });
        it('classId if there are classes only in the imported ontology', function() {
            expect(ontologyManagerSvc.getClassIRIs([[this.ontologyObj],[this.importedOntObj, this.importedClassObj]])).toEqual([this.importedClassId]);
        });
        it('classId if there are duplicates', function() {
            expect(ontologyManagerSvc.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj, this.classObj]])).toEqual([this.classId]);
        });
        it('[] if there are no classes in the ontology', function() {
            expect(ontologyManagerSvc.getClassIRIs([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasClassProperties should return', function() {
        it('true if there are any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.hasClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toBe(true);
        });
        it('true if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(ontologyManagerSvc.hasClassProperties([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(ontologyManagerSvc.hasClassProperties([[this.classObj, this.ontologyObj],[this.importedClassObj, this.importedOntObj]], this.classId)).toBe(false);
        });
    });
    describe('getClassProperties should return', function() {
        it('correct objects if there are any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toEqual([this.objectPropertyObj]);
        });
        it('correct objects if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(ontologyManagerSvc.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toEqual([this.importedObjectPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.classObj, this.importedOntObj, this.objectPropertyObj]], this.classId)).toEqual([this.objectPropertyObj]);
        });
        it('[] if there are no entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassProperties([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toEqual([]);
        });
    });
    describe('getClassPropertyIRIs should return', function() {
        it('correct IRIs if there are any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toEqual([this.objectPropertyId]);
        });
        it('correct IRIs if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(ontologyManagerSvc.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toEqual([this.importedDataPropertyId]);
        });
        it('correct IRIs if there are duplicates', function() {
            expect(ontologyManagerSvc.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.classObj, this.importedOntObj, this.objectPropertyObj]], this.classId)).toEqual([this.objectPropertyId]);
        });
        it('[] if there are not any entities with a domain of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassPropertyIRIs([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toEqual([]);
        });
    });
    describe('isObjectProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(ontologyManagerSvc.isObjectProperty(this.objectPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the object property type', function() {
            expect(ontologyManagerSvc.isObjectProperty({})).toBe(false);
        });
    });
    describe('isDataTypeProperty should return', function() {
        it('true if the entity contains the data property type', function() {
            expect(ontologyManagerSvc.isDataTypeProperty(this.dataPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the data property type', function() {
            expect(ontologyManagerSvc.isDataTypeProperty({})).toBe(false);
        });
    });
    describe('isProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(ontologyManagerSvc.isProperty(this.objectPropertyObj)).toBe(true);
        });
        it('true if the entity contains the data property type', function() {
            expect(ontologyManagerSvc.isProperty(this.dataPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the object or data property type', function() {
            expect(ontologyManagerSvc.isProperty({})).toBe(false);
        });
    });
    describe('hasNoDomainProperties should return', function() {
        it('true if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toBe(true);
        });
        it('true if only the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toBe(true);
        });
        it('true if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toBe(true);
        });
        it('false if the ontology does not contain any properties', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
        it('false if the ontology does not contain any properties without rdfs:domains', function() {
            expect(ontologyManagerSvc.hasNoDomainProperties([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toBe(false);
        });
    });
    describe('getNoDomainProperties should return', function() {
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.dataPropertyObj, this.importedDataPropertyObj]);
        });
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('correct object if the imported ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([[this.ontologyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.importedDataPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([[this.dataPropertyObj, this.ontologyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(ontologyManagerSvc.getNoDomainProperties([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([]);
        });
    });
    describe('getNoDomainPropertyIRIs should return', function() {
        it('correct IRI if the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.dataPropertyId, this.importedDataPropertyId]);
        });
        it('correct IRI if only the ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([this.dataPropertyId]);
        });
        it('correct IRI if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.importedDataPropertyId]);
        });
        it('correct IRI if there are duplicates', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyId]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(ontologyManagerSvc.getNoDomainPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([]);
        });
    });
    describe('hasObjectProperties should return', function() {
        it('true if there are any object property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any object property entities only in the ontology', function() {
            expect(ontologyManagerSvc.hasObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any object property entities only in the imported ontology', function() {
            expect(ontologyManagerSvc.hasObjectProperties([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any object property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasObjectProperties([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getObjectProperties should return', function() {
        it('correct object property objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyObj, this.importedObjectPropertyObj]);
        });
        it('correct object property objects if there are any only in the ontology', function() {
            expect(ontologyManagerSvc.getObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.objectPropertyObj]);
        });
        it('correct object property objects if there are any only in the imported ontology', function() {
            expect(ontologyManagerSvc.getObjectProperties([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.importedObjectPropertyObj]);
        });
        it('correct object property objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.objectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyObj]);
        });
        it('undefined if there are no object properties in the ontology', function() {
            expect(ontologyManagerSvc.getObjectProperties([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getObjectPropertyIRIs should return', function() {
        it('objectPropertyId if there are object properties in the ontology', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyId, this.importedDataPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the ontology', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj]])).toEqual([this.objectPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the imported ontology', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.importedDataPropertyId]);
        });
        it('objectPropertyId if there are duplicates', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.objectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyId]);
        });
        it('[] if there are no object properties in the ontology', function() {
            expect(ontologyManagerSvc.getObjectPropertyIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasDataTypeProperties should return', function() {
        it('true if there are any data property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any data property entities only in the ontology', function() {
            expect(ontologyManagerSvc.hasDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any data property entities only in the imported ontology', function() {
            expect(ontologyManagerSvc.hasDataTypeProperties([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any data property entities in the ontology', function() {
            expect(ontologyManagerSvc.hasDataTypeProperties([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getDataTypeProperties should return', function() {
        it('correct data property objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyObj, this.importedDataPropertyObj]);
        });
        it('correct data property objects if there are any only in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('correct data property objects if there are any only in the imported ontology', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.importedDataPropertyObj]);
        });
        it('correct data property objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('undefined if there are no data properties in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypeProperties([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getDataTypePropertyIRIs should return', function() {
        it('dataPropertyId if there are data properties in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyId, this.importedDataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the ontology', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj]])).toEqual([this.dataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the imported ontology', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.importedDataPropertyId]);
        });
        it('dataPropertyId if there are duplicates', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyId]);
        });
        it('[] if there are no data properties in the ontology', function() {
            expect(ontologyManagerSvc.getDataTypePropertyIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isAnnotation should return', function() {
        it('true if the entity contains the annotation property type', function() {
            expect(ontologyManagerSvc.isAnnotation(this.annotationObj)).toBe(true);
        });
        it('false if the entity does not contain the annotation property type', function() {
            expect(ontologyManagerSvc.isAnnotation({})).toBe(false);
        });
    });
    describe('hasAnnotations should return', function() {
        it('true if there are any annotation entities in the ontology', function() {
            expect(ontologyManagerSvc.hasAnnotations([[this.annotationObj, this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any annotation entities in only the ontology', function() {
            expect(ontologyManagerSvc.hasAnnotations([[this.annotationObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any annotation entities in only the imported ontology', function() {
            expect(ontologyManagerSvc.hasAnnotations([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any annotation entities in the ontology', function() {
            expect(ontologyManagerSvc.hasAnnotations([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getAnnotations should return', function() {
        it('correct annotation objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotations([[this.annotationObj, this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.annotationObj, this.importedAnnotationObj]);
        });
        it('correct annotation objects if there are any in only the ontology', function() {
            expect(ontologyManagerSvc.getAnnotations([[this.annotationObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.annotationObj]);
        });
        it('correct annotation objects if there are any in only the imported ontology', function() {
            expect(ontologyManagerSvc.getAnnotations([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.importedAnnotationObj]);
        });
        it('correct annotation objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getAnnotations([[this.annotationObj, this.ontologyObj], [this.annotationObj, this.importedOntObj]])).toEqual([this.annotationObj]);
        });
        it('undefined if there are no annotations in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotations([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getAnnotationIRIs should return', function() {
        it('annotationId if there are annotations in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.annotationId, this.importedAnnotationId]);
        });
        it('annotationId if there are annotations in only the ontology', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.importedOntObj]])).toEqual([this.annotationId]);
        });
        it('annotationId if there are annotations in only the imported ontology', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.importedAnnotationId]);
        });
        it('annotationId if there are duplicates', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.annotationObj, this.importedOntObj]])).toEqual([this.annotationId]);
        });
        it('[] if there are no annotations in the ontology', function() {
            expect(ontologyManagerSvc.getAnnotationIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isNamedIndividual should return', function() {
        it('true if the entity contains the named individual type', function() {
            expect(ontologyManagerSvc.isNamedIndividual(this.individualObj)).toBe(true);
        });
        it('false if the entity does not contain the named individual type', function() {
            expect(ontologyManagerSvc.isNamedIndividual({})).toBe(false);
        });
    });
    describe('isIndividual should return', function() {
        it('true if the entity does not contain any OWL type', function() {
            expect(ontologyManagerSvc.isIndividual({'@type': ['urn:test']})).toBe(true);
        });
        it('false if the entity does contain OWL type', function() {
            [
                prefixes.owl + 'Class',
                prefixes.owl + 'DatatypeProperty',
                prefixes.owl + 'ObjectProperty',
                prefixes.owl + 'AnnotationProperty',
                prefixes.owl + 'Datatype',
                prefixes.owl + 'Ontology'
            ].forEach(type => {
                expect(ontologyManagerSvc.isIndividual({'@type': [type]})).toBe(false);
            });
        });
    });
    describe('hasIndividuals should return', function() {
        it('true if there are any individual entities in the ontology', function() {
            expect(ontologyManagerSvc.hasIndividuals([[this.individualObj, this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any individual entities in only the ontology', function() {
            expect(ontologyManagerSvc.hasIndividuals([[this.individualObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any individual entities in only the imported ontology', function() {
            expect(ontologyManagerSvc.hasIndividuals([[this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any individual entities in the ontology', function() {
            expect(ontologyManagerSvc.hasIndividuals([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getIndividuals([[this.individualObj, this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toEqual([this.individualObj, this.importedIndividualObj]);
        });
        it('correct individual objects if there are any in only the ontology', function() {
            expect(ontologyManagerSvc.getIndividuals([[this.individualObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.individualObj]);
        });
        it('correct individual objects if there are any in only the imported ontology', function() {
            expect(ontologyManagerSvc.getIndividuals([[this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toEqual([this.importedIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getIndividuals([[this.individualObj, this.ontologyObj], [this.individualObj, this.importedOntObj]])).toEqual([this.individualObj]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(ontologyManagerSvc.getIndividuals([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasNoTypeIndividuals should return', function() {
        it('true if there are any in the ontology with no other @type', function() {
            var diffIndividualObj = {
                '@id': this.individualId,
                '@type': [prefixes.owl + 'NamedIndividual']
            };
            expect(ontologyManagerSvc.hasNoTypeIndividuals([[diffIndividualObj, this.ontologyObj]])).toBe(true);
        });
        it('false if there are no individuals in the ontology with no other @type', function() {
            expect(ontologyManagerSvc.hasNoTypeIndividuals([[this.ontologyObj, this.individualObj]])).toBe(false);
        });
        it('false if there are no individuals in the ontology', function() {
            expect(ontologyManagerSvc.hasNoTypeIndividuals([[this.ontologyObj]])).toBe(false);
        });
    });
    describe('getNoTypeIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology with no other @type', function() {
            var diffIndividualObj = {
                '@id': this.individualId,
                '@type': [prefixes.owl + 'NamedIndividual']
            };
            expect(ontologyManagerSvc.getNoTypeIndividuals([[diffIndividualObj, this.ontologyObj]])).toEqual([diffIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            var diffIndividualObj = {
                '@id': this.individualId,
                '@type': [prefixes.owl + 'NamedIndividual']
            };
            expect(ontologyManagerSvc.getNoTypeIndividuals([[diffIndividualObj, this.ontologyObj], [diffIndividualObj, this.importedOntObj]])).toEqual([diffIndividualObj]);
        });
        it('undefined if there are no individuals in the ontology with no other @type', function() {
            expect(ontologyManagerSvc.getNoTypeIndividuals([[this.ontologyObj, this.individualObj]])).toEqual([]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(ontologyManagerSvc.getNoTypeIndividuals([[this.ontologyObj]])).toEqual([]);
        });
    });
    describe('hasClassIndividuals should return', function() {
        it('true if there are any entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.hasClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toBe(true);
        });
        it('true if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(ontologyManagerSvc.hasClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toBe(true);
        });
        it('false if there are no entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.hasClassIndividuals([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toBe(false);
        });
    });
    describe('getClassIndividuals should return', function() {
        it('correct object if there are any entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toEqual([this.individualObj]);
        });
        it('correct object if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(ontologyManagerSvc.getClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toEqual([this.importedIndividualObj]);
        });
        it('[] if there are no entities with a type of the provided class in the ontology', function() {
            expect(ontologyManagerSvc.getClassIndividuals([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toEqual([]);
        });
    });
    describe('isRestriction should return', function() {
        it('true if the entity contains the restriction type', function() {
            expect(ontologyManagerSvc.isRestriction(this.restrictionObj)).toBe(true);
        });
        it('false if the entity does not contain the restriction type', function() {
            expect(ontologyManagerSvc.isRestriction({})).toBe(false);
        });
    });
    describe('getRestrictions should return', function() {
        it('correct restriction objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getRestrictions([[this.restrictionObj, this.ontologyObj], [this.importedRestrictionObj, this.importedOntObj]])).toEqual([this.restrictionObj, this.importedRestrictionObj]);
        });
        it('correct restriction objects if there are any in only the ontology', function() {
            expect(ontologyManagerSvc.getRestrictions([[this.restrictionObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.restrictionObj]);
        });
        it('correct restriction objects if there are any in only the imported ontology', function() {
            expect(ontologyManagerSvc.getRestrictions([[this.ontologyObj], [this.importedRestrictionObj, this.importedOntObj]])).toEqual([this.importedRestrictionObj]);
        });
        it('correct restriction objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getRestrictions([[this.restrictionObj, this.ontologyObj], [this.restrictionObj, this.importedOntObj]])).toEqual([this.restrictionObj]);
        });
        it('undefined if there are no restrictions in the ontology', function() {
            expect(ontologyManagerSvc.getRestrictions([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isBlankNode should return', function() {
        it('true if the entity contains a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNode(this.blankNodeObj)).toBe(true);
        });
        it('false if the entity does not contain a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNode({})).toBe(false);
        });
    });
    describe('isBlankNodeId should return', function() {
        it('true if the id is a blank node id', function() {
            expect(ontologyManagerSvc.isBlankNodeId('_:genid')).toBe(true);
            expect(ontologyManagerSvc.isBlankNodeId('_:b')).toBe(true);
            expect(ontologyManagerSvc.isBlankNodeId('http://mobi.com/.well-known/genid/')).toBe(true);
        });
        it('false if the id is not a blank node id', function() {
            ['', [], {}, true, false, undefined, null, 0, 1].forEach((test) => {
                expect(ontologyManagerSvc.isBlankNodeId(test)).toBe(false);
            });
        });
    });
    describe('getBlankNodes should return', function() {
        it('correct blank node objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getBlankNodes([[this.blankNodeObj, this.ontologyObj]])).toEqual([this.blankNodeObj]);
        });
        it('correct blank node objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getBlankNodes([[this.blankNodeObj, this.ontologyObj], [this.blankNodeObj, this.importedOntObj]])).toEqual([this.blankNodeObj]);
        });
        it('undefined if there are no blank nodes in the ontology', function() {
            expect(ontologyManagerSvc.getBlankNodes([[this.ontologyObj]])).toEqual([]);
        });
    });
    describe('getEntity returns', function() {
        it('object when present', function() {
            expect(ontologyManagerSvc.getEntity([[this.classObj, this.ontologyObj]], this.classId)).toEqual(this.classObj);
        });
        it('undefined when not present', function() {
            expect(ontologyManagerSvc.getEntity([], this.classId)).toBe(undefined);
        });
    });
    describe('getEntityName should return', function() {
        beforeEach(function () {
            this.entity = {};
            this.presentProp = '';
            util.getPropertyValue.and.callFake((entity, property) => (property === this.presentProp) ? this.title : '');
        });
        describe('returns the rdfs:label if present', function() {
            it('and in english', function() {
                this.entity[prefixes.rdfs + 'label'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual('hello');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = prefixes.rdfs + 'label';
                expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual(this.title);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns the dcterms:title if present and no rdfs:label', function() {
            it('and in english', function() {
                this.entity[prefixes.dcterms + 'title'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual('hello');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = prefixes.dcterms + 'title';
                expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual(this.title);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns the dc:title if present and no rdfs:label or dcterms:title', function() {
            it('and in english', function() {
                this.entity[prefixes.dc + 'title'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual('hello');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms +'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = prefixes.dc + 'title';
                expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual(this.title);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms +'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns skos:prefLabel if present and no rdfs:label, dcterms:title, or dc:title', function() {
            it('and in english', function() {
                this.entity[prefixes.skos + 'prefLabel'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                ontologyManagerSvc.getEntityName(this.entity);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = prefixes.skos + 'prefLabel';
                ontologyManagerSvc.getEntityName(this.entity);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns skos:altLabel if present and no rdfs:label, dcterms:title, or dc:title, or skos:prefLabel', function() {
            it('and in english', function() {
                this.entity[prefixes.skos + 'altLabel'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                ontologyManagerSvc.getEntityName(this.entity);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = prefixes.skos + 'altLabel';
                ontologyManagerSvc.getEntityName(this.entity);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns skosxl:literalForm if present and no rdfs:label, dcterms:title, or dc:title, skos:prefLabel or skos:altLabel', function() {
            it('and in english', function() {
                this.entity[prefixes.skosxl + 'literalForm'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                ontologyManagerSvc.getEntityName(this.entity);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getPropertyValue).not.toHaveBeenCalledWith(this.entity, prefixes.skosxl + 'literalForm');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = prefixes.skosxl + 'literalForm';
                ontologyManagerSvc.getEntityName(this.entity);
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
                expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skosxl + 'literalForm');
                expect(util.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        it('returns the @id if present and nothing else', function() {
            util.getBeautifulIRI.and.returnValue(this.ontologyId);
            this.entity['@id'] = this.ontologyId;
            expect(ontologyManagerSvc.getEntityName(this.entity)).toEqual(this.ontologyId);
            expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.rdfs + 'label');
            expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dcterms + 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.dc + 'title');
            expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'prefLabel');
            expect(util.getPropertyValue).toHaveBeenCalledWith(this.entity, prefixes.skos + 'altLabel');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith(this.ontologyId);
        });
    });
    describe('getEntityDescription should return', function() {
        it('rdfs:comment if present', function() {
            util.getPropertyValue.and.returnValue(this.description);
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual(this.description);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'comment');
        });
        it('dcterms:description if present and no rdfs:comment', function() {
            util.getPropertyValue.and.returnValue('');
            util.getDctermsValue.and.returnValue(this.description);
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual(this.description);
            expect(util.getPropertyValue).toHaveBeenCalledWith(entity, prefixes.rdfs + 'comment');
            expect(util.getDctermsValue).toHaveBeenCalledWith(entity, 'description');
        });
        it('dc:description if present and no rdfs:comment or dcterms:description', function() {
            util.getPropertyValue.and.callFake((entity, property) => (property === prefixes.dc + 'description') ? this.description : '');
            util.getDctermsValue.and.returnValue('');
            var entity = {};
            expect(ontologyManagerSvc.getEntityDescription(entity)).toEqual(this.description);
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
            expect(ontologyManagerSvc.isConcept(this.conceptObj)).toEqual(true);
        });
        it('true if the entity contains a derived concept type', function() {
            expect(ontologyManagerSvc.isConcept(this.derivedConceptObj, [this.derivedConceptType])).toEqual(true);
        });
        it('false if the entity does not contain the concept type', function() {
            expect(ontologyManagerSvc.isConcept({})).toEqual(false);
        });
    });
    describe('hasConcepts should return', function() {
        it('true if there are any concept entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([[this.conceptObj, this.ontologyObj], [this.importedConceptObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any concept entities in only the ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([[this.conceptObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any concept entities in only the imported ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([[this.ontologyObj], [this.importedConceptObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any derived concept entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([[this.derivedConceptObj]], [this.derivedConceptType])).toEqual(true);
        });
        it('false if there are not any concept entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConcepts([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getConcepts should return', function() {
        it('correct concept objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getConcepts([[this.conceptObj, this.ontologyObj], [this.importedConceptObj, this.importedOntObj]])).toEqual([this.conceptObj, this.importedConceptObj]);
        });
        it('correct concept objects if there are any in only the ontology', function() {
            expect(ontologyManagerSvc.getConcepts([[this.conceptObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.conceptObj]);
        });
        it('correct concept objects if there are any in only the imported ontology', function() {
            expect(ontologyManagerSvc.getConcepts([[this.ontologyObj], [this.importedConceptObj, this.importedOntObj]])).toEqual([this.importedConceptObj]);
        });
        it('correct concept objects if there are any derived concepts', function() {
            expect(ontologyManagerSvc.getConcepts([[this.derivedConceptObj]], [this.derivedConceptType])).toEqual([this.derivedConceptObj]);
        });
        it('correct concept objects if there are duplicates', function() {
            expect(ontologyManagerSvc.getConcepts([[this.conceptObj, this.ontologyObj], [this.conceptObj, this.importedOntObj]])).toEqual([this.conceptObj]);
        });
        it('undefined if there are no concepts in the ontology', function() {
            expect(ontologyManagerSvc.getConcepts([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getConceptIRIs should return', function() {
        it('conceptId if there are concepts in the ontology', function() {
            expect(ontologyManagerSvc.getConceptIRIs([[this.ontologyObj, this.conceptObj], [this.importedOntObj, this.importedConceptObj]])).toEqual([this.conceptId, this.importedConceptId]);
        });
        it('conceptId if there are concepts in only the ontology', function() {
            expect(ontologyManagerSvc.getConceptIRIs([[this.ontologyObj, this.conceptObj], [this.importedOntObj]])).toEqual([this.conceptId]);
        });
        it('conceptId if there are concepts in only the imported ontology', function() {
            expect(ontologyManagerSvc.getConceptIRIs([[this.ontologyObj], [this.importedOntObj, this.importedConceptObj]])).toEqual([this.importedConceptId]);
        });
        it('conceptId if there are derived concepts', function() {
            expect(ontologyManagerSvc.getConceptIRIs([[this.derivedConceptObj]], [this.derivedConceptType])).toEqual([this.conceptId]);
        });
        it('[] if there are no concepts in the ontology', function() {
            expect(ontologyManagerSvc.getConceptIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isConceptScheme should return', function() {
        it('true if the entity contains the concept scheme type', function() {
            expect(ontologyManagerSvc.isConceptScheme(this.schemeObj)).toBe(true);
        });
        it('true if the entity contains a derived concept scheme type', function() {
            expect(ontologyManagerSvc.isConceptScheme(this.derivedConceptSchemeObj, [this.derivedConceptSchemeType])).toEqual(true);
        });
        it('false if the entity does not contain the concept scheme type', function() {
            expect(ontologyManagerSvc.isConceptScheme({})).toBe(false);
        });
    });
    describe('hasConceptSchemes should return', function() {
        it('true if there are any concept scheme entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any concept scheme entities in only the ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any concept scheme entities in only the imported ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([[this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any derived concept scheme entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([[this.derivedConceptSchemeObj]], [this.derivedConceptSchemeType])).toEqual(true);
        });
        it('false if there are not any concept scheme entities in the ontology', function() {
            expect(ontologyManagerSvc.hasConceptSchemes([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getConceptSchemes should return', function() {
        it('correct concept scheme objects if there are any in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]])).toEqual([this.schemeObj, this.importedSchemeObj]);
        });
        it('correct concept scheme objects if there are any in only the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.schemeObj]);
        });
        it('correct concept scheme objects if there are any in only the imported ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemes([[this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]])).toEqual([this.importedSchemeObj]);
        });
        it('correct concept scheme objects if there are any derived concept schemes', function() {
            expect(ontologyManagerSvc.getConceptSchemes([[this.derivedConceptSchemeObj]], [this.derivedConceptSchemeType])).toEqual([this.derivedConceptSchemeObj]);
        });
        it('correct concept schemes if there are duplicates', function() {
            expect(ontologyManagerSvc.getConceptSchemes([[this.schemeObj, this.ontologyObj], [this.schemeObj, this.importedOntObj]])).toEqual([this.schemeObj]);
        });
        it('undefined if there are no concept schemes in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemes([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getConceptSchemeIRIs should return', function() {
        it('schemeId if there are concept schemes in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj, this.importedSchemeObj]])).toEqual([this.schemeId, this.importedSchemeId]);
        });
        it('schemeId if there are concept schemes in only the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj]])).toEqual([this.schemeId]);
        });
        it('schemeId if there are concept schemes in only the imported ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([[this.ontologyObj], [this.importedOntObj, this.importedSchemeObj]])).toEqual([this.importedSchemeId]);
        });
        it('schemeId if there are derived concepts', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([[this.derivedConceptSchemeObj]], [this.derivedConceptSchemeType])).toEqual([this.schemeId]);
        });
        it('schemeId if there are duplicates', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj, this.schemeObj]])).toEqual([this.schemeId]);
        });
        it('[] if there are no concept schemes in the ontology', function() {
            expect(ontologyManagerSvc.getConceptSchemeIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('uploadChangesFile hits the proper endpoint', function() {
        beforeEach(function() {
            this.params = paramSerializer({ branchId: this.branchId, commitId: this.commitId });
        });
        it('with recordId, branchId and commitId', function() {
            $httpBackend.expectPUT('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + this.params,
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, { additions: [], deletions: [] });
            ontologyManagerSvc.uploadChangesFile(this.file, this.recordId, this.branchId, this.commitId)
                .then(noop, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('with no branchId', function() {
            this.params = paramSerializer({ branchId: undefined, commitId: this.commitId });
            $httpBackend.expectPUT('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + this.params,
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, { additions: [], deletions: [] });
            ontologyManagerSvc.uploadChangesFile(this.file, this.recordId, undefined, this.commitId)
                .then(noop, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '?' + this.params,
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(400, this.errorObject, null, this.error);
            ontologyManagerSvc.uploadChangesFile(this.file, this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.errorObject);
                });
            flushAndVerify($httpBackend);
            expect(util.rejectErrorObject).toHaveBeenCalledWith(jasmine.objectContaining({data: this.errorObject}));
        });
    });
});
