/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { get, noop } from 'lodash';
import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { throwError } from 'rxjs';

import { OWL, ONTOLOGYEDITOR, SKOS, RDFS, DCTERMS, DC, SKOSXL } from '../../prefixes';
import { cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { VocabularyStuff } from '../models/vocabularyStuff.interface';
import { PropertyToRanges } from '../models/propertyToRanges.interface';
import { OntologyStuff } from '../models/ontologyStuff.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { CatalogManagerService } from './catalogManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { UtilService } from './util.service';
import { GroupQueryResults } from '../models/groupQueryResults.interface';

describe('Ontology Manager service', function() {
    let service: OntologyManagerService;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    let vocabularyStuffObj: VocabularyStuff;
    let ontologyStuffObj: OntologyStuff;
    let propertyToRangesObj: PropertyToRanges;

    const emptyObj: JSONLDObject = {'@id': 'test'};

    let recordId: string;
    let ontologyId: string;
    let branchId: string;
    let commitId: string;
    let catalogId: string;
    let format: string;
    let file: any;
    let title: string;
    let description: string;
    let keywords: string[];
    let error: string;
    let errorObject: any = {'errorMessage': 'error', 'errorDetails': []};

    let records: any;
    let anonymous: string;
    let classId: string;
    let objectPropertyId: string;
    let dataPropertyId: string;
    let annotationId: string;
    let individualId: string;
    let restrictionId: string;
    let blankNodeId: string;
    let blankNodeObj;
    let usages;
    let conceptId: string;
    let schemeId: string;
    let derivedConceptType: any;
    let derivedConceptSchemeType: any;
    let derivedSemanticRelation: any;
    let importedClassId: string;
    let importedDataPropertyId: string;
    let importedObjectPropertyId: string;
    let importedAnnotationId: string;
    let importedIndividualId: string;
    let importedRestrictionId: string;
    let importedConceptId: string;
    let importedSchemeId: string;
    let importedOntologyId: string

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                OntologyManagerService,
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(UtilService)
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(OntologyManagerService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get(UtilService);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        httpMock = TestBed.get(HttpTestingController);

        recordId = 'recordId';
        ontologyId = 'ontologyId';
        branchId = 'branchId';
        commitId = 'commitId';
        catalogId = 'catalogId';
        format = 'jsonld';
        file = {name: 'title'};
        title = 'title';
        description = 'description';
        keywords = ['keyword1', 'keyword2'];
        error = 'error';
        errorObject = {'errorMessage': 'error', 'errorDetails': []};

        records = {
            data: [{
                'dcterms:identifier': 'id1'
            }, {
                'dcterms:identifier': 'id2'
            }]
        };
        anonymous = 'anonymous';
        classId = 'classId';
        objectPropertyId = 'objectPropertyId';
        dataPropertyId = 'dataPropertyId';
        annotationId = 'annotationId';
        individualId = 'individualId';
        restrictionId = 'restrictionId';
        blankNodeId = '_:genid0';
        blankNodeObj = {
            '@id': blankNodeId
        };
        usages = {
            results: {
                bindings: []
            }
        };
        conceptId = 'conceptId';
        schemeId = 'schemeId';
        derivedConceptType = ['derivedConcept'];
        derivedConceptSchemeType = ['derivedConceptScheme'];
        derivedSemanticRelation = ['derivedSemanticRelation'];
        importedClassId = 'importedClassId';
        importedDataPropertyId = 'importedDataPropertyId';
        importedObjectPropertyId = 'importedObjectPropertyId';
        importedAnnotationId = 'importedAnnotationId';
        importedIndividualId = 'importedIndividualId';
        importedRestrictionId = 'importedRestrictionId';
        importedConceptId = 'importedConceptId';
        importedSchemeId = 'importedSchemeId';
        importedOntologyId = 'importedOntologyId';
        catalogManagerStub.localCatalog = {'@id': catalogId};
        service.initialize();
        this.ontologyObj = {
            '@id': ontologyId,
            '@type': [OWL + 'Ontology', ONTOLOGYEDITOR + 'OntologyRecord']
        };
        this.classObj = {
            '@id': classId,
            '@type': [OWL + 'Class']
        };
        this.objectPropertyObj = {
            '@id': objectPropertyId,
            '@type': [OWL + 'ObjectProperty']
        };
        this.objectPropertyObj[RDFS + 'domain'] = [{'@id': classId}];
        this.dataPropertyObj = {
            '@id': dataPropertyId,
            '@type': [OWL + 'DatatypeProperty']
        };
        this.annotationObj = {
            '@id': annotationId,
            '@type': [OWL + 'AnnotationProperty']
        };
        this.individualObj = {
            '@id': individualId,
            '@type': [OWL + 'NamedIndividual', classId]
        };
        this.restrictionObj = {
            '@id': restrictionId,
            '@type': [OWL + 'Restriction']
        };
        this.conceptObj = {
            '@id': conceptId,
            '@type': [SKOS + 'Concept']
        };
        this.derivedConceptObj = {
            '@id': conceptId,
            '@type': [derivedConceptType]
        };
        this.schemeObj = {
            '@id': schemeId,
            '@type': [SKOS + 'ConceptScheme']
        };
        this.derivedConceptSchemeObj = {
            '@id': schemeId,
            '@type': [derivedConceptSchemeType]
        };
        this.ontology = [this.ontologyObj, this.classObj, this.dataPropertyObj];
        this.importedOntObj = {
            '@id': importedOntologyId,
            '@type': [OWL + 'Ontology']
        };
        this.importedClassObj = {
            '@id': importedClassId,
            '@type': [OWL + 'Class']
        };
        this.importedDataPropertyObj = {
            '@id': importedDataPropertyId,
            '@type': [OWL + 'DatatypeProperty']
        };
        this.importedObjectPropertyObj = {
            '@id': importedDataPropertyId,
            '@type': [OWL + 'ObjectProperty']
        };
        this.importedObjectPropertyObj[RDFS + 'domain'] = [{'@id': importedClassId}];
        this.importedAnnotationObj = {
            '@id': importedAnnotationId,
            '@type': [OWL + 'AnnotationProperty']
        };
        this.importedIndividualObj = {
            '@id': importedIndividualId,
            '@type': [OWL + 'NamedIndividual', importedClassId]
        };
        this.importedRestrictionObj = {
            '@id': importedRestrictionId,
            '@type': [OWL + 'Restriction']
        };
        this.importedConceptObj = {
            '@id': importedConceptId,
            '@type': [SKOS + 'Concept']
        };
        this.importedSchemeObj = {
            '@id': importedSchemeId,
            '@type': [SKOS + 'ConceptScheme']
        };

        propertyToRangesObj = {
            'propertyToRanges': {
                'urn:hasTopping': ['urn:PizzaTopping']
            }
        };

        this.emptyIriList = {
            annotationProperties: [],
            classes: [],
            datatypes: [],
            objectProperties: [],
            dataProperties: [],
            namedIndividuals: [],
            concepts: [],
            conceptSchemes: [],
            derivedConcepts: [],
            derivedConceptSchemes: [],
            derivedSemanticRelations: [],
            deprecatedIris: []
        };

        this.emptyHierarchyResponse = {
            parentMap: {},
            childMap: {},
            circularMap: {}
        };

        ontologyStuffObj = {
            ontologyIRI: ontologyId,
            propertyToRanges: propertyToRangesObj.propertyToRanges,
            iriList: this.emptyIriList,
            importedOntologies: [{ontologyId: this.ontologyId2, id: 'id'}],
            classHierarchy: this.emptyHierarchyResponse,
            individuals: {},
            dataPropertyHierarchy: this.emptyHierarchyResponse,
            objectPropertyHierarchy: this.emptyHierarchyResponse,
            annotationHierarchy: this.emptyHierarchyResponse,
            conceptHierarchy: this.emptyHierarchyResponse,
            conceptSchemeHierarchy: this.emptyHierarchyResponse,
            failedImports: ['failedId'],
            classesWithIndividuals: {},
            classToAssociatedProperties: {},
            entityNames: {},
            noDomainProperties: [],
            ...vocabularyStuffObj
        };

        vocabularyStuffObj = {
            derivedConcepts: [],
            derivedConceptSchemes: [],
            derivedSemanticRelations: [],
            importedIRIs: this.emptyIriList,
            concepts: [],
            conceptSchemes: [],
            conceptHierarchy: this.emptyHierarchyResponse,
            conceptSchemeHierarchy: this.emptyHierarchyResponse
        };

        progressSpinnerStub.track.and.callFake(ob => ob);
        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
        utilStub.getErrorDataObject.and.callFake(error => {
            const statusText = get(error, 'statusText');
            return {
                'errorMessage': get(statusText, 'errorMessage') || '',
                'errorDetails': get(statusText, 'errorDetails') || []
            };
        });
        utilStub.createHttpParams.and.callFake(params => {
            let httpParams: HttpParams = new HttpParams();
            Object.keys(params).forEach(param => {
                if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
                    if (Array.isArray(params[param])) {
                        params[param].forEach(el => {
                            httpParams = httpParams.append(param, '' + el);
                        });
                    } else {
                        httpParams = httpParams.append(param, '' + params[param]);
                    }
                }
            });
        
            return httpParams;
        });
        utilStub.handleErrorObject.and.returnValue(throwError(errorObject));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        utilStub = null;
        httpMock = null;
        catalogManagerStub = null;
        progressSpinnerStub = null;
    });

    describe('uploadOntology hits the proper endpoint', function() {
        describe('with a file', function() {
            beforeEach(function() {
                this.recordConfig = {
                    file: file, 
                    title: title, 
                    description: description, 
                    keywords: keywords
                };
            });
            it('with description and keywords', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    }, () => fail('Observable should have succeeded'));
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
            });
            it('with no description or keywords', function() {
                service.uploadOntology({file: file, title: title})
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    }, () => fail('Observable should have succeeded'));
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(null);
                expect((request.request.body).getAll('keywords')).toEqual([]);
                request.flush({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
            });
            it('unless an error occurs', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(errorObject);
                    });
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush('flush', { status: 400, statusText: error });
            });
        });
        describe('with JSON-LD', function() {
            beforeEach(function() {
                this.recordConfig = {
                    jsonld: this.ontologyObj, 
                    title: title, 
                    description: description, 
                    keywords: keywords
                };
            });
            it('with description and keywords', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    }, () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
            });
            it('with no description or keywords', function() {
                service.uploadOntology({jsonld: this.ontologyObj, title: title})
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
                    }, () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(null);
                expect((request.request.body).getAll('keywords')).toEqual([]);
                request.flush({ontologyId: ontologyId, recordId: recordId, branchId: branchId, commitId: commitId});
            });
            it('unless an error occurs', function() {
                service.uploadOntology({jsonld: this.ontologyObj, title: title})
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(errorObject);
                    });

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                request.flush('flush', { status: 400, statusText: error });
            });
        });
    });
    describe('uploadOntology file not supported', function() {
         it('trig with title, description and keywords', function() {
            service.uploadOntology({file: file, title: 'title.trig', description: description, keywords: keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
        it('trig.zip with title, description and keywords', function() {
            service.uploadOntology({file: file, title: 'title.trig.zip', description: description, keywords: keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
        it('trig.gzip with title, description and keywords', function() {
            service.uploadOntology({file: file, title: 'title.trig.gzip', description: description, keywords: keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
    });
    describe('deleteOntology hits the proper endpoint', function() {
        it('successfully', function() {
            service.deleteOntology(recordId)
                .subscribe(() => {}, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne({url: '/mobirest/ontologies/' + encodeURIComponent(recordId), method: 'DELETE'});
            request.flush(200);
        });
        it('unless an error occurs', function() {
            service.deleteOntology(recordId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne({url: '/mobirest/ontologies/' + encodeURIComponent(recordId), method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('downloadOntology should call the window.open method properly', function() {
        beforeEach(function () {
            this.url = '/mobirest/ontologies/' + encodeURIComponent(recordId);
            spyOn(window, 'open');
        });
        it('with a format and no fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: branchId,
                    commitId: commitId,
                    rdfFormat: 'turtle',
                    fileName: 'ontology'
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('without a format or a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: branchId,
                    commitId: commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'ontology'
                }
            });
            service.downloadOntology(recordId, branchId, commitId);
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('with a format and fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: branchId,
                    commitId: commitId,
                    rdfFormat: 'turtle',
                    fileName: 'fileName'
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle', 'fileName');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('without a format and with a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: branchId,
                    commitId: commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'fileName'
                }
            });
            service.downloadOntology(recordId, branchId, commitId, undefined, 'fileName');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
    });
    describe('getOntology hits the proper endpoint', function() {
        it('unless an error occurs', function() {
            service.getOntology(recordId, branchId, commitId, format, false, false, true)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === '/mobirest/ontologies/' + encodeURIComponent(recordId) && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getOntology(recordId, branchId, commitId, format, false, false, true)
                .subscribe(data => {
                    expect(data).toEqual(this.ontology);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === '/mobirest/ontologies/' + encodeURIComponent(recordId) && req.method === 'GET');
            expect((request.request.params).get('branchId').toString()).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual(format);
            expect((request.request.params).get('clearCache').toString()).toEqual('false');
            expect((request.request.params).get('skolemize').toString()).toEqual('true');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/json');
            request.flush(this.ontology, {
                headers: new HttpHeaders({'Content-Type': 'application/json'})
            });
        });
    });
    describe('deleteOntologyBranch hits the proper endpoint', function() {
        it('successfully', function() {
            service.deleteOntologyBranch(recordId, branchId)
                .subscribe(noop, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId)) && req.method === 'DELETE');
            request.flush(200);
        });
        it('unless an error occurs', function() {
            service.deleteOntologyBranch(recordId, branchId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId)) && req.method === 'DELETE');
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getVocabularyStuff retrieves information about skos:Concepts and skos:ConceptSchemes in an ontology', function() {
        describe('with no id set', function() {
            it('unless an error occurs', function() {
                service.getVocabularyStuff(recordId, branchId, commitId)
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(error);
                    });

                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(recordId) + '/vocabulary-stuff') && req.method === 'GET');

                expect((request.request.params).get('branchId').toString()).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                request.flush('flush', { status: 400, statusText: error });    
            });
            it('successfully', function() {
                service.getVocabularyStuff(recordId, branchId, commitId)
                    .subscribe((response: VocabularyStuff) => {
                        expect(response).toEqual(vocabularyStuffObj);
                    }, () => {
                        fail('Observable should have succeeded');
                    });

                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(recordId) + '/vocabulary-stuff') && req.method === 'GET');

                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                request.flush(vocabularyStuffObj);
            });
        });
    });
    describe('getOntologyStuff retrieves information about ontology', function() {
        describe('with no id set', function() {
            it('unless an error occurs', function() {
                service.getOntologyStuff(recordId, branchId, commitId, false)
                    .subscribe(() => {
                        fail('Observable should have errored');
                    }, response => {
                        expect(response).toBe(error);
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/ontology-stuff') && req.method === 'GET');
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                request.flush('flush', { status: 400, statusText: error });
            });
            it('successfully clearing the cache', function() {
                service.getOntologyStuff(recordId, branchId, commitId, true)
                    .subscribe(response => {
                        expect(response).toEqual(ontologyStuffObj);
                    }, () => {
                        fail('Observable should have succeeded');
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/ontology-stuff') && req.method === 'GET');
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('clearCache').toString()).toEqual('true');
                request.flush(ontologyStuffObj);
            });
            it('successfully', function() {
                service.getOntologyStuff(recordId, branchId, commitId, false)
                    .subscribe(response => {
                    expect(response).toEqual(ontologyStuffObj);
                    }, () => {
                        fail('Observable should have succeeded');
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/ontology-stuff') && req.method === 'GET');
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                request.flush(ontologyStuffObj);
            });
        });
    });
    describe('getPropertyToRange retrieves all propertyRanges in an ontology', function() {
        it('unless an error occurs', function() {
            service.getPropertyToRange(recordId, branchId, commitId, false)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/property-ranges') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getPropertyToRange(recordId, branchId, commitId, false)
                .subscribe((response: PropertyToRanges) => {
                    expect(response).toEqual(propertyToRangesObj);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/property-ranges') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush(propertyToRangesObj);
        });
    });
    describe('getIris retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getIris(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/iris') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getIris(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyIriList);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/iris') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(this.emptyIriList);
        });
    });
    describe('getOntologyClasses retrieves all classes in an ontology', function() {
        it('unless an error occurs', function() {
            service.getOntologyClasses(recordId, branchId, commitId, false)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/classes') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getOntologyClasses(recordId, branchId, commitId, false)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/classes') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush([emptyObj]);
        });
    });
    describe('getDataProperties retrieves all data properties in an ontology', function() {
        it('unless an error occurs', function() {
            service.getDataProperties(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/data-properties') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getDataProperties(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/data-properties') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush([emptyObj]);
        });
    });
    describe('getObjProperties retrieves all data properties in an ontology', function() {
        it('unless an error occurs', function() {
            service.getObjProperties(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/object-properties') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getObjProperties(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/object-properties') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush([emptyObj]);
        });
    });
    describe('getImportedIris retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getImportedIris(recordId, branchId, commitId, this.applyInProgressCommit)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-iris') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('unless there are none', function() {
            service.getImportedIris(recordId, branchId, commitId, this.applyInProgressCommit)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-iris') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([], { status: 204, statusText: 'No Data' });
        });
        it('successfully', function() {
            service.getImportedIris(recordId, branchId, commitId, this.applyInProgressCommit )
                .subscribe(response => {
                    expect(response).toEqual([this.emptyIriList]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-iris') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([this.emptyIriList]);
        });
    });
    describe('getClassHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getClassHierarchies(recordId, branchId, commitId, this.applyInProgressCommit)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/class-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getClassHierarchies(recordId, branchId, commitId, this.applyInProgressCommit)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/class-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getClassesWithIndividuals retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getClassesWithIndividuals(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/classes-with-individuals') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getClassesWithIndividuals(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/classes-with-individuals') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyObj);
        });
    });
    describe('getDataPropertyHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getDataPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/data-property-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getDataPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/data-property-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getObjectPropertyHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getObjectPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/object-property-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getObjectPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/object-property-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getAnnotationPropertyHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getAnnotationPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/annotation-property-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getAnnotationPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/annotation-property-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getConceptHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getConceptHierarchies(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/concept-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getConceptHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/concept-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getConceptSchemeHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getConceptSchemeHierarchies(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/concept-scheme-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getConceptSchemeHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/concept-scheme-hierarchies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getImportedOntologies should call the proper functions', function() {
        it('when get succeeds', function() {
            service.getImportedOntologies(recordId, branchId, commitId, 'jsonld', true)
                .subscribe(response => {
                    expect(response).toEqual([this.ontology]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-ontologies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([this.ontology]);
        });
        it('when get is empty', function() {
            service.getImportedOntologies(recordId, branchId, commitId, 'jsonld', true)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-ontologies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('', { status: 204, statusText: 'No Content' });
        });
        it('when another success response', function() {
            service.getImportedOntologies(recordId, branchId, commitId, 'jsonld', true)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(new Error(error));
                });
            
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-ontologies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 201, statusText: error });
        });
        it('when get fails', function() {
            service.getImportedOntologies(recordId, branchId, commitId, 'jsonld', true)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
                
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-ontologies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');

            request.flush('flush', { status: 400, statusText: error });
        });
        it('when apply-in-progress is not passed in', function () {
            service.getImportedOntologies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual([this.ontology]);
                }, () => {
                    fail('Observable should have succeeded');
                });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/imported-ontologies') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush([this.ontology]);
        });
    });
    describe('getEntityUsages should call the proper functions', function() {
        describe('when get succeeds', function() {
            describe('with no id set', function() {
                it('and queryType is select', function() {
                    service.getEntityUsages(recordId, branchId, commitId, classId, 'select')
                        .subscribe(response => {
                            expect(response).toEqual(usages.results.bindings);
                        }, () => {
                            fail('Observable should have succeeded');
                        });
                    const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entity-usages/classId') && req.method === 'GET');
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect((request.request.params).get('commitId')).toEqual(commitId);
                    expect((request.request.params).get('queryType')).toEqual('select');
                    request.flush(usages);
                });
                it('and queryType is construct', function() {
                    service.getEntityUsages(recordId, branchId, commitId, classId, 'construct')
                        .subscribe(response => {
                            expect(response).toEqual(usages);
                        }, () => {
                            fail('Observable should have succeeded');
                        });
                    const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entity-usages/classId') && req.method === 'GET');
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect((request.request.params).get('commitId')).toEqual(commitId);
                    expect((request.request.params).get('queryType')).toEqual('construct');
                    request.flush(usages);
                });
            });
        });
        describe('when get fails', function() {
            it('when id is not set', function() {
                service.getEntityUsages(recordId, branchId, commitId, classId)
                    .subscribe(() => {
                        fail('Observable should have errored');
                    }, response => {
                        expect(response).toBe(error);
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entity-usages/classId') && req.method === 'GET');
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('queryType')).toEqual('select');
                
                request.flush('flush', { status: 400, statusText: error });
            });
        });
    });
    describe('getOntologyEntityNames calls the correct functions when POST /mobirest/ontologies/{recordId}/entity-names', function() {
        it('successfully', function() {
            service.getOntologyEntityNames(recordId, branchId, commitId, false, false)
                .subscribe(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Observable should have succeeded');
                });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entity-names') && req.method === 'POST');

            expect(request.request.body).toEqual({'filterResources': []});
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('includeImports').toString()).toEqual('false');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.headers).get('Content-Type')).toEqual('application/json');

            request.flush({});
        });
        it('unless an error occurs', function() {
            service.getOntologyEntityNames(recordId, branchId, commitId, false, false)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
                
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entity-names') && req.method === 'POST');

            expect(request.request.body).toEqual({'filterResources': []});
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('includeImports').toString()).toEqual('false');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.headers).get('Content-Type')).toEqual('application/json');
    
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getSearchResults should call the correct functions', function() {
        beforeEach(function () {
            this.searchText = 'searchText';
        });
        it('when get succeeds', function() {
            service.getSearchResults(recordId, branchId, commitId, 'searchText')
                .subscribe(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/search-results') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');

            request.flush({});
        });
        it('when get is empty', function() {
            service.getSearchResults(recordId, branchId, commitId, 'searchText')
            .subscribe(response => {
                expect(response).toEqual({});
            }, () => {
                fail('Observable should have succeeded');
            });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/search-results') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');

            request.flush('', { status: 204, statusText: 'No Data' });
        });
        it('when get succeeds with different code', function() {
            service.getSearchResults(recordId, branchId, commitId, 'searchText')
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(new Error('An error has occurred with your search.'));
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/search-results') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');

            request.flush('flush', { status: 201, statusText: error });
        });
        it('when get fails', function() {
            service.getSearchResults(recordId, branchId, commitId, 'searchText')
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/search-results') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');
    
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getQueryResults calls the correct functions when GET /mobirest/ontologies/{recordId}/query', function() {
        beforeEach(function() {
            this.query = 'select * where {?s ?p ?o}';
        });
        it('succeeds', function() {
            service.getQueryResults(recordId, branchId, commitId, this.query, format)
                .subscribe(response => expect(response).toEqual([{'@id': 'id'}]),
                    () => fail('Observable should have succeeded'));

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/query') && req.method === 'GET');
            expect((request.request.params).get('query')).toEqual(this.query);
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
            request.flush([{'@id': 'id'}], {
                headers: new HttpHeaders({'Content-Type': 'application/json'})
            });
        });
        it('fails', function() {
            service.getQueryResults(recordId, branchId, commitId, this.query, format)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/query') && req.method === 'GET');
            expect((request.request.params).get('query')).toEqual(this.query);
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
    
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getFailedImports calls the correct functions when GET /mobirest/ontologies/{recordId}/failed-imports', function() {
        it('succeeds', function() {
            service.getFailedImports(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(['failedId']);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/failed-imports') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(['failedId']);
        });
        it('fails', function() {
            service.getFailedImports(recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/failed-imports') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getEntityAndBlankNodes retrieves entity and blank node RDF', function() {
        it('successfully with defaults', function() {
            service.getEntityAndBlankNodes(recordId, branchId, commitId, classId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entities/' + classId) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('format')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');

            request.flush([emptyObj]);
        });
        it('successfully with specified params', function() {                
            service.getEntityAndBlankNodes(recordId, branchId, commitId, classId, 'turtle', false, false)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entities/' + classId) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('format')).toEqual('turtle');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('false');

            request.flush([emptyObj]);
        });
        it('unless an error occurs', function() {
            service.getEntityAndBlankNodes(recordId, branchId, commitId, classId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/entities/' + classId) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('format')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('isOntology should return', function() {
        it('true if the entity contains the ontology type', function() {
            expect(service.isOntology(this.ontologyObj)).toBe(true);
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(service.isOntology(emptyObj)).toBe(false);
        });
    });
    describe('isOntologyRecord should return', function() {
        it('true if the entity contains the ontology type', function() {
            expect(service.isOntologyRecord(this.ontologyObj)).toBe(true);
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(service.isOntologyRecord(emptyObj)).toBe(false);
        });
    });
    describe('hasOntologyEntity should return', function() {
        it('true if there is an ontology entity in the ontology', function() {
            expect(service.hasOntologyEntity([this.ontologyObj])).toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(service.hasOntologyEntity([])).toBe(false);
        });
    });
    describe('getOntologyEntity should return', function() {
        it('correct object if there is an ontology entity in the ontology', function() {
            expect(service.getOntologyEntity([this.ontologyObj])).toBe(this.ontologyObj);
        });
        it('undefined if there is not an ontology entity in the ontology', function() {
            expect(service.getOntologyEntity([])).toBe(undefined);
        });
    });
    describe('getOntologyIRI should return', function() {
        it('@id if there is an ontology entity in the ontology with @id', function() {
            expect(service.getOntologyIRI([this.ontologyObj])).toBe(ontologyId);
        });
        it('"" if none are present or no ontology entity', function() {
            expect(service.getOntologyIRI([])).toBe('');
        });
    });
    describe('isDatatype should return', function() {
        it('true if the entity contains the datatype type', function() {
            expect(service.isDatatype({'@id': 'urn:testid', '@type': [RDFS + 'Datatype']})).toBe(true);
        });
        it('false if the entity does not contain the datatype type', function() {
            expect(service.isDatatype(emptyObj)).toBe(false);
        });
    });
    describe('isClass should return', function() {
        it('true if the entity contains the class type', function() {
            expect(service.isClass(this.classObj)).toBe(true);
        });
        it('false if the entity does not contain the class type', function() {
            expect(service.isClass(emptyObj)).toBe(false);
        });
    });
    describe('hasClasses should return', function() {
        it('true if there are any class entities in the ontology', function() {
            expect(service.hasClasses([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are class entities only in the ontology', function() {
            expect(service.hasClasses([[this.classObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are class entities only in the imported ontology', function() {
            expect(service.hasClasses([[this.ontologyObj], [this.importedClassObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any class entities in the ontology', function() {
            expect(service.hasClasses([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getClasses should return', function() {
        it('correct class objects if there are any in the ontology', function() {
            expect(service.getClasses([[this.classObj, this.ontologyObj],[this.importedClassObj, this.importedOntObj]])).toEqual([this.classObj, this.importedClassObj]);
        });
        it('correct class objects if there are any only in the ontology', function() {
            expect(service.getClasses([[this.classObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.classObj]);
        });
        it('correct class objects if there are any only in the imported ontology', function() {
            expect(service.getClasses([[this.ontologyObj], [this.importedClassObj, this.importedOntObj]])).toEqual([this.importedClassObj]);
        });
        it('correct class objects if there are duplicates', function() {
            expect(service.getClasses([[this.classObj, this.ontologyObj],[this.classObj, this.importedOntObj]])).toEqual([this.classObj]);
        });
        it('undefined if there are no classes in the ontology', function() {
            expect(service.getClasses([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('retrieveClasses should return', function() {
        it('valid', function() {
            service.retrieveClasses(recordId, branchId, commitId, '0')
                .subscribe((groupQueryResults: GroupQueryResults) => {
                    expect(groupQueryResults).toEqual({});
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId + '/group-query') && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect(request.request.params.get('commitId')).toEqual(commitId);
            expect(request.request.params.get('limit')).toEqual('0');
            request.flush({});
        });
    });
    describe('getClassIRIs should return', function() {
        it('classId if there are classes in the ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj, this.importedClassObj]])).toEqual([classId, importedClassId]);
        });
        it('classId if there are classes only in the ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj]])).toEqual([classId]);
        });
        it('classId if there are classes only in the imported ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj],[this.importedOntObj, this.importedClassObj]])).toEqual([importedClassId]);
        });
        it('classId if there are duplicates', function() {
            expect(service.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj, this.classObj]])).toEqual([classId]);
        });
        it('[] if there are no classes in the ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasClassProperties should return', function() {
        it('true if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.hasClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], classId)).toBe(true);
        });
        it('true if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.hasClassProperties([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], importedClassId)).toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(service.hasClassProperties([[this.classObj, this.ontologyObj],[this.importedClassObj, this.importedOntObj]], classId)).toBe(false);
        });
    });
    describe('getClassProperties should return', function() {
        it('correct objects if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], classId)).toEqual([this.objectPropertyObj]);
        });
        it('correct objects if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], importedClassId)).toEqual([this.importedObjectPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.classObj, this.importedOntObj, this.objectPropertyObj]], classId)).toEqual([this.objectPropertyObj]);
        });
        it('[] if there are no entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], classId)).toEqual([]);
        });
    });
    describe('getClassPropertyIRIs should return', function() {
        it('correct IRIs if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], classId)).toEqual([objectPropertyId]);
        });
        it('correct IRIs if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], importedClassId)).toEqual([importedDataPropertyId]);
        });
        it('correct IRIs if there are duplicates', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.classObj, this.importedOntObj, this.objectPropertyObj]], classId)).toEqual([objectPropertyId]);
        });
        it('[] if there are not any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], classId)).toEqual([]);
        });
    });
    describe('isObjectProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(service.isObjectProperty(this.objectPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the object property type', function() {
            expect(service.isObjectProperty(emptyObj)).toBe(false);
        });
    });
    describe('isDataTypeProperty should return', function() {
        it('true if the entity contains the data property type', function() {
            expect(service.isDataTypeProperty(this.dataPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the data property type', function() {
            expect(service.isDataTypeProperty(emptyObj)).toBe(false);
        });
    });
    describe('isProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(service.isProperty(this.objectPropertyObj)).toBe(true);
        });
        it('true if the entity contains the data property type', function() {
            expect(service.isProperty(this.dataPropertyObj)).toBe(true);
        });
        it('false if the entity does not contain the object or data property type', function() {
            expect(service.isProperty(emptyObj)).toBe(false);
        });
    });
    describe('hasNoDomainProperties should return', function() {
        it('true if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.hasNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toBe(true);
        });
        it('true if only the ontology contains a property without the rdfs:domain set', function() {
            expect(service.hasNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toBe(true);
        });
        it('true if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.hasNoDomainProperties([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toBe(true);
        });
        it('false if the ontology does not contain any properties', function() {
            expect(service.hasNoDomainProperties([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
        it('false if the ontology does not contain any properties without rdfs:domains', function() {
            expect(service.hasNoDomainProperties([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toBe(false);
        });
    });
    describe('getNoDomainProperties should return', function() {
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.dataPropertyObj, this.importedDataPropertyObj]);
        });
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainProperties([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('correct object if the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainProperties([[this.ontologyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.importedDataPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(service.getNoDomainProperties([[this.dataPropertyObj, this.ontologyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(service.getNoDomainProperties([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(service.getNoDomainProperties([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([]);
        });
    });
    describe('getNoDomainPropertyIRIs should return', function() {
        it('correct IRI if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([dataPropertyId, importedDataPropertyId]);
        });
        it('correct IRI if only the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([dataPropertyId]);
        });
        it('correct IRI if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([importedDataPropertyId]);
        });
        it('correct IRI if there are duplicates', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([dataPropertyId]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([]);
        });
    });
    describe('hasObjectProperties should return', function() {
        it('true if there are any object property entities in the ontology', function() {
            expect(service.hasObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any object property entities only in the ontology', function() {
            expect(service.hasObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any object property entities only in the imported ontology', function() {
            expect(service.hasObjectProperties([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any object property entities in the ontology', function() {
            expect(service.hasObjectProperties([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getObjectProperties should return', function() {
        it('correct object property objects if there are any in the ontology', function() {
            expect(service.getObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyObj, this.importedObjectPropertyObj]);
        });
        it('correct object property objects if there are any only in the ontology', function() {
            expect(service.getObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.objectPropertyObj]);
        });
        it('correct object property objects if there are any only in the imported ontology', function() {
            expect(service.getObjectProperties([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.importedObjectPropertyObj]);
        });
        it('correct object property objects if there are duplicates', function() {
            expect(service.getObjectProperties([[this.objectPropertyObj, this.ontologyObj], [this.objectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyObj]);
        });
        it('undefined if there are no object properties in the ontology', function() {
            expect(service.getObjectProperties([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getObjectPropertyIRIs should return', function() {
        it('objectPropertyId if there are object properties in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([objectPropertyId, importedDataPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj]])).toEqual([objectPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the imported ontology', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([importedDataPropertyId]);
        });
        it('objectPropertyId if there are duplicates', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.objectPropertyObj, this.importedOntObj]])).toEqual([objectPropertyId]);
        });
        it('[] if there are no object properties in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasDataTypeProperties should return', function() {
        it('true if there are any data property entities in the ontology', function() {
            expect(service.hasDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any data property entities only in the ontology', function() {
            expect(service.hasDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any data property entities only in the imported ontology', function() {
            expect(service.hasDataTypeProperties([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any data property entities in the ontology', function() {
            expect(service.hasDataTypeProperties([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getDataTypeProperties should return', function() {
        it('correct data property objects if there are any in the ontology', function() {
            expect(service.getDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyObj, this.importedDataPropertyObj]);
        });
        it('correct data property objects if there are any only in the ontology', function() {
            expect(service.getDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('correct data property objects if there are any only in the imported ontology', function() {
            expect(service.getDataTypeProperties([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.importedDataPropertyObj]);
        });
        it('correct data property objects if there are duplicates', function() {
            expect(service.getDataTypeProperties([[this.dataPropertyObj, this.ontologyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyObj]);
        });
        it('undefined if there are no data properties in the ontology', function() {
            expect(service.getDataTypeProperties([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getDataTypePropertyIRIs should return', function() {
        it('dataPropertyId if there are data properties in the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([dataPropertyId, importedDataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj]])).toEqual([dataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the imported ontology', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([importedDataPropertyId]);
        });
        it('dataPropertyId if there are duplicates', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([dataPropertyId]);
        });
        it('[] if there are no data properties in the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isAnnotation should return', function() {
        it('true if the entity contains the annotation property type', function() {
            expect(service.isAnnotation(this.annotationObj)).toBe(true);
        });
        it('false if the entity does not contain the annotation property type', function() {
            expect(service.isAnnotation(emptyObj)).toBe(false);
        });
    });
    describe('hasAnnotations should return', function() {
        it('true if there are any annotation entities in the ontology', function() {
            expect(service.hasAnnotations([[this.annotationObj, this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any annotation entities in only the ontology', function() {
            expect(service.hasAnnotations([[this.annotationObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any annotation entities in only the imported ontology', function() {
            expect(service.hasAnnotations([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any annotation entities in the ontology', function() {
            expect(service.hasAnnotations([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getAnnotations should return', function() {
        it('correct annotation objects if there are any in the ontology', function() {
            expect(service.getAnnotations([[this.annotationObj, this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.annotationObj, this.importedAnnotationObj]);
        });
        it('correct annotation objects if there are any in only the ontology', function() {
            expect(service.getAnnotations([[this.annotationObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.annotationObj]);
        });
        it('correct annotation objects if there are any in only the imported ontology', function() {
            expect(service.getAnnotations([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.importedAnnotationObj]);
        });
        it('correct annotation objects if there are duplicates', function() {
            expect(service.getAnnotations([[this.annotationObj, this.ontologyObj], [this.annotationObj, this.importedOntObj]])).toEqual([this.annotationObj]);
        });
        it('undefined if there are no annotations in the ontology', function() {
            expect(service.getAnnotations([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('getAnnotationIRIs should return', function() {
        it('annotationId if there are annotations in the ontology', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([annotationId, importedAnnotationId]);
        });
        it('annotationId if there are annotations in only the ontology', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.importedOntObj]])).toEqual([annotationId]);
        });
        it('annotationId if there are annotations in only the imported ontology', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([importedAnnotationId]);
        });
        it('annotationId if there are duplicates', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.annotationObj, this.importedOntObj]])).toEqual([annotationId]);
        });
        it('[] if there are no annotations in the ontology', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isNamedIndividual should return', function() {
        it('true if the entity contains the named individual type', function() {
            expect(service.isNamedIndividual(this.individualObj)).toBe(true);
        });
        it('false if the entity does not contain the named individual type', function() {
            expect(service.isNamedIndividual(emptyObj)).toBe(false);
        });
    });
    describe('isIndividual should return', function() {
        it('true if the entity does not contain any OWL type', function() {
            expect(service.isIndividual({'@id': 'urn:testid', '@type': ['urn:test']})).toBe(true);
        });
        it('false if the entity does contain OWL type', function() {
            [
                OWL + 'Class',
                OWL + 'DatatypeProperty',
                OWL + 'ObjectProperty',
                OWL + 'AnnotationProperty',
                OWL + 'Datatype',
                OWL + 'Ontology'
            ].forEach(type => {
                expect(service.isIndividual({'@id': 'urn:testid', '@type': [type]})).toBe(false);
            });
        });
    });
    describe('hasIndividuals should return', function() {
        it('true if there are any individual entities in the ontology', function() {
            expect(service.hasIndividuals([[this.individualObj, this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toBe(true);
        });
        it('true if there are any individual entities in only the ontology', function() {
            expect(service.hasIndividuals([[this.individualObj, this.ontologyObj], [this.importedOntObj]])).toBe(true);
        });
        it('true if there are any individual entities in only the imported ontology', function() {
            expect(service.hasIndividuals([[this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toBe(true);
        });
        it('false if there are not any individual entities in the ontology', function() {
            expect(service.hasIndividuals([[this.ontologyObj], [this.importedOntObj]])).toBe(false);
        });
    });
    describe('getIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology', function() {
            expect(service.getIndividuals([[this.individualObj, this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toEqual([this.individualObj, this.importedIndividualObj]);
        });
        it('correct individual objects if there are any in only the ontology', function() {
            expect(service.getIndividuals([[this.individualObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.individualObj]);
        });
        it('correct individual objects if there are any in only the imported ontology', function() {
            expect(service.getIndividuals([[this.ontologyObj], [this.importedIndividualObj, this.importedOntObj]])).toEqual([this.importedIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            expect(service.getIndividuals([[this.individualObj, this.ontologyObj], [this.individualObj, this.importedOntObj]])).toEqual([this.individualObj]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(service.getIndividuals([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasNoTypeIndividuals should return', function() {
        it('true if there are any in the ontology with no other @type', function() {
            const diffIndividualObj = {
                '@id': individualId,
                '@type': [OWL + 'NamedIndividual']
            };
            expect(service.hasNoTypeIndividuals([[diffIndividualObj, this.ontologyObj]])).toBe(true);
        });
        it('false if there are no individuals in the ontology with no other @type', function() {
            expect(service.hasNoTypeIndividuals([[this.ontologyObj, this.individualObj]])).toBe(false);
        });
        it('false if there are no individuals in the ontology', function() {
            expect(service.hasNoTypeIndividuals([[this.ontologyObj]])).toBe(false);
        });
    });
    describe('getNoTypeIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology with no other @type', function() {
            const diffIndividualObj = {
                '@id': individualId,
                '@type': [OWL + 'NamedIndividual']
            };
            expect(service.getNoTypeIndividuals([[diffIndividualObj, this.ontologyObj]])).toEqual([diffIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            const diffIndividualObj = {
                '@id': individualId,
                '@type': [OWL + 'NamedIndividual']
            };
            expect(service.getNoTypeIndividuals([[diffIndividualObj, this.ontologyObj], [diffIndividualObj, this.importedOntObj]])).toEqual([diffIndividualObj]);
        });
        it('undefined if there are no individuals in the ontology with no other @type', function() {
            expect(service.getNoTypeIndividuals([[this.ontologyObj, this.individualObj]])).toEqual([]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(service.getNoTypeIndividuals([[this.ontologyObj]])).toEqual([]);
        });
    });
    describe('hasClassIndividuals should return', function() {
        it('true if there are any entities with a type of the provided class in the ontology', function() {
            expect(service.hasClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], classId)).toBe(true);
        });
        it('true if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(service.hasClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], importedClassId)).toBe(true);
        });
        it('false if there are no entities with a type of the provided class in the ontology', function() {
            expect(service.hasClassIndividuals([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], classId)).toBe(false);
        });
    });
    describe('getClassIndividuals should return', function() {
        it('correct object if there are any entities with a type of the provided class in the ontology', function() {
            expect(service.getClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], classId)).toEqual([this.individualObj]);
        });
        it('correct object if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(service.getClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], importedClassId)).toEqual([this.importedIndividualObj]);
        });
        it('[] if there are no entities with a type of the provided class in the ontology', function() {
            expect(service.getClassIndividuals([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], classId)).toEqual([]);
        });
    });
    describe('isRestriction should return', function() {
        it('true if the entity contains the restriction type', function() {
            expect(service.isRestriction(this.restrictionObj)).toBe(true);
        });
        it('false if the entity does not contain the restriction type', function() {
            expect(service.isRestriction(emptyObj)).toBe(false);
        });
    });
    describe('getRestrictions should return', function() {
        it('correct restriction objects if there are any in the ontology', function() {
            expect(service.getRestrictions([[this.restrictionObj, this.ontologyObj], [this.importedRestrictionObj, this.importedOntObj]])).toEqual([this.restrictionObj, this.importedRestrictionObj]);
        });
        it('correct restriction objects if there are any in only the ontology', function() {
            expect(service.getRestrictions([[this.restrictionObj, this.ontologyObj], [this.importedOntObj]])).toEqual([this.restrictionObj]);
        });
        it('correct restriction objects if there are any in only the imported ontology', function() {
            expect(service.getRestrictions([[this.ontologyObj], [this.importedRestrictionObj, this.importedOntObj]])).toEqual([this.importedRestrictionObj]);
        });
        it('correct restriction objects if there are duplicates', function() {
            expect(service.getRestrictions([[this.restrictionObj, this.ontologyObj], [this.restrictionObj, this.importedOntObj]])).toEqual([this.restrictionObj]);
        });
        it('undefined if there are no restrictions in the ontology', function() {
            expect(service.getRestrictions([[this.ontologyObj], [this.importedOntObj]])).toEqual([]);
        });
    });
    describe('isBlankNode should return', function() {
        it('true if the entity contains a blank node id', function() {
            expect(service.isBlankNode(blankNodeObj)).toBe(true);
        });
        it('false if the entity does not contain a blank node id', function() {
            expect(service.isBlankNode(emptyObj)).toBe(false);
        });
    });
    describe('isBlankNodeId should return', function() {
        it('true if the id is a blank node id', function() {
            expect(service.isBlankNodeId('_:genid')).toBe(true);
            expect(service.isBlankNodeId('_:b')).toBe(true);
            expect(service.isBlankNodeId('http://mobi.com/.well-known/genid/')).toBe(true);
        });
        it('false if the id is not a blank node id', function() {
            ['', 'notblanknode', undefined, null].forEach((test) => {
                expect(service.isBlankNodeId(test)).toBe(false);
            });
        });
    });
    describe('getBlankNodes should return', function() {
        it('correct blank node objects if there are any in the ontology', function() {
            expect(service.getBlankNodes([[blankNodeObj, this.ontologyObj]])).toEqual([blankNodeObj]);
        });
        it('correct blank node objects if there are duplicates', function() {
            expect(service.getBlankNodes([[blankNodeObj, this.ontologyObj], [blankNodeObj, this.importedOntObj]])).toEqual([blankNodeObj]);
        });
        it('undefined if there are no blank nodes in the ontology', function() {
            expect(service.getBlankNodes([[this.ontologyObj]])).toEqual([]);
        });
    });
    describe('getEntity returns', function() {
        it('object when present', function() {
            expect(service.getEntity([[this.classObj, this.ontologyObj]], classId)).toEqual(this.classObj);
        });
        it('undefined when not present', function() {
            expect(service.getEntity([], classId)).toBe(undefined);
        });
    });
    describe('getEntityName should return', function() {
        beforeEach(function () {
            this.entity = {};
            this.presentProp = '';
            utilStub.getPropertyValue.and.callFake((entity, property) => (property === this.presentProp) ? title : '');
        });
        describe('returns the rdfs:label if present', function() {
            it('and in english', function() {
                this.entity[RDFS + 'label'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = RDFS + 'label';
                expect(service.getEntityName(this.entity)).toEqual(title);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns the dcterms:title if present and no rdfs:label', function() {
            it('and in english', function() {
                this.entity[DCTERMS + 'title'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = DCTERMS + 'title';
                expect(service.getEntityName(this.entity)).toEqual(title);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns the dc:title if present and no rdfs:label or dcterms:title', function() {
            it('and in english', function() {
                this.entity[DC + 'title'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS +'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = DC + 'title';
                expect(service.getEntityName(this.entity)).toEqual(title);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS +'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns skos:prefLabel if present and no rdfs:label, dcterms:title, or dc:title', function() {
            it('and in english', function() {
                this.entity[SKOS + 'prefLabel'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                service.getEntityName(this.entity);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = SKOS + 'prefLabel';
                service.getEntityName(this.entity);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns skos:altLabel if present and no rdfs:label, dcterms:title, or dc:title, or skos:prefLabel', function() {
            it('and in english', function() {
                this.entity[SKOS + 'altLabel'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                service.getEntityName(this.entity);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = SKOS + 'altLabel';
                service.getEntityName(this.entity);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        describe('returns skosxl:literalForm if present and no rdfs:label, dcterms:title, or dc:title, skos:prefLabel or skos:altLabel', function() {
            it('and in english', function() {
                this.entity[SKOSXL + 'literalForm'] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                service.getEntityName(this.entity);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getPropertyValue).not.toHaveBeenCalledWith(this.entity, SKOSXL + 'literalForm');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('and there is no english version', function() {
                this.presentProp = SKOSXL + 'literalForm';
                service.getEntityName(this.entity);
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOSXL + 'literalForm');
                expect(utilStub.getBeautifulIRI).not.toHaveBeenCalled();
            });
        });
        it('returns the @id if present and nothing else', function() {
            utilStub.getBeautifulIRI.and.returnValue(ontologyId);
            this.entity['@id'] = ontologyId;
            expect(service.getEntityName(this.entity)).toEqual(ontologyId);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
            expect(utilStub.getBeautifulIRI).toHaveBeenCalledWith(ontologyId);
        });
    });
    describe('getEntityDescription should return', function() {
        it('rdfs:comment if present', function() {
            utilStub.getPropertyValue.and.returnValue(description);
            expect(service.getEntityDescription(emptyObj)).toEqual(description);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, RDFS + 'comment');
        });
        it('dcterms:description if present and no rdfs:comment', function() {
            utilStub.getPropertyValue.and.returnValue('');
            utilStub.getDctermsValue.and.returnValue(description);
            expect(service.getEntityDescription(emptyObj)).toEqual(description);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, RDFS + 'comment');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(emptyObj, 'description');
        });
        it('dc:description if present and no rdfs:comment or dcterms:description', function() {
            utilStub.getPropertyValue.and.callFake((entity, property) => (property === DC + 'description') ? description : '');
            utilStub.getDctermsValue.and.returnValue('');
            expect(service.getEntityDescription(emptyObj)).toEqual(description);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, RDFS + 'comment');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(emptyObj, 'description');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, DC + 'description');
        });
        it('"" if no rdfs:comment, dcterms:description, or dc:description', function() {
            utilStub.getPropertyValue.and.returnValue('');
            utilStub.getDctermsValue.and.returnValue('');
            expect(service.getEntityDescription(emptyObj)).toEqual('');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, RDFS + 'comment');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(emptyObj, 'description');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, DC + 'description');
        });
    });
    describe('isConcept should return', function() {
        it('true if the entity contains the concept type', function() {
            expect(service.isConcept(this.conceptObj)).toEqual(true);
        });
        it('true if the entity contains a derived concept type', function() {
            expect(service.isConcept(this.derivedConceptObj, [derivedConceptType])).toEqual(true);
        });
        it('false if the entity does not contain the concept type', function() {
            expect(service.isConcept(emptyObj)).toEqual(false);
        });
    });
    describe('hasConcepts should return', function() {
        it('true if there are any concept entities in the ontology', function() {
            expect(service.hasConcepts([[this.conceptObj, this.ontologyObj], [this.importedConceptObj, this.importedOntObj]], [])).toBe(true);
        });
        it('true if there are any concept entities in only the ontology', function() {
            expect(service.hasConcepts([[this.conceptObj, this.ontologyObj], [this.importedOntObj]], [])).toBe(true);
        });
        it('true if there are any concept entities in only the imported ontology', function() {
            expect(service.hasConcepts([[this.ontologyObj], [this.importedConceptObj, this.importedOntObj]], [])).toBe(true);
        });
        it('true if there are any derived concept entities in the ontology', function() {
            expect(service.hasConcepts([[this.derivedConceptObj]], [derivedConceptType])).toEqual(true);
        });
        it('false if there are not any concept entities in the ontology', function() {
            expect(service.hasConcepts([[this.ontologyObj], [this.importedOntObj]], [])).toBe(false);
        });
    });
    describe('getConcepts should return', function() {
        it('correct concept objects if there are any in the ontology', function() {
            expect(service.getConcepts([[this.conceptObj, this.ontologyObj], [this.importedConceptObj, this.importedOntObj]], [])).toEqual([this.conceptObj, this.importedConceptObj]);
        });
        it('correct concept objects if there are any in only the ontology', function() {
            expect(service.getConcepts([[this.conceptObj, this.ontologyObj], [this.importedOntObj]], [])).toEqual([this.conceptObj]);
        });
        it('correct concept objects if there are any in only the imported ontology', function() {
            expect(service.getConcepts([[this.ontologyObj], [this.importedConceptObj, this.importedOntObj]], [])).toEqual([this.importedConceptObj]);
        });
        it('correct concept objects if there are any derived concepts', function() {
            expect(service.getConcepts([[this.derivedConceptObj]], [derivedConceptType])).toEqual([this.derivedConceptObj]);
        });
        it('correct concept objects if there are duplicates', function() {
            expect(service.getConcepts([[this.conceptObj, this.ontologyObj], [this.conceptObj, this.importedOntObj]], [])).toEqual([this.conceptObj]);
        });
        it('undefined if there are no concepts in the ontology', function() {
            expect(service.getConcepts([[this.ontologyObj], [this.importedOntObj]], [])).toEqual([]);
        });
    });
    describe('getConceptIRIs should return', function() {
        it('conceptId if there are concepts in the ontology', function() {
            expect(service.getConceptIRIs([[this.ontologyObj, this.conceptObj], [this.importedOntObj, this.importedConceptObj]], [])).toEqual([conceptId, importedConceptId]);
        });
        it('conceptId if there are concepts in only the ontology', function() {
            expect(service.getConceptIRIs([[this.ontologyObj, this.conceptObj], [this.importedOntObj]], [])).toEqual([conceptId]);
        });
        it('conceptId if there are concepts in only the imported ontology', function() {
            expect(service.getConceptIRIs([[this.ontologyObj], [this.importedOntObj, this.importedConceptObj]], [])).toEqual([importedConceptId]);
        });
        it('conceptId if there are derived concepts', function() {
            expect(service.getConceptIRIs([[this.derivedConceptObj]], [derivedConceptType])).toEqual([conceptId]);
        });
        it('[] if there are no concepts in the ontology', function() {
            expect(service.getConceptIRIs([[this.ontologyObj], [this.importedOntObj]], [])).toEqual([]);
        });
    });
    describe('isConceptScheme should return', function() {
        it('true if the entity contains the concept scheme type', function() {
            expect(service.isConceptScheme(this.schemeObj)).toBe(true);
        });
        it('true if the entity contains a derived concept scheme type', function() {
            expect(service.isConceptScheme(this.derivedConceptSchemeObj, [derivedConceptSchemeType])).toEqual(true);
        });
        it('false if the entity does not contain the concept scheme type', function() {
            expect(service.isConceptScheme(emptyObj)).toBe(false);
        });
    });
    describe('hasConceptSchemes should return', function() {
        it('true if there are any concept scheme entities in the ontology', function() {
            expect(service.hasConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]], [])).toBe(true);
        });
        it('true if there are any concept scheme entities in only the ontology', function() {
            expect(service.hasConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedOntObj]], [])).toBe(true);
        });
        it('true if there are any concept scheme entities in only the imported ontology', function() {
            expect(service.hasConceptSchemes([[this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]], [])).toBe(true);
        });
        it('true if there are any derived concept scheme entities in the ontology', function() {
            expect(service.hasConceptSchemes([[this.derivedConceptSchemeObj]], [derivedConceptSchemeType])).toEqual(true);
        });
        it('false if there are not any concept scheme entities in the ontology', function() {
            expect(service.hasConceptSchemes([[this.ontologyObj], [this.importedOntObj]], [])).toBe(false);
        });
    });
    describe('getConceptSchemes should return', function() {
        it('correct concept scheme objects if there are any in the ontology', function() {
            expect(service.getConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]], [])).toEqual([this.schemeObj, this.importedSchemeObj]);
        });
        it('correct concept scheme objects if there are any in only the ontology', function() {
            expect(service.getConceptSchemes([[this.schemeObj, this.ontologyObj], [this.importedOntObj]], [])).toEqual([this.schemeObj]);
        });
        it('correct concept scheme objects if there are any in only the imported ontology', function() {
            expect(service.getConceptSchemes([[this.ontologyObj], [this.importedSchemeObj, this.importedOntObj]], [])).toEqual([this.importedSchemeObj]);
        });
        it('correct concept scheme objects if there are any derived concept schemes', function() {
            expect(service.getConceptSchemes([[this.derivedConceptSchemeObj]], [derivedConceptSchemeType])).toEqual([this.derivedConceptSchemeObj]);
        });
        it('correct concept schemes if there are duplicates', function() {
            expect(service.getConceptSchemes([[this.schemeObj, this.ontologyObj], [this.schemeObj, this.importedOntObj]], [])).toEqual([this.schemeObj]);
        });
        it('undefined if there are no concept schemes in the ontology', function() {
            expect(service.getConceptSchemes([[this.ontologyObj], [this.importedOntObj]], [])).toEqual([]);
        });
    });
    describe('getConceptSchemeIRIs should return', function() {
        it('schemeId if there are concept schemes in the ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj, this.importedSchemeObj]], [])).toEqual([schemeId, importedSchemeId]);
        });
        it('schemeId if there are concept schemes in only the ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj]], [])).toEqual([schemeId]);
        });
        it('schemeId if there are concept schemes in only the imported ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj], [this.importedOntObj, this.importedSchemeObj]], [])).toEqual([importedSchemeId]);
        });
        it('schemeId if there are derived concepts', function() {
            expect(service.getConceptSchemeIRIs([[this.derivedConceptSchemeObj]], [derivedConceptSchemeType])).toEqual([schemeId]);
        });
        it('schemeId if there are duplicates', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj, this.schemeObj]], [])).toEqual([schemeId]);
        });
        it('[] if there are no concept schemes in the ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj], [this.importedOntObj]], [])).toEqual([]);
        });
    });
    describe('uploadChangesFile hits the proper endpoint', function() {
        it('with recordId, branchId and commitId', function() {
            service.uploadChangesFile(file, recordId, branchId, commitId)
                .subscribe(noop, () => {
                    fail('Observable should have succeeded');
                });
            
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId) && req.method === 'PUT');
            expect(request.request.body instanceof FormData).toBeTrue();
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect(request.request.headers.get('Content-Type')).toEqual(null);
            expect(request.request.headers.get('Accept')).toEqual('application/json');
    
            request.flush({ additions: [], deletions: [] });
        });
        it('with no branchId', function() {
            service.uploadChangesFile(file, recordId, undefined, commitId)
                .subscribe(noop, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId) && req.method === 'PUT');
            expect(request.request.body instanceof FormData).toBeTrue();
            expect(request.request.params.get('branchId')).toEqual(null);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect(request.request.headers.get('Content-Type')).toEqual(null);
            expect(request.request.headers.get('Accept')).toEqual('application/json');
    
            request.flush({ additions: [], deletions: [] });
        });
        it('unless an error occurs', function() {
            service.uploadChangesFile(file, recordId, branchId, commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(errorObject);
                });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + recordId) && req.method === 'PUT');
            expect(request.request.body instanceof FormData).toBeTrue();
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect(request.request.params.get('commitId')).toEqual(commitId);
            expect(request.request.headers.get('Content-Type')).toEqual(null);
            expect(request.request.headers.get('Accept')).toEqual('application/json');

            request.flush('flush', { status: 400, statusText: errorObject });
        });
    });
});
