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
import { noop } from 'lodash';
import { OntologyManagerService } from './ontologyManager.service';
import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { CatalogManagerService } from './catalogManager.service';
import { HelperService } from './helper.service';
import { MockProvider } from 'ng-mocks';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OWL, ONTOLOGYEDITOR, SKOS, RDFS, DCTERMS, DC, SKOSXL } from '../../prefixes';
import { mockUtil, cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { throwError } from 'rxjs';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { VocabularyStuff } from '../models/vocabularyStuff.interface';
import { PropertyToRanges } from '../models/propertyToRanges.interface';
import { OntologyStuff } from '../models/ontologyStuff.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';

describe('Ontology Manager service', function() {
    let service: OntologyManagerService;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    let vocabularyStuffObj: VocabularyStuff;
    let ontologyStuffObj: OntologyStuff;
    let propertyToRangesObj: PropertyToRanges;
    const emptyObj: JSONLDObject = {'@id': 'test'};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                OntologyManagerService,
                HelperService,
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(OntologyManagerService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get('utilService');
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        httpMock = TestBed.get(HttpTestingController);

        this.recordId = 'recordId';
        this.ontologyId = 'ontologyId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        this.catalogId = 'catalogId';
        this.format = 'jsonld';
        this.file = {name: 'title'};
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
        this.derivedSemanticRelation = ['derivedSemanticRelation'];
        this.importedClassId = 'importedClassId';
        this.importedDataPropertyId = 'importedDataPropertyId';
        this.importedDataPropertyId = 'importedObjectPropertyId';
        this.importedAnnotationId = 'importedAnnotationId';
        this.importedIndividualId = 'importedIndividualId';
        this.importedRestrictionId = 'importedRestrictionId';
        this.importedConceptId = 'importedConceptId';
        this.importedSchemeId = 'importedSchemeId';
        this.importedOntologyId = 'importedOntologyId';
        catalogManagerStub.localCatalog = {'@id': this.catalogId};
        service.initialize();
        this.ontologyObj = {
            '@id': this.ontologyId,
            '@type': [OWL + 'Ontology', ONTOLOGYEDITOR + 'OntologyRecord']
        };
        this.classObj = {
            '@id': this.classId,
            '@type': [OWL + 'Class']
        };
        this.objectPropertyObj = {
            '@id': this.objectPropertyId,
            '@type': [OWL + 'ObjectProperty']
        };
        this.objectPropertyObj[RDFS + 'domain'] = [{'@id': this.classId}];
        this.dataPropertyObj = {
            '@id': this.dataPropertyId,
            '@type': [OWL + 'DatatypeProperty']
        };
        this.annotationObj = {
            '@id': this.annotationId,
            '@type': [OWL + 'AnnotationProperty']
        };
        this.individualObj = {
            '@id': this.individualId,
            '@type': [OWL + 'NamedIndividual', this.classId]
        };
        this.restrictionObj = {
            '@id': this.restrictionId,
            '@type': [OWL + 'Restriction']
        };
        this.conceptObj = {
            '@id': this.conceptId,
            '@type': [SKOS + 'Concept']
        };
        this.derivedConceptObj = {
            '@id': this.conceptId,
            '@type': [this.derivedConceptType]
        };
        this.schemeObj = {
            '@id': this.schemeId,
            '@type': [SKOS + 'ConceptScheme']
        };
        this.derivedConceptSchemeObj = {
            '@id': this.schemeId,
            '@type': [this.derivedConceptSchemeType]
        };
        this.ontology = [this.ontologyObj, this.classObj, this.dataPropertyObj];
        this.importedOntObj = {
            '@id': this.importedOntologyId,
            '@type': [OWL + 'Ontology']
        };
        this.importedClassObj = {
            '@id': this.importedClassId,
            '@type': [OWL + 'Class']
        };
        this.importedDataPropertyObj = {
            '@id': this.importedDataPropertyId,
            '@type': [OWL + 'DatatypeProperty']
        };
        this.importedObjectPropertyObj = {
            '@id': this.importedDataPropertyId,
            '@type': [OWL + 'ObjectProperty']
        };
        this.importedObjectPropertyObj[RDFS + 'domain'] = [{'@id': this.importedClassId}];
        this.importedAnnotationObj = {
            '@id': this.importedAnnotationId,
            '@type': [OWL + 'AnnotationProperty']
        };
        this.importedIndividualObj = {
            '@id': this.importedIndividualId,
            '@type': [OWL + 'NamedIndividual', this.importedClassId]
        };
        this.importedRestrictionObj = {
            '@id': this.importedRestrictionId,
            '@type': [OWL + 'Restriction']
        };
        this.importedConceptObj = {
            '@id': this.importedConceptId,
            '@type': [SKOS + 'Concept']
        };
        this.importedSchemeObj = {
            '@id': this.importedSchemeId,
            '@type': [SKOS + 'ConceptScheme']
        };

        propertyToRangesObj = {
            'propertyToRanges': {
                'urn:hasTopping':['urn:PizzaTopping']
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
            ontologyIRI: this.ontologyId,
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

        utilStub.rejectError.and.returnValue(throwError(this.error));
        utilStub.rejectErrorObject.and.returnValue(throwError(this.errorObject));
        progressSpinnerStub.track.and.callFake(ob => ob);
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
                    file: this.file, 
                    title: this.title, 
                    description: this.description, 
                    keywords: this.keywords
                };
            });
            it('with description and keywords', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
                    }, () => fail('Observable should have succeeded'));
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
            });
            it('with no description or keywords', function() {
                service.uploadOntology({file: this.file, title: this.title})
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
                    }, () => fail('Observable should have succeeded'));
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(null);
                expect((request.request.body).getAll('keywords')).toEqual([]);
                request.flush({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
            });
            it('unless an error occurs', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(this.errorObject);
                    });

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush('flush', { status: 400, statusText: this.error });
            });
        });
        describe('with JSON-LD', function() {
            beforeEach(function() {
                this.recordConfig = {
                    jsonld: this.ontologyObj, 
                    title: this.title, 
                    description: this.description, 
                    keywords: this.keywords
                };
            });
            it('with description and keywords', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
                    }, () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
            });
            it('with no description or keywords', function() {
                service.uploadOntology({jsonld: this.ontologyObj, title: this.title})
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
                    }, () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(null);
                expect((request.request.body).getAll('keywords')).toEqual([]);
                request.flush({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
            });
            it('unless an error occurs', function() {
                service.uploadOntology({jsonld: this.ontologyObj, title: this.title})
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(this.errorObject);
                    });

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                request.flush('flush', { status: 400, statusText: this.error });
            });
        });
    });
    describe('uploadOntology file not supported', function() {
         it('trig with title, description and keywords', function() {
            service.uploadOntology({file: this.file, title: 'title.trig', description: this.description, keywords: this.keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
        it('trig.zip with title, description and keywords', function() {
            service.uploadOntology({file: this.file, title: 'title.trig.zip', description: this.description, keywords: this.keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
        it('trig.gzip with title, description and keywords', function() {
            service.uploadOntology({file: this.file, title: 'title.trig.gzip', description: this.description, keywords: this.keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
    });
    describe('deleteOntology hits the proper endpoint', function() {
        it('successfully', function() {
            service.deleteOntology(this.recordId)
                .subscribe(() => {}, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne({url: '/mobirest/ontologies/' + encodeURIComponent(this.recordId), method: 'DELETE'});
            request.flush(200);
        });
        it('unless an error occurs', function() {
            service.deleteOntology(this.recordId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(this.error);
                });
            const request = httpMock.expectOne({url: '/mobirest/ontologies/' + encodeURIComponent(this.recordId), method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
    describe('downloadOntology should call the window.open method properly', function() {
        beforeEach(function () {
            this.url = '/mobirest/ontologies/' + encodeURIComponent(this.recordId);
            spyOn(window, 'open');
        });
        it('with a format and no fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: this.branchId,
                    commitId: this.commitId,
                    rdfFormat: 'turtle',
                    fileName: 'ontology'
                }
            });
            service.downloadOntology(this.recordId, this.branchId, this.commitId, 'turtle');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('without a format or a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: this.branchId,
                    commitId: this.commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'ontology'
                }
            });
            service.downloadOntology(this.recordId, this.branchId, this.commitId);
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('with a format and fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: this.branchId,
                    commitId: this.commitId,
                    rdfFormat: 'turtle',
                    fileName: 'fileName'
                }
            });
            service.downloadOntology(this.recordId, this.branchId, this.commitId, 'turtle', 'fileName');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('without a format and with a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: this.branchId,
                    commitId: this.commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'fileName'
                }
            });
            service.downloadOntology(this.recordId, this.branchId, this.commitId, undefined, 'fileName');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
    });
    describe('getOntology hits the proper endpoint', function() {
        it('unless an error occurs', function() {
            service.getOntology(this.recordId, this.branchId, this.commitId, this.format, false, false, true)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(this.error);
                });
            const request = httpMock.expectOne(req => req.url === '/mobirest/ontologies/' + encodeURIComponent(this.recordId) && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getOntology(this.recordId, this.branchId, this.commitId, this.format, false, false, true)
                .subscribe(data => {
                    expect(data).toEqual(this.ontology);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === '/mobirest/ontologies/' + encodeURIComponent(this.recordId) && req.method === 'GET');
            expect((request.request.params).get('branchId').toString()).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('rdfFormat')).toEqual(this.format);
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
            service.deleteOntologyBranch(this.recordId, this.branchId)
                .subscribe(noop, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId)) && req.method === 'DELETE');
            request.flush(200);
        });
        it('unless an error occurs', function() {
            service.deleteOntologyBranch(this.recordId, this.branchId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId)) && req.method === 'DELETE');
            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
    describe('getVocabularyStuff retrieves information about skos:Concepts and skos:ConceptSchemes in an ontology', function() {
        describe('with no id set', function() {
            it('unless an error occurs', function() {
                service.getVocabularyStuff(this.recordId, this.branchId, this.commitId)
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(this.error);
                    });

                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/vocabulary-stuff') && req.method === 'GET');

                expect((request.request.params).get('branchId').toString()).toEqual(this.branchId);
                expect((request.request.params).get('commitId')).toEqual(this.commitId);
                request.flush('flush', { status: 400, statusText: this.error });    
            });
            it('successfully', function() {
                service.getVocabularyStuff(this.recordId, this.branchId, this.commitId)
                    .subscribe((response: VocabularyStuff) => {
                        expect(response).toEqual(vocabularyStuffObj);
                    }, () => {
                        fail('Observable should have succeeded');
                    });

                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + encodeURIComponent(this.recordId) + '/vocabulary-stuff') && req.method === 'GET');

                expect((request.request.params).get('branchId')).toEqual(this.branchId);
                expect((request.request.params).get('commitId')).toEqual(this.commitId);
                request.flush(vocabularyStuffObj);
            });
        });
    });
    describe('getOntologyStuff retrieves information about ontology', function() {
        describe('with no id set', function() {
            it('unless an error occurs', function() {
                service.getOntologyStuff(this.recordId, this.branchId, this.commitId, false)
                    .subscribe(() => {
                        fail('Observable should have errored');
                    }, response => {
                        expect(response).toBe(this.error);
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/ontology-stuff') && req.method === 'GET');
                expect((request.request.params).get('branchId')).toEqual(this.branchId);
                expect((request.request.params).get('commitId')).toEqual(this.commitId);
                request.flush('flush', { status: 400, statusText: this.error });
            });
            it('successfully clearing the cache', function() {
                service.getOntologyStuff(this.recordId, this.branchId, this.commitId, true)
                    .subscribe(response => {
                        expect(response).toEqual(ontologyStuffObj);
                    }, () => {
                        fail('Observable should have succeeded');
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/ontology-stuff') && req.method === 'GET');
                expect((request.request.params).get('branchId')).toEqual(this.branchId);
                expect((request.request.params).get('commitId')).toEqual(this.commitId);
                expect((request.request.params).get('clearCache').toString()).toEqual('true');
                request.flush(ontologyStuffObj);
            });
            it('successfully', function() {
                service.getOntologyStuff(this.recordId, this.branchId, this.commitId, false)
                    .subscribe(response => {
                    expect(response).toEqual(ontologyStuffObj);
                    }, () => {
                        fail('Observable should have succeeded');
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/ontology-stuff') && req.method === 'GET');
                expect((request.request.params).get('branchId')).toEqual(this.branchId);
                expect((request.request.params).get('commitId')).toEqual(this.commitId);
                request.flush(ontologyStuffObj);
            });
        });
    });
    describe('getPropertyToRange retrieves all propertyRanges in an ontology', function() {
        it('unless an error occurs', function() {
            service.getPropertyToRange(this.recordId, this.branchId, this.commitId, false)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/property-ranges') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getPropertyToRange(this.recordId, this.branchId, this.commitId, false)
                .subscribe((response: PropertyToRanges) => {
                    expect(response).toEqual(propertyToRangesObj);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/property-ranges') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush(propertyToRangesObj);
        });
    });
    describe('getIris retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getIris(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/iris') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getIris(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyIriList);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/iris') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(this.emptyIriList);
        });
    });
    describe('getOntologyClasses retrieves all classes in an ontology', function() {
        it('unless an error occurs', function() {
            service.getOntologyClasses(this.recordId, this.branchId, this.commitId, false)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/classes') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getOntologyClasses(this.recordId, this.branchId, this.commitId, false)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/classes') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush([emptyObj]);
        });
    });
    describe('getDataProperties retrieves all data properties in an ontology', function() {
        it('unless an error occurs', function() {
            service.getDataProperties(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/data-properties') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getDataProperties(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/data-properties') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush([emptyObj]);
        });
    });
    describe('getObjProperties retrieves all data properties in an ontology', function() {
        it('unless an error occurs', function() {
            service.getObjProperties(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/object-properties') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getObjProperties(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/object-properties') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush([emptyObj]);
        });
    });
    describe('getImportedIris retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getImportedIris(this.recordId, this.branchId, this.commitId, this.applyInProgressCommit)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-iris') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('unless there are none', function() { // TODO: Should this be removed?
            service.getImportedIris(this.recordId, this.branchId, this.commitId, this.applyInProgressCommit)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-iris') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([], { status: 204, statusText: 'No Data' });
        });
        it('successfully', function() {
            service.getImportedIris(this.recordId, this.branchId, this.commitId, this.applyInProgressCommit )
                .subscribe(response => {
                    expect(response).toEqual([this.emptyIriList]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-iris') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([this.emptyIriList]);
        });
    });
    describe('getClassHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getClassHierarchies(this.recordId, this.branchId, this.commitId, this.applyInProgressCommit)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/class-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getClassHierarchies(this.recordId, this.branchId, this.commitId, this.applyInProgressCommit)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/class-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getClassesWithIndividuals retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getClassesWithIndividuals(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/classes-with-individuals') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getClassesWithIndividuals(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/classes-with-individuals') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(emptyObj);
        });
    });
    describe('getDataPropertyHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getDataPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/data-property-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getDataPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/data-property-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getObjectPropertyHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getObjectPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/object-property-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getObjectPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/object-property-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(this.emptyHierarchyResponse)
        });
    });
    describe('getAnnotationPropertyHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getAnnotationPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/annotation-property-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getAnnotationPropertyHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/annotation-property-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(this.emptyHierarchyResponse)
        });
    });
    describe('getConceptHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getConceptHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/concept-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getConceptHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/concept-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getConceptSchemeHierarchies retrieves all IRIs in an ontology', function() {
        it('unless an error occurs', function() {
            service.getConceptSchemeHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/concept-scheme-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('successfully', function() {
            service.getConceptSchemeHierarchies(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(this.emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/concept-scheme-hierarchies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(this.emptyHierarchyResponse);
        });
    });
    describe('getImportedOntologies should call the proper functions', function() {
        it('when get succeeds', function() {
            service.getImportedOntologies(this.recordId, this.branchId, this.commitId, 'jsonld', true)
                .subscribe(response => {
                    expect(response).toEqual([this.ontology]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-ontologies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([this.ontology]);
        });
        it('when get is empty', function() {
            service.getImportedOntologies(this.recordId, this.branchId, this.commitId, 'jsonld', true)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-ontologies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('', { status: 204, statusText: 'No Content' });
        });
        it('when another success response', function() {
            service.getImportedOntologies(this.recordId, this.branchId, this.commitId, 'jsonld', true)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(new Error(this.error));
                });
            
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-ontologies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 201, statusText: this.error });
        });
        it('when get fails', function() {
            service.getImportedOntologies(this.recordId, this.branchId, this.commitId, 'jsonld', true)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
                
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-ontologies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');

            request.flush('flush', { status: 400, statusText: this.error });
        });
        it('when apply-in-progress is not passed in', function () {
            service.getImportedOntologies(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual([this.ontology]);
                }, () => {
                    fail('Observable should have succeeded');
                });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/imported-ontologies') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush([this.ontology]);
        });
    });
    describe('getEntityUsages should call the proper functions', function() {
        describe('when get succeeds', function() {
            describe('with no id set', function() {
                it('and queryType is select', function() {
                    service.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'select')
                        .subscribe(response => {
                            expect(response).toEqual(this.usages.results.bindings);
                        }, () => {
                            fail('Observable should have succeeded');
                        });
                    const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entity-usages/classId') && req.method === 'GET');
                    expect((request.request.params).get('branchId')).toEqual(this.branchId);
                    expect((request.request.params).get('commitId')).toEqual(this.commitId);
                    expect((request.request.params).get('queryType')).toEqual('select');
                    request.flush(this.usages);
                });
                it('and queryType is construct', function() {
                    service.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId, 'construct')
                        .subscribe(response => {
                            expect(response).toEqual(this.usages);
                        }, () => {
                            fail('Observable should have succeeded');
                        });
                    const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entity-usages/classId') && req.method === 'GET');
                    expect((request.request.params).get('branchId')).toEqual(this.branchId);
                    expect((request.request.params).get('commitId')).toEqual(this.commitId);
                    expect((request.request.params).get('queryType')).toEqual('construct');
                    request.flush(this.usages);
                });
            });
        });
        describe('when get fails', function() {
            it('when id is not set', function() {
                service.getEntityUsages(this.recordId, this.branchId, this.commitId, this.classId)
                    .subscribe(() => {
                        fail('Observable should have errored');
                    }, response => {
                        expect(response).toBe(this.error);
                    });
                const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entity-usages/classId') && req.method === 'GET');
                expect((request.request.params).get('branchId')).toEqual(this.branchId);
                expect((request.request.params).get('commitId')).toEqual(this.commitId);
                expect((request.request.params).get('queryType')).toEqual('select');
                
                request.flush('flush', { status: 400, statusText: this.error });
            });
        });
    });
    describe('getOntologyEntityNames calls the correct functions when POST /mobirest/ontologies/{recordId}/entity-names', function() {
        it('successfully', function() {
            service.getOntologyEntityNames(this.recordId, this.branchId, this.commitId, false, false)
                .subscribe(response => {
                    expect(response).toEqual({});
                }, () => {
                    fail('Observable should have succeeded');
                });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entity-names') && req.method === 'POST');

            expect(request.request.body).toEqual({'filterResources': []});
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('includeImports').toString()).toEqual('false');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.headers).get('Content-Type')).toEqual('application/json');

            request.flush({});
        });
        it('unless an error occurs', function() {
            service.getOntologyEntityNames(this.recordId, this.branchId, this.commitId, false, false)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
                
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entity-names') && req.method === 'POST');

            expect(request.request.body).toEqual({'filterResources': []});
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('includeImports').toString()).toEqual('false');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.headers).get('Content-Type')).toEqual('application/json');
    
            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
    describe('getSearchResults should call the correct functions', function() {
        beforeEach(function () {
            this.searchText = 'searchText';
        });
        it('when get succeeds', function() {
            service.getSearchResults(this.recordId, this.branchId, this.commitId, 'searchText')
                .subscribe(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/search-results') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');

            request.flush({});
        });
        it('when get is empty', function() {
            service.getSearchResults(this.recordId, this.branchId, this.commitId, 'searchText')
            .subscribe(response => {
                expect(response).toEqual({});
            }, () => {
                fail('Observable should have succeeded');
            });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/search-results') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');

            request.flush('', { status: 204, statusText: 'No Data' });
        });
        it('when get succeeds with different code', function() {
            service.getSearchResults(this.recordId, this.branchId, this.commitId, 'searchText')
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(new Error('An error has occurred with your search.'));
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/search-results') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');

            request.flush('flush', { status: 201, statusText: this.error });
        });
        it('when get fails', function() {
            service.getSearchResults(this.recordId, this.branchId, this.commitId, 'searchText')
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/search-results') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');
    
            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
    describe('getQueryResults calls the correct functions when GET /mobirest/ontologies/{recordId}/query', function() {
        beforeEach(function() {
            this.query = 'select * where {?s ?p ?o}';
        });
        it('succeeds', function() {
            service.getQueryResults(this.recordId, this.branchId, this.commitId, this.query, this.format)
                .subscribe(response => expect(response).toEqual([{}]),
                    () => fail('Observable should have succeeded'));

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/query') && req.method === 'GET');
            expect((request.request.params).get('query')).toEqual(this.query);
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
            request.flush([{}], {
                headers: new HttpHeaders({'Content-Type': 'application/json'})
            });
        });
        it('fails', function() {
            service.getQueryResults(this.recordId, this.branchId, this.commitId, this.query, this.format)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/query') && req.method === 'GET');
            expect((request.request.params).get('query')).toEqual(this.query);
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
    
            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
    describe('getFailedImports calls the correct functions when GET /mobirest/ontologies/{recordId}/failed-imports', function() {
        it('succeeds', function() {
            service.getFailedImports(this.recordId, this.branchId, this.commitId)
                .subscribe(response => {
                    expect(response).toEqual(['failedId']);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/failed-imports') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush(['failedId']);
        });
        it('fails', function() {
            service.getFailedImports(this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/failed-imports') && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
    describe('getEntityAndBlankNodes retrieves entity and blank node RDF', function() {
        it('successfully with defaults', function() {
            service.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId) && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('format')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');

            request.flush([emptyObj]);
        });
        it('successfully with specified params', function() {                
            service.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId, 'turtle', false, false)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId) && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('format')).toEqual('turtle');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('false');

            request.flush([emptyObj]);
        });
        it('unless an error occurs', function() {
            service.getEntityAndBlankNodes(this.recordId, this.branchId, this.commitId, this.classId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(this.error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId + '/entities/' + this.classId) && req.method === 'GET');
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect((request.request.params).get('format')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            
            request.flush('flush', { status: 400, statusText: this.error });
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
            expect(service.getOntologyIRI([this.ontologyObj])).toBe(this.ontologyId);
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
    describe('getClassIRIs should return', function() {
        it('classId if there are classes in the ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj, this.importedClassObj]])).toEqual([this.classId, this.importedClassId]);
        });
        it('classId if there are classes only in the ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj]])).toEqual([this.classId]);
        });
        it('classId if there are classes only in the imported ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj],[this.importedOntObj, this.importedClassObj]])).toEqual([this.importedClassId]);
        });
        it('classId if there are duplicates', function() {
            expect(service.getClassIRIs([[this.ontologyObj, this.classObj],[this.importedOntObj, this.classObj]])).toEqual([this.classId]);
        });
        it('[] if there are no classes in the ontology', function() {
            expect(service.getClassIRIs([[this.ontologyObj],[this.importedOntObj]])).toEqual([]);
        });
    });
    describe('hasClassProperties should return', function() {
        it('true if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.hasClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toBe(true);
        });
        it('true if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.hasClassProperties([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toBe(true);
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(service.hasClassProperties([[this.classObj, this.ontologyObj],[this.importedClassObj, this.importedOntObj]], this.classId)).toBe(false);
        });
    });
    describe('getClassProperties should return', function() {
        it('correct objects if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toEqual([this.objectPropertyObj]);
        });
        it('correct objects if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toEqual([this.importedObjectPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.classObj, this.importedOntObj, this.objectPropertyObj]], this.classId)).toEqual([this.objectPropertyObj]);
        });
        it('[] if there are no entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassProperties([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toEqual([]);
        });
    });
    describe('getClassPropertyIRIs should return', function() {
        it('correct IRIs if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toEqual([this.objectPropertyId]);
        });
        it('correct IRIs if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.importedClassObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toEqual([this.importedDataPropertyId]);
        });
        it('correct IRIs if there are duplicates', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj, this.objectPropertyObj], [this.classObj, this.importedOntObj, this.objectPropertyObj]], this.classId)).toEqual([this.objectPropertyId]);
        });
        it('[] if there are not any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassPropertyIRIs([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toEqual([]);
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
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.dataPropertyId, this.importedDataPropertyId]);
        });
        it('correct IRI if only the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj, this.importedObjectPropertyObj]])).toEqual([this.dataPropertyId]);
        });
        it('correct IRI if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj, this.importedDataPropertyObj]])).toEqual([this.importedDataPropertyId]);
        });
        it('correct IRI if there are duplicates', function() {
            expect(service.getNoDomainPropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyId]);
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
            expect(service.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyId, this.importedDataPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.importedOntObj]])).toEqual([this.objectPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the imported ontology', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj], [this.importedObjectPropertyObj, this.importedOntObj]])).toEqual([this.importedDataPropertyId]);
        });
        it('objectPropertyId if there are duplicates', function() {
            expect(service.getObjectPropertyIRIs([[this.ontologyObj, this.objectPropertyObj], [this.objectPropertyObj, this.importedOntObj]])).toEqual([this.objectPropertyId]);
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
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyId, this.importedDataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.importedOntObj]])).toEqual([this.dataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the imported ontology', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj], [this.importedDataPropertyObj, this.importedOntObj]])).toEqual([this.importedDataPropertyId]);
        });
        it('dataPropertyId if there are duplicates', function() {
            expect(service.getDataTypePropertyIRIs([[this.ontologyObj, this.dataPropertyObj], [this.dataPropertyObj, this.importedOntObj]])).toEqual([this.dataPropertyId]);
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
            expect(service.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.annotationId, this.importedAnnotationId]);
        });
        it('annotationId if there are annotations in only the ontology', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.importedOntObj]])).toEqual([this.annotationId]);
        });
        it('annotationId if there are annotations in only the imported ontology', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj], [this.importedAnnotationObj, this.importedOntObj]])).toEqual([this.importedAnnotationId]);
        });
        it('annotationId if there are duplicates', function() {
            expect(service.getAnnotationIRIs([[this.ontologyObj, this.annotationObj], [this.annotationObj, this.importedOntObj]])).toEqual([this.annotationId]);
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
            var diffIndividualObj = {
                '@id': this.individualId,
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
            var diffIndividualObj = {
                '@id': this.individualId,
                '@type': [OWL + 'NamedIndividual']
            };
            expect(service.getNoTypeIndividuals([[diffIndividualObj, this.ontologyObj]])).toEqual([diffIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            var diffIndividualObj = {
                '@id': this.individualId,
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
            expect(service.hasClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toBe(true);
        });
        it('true if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(service.hasClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toBe(true);
        });
        it('false if there are no entities with a type of the provided class in the ontology', function() {
            expect(service.hasClassIndividuals([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toBe(false);
        });
    });
    describe('getClassIndividuals should return', function() {
        it('correct object if there are any entities with a type of the provided class in the ontology', function() {
            expect(service.getClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.classId)).toEqual([this.individualObj]);
        });
        it('correct object if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(service.getClassIndividuals([[this.individualObj, this.ontologyObj, this.objectPropertyObj], [this.importedIndividualObj, this.importedOntObj, this.importedObjectPropertyObj]], this.importedClassId)).toEqual([this.importedIndividualObj]);
        });
        it('[] if there are no entities with a type of the provided class in the ontology', function() {
            expect(service.getClassIndividuals([[this.classObj, this.ontologyObj], [this.importedClassObj, this.importedOntObj]], this.classId)).toEqual([]);
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
            expect(service.isBlankNode(this.blankNodeObj)).toBe(true);
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
            expect(service.getBlankNodes([[this.blankNodeObj, this.ontologyObj]])).toEqual([this.blankNodeObj]);
        });
        it('correct blank node objects if there are duplicates', function() {
            expect(service.getBlankNodes([[this.blankNodeObj, this.ontologyObj], [this.blankNodeObj, this.importedOntObj]])).toEqual([this.blankNodeObj]);
        });
        it('undefined if there are no blank nodes in the ontology', function() {
            expect(service.getBlankNodes([[this.ontologyObj]])).toEqual([]);
        });
    });
    describe('getEntity returns', function() {
        it('object when present', function() {
            expect(service.getEntity([[this.classObj, this.ontologyObj]], this.classId)).toEqual(this.classObj);
        });
        it('undefined when not present', function() {
            expect(service.getEntity([], this.classId)).toBe(undefined);
        });
    });
    describe('getEntityName should return', function() {
        beforeEach(function () {
            this.entity = {};
            this.presentProp = '';
            utilStub.getPropertyValue.and.callFake((entity, property) => (property === this.presentProp) ? this.title : '');
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
                expect(service.getEntityName(this.entity)).toEqual(this.title);
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
                expect(service.getEntityName(this.entity)).toEqual(this.title);
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
                expect(service.getEntityName(this.entity)).toEqual(this.title);
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
            utilStub.getBeautifulIRI.and.returnValue(this.ontologyId);
            this.entity['@id'] = this.ontologyId;
            expect(service.getEntityName(this.entity)).toEqual(this.ontologyId);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, RDFS + 'label');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DCTERMS + 'title');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, DC + 'title');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'prefLabel');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(this.entity, SKOS + 'altLabel');
            expect(utilStub.getBeautifulIRI).toHaveBeenCalledWith(this.ontologyId);
        });
    });
    describe('getEntityDescription should return', function() {
        it('rdfs:comment if present', function() {
            utilStub.getPropertyValue.and.returnValue(this.description);
            expect(service.getEntityDescription(emptyObj)).toEqual(this.description);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, RDFS + 'comment');
        });
        it('dcterms:description if present and no rdfs:comment', function() {
            utilStub.getPropertyValue.and.returnValue('');
            utilStub.getDctermsValue.and.returnValue(this.description);
            expect(service.getEntityDescription(emptyObj)).toEqual(this.description);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(emptyObj, RDFS + 'comment');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(emptyObj, 'description');
        });
        it('dc:description if present and no rdfs:comment or dcterms:description', function() {
            utilStub.getPropertyValue.and.callFake((entity, property) => (property === DC + 'description') ? this.description : '');
            utilStub.getDctermsValue.and.returnValue('');
            expect(service.getEntityDescription(emptyObj)).toEqual(this.description);
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
            expect(service.isConcept(this.derivedConceptObj, [this.derivedConceptType])).toEqual(true);
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
            expect(service.hasConcepts([[this.derivedConceptObj]], [this.derivedConceptType])).toEqual(true);
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
            expect(service.getConcepts([[this.derivedConceptObj]], [this.derivedConceptType])).toEqual([this.derivedConceptObj]);
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
            expect(service.getConceptIRIs([[this.ontologyObj, this.conceptObj], [this.importedOntObj, this.importedConceptObj]], [])).toEqual([this.conceptId, this.importedConceptId]);
        });
        it('conceptId if there are concepts in only the ontology', function() {
            expect(service.getConceptIRIs([[this.ontologyObj, this.conceptObj], [this.importedOntObj]], [])).toEqual([this.conceptId]);
        });
        it('conceptId if there are concepts in only the imported ontology', function() {
            expect(service.getConceptIRIs([[this.ontologyObj], [this.importedOntObj, this.importedConceptObj]], [])).toEqual([this.importedConceptId]);
        });
        it('conceptId if there are derived concepts', function() {
            expect(service.getConceptIRIs([[this.derivedConceptObj]], [this.derivedConceptType])).toEqual([this.conceptId]);
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
            expect(service.isConceptScheme(this.derivedConceptSchemeObj, [this.derivedConceptSchemeType])).toEqual(true);
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
            expect(service.hasConceptSchemes([[this.derivedConceptSchemeObj]], [this.derivedConceptSchemeType])).toEqual(true);
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
            expect(service.getConceptSchemes([[this.derivedConceptSchemeObj]], [this.derivedConceptSchemeType])).toEqual([this.derivedConceptSchemeObj]);
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
            expect(service.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj, this.importedSchemeObj]], [])).toEqual([this.schemeId, this.importedSchemeId]);
        });
        it('schemeId if there are concept schemes in only the ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj]], [])).toEqual([this.schemeId]);
        });
        it('schemeId if there are concept schemes in only the imported ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj], [this.importedOntObj, this.importedSchemeObj]], [])).toEqual([this.importedSchemeId]);
        });
        it('schemeId if there are derived concepts', function() {
            expect(service.getConceptSchemeIRIs([[this.derivedConceptSchemeObj]], [this.derivedConceptSchemeType])).toEqual([this.schemeId]);
        });
        it('schemeId if there are duplicates', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj, this.schemeObj], [this.importedOntObj, this.schemeObj]], [])).toEqual([this.schemeId]);
        });
        it('[] if there are no concept schemes in the ontology', function() {
            expect(service.getConceptSchemeIRIs([[this.ontologyObj], [this.importedOntObj]], [])).toEqual([]);
        });
    });
    describe('uploadChangesFile hits the proper endpoint', function() {
        it('with recordId, branchId and commitId', function() {
            service.uploadChangesFile(this.file, this.recordId, this.branchId, this.commitId)
                .subscribe(noop, () => {
                    fail('Observable should have succeeded');
                });
            
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId) && req.method === 'PUT');
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect(request.request.headers.get('Content-Type')).toEqual(null);
            expect(request.request.headers.get('Accept')).toEqual('application/json');
    
            request.flush({ additions: [], deletions: [] });
        });
        it('with no branchId', function() {
            service.uploadChangesFile(this.file, this.recordId, undefined, this.commitId)
                .subscribe(noop, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId) && req.method === 'PUT');
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.params).get('branchId')).toEqual(null);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect(request.request.headers.get('Content-Type')).toEqual(null);
            expect(request.request.headers.get('Accept')).toEqual('application/json');
    
            request.flush({ additions: [], deletions: [] });
        });
        it('unless an error occurs', function() {
            service.uploadChangesFile(this.file, this.recordId, this.branchId, this.commitId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toEqual(this.errorObject);
                });

            const request = httpMock.expectOne(req => req.url === ('/mobirest/ontologies/' + this.recordId) && req.method === 'PUT');
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.params).get('branchId')).toEqual(this.branchId);
            expect((request.request.params).get('commitId')).toEqual(this.commitId);
            expect(request.request.headers.get('Content-Type')).toEqual(null);
            expect(request.request.headers.get('Accept')).toEqual('application/json');

            request.flush('flush', { status: 400, statusText: this.error });
        });
    });
});
