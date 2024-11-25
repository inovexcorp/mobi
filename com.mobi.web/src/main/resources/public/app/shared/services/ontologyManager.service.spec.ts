/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { cloneDeep } from 'lodash';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';

import { CatalogManagerService } from './catalogManager.service';
import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { DC, DCTERMS, OWL, ONTOLOGYEDITOR, SKOS, SKOSXL, RDFS } from '../../prefixes';
import { GroupQueryResults } from '../models/groupQueryResults.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { OBJ_PROPERTY_VALUES_QUERY } from '../../queries';
import { OntologyDocument } from '../models/ontologyDocument.interface';
import { OntologyStuff } from '../models/ontologyStuff.interface';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { PropertyToRanges } from '../models/propertyToRanges.interface';
import { RESTError } from '../models/RESTError.interface';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { VocabularyStuff } from '../models/vocabularyStuff.interface';
import { OntologyManagerService } from './ontologyManager.service';

describe('Ontology Manager service', function() {
    let service: OntologyManagerService;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    let vocabularyStuffObj: VocabularyStuff;
    let ontologyStuffObj: OntologyStuff;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

    const emptyObj: JSONLDObject = {'@id': 'test'};
    const selectQuery = 'select * where {?s ?p ?o}';
    const constructQuery = 'construct where {?s ?p ?o}';

    const recordId = 'recordId';
    const ontologyId = 'ontologyId';
    const ontologyId2 = 'ontologyId2';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const catalogId = 'catalogId';
    const format = 'jsonld';
    const file = new File([''], '');
    const title = 'title';
    const description = 'description';
    const keywords: string[] = ['keyword1', 'keyword2'];
    const error = 'error';
    const errorObject: RESTError = {
        errorMessage: 'error',
        errorDetails: [],
        error: ''
    };

    const classId = 'classId';
    const objectPropertyId = 'objectPropertyId';
    const dataPropertyId = 'dataPropertyId';
    const annotationId = 'annotationId';
    const individualId = 'individualId';
    const restrictionId = 'restrictionId';
    const blankNodeId = '_:genid0';
    const blankNodeObj: JSONLDObject = {
        '@id': blankNodeId
    };
    const usages: SPARQLSelectResults = {
        results: {
            bindings: []
        },
        head: {
            vars: [],
            link: []
        }
    };
    const conceptId = 'conceptId';
    const schemeId = 'schemeId';
    const derivedConceptType = 'derivedConcept';
    const derivedConceptSchemeType = 'derivedConceptScheme';
    const importedClassId = 'importedClassId';
    const importedDataPropertyId = 'importedDataPropertyId';
    const importedObjectPropertyId = 'importedObjectPropertyId';
    const importedAnnotationId = 'importedAnnotationId';
    const importedIndividualId = 'importedIndividualId';
    const importedRestrictionId = 'importedRestrictionId';
    const importedConceptId = 'importedConceptId';
    const importedSchemeId = 'importedSchemeId';
    const importedOntologyId = 'importedOntologyId';

    const ontologyObj = {
        '@id': ontologyId,
        '@type': [`${OWL}Ontology`, `${ONTOLOGYEDITOR}OntologyRecord`]
    };
    const classObj = {
        '@id': classId,
        '@type': [`${OWL}Class`]
    };
    const objectPropertyObj = {
        '@id': objectPropertyId,
        '@type': [`${OWL}ObjectProperty`],
        [`${RDFS}domain`]: [{'@id': classId}]
    };
    const dataPropertyObj = {
        '@id': dataPropertyId,
        '@type': [`${OWL}DatatypeProperty`]
    };
    const annotationObj = {
        '@id': annotationId,
        '@type': [`${OWL}AnnotationProperty`]
    };
    const individualObj = {
        '@id': individualId,
        '@type': [`${OWL}NamedIndividual`, classId]
    };
    const restrictionObj = {
        '@id': restrictionId,
        '@type': [`${OWL}Restriction`]
    };
    const conceptObj = {
        '@id': conceptId,
        '@type': [`${SKOS}Concept`]
    };
    const derivedConceptObj = {
        '@id': conceptId,
        '@type': [derivedConceptType]
    };
    const schemeObj = {
        '@id': schemeId,
        '@type': [`${SKOS}ConceptScheme`]
    };
    const derivedConceptSchemeObj = {
        '@id': schemeId,
        '@type': [derivedConceptSchemeType]
    };
    const ontology = [ontologyObj, classObj, dataPropertyObj];
    const importedOntObj = {
        '@id': importedOntologyId,
        '@type': [`${OWL}Ontology`]
    };
    const importedClassObj = {
        '@id': importedClassId,
        '@type': [`${OWL}Class`]
    };
    const importedDataPropertyObj = {
        '@id': importedDataPropertyId,
        '@type': [`${OWL}DatatypeProperty`]
    };
    const importedObjectPropertyObj = {
        '@id': importedObjectPropertyId,
        '@type': [`${OWL}ObjectProperty`],
        [`${RDFS}domain`]: [{'@id': importedClassId}]
    };
    const importedAnnotationObj = {
        '@id': importedAnnotationId,
        '@type': [`${OWL}AnnotationProperty`]
    };
    const importedIndividualObj = {
        '@id': importedIndividualId,
        '@type': [`${OWL}NamedIndividual`, importedClassId]
    };
    const importedRestrictionObj = {
        '@id': importedRestrictionId,
        '@type': [`${OWL}Restriction`]
    };
    const importedConceptObj = {
        '@id': importedConceptId,
        '@type': [`${SKOS}Concept`]
    };
    const importedSchemeObj = {
        '@id': importedSchemeId,
        '@type': [`${SKOS}ConceptScheme`]
    };
    const emptyIriList = {
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
    const emptyHierarchyResponse = {
        parentMap: {},
        childMap: {},
        circularMap: {}
    };
    const propertyToRangesObj: PropertyToRanges = {
        'propertyToRanges': {
            'urn:hasTopping': ['urn:PizzaTopping']
        }
    };
    const objQuery = OBJ_PROPERTY_VALUES_QUERY.replace('%PROPIRI%', objectPropertyId);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                OntologyManagerService,
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(PolicyEnforcementService)
            ]
        });

        service = TestBed.inject(OntologyManagerService);
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));

        catalogManagerStub.localCatalog = {'@id': catalogId};
        service.initialize();
        
        ontologyStuffObj = {
            ontologyIRI: ontologyId,
            propertyToRanges: propertyToRangesObj.propertyToRanges,
            iriList: Object.assign({}, emptyIriList),
            importedOntologies: [{ontologyId: ontologyId2, id: 'id'}],
            classHierarchy: Object.assign({}, emptyHierarchyResponse),
            individuals: {},
            dataPropertyHierarchy: Object.assign({}, emptyHierarchyResponse),
            objectPropertyHierarchy: Object.assign({}, emptyHierarchyResponse),
            annotationHierarchy: Object.assign({}, emptyHierarchyResponse),
            conceptHierarchy: Object.assign({}, emptyHierarchyResponse),
            conceptSchemeHierarchy: Object.assign({}, emptyHierarchyResponse),
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
            importedIRIs: [Object.assign({}, emptyIriList)],
            concepts: [],
            conceptSchemes: [],
            conceptHierarchy: Object.assign({}, emptyHierarchyResponse),
            conceptSchemeHierarchy: Object.assign({}, emptyHierarchyResponse)
        };

        progressSpinnerStub.track.and.callFake(ob => ob);
        progressSpinnerStub.trackedRequest.and.callFake((ob) => ob);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        catalogManagerStub = null;
        progressSpinnerStub = null;
        policyEnforcementStub = null;
    });

    describe('uploadOntology hits the proper endpoint', function() {
        describe('with a file', function() {
            beforeEach(function() {
                this.recordConfig = {
                    file, 
                    title, 
                    description, 
                    keywords
                };
            });
            it('with description and keywords', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId, recordId, branchId, commitId});
                    }, () => fail('Observable should have succeeded'));
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush({ontologyId, recordId, branchId, commitId});
            });
            it('with no description or keywords', function() {
                service.uploadOntology({file, title})
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId, recordId, branchId, commitId});
                    }, () => fail('Observable should have succeeded'));
                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(null);
                expect((request.request.body).getAll('keywords')).toEqual([]);
                request.flush({ontologyId, recordId, branchId, commitId});
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
                request.flush('', { status: 400, statusText: error });
            });
        });
        describe('with JSON-LD', function() {
            beforeEach(function() {
                this.recordConfig = {
                    jsonld: ontologyObj, 
                    title, 
                    description, 
                    keywords
                };
            });
            it('with description and keywords', function() {
                service.uploadOntology(this.recordConfig)
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId, recordId, branchId, commitId});
                    }, () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(this.recordConfig.description);
                expect((request.request.body).getAll('keywords')).toEqual(this.recordConfig.keywords);
                request.flush({ontologyId, recordId, branchId, commitId});
            });
            it('with no description or keywords', function() {
                service.uploadOntology({jsonld: [ontologyObj], title})
                    .subscribe(response => {
                        expect(response).toEqual({ontologyId, recordId, branchId, commitId});
                    }, () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                expect((request.request.body).get('description')).toEqual(null);
                expect((request.request.body).getAll('keywords')).toEqual([]);
                request.flush({ontologyId, recordId, branchId, commitId});
            });
            it('unless an error occurs', function() {
                service.uploadOntology({jsonld: [ontologyObj], title})
                    .subscribe(() => fail('Observable should have errored'), response => {
                        expect(response).toEqual(errorObject);
                    });

                const request = httpMock.expectOne({url: '/mobirest/ontologies', method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                expect((request.request.body).get('title')).toEqual(this.recordConfig.title);
                request.flush('', { status: 400, statusText: error });
            });
        });
    });
    describe('uploadOntology file not supported', function() {
        it('trig with title, description and keywords', async function() {
            const trigFile = new File([''], 'title.trig');
            await service.uploadOntology({file: trigFile, title, description, keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
        it('trig.zip with title, description and keywords', async function() {
            const trigFile = new File([''], 'title.trig.zip');
            await service.uploadOntology({file: trigFile, title, description, keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
        it('trig.gzip with title, description and keywords', async function() {
            const trigFile = new File([''], 'title.trig.gzip');
            await service.uploadOntology({file: trigFile, title, description, keywords})
                .subscribe(() => {
                    fail('Observable should have errored');
                }, errorObject => {
                    expect(errorObject).toEqual({'errorMessage': 'TriG data is not supported for ontology upload.', 'errorDetails': []});
                });
        });
    });
    describe('downloadOntology should call the window.open method properly', function() {
        beforeEach(function () {
            this.url = `/mobirest/ontologies/${encodeURIComponent(recordId)}`;
            spyOn(window, 'open');
        });
        it('with a format and no fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'turtle',
                    fileName: 'ontology',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle');
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('without a format or a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'ontology',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId);
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('with a format and fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'turtle',
                    fileName: 'fileName',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle', 'fileName');
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('without a format and with a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'fileName',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId, undefined, 'fileName');
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('without applying the inProgressCommit', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'turtle',
                    fileName: 'fileName',
                    applyInProgressCommit: false
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle', 'fileName', false);
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
    });
    describe('downloadOntology should not call the window.open method properly when permission is denied', function() {
        beforeEach(function () {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
            this.url = `/mobirest/ontologies/${encodeURIComponent(recordId)}`;
            spyOn(window, 'open');
        });
        it('with a format and no fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'turtle',
                    fileName: 'ontology',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle');
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('without a format or a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'ontology',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId);
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('with a format and fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'turtle',
                    fileName: 'fileName',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle', 'fileName');
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('without a format and with a fileName', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'jsonld',
                    fileName: 'fileName',
                    applyInProgressCommit: true
                }
            });
            service.downloadOntology(recordId, branchId, commitId, undefined, 'fileName');
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('without applying the inProgressCommit', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId,
                    commitId,
                    rdfFormat: 'turtle',
                    fileName: 'fileName',
                    applyInProgressCommit: false
                }
            });
            service.downloadOntology(recordId, branchId, commitId, 'turtle', 'fileName', false);
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
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
                    expect(data).toEqual(ontology);
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
            request.flush(ontology, {
                headers: new HttpHeaders({'Content-Type': 'application/json'})
            });
        });
    });
    describe('deleteOntologyBranch hits the proper endpoint', function() {
        it('successfully', function() {
            service.deleteOntologyBranch(recordId, branchId)
                .subscribe(() => {
                    expect(true).toBeTrue();
                }, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne(req => req.url === (`${service.prefix}/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}`) && req.method === 'DELETE');
            request.flush(200);
        });
        it('unless an error occurs', function() {
            service.deleteOntologyBranch(recordId, branchId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === (`${service.prefix}/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}`) && req.method === 'DELETE');
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

                const request = httpMock.expectOne(req => req.url === (`${service.prefix}/${encodeURIComponent(recordId)}/vocabulary-stuff`) && req.method === 'GET');

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

                const request = httpMock.expectOne(req => req.url === (`${service.prefix}/${encodeURIComponent(recordId)}/vocabulary-stuff`) && req.method === 'GET');

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
                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/ontology-stuff`) && req.method === 'GET');
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
                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/ontology-stuff`) && req.method === 'GET');
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
                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/ontology-stuff`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/property-ranges`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/property-ranges`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/iris`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getIris(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyIriList);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/iris`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyIriList);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/classes`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/classes`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/data-properties`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/data-properties`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/object-properties`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/object-properties`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-iris`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-iris`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([], { status: 204, statusText: 'No Data' });
        });
        it('successfully', function() {
            service.getImportedIris(recordId, branchId, commitId, this.applyInProgressCommit )
                .subscribe(response => {
                    expect(response).toEqual([emptyIriList]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-iris`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([emptyIriList]);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/class-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getClassHierarchies(recordId, branchId, commitId, this.applyInProgressCommit)
                .subscribe(response => {
                    expect(response).toEqual(emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/class-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush(emptyHierarchyResponse);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/classes-with-individuals`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/classes-with-individuals`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/data-property-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getDataPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/data-property-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyHierarchyResponse);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/object-property-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getObjectPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/object-property-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyHierarchyResponse);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/annotation-property-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getAnnotationPropertyHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/annotation-property-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyHierarchyResponse);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/concept-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getConceptHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/concept-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyHierarchyResponse);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/concept-scheme-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getConceptSchemeHierarchies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyHierarchyResponse);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/concept-scheme-hierarchies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush(emptyHierarchyResponse);
        });
    });
    describe('getImportedOntologies should call the proper functions', function() {
        it('when get succeeds', function() {
            const ontDoc: OntologyDocument = {
                documentFormat: '',
                id: '',
                ontologyId: '',
                ontology
            };
            service.getImportedOntologies(recordId, branchId, commitId, 'jsonld', true)
                .subscribe(response => {
                    expect(response).toEqual([ontDoc]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-ontologies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');
            request.flush([ontDoc]);
        });
        it('when get is empty', function() {
            service.getImportedOntologies(recordId, branchId, commitId, 'jsonld', true)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-ontologies`) && req.method === 'GET');
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
            
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-ontologies`) && req.method === 'GET');
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
                
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-ontologies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('true');

            request.flush('flush', { status: 400, statusText: error });
        });
        it('when apply-in-progress is not passed in', function () {
            const ontDoc: OntologyDocument = {
                documentFormat: '',
                id: '',
                ontologyId: '',
                ontology
            };
            service.getImportedOntologies(recordId, branchId, commitId)
                .subscribe(response => {
                    expect(response).toEqual([ontDoc]);
                }, () => {
                    fail('Observable should have succeeded');
                });

            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/imported-ontologies`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('rdfFormat')).toEqual('jsonld');
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            request.flush([ontDoc]);
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
                    const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entity-usages/${classId}`) && req.method === 'GET');
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect((request.request.params).get('commitId')).toEqual(commitId);
                    expect((request.request.params).get('queryType')).toEqual('select');
                    request.flush(usages);
                });
                it('and queryType is construct', function() {
                    service.getEntityUsages(recordId, branchId, commitId, classId, 'construct')
                        .subscribe(response => {
                            expect(response).toEqual([emptyObj]);
                        }, () => {
                            fail('Observable should have succeeded');
                        });
                    const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entity-usages/${classId}`) && req.method === 'GET');
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect((request.request.params).get('commitId')).toEqual(commitId);
                    expect((request.request.params).get('queryType')).toEqual('construct');
                    request.flush([emptyObj]);
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
                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entity-usages/${classId}`) && req.method === 'GET');
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

            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entity-names`) && req.method === 'POST');

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
                
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entity-names`) && req.method === 'POST');

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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/search-results`) && req.method === 'GET');
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

            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/search-results`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/search-results`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/search-results`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('searchText')).toEqual('searchText');
    
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getQueryResults calls the correct functions when GET /mobirest/ontologies/{recordId}/query', function() {
        describe('succeeds', function() {
            it('and returns JSON-LD', function() {
                const resp: JSONLDObject[] = [{'@id': 'id'}];
                service.getQueryResults(recordId, branchId, commitId, constructQuery, format)
                    .subscribe(response => expect(response).toEqual(resp),
                        () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'GET');
                expect((request.request.params).get('query')).toEqual(constructQuery);
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
                expect((request.request.params).get('includeImports').toString()).toEqual('true');
                expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
                request.flush(resp, {
                    headers: new HttpHeaders({'Content-Type': 'application/ld+json'})
                });
            });
            it('and returns JSON', function() {
                const resp: SPARQLSelectResults = {
                    head: {
                        vars: [],
                        link: []
                    },
                    results: {
                        bindings: []
                    }
                };
                service.getQueryResults(recordId, branchId, commitId, selectQuery, 'application/json')
                    .subscribe(response => expect(response).toEqual(resp),
                        () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'GET');
                expect((request.request.params).get('query')).toEqual(selectQuery);
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
                expect((request.request.params).get('includeImports').toString()).toEqual('true');
                expect(request.request.headers.get('Accept')).toEqual('application/json');
                request.flush(resp, {
                    headers: new HttpHeaders({'Content-Type': 'application/json'})
                });
            });
            it('and returns a RDF string', function() {
                const resp = '<urn:Subject> <urn:Predicate> "Object" .';
                service.getQueryResults(recordId, branchId, commitId, selectQuery, 'turtle')
                    .subscribe(response => expect(response).toEqual(resp),
                        () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'GET');
                expect((request.request.params).get('query')).toEqual(selectQuery);
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
                expect((request.request.params).get('includeImports').toString()).toEqual('true');
                expect(request.request.headers.get('Accept')).toEqual('text/turtle');
                request.flush(resp, {
                    headers: new HttpHeaders({'Content-Type': 'text/turtle'})
                });
            });
        });
        it('fails', function() {
            service.getQueryResults(recordId, branchId, commitId, selectQuery, format)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'GET');
            expect((request.request.params).get('query')).toEqual(selectQuery);
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('postQueryResults calls the correct functions when POST /mobirest/ontologies/{recordId}/query', function() {
        describe('succeeds', function() {
            it('and returns JSON-LD', function() {
                const resp: JSONLDObject[] = [{'@id': 'id'}];
                service.postQueryResults(recordId, branchId, commitId, constructQuery, format)
                    .subscribe(response => expect(response).toEqual(resp),
                        () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
                expect(request.request.body).toEqual(constructQuery);
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
                expect((request.request.params).get('includeImports').toString()).toEqual('true');
                expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(resp, {
                    headers: new HttpHeaders({'Content-Type': 'application/ld+json'})
                });
            });
            it('and returns JSON', function() {
                const resp: SPARQLSelectResults = {
                  head: {
                    vars: [],
                    link: []
                  },
                  results: {
                    bindings: []
                  }
                };
                service.postQueryResults(recordId, branchId, commitId, selectQuery, 'application/json')
                    .subscribe(response => expect(response).toEqual(resp),
                        () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
                expect(request.request.body).toEqual(selectQuery);
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
                expect((request.request.params).get('includeImports').toString()).toEqual('true');
                expect(request.request.headers.get('Accept')).toEqual('application/json');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(resp, {
                    headers: new HttpHeaders({'Content-Type': 'application/json'})
                });
            });
            it('and returns a RDF string', function() {
                const resp = '<urn:Subject> <urn:Predicate> "Object" .';
                service.postQueryResults(recordId, branchId, commitId, selectQuery, 'turtle')
                    .subscribe(response => expect(response).toEqual(resp),
                        () => fail('Observable should have succeeded'));

                const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
                expect(request.request.body).toEqual(selectQuery);
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect((request.request.params).get('commitId')).toEqual(commitId);
                expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
                expect((request.request.params).get('includeImports').toString()).toEqual('true');
                expect(request.request.headers.get('Accept')).toEqual('text/turtle');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(resp, {
                    headers: new HttpHeaders({'Content-Type': 'text/turtle'})
                });
            });
        });
        it('fails', function() {
            service.postQueryResults(recordId, branchId, commitId, selectQuery, format)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
            expect(request.request.body).toEqual(selectQuery);
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
            expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('postQueryResults calls the correct functions when POST /mobirest/ontologies/{recordId}/query', function() {
        beforeEach(function() {
            this.query = 'select * where {?s ?p ?o}';
        });
        it('succeeds', function() {
            service.postQueryResults(recordId, branchId, commitId, this.query, format)
                .subscribe(response => expect(response).toEqual([{'@id': 'id'}]),
                    () => fail('Observable should have succeeded'));

            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
            expect(request.request.body).toEqual(this.query);
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
            expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
            request.flush([{'@id': 'id'}], {
                headers: new HttpHeaders({'Content-Type': 'application/json'})
            });
        });
        it('fails', function() {
            service.postQueryResults(recordId, branchId, commitId, this.query, format)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
            expect(request.request.body).toEqual(this.query);
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            expect((request.request.params).get('applyInProgressCommit').toString()).toEqual('false');
            expect((request.request.params).get('includeImports').toString()).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/ld+json');
    
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('should download query results', function() {
        beforeEach(function() {
            spyOn(window, 'open');
        });
        it('with only required fields', function() {
            const aSpy = jasmine.createSpyObj('a', ['click']);
            spyOn(document, 'createElement').and.returnValue(aSpy);
            const expectedResult: ArrayBuffer = new ArrayBuffer(8);
            service.downloadResultsPost(selectQuery, 'csv', 'filename', recordId, commitId)
                .subscribe(response => {
                    expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                    expect(response).toEqual(expectedResult);
                    expect(document.createElement).toHaveBeenCalledWith('a');
                    expect(aSpy.href).toBeTruthy();
                    expect(aSpy.target).toEqual('_blank');
                    expect(aSpy.download).toEqual('filename');
                    expect(aSpy.click).toHaveBeenCalledWith();
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
            expect(request.request.body).toEqual(selectQuery);
            expect(request.request.params.get('fileType')).toEqual('csv');
            expect(request.request.params.get('fileName')).toEqual('filename');
            expect(request.request.params.get('commitId')).toEqual(commitId);
            expect(request.request.params.get('applyInProgressCommit')).toEqual('true');
            expect(request.request.params.get('includeImports')).toEqual('false');
            expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
            expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
            request.flush(expectedResult);
        });
        it('with optional fields', function() {
            const aSpy = jasmine.createSpyObj('a', ['click']);
            spyOn(document, 'createElement').and.returnValue(aSpy);
            const expectedResult: ArrayBuffer = new ArrayBuffer(8);
            service.downloadResultsPost(selectQuery, 'csv', 'filename', recordId, commitId, false, true)
                .subscribe(response => {
                    expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                    expect(response).toEqual(expectedResult);
                    expect(document.createElement).toHaveBeenCalledWith('a');
                    expect(aSpy.href).toBeTruthy();
                    expect(aSpy.target).toEqual('_blank');
                    expect(aSpy.download).toEqual('filename');
                    expect(aSpy.click).toHaveBeenCalledWith();
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'POST');
            expect(request.request.body).toEqual(selectQuery);
            expect(request.request.params.get('fileType')).toEqual('csv');
            expect(request.request.params.get('fileName')).toEqual('filename');
            expect(request.request.params.get('commitId')).toEqual(commitId);
            expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
            expect(request.request.params.get('includeImports')).toEqual('true');
            expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
            expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
            request.flush(expectedResult);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/failed-imports`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/failed-imports`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('commitId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getObjectPropertyValues calls the correct functions when GET /mobirest/ontologies/{recordId}/query', function() {
        it('succeeds', function() {
            service.getObjectPropertyValues(recordId, branchId, objectPropertyId)
                .subscribe(response => {
                    expect(response).toEqual(usages);
                }, () => {
                    fail('Observable should have succeeded');
                });
            const request = httpMock.expectOne(req =>
                req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('query')).toEqual(objQuery);
            expect((request.request.params).get('applyInProgressCommit')).toBe('true');
            request.flush(usages);
        });
        it('fails', function() {
            service.getObjectPropertyValues(recordId, branchId, objectPropertyId)
                .subscribe(() => {
                    fail('Observable should have errored');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req =>
                req.url === (`/mobirest/ontologies/${recordId}/query`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect((request.request.params).get('query')).toEqual(objQuery);
            expect((request.request.params).get('applyInProgressCommit')).toBe('true');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entities/${classId}`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entities/${classId}`) && req.method === 'GET');
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/entities/${classId}`) && req.method === 'GET');
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
            expect(service.isOntology(ontologyObj)).toBeTrue();
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(service.isOntology(emptyObj)).toBeFalse();
        });
    });
    describe('isOntologyRecord should return', function() {
        it('true if the entity contains the ontology type', function() {
            expect(service.isOntologyRecord(ontologyObj)).toBeTrue();
        });
        it('false if the entity does not contain the ontology type', function() {
            expect(service.isOntologyRecord(emptyObj)).toBeFalse();
        });
    });
    describe('hasOntologyEntity should return', function() {
        it('true if there is an ontology entity in the ontology', function() {
            expect(service.hasOntologyEntity([ontologyObj])).toBeTrue();
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(service.hasOntologyEntity([])).toBeFalse();
        });
    });
    describe('getOntologyEntity should return', function() {
        it('correct object if there is an ontology entity in the ontology', function() {
            expect(service.getOntologyEntity([ontologyObj])).toBe(ontologyObj);
        });
        it('undefined if there is not an ontology entity in the ontology', function() {
            expect(service.getOntologyEntity([])).toBe(undefined);
        });
    });
    describe('getOntologyIRI should return', function() {
        it('@id if there is an ontology entity in the ontology with @id', function() {
            expect(service.getOntologyIRI([ontologyObj])).toBe(ontologyId);
        });
        it('"" if none are present or no ontology entity', function() {
            expect(service.getOntologyIRI([])).toBe('');
        });
    });
    describe('isDatatype should return', function() {
        it('true if the entity contains the datatype type', function() {
            expect(service.isDatatype({'@id': 'urn:testid', '@type': [`${RDFS}Datatype`]})).toBeTrue();
        });
        it('false if the entity does not contain the datatype type', function() {
            expect(service.isDatatype(emptyObj)).toBeFalse();
        });
    });
    describe('isClass should return', function() {
        it('true if the entity contains the class type', function() {
            expect(service.isClass(classObj)).toBeTrue();
        });
        it('false if the entity does not contain the class type', function() {
            expect(service.isClass(emptyObj)).toBeFalse();
        });
    });
    describe('hasClasses should return', function() {
        it('true if there are any class entities in the ontology', function() {
            expect(service.hasClasses([[classObj, ontologyObj], [importedClassObj, importedOntObj]])).toBeTrue();
        });
        it('true if there are class entities only in the ontology', function() {
            expect(service.hasClasses([[classObj, ontologyObj], [importedOntObj]])).toBeTrue();
        });
        it('true if there are class entities only in the imported ontology', function() {
            expect(service.hasClasses([[ontologyObj], [importedClassObj, importedOntObj]])).toBeTrue();
        });
        it('false if there are not any class entities in the ontology', function() {
            expect(service.hasClasses([[ontologyObj], [importedOntObj]])).toBeFalse();
        });
    });
    describe('getClasses should return', function() {
        it('correct class objects if there are any in the ontology', function() {
            expect(service.getClasses([[classObj, ontologyObj],[importedClassObj, importedOntObj]])).toEqual([classObj, importedClassObj]);
        });
        it('correct class objects if there are any only in the ontology', function() {
            expect(service.getClasses([[classObj, ontologyObj], [importedOntObj]])).toEqual([classObj]);
        });
        it('correct class objects if there are any only in the imported ontology', function() {
            expect(service.getClasses([[ontologyObj], [importedClassObj, importedOntObj]])).toEqual([importedClassObj]);
        });
        it('correct class objects if there are duplicates', function() {
            expect(service.getClasses([[classObj, ontologyObj],[classObj, importedOntObj]])).toEqual([classObj]);
        });
        it('undefined if there are no classes in the ontology', function() {
            expect(service.getClasses([[ontologyObj],[importedOntObj]])).toEqual([]);
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
            const request = httpMock.expectOne(req => req.url === (`/mobirest/ontologies/${recordId}/group-query`) && req.method === 'GET');
            expect(request.request.params.get('branchId')).toEqual(branchId);
            expect(request.request.params.get('commitId')).toEqual(commitId);
            expect(request.request.params.get('limit')).toEqual('0');
            request.flush({});
        });
    });
    describe('getClassIRIs should return', function() {
        it('classId if there are classes in the ontology', function() {
            expect(service.getClassIRIs([[ontologyObj, classObj],[importedOntObj, importedClassObj]])).toEqual([classId, importedClassId]);
        });
        it('classId if there are classes only in the ontology', function() {
            expect(service.getClassIRIs([[ontologyObj, classObj],[importedOntObj]])).toEqual([classId]);
        });
        it('classId if there are classes only in the imported ontology', function() {
            expect(service.getClassIRIs([[ontologyObj],[importedOntObj, importedClassObj]])).toEqual([importedClassId]);
        });
        it('classId if there are duplicates', function() {
            expect(service.getClassIRIs([[ontologyObj, classObj],[importedOntObj, classObj]])).toEqual([classId]);
        });
        it('[] if there are no classes in the ontology', function() {
            expect(service.getClassIRIs([[ontologyObj],[importedOntObj]])).toEqual([]);
        });
    });
    describe('hasClassProperties should return', function() {
        it('true if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.hasClassProperties([[classObj, ontologyObj, objectPropertyObj], [importedClassObj, importedOntObj, importedObjectPropertyObj]], classId)).toBeTrue();
        });
        it('true if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.hasClassProperties([[classObj, ontologyObj], [importedClassObj, importedOntObj, importedObjectPropertyObj]], importedClassId)).toBeTrue();
        });
        it('false if there is not an ontology entity in the ontology', function() {
            expect(service.hasClassProperties([[classObj, ontologyObj],[importedClassObj, importedOntObj]], classId)).toBeFalse();
        });
        it('true if a property has multiple domains', function() {
            const objectPropertyObjClone = cloneDeep(objectPropertyObj);
            (objectPropertyObjClone[`${RDFS}domain`] as {'@id': string}[]).push({'@id': importedClassId});
            expect(service.hasClassProperties([[classObj, importedClassObj, ontologyObj, objectPropertyObjClone]], classId)).toBeTrue();
        });
    });
    describe('getClassProperties should return', function() {
        it('correct objects if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassProperties([[classObj, ontologyObj, objectPropertyObj], [importedClassObj, importedOntObj, importedObjectPropertyObj]], classId)).toEqual([objectPropertyObj]);
        });
        it('correct objects if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.getClassProperties([[classObj, ontologyObj, objectPropertyObj], [importedClassObj, importedOntObj, importedObjectPropertyObj]], importedClassId)).toEqual([importedObjectPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(service.getClassProperties([[classObj, ontologyObj, objectPropertyObj], [classObj, importedOntObj, objectPropertyObj]], classId)).toEqual([objectPropertyObj]);
        });
        it('[] if there are no entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassProperties([[classObj, ontologyObj], [importedClassObj, importedOntObj]], classId)).toEqual([]);
        });
        it('correct objects if a property has multiple domains', function() {
            const objectPropertyObjClone = cloneDeep(objectPropertyObj);
            (objectPropertyObjClone[`${RDFS}domain`] as {'@id': string}[]).push({'@id': importedClassId});
            expect(service.getClassProperties([[classObj, importedClassObj, ontologyObj, objectPropertyObjClone]], classId)).toEqual([objectPropertyObjClone]);
        });
    });
    describe('getClassPropertyIRIs should return', function() {
        it('correct IRIs if there are any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassPropertyIRIs([[classObj, ontologyObj, objectPropertyObj], [importedClassObj, importedOntObj, importedObjectPropertyObj]], classId)).toEqual([objectPropertyId]);
        });
        it('correct IRIs if there are any entities with a domain of the provided class in the imported ontology', function() {
            expect(service.getClassPropertyIRIs([[classObj, ontologyObj, objectPropertyObj], [importedClassObj, importedOntObj, importedObjectPropertyObj]], importedClassId)).toEqual([importedObjectPropertyId]);
        });
        it('correct IRIs if there are duplicates', function() {
            expect(service.getClassPropertyIRIs([[classObj, ontologyObj, objectPropertyObj], [classObj, importedOntObj, objectPropertyObj]], classId)).toEqual([objectPropertyId]);
        });
        it('[] if there are not any entities with a domain of the provided class in the ontology', function() {
            expect(service.getClassPropertyIRIs([[classObj, ontologyObj], [importedClassObj, importedOntObj]], classId)).toEqual([]);
        });
        it('correct IRIs if a property has multiple domains', function() {
            const objectPropertyObjClone = cloneDeep(objectPropertyObj);
            (objectPropertyObjClone[`${RDFS}domain`] as {'@id': string}[]).push({'@id': importedClassId});
            expect(service.getClassPropertyIRIs([[classObj, importedClassObj, ontologyObj, objectPropertyObjClone]], classId)).toEqual([objectPropertyId]);
        });
    });
    describe('isObjectProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(service.isObjectProperty(objectPropertyObj)).toBeTrue();
        });
        it('false if the entity does not contain the object property type', function() {
            expect(service.isObjectProperty(emptyObj)).toBeFalse();
        });
    });
    describe('isDataTypeProperty should return', function() {
        it('true if the entity contains the data property type', function() {
            expect(service.isDataTypeProperty(dataPropertyObj)).toBeTrue();
        });
        it('false if the entity does not contain the data property type', function() {
            expect(service.isDataTypeProperty(emptyObj)).toBeFalse();
        });
    });
    describe('isProperty should return', function() {
        it('true if the entity contains the object property type', function() {
            expect(service.isProperty(objectPropertyObj)).toBeTrue();
        });
        it('true if the entity contains the data property type', function() {
            expect(service.isProperty(dataPropertyObj)).toBeTrue();
        });
        it('false if the entity does not contain the object or data property type', function() {
            expect(service.isProperty(emptyObj)).toBeFalse();
        });
    });
    describe('hasNoDomainProperties should return', function() {
        it('true if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.hasNoDomainProperties([[ontologyObj, dataPropertyObj], [importedOntObj, importedDataPropertyObj]])).toBeTrue();
        });
        it('true if only the ontology contains a property without the rdfs:domain set', function() {
            expect(service.hasNoDomainProperties([[ontologyObj, dataPropertyObj], [importedOntObj, importedObjectPropertyObj]])).toBeTrue();
        });
        it('true if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.hasNoDomainProperties([[ontologyObj, objectPropertyObj], [importedOntObj, importedDataPropertyObj]])).toBeTrue();
        });
        it('false if the ontology does not contain any properties', function() {
            expect(service.hasNoDomainProperties([[ontologyObj], [importedOntObj]])).toBeFalse();
        });
        it('false if the ontology does not contain any properties without rdfs:domains', function() {
            expect(service.hasNoDomainProperties([[ontologyObj, objectPropertyObj], [importedOntObj, importedObjectPropertyObj]])).toBeFalse();
        });
    });
    describe('getNoDomainProperties should return', function() {
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainProperties([[ontologyObj, dataPropertyObj], [importedOntObj, importedDataPropertyObj]])).toEqual([dataPropertyObj, importedDataPropertyObj]);
        });
        it('correct object if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainProperties([[ontologyObj, dataPropertyObj], [importedOntObj]])).toEqual([dataPropertyObj]);
        });
        it('correct object if the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainProperties([[ontologyObj], [importedOntObj, importedDataPropertyObj]])).toEqual([importedDataPropertyObj]);
        });
        it('correct objects if there are duplicates', function() {
            expect(service.getNoDomainProperties([[dataPropertyObj, ontologyObj], [dataPropertyObj, importedOntObj]])).toEqual([dataPropertyObj]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(service.getNoDomainProperties([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(service.getNoDomainProperties([[ontologyObj, objectPropertyObj], [importedOntObj, importedObjectPropertyObj]])).toEqual([]);
        });
    });
    describe('getNoDomainPropertyIRIs should return', function() {
        it('correct IRI if the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[ontologyObj, dataPropertyObj], [importedOntObj, importedDataPropertyObj]])).toEqual([dataPropertyId, importedDataPropertyId]);
        });
        it('correct IRI if only the ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[ontologyObj, dataPropertyObj], [importedOntObj, importedObjectPropertyObj]])).toEqual([dataPropertyId]);
        });
        it('correct IRI if only the imported ontology contains a property without the rdfs:domain set', function() {
            expect(service.getNoDomainPropertyIRIs([[ontologyObj, objectPropertyObj], [importedOntObj, importedDataPropertyObj]])).toEqual([importedDataPropertyId]);
        });
        it('correct IRI if there are duplicates', function() {
            expect(service.getNoDomainPropertyIRIs([[ontologyObj, dataPropertyObj], [dataPropertyObj, importedOntObj]])).toEqual([dataPropertyId]);
        });
        it('[] if the ontology does not contain any properties', function() {
            expect(service.getNoDomainPropertyIRIs([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
        it('[] if the ontology does not contain any properties without rdfs:domains', function() {
            expect(service.getNoDomainPropertyIRIs([[ontologyObj, objectPropertyObj], [importedOntObj, importedObjectPropertyObj]])).toEqual([]);
        });
    });
    describe('hasObjectProperties should return', function() {
        it('true if there are any object property entities in the ontology', function() {
            expect(service.hasObjectProperties([[objectPropertyObj, ontologyObj], [importedObjectPropertyObj, importedOntObj]])).toBeTrue();
        });
        it('true if there are any object property entities only in the ontology', function() {
            expect(service.hasObjectProperties([[objectPropertyObj, ontologyObj], [importedOntObj]])).toBeTrue();
        });
        it('true if there are any object property entities only in the imported ontology', function() {
            expect(service.hasObjectProperties([[ontologyObj], [importedObjectPropertyObj, importedOntObj]])).toBeTrue();
        });
        it('false if there are not any object property entities in the ontology', function() {
            expect(service.hasObjectProperties([[ontologyObj], [importedOntObj]])).toBeFalse();
        });
    });
    describe('getObjectProperties should return', function() {
        it('correct object property objects if there are any in the ontology', function() {
            expect(service.getObjectProperties([[objectPropertyObj, ontologyObj], [importedObjectPropertyObj, importedOntObj]])).toEqual([objectPropertyObj, importedObjectPropertyObj]);
        });
        it('correct object property objects if there are any only in the ontology', function() {
            expect(service.getObjectProperties([[objectPropertyObj, ontologyObj], [importedOntObj]])).toEqual([objectPropertyObj]);
        });
        it('correct object property objects if there are any only in the imported ontology', function() {
            expect(service.getObjectProperties([[ontologyObj], [importedObjectPropertyObj, importedOntObj]])).toEqual([importedObjectPropertyObj]);
        });
        it('correct object property objects if there are duplicates', function() {
            expect(service.getObjectProperties([[objectPropertyObj, ontologyObj], [objectPropertyObj, importedOntObj]])).toEqual([objectPropertyObj]);
        });
        it('undefined if there are no object properties in the ontology', function() {
            expect(service.getObjectProperties([[ontologyObj],[importedOntObj]])).toEqual([]);
        });
    });
    describe('getObjectPropertyIRIs should return', function() {
        it('objectPropertyId if there are object properties in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[ontologyObj, objectPropertyObj], [importedObjectPropertyObj, importedOntObj]])).toEqual([objectPropertyId, importedObjectPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[ontologyObj, objectPropertyObj], [importedOntObj]])).toEqual([objectPropertyId]);
        });
        it('objectPropertyId if there are object properties only in the imported ontology', function() {
            expect(service.getObjectPropertyIRIs([[ontologyObj], [importedObjectPropertyObj, importedOntObj]])).toEqual([importedObjectPropertyId]);
        });
        it('objectPropertyId if there are duplicates', function() {
            expect(service.getObjectPropertyIRIs([[ontologyObj, objectPropertyObj], [objectPropertyObj, importedOntObj]])).toEqual([objectPropertyId]);
        });
        it('[] if there are no object properties in the ontology', function() {
            expect(service.getObjectPropertyIRIs([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('hasDataTypeProperties should return', function() {
        it('true if there are any data property entities in the ontology', function() {
            expect(service.hasDataTypeProperties([[dataPropertyObj, ontologyObj], [importedDataPropertyObj, importedOntObj]])).toBeTrue();
        });
        it('true if there are any data property entities only in the ontology', function() {
            expect(service.hasDataTypeProperties([[dataPropertyObj, ontologyObj], [importedOntObj]])).toBeTrue();
        });
        it('true if there are any data property entities only in the imported ontology', function() {
            expect(service.hasDataTypeProperties([[ontologyObj], [importedDataPropertyObj, importedOntObj]])).toBeTrue();
        });
        it('false if there are not any data property entities in the ontology', function() {
            expect(service.hasDataTypeProperties([[ontologyObj], [importedOntObj]])).toBeFalse();
        });
    });
    describe('getDataTypeProperties should return', function() {
        it('correct data property objects if there are any in the ontology', function() {
            expect(service.getDataTypeProperties([[dataPropertyObj, ontologyObj], [importedDataPropertyObj, importedOntObj]])).toEqual([dataPropertyObj, importedDataPropertyObj]);
        });
        it('correct data property objects if there are any only in the ontology', function() {
            expect(service.getDataTypeProperties([[dataPropertyObj, ontologyObj], [importedOntObj]])).toEqual([dataPropertyObj]);
        });
        it('correct data property objects if there are any only in the imported ontology', function() {
            expect(service.getDataTypeProperties([[ontologyObj], [importedDataPropertyObj, importedOntObj]])).toEqual([importedDataPropertyObj]);
        });
        it('correct data property objects if there are duplicates', function() {
            expect(service.getDataTypeProperties([[dataPropertyObj, ontologyObj], [dataPropertyObj, importedOntObj]])).toEqual([dataPropertyObj]);
        });
        it('undefined if there are no data properties in the ontology', function() {
            expect(service.getDataTypeProperties([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('getDataTypePropertyIRIs should return', function() {
        it('dataPropertyId if there are data properties in the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[ontologyObj, dataPropertyObj], [importedDataPropertyObj, importedOntObj]])).toEqual([dataPropertyId, importedDataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[ontologyObj, dataPropertyObj], [importedOntObj]])).toEqual([dataPropertyId]);
        });
        it('dataPropertyId if there are data properties in only the imported ontology', function() {
            expect(service.getDataTypePropertyIRIs([[ontologyObj], [importedDataPropertyObj, importedOntObj]])).toEqual([importedDataPropertyId]);
        });
        it('dataPropertyId if there are duplicates', function() {
            expect(service.getDataTypePropertyIRIs([[ontologyObj, dataPropertyObj], [dataPropertyObj, importedOntObj]])).toEqual([dataPropertyId]);
        });
        it('[] if there are no data properties in the ontology', function() {
            expect(service.getDataTypePropertyIRIs([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('isAnnotation should return', function() {
        it('true if the entity contains the annotation property type', function() {
            expect(service.isAnnotation(annotationObj)).toBeTrue();
        });
        it('false if the entity does not contain the annotation property type', function() {
            expect(service.isAnnotation(emptyObj)).toBeFalse();
        });
    });
    describe('hasAnnotations should return', function() {
        it('true if there are any annotation entities in the ontology', function() {
            expect(service.hasAnnotations([[annotationObj, ontologyObj], [importedAnnotationObj, importedOntObj]])).toBeTrue();
        });
        it('true if there are any annotation entities in only the ontology', function() {
            expect(service.hasAnnotations([[annotationObj, ontologyObj], [importedOntObj]])).toBeTrue();
        });
        it('true if there are any annotation entities in only the imported ontology', function() {
            expect(service.hasAnnotations([[ontologyObj], [importedAnnotationObj, importedOntObj]])).toBeTrue();
        });
        it('false if there are not any annotation entities in the ontology', function() {
            expect(service.hasAnnotations([[ontologyObj], [importedOntObj]])).toBeFalse();
        });
    });
    describe('getAnnotations should return', function() {
        it('correct annotation objects if there are any in the ontology', function() {
            expect(service.getAnnotations([[annotationObj, ontologyObj], [importedAnnotationObj, importedOntObj]])).toEqual([annotationObj, importedAnnotationObj]);
        });
        it('correct annotation objects if there are any in only the ontology', function() {
            expect(service.getAnnotations([[annotationObj, ontologyObj], [importedOntObj]])).toEqual([annotationObj]);
        });
        it('correct annotation objects if there are any in only the imported ontology', function() {
            expect(service.getAnnotations([[ontologyObj], [importedAnnotationObj, importedOntObj]])).toEqual([importedAnnotationObj]);
        });
        it('correct annotation objects if there are duplicates', function() {
            expect(service.getAnnotations([[annotationObj, ontologyObj], [annotationObj, importedOntObj]])).toEqual([annotationObj]);
        });
        it('undefined if there are no annotations in the ontology', function() {
            expect(service.getAnnotations([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('getAnnotationIRIs should return', function() {
        it('annotationId if there are annotations in the ontology', function() {
            expect(service.getAnnotationIRIs([[ontologyObj, annotationObj], [importedAnnotationObj, importedOntObj]])).toEqual([annotationId, importedAnnotationId]);
        });
        it('annotationId if there are annotations in only the ontology', function() {
            expect(service.getAnnotationIRIs([[ontologyObj, annotationObj], [importedOntObj]])).toEqual([annotationId]);
        });
        it('annotationId if there are annotations in only the imported ontology', function() {
            expect(service.getAnnotationIRIs([[ontologyObj], [importedAnnotationObj, importedOntObj]])).toEqual([importedAnnotationId]);
        });
        it('annotationId if there are duplicates', function() {
            expect(service.getAnnotationIRIs([[ontologyObj, annotationObj], [annotationObj, importedOntObj]])).toEqual([annotationId]);
        });
        it('[] if there are no annotations in the ontology', function() {
            expect(service.getAnnotationIRIs([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('isNamedIndividual should return', function() {
        it('true if the entity contains the named individual type', function() {
            expect(service.isNamedIndividual(individualObj)).toBeTrue();
        });
        it('false if the entity does not contain the named individual type', function() {
            expect(service.isNamedIndividual(emptyObj)).toBeFalse();
        });
    });
    describe('isIndividual should return', function() {
        it('true if the entity does not contain any OWL type', function() {
            expect(service.isIndividual({'@id': 'urn:testid', '@type': ['urn:test']})).toBeTrue();
        });
        it('false if the entity does contain OWL type', function() {
            [
                `${OWL}Class`,
                `${OWL}DatatypeProperty`,
                `${OWL}ObjectProperty`,
                `${OWL}AnnotationProperty`,
                `${OWL}Datatype`,
                `${OWL}Ontology`
            ].forEach(type => {
                expect(service.isIndividual({'@id': 'urn:testid', '@type': [type]})).toBeFalse();
            });
        });
    });
    describe('hasIndividuals should return', function() {
        it('true if there are any individual entities in the ontology', function() {
            expect(service.hasIndividuals([[individualObj, ontologyObj], [importedIndividualObj, importedOntObj]])).toBeTrue();
        });
        it('true if there are any individual entities in only the ontology', function() {
            expect(service.hasIndividuals([[individualObj, ontologyObj], [importedOntObj]])).toBeTrue();
        });
        it('true if there are any individual entities in only the imported ontology', function() {
            expect(service.hasIndividuals([[ontologyObj], [importedIndividualObj, importedOntObj]])).toBeTrue();
        });
        it('false if there are not any individual entities in the ontology', function() {
            expect(service.hasIndividuals([[ontologyObj], [importedOntObj]])).toBeFalse();
        });
    });
    describe('getIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology', function() {
            expect(service.getIndividuals([[individualObj, ontologyObj], [importedIndividualObj, importedOntObj]])).toEqual([individualObj, importedIndividualObj]);
        });
        it('correct individual objects if there are any in only the ontology', function() {
            expect(service.getIndividuals([[individualObj, ontologyObj], [importedOntObj]])).toEqual([individualObj]);
        });
        it('correct individual objects if there are any in only the imported ontology', function() {
            expect(service.getIndividuals([[ontologyObj], [importedIndividualObj, importedOntObj]])).toEqual([importedIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            expect(service.getIndividuals([[individualObj, ontologyObj], [individualObj, importedOntObj]])).toEqual([individualObj]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(service.getIndividuals([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('hasNoTypeIndividuals should return', function() {
        it('true if there are any in the ontology with no other @type', function() {
            const diffIndividualObj = {
                '@id': individualId,
                '@type': [`${OWL}NamedIndividual`]
            };
            expect(service.hasNoTypeIndividuals([[diffIndividualObj, ontologyObj]])).toBeTrue();
        });
        it('false if there are no individuals in the ontology with no other @type', function() {
            expect(service.hasNoTypeIndividuals([[ontologyObj, individualObj]])).toBeFalse();
        });
        it('false if there are no individuals in the ontology', function() {
            expect(service.hasNoTypeIndividuals([[ontologyObj]])).toBeFalse();
        });
    });
    describe('getNoTypeIndividuals should return', function() {
        it('correct individual objects if there are any in the ontology with no other @type', function() {
            const diffIndividualObj = {
                '@id': individualId,
                '@type': [`${OWL}NamedIndividual`]
            };
            expect(service.getNoTypeIndividuals([[diffIndividualObj, ontologyObj]])).toEqual([diffIndividualObj]);
        });
        it('correct individual objects if there are duplicates', function() {
            const diffIndividualObj = {
                '@id': individualId,
                '@type': [`${OWL}NamedIndividual`]
            };
            expect(service.getNoTypeIndividuals([[diffIndividualObj, ontologyObj], [diffIndividualObj, importedOntObj]])).toEqual([diffIndividualObj]);
        });
        it('undefined if there are no individuals in the ontology with no other @type', function() {
            expect(service.getNoTypeIndividuals([[ontologyObj, individualObj]])).toEqual([]);
        });
        it('undefined if there are no individuals in the ontology', function() {
            expect(service.getNoTypeIndividuals([[ontologyObj]])).toEqual([]);
        });
    });
    describe('hasClassIndividuals should return', function() {
        it('true if there are any entities with a type of the provided class in the ontology', function() {
            expect(service.hasClassIndividuals([[individualObj, ontologyObj, objectPropertyObj], [importedIndividualObj, importedOntObj, importedObjectPropertyObj]], classId)).toBeTrue();
        });
        it('true if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(service.hasClassIndividuals([[individualObj, ontologyObj, objectPropertyObj], [importedIndividualObj, importedOntObj, importedObjectPropertyObj]], importedClassId)).toBeTrue();
        });
        it('false if there are no entities with a type of the provided class in the ontology', function() {
            expect(service.hasClassIndividuals([[classObj, ontologyObj], [importedClassObj, importedOntObj]], classId)).toBeFalse();
        });
    });
    describe('getClassIndividuals should return', function() {
        it('correct object if there are any entities with a type of the provided class in the ontology', function() {
            expect(service.getClassIndividuals([[individualObj, ontologyObj, objectPropertyObj], [importedIndividualObj, importedOntObj, importedObjectPropertyObj]], classId)).toEqual([individualObj]);
        });
        it('correct object if there are any entities with a type of the provided class in the imported ontology', function() {
            expect(service.getClassIndividuals([[individualObj, ontologyObj, objectPropertyObj], [importedIndividualObj, importedOntObj, importedObjectPropertyObj]], importedClassId)).toEqual([importedIndividualObj]);
        });
        it('[] if there are no entities with a type of the provided class in the ontology', function() {
            expect(service.getClassIndividuals([[classObj, ontologyObj], [importedClassObj, importedOntObj]], classId)).toEqual([]);
        });
    });
    describe('isRestriction should return', function() {
        it('true if the entity contains the restriction type', function() {
            expect(service.isRestriction(restrictionObj)).toBeTrue();
        });
        it('false if the entity does not contain the restriction type', function() {
            expect(service.isRestriction(emptyObj)).toBeFalse();
        });
    });
    describe('getRestrictions should return', function() {
        it('correct restriction objects if there are any in the ontology', function() {
            expect(service.getRestrictions([[restrictionObj, ontologyObj], [importedRestrictionObj, importedOntObj]])).toEqual([restrictionObj, importedRestrictionObj]);
        });
        it('correct restriction objects if there are any in only the ontology', function() {
            expect(service.getRestrictions([[restrictionObj, ontologyObj], [importedOntObj]])).toEqual([restrictionObj]);
        });
        it('correct restriction objects if there are any in only the imported ontology', function() {
            expect(service.getRestrictions([[ontologyObj], [importedRestrictionObj, importedOntObj]])).toEqual([importedRestrictionObj]);
        });
        it('correct restriction objects if there are duplicates', function() {
            expect(service.getRestrictions([[restrictionObj, ontologyObj], [restrictionObj, importedOntObj]])).toEqual([restrictionObj]);
        });
        it('undefined if there are no restrictions in the ontology', function() {
            expect(service.getRestrictions([[ontologyObj], [importedOntObj]])).toEqual([]);
        });
    });
    describe('getBlankNodes should return', function() {
        it('correct blank node objects if there are any in the ontology', function() {
            expect(service.getBlankNodes([[blankNodeObj, ontologyObj]])).toEqual([blankNodeObj]);
        });
        it('correct blank node objects if there are duplicates', function() {
            expect(service.getBlankNodes([[blankNodeObj, ontologyObj], [blankNodeObj, importedOntObj]])).toEqual([blankNodeObj]);
        });
        it('undefined if there are no blank nodes in the ontology', function() {
            expect(service.getBlankNodes([[ontologyObj]])).toEqual([]);
        });
    });
    describe('getEntity returns', function() {
        it('object when present', function() {
            expect(service.getEntity([[classObj, ontologyObj]], classId)).toEqual(classObj);
        });
        it('undefined when not present', function() {
            expect(service.getEntity([], classId)).toBe(undefined);
        });
    });
    describe('getEntityName should return', function() {
        beforeEach(function () {
            this.entity = cloneDeep(emptyObj);
        });
        describe('returns the rdfs:label if present', function() {
            it('and in english', function() {
                this.entity[`${RDFS}label`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
            });
            it('and there is no english version', function() {
                this.entity[`${RDFS}label`] = [{ '@value': title }];
                expect(service.getEntityName(this.entity)).toEqual(title);
            });
        });
        describe('returns the dcterms:title if present and no rdfs:label', function() {
            it('and in english', function() {
                this.entity[`${DCTERMS}title`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
            });
            it('and there is no english version', function() {
                this.entity[`${DCTERMS}title`] = [{ '@value': title }];
                expect(service.getEntityName(this.entity)).toEqual(title);
            });
        });
        describe('returns the dc:title if present and no rdfs:label or dcterms:title', function() {
            it('and in english', function() {
                this.entity[`${DC}title`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
            });
            it('and there is no english version', function() {
                this.entity[`${DC}title`] = [{ '@value': title }];
                expect(service.getEntityName(this.entity)).toEqual(title);
            });
        });
        describe('returns skos:prefLabel if present and no rdfs:label, dcterms:title, or dc:title', function() {
            it('and in english', function() {
                this.entity[`${SKOS}prefLabel`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
            });
            it('and there is no english version', function() {
                this.entity[`${SKOS}prefLabel`] = [{ '@value': title }];
                expect(service.getEntityName(this.entity)).toEqual(title);
            });
        });
        describe('returns skos:altLabel if present and no rdfs:label, dcterms:title, or dc:title, or skos:prefLabel', function() {
            it('and in english', function() {
                this.entity[`${SKOS}altLabel`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
            });
            it('and there is no english version', function() {
                this.entity[`${SKOS}altLabel`] = [{ '@value': title }];
                expect(service.getEntityName(this.entity)).toEqual(title);
            });
        });
        describe('returns skosxl:literalForm if present and no rdfs:label, dcterms:title, or dc:title, skos:prefLabel or skos:altLabel', function() {
            it('and in english', function() {
                this.entity[`${SKOSXL}literalForm`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
                expect(service.getEntityName(this.entity)).toEqual('hello');
            });
            it('and there is no english version', function() {
                this.entity[`${SKOSXL}literalForm`] = [{ '@value': title }];
                expect(service.getEntityName(this.entity)).toEqual(title);
            });
        });
        it('returns the @id if present and nothing else', function() {
            this.entity['@id'] = 'http://test.com#ontology';
            expect(service.getEntityName(this.entity)).toEqual('Ontology');
        });
    });
    describe('getEntityDescription should return', function() {
        beforeEach(function() {
            this.entity = cloneDeep(emptyObj);
        });
        it('rdfs:comment if present', function() {
            this.entity[`${RDFS}comment`] = [{ '@value': description }];
            expect(service.getEntityDescription(this.entity)).toEqual(description);
        });
        it('dcterms:description if present and no rdfs:comment', function() {
            this.entity[`${DCTERMS}description`] = [{ '@value': description }];
            expect(service.getEntityDescription(this.entity)).toEqual(description);
        });
        it('dc:description if present and no rdfs:comment or dcterms:description', function() {
            this.entity[`${DC}description`] = [{ '@value': description }];
            expect(service.getEntityDescription(this.entity)).toEqual(description);
        });
        it('"" if no rdfs:comment, dcterms:description, or dc:description', function() {
            expect(service.getEntityDescription(this.entity)).toEqual('');
        });
    });
    describe('isConcept should return', function() {
        it('true if the entity contains the concept type', function() {
            expect(service.isConcept(conceptObj)).toEqual(true);
        });
        it('true if the entity contains a derived concept type', function() {
            expect(service.isConcept(derivedConceptObj, [derivedConceptType])).toEqual(true);
        });
        it('false if the entity does not contain the concept type', function() {
            expect(service.isConcept(emptyObj)).toEqual(false);
        });
    });
    describe('hasConcepts should return', function() {
        it('true if there are any concept entities in the ontology', function() {
            expect(service.hasConcepts([[conceptObj, ontologyObj], [importedConceptObj, importedOntObj]], [])).toBeTrue();
        });
        it('true if there are any concept entities in only the ontology', function() {
            expect(service.hasConcepts([[conceptObj, ontologyObj], [importedOntObj]], [])).toBeTrue();
        });
        it('true if there are any concept entities in only the imported ontology', function() {
            expect(service.hasConcepts([[ontologyObj], [importedConceptObj, importedOntObj]], [])).toBeTrue();
        });
        it('true if there are any derived concept entities in the ontology', function() {
            expect(service.hasConcepts([[derivedConceptObj]], [derivedConceptType])).toEqual(true);
        });
        it('false if there are not any concept entities in the ontology', function() {
            expect(service.hasConcepts([[ontologyObj], [importedOntObj]], [])).toBeFalse();
        });
    });
    describe('getConcepts should return', function() {
        it('correct concept objects if there are any in the ontology', function() {
            expect(service.getConcepts([[conceptObj, ontologyObj], [importedConceptObj, importedOntObj]], [])).toEqual([conceptObj, importedConceptObj]);
        });
        it('correct concept objects if there are any in only the ontology', function() {
            expect(service.getConcepts([[conceptObj, ontologyObj], [importedOntObj]], [])).toEqual([conceptObj]);
        });
        it('correct concept objects if there are any in only the imported ontology', function() {
            expect(service.getConcepts([[ontologyObj], [importedConceptObj, importedOntObj]], [])).toEqual([importedConceptObj]);
        });
        it('correct concept objects if there are any derived concepts', function() {
            expect(service.getConcepts([[derivedConceptObj]], [derivedConceptType])).toEqual([derivedConceptObj]);
        });
        it('correct concept objects if there are duplicates', function() {
            expect(service.getConcepts([[conceptObj, ontologyObj], [conceptObj, importedOntObj]], [])).toEqual([conceptObj]);
        });
        it('undefined if there are no concepts in the ontology', function() {
            expect(service.getConcepts([[ontologyObj], [importedOntObj]], [])).toEqual([]);
        });
    });
    describe('getConceptIRIs should return', function() {
        it('conceptId if there are concepts in the ontology', function() {
            expect(service.getConceptIRIs([[ontologyObj, conceptObj], [importedOntObj, importedConceptObj]], [])).toEqual([conceptId, importedConceptId]);
        });
        it('conceptId if there are concepts in only the ontology', function() {
            expect(service.getConceptIRIs([[ontologyObj, conceptObj], [importedOntObj]], [])).toEqual([conceptId]);
        });
        it('conceptId if there are concepts in only the imported ontology', function() {
            expect(service.getConceptIRIs([[ontologyObj], [importedOntObj, importedConceptObj]], [])).toEqual([importedConceptId]);
        });
        it('conceptId if there are derived concepts', function() {
            expect(service.getConceptIRIs([[derivedConceptObj]], [derivedConceptType])).toEqual([conceptId]);
        });
        it('[] if there are no concepts in the ontology', function() {
            expect(service.getConceptIRIs([[ontologyObj], [importedOntObj]], [])).toEqual([]);
        });
    });
    describe('isConceptScheme should return', function() {
        it('true if the entity contains the concept scheme type', function() {
            expect(service.isConceptScheme(schemeObj)).toBeTrue();
        });
        it('true if the entity contains a derived concept scheme type', function() {
            expect(service.isConceptScheme(derivedConceptSchemeObj, [derivedConceptSchemeType])).toEqual(true);
        });
        it('false if the entity does not contain the concept scheme type', function() {
            expect(service.isConceptScheme(emptyObj)).toBeFalse();
        });
    });
    describe('hasConceptSchemes should return', function() {
        it('true if there are any concept scheme entities in the ontology', function() {
            expect(service.hasConceptSchemes([[schemeObj, ontologyObj], [importedSchemeObj, importedOntObj]], [])).toBeTrue();
        });
        it('true if there are any concept scheme entities in only the ontology', function() {
            expect(service.hasConceptSchemes([[schemeObj, ontologyObj], [importedOntObj]], [])).toBeTrue();
        });
        it('true if there are any concept scheme entities in only the imported ontology', function() {
            expect(service.hasConceptSchemes([[ontologyObj], [importedSchemeObj, importedOntObj]], [])).toBeTrue();
        });
        it('true if there are any derived concept scheme entities in the ontology', function() {
            expect(service.hasConceptSchemes([[derivedConceptSchemeObj]], [derivedConceptSchemeType])).toEqual(true);
        });
        it('false if there are not any concept scheme entities in the ontology', function() {
            expect(service.hasConceptSchemes([[ontologyObj], [importedOntObj]], [])).toBeFalse();
        });
    });
    describe('getConceptSchemes should return', function() {
        it('correct concept scheme objects if there are any in the ontology', function() {
            expect(service.getConceptSchemes([[schemeObj, ontologyObj], [importedSchemeObj, importedOntObj]], [])).toEqual([schemeObj, importedSchemeObj]);
        });
        it('correct concept scheme objects if there are any in only the ontology', function() {
            expect(service.getConceptSchemes([[schemeObj, ontologyObj], [importedOntObj]], [])).toEqual([schemeObj]);
        });
        it('correct concept scheme objects if there are any in only the imported ontology', function() {
            expect(service.getConceptSchemes([[ontologyObj], [importedSchemeObj, importedOntObj]], [])).toEqual([importedSchemeObj]);
        });
        it('correct concept scheme objects if there are any derived concept schemes', function() {
            expect(service.getConceptSchemes([[derivedConceptSchemeObj]], [derivedConceptSchemeType])).toEqual([derivedConceptSchemeObj]);
        });
        it('correct concept schemes if there are duplicates', function() {
            expect(service.getConceptSchemes([[schemeObj, ontologyObj], [schemeObj, importedOntObj]], [])).toEqual([schemeObj]);
        });
        it('undefined if there are no concept schemes in the ontology', function() {
            expect(service.getConceptSchemes([[ontologyObj], [importedOntObj]], [])).toEqual([]);
        });
    });
    describe('getConceptSchemeIRIs should return', function() {
        it('schemeId if there are concept schemes in the ontology', function() {
            expect(service.getConceptSchemeIRIs([[ontologyObj, schemeObj], [importedOntObj, importedSchemeObj]], [])).toEqual([schemeId, importedSchemeId]);
        });
        it('schemeId if there are concept schemes in only the ontology', function() {
            expect(service.getConceptSchemeIRIs([[ontologyObj, schemeObj], [importedOntObj]], [])).toEqual([schemeId]);
        });
        it('schemeId if there are concept schemes in only the imported ontology', function() {
            expect(service.getConceptSchemeIRIs([[ontologyObj], [importedOntObj, importedSchemeObj]], [])).toEqual([importedSchemeId]);
        });
        it('schemeId if there are derived concepts', function() {
            expect(service.getConceptSchemeIRIs([[derivedConceptSchemeObj]], [derivedConceptSchemeType])).toEqual([schemeId]);
        });
        it('schemeId if there are duplicates', function() {
            expect(service.getConceptSchemeIRIs([[ontologyObj, schemeObj], [importedOntObj, schemeObj]], [])).toEqual([schemeId]);
        });
        it('[] if there are no concept schemes in the ontology', function() {
            expect(service.getConceptSchemeIRIs([[ontologyObj], [importedOntObj]], [])).toEqual([]);
        });
    });
    describe('uploadChangesFile hits the proper endpoint', function() {
        it('with recordId, branchId and commitId', function() {
            service.uploadChangesFile(file, recordId, branchId, commitId)
                .subscribe(() => {
                    expect(true).toBeTrue();
                }, () => {
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
                .subscribe(() => {
                    expect(true).toBeTrue();
                }, () => {
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

            request.flush('', { status: 400, statusText: errorObject.errorMessage });
        });
    });
});
